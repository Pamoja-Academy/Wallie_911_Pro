/* Fase 1 — totale regressie (stap 7): geen dataverlies, geen payload-veranderinge.
   Een konteks: saad van ALLE bestaande sleutels (struktuur uit sync.js/storage.js/remote.js, nie Wallie se data nie),
   insluitend ’n nie-leë vanlyn-tou → oefenvrae (3 items, pogings) → praktiese blok (2× minimiseer) → normale sessie
   (begin → hartklop → waarskuwing → einde). Kontrole: dieselfde saad, dieselfde klok-stappe en dieselfde normale sessie,
   SONDER oefenvrae/praktiese blok.

   Normalisering (dieselfde as praktiese-modus.spec.js toets 7): net in die sinkronisering se boekhou-sleutels
   (wallie911_sync_v2, wallie911_synced_ids_v1, wallie911_sync_lock) word 13-syfer-tydstempels ≥ T0 vervang met "<t>",
   omdat die ack-tyd ±1 klok-stap tussen ENIGE twee lopies wissel (asinchrone mock-antwoord). Alle ander sleutels byte-vir-byte.

   Bediener = mode "v1" (soos die lewendige bediener vandag). Die gesaaide tou se eerste item doen die v2-toets
   (wallie_ingest_v2 → 404) met die payload ONVERANDERD; daarna gaan alles via wallie_ingest met die bestaande
   v1-omhulsel (sync.js v1Payload: data._event_id). Omdat die v2-toets reeds deur die tou beantwoord is (v2RecheckMs = 30 min),
   probeer die sessie se `start` nie weer v2 nie — dis master se gedrag; daardie een basislyn-inskrywing word uitgesluit. */
const fs = require("fs");
const path = require("path");
const { test, expect } = require("@playwright/test");
const { MockBackend } = require("./mock-backend");
const { boot, hideTab, showTab, expectNoLeaks, T0 } = require("./helpers");

const FIXTURE = path.join(__dirname, "..", "fixtures", "sync-payload-baseline.json");
const VB_KEY = "wallie911_vraebank_v1";
const SYNC_BOOKKEEPING = ["wallie911_sync_v2", "wallie911_synced_ids_v1", "wallie911_sync_lock"];

/* Dieselfde vorm-funksies as sync-payload-baseline.spec.js */
function shape(v) {
  if (v === null) return "null";
  if (Array.isArray(v)) {
    const els = [...new Set(v.map((x) => JSON.stringify(shape(x))))].sort().map((s) => JSON.parse(s));
    return { array: els };
  }
  if (typeof v === "object") {
    const out = {};
    Object.keys(v)
      .sort()
      .forEach((k) => (out[k] = shape(v[k])));
    return out;
  }
  return typeof v;
}
function entriesOf(calls, ntfy) {
  const seen = new Set();
  const out = [];
  const add = (entry) => {
    const key = JSON.stringify(entry);
    if (seen.has(key)) return;
    seen.add(key);
    out.push(entry);
  };
  calls.forEach((c) => add({ channel: `rpc:${c.name}`, kind: c.body && c.body.p ? c.body.p.kind ?? null : null, shape: shape(c.body) }));
  ntfy.forEach((n) => add({ channel: "ntfy", kind: null, shape: shape(n) }));
  return out;
}
const sorted = (entries) => entries.map((e) => JSON.stringify(e)).sort();

