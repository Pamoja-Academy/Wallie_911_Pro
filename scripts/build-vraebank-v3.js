/* Bou assets/js/vraebank-v3.js uit data/vraebank-v3.json en data/vraebank-v3-rubrieke.json
   (geen afhanklikhede nie). Dieselfde patroon as scripts/build-vraebank.js.
   - Deterministies: sleutels alfabeties gesorteer (rekursief), skikkings behou hul volgorde, \n-reëleindes.
   - Die blaaier kry van `bron` NET verwysing, bladsy en memo_bladsy. Die anker-aanhalings (DBE-teks) en
     die lêername bly in data/ vir die vrystellingshek — hulle mag nie in die publieke JS beland nie.
   - `toets` bly wel behoue: die skerm tel die woorde van die voorbeeldantwoord met van/tot.
   Gebruik: npm run build:vraebank-v3
   tests/vraebank-v3.test.js roep build() en eis dat die gegenereerde lêer greep-vir-greep dieselfde is. */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "data", "vraebank-v3.json");
const SRC_RUBRIEKE = path.join(ROOT, "data", "vraebank-v3-rubrieke.json");
const OUT = path.join(ROOT, "assets", "js", "vraebank-v3.js");
const HEADER = "/* GEGENEREER deur scripts/build-vraebank-v3.js – moenie met die hand wysig nie */";
const BRON_KEEP = ["verwysing", "bladsy", "memo_bladsy"];

function sortKeys(v) {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === "object") {
    const o = {};
    for (const k of Object.keys(v).sort()) o[k] = sortKeys(v[k]);
    return o;
  }
  return v;
}

function strip(item) {
  const out = Object.assign({}, item);
  const bron = {};
  for (const k of BRON_KEEP) if (item.bron && k in item.bron) bron[k] = item.bron[k];
  out.bron = bron;
  return out;
}

/* jsonText + rubriekText → inhoud van die gegenereerde JS-lêer (string) */
function build(jsonText, rubriekText) {
  const items = JSON.parse(jsonText);
  if (!Array.isArray(items)) throw new Error("data/vraebank-v3.json moet 'n skikking wees");
  const rubrieke = JSON.parse(rubriekText);
  if (!rubrieke || typeof rubrieke !== "object" || Array.isArray(rubrieke)) {
    throw new Error("data/vraebank-v3-rubrieke.json moet 'n voorwerp wees");
  }
  const body = JSON.stringify(sortKeys(items.map(strip)), null, 2);
  const rub = JSON.stringify(sortKeys(rubrieke), null, 2);
  return `${HEADER}\nwindow.VRAEBANK_V3 = ${body};\nwindow.VRAEBANK_V3_RUBRIEKE = ${rub};\n`;
}

module.exports = { build, SRC, SRC_RUBRIEKE, OUT };

if (require.main === module) {
  const js = build(fs.readFileSync(SRC, "utf8"), fs.readFileSync(SRC_RUBRIEKE, "utf8"));
  fs.writeFileSync(OUT, js, "utf8");
  console.log(`geskryf: ${path.relative(ROOT, OUT)} (${Buffer.byteLength(js)} grepe)`);
}
