/* Smoke: load scripts in Node order and exercise core APIs */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const fails = [];
const ok = [];

function assert(cond, msg) {
  if (cond) ok.push(msg);
  else fails.push(msg);
}

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
assert(html.includes('id="view-missie"') || html.includes("Missie"), "index has Missie");
assert(html.includes("Probleem") || html.includes("bug"), "index has Probleem");
assert(html.includes("survey") || html.includes("Opname") || html.includes("Wallie"), "index has survey UI");
assert(fs.existsSync(path.join(root, "START-HIER.bat")), "START-HIER.bat exists");
assert(fs.existsSync(path.join(root, "pa-briefing.html")), "pa-briefing.html exists");

const store = {};
const sandbox = {
  console,
  Date,
  Math,
  JSON,
  Array,
  Object,
  String,
  Number,
  Boolean,
  parseInt,
  parseFloat,
  isNaN,
  encodeURIComponent,
  decodeURIComponent,
  setTimeout,
  clearTimeout,
  localStorage: {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => {
      store[k] = String(v);
    },
    removeItem: (k) => {
      delete store[k];
    },
  },
  document: {
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: () => null,
    addEventListener: () => {},
  },
  window: {},
  navigator: { mediaDevices: undefined },
  WALLIE: {},
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;

const order = [
  "assets/js/data.js",
  "assets/js/storage.js",
  "assets/js/schedule.js",
  "assets/js/surveys.js",
  "assets/js/proctor.js",
  "assets/js/live-config.js",
  "assets/js/sync.js",
  "assets/js/remote.js",
  "assets/js/lessons.js",
];

for (const rel of order) {
  const code = fs.readFileSync(path.join(root, rel), "utf8");
  try {
    vm.runInNewContext(code, sandbox, { filename: rel });
    ok.push(`parse ${rel}`);
  } catch (e) {
    fails.push(`parse ${rel}: ${e.message}`);
  }
}

const W = sandbox.WALLIE;
assert(W && Array.isArray(W.SUBJECTS) && W.SUBJECTS.length >= 5, "SUBJECTS loaded");
assert(typeof W.storage?.load === "function", "storage.load");
assert(typeof W.buildDayPlan === "function", "buildDayPlan");

if (typeof W.buildDayPlan === "function") {
  const plan = W.buildDayPlan("2026-09-27");
  assert(plan && Array.isArray(plan.blocks) && plan.blocks.length > 0, "day plan has blocks");
  const hasBreak = plan.blocks.some((b) => b.kind === "break");
  assert(hasBreak, "Sunday plan has rugby break");
  const study = plan.blocks.filter((b) => b.kind !== "break");
  assert(study.length >= 2, "at least 2 study blocks");

  for (const d of ["2026-10-08", "2026-10-09", "2026-10-10", "2026-10-11"]) {
    const p = W.buildDayPlan(d);
    const eng = p.blocks.find((b) => b.subjectSlug === "engels");
    const toe = p.blocks.find((b) => b.subjectSlug === "toerisme");
    assert(eng && eng.minutes >= 40 && eng.minutes <= 50, `${d} Engels 40–50 min`);
    assert(toe && toe.minutes >= 20 && toe.minutes <= 30, `${d} Toerisme 20–30 min`);
  }
  const rotated = ["2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16"].map((d) =>
    W.buildDayPlan(d).blocks.find((b) => b.id.endsWith("-geel"))?.subjectSlug
  );
  assert(new Set(rotated).size === 2 && !rotated.includes("rtt"), "geel rotates Engels / Toerisme after kickoff");
  for (const d of ["2026-10-10", "2026-10-11", "2026-10-12"]) {
    const g = W.buildDayPlan(d).blocks.find((b) => b.id === `${d}-geel`);
    assert(g && g.subjectSlug === "rtt" && g.kind === "rooi" && g.title === "RTT V1 — praktiese oefening (Oefenvrae)", `${d} geel-blok is RTT V1`);
  }
  let loBlocks = 0;
  for (let t = Date.parse("2026-09-27T12:00:00Z"); t <= Date.parse("2026-11-30T12:00:00Z"); t += 86400000) {
    const d = new Date(t).toISOString().slice(0, 10);
    loBlocks += W.buildDayPlan(d).blocks.filter((b) => b.subjectSlug === "lo").length;
  }
  assert(loBlocks === 0, "geen blok met subjectSlug lo van 27 Sep tot 30 Nov");
  assert(!W.SUBJECTS.some((s) => s.slug === "lo"), "geen lo-vak in SUBJECTS");
}

assert(html.includes("js-export-log"), "export log button");
assert(html.includes("wallie911_v2_bok"), "export names storage key");
assert(html.includes("hannovz@gmail.com"), "export names Pa email");

assert(html.includes('id="les-viewer"'), "index has lesson viewer");
assert(html.includes('id="view-leer"'), "index has Lesse view");
assert(html.includes("assets/js/lesson-ui.js"), "index loads lesson-ui.js");
assert(html.indexOf("assets/js/sync.js") > -1 && html.indexOf("assets/js/sync.js") < html.indexOf("assets/js/remote.js"), "index loads sync.js before remote.js");
assert(html.includes('id="sync-pill"'), "index has sync indicator");
if (W.LESSONS && Array.isArray(W.SUBJECTS)) {
  const imgDir = path.join(root, "assets/img/lessons");
  for (const slug of [...W.SUBJECTS.map((s) => s.slug), "foutbank"]) {
    const les = W.LESSONS[slug];
    assert(les && les.concepts.length >= 3, `${slug} has >=3 visual concepts`);
    assert(fs.existsSync(path.join(imgDir, slug, "cover.svg")), `${slug} cover.svg exists`);
    for (const c of les?.concepts || []) {
      assert(fs.existsSync(path.join(imgDir, slug, `${c.id}.svg`)), `${slug}/${c.id}.svg exists`);
      assert(c.cues.length >= 2 && c.cues.length <= 4 && c.memo.length > 0, `${slug}/${c.id} has 2-4 cues + memo`);
    }
  }
} else {
  fails.push("WALLIE.LESSONS loaded");
}

if (W.storage) {
  const st = W.storage.load();
  st.faults = st.faults || [];
  st.faults.push({ id: "t1", subject: "wisk", text: "smoke", resolved: false });
  W.storage.save(st);
  const st2 = W.storage.load();
  assert(st2.faults.some((f) => f.id === "t1"), "localStorage roundtrip");
}

if (W.surveys || W.buildSurvey || W.SURVEYS) {
  ok.push("surveys module present");
} else if (sandbox.WALLIE && Object.keys(sandbox.WALLIE).some((k) => /survey/i.test(k))) {
  ok.push("survey keys on WALLIE");
} else {
  // surveys.js may attach differently
  const surveyCode = fs.readFileSync(path.join(root, "assets/js/surveys.js"), "utf8");
  assert(surveyCode.includes("Wallie") || surveyCode.includes("wallie"), "surveys.js mentions Wallie");
  assert(surveyCode.includes("Pa") || surveyCode.includes("pa"), "surveys.js mentions Pa");
}

/* START-HIER.bat maak net die lewendige weergawe oop (geen plaaslike kopie / Node meer nie) */
const bat = fs.readFileSync(path.join(root, "START-HIER.bat"), "utf8");
assert(bat.includes('start "" "https://pamoja-academy.github.io/Wallie_911_Pro/#missie"'), "bat opens the live #missie URL");
assert(!/\b(node|npx|serve|localhost)\b/i.test(bat), "bat no longer serves a local copy");

/* Hanno: Wallie word NIE weer om toestemming gevra nie — die sleutel bly dieselfde */
const remoteSrc = fs.readFileSync(path.join(root, "assets/js/remote.js"), "utf8");
assert(remoteSrc.includes('consentKey: "wallie911_remote_consent_v2"'), "consent key unchanged (no re-ask)");

/* Eerste egte vraestel = RTT/CAT praktiese, Di 13 Okt; Ma 12 Okt is die laaste voorbereidingsdag */
assert(W.EXAM_START === "2026-10-13" && W.EXAM_KICKOFF.startsWith("2026-10-13"), "countdown targets Tue 13 Oct (CAT practical)");
assert(W.EXAM_PERIOD_START === "2026-10-13", "exam period starts with the RTT practical on Tue 13 Oct");

/* Die zip is .gitignore'd (net op Pa se masjien) — toets dit net as dit bestaan */
const zipPath = path.join(root, "Wallie_911_Pro-VIR-SY-LAPTOP.zip");
if (fs.existsSync(zipPath)) assert(fs.statSync(zipPath).size > 10000, "laptop zip >10KB");
else ok.push("laptop zip nie in hierdie kloon nie (gitignored) — oorgeslaan");

console.log(JSON.stringify({ ok: ok.length, fails: fails.length, failList: fails, sampleOk: ok.slice(0, 12) }, null, 2));
process.exit(fails.length ? 1 : 0);