/* ---------- saad: ALLE bestaande sleutels ---------- */
const DEVICE = "d_seedtoestel01";
const OLD = 1791446400000; /* 8 Okt 2026, vóór T0 */
function qItem(id, kind, extra, at) {
  return {
    id,
    kind,
    payload: { kind, ...extra, event_id: id, client_at: at, device_id: DEVICE, app_version: "2026-10-08-sync0", backfill: false },
    backfill: false,
    entityAt: at,
    createdAt: at,
    tries: 3,
    nextTryAt: 0,
    lastError: "netwerk: Failed to fetch"
  };
}
const QUEUE = [
  qItem("memo:s_1791446400000:1", "memo", { session_id: "s_1791446400000", title: "Memo oop", body: "5 min", data: { minutes: 5 } }, OLD + 1800000),
  qItem("probleem:b_1", "probleem", { title: "Probleem", body: "Kamera het gevries", data: { id: "b_1", text: "Kamera het gevries" } }, OLD + 2700000)
];
const SEED = {
  wallie911_v2_bok: {
    pin: "2468",
    planDate: "2026-10-08",
    blocks: [],
    completedBlocks: { "2026-10-08-warm": OLD },
    checklist: { "2026-10-08": { slaap: true } },
    faults: [{ id: "f_1", subjectSlug: "rtt", text: "VLOOKUP absolute verwysing vergeet", at: OLD + 3600000 }],
    papers: [],
    sessions: [
      {
        id: "s_1791446400000",
        date: "2026-10-08",
        subjectSlug: "rtt",
        task: "Sigblad Vraag 3",
        durationMin: 40,
        actualMin: 40,
        plannedMin: 45,
        startedAt: OLD,
        endedAt: OLD + 2400000,
        block: null,
        warnings: 1,
        locks: 0,
        memoMin: 5,
        outcome: "voltooi"
      }
    ],
    wallieSurveys: [],
    paSurveys: [],
    bugReports: [],
    pendingSurveySessionId: null,
    live: { status: "off", subject: null, warnings: 0, startedAt: null }
  },
  wallie911_device_id: DEVICE,
  wallie911_sync_v2: {
    queue: QUEUE,
    sentCount: 41,
    lastOkAt: OLD + 2500000,
    lastAttemptAt: OLD + 2800000,
    lastError: "netwerk: Failed to fetch",
    failingSince: OLD + 2600000,
    alertFor: null,
    outageSince: null,
    serverV2: null,
    v2CheckedAt: 0,
    planServer: null,
    planCheckedAt: 0,
    plansSyncedFor: null,
    backfilledAt: OLD + 2500000,
    legacyMigrated: true
  },
  /* Die saad-sessie is reeds gestuur (anders sou terugvul dit weer in die tou sit) */
  wallie911_synced_ids_v1: { "start:s_1791446400000": OLD + 10000, "end:s_1791446400000": OLD + 2410000 },
  /* Ou uitklok-sleutel bly staan (legacyMigrated = true): moet onaangeraak bly */
  wallie911_outbox_v1: { queue: [{ id: "end_1_abc", createdAt: OLD + 2400000, payload: { kind: "end", session_id: "s_ou1", data: { sessionId: "s_ou1" }, client_at: OLD + 2400000 } }] },
  wallie911_outbox_v1_migrated: { at: OLD + 100, count: 0 },
  /* Verstreke slot van ’n ander oortjie */
  wallie911_sync_lock: { tab: "oortjie0", until: OLD + 45000 }
};

async function excursion(page, awayMs = 20000) {
  await hideTab(page);
  await page.clock.runFor(awayMs);
  await showTab(page);
  await page.clock.runFor(5000);
}

const dumpStorage = (page) =>
  page.evaluate(() => {
    const out = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      out[k] = localStorage.getItem(k);
    }
    return out;
  });

