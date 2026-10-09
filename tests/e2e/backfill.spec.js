/* Historiese terugvul: die toestel het weke se data in wallie911_v2_bok (ou + nuwe weergawe deel die sleutel)
   wat nooit die bediener bereik het nie. Eerste laai ná ontplooiing moet alles oplaai, presies een keer. */
const { test, expect } = require("@playwright/test");
const { MockBackend } = require("./mock-backend");
const { boot, syncLabel, runUntil, queue, shot, expectNoLeaks } = require("./helpers");

const at = (iso) => Date.parse(iso);

/* Ou weergawe (vóór 8 Okt): id = einde-tyd, geen "locks" nie */
const OLD1_END = at("2026-09-27T10:30:00+02:00");
const OLD2_END = at("2026-10-05T15:40:00+02:00");
/* Nuwe weergawe (ná 8 Okt 19:51): id = begin-tyd, het "locks" */
const NEW_START = at("2026-10-08T21:00:00+02:00");
const LEGACY_START = at("2026-10-08T20:10:00+02:00");
const INTERRUPTED_START = at("2026-10-09T07:30:00+02:00");
const INTERRUPTED_LAST = at("2026-10-09T08:12:00+02:00");

const STATE = {
  pin: "9110",
  planDate: "2026-10-08",
  blocks: [],
  completedBlocks: { "2026-09-28-kickoff": true },
  checklist: {},
  faults: [],
  papers: [],
  sessions: [
    { id: `s_${NEW_START}`, date: "2026-10-08", subjectSlug: "engels", task: "Opstel", durationMin: 40, warnings: 0, locks: 0, memoMin: 5, outcome: "tyd_klaar" },
    { id: `s_${LEGACY_START}`, date: "2026-10-08", subjectSlug: "toerisme", task: "Wisselkoers", durationMin: 30, warnings: 2, locks: 0, memoMin: 0, outcome: "handmatig" },
    { id: `s_${OLD2_END}`, date: "2026-10-05", subjectSlug: "wiskgelett", task: "Rente", durationMin: 45, warnings: 0, outcome: "tyd_klaar" },
    { id: `s_${OLD1_END}`, date: "2026-09-27", subjectSlug: "rtt", task: "Teorie", durationMin: 60, warnings: 1, outcome: "tyd_klaar" }
  ],
  wallieSurveys: [
    { id: `ws_${NEW_START + 41 * 60000}`, sessionId: `s_${NEW_START}`, subjectSlug: "engels", date: "2026-10-08", at: NEW_START + 41 * 60000, answers: { fokus: "5", metode: "ja", help_more: "Goed" } },
    {
      id: `ws_${OLD1_END + 60000}`,
      sessionId: `s_${OLD1_END}`,
      subjectSlug: "rtt",
      date: "2026-09-27",
      at: OLD1_END + 60000,
      answers: { fokus: "2", metode: "nee", moeilikheid: "te_swaar", blokkade: "verward", eerlikheid: "half", help_more: "Ek verstaan nie netwerke nie, Pa." }
    }
  ],
  paSurveys: [{ id: `ps_${OLD2_END + 3600000}`, sessionId: `s_${OLD2_END}`, date: "2026-10-05", at: OLD2_END + 3600000, answers: { teenwoordig: "ja", nota: "Was by sy lessenaar" } }],
  bugReports: [
    { id: `bug_${OLD1_END - 7200000}`, date: "2026-09-27", at: OLD1_END - 7200000, tipe: "kamera", severity: "blokkeer", subjectSlug: "", detail: "Kamera wil nie aan nie", code: "NotAllowedError" }
  ],
  pendingSurveySessionId: null,
  live: {
    status: "active",
    sessionId: `s_${INTERRUPTED_START}`,
    subject: "gasvryheid",
    task: "HACCP",
    minutes: 60,
    warnings: 1,
    totalWarnings: 1,
    locks: 0,
    lockedMs: 0,
    startedAt: INTERRUPTED_START,
    lastBeatAt: INTERRUPTED_LAST
  }
};

