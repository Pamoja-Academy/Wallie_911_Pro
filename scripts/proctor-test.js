/* Soft-lock + duursame uitboks: fake klok, fake DOM-gebeure. `node scripts/proctor-test.js` */
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

let now = 1_800_000_000_000;
let timers = [];
let timerSeq = 0;
function schedule(fn, ms, repeat) {
  const id = ++timerSeq;
  timers.push({ id, at: now + ms, fn, ms, repeat });
  return id;
}
function clear(id) {
  timers = timers.filter((t) => t.id !== id);
}
function advance(ms) {
  const target = now + ms;
  for (;;) {
    timers.sort((a, b) => a.at - b.at);
    const t = timers[0];
    if (!t || t.at > target) break;
    now = t.at;
    if (t.repeat) t.at += t.ms;
    else clear(t.id);
    t.fn();
  }
  now = target;
}

const FakeDate = class extends Date {
  constructor(...a) {
    super(...(a.length ? a : [now]));
  }
  static now() {
    return now;
  }
};

const listeners = { doc: {}, win: {} };
const on = (bag) => (type, fn) => ((bag[type] = bag[type] || []).push(fn));
const off = (bag) => (type, fn) => (bag[type] = (bag[type] || []).filter((f) => f !== fn));
const fire = (bag, type) => (bag[type] || []).forEach((f) => f());

const store = {};
const document = {
  hidden: false,
  _focus: true,
  activeElement: null,
  hasFocus() {
    return this._focus;
  },
  addEventListener: on(listeners.doc),
  removeEventListener: off(listeners.doc)
};
const sandbox = {
  console,
  JSON,
  Math,
  URL,
  URLSearchParams,
  Date: FakeDate,
  setTimeout: (fn, ms) => schedule(fn, ms, false),
  clearTimeout: clear,
  setInterval: (fn, ms) => schedule(fn, ms, true),
  clearInterval: clear,
  document,
  localStorage: {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => (store[k] = String(v)),
    removeItem: (k) => delete store[k]
  },
  location: { protocol: "https:", href: "https://example.test/" },
  navigator: { userAgent: "test" },
  WALLIE: {}
};
sandbox.window = sandbox;
sandbox.window.addEventListener = on(listeners.win);
sandbox.window.removeEventListener = off(listeners.win);

for (const rel of ["assets/js/proctor.js", "assets/js/sync.js", "assets/js/remote.js"]) {
  vm.runInNewContext(fs.readFileSync(path.join(root, rel), "utf8"), sandbox, { filename: rel });
}
const P = sandbox.WALLIE.proctor;
const R = sandbox.WALLIE.REMOTE;
const S = sandbox.WALLIE.SYNC;

function leaveTab() {
  document.hidden = true;
  document._focus = false;
  fire(listeners.win, "blur");
  fire(listeners.doc, "visibilitychange");
}
function returnTab() {
  document.hidden = false;
  document._focus = true;
  fire(listeners.doc, "visibilitychange");
  fire(listeners.win, "focus");
}
function blurFor(ms) {
  document._focus = false;
  fire(listeners.win, "blur");
  advance(ms);
  document._focus = true;
  fire(listeners.win, "focus");
}

const log = { warn: [], lock: 0, ignore: 0, end: [], memoTimeout: 0 };
P.begin({
  minutes: 45,
  onWarn: (n, reason, total) => log.warn.push({ n, reason, total }),
  onLock: () => (log.lock += 1),
  onIgnore: () => (log.ignore += 1),
  onEnd: (r) => log.end.push(r),
  onMemoTimeout: () => (log.memoTimeout += 1)
});

/* 1. Grasie ná begin: kamera-prompt / Windows-toast */
blurFor(3000);
leaveTab();
advance(500);
returnTab();
assert(log.warn.length === 0, "no warnings inside 8s start grace");
assert(log.ignore >= 1, "grace events reported as ignored");
advance(8000);

/* 2. Kort fokus-verlies (<1.5s) tel nie */
blurFor(800);
assert(log.warn.length === 0, "blur shorter than 1.5s is forgiven");

/* 3. Een tab-wissel = een waarskuwing (blur + visibilitychange) */
leaveTab();
advance(3000);
returnTab();
assert(log.warn.length === 1, `one tab switch = one warning (got ${log.warn.length})`);