/* fase1 = true: oefenvrae + praktiese blok; false: kontrole (net dieselfde klok-stappe) */
async function run(page, context, { fase1 }) {
  const mock = new MockBackend({ mode: "v1" });
  await mock.attach(context);
  const buite = [];
  page.on("request", (r) => {
    const u = r.url();
    if (!/^(http:\/\/localhost|data:|blob:)/.test(u) && !/fonts\.(googleapis|gstatic)\.com|supabase\.co|ntfy\.sh/.test(u)) buite.push(u);
  });
  await page.addInitScript(() => {
    let s = 7;
    Math.random = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  });
  await boot(page, { seed: SEED });
  await page.clock.pauseAt(new Date(T0.getTime() + 1000));
  await page.goto("/#missie");
  await page.clock.runFor(30000);
  const mark = { afterLoad: mock.calls.length };

  /* 1. Oefenvrae: 3 items, elk ’n poging */
  if (fase1) {
    await page.goto("/#oefenvrae");
    await expect(page.locator(".ov-item")).toHaveCount(30);
    await page.locator(".ov-item").first().click();
    for (const t of ["Reg", "Gedeeltelik", "Fout"]) {
      await page.locator(".oe-memo-knoppie").click();
      await page.getByRole("button", { name: t, exact: true }).click();
      await expect(page.locator(".oe-gestoor")).toHaveText("Gestoor.");
      await page.locator(".oe-volgende").click();
    }
  }
  await page.clock.runFor(30000);

  /* 2. Praktiese blok (knoppie eers, geen sessie nie) met 2× minimiseer; kontrole minimiseer ook, sonder blok */
  await page.goto("/#sessie");
  await page.locator("#session-subject").selectOption("rtt");
  mark.prakVoor = mock.calls.length;
  mark.ntfyPrakVoor = mock.ntfy.length;
  if (fase1) {
    await page.locator("#praktiese-start").click();
    await expect(page.locator(".praktiese-banner")).toBeVisible();
  }
  for (let i = 0; i < 2; i++) await excursion(page);
  if (fase1) {
    page.once("dialog", (d) => d.accept());
    await page.locator("#praktiese-klaar").click();
    await expect(page.locator("#praktiese-boodskap")).toBeVisible();
  }
  await page.clock.runFor(30000);
  mark.prakNa = mock.calls.length;
  mark.ntfyPrakNa = mock.ntfy.length;

  /* 3. Normale sessie (basislyn-stappe), vaste klok-stappe sodat albei lopies dieselfde tydstempels kry */
  await page.goto("/#missie");
  await page.locator('.start-block[data-slug="rtt"]').first().click();
  /* startedAt word ná `await getUserMedia` gestel (reële tyd); wag in reële tyd sodat die klok nie intussen skuif nie */
  await expect
    .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("wallie911_v2_bok")).live.status), { timeout: 15000 })
    .toBe("active");
  await page.clock.runFor(130000); /* start + ≥2 hartkloppe */
  await hideTab(page);
  await page.clock.runFor(20000);
  await showTab(page);
  await page.clock.runFor(60000); /* waarskuwing afgelewer */
  await page.locator("#end-session").click();
  await page.clock.runFor(30000);

  expectNoLeaks(mock);
  expect(buite, "0 ononderskepte eksterne versoeke").toEqual([]);
  return { mock, mark, storage: await dumpStorage(page) };
}

