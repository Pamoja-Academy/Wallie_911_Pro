/* V3-skryfwerk-vraebank (Engels EAT V3 + Afrikaans HT V3): skema, rubrieke, woordtellings en die
   gegenereerde JS in pas met die JSON. Die items self word NOOIT hier reggemaak nie — 'n faal wat uit
   die inhoud van 'n item kom, is 'n harde stop vir die mens wat die toets lees.
   `node tests/vraebank-v3.test.js` */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { build, SRC, SRC_RUBRIEKE, OUT } = require("../scripts/build-vraebank-v3");
const rtt = require("../scripts/build-vraebank");

const fails = [];
let passed = 0;
function assert(cond, msg) {
  if (cond) passed += 1;
  else fails.push(msg);
}

const jsonText = fs.readFileSync(SRC, "utf8");
const rubriekText = fs.readFileSync(SRC_RUBRIEKE, "utf8");
const items = JSON.parse(jsonText);
const rubrieke = JSON.parse(rubriekText);

/* ---------- verwagtinge uit die spesifikasie ---------- */

const REQ = {
  id: "string", vak: "string", vraestel: "int", afdeling: "string", onderwerp: "string", teksoort: "string",
  tipe: "string", punte: "int", woorde: "dict", tyd_min: "int", rubriek: "string", vraag: "string",
  beplanning: "list", formaat: "list", antwoord: "string", verduideliking: "string", nasienriglyn: "list",
  bron: "dict", toets: "dict"
};

/* vak → afdeling → { punte, min, max, tyd_min, rubriek, onderwerpe } */
const AFDELINGS = {
  engels: {
    A: { punte: 50, min: 250, max: 300, tyd_min: 80, rubriek: "eat-essay-50", onderwerp: "essay" },
    B: { punte: 30, min: 120, max: 150, tyd_min: 40, rubriek: "eat-longer-30", onderwerp: "longer-transactional" },
    C: { punte: 20, min: 80, max: 100, tyd_min: 30, rubriek: "eat-shorter-20", onderwerp: "shorter-transactional" }
  },
  afrikaans: {
    A: { punte: 50, min: 400, max: 450, tyd_min: 100, rubriek: "ht-opstel-50", onderwerp: "opstel" },
    B: { punte: 25, min: 180, max: 200, tyd_min: 40, rubriek: "ht-transaksioneel-25", onderwerp: "transaksioneel" }
  }
};

/* Die mengsel wat die vrystellingshek vereis: 3 Engelse opstelle, 2 langer, 2 korter; 2 Afrikaanse
   opstelle, 5 transaksioneel. */
const MENGSEL = { "engels:A": 3, "engels:B": 2, "engels:C": 2, "afrikaans:A": 2, "afrikaans:B": 5 };

/* Die woordtellings is buite hierdie sessie nagegaan; hulle moet presies reproduseer. */
const WOORDE = {
  "eng-v3-A1": 281, "eng-v3-A2": 280, "eng-v3-A3": 278, "eng-v3-B1": 139, "eng-v3-B2": 139,
  "eng-v3-C1": 92, "eng-v3-C2": 93, "afr-v3-A1": 437, "afr-v3-A2": 431, "afr-v3-B1": 187,
  "afr-v3-B2": 184, "afr-v3-B3": 197, "afr-v3-B4": 196, "afr-v3-B5": 190
};

const VERWYSING = /^DBE (Nov|Junie) 20\d\d (EAT|HT) V3 V[123]\.\d+$/;
const ID = { engels: /^eng-v3-([ABC])([1-9]\d*)$/, afrikaans: /^afr-v3-([AB])([1-9]\d*)$/ };

function typeOk(v, t) {
  if (t === "string") return typeof v === "string" && v.length > 0;
  if (t === "int") return Number.isInteger(v);
  if (t === "list") return Array.isArray(v) && v.length > 0;
  if (t === "dict") return v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length > 0;
  return false;
}

