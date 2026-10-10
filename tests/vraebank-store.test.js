/* Vraebank-stoor + praktiese modus: fake klok, fake DOM, fake localStorage. `node tests/vraebank-store.test.js` */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const fails = [];
let passed = 0;
function assert(cond, msg) {
  if (cond) passed += 1;
  else fails.push(msg);
}

const KEY = "wallie911_vraebank_v1";
const MAX_MS = (3 * 60 + 15) * 60 * 1000;

/* Een "blaaier": eie klok, timers, gebeure en localStorage. Laai die skrifte soos index.html. */
function makeBrowser({ store = {}, subject = "rtt", files = ["vraebank-store.js", "praktiese.js", "proctor.js"], failSet = false, failGet = false, start = 1_800_000_000_000 } = {}) {
  const B = { now: start, timers: [], seq: 0, store };
  const schedule = (fn, ms, repeat) => {
    const id = ++B.seq;
    B.timers.push({ id, at: B.now + (ms || 0), fn, ms, repeat });
    return id;
  };
  const clear = (id) => (B.timers = B.timers.filter((t) => t.id !== id));
  B.advance = (ms) => {
    const target = B.now + ms;
    for (;;) {
      B.timers.sort((a, b) => a.at - b.at);
      const t = B.timers[0];
      if (!t || t.at > target) break;
      B.now = t.at;
      if (t.repeat) t.at += t.ms;
      else clear(t.id);
      t.fn();
    }
    B.now = target;
  };
  const FakeDate = class extends Date {
    constructor(...a) {
      super(...(a.length ? a : [B.now]));
    }
    static now() {
      return B.now;
    }
  };
  const listeners = { doc: {}, win: {} };
  const on = (bag) => (type, fn) => ((bag[type] = bag[type] || []).push(fn));
  const off = (bag) => (type, fn) => (bag[type] = (bag[type] || []).filter((f) => f !== fn));
  B.fire = (where, type) => (listeners[where][type] || []).forEach((f) => f());
  const els = {
    "session-subject": { value: subject },
    "session-task": { value: "" }
  };
  const document = {
    hidden: false,
    _focus: true,
    activeElement: null,
    hasFocus() {
      return this._focus;
    },
    getElementById: (id) => els[id] || null,
    addEventListener: on(listeners.doc),
    removeEventListener: off(listeners.doc)
  };
  const sandbox = {
    console,
    JSON,
    Math,
    Number,
    Date: FakeDate,
    setTimeout: (fn, ms) => schedule(fn, ms, false),
    clearTimeout: clear,
    setInterval: (fn, ms) => schedule(fn, ms, true),
    clearInterval: clear,
    document,
    localStorage: {
      getItem: (k) => {
        if (failGet) throw new Error("SecurityError");
        return k in store ? store[k] : null;
      },
      setItem: (k, v) => {
        if (failSet) {
          const e = new Error("quota");
          e.name = "QuotaExceededError";
          throw e;
        }
        store[k] = String(v);
      },
      removeItem: (k) => delete store[k]
    },
    WALLIE: {}
  };
  sandbox.window = sandbox;
  sandbox.window.addEventListener = on(listeners.win);
  sandbox.window.removeEventListener = off(listeners.win);
  for (const f of files) {
    const rel = "assets/js/" + f;
    vm.runInNewContext(fs.readFileSync(path.join(root, rel), "utf8"), sandbox, { filename: rel });
  }
  B.win = sandbox;
  B.doc = document;
  B.els = els;
  B.S = sandbox.VraebankStore;
  B.Pr = sandbox.Praktiese;
  B.P = sandbox.WALLIE.proctor;
  B.leave = () => {
    document.hidden = true;
    document._focus = false;
    B.fire("win", "blur");
    B.fire("doc", "visibilitychange");
  };
  B.back = () => {
    document.hidden = false;
    document._focus = true;
    B.fire("doc", "visibilitychange");
    B.fire("win", "focus");
  };
  B.raw = () => JSON.parse(store[KEY]);
  return B;
}

