/* Volle sessie teen die bediener SOOS DIT VANDAG IS (wallie_ingest, geen v2 nie):
   begin vanaf ’n rooster-blok → hartklop elke 60 s → tab weg → einde → survey → stills. */
const { test, expect } = require("@playwright/test");
const { MockBackend } = require("./mock-backend");
const { boot, syncLabel, runUntil, hideTab, showTab, queue, shot, expectNoLeaks, T0 } = require("./helpers");

test("volle sessie: elke gebeurtenis bereik Supabase met die presiese payload", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v1" });
  await mock.attach(context);
  await boot(page);
  await page.goto("/#missie");

  await expect(page.locator("#sync-pill")).toBeVisible();
  await runUntil(page, async () => (await syncLabel(page)) === "Gesinkroniseer", { label: "aanwyser groen by begin" });

  /* Begin vanaf die eerste rooster-blok met ’n Begin-knoppie */
  const btn = page.locator(".start-block").first();
  const blockId = await btn.getAttribute("data-block");
  const slug = await btn.getAttribute("data-slug");
  const minutes = Number(await btn.getAttribute("data-min"));
  const task = decodeURIComponent(await btn.getAttribute("data-title"));
  expect(blockId).toBeTruthy();
  const block = await page.evaluate((id) => WALLIE.app.state().blocks.find((b) => b.id === id), blockId);
  const subject = await page.evaluate((s) => WALLIE.SUBJECTS.find((x) => x.slug === s).naam, slug);
  await btn.click();

  await runUntil(page, async () => mock.byKind("start").length === 1, { label: "start afgelewer" });
  const start = mock.byKind("start")[0];
  const sid = start.body.p.session_id;
  expect(sid).toMatch(/^s_\d+$/);
  const startedAt = Number(sid.slice(2));
  /* v2 is eers geprobeer (404), toe terugval na wallie_ingest */
  expect(mock.calls.find((c) => c.name === "wallie_ingest_v2")?.body.p.event_id).toBe(`start:${sid}`);
  expect(start.name).toBe("wallie_ingest");
  const deviceId = start.body.p.device_id;
  expect(deviceId).toMatch(/^d_/);
  expect(start.body).toEqual({
    p: {
      kind: "start",
      event_id: `start:${sid}`,
      session_id: sid,
      subject,
      subject_slug: slug,
      task,
      status: "active",
      warnings: 0,
      total_warnings: 0,
      locks: 0,
      left_ms: minutes * 60000,
      planned_min: minutes,
      started_at: startedAt,
      block_id: blockId,
      block: { id: blockId, title: block.title, start: block.start ?? null, end: block.end ?? null, minutes: block.minutes, kind: block.kind },
      visible: true,
      focused: expect.any(Boolean),
      idle: false,
      visible_ms: expect.any(Number),
      focused_ms: expect.any(Number),
      hidden_ms: 0,
      idle_ms: 0,
      last_input_at: expect.any(Number),
      client_at: startedAt,
      title: "IN SESSIE — begin",
      body: expect.stringContaining(`${subject} · ${minutes}m`),
      device_id: deviceId,
      app_version: "2026-10-09-sync1",
      backfill: false,
      data: { value: null, _event_id: `start:${sid}` }
    }
  });
  expect(mock.ntfy.map((n) => n.title)).toContain("IN SESSIE — begin");

  /* Hartklop elke 60 s */
  await runUntil(page, async () => mock.byKind("heartbeat").length >= 2, { label: "2 hartkloppe" });
  const hbs = mock.byKind("heartbeat").map((c) => c.body.p);
  expect(hbs[0].event_id).toBe(`hb:${sid}:1`);
  expect(hbs[1].event_id).toBe(`hb:${sid}:2`);
  expect(hbs[1].client_at - hbs[0].client_at).toBeGreaterThanOrEqual(59000);
  expect(hbs[1].client_at - hbs[0].client_at).toBeLessThanOrEqual(61000);
  expect(hbs[1]).toMatchObject({ kind: "heartbeat", session_id: sid, status: "active", visible: true, seq: 2, subject, block_id: blockId });

  /* Tab weg vir 20 s: waarskuwing (bestaande soort) + sigbaarheid-gebeurtenis (wag vir v2) */
  await hideTab(page);
  await page.clock.runFor(20000);
  await showTab(page);
  await runUntil(page, async () => mock.byKind("warn").length === 1, { label: "waarskuwing afgelewer" });
  expect(mock.byKind("warn")[0].body.p).toMatchObject({
    kind: "warn",
    event_id: `warn:${sid}:1`,
    session_id: sid,
    status: "warned",
    warnings: 1,
    total_warnings: 1,
    reason: "Tab weg / geminimiseer",
    title: "WAARSKUWING 1/3"
  });
  const hidden = mock.byKind("heartbeat").map((c) => c.body.p).find((p) => p.visible === false);
  expect(hidden, "hartklop tydens tab-weg wys visible:false").toBeTruthy();
  const parked = (await queue(page)).filter((q) => q.kind === "visibility");
  expect(parked.length).toBeGreaterThanOrEqual(2);
  expect(parked.every((q) => q.state === "parked")).toBe(true);

  /* Nog ’n minuut, dan Eindig */
  await page.clock.runFor(60000);
  await page.locator("#end-session").click();
  await runUntil(page, async () => mock.byKind("end").length === 1, { label: "einde afgelewer" });
  const end = mock.byKind("end")[0].body.p;
  const endedAt = end.ended_at;
  expect(end).toMatchObject({
    kind: "end",
    event_id: `end:${sid}`,
    session_id: sid,
    subject,
    subject_slug: slug,
    status: "off",
    outcome: "handmatig",
    planned_min: minutes,
    started_at: startedAt,
    client_at: endedAt,
    block_id: blockId,
    warnings: 1,
    total_warnings: 1,
    locks: 0,
    locked_ms: 0,
    title: "SESSIE-VERSLAG"
  });
  expect(end.actual_ms).toBe(endedAt - startedAt);
  expect(end.actual_ms).toBeGreaterThan(140000);
  expect(end.duration_min).toBe(Math.round(end.actual_ms / 60000));
  expect(end.hidden_ms).toBeGreaterThanOrEqual(19000);
  expect(end.visible_ms + end.hidden_ms).toBeGreaterThanOrEqual(end.actual_ms - 1000);
  expect(end.body).toContain(`Blok: ${block.title}`);
  expect(end.body).toMatch(/tab weg: 0m|tab weg: 1m/);
  expect(end.data._event_id).toBe(`end:${sid}`);

  /* Survey ná die sessie */
  await expect(page.locator("#wallie-survey-modal")).toBeVisible();
  await page.locator('[data-scale="wallie-fokus"][data-val="4"]').click();
  await page.locator('input[name="metode"][value="ja"]').check();
  await page.locator('input[name="moeilikheid"][value="reg"]').check();
  await page.locator('input[name="blokkade"][value="moeg"]').check();
  await page.locator('input[name="eerlikheid"][value="meeste"]').check();
  await page.locator('textarea[name="help_more"]').fill("Meer ou vraestelle asseblief — en ’n kort breek.");
  await page.locator("#wallie-survey-save").click();
  await runUntil(page, async () => mock.byKind("survey").length === 1, { label: "survey afgelewer" });
  const sv = mock.byKind("survey")[0].body.p;
  expect(sv.event_id).toMatch(/^survey:ws_\d+$/);
  expect(sv).toMatchObject({ kind: "survey", session_id: sid, subject, subject_slug: slug, title: "SURVEY — Wallie ná sessie" });
  expect(sv.data).toMatchObject({
    sessionId: sid,
    subjectSlug: slug,
    answers: { fokus: "4", metode: "ja", moeilikheid: "reg", blokkade: "moeg", eerlikheid: "meeste", help_more: "Meer ou vraestelle asseblief — en ’n kort breek." }
  });
  expect(sv.body).toBe(
    [`Vak: ${subject}`, "Fokus: 4/5", "Metode: ja", "Blokkade: moeg", "Eerlikheid: meeste", "Help: Meer ou vraestelle asseblief — en ’n kort breek.", "moeilikheid: reg"].join("\n")
  );

  /* Kamera-stills (toestemming gegee) */
  expect(mock.stills.length).toBeGreaterThanOrEqual(1);
  expect(mock.stills[0].p_session_id).toBe(sid);
  expect(mock.stills[0].p_jpeg_b64.length).toBeGreaterThan(100);

  /* Elke gebeurtenis presies een keer afgelewer */
  const ids = mock.deliveredIds();
  expect(new Set(ids).size).toBe(ids.length);

  await runUntil(page, async () => (await syncLabel(page)) === "Gesinkroniseer", { label: "groen ná einde" });
  await page.locator("#sync-pill").screenshot({ path: shot("01-aanwyser-gesinkroniseer.png") });
  await page.screenshot({ path: shot("02-sessie-klaar-gesinkroniseer.png") });
  expectNoLeaks(mock);
});

