/* Bou assets/js/vraebank-rtt-v1.js uit data/vraebank-rtt-v1.json (geen afhanklikhede nie).
   - Deterministies: sleutels alfabeties gesorteer (rekursief), skikkings behou hul volgorde, \n-reëleindes.
   - Die blaaier kry van `bron` NET verwysing, bladsy en memo_bladsy. Die anker-aanhalings (DBE-teks) en
     lêername bly in data/ vir die vrystellingshek (scripts/qa/item_gate.py).
   Gebruik: npm run build:vraebank
   tests/vraebank.test.js roep build() en eis dat die gegenereerde lêer greep-vir-greep dieselfde is. */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "data", "vraebank-rtt-v1.json");
const OUT = path.join(ROOT, "assets", "js", "vraebank-rtt-v1.js");
const HEADER = "/* GEGENEREER deur scripts/build-vraebank.js – moenie met die hand wysig nie */";
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

/* jsonText → inhoud van die gegenereerde JS-lêer (string) */
function build(jsonText) {
  const items = JSON.parse(jsonText);
  if (!Array.isArray(items)) throw new Error("data/vraebank-rtt-v1.json moet 'n skikking wees");
  const body = JSON.stringify(sortKeys(items.map(strip)), null, 2);
  return `${HEADER}\nwindow.VRAEBANK_RTT_V1 = ${body};\n`;
}

module.exports = { build, SRC, OUT };

if (require.main === module) {
  const js = build(fs.readFileSync(SRC, "utf8"));
  fs.writeFileSync(OUT, js, "utf8");
  console.log(`geskryf: ${path.relative(ROOT, OUT)} (${Buffer.byteLength(js)} grepe)`);
}