/* Die vorige (8 Okt) weergawe se uitboks het nog een sessie-einde gehad wat nooit deurgekom het nie */
const LEGACY_OUTBOX = {
  queue: [
    {
      id: `end_${LEGACY_START + 1800000}_ab12c`,
      createdAt: LEGACY_START + 1800000,
      tries: 7,
      nextTryAt: 0,
      payload: {
        session_id: `s_${LEGACY_START}`,
        subject: "Toerisme",
        status: "off",
        kind: "end",
        title: "SESSIE-VERSLAG",
        body: "Vak: Toerisme\nDuur: 30m",
        data: { sessionId: `s_${LEGACY_START}`, durationMin: 30, outcome: "handmatig" },
        client_at: LEGACY_START + 1800000
      }
    }
  ],
  sentCount: 0,
  lastError: "Failed to fetch"
};

test("terugvul: alle historiese log-inskrywings, een keer elk, ou bediener nou + v2 later", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v1" });
  await mock.attach(context);
  await boot(page, { seed: { wallie911_v2_bok: STATE, wallie911_outbox_v1: LEGACY_OUTBOX } });
  await page.goto("/#missie");

  const sendNow = [
    `end:s_${OLD1_END}`,
    `end:s_${OLD2_END}`,
    `end:s_${LEGACY_START}`,
    `end:s_${INTERRUPTED_START}`,
    `survey:ws_${OLD1_END + 60000}`,
    `pa-survey:ps_${OLD2_END + 3600000}`,
    `probleem:bug_${OLD1_END - 7200000}`
  ];
  /* Ná 8 Okt 19:51 kon dit reeds via wallie_ingest gekom het (v1 kan nie ontdubbel nie), en "block" ken v1 nie */
  const waitForV2 = [`end:s_${NEW_START}`, `survey:ws_${NEW_START + 41 * 60000}`, "block:2026-09-28-kickoff"];

  await runUntil(page, async () => sendNow.every((id) => mock.deliveredIds().includes(id)), { label: "terugvul na v1" });
  await runUntil(page, async () => (await syncLabel(page)) === "Gesinkroniseer", { label: "groen ná terugvul" });
  for (const id of waitForV2) expect(mock.deliveredIds()).not.toContain(id);
  const q = await queue(page);
  expect(q.filter((i) => i.state === "parked" && i.kind !== "plan").map((i) => i.id).sort()).toEqual([...waitForV2].sort());
  /* Rooster (22 dae) wag ook vir migrations/002, maar tel nie vir Wallie se aanwyser nie */
  expect(q.filter((i) => i.kind === "plan" && i.state === "parked")).toHaveLength(22);
  expect(await page.locator("#sync-pill").getAttribute("title")).toContain("3 wag vir Pa se bediener-opgradering");

  /* Presiese payload van die oudste sessie (ou formaat: id = einde-tyd) */
  const old1 = mock.delivered().find((c) => c.body.p.event_id === `end:s_${OLD1_END}`);
  expect(old1.name).toBe("wallie_ingest");
  expect(old1.body.p).toEqual({
    kind: "end",
    event_id: `end:s_${OLD1_END}`,
    session_id: `s_${OLD1_END}`,
    subject: "RTT (CAT)",
    subject_slug: "rtt",
    task: "Teorie",
    status: "off",
    outcome: "tyd_klaar",
    warnings: 1,
    total_warnings: 1,
    locks: 0,
    planned_min: null,
    duration_min: 60,
    started_at: OLD1_END - 60 * 60000,
    ended_at: OLD1_END,
    block_id: null,
    client_at: OLD1_END,
    title: "SESSIE-VERSLAG (teruggevul)",
    body: expect.stringContaining("Datum: 2026-09-27"),
    device_id: expect.stringMatching(/^d_/),
    app_version: "2026-10-09-sync1",
    backfill: true,
    data: { ...STATE.sessions[3], backfill: true, _event_id: `end:s_${OLD1_END}` }
  });

  /* Survey woordeliks */
  const sv = mock.delivered().find((c) => c.body.p.event_id === `survey:ws_${OLD1_END + 60000}`).body.p;
  expect(sv.body).toContain("Help: Ek verstaan nie netwerke nie, Pa.");
  expect(sv.body).toContain("moeilikheid: te_swaar");
  expect(sv.data.answers).toEqual(STATE.wallieSurveys[1].answers);
  expect(sv.client_at).toBe(OLD1_END + 60000);

  /* Onderbreekte sessie: eerlike einde met die minute tot die laaste lewensteken */
  const intr = mock.delivered().find((c) => c.body.p.event_id === `end:s_${INTERRUPTED_START}`).body.p;
  expect(intr).toMatchObject({
    kind: "end",
    outcome: "onderbreek",
    started_at: INTERRUPTED_START,
    ended_at: INTERRUPTED_LAST,
    duration_min: 42,
    actual_ms: 42 * 60000,
    subject_slug: "gasvryheid",
    title: "ONDERBREEK — sessie nie klaargemaak nie"
  });

  /* Ou uitboks oorgedra: sy oorspronklike payload, nou met ’n vaste event_id */
  const legacy = mock.delivered().find((c) => c.body.p.event_id === `end:s_${LEGACY_START}`).body.p;
  expect(legacy).toMatchObject({ kind: "end", session_id: `s_${LEGACY_START}`, title: "SESSIE-VERSLAG", backfill: false });
  expect(await page.evaluate(() => localStorage.getItem("wallie911_outbox_v1"))).toBeNull();

  /* Herlaai: niks word weer gestuur nie */
  const before = mock.delivered().length;
  await page.reload();
  await page.clock.runFor(60000);
  expect(mock.delivered().length).toBe(before);

  await page.screenshot({ path: shot("06-terugvul-ou-bediener.png") });

  /* Hanno pas migrations/001 toe → ná die herkontrole (30 min) gaan die geparkeerde items via v2 */
  mock.mode = "v2";
  await runUntil(page, async () => waitForV2.every((id) => mock.deliveredIds().includes(id)), {
    step: 60000,
    max: 40 * 60 * 1000,
    label: "geparkeer → v2"
  });
  for (const id of waitForV2) {
    const c = mock.delivered().find((x) => x.body.p.event_id === id);
    expect(c.name).toBe("wallie_ingest_v2");
  }
  const blk = mock.delivered().find((x) => x.body.p.event_id === "block:2026-09-28-kickoff").body.p;
  expect(blk).toMatchObject({ kind: "block", block_id: "2026-09-28-kickoff", backfill: true });

  await runUntil(page, async () => mock.plans.length === 22, { step: 60000, max: 40 * 60 * 1000, label: "rooster ná 002" });
  expect(new Set(mock.plans.map((p) => p.day)).size).toBe(22);
  expect(mock.plans[0].blocks[0]).toMatchObject({ id: expect.stringMatching(/^\d{4}-\d{2}-\d{2}-/), subject: expect.any(String), minutes: expect.any(Number) });
  const ids = mock.deliveredIds().filter((id) => !id.startsWith("hb:"));
  expect(new Set(ids).size, "elke historiese inskrywing presies een keer").toBe(ids.length);
  expect(ids.sort()).toEqual([...sendNow, ...waitForV2].sort());
  await runUntil(page, async () => (await syncLabel(page)) === "Gesinkroniseer", { label: "groen" });
  expect(await page.locator("#sync-pill").getAttribute("title")).not.toContain("bediener-opgradering");
  expectNoLeaks(mock);
});