/* ---------- 1. Stoor-API ---------- */
{
  const other = { wallie911_v2_bok: '{"pin":"1234","sessions":[]}', wallie911_sync_v2: '{"queue":[{"id":"x"}]}' };
  const B = makeBrowser({ store: { ...other }, files: ["vraebank-store.js"] });
  const S = B.S;
  assert(JSON.stringify(S.get()) === JSON.stringify({ v: 1, items: {}, prakties: [] }), "empty store has v1 shape");
  assert(!(KEY in B.store), "reading never creates the key");
  assert(S.attempts("rtt-v1-S01").length === 0, "no attempts yet");
  assert(S.saveAttempt("rtt-v1-S01", "reg").uitslag === "reg", "saveAttempt returns the attempt");
  B.advance(1000);
  S.saveAttempt("rtt-v1-S01", "gedeeltelik");
  S.saveAttempt("rtt-v1-W01", "fout");
  assert(S.saveAttempt("rtt-v1-S01", "90%") === null, "unknown uitslag rejected");
  assert(S.saveAttempt("", "reg") === null, "empty id rejected");
  const a = S.attempts("rtt-v1-S01");
  assert(a.length === 2 && a[0].uitslag === "reg" && a[1].uitslag === "gedeeltelik", "attempts stored in order");
  assert(a[0].t === new Date(1_800_000_000_000).toISOString(), "attempt t is ISO time");
  const raw = B.raw();
  assert(raw.v === 1 && Object.keys(raw.items).length === 2 && Array.isArray(raw.prakties), "persisted structure");
  assert(JSON.stringify(Object.keys(raw.items["rtt-v1-W01"])) === '["pogings"]', "item only has pogings");
  const rawStr = JSON.stringify(raw);
  assert(!/punt|persent|%|score/i.test(rawStr), "no marks/percentages stored");
  Object.entries(other).forEach(([k, v]) => assert(B.store[k] === v, `other key ${k} untouched by store`));
  assert(Object.keys(B.store).sort().join() === [...Object.keys(other), KEY].sort().join(), "only new key is " + KEY);
}

/* ---------- 2. Korrupte / onbekende JSON ---------- */
for (const [label, bad] of [
  ["not json", "{nie json nie"],
  ["wrong v", JSON.stringify({ v: 2, items: {}, prakties: [] })],
  ["array", "[]"],
  ["null", "null"],
  ["items missing", JSON.stringify({ v: 1, prakties: [] })],
  ["prakties not array", JSON.stringify({ v: 1, items: {}, prakties: {} })]
]) {
  const other = { wallie911_v2_bok: '{"pin":"9999"}', wallie911_sync_v2: '{"queue":[]}', wallie911_remote_consent_v2: "1" };
  const B = makeBrowser({ store: { ...other, [KEY]: bad }, files: ["vraebank-store.js"] });
  assert(JSON.stringify(B.S.get()) === JSON.stringify({ v: 1, items: {}, prakties: [] }), `corrupt (${label}) → empty structure`);
  assert(B.S.activePractical() === null, `corrupt (${label}) → no active practical`);
  assert(B.store[KEY] === bad, `corrupt (${label}) not rewritten by a read`);
  B.S.saveAttempt("rtt-v1-H01", "reg");
  assert(B.raw().v === 1 && B.S.attempts("rtt-v1-H01").length === 1, `corrupt (${label}) → starts over on write`);
  Object.entries(other).forEach(([k, v]) => assert(B.store[k] === v, `corrupt (${label}): ${k} untouched`));
}

/* ---------- 3. localStorage-foute breek nooit die app nie ---------- */
{
  const B = makeBrowser({ failSet: true, files: ["vraebank-store.js"] });
  let threw = false;
  try {
    B.S.saveAttempt("rtt-v1-D01", "fout");
    B.S.practicalStart();
    B.S.practicalAbsence("start");
  } catch {
    threw = true;
  }
  assert(!threw, "quota error does not throw");
  assert(B.S.attempts("rtt-v1-D01").length === 1, "quota error → in-memory fallback keeps attempt");
  assert(B.S.activePractical() && B.S.activePractical().afwesig.length === 1, "quota error → in-memory practical");
  assert(!(KEY in B.store), "nothing written when setItem fails");
}
{
  const B = makeBrowser({ failGet: true, failSet: true, files: ["vraebank-store.js"] });
  let threw = false;
  try {
    B.S.get();
    B.S.saveAttempt("rtt-v1-D01", "reg");
  } catch {
    threw = true;
  }
  assert(!threw && B.S.attempts("rtt-v1-D01").length === 1, "private mode (getItem throws) → in-memory works");
}