/* Woordtelling presies soos die skerm dit doen: normaliseer, soek van met indexOf en tot met lastIndexOf. */
function normaliseer(s) {
  return String(s)
    .replace(/[’‘ꞌ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function woordtelling(antwoord, van, tot) {
  const a = normaliseer(antwoord);
  const v = normaliseer(van);
  const t = normaliseer(tot);
  const i = a.indexOf(v);
  const j = a.lastIndexOf(t);
  if (i < 0 || j < 0 || j + t.length < i) return null;
  return a.slice(i, j + t.length).split(" ").filter(Boolean).length;
}

/* ---------- skema ---------- */
assert(Array.isArray(items), "data is 'n skikking");
assert(items.length === 14, `14 items (kry ${items.length})`);
assert(new Set(items.map((i) => i.id)).size === items.length, "elke id kom net een keer voor");

const telMengsel = {};
for (const it of items) {
  const id = it.id || "?";
  for (const [k, t] of Object.entries(REQ)) assert(typeOk(it[k], t), `${id}: veld ontbreek/verkeerd: ${k}`);
  assert(it.vraestel === 3, `${id}: vraestel 3`);
  assert(it.tipe === "skryf", `${id}: tipe skryf`);
  assert(it.vak === "engels" || it.vak === "afrikaans", `${id}: vak engels of afrikaans (${it.vak})`);

  const pat = ID[it.vak];
  const m = pat ? pat.exec(id) : null;
  assert(!!m, `${id}: id-formaat pas by ${it.vak}`);
  if (m) assert(m[1] === it.afdeling, `${id}: die id se afdeling is ${it.afdeling}`);

  const spec = (AFDELINGS[it.vak] || {})[it.afdeling];
  assert(!!spec, `${id}: afdeling ${it.afdeling} bestaan vir ${it.vak}`);
  if (spec) {
    assert(it.punte === spec.punte, `${id}: ${spec.punte} punte (kry ${it.punte})`);
    assert(it.woorde.min === spec.min && it.woorde.max === spec.max, `${id}: ${spec.min}–${spec.max} woorde`);
    assert(it.tyd_min === spec.tyd_min, `${id}: ${spec.tyd_min} min`);
    assert(it.rubriek === spec.rubriek, `${id}: rubriek ${spec.rubriek}`);
    assert(it.onderwerp === spec.onderwerp, `${id}: onderwerp ${spec.onderwerp} (kry ${it.onderwerp})`);
  }
  telMengsel[`${it.vak}:${it.afdeling}`] = (telMengsel[`${it.vak}:${it.afdeling}`] || 0) + 1;

  assert(it.formaat.length >= 4 && it.formaat.length <= 8, `${id}: formaat 4–8 inskrywings (kry ${it.formaat.length})`);
  assert(it.beplanning.length >= 2 && it.beplanning.length <= 5, `${id}: beplanning 2–5 inskrywings (kry ${it.beplanning.length})`);
  assert(it.formaat.every((s) => typeof s === "string" && s.length > 0), `${id}: formaat is stringe`);
  assert(it.beplanning.every((s) => typeof s === "string" && s.length > 0), `${id}: beplanning is stringe`);

  /* nasienriglyn = presies die rubriek se kriteria (naam, punte, volgorde) */
  const r = rubrieke[it.rubriek];
  assert(!!r, `${id}: rubriek ${it.rubriek} bestaan`);
  if (r) {
    const verwag = r.kriteria.map((c) => ({ kriterium: c.kriterium, punte: c.punte }));
    assert(
      JSON.stringify(it.nasienriglyn) === JSON.stringify(verwag),
      `${id}: nasienriglyn stem met die rubriek se kriteria ooreen`
    );
  }
  const som = it.nasienriglyn.reduce((s, c) => s + (c && Number.isInteger(c.punte) ? c.punte : NaN), 0);
  assert(som === it.punte, `${id}: nasienriglyn tel op na ${it.punte} (kry ${som})`);

  /* bron */
  assert(VERWYSING.test(it.bron.verwysing || ""), `${id}: bron.verwysing formaat (${it.bron.verwysing})`);
  assert(Number.isInteger(it.bron.bladsy) && it.bron.bladsy > 0, `${id}: bron.bladsy positiewe heelgetal`);
  assert(Number.isInteger(it.bron.memo_bladsy) && it.bron.memo_bladsy > 0, `${id}: bron.memo_bladsy positiewe heelgetal`);
  /* Die ankers is bronverwysings, nie iteminhoud nie: lank genoeg om die plek op die DBE-bladsy te vind,
     maar hoogstens 8 opeenvolgende woorde DBE-teks (kopiereg; die repo is publiek). */
  for (const veld of ["anker_vraag", "anker_memo"]) {
    const a = it.bron[veld];
    assert(typeof a === "string" && a.length >= 20, `${id}: ${veld} ≥ 20 karakters`);
    const w = typeof a === "string" ? a.trim().split(/\s+/).length : Infinity;
    assert(w <= 8, `${id}: ${veld} hoogstens 8 woorde (kry ${w})`);
  }
  assert(typeof it.bron.vraestel_leer === "string" && it.bron.vraestel_leer.length > 0, `${id}: vraestel_leer`);
  assert(typeof it.bron.memo_leer === "string" && it.bron.memo_leer.length > 0, `${id}: memo_leer`);
  assert(it.bron.verwysing.includes(it.vak === "engels" ? "EAT" : "HT"), `${id}: bron se taal pas by die vak`);

  /* woordtelling van die voorbeeldantwoord */
  const wt = it.toets && it.toets.woordtelling;
  assert(wt && typeof wt.van === "string" && typeof wt.tot === "string", `${id}: toets.woordtelling van/tot`);
  const n = wt ? woordtelling(it.antwoord, wt.van, wt.tot) : null;
  assert(n !== null, `${id}: die van/tot-merkers kom in die antwoord voor`);
  if (n !== null) {
    assert(n === WOORDE[id], `${id}: woordtelling ${WOORDE[id]} (kry ${n}) — INHOUD, nie die toets nie`);
    assert(n >= it.woorde.min && n <= it.woorde.max, `${id}: woordtelling binne ${it.woorde.min}–${it.woorde.max} (kry ${n})`);
  }
}

for (const [sleutel, aantal] of Object.entries(MENGSEL)) {
  assert(telMengsel[sleutel] === aantal, `mengsel ${sleutel}: ${aantal} items (kry ${telMengsel[sleutel] || 0})`);
}

/* ---------- rubrieke ---------- */
assert(Object.keys(rubrieke).length === 5, `5 rubrieke (kry ${Object.keys(rubrieke).length})`);
for (const [sleutel, r] of Object.entries(rubrieke)) {
  assert(typeof r.naam === "string" && r.naam.length > 0, `${sleutel}: naam`);
  assert(Array.isArray(r.kriteria) && r.kriteria.length >= 2, `${sleutel}: minstens 2 kriteria`);
  const totaal = Number(/(\d+)/.exec(sleutel.split("-").pop())[1]);
  const som = r.kriteria.reduce((s, c) => s + (Number.isInteger(c.punte) ? c.punte : NaN), 0);
  assert(som === totaal, `${sleutel}: kriteria tel op na ${totaal} (kry ${som})`);
  for (const c of r.kriteria) {
    assert(typeof c.kriterium === "string" && c.kriterium.length > 0, `${sleutel}: kriterium het 'n naam`);
    assert(Array.isArray(c.bande) && c.bande.length >= 3, `${sleutel}/${c.kriterium}: minstens 3 bande`);
    for (const b of c.bande) {
      assert(typeof b.vlak === "string" && b.vlak.length > 0, `${sleutel}/${c.kriterium}: band het 'n vlak`);
      assert(typeof b.punte === "string" && b.punte.length > 0, `${sleutel}/${c.kriterium}: band het 'n puntereeks`);
      assert(typeof b.kern === "string" && b.kern.length > 0, `${sleutel}/${c.kriterium}: band het 'n beskrywing`);
    }
  }
}

/* Elke rubriek word deur minstens een item gebruik */
for (const sleutel of Object.keys(rubrieke)) {
  assert(items.some((i) => i.rubriek === sleutel), `rubriek ${sleutel} word gebruik`);
}

/* ---------- gegenereerde JS ---------- */
const gegenereer = build(jsonText, rubriekText);
const opSkyf = fs.readFileSync(OUT, "utf8");
assert(opSkyf === gegenereer, "assets/js/vraebank-v3.js is presies wat die bouskrif nou maak (hardloop npm run build:vraebank-v3)");
assert(gegenereer === build(jsonText, rubriekText), "die bouskrif is deterministies");
assert(gegenereer.startsWith("/* GEGENEREER deur scripts/build-vraebank-v3.js"), "koplyn waarsku teen handwysigings");
assert(!gegenereer.includes("\r"), "net \\n-reëleindes");
assert(gegenereer.endsWith("\n"), "eindig met 'n nuwe reël");
for (const verbode of ["anker_vraag", "anker_memo", "vraestel_leer", "memo_leer"]) {
  assert(!gegenereer.includes(verbode), `geen ${verbode} in die gegenereerde JS (DBE-teks bly in data/)`);
}

/* Laai die gegenereerde lêer soos die blaaier dit laai */
const sandbox = { window: {} };
sandbox.window.window = sandbox.window;
vm.createContext(sandbox);
vm.runInContext(gegenereer, sandbox, { filename: "assets/js/vraebank-v3.js" });
const V3 = sandbox.window.VRAEBANK_V3;
const V3R = sandbox.window.VRAEBANK_V3_RUBRIEKE;
assert(Array.isArray(V3) && V3.length === 14, "die gegenereerde JS gee 14 items");
assert(V3R && Object.keys(V3R).length === 5, "die gegenereerde JS gee 5 rubrieke");
assert(
  JSON.stringify(V3.map((i) => i.id)) === JSON.stringify(items.map((i) => i.id)),
  "dieselfde items in dieselfde volgorde as die JSON"
);
V3.forEach((gen, n) => {
  const src = items[n];
  assert(JSON.stringify(Object.keys(gen.bron).sort()) === JSON.stringify(["bladsy", "memo_bladsy", "verwysing"]), `${src.id}: bron in die blaaier het net verwysing, bladsy en memo_bladsy`);
  assert(gen.toets && gen.toets.woordtelling && gen.toets.woordtelling.van === src.toets.woordtelling.van, `${src.id}: toets bly behoue vir die woordtelling op die skerm`);
  const { bron: _g, ...restGen } = gen;
  const { bron: _b, ...restSrc } = src;
  const canon = (o) => JSON.stringify(o, (k, v) => (v && typeof v === "object" && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map((x) => [x, v[x]])) : v));
  assert(canon(restGen) === canon(restSrc), `${src.id}: al die ander velde ongeskonde`);
});
assert(canonGelyk(V3R, rubrieke), "die rubrieke in die blaaier is dieselfde as in data/");

function canonGelyk(a, b) {
  const canon = (o) => JSON.stringify(o, (k, v) => (v && typeof v === "object" && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map((x) => [x, v[x]])) : v));
  return canon(a) === canon(b);
}

/* ---------- die RTT-bank bly onaangeraak ---------- */
const rttOut = fs.readFileSync(rtt.OUT, "utf8");
assert(rttOut === rtt.build(fs.readFileSync(rtt.SRC, "utf8")), "assets/js/vraebank-rtt-v1.js is steeds greep-identies aan 'n vars RTT-bou");

/* ---------- geen DBE-lêer in die repo ---------- */
const ROOT = path.join(__dirname, "..");
const VERBODE_LEER = /\.(pdf|docx?|xlsx?|rtf)$/i;
function loop(dir, uit) {
  for (const naam of fs.readdirSync(dir)) {
    if (naam === ".git" || naam === "node_modules" || naam === "test-artifacts") continue;
    const vol = path.join(dir, naam);
    if (fs.statSync(vol).isDirectory()) loop(vol, uit);
    else if (VERBODE_LEER.test(naam)) uit.push(path.relative(ROOT, vol));
  }
  return uit;
}
const lekkasie = loop(ROOT, []);
assert(lekkasie.length === 0, `geen DBE-vraestel of -memo in die repo (kry: ${lekkasie.join(", ")})`);

if (fails.length) {
  console.error(`vraebank-v3: ${passed} geslaag, ${fails.length} FAAL`);
  fails.forEach((f) => console.error("  FAAL:", f));
  process.exit(1);
}
console.log(`vraebank-v3: ${passed} geslaag, 0 faal`);