/* 4. Lang fokus-verlies sonder tab-wissel tel wel */
blurFor(2000);
assert(log.warn.length === 2, "blur longer than 1.5s warns");

/* 5. Derde uitstappie sluit; tyd pouseer; geen ekstra waarskuwings/slotte */
leaveTab();
advance(100);
assert(log.lock === 1 && P.locked, "third leave locks");
const leftAtLock = P.timeLeft();
returnTab();
advance(5 * 60 * 1000);
assert(P.timeLeft() === leftAtLock, "timer paused while locked");
leaveTab();
advance(3000);
returnTab();
assert(log.warn.length === 3 && log.lock === 1, "no warnings or re-locks while locked");

/* 6. Ontsluit: teller terug na 0, tyd hervat, kort grasie */
P.unlock();
assert(!P.locked && P.warnings === 0, "unlock resets warning counter");
assert(P.totalWarnings === 3 && P.locks === 1, "session totals kept for report");
assert(P.lockedTotalMs() >= 5 * 60 * 1000, "locked time tracked");
advance(1000);
assert(P.timeLeft() === leftAtLock - 1000, "timer resumes after unlock");
blurFor(2000);
assert(P.warnings === 0, "short grace after unlock");
advance(6000);
leaveTab();
advance(100);
returnTab();
assert(P.warnings === 1 && P.totalWarnings === 4, "warnings count again after grace");

/* 7. Memo-modus: fokus in memo-raam tel nie; tab-wissel wel */
const frame = { tag: "iframe" };
P.setMemoMode(true, frame);
document._focus = false;
document.activeElement = frame;
fire(listeners.win, "blur");
advance(5000);
assert(P.warnings === 1, "focus inside memo frame is not a warning");
document._focus = true;
document.activeElement = null;
fire(listeners.win, "focus");
leaveTab();
advance(100);
returnTab();
assert(P.warnings === 2, "tab switch still warns in memo mode");

/* 8. Ander program (fokus weg, nie in memo-raam) tel steeds in memo-modus */
document._focus = false;
document.activeElement = null;
fire(listeners.win, "blur");
advance(2000);
document._focus = true;
fire(listeners.win, "focus");
assert(P.warnings === 3 && P.locked, "leaving to another app still warns in memo mode (and locks)");
assert(!P.memoSince, "lock closes memo mode");
P.unlock();
advance(6000);

/* 9. Memo-limiet 15 min */
P.setMemoMode(true, frame);
advance(15 * 60 * 1000 + 500);
assert(log.memoTimeout === 1 && !P.memoSince, "memo auto-closes after 15 min");
assert(P.memoMinutes() >= 15, "memo minutes accumulated");

/* 10. Lêer-dialoog-grasie eindig wanneer fokus terugkom */
P.grace(60000, { untilFocus: true });
blurFor(10000);
assert(P.warnings === 0, "file picker grace covers picker dialog");
advance(1500);
blurFor(2000);
assert(P.warnings === 1, "picker grace ends once focus returns");

P.stop();
assert(!P.active && timers.length === 0, "stop clears timers");