test("terugvul op ’n v2-bediener: alles dadelik, ook ná 8 Okt", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v2" });
  await mock.attach(context);
  await boot(page, { seed: { wallie911_v2_bok: { ...STATE, live: { status: "off" } } } });
  await page.goto("/#missie");
  const expected = [
    `end:s_${OLD1_END}`,
    `end:s_${OLD2_END}`,
    `end:s_${LEGACY_START}`,
    `end:s_${NEW_START}`,
    `survey:ws_${OLD1_END + 60000}`,
    `survey:ws_${NEW_START + 41 * 60000}`,
    `pa-survey:ps_${OLD2_END + 3600000}`,
    `probleem:bug_${OLD1_END - 7200000}`,
    "block:2026-09-28-kickoff"
  ];
  await runUntil(page, async () => expected.every((id) => mock.deliveredIds().includes(id)), { label: "alles via v2" });
  expect(mock.delivered().every((c) => c.name === "wallie_ingest_v2")).toBe(true);
  /* Oudste eerste (toestel-tyd) */
  const order = mock.deliveredIds();
  expect(order.indexOf(`probleem:bug_${OLD1_END - 7200000}`)).toBeLessThan(order.indexOf(`end:s_${OLD2_END}`));
  await runUntil(page, async () => (await syncLabel(page)) === "Gesinkroniseer", { label: "groen" });
  expect((await queue(page)).length).toBe(0);
  expectNoLeaks(mock);
});