test("probleem-rapport en kamera-fout bereik Pa", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v1" });
  await mock.attach(context);
  await boot(page);
  await page.goto("/#probleem");
  await page.locator('input[name="bugTipe"]').first().check();
  await page.locator("#bug-severity").selectOption("blokkeer");
  await page.locator("#bug-detail").fill("Kamera wys swart skerm ná Begin.");
  await page.locator("#bug-code").fill("NotReadableError");
  page.on("dialog", (d) => d.dismiss());
  await page.locator('#bug-form button[type="submit"]').click();
  await runUntil(page, async () => mock.byKind("probleem").length === 1, { label: "probleem afgelewer" });
  const p = mock.byKind("probleem")[0].body.p;
  expect(p.event_id).toMatch(/^probleem:bug_\d+$/);
  expect(p).toMatchObject({ kind: "probleem", title: "PROBLEEM — blokkeer" });
  expect(p.body).toContain("Kamera wys swart skerm ná Begin.");
  expect(p.body).toContain("Kode: NotReadableError");
  expect(p.data).toMatchObject({ severity: "blokkeer", detail: "Kamera wys swart skerm ná Begin.", code: "NotReadableError" });

  /* Kamera geweier → Pa kry ’n outomatiese probleem-gebeurtenis */
  await page.evaluate(() => {
    navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException("denied", "NotAllowedError"));
  });
  await page.evaluate(() => WALLIE.app.startSession({ subjectSlug: "rtt", minutes: 30, task: "toets" }));
  await runUntil(page, async () => mock.byKind("probleem").length === 2, { label: "kamera-fout afgelewer" });
  const cam = mock.byKind("probleem")[1].body.p;
  expect(cam).toMatchObject({ kind: "probleem", title: "SESSIE KON NIE BEGIN NIE", planned_min: 30, subject_slug: "rtt" });
  expect(cam.body).toContain("Kamera geweier");
  expectNoLeaks(mock);
});

test("blok klaar gemerk: gaan via v2 sodra dit bestaan", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v2" });
  await mock.attach(context);
  await boot(page);
  await page.goto("/#missie");
  const done = page.locator(".mark-done").first();
  const blockId = await done.getAttribute("data-id");
  await done.click();
  await runUntil(page, async () => mock.byKind("block").length === 1, { label: "blok afgelewer" });
  const b = mock.byKind("block")[0];
  expect(b.name).toBe("wallie_ingest_v2");
  expect(b.body.p).toMatchObject({ kind: "block", event_id: `block:${blockId}`, block_id: blockId, title: "BLOK KLAAR GEMERK" });
  expect(b.body.p.client_at).toBeGreaterThanOrEqual(T0.getTime());
  expect(await page.evaluate((id) => typeof WALLIE.app.state().completedBlocks[id], blockId)).toBe("number");
  expectNoLeaks(mock);
});