/* ---------- 4. Stoor: praktiese blok ---------- */
{
  const B = makeBrowser({ files: ["vraebank-store.js"] });
  const S = B.S;
  assert(S.activePractical() === null, "no practical at start");
  assert(S.practicalAbsence("start") === null, "absence without block ignored");
  const p = S.practicalStart();
  assert(p.begin && p.einde === null && p.rede_einde === null && Array.isArray(p.afwesig) && p.id, "practicalStart shape");
  assert(S.practicalStart().id === p.id && S.get().prakties.length === 1, "second start returns the active block");
  S.practicalAbsence("start");
  S.practicalAbsence("start");
  assert(S.activePractical().afwesig.length === 1, "open absence is not duplicated");
  B.advance(5000);
  S.practicalAbsence("end");
  assert(S.activePractical().afwesig[0].tot !== null, "absence closed");
  S.practicalAbsence("start");
  const done = S.practicalEnd("klaar");
  assert(done.rede_einde === "klaar" && done.einde, "practicalEnd klaar");
  assert(done.afwesig.every((x) => x.tot), "practicalEnd closes open absences");
  assert(S.activePractical() === null, "no active after end");
  assert(S.practicalEnd("klaar") === null, "end without active block → null");
  const keys = Object.keys(B.raw().prakties[0]).sort().join();
  assert(keys === "afwesig,begin,einde,id,rede_einde", "practical record has exactly the documented keys");
}

/* ---------- 5. Praktiese modus + proctor ---------- */
function beginProctor(B) {
  const log = { warn: 0, lock: 0, ignore: 0 };
  B.P.begin({
    minutes: 240,
    onWarn: () => (log.warn += 1),
    onLock: () => (log.lock += 1),
    onIgnore: () => (log.ignore += 1),
    onEnd: () => {}
  });
  B.advance(9000); /* verby die begin-grasie */
  return log;
}
function excursions(B, n) {
  for (let i = 0; i < n; i++) {
    B.leave();
    B.advance(20000);
    B.back();
    B.advance(3000);
  }
}