/* ---------- Sinkronisering → Pa-konsole (sync.js) ---------- */
const tick = async (n = 6) => {
  for (let i = 0; i < n; i++) await new Promise((r) => setImmediate(r));
};
(async () => {
  assert(S.load().queue.length === 0, "queue starts empty (no invented items)");
  const rpcCalls = [];
  const ntfyCalls = [];
  let rpcReply = async () => ({ ok: false, transient: true, error: "netwerk: Failed to fetch" });
  sandbox.WALLIE.LIVE = {
    rpc: async (name, args) => {
      rpcCalls.push({ name, args });
      return rpcReply(name, args);
    }
  };
  sandbox.fetch = async (url) => {
    ntfyCalls.push(url);
    return { ok: true, status: 200 };
  };
  R.setConsent(true);

  /* 1. Vanlyn: start bly in die tou */
  await R.sessionStart({
    sessionId: "s_1",
    subjectSlug: "wisk",
    minutes: 45,
    task: "V1",
    startedAt: now,
    block: { id: "b1", title: "Blok", start: "09:00", end: "09:45" }
  });
  await tick();
  let box = S.load();
  const startItem = box.queue.find((q) => q.id === "start:s_1");
  assert(startItem && startItem.payload.planned_min === 45 && startItem.payload.block_id === "b1", "offline: start kept with live + block fields");
  assert(box.queue.some((q) => q.id === "hb:s_1:1" && q.payload.visible === true), "first heartbeat queued with visibility");
  assert(box.failingSince, "failure time recorded");
  assert(S.status().level === "busy", "indicator busy right after failure");
  assert(ntfyCalls.length === 1, "start still pushes to ntfy once");
  assert(new URL(ntfyCalls[0]).searchParams.get("title") === "IN SESSIE — begin", "ntfy title sent as UTF-8 query param");

  /* 2. >10 min sonder sinkronisering → rooi + een ntfy-waarskuwing aan Pa */
  advance(11 * 60 * 1000);
  await S.flush();
  await tick();
  assert(S.status().level === "bad", "indicator red after >1 min failing");
  const alertTitle = (u) => new URL(u).searchParams.get("title") || "";
  assert(ntfyCalls.filter((u) => alertTitle(u).startsWith("SINK-PROBLEEM")).length === 1, "one SINK-PROBLEEM alert to Pa");
  await S.flush();
  await tick();
  assert(ntfyCalls.filter((u) => alertTitle(u).startsWith("SINK-PROBLEEM")).length === 1, "alert not repeated");

  const probesBefore = rpcCalls.filter((c) => c.name === "wallie_ingest_v2").length;
  /* 3. Weer aanlyn, v2 bestaan nog nie: val terug na wallie_ingest; nuwe soorte word geparkeer */
  rpcReply = async (name) =>
    name === "wallie_ingest_v2" ? { ok: false, missingFunction: true, status: 404, error: "Could not find the function" } : { ok: true };
  S.enqueue("idle:s_1:1", { kind: "idle", session_id: "s_1" }, { noFlush: true });
  S.update((b) => b.queue.forEach((q) => (q.nextTryAt = 0)));
  await S.flush();
  await tick();
  box = S.load();
  const v1Start = rpcCalls.find((c) => c.name === "wallie_ingest" && c.args.p.kind === "start");
  assert(v1Start && v1Start.args.p.data._event_id === "start:s_1", "v1 fallback carries event id in data");
  assert(!box.queue.some((q) => q.id === "start:s_1"), "start delivered via v1");
  assert(!box.queue.some((q) => q.kind === "heartbeat"), "stale heartbeats dropped under v1 (would fake live presence)");
  assert(box.queue.find((q) => q.id === "idle:s_1:1")?.state === "parked", "idle parked until v2 exists");
  assert(S.status().level === "ok" && S.status().parked >= 1, "indicator green; parked counted separately");
  assert(box.queue.some((q) => q.kind === "idle" && q.id !== "idle:s_1:1"), "real idle detected after 5 min without input");
  assert(ntfyCalls.some((u) => alertTitle(u) === "SINK HERSTEL"), "recovery notice to Pa");
  const v2Probes = rpcCalls.filter((c) => c.name === "wallie_ingest_v2").length - probesBefore;
  assert(v2Probes === 1, `v2 probed once, then remembered as missing (got ${v2Probes})`);

  /* 4. Een geweierde gebeurtenis blokkeer nie die res nie */
  rpcReply = async (name, args) =>
    args.p.kind === "memo"
      ? { ok: false, status: 400, error: "invalid input" }
      : name === "wallie_ingest_v2"
        ? { ok: false, missingFunction: true }
        : { ok: true };
  R.memoEvent({ subjectSlug: "wisk", open: true, fileName: "m.pdf" });
  await R.sessionWarn({ warnings: 1, totalWarnings: 1, reason: "Tab weg", subjectSlug: "wisk", leftMs: 1000 });
  await tick(10);
  await S.flush();
  box = S.load();
  assert(box.queue.some((q) => q.kind === "memo" && q.state === "dead"), "bad item set aside (dead), not blocking");
  assert(!box.queue.some((q) => q.id === "warn:s_1:1"), "later warn still delivered");

  /* 5. Hartklop elke 60 s met fokus/sigbaarheid, via v2 sodra dit bestaan */
  rpcReply = async () => ({ ok: true });
  S.update((b) => (b.serverV2 = null));
  const before = rpcCalls.length;
  document.hidden = true;
  fire(listeners.doc, "visibilitychange");
  advance(60000);
  await tick(10);
  await S.flush();
  const hbs = rpcCalls.slice(before).filter((c) => c.args?.p?.kind === "heartbeat");
  assert(hbs.length >= 1 && hbs.at(-1).name === "wallie_ingest_v2", "heartbeat sent via v2 once available");
  assert(hbs.at(-1).args.p.visible === false && hbs.at(-1).args.p.hidden_ms >= 60000, "heartbeat carries visibility + hidden time");
  assert(rpcCalls.slice(before).some((c) => c.args?.p?.kind === "visibility"), "visibility change sent as event");
  document.hidden = false;
  fire(listeners.doc, "visibilitychange");

  /* 6. Gebeurtenis wat tydens ’n stuur-rondte bykom, volg dadelik */
  let release;
  rpcReply = (name, args) => (args?.p?.kind === "unlock" ? new Promise((r) => (release = () => r({ ok: true }))) : Promise.resolve({ ok: true }));
  R.sessionUnlock({ subjectSlug: "wisk", leftMs: 1000, locks: 1 });
  await tick();
  S.enqueue("warn:s_1:9", { kind: "warn", session_id: "s_1", title: "mid-flush" });
  release();
  await tick(15);
  assert(!S.load().queue.some((q) => q.id === "warn:s_1:9" || q.id === "unlock:s_1:1"), "event queued during a flush is sent right after it");
  rpcReply = async () => ({ ok: true });

  await R.sessionLock({ subjectSlug: "wisk", reason: "3 waarskuwings", locks: 2 });
  await tick();
  const lockCall = rpcCalls.find((c) => c.args?.p?.kind === "lock");
  assert(lockCall && lockCall.args.p.status === "locked" && lockCall.args.p.locks === 2, "lock reaches console with status locked");

  await R.sessionEnd({
    sessionId: "s_1",
    subjectSlug: "wisk",
    durationMin: 40,
    actualMs: 2400000,
    plannedMin: 45,
    outcome: "handmatig",
    warnings: 3,
    locks: 1,
    startedAt: now,
    endedAt: now + 2400000,
    block: { id: "b1", title: "Blok", start: "09:00", end: "09:45" }
  });
  await tick();
  const endCall = rpcCalls.find((c) => c.args?.p?.kind === "end");
  assert(endCall && endCall.args.p.event_id === "end:s_1" && endCall.args.p.actual_ms === 2400000, "end report with event id + actual duration");
  assert(endCall.args.p.block_id === "b1", "end carries schedule block");
  assert(!R._hbTimer && !R._listeners, "heartbeat + presence listeners stop after end");
  assert((await R.sendStill("x".repeat(200))).ok === false, "no stills after session end");

  /* 7. Dieselfde einde weer (bv. terugvul) word nie weer gestuur nie */
  assert(S.enqueue("end:s_1", { kind: "end", session_id: "s_1" }) === null, "already-synced event id is not re-queued");

  /* 8. Geen deurlopende waarneming sonder toestemming */
  R.setConsent(false);
  await R.sessionStart({ sessionId: "s_2", subjectSlug: "wisk", minutes: 10, task: "", startedAt: now });
  advance(60000);
  await tick();
  assert(!rpcCalls.some((c) => c.args?.p?.kind === "heartbeat" && c.args.p.session_id === "s_2"), "no heartbeat without consent");
  assert((await R.sendStill("x".repeat(200))).ok === false, "no stills without consent");
  R.pingOffline();

  /* 9. Ou uitboks (wallie911_outbox_v1) word oorgedra met afgeleide event ids */
  sandbox.localStorage.setItem(
    "wallie911_outbox_v1",
    JSON.stringify({ queue: [{ id: "end_1_abc", createdAt: now, payload: { kind: "end", session_id: "s_9", data: { sessionId: "s_9" }, client_at: now } }] })
  );
  rpcReply = async () => ({ ok: false, transient: true, error: "netwerk" });
  S.migrateLegacyOutbox();
  await tick();
  assert(S.load().queue.some((q) => q.id === "end:s_9"), "legacy outbox item migrated as end:s_9");
  assert(sandbox.localStorage.getItem("wallie911_outbox_v1") === null, "legacy outbox cleared after migration");

  console.log(JSON.stringify({ passed, fails: fails.length, failList: fails }, null, 2));
  process.exit(fails.length ? 1 : 0);
})();
