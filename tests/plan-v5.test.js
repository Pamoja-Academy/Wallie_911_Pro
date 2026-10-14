/* Plan v5 (15-19 Okt): die vaste dagplanne is heel (geen oorvleueling nie, minute klop, elke `item` is 'n
   Afrikaans-item in die V3-vraagbank met dieselfde duur). `node tests/plan-v5.test.js` */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const ctx = {};
ctx.window = ctx;
vm.createContext(ctx);
for (const lêer of ["assets/js/data.js", "assets/js/pa-konsole/exams.js", "assets/js/schedule.js"]) {
  vm.runInContext(fs.readFileSync(path.join(root, lêer), "utf8"), ctx, { filename: lêer });
}

const bank = JSON.parse(fs.readFileSync(path.join(root, "data", "vraebank-v3.json"), "utf8"));
const items = new Map(bank.map((i) => [i.id, i]));

const DAE = ["2026-10-15", "2026-10-16", "2026-10-17", "2026-10-18", "2026-10-19"];
const min = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const fails = [];
let blokke = 0;
let itemBlokke = 0;

for (const dag of DAE) {
  const plan = ctx.WALLIE.buildDayPlan(dag);
  const lys = plan.blocks;
  if (plan.date !== dag) fails.push(`${dag}: plan.date is ${plan.date}`);
  if (!(lys.length > 0)) fails.push(`${dag}: geen blokke nie`);
  if (!(plan.totalMinutes > 0)) fails.push(`${dag}: totalMinutes is ${plan.totalMinutes}`);

  const ids = new Set();
  let vorigeEinde = -1;
  for (const b of lys) {
    blokke += 1;
    const wie = `${dag}/${b.id}`;
    if (ids.has(b.id)) fails.push(`${wie}: dubbele id`);
    ids.add(b.id);
    if (!b.id.startsWith(dag + "-")) fails.push(`${wie}: id begin nie met die datum nie`);
    if (!/^\d\d:\d\d$/.test(b.start || "") || !/^\d\d:\d\d$/.test(b.end || "")) {
      fails.push(`${wie}: ongeldige tye ${b.start}-${b.end}`);
      continue;
    }
    const s = min(b.start);
    const e = min(b.end);
    if (e < s) fails.push(`${wie}: einde voor begin`);
    if (b.minutes !== e - s) fails.push(`${wie}: minute ${b.minutes} ≠ ${e - s}`);
    if (s < vorigeEinde) fails.push(`${wie}: oorvleuel met die vorige blok (begin ${b.start}, vorige einde ${vorigeEinde})`);
    vorigeEinde = Math.max(vorigeEinde, e);
    if (["gasvryheid", "toerisme", "rtt"].includes(b.subjectSlug)) fails.push(`${wie}: ${b.subjectSlug} hoort nie in plan v5 nie`);

    if (b.item) {
      itemBlokke += 1;
      const it = items.get(b.item);
      if (!it) fails.push(`${wie}: item ${b.item} bestaan nie in data/vraebank-v3.json nie`);
      else {
        if (it.vak !== "afrikaans") fails.push(`${wie}: item ${b.item} is vak ${it.vak}, nie afrikaans nie`);
        if (![40, 100].includes(it.tyd_min)) fails.push(`${wie}: item ${b.item} se tyd_min is ${it.tyd_min}`);
        if (b.minutes !== it.tyd_min) fails.push(`${wie}: blok-minute ${b.minutes} ≠ item.tyd_min ${it.tyd_min}`);
        if (b.punte != null && b.punte !== it.punte) fails.push(`${wie}: punte ${b.punte} ≠ item.punte ${it.punte}`);
      }
      if (b.subjectSlug !== "afrikaans") fails.push(`${wie}: item-blok moet vak afrikaans hê`);
    }
    if (b.kind === "break" && b.subjectSlug !== "break") fails.push(`${wie}: pouse met vak ${b.subjectSlug}`);
  }

  const studie = lys.filter((b) => b.kind !== "break").reduce((s, b) => s + b.minutes, 0);
  if (plan.totalMinutes !== studie) fails.push(`${dag}: totalMinutes ${plan.totalMinutes} ≠ som van studieblokke ${studie}`);
}

/* Afrikaans-minute per dag (A1/A2 = 100 min, B = 40 min, merk/herdoen/voor-eksamen soos in die plan) */
const afrVerwag = { "2026-10-15": 40 + 20 + 40 + 20, "2026-10-16": 100 + 30 + 40 + 20, "2026-10-17": 100 + 30 + 40 + 20, "2026-10-18": 40 + 20 + 30, "2026-10-19": 100 + 30 + 30 + 30 };
for (const dag of DAE) {
  const som = ctx.WALLIE.buildDayPlan(dag)
    .blocks.filter((b) => b.kind !== "break" && b.subjectSlug === "afrikaans")
    .reduce((s, b) => s + b.minutes, 0);
  if (som !== afrVerwag[dag]) fails.push(`${dag}: Afrikaans-studieminute ${som}, verwag ${afrVerwag[dag]}`);
}

/* Eksamenrooster: Engels V3 is Do 15 Okt 09:00 (skool) en Afrikaans HT V3 is Di 20 Okt 09:00 */
const eng = ctx.PK.EXAMS.find((x) => x.s === "engels" && /V3/.test(x.n));
const afr = ctx.PK.EXAMS.find((x) => x.s === "afrikaans" && /HT V3/.test(x.n));
if (!eng || !eng.at.startsWith("2026-10-15T09:00")) fails.push(`Engels V3 se eksamen is nie Do 15 Okt 09:00 nie (${eng && eng.at})`);
if (!afr || !afr.at.startsWith("2026-10-20T09:00")) fails.push(`Afrikaans HT V3 se eksamen is nie Di 20 Okt 09:00 nie (${afr && afr.at})`);
const eksamenBlok = ctx.WALLIE.buildDayPlan("2026-10-15").blocks.find((b) => b.id === "2026-10-15-eksamen");
if (!eksamenBlok || eksamenBlok.start !== "09:00" || eksamenBlok.end !== "11:30") fails.push("15 Okt: eksamen-blok moet 09:00-11:30 wees");
if (eksamenBlok && eksamenBlok.kind !== "break") fails.push("15 Okt: eksamen-blok (by die skool) moet kind break wees");

/* "voor-eksamen" is 'n studieblok (nie 'n pouse nie) met die vak se eie kind */
for (const [dag, id] of [["2026-10-15", "2026-10-15-formaat"], ["2026-10-19", "2026-10-19-tas"]]) {
  const b = ctx.WALLIE.buildDayPlan(dag).blocks.find((x) => x.id === id);
  if (!b || b.soort !== "voor-eksamen") fails.push(`${id}: soort moet voor-eksamen wees`);
  if (b && b.kind !== (id.endsWith("formaat") ? "geel" : "rooi")) fails.push(`${id}: kind is ${b.kind}`);
}

if (fails.length) {
  console.error("plan-v5: FOUT\n - " + fails.join("\n - "));
  process.exit(1);
}
console.log(`plan-v5: ${DAE.length} dae, ${blokke} blokke, ${itemBlokke} item-blokke ok`);
