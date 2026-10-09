/* Vanlyn-periode + herstel: tou in localStorage, backoff, rooi aanwyser, ntfy-waarskuwing ná 10 min,
   niks verlore nie, niks dubbel nie. */
const { test, expect } = require("@playwright/test");
const { MockBackend } = require("./mock-backend");
const { boot, syncLabel, runUntil, queue, shot, expectNoLeaks } = require("./helpers");

test("vanlyn → tou + rooi aanwyser + Pa-waarskuwing → herstel sonder verlies of duplikate", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v1" });
  await mock.attach(context);
  await boot(page);
  await page.goto("/#missie");
  await page.evaluate(() => WALLIE.app.startSession({ subjectSlug: "rtt", minutes: 45, task: "Sigblad-funksies" }));
  await runUntil(page, async () => mock.byKind("start").length === 1, { label: "start aanlyn" });
  const sid = mock.byKind("start")[0].body.p.session_id;

  /* 1. Heeltemal vanlyn (ook ntfy) vir 5 min */
  mock.mode = "offline";
  const attemptsBefore = mock.ingests().length;
  await page.clock.runFor(2 * 60 * 1000);
  await runUntil(page, async () => (await syncLabel(page)).startsWith("Nie gesinkroniseer nie"), { label: "rooi aanwyser" });
  await page.clock.runFor(3 * 60 * 1000);
  const attempts5min = mock.ingests().length - attemptsBefore;
  /* Backoff: nie elke 20 s ’n storm van herhalings nie */
  expect(attempts5min).toBeGreaterThan(0);
  expect(attempts5min).toBeLessThan(25);
  let q = await queue(page);
  /* Ou bediener (v1) stoor nie hartkloppe nie en ’n ou een sou ’n klaar sessie lewendig laat lyk:
     net die jongste (< 2 min) bly in die tou */
  const pageNow = await page.evaluate(() => Date.now());
  const hbQ = q.filter((i) => i.kind === "heartbeat");
  expect(hbQ.length).toBeGreaterThanOrEqual(1);
  expect(hbQ.every((i) => pageNow - i.payload.client_at <= 2 * 60 * 1000 + 25000)).toBe(true);
  expect(q.every((i) => i.tries >= 0)).toBe(true);
  expect(await syncLabel(page)).toMatch(/^Nie gesinkroniseer nie \(\d+ wag\)$/);
  await page.locator("#sync-pill").screenshot({ path: shot("03-aanwyser-nie-gesinkroniseer-nie.png") });
  await page.screenshot({ path: shot("04-vanlyn-sessie.png") });
  expect(mock.ntfy.filter((n) => n.title?.startsWith("SINK-PROBLEEM"))).toHaveLength(0);

  /* 2. Internet terug, maar Supabase gee 503 → ná 10 min kry Pa ’n ntfy-waarskuwing (een keer) */
  mock.mode = "down";
  await runUntil(page, async () => mock.ntfy.some((n) => n.title?.startsWith("SINK-PROBLEEM")), {
    step: 20000,
    max: 8 * 60 * 1000,
    label: "SINK-PROBLEEM ntfy"
  });
  const alert = mock.ntfy.find((n) => n.title?.startsWith("SINK-PROBLEEM"));
  expect(alert.priority).toBe("4");
  expect(alert.body).toMatch(/kon vir (1\d|9) min/);
  expect(alert.body).toContain("gaan nie verlore nie");
  await page.clock.runFor(3 * 60 * 1000);
  expect(mock.ntfy.filter((n) => n.title?.startsWith("SINK-PROBLEEM"))).toHaveLength(1);

  /* 3. Sessie eindig en survey word ingevul terwyl dit steeds nie sinkroniseer nie */
  await page.locator("#end-session").click();
  await page.locator('[data-scale="wallie-fokus"][data-val="3"]').click();
  for (const [n, v] of [["metode", "gedeeltelik"], ["moeilikheid", "te_swaar"], ["blokkade", "verward"], ["eerlikheid", "100"]]) {
    await page.locator(`input[name="${n}"][value="${v}"]`).check();
  }
  await page.locator('textarea[name="help_more"]').fill("VLOOKUP verstaan ek nog nie.");
  await page.locator("#wallie-survey-save").click();
  q = await queue(page);
  const waiting = q.filter((i) => i.kind !== "heartbeat" && i.state !== "parked").map((i) => i.id);
  expect(waiting).toEqual(expect.arrayContaining([`end:${sid}`]));
  expect(waiting.some((id) => id.startsWith("survey:ws_"))).toBe(true);
  expect(mock.byKind("end")).toHaveLength(0);

  /* 4. Herstel */
  mock.mode = "v1";
  const recoverIdx = mock.calls.length;
  const pageNowAtRecovery = await page.evaluate(() => Date.now());
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await runUntil(page, async () => (await syncLabel(page)) === "Gesinkroniseer", { label: "groen ná herstel" });
  const delivered = mock.deliveredIds();
  for (const id of waiting) expect(delivered, `${id} afgelewer`).toContain(id);
  expect(new Set(delivered).size).toBe(delivered.length);
  const end = mock.byKind("end")[0].body.p;
  expect(end.outcome).toBe("handmatig");
  expect(end.client_at).toBeLessThanOrEqual(pageNowAtRecovery);
  const sv = mock.byKind("survey")[0].body.p;
  expect(sv.data.answers.help_more).toBe("VLOOKUP verstaan ek nog nie.");
  /* Volgorde: einde vóór survey (op toestel-tyd) */
  expect(delivered.indexOf(`end:${sid}`)).toBeLessThan(delivered.indexOf(sv.event_id));
  /* Ou hartkloppe is nie na die ou bediener gestuur nie (sou ’n klaar sessie lewendig laat lyk) */
  const lateHb = mock
    .delivered()
    .filter((c) => mock.calls.indexOf(c) >= recoverIdx && c.body.p.kind === "heartbeat")
    .filter((c) => pageNowAtRecovery - c.body.p.client_at > 2 * 60 * 1000);
  expect(lateHb).toHaveLength(0);

  await runUntil(page, async () => mock.ntfy.some((n) => n.title === "SINK HERSTEL"), { label: "SINK HERSTEL ntfy" });
  expect(mock.ntfy.find((n) => n.title === "SINK HERSTEL").body).toMatch(/Gaping: \d+ min sonder sinkronisering/);
  await page.locator("#sync-pill").screenshot({ path: shot("05-aanwyser-herstel.png") });
  expectNoLeaks(mock);
});
