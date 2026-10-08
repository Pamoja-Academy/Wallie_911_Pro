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

for (const rel of ["assets/js/proctor.js", "assets/js/remote.js"]) {
  vm.runInNewContext(fs.readFileSync(path.join(root, rel), "utf8"), sandbox, { filename: rel });
}
const P = sandbox.WALLIE.proctor;
const R = sandbox.WALLIE.REMOTE;

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

/* ---------- Uitboks → Pa-konsole ---------- */
(async () => {
  assert(R.outboxLoad().queue.length === 0, "outbox starts empty (no invented items)");
  const rpcCalls = [];
  const ntfyCalls = [];
  let rpcReply = async () => {
    throw new Error("Failed to fetch");
  };
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

  await R.sessionStart({ sessionId: "s_1", subjectSlug: "wisk", minutes: 45, task: "V1", startedAt: now });
  await new Promise((r) => setImmediate(r));
  let box = R.outboxLoad();
  assert(box.queue.length === 1 && box.queue[0].payload.kind === "start", "offline: start event kept in outbox");
  assert(box.queue[0].payload.session_id === "s_1" && box.queue[0].payload.planned_min === 45, "start payload carries live fields");
  assert(ntfyCalls.length === 1, "start still pushes to ntfy once");

  rpcReply = async () => ({ ok: true });
  advance(15000);
  await new Promise((r) => setImmediate(r));
  const hb = rpcCalls.filter((c) => c.args?.p?.kind === "heartbeat");
  assert(hb.length >= 1 && hb.at(-1).args.p.session_id === "s_1", "heartbeat goes to Pa-konsole every 15s");
  assert(ntfyCalls.length === 1, "heartbeats no longer spend the ntfy daily quota");

  advance(5 * 60 * 1000);
  await R.flushOutbox();
  box = R.outboxLoad();
  assert(box.queue.length === 0 && box.sentCount === 1, "outbox delivers once back online");

  await R.sessionLock({ subjectSlug: "wisk", reason: "3 waarskuwings", locks: 1 });
  await new Promise((r) => setImmediate(r));
  const lockCall = rpcCalls.find((c) => c.args?.p?.kind === "lock");
  assert(lockCall && lockCall.args.p.status === "locked" && lockCall.args.p.locks === 1, "lock reaches console with status locked");

  await R.sessionEnd({ subjectSlug: "wisk", durationMin: 40, plannedMin: 45, outcome: "handmatig", warnings: 3, locks: 1 });
  await new Promise((r) => setImmediate(r));
  const endCall = rpcCalls.find((c) => c.args?.p?.kind === "end");
  assert(endCall && endCall.args.p.outcome === "handmatig" && endCall.args.p.total_warnings === 3, "end report stored durably");
  assert(!R._hbTimer, "heartbeat stops after end");
  const stillRes = await R.sendStill("x".repeat(200));
  assert(stillRes.ok === false, "no stills after session end");

  R.setConsent(false);
  await R.sessionStart({ sessionId: "s_2", subjectSlug: "wisk", minutes: 10, task: "", startedAt: now });
  advance(15000);
  await new Promise((r) => setImmediate(r));
  assert(!rpcCalls.some((c) => c.args?.p?.kind === "heartbeat" && c.args.p.session_id === "s_2"), "no heartbeat without consent");
  assert((await R.sendStill("x".repeat(200))).ok === false, "no stills without consent");
  R.stopHeartbeat();

  console.log(JSON.stringify({ passed, fails: fails.length, failList: fails }, null, 2));
  process.exit(fails.length ? 1 : 0);
})();