test.describe("fase 1: totale regressie", () => {
  test.use({ viewport: { width: 1366, height: 768 } });

  test("saad van alle sleutels → oefenvrae → praktiese blok → normale sessie: geen dataverlies, payloads = basislyn", async ({ page, context, browser, baseURL }) => {
    const ctxB = await browser.newContext({
      baseURL,
      viewport: { width: 1366, height: 768 },
      locale: "af-ZA",
      timezoneId: "Africa/Johannesburg",
      permissions: ["camera"]
    });
    try {
      const control = await run(page, context, { fase1: false });
      const full = await run(await ctxB.newPage(), ctxB, { fase1: true });

      /* --- berging --- */
      expect(control.storage[VB_KEY]).toBeUndefined();
      expect(Object.keys(full.storage).filter((k) => !(k in control.storage))).toEqual([VB_KEY]);
      expect(Object.keys(control.storage).filter((k) => !(k in full.storage))).toEqual([]);
      /* Elke gesaaide sleutel bestaan nog — behalwe die verstreke sync-slot: sync.js holdLock/releaseLock neem dit oor en
         verwyder dit ná elke flush (master-gedrag; die kontrole het dit ook nie meer nie) */
      expect("wallie911_sync_lock" in control.storage).toBe(false);
      for (const k of Object.keys(SEED).filter((x) => x !== "wallie911_sync_lock")) expect(k in full.storage, `saad-sleutel ${k} bestaan nog`).toBe(true);
      const norm = (v) => v.replace(/\d{13}/g, (n) => (Number(n) >= T0.getTime() ? "<t>" : n));
      for (const k of Object.keys(control.storage)) {
        if (SYNC_BOOKKEEPING.includes(k)) expect(norm(full.storage[k]), `sleutel ${k} identies (tydstempels genormaliseer)`).toBe(norm(control.storage[k]));
        else expect(full.storage[k], `sleutel ${k} byte-identies`).toBe(control.storage[k]);
      }
      /* Sleutels wat die normale sessie nie aanraak nie: byte-identies aan die saad */
      for (const k of ["wallie911_device_id", "wallie911_outbox_v1", "wallie911_outbox_v1_migrated"]) {
        const want = typeof SEED[k] === "string" ? SEED[k] : JSON.stringify(SEED[k]);
        expect(full.storage[k], `${k} = saad`).toBe(want);
      }
      const bok = JSON.parse(full.storage.wallie911_v2_bok);
      /* Nuwe sessies kom voor; die saad-sessie bly onveranderd */
      expect(bok.sessions.find((s) => s.id === "s_1791446400000")).toEqual(SEED.wallie911_v2_bok.sessions[0]);
      expect(bok.sessions).toHaveLength(2);
      expect(bok.faults).toEqual(SEED.wallie911_v2_bok.faults);

      const vb = JSON.parse(full.storage[VB_KEY]);
      expect(Object.keys(vb).sort()).toEqual(["items", "prakties", "v"]);
      expect(Object.values(vb.items).map((x) => x.pogings.map((p) => p.uitslag))).toEqual([["reg"], ["gedeeltelik"], ["fout"]]);
      expect(vb.prakties).toHaveLength(1);
      expect(vb.prakties[0]).toMatchObject({ rede_einde: "klaar" });
      expect(vb.prakties[0].afwesig).toHaveLength(2);

      /* --- gesaaide vanlyn-tou: dreineer onveranderd na die mock --- */
      for (const r of [control, full]) {
        const seededIds = QUEUE.map((q) => q.id);
        const box = JSON.parse(r.storage.wallie911_sync_v2);
        expect(box.queue.filter((q) => seededIds.includes(q.id)), "gesaaide items uit die tou").toEqual([]);
        const ledger = JSON.parse(r.storage.wallie911_synced_ids_v1);
        for (const id of seededIds) expect(ledger[id], `${id} in grootboek`).toBeGreaterThanOrEqual(T0.getTime());
        /* v2-toets: die eerste item se payload presies soos gesaai */
        const probe = r.mock.calls.filter((c) => c.name === "wallie_ingest_v2" && seededIds.includes(c.body?.p?.event_id));
        expect(probe).toHaveLength(1);
        expect(probe[0].body.p).toEqual(QUEUE[0].payload);
        /* Afgelewer via wallie_ingest: payload onveranderd + die bestaande v1-omhulsel (data._event_id) */
        for (const q of QUEUE) {
          const got = r.mock.delivered().filter((c) => c.body.p.event_id === q.id);
          expect(got, `${q.id} presies een keer afgelewer`).toHaveLength(1);
          expect(got[0].body.p).toEqual({ ...q.payload, data: { ...q.payload.data, _event_id: q.id } });
        }
      }

      /* --- payload-vorms --- */
      const baseline = JSON.parse(fs.readFileSync(FIXTURE, "utf8")).entries;
      const isSeeded = (c) => QUEUE.some((q) => q.id === c.body?.p?.event_id);
      const v2StartProbe = (e) => e.channel === "rpc:wallie_ingest_v2" && e.kind === "start";
      for (const r of [control, full]) {
        const cur = entriesOf(r.mock.calls.filter((c) => !isSeeded(c)), r.mock.ntfy);
        expect(sorted(cur), "normale sessie: vorms = basislyn (sonder die reeds-beantwoorde v2-toets)").toEqual(sorted(baseline.filter((e) => !v2StartProbe(e))));
      }
      /* Praktiese fase: net basislyn-vorms sonder warn/lock; geen nuwe soorte of velde nie */
      const prakEntries = entriesOf(full.mock.calls.slice(full.mark.prakVoor, full.mark.prakNa), full.mock.ntfy.slice(full.mark.ntfyPrakVoor, full.mark.ntfyPrakNa));
      const allowed = new Set(sorted(baseline.filter((e) => e.kind !== "warn" && e.kind !== "lock")));
      expect(sorted(prakEntries).filter((e) => !allowed.has(e))).toEqual([]);
      expect(full.mock.calls.slice(full.mark.prakVoor, full.mark.prakNa).filter((c) => ["warn", "lock"].includes(c.body?.p?.kind))).toEqual([]);
      /* Die normale sessie in die volle lopie gee steeds presies die ou waarskuwing */
      expect(full.mock.byKind("warn").map((c) => c.body.p.total_warnings)).toEqual([1]);
      expect(control.mock.byKind("warn").map((c) => c.body.p.total_warnings)).toEqual([1]);
      expect(full.mock.byKind("end")).toHaveLength(1);
    } finally {
      await ctxB.close();
    }
  });
});