{
  /* Nie RTT nie → kan nie begin nie */
  const B = makeBrowser({ subject: "wiskgelett" });
  assert(B.Pr.canStart() === false, "canStart false for non-RTT subject");
  assert(B.Pr.start().ok === false && B.Pr.active() === false, "start refused for non-RTT");
  assert(!(KEY in B.store), "refused start writes nothing");
}
{
  /* RTT: 3 uitstappies → 0 waarskuwings, 3 afwesighede, taak gemerk */
  const B = makeBrowser();
  const changes = [];
  B.Pr.onChange((i) => changes.push(i));
  assert(B.Pr.canStart() === true, "canStart true for RTT");
  const r = B.Pr.start();
  assert(r.ok && B.Pr.active(), "start ok");
  assert(B.els["session-task"].value === "Praktiese blok: RTT V1", "task field marked");
  assert(B.Pr.canStart() === false, "canStart false while active");
  assert(B.Pr.taskFor("rtt") === "Praktiese blok: RTT V1" && B.Pr.taskFor("engels") === null, "taskFor marks only RTT sessions");
  assert(changes.length === 1 && changes[0].active === true, "onChange fired on start");
  const log = beginProctor(B);
  excursions(B, 3);
  assert(log.warn === 0 && log.lock === 0, "practical: 0 warn, 0 lock");
  assert(B.P.warnings === 0 && B.P.totalWarnings === 0 && !B.P.locked, "practical: warning counters unchanged");
  assert(B.S.activePractical().afwesig.length === 3, "practical: 3 absences logged");
  assert(B.S.activePractical().afwesig.every((a) => a.tot), "practical: absences closed on return");
  /* blur alleen (Alt-Tab na Word, blaaier bly sigbaar) tel ook as afwesig */
  B.doc._focus = false;
  B.fire("win", "blur");
  B.advance(2000);
  B.doc._focus = true;
  B.fire("win", "focus");
  assert(B.S.activePractical().afwesig.length === 4, "blur-only absence logged after delay");
  B.doc._focus = false;
  B.fire("win", "blur");
  B.advance(500);
  B.doc._focus = true;
  B.fire("win", "focus");
  assert(B.S.activePractical().afwesig.length === 4, "short blur (<1.5s) not logged");
  const rem = B.Pr.remainingMs();
  assert(rem > 0 && rem <= MAX_MS, "remainingMs within max");

  /* end() → ou gedrag terug */
  const ended = B.Pr.end();
  assert(ended && ended.rede_einde === "klaar", "end() → klaar");
  assert(!B.Pr.active() && B.Pr.remainingMs() === 0, "inactive after end");
  assert(B.Pr.taskFor("rtt") === null, "taskFor null after end");
  assert(changes.length === 2 && changes[1].active === false && changes[1].rede === "klaar", "onChange fired on end");
  excursions(B, 1);
  assert(log.warn === 1 && B.P.warnings === 1, "after end: minimise warns again");
  assert(B.S.get().prakties[0].afwesig.length === 4, "after end: no more absences logged");
  B.P.stop();
}
{
  /* Sonder praktiese modus: presies die ou gedrag (3 uitstappies → 3 warn, 1 lock) */
  const B = makeBrowser();
  const log = beginProctor(B);
  excursions(B, 3);
  assert(log.warn === 3 && log.lock === 1 && B.P.locked, "no practical: 3 warn + lock as before");
  assert(!(KEY in B.store), "no practical: store key never created");
  B.P.stop();
}
{
  /* Maks 3 h 15 min → eindig self met "maks" */
  const B = makeBrowser();
  const changes = [];
  B.Pr.onChange((i) => changes.push(i));
  B.Pr.start();
  const t0 = B.now;
  B.advance(MAX_MS - 1000);
  assert(B.Pr.active(), "still active just before max");
  B.advance(2000);
  const rec = B.S.get().prakties[0];
  assert(rec.rede_einde === "maks", "auto-end with maks");
  assert(rec.einde === new Date(t0 + MAX_MS).toISOString(), "maks einde = begin + 3h15");
  assert(changes.some((c) => c.active === false && c.rede === "maks"), "onChange fired with maks");
  const log = beginProctor(B);
  excursions(B, 1);
  assert(log.warn === 1, "after maks: old warn behaviour");
  B.P.stop();
}
{
  /* Herlaai tydens ’n blok: hervat; ná maks: sluit met "maks" */
  const shared = {};
  const B1 = makeBrowser({ store: shared });
  B1.Pr.start();
  B1.leave();
  const begin = B1.now;
  const B2 = makeBrowser({ store: shared, start: begin + 60 * 60 * 1000 });
  assert(B2.Pr.active(), "reload within max → still active");
  const rec2 = B2.S.activePractical();
  assert(rec2.afwesig.length === 1 && rec2.afwesig[0].tot, "reload closes the open absence (Wallie is back)");
  assert(B2.els["session-task"].value === "Praktiese blok: RTT V1", "reload re-marks the task field");
  const log = beginProctor(B2);
  excursions(B2, 2);
  assert(log.warn === 0, "reload: still no warnings");
  B2.P.stop();

  const B3 = makeBrowser({ store: shared, start: begin + MAX_MS + 5000 });
  assert(!B3.Pr.active(), "reload after max → inactive");
  const last = B3.S.get().prakties[0];
  assert(last.rede_einde === "maks" && last.einde === new Date(begin + MAX_MS).toISOString(), "reload after max → closed with maks at begin+3h15");
}
{
  /* Aktiewe blok, maar ’n nie-RTT-sessie loop → waarskuwings tel steeds */
  const store = {};
  const B = makeBrowser({ store });
  B.Pr.start();
  store.wallie911_v2_bok = JSON.stringify({ live: { status: "active", subject: "engels" } });
  const log = beginProctor(B);
  excursions(B, 1);
  assert(log.warn === 1, "practical does not suppress warnings in a non-RTT session");
  B.P.stop();
}
{
  /* Proctor sonder praktiese.js gelaai (soos scripts/proctor-test.js): geen fout nie */
  const B = makeBrowser({ files: ["proctor.js"] });
  const log = beginProctor(B);
  excursions(B, 1);
  assert(log.warn === 1, "proctor works without praktiese.js");
  B.P.stop();
}

console.log(JSON.stringify({ passed, fails: fails.length, failList: fails }, null, 2));
process.exit(fails.length ? 1 : 0);
