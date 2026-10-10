/* Vraebank RTT V1: skema, mengsel, bron-formaat, punte en gegenereerde JS in pas met die JSON.
   `node tests/vraebank.test.js` */
const fs = require("fs");
const vm = require("vm");
const { build, SRC, OUT } = require("../scripts/build-vraebank");

const fails = [];
let passed = 0;
function assert(cond, msg) {
  if (cond) passed += 1;
  else fails.push(msg);
}

const jsonText = fs.readFileSync(SRC, "utf8");
const items = JSON.parse(jsonText);

/* Dieselfde velde as scripts/qa/item_gate.py G1 */
const REQ = {
  id: "string", vak: "string", vraestel: "int", onderwerp: "string", vlak: "int", tipe: "string", punte: "int",
  vraag: "string", antwoord: "string", verduideliking: "string", nasienriglyn: "list", bron: "dict", toets: "dict"
};
const TIPES = ["formule", "stappe", "kode", "kort", "meerkeuse"];
const TOP = { woordverwerking: 8, sigblad: 10, databasis: 6, html: 4, algemeen: 2 };
const LVL = { 1: 9, 2: 12, 3: 9 };
const VERWYSING = /^DBE (Jan|Feb|Mrt|Feb\/Mrt|Apr|Mei|Junie|Julie|Aug|Sep|Okt|Nov|Des) 20\d\d V1 V\d+(\.\d+){1,2}$/;

function typeOk(v, t) {
  if (t === "string") return typeof v === "string" && v.length > 0;
  if (t === "int") return Number.isInteger(v);
  if (t === "list") return Array.isArray(v) && v.length > 0;
  if (t === "dict") return v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length > 0;
  return false;
}

/* ---------- skema ---------- */
assert(Array.isArray(items), "data is 'n skikking");
assert(items.length === 30, `30 items (kry ${items.length})`);
for (const it of items) {
  const id = it.id || "?";
  for (const [k, t] of Object.entries(REQ)) assert(typeOk(it[k], t), `${id}: G1 veld ontbreek/verkeerd: ${k}`);
  assert(/^rtt-v1-[A-Z]\d{2}$/.test(id), `${id}: id-formaat rtt-v1-<slot>`);
  assert(it.vak === "rtt", `${id}: vak rtt`);
  assert(it.vraestel === 1, `${id}: vraestel 1`);
  assert(TIPES.includes(it.tipe), `${id}: tipe bekend (${it.tipe})`);
  assert(it.onderwerp in TOP, `${id}: onderwerp bekend (${it.onderwerp})`);
  assert([1, 2, 3].includes(it.vlak), `${id}: vlak 1-3`);
  for (const n of it.nasienriglyn || []) {
    assert(typeof n.kriterium === "string" && n.kriterium.length > 0, `${id}: nasienriglyn.kriterium`);
    assert(Number.isInteger(n.punte) && n.punte > 0, `${id}: nasienriglyn.punte heelgetal > 0`);
  }
  const sum = (it.nasienriglyn || []).reduce((s, n) => s + (Number(n.punte) || 0), 0);
  assert(sum === it.punte, `${id}: punte (${it.punte}) == som van nasienriglyn (${sum})`);
  const b = it.bron || {};
  assert(VERWYSING.test(b.verwysing || ""), `${id}: bron.verwysing formaat "DBE <Maand> <Jaar> V1 V<nr>" (kry "${b.verwysing}")`);
  assert(Number.isInteger(b.bladsy) && b.bladsy > 0, `${id}: bron.bladsy`);
  assert(Number.isInteger(b.memo_bladsy) && b.memo_bladsy > 0, `${id}: bron.memo_bladsy`);
}

/* ---------- unieke ids + mengsel ---------- */
const ids = items.map((i) => i.id);
assert(new Set(ids).size === 30, `30 unieke ids (kry ${new Set(ids).size})`);
const count = (f) => items.reduce((m, i) => ((m[i[f]] = (m[i[f]] || 0) + 1), m), {});
assert(JSON.stringify(count("onderwerp"), Object.keys(TOP)) === JSON.stringify(TOP, Object.keys(TOP)), `onderwerpe 8/10/6/4/2 (kry ${JSON.stringify(count("onderwerp"))})`);
const lv = count("vlak");
assert(lv[1] === 9 && lv[2] === 12 && lv[3] === 9 && Object.keys(lv).length === 3, `vlakke 9/12/9 (kry ${JSON.stringify(lv)})`);

/* ---------- gegenereerde JS ---------- */
const onDisk = fs.readFileSync(OUT);
const fresh = Buffer.from(build(jsonText), "utf8");
assert(onDisk.equals(fresh), "assets/js/vraebank-rtt-v1.js is greep-vir-greep gelyk aan 'n vars bou (hardloop: npm run build:vraebank)");
assert(build(jsonText) === build(jsonText), "bou is deterministies");
const text = onDisk.toString("utf8");
assert(text.startsWith("/* GEGENEREER deur scripts/build-vraebank.js – moenie met die hand wysig nie */\nwindow.VRAEBANK_RTT_V1 = "), "kopreël + window.VRAEBANK_RTT_V1");
assert(!text.includes("\r"), "net \\n-reëleindes");
assert(!/anker_/.test(text), "geen anker_-velde in die gegenereerde JS");
assert(!/vraestel_leer|memo_leer/.test(text), "geen lêername van DBE-PDF's in die gegenereerde JS");

const sandbox = { window: {} };
vm.runInNewContext(text, sandbox, { filename: "vraebank-rtt-v1.js" });
const gen = sandbox.window.VRAEBANK_RTT_V1;
assert(Array.isArray(gen) && gen.length === 30, "gegenereerde JS laai 30 items");
if (Array.isArray(gen)) {
  gen.forEach((g, i) => {
    const src = items[i];
    assert(g.id === src.id, `${src.id}: volgorde behou`);
    assert(JSON.stringify(Object.keys(g.bron).sort()) === JSON.stringify(["bladsy", "memo_bladsy", "verwysing"]), `${src.id}: bron het net verwysing/bladsy/memo_bladsy`);
    assert(g.bron.verwysing === src.bron.verwysing && g.bron.bladsy === src.bron.bladsy && g.bron.memo_bladsy === src.bron.memo_bladsy, `${src.id}: bron-waardes ongeskonde`);
    const { bron: _a, ...restGen } = g;
    const { bron: _b, ...restSrc } = src;
    const canon = (o) => JSON.stringify(o, (k, v) => (v && typeof v === "object" && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map((x) => [x, v[x]])) : v));
    assert(canon(restGen) === canon(restSrc), `${src.id}: al die ander velde ongeskonde`);
  });
}

if (fails.length) {
  console.error(`vraebank: ${passed} geslaag, ${fails.length} FAAL`);
  fails.forEach((f) => console.error("  FAAL:", f));
  process.exit(1);
}
console.log(`vraebank: ${passed} geslaag, 0 faal`);
