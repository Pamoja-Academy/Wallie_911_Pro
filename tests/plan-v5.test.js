/* Plan v5 (15-26 Okt): die vaste dagplanne is heel (geen oorvleueling nie, minute klop, elke `item` is 'n
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

const DAE = ["2026-10-15", "2026-10-16", "2026-10-17", "2026-10-18", "2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23", "2026-10-24", "2026-10-25", "2026-10-26"];
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
const afrVerwag = { "2026-10-15": 40 + 20 + 40 + 20, "2026-10-16": 100 + 30 + 40 + 20, "2026-10-17": 100 + 30 + 40 + 20, "2026-10-18": 40 + 20 + 30 + 100 + 30, "2026-10-19": 20 + 40 + 40 + 40 + 30 + 100 + 30 + 30 + 30, "2026-10-20": 20 + 20, "2026-10-21": 0, "2026-10-22": 0, "2026-10-23": 0, "2026-10-24": 0, "2026-10-25": 0, "2026-10-26": 0 };
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

/* Afrikaans V3-eksamendag (Di 20 Okt): eksamen 09:00-12:00 by die skool (pouse), voor-eksamen-formaat, terugskou, Wisk. Gel. V1 */
{
  const lys = ctx.WALLIE.buildDayPlan("2026-10-20").blocks;
  const eks20 = lys.find((b) => b.id === "2026-10-20-eksamen");
  if (!eks20 || eks20.start !== "09:00" || eks20.end !== "12:00" || eks20.kind !== "break") fails.push("20 Okt: eksamen-blok moet 09:00-12:00 en kind break wees");
  const verwag = [
    ["opstaan", "06:45", "07:15"], ["formaat", "07:15", "07:35"], ["tas", "07:35", "08:00"], ["eksamen", "09:00", "12:00"],
    ["rus", "12:00", "14:00"], ["terugskou", "14:00", "14:20"], ["pouse1", "14:20", "14:30"], ["wg-v1", "14:30", "15:45"],
    ["merk-wg-v1", "15:45", "16:05"], ["klaar", "16:05", "16:05"]
  ];
  if (lys.map((b) => b.id).join() !== verwag.map(([s]) => `2026-10-20-${s}`).join()) fails.push("20 Okt: blokke of volgorde verskil van die plan");
  verwag.forEach(([s, a, e]) => {
    const b = lys.find((x) => x.id === `2026-10-20-${s}`);
    if (!b || b.start !== a || b.end !== e) fails.push(`20 Okt ${s}: tye ${b && b.start}-${b && b.end}, verwag ${a}-${e}`);
  });
  const wg = lys.find((b) => b.id === "2026-10-20-wg-v1");
  if (!wg || wg.subjectSlug !== "wiskgelett" || wg.kind !== "groen" || wg.soort !== "toets" || wg.punte !== 62 || wg.minutes !== 75) fails.push("20 Okt: wg-v1 is nie 'n groen Wisk. Gel. toets van 62 punte / 75 min nie (V1 Vraag 1+2 = 30+32 punte, 1,2 min per punt)");
  const tr = lys.find((b) => b.id === "2026-10-20-terugskou");
  if (!tr || tr.subjectSlug !== "afrikaans" || tr.kind !== "rooi" || tr.soort !== "herdoen") fails.push("20 Okt: terugskou moet 'n rooi Afrikaans herdoen-blok wees");
}

/* Plan v5 (vervolg): Wisk. Gel. V1 is Vr 23 Okt. Wo 21 = volle proefeksamen (soort "skrif": papier, geen oortjie-slot),
   Do 22 = Vraag 1 en 2, formuleblad en tas pak. Alles groen/wiskgelett; pouses break/break. */
{
  const verwag21 = [
    ["opstaan", "07:30", "08:00", "break"], ["wg-v1-proef", "08:00", "11:00", "groen"], ["middag", "11:00", "13:00", "break"],
    ["wg-v1-proef-inhaal", "13:00", "16:00", "groen"], ["pouse1", "16:00", "16:15", "break"], ["merk-wg-v1-proef", "16:15", "17:15", "groen"],
    ["foutlog", "17:15", "17:45", "groen"], ["klaar", "17:45", "17:45", "break"]
  ];
  const verwag22 = [
    ["opstaan", "07:30", "08:00", "break"], ["wg-v1", "08:00", "09:15", "groen"], ["merk-wg-v1", "09:15", "09:35", "groen"],
    ["pouse1", "09:35", "09:55", "break"], ["wg-v1-34", "09:55", "11:10", "groen"], ["merk-wg-v1-34", "11:10", "11:30", "groen"],
    ["middag", "11:30", "12:15", "break"], ["wg-v1-5", "12:15", "12:55", "groen"], ["merk-wg-v1-5", "12:55", "13:15", "groen"],
    ["pouse2", "13:15", "13:30", "break"], ["formules", "13:30", "14:00", "groen"], ["tas", "14:00", "14:20", "warm"], ["klaar", "14:20", "14:20", "break"]
  ];
  for (const [dag, verwag] of [["2026-10-21", verwag21], ["2026-10-22", verwag22]]) {
    const lys = ctx.WALLIE.buildDayPlan(dag).blocks;
    if (lys.map((b) => b.id).join() !== verwag.map(([s]) => `${dag}-${s}`).join()) fails.push(`${dag}: blokke of volgorde verskil van die plan`);
    verwag.forEach(([s, a, e, kind]) => {
      const b = lys.find((x) => x.id === `${dag}-${s}`);
      if (!b || b.start !== a || b.end !== e) fails.push(`${dag} ${s}: tye ${b && b.start}-${b && b.end}, verwag ${a}-${e}`);
      if (b && b.kind !== kind) fails.push(`${dag} ${s}: kind ${b.kind}, verwag ${kind}`);
      if (b && kind === "groen" && b.subjectSlug !== "wiskgelett") fails.push(`${dag} ${s}: groen blok moet wiskgelett wees`);
      if (b && kind === "break" && (b.subjectSlug !== "break" || b.soort !== "pouse")) fails.push(`${dag} ${s}: pouse moet break/break/pouse wees`);
    });
  }
  const p21 = ctx.WALLIE.buildDayPlan("2026-10-21");
  const proef = p21.blocks.find((b) => b.id === "2026-10-21-wg-v1-proef");
  if (!proef || proef.soort !== "skrif" || proef.minutes !== 180 || proef.item) fails.push("21 Okt: wg-v1-proef moet soort skrif, 180 min, sonder item wees (papier-eksamen, geen oortjie-slot)");
  if (!proef || !proef.werk || proef.werk.tipe !== "vraestel" || proef.werk.id !== "dbe-2026-jun-wg-v1") fails.push("21 Okt: wg-v1-proef moet die volle DBE Mei/Junie 2026 Wisk. Gel. V1 as werk hê");
  if (proef && !/150 punte, 3 uur/.test(proef.title)) fails.push("21 Okt: proef-titel noem nie 150 punte, 3 uur nie");
  if (p21.totalMinutes !== 180 + 180 + 60 + 30) fails.push(`21 Okt: totalMinutes ${p21.totalMinutes}, verwag 450`);
  /* Inhaal (21 Okt, Hanno): 'n volle V1-vraestel wat hy NOG NIE gesien het nie (Jun 2024), vanmiddag, 3 uur, skrif */
  const inhaal = p21.blocks.find((b) => b.id === "2026-10-21-wg-v1-proef-inhaal");
  if (!inhaal || inhaal.soort !== "skrif" || inhaal.minutes !== 180 || !inhaal.werk || inhaal.werk.id !== "dbe-2024-jun-wg-v1")
    fails.push("21 Okt: inhaal-blok moet skrif, 180 min, met die volle Jun 2024 V1 wees");
  const merk21 = p21.blocks.find((b) => b.id === "2026-10-21-merk-wg-v1-proef");
  if (!merk21 || merk21.soort !== "merk") fails.push("21 Okt: merk-blok moet soort merk wees");
  const foutlog = p21.blocks.find((b) => b.id === "2026-10-21-foutlog");
  if (!foutlog || foutlog.soort !== "herdoen") fails.push("21 Okt: foutlog moet soort herdoen wees");
  const p22 = ctx.WALLIE.buildDayPlan("2026-10-22");
  const wg22 = p22.blocks.find((b) => b.id === "2026-10-22-wg-v1");
  if (!wg22 || wg22.soort !== "skrif" || wg22.punte !== 59 || wg22.minutes !== 75) fails.push("22 Okt: wg-v1 moet 'n skrif-blok van 59 punte (Nov 2024 V1 Vraag 1+2) / 75 min wees");
  const tas22 = p22.blocks.find((b) => b.id === "2026-10-22-tas");
  if (!tas22 || tas22.soort !== "voor-eksamen" || !/sakrekenaar/.test(tas22.detail)) fails.push("22 Okt: tas moet voor-eksamen wees en die sakrekenaar noem");
  if (p22.totalMinutes !== 75 + 20 + 75 + 20 + 40 + 20 + 30 + 20) fails.push(`22 Okt: totalMinutes ${p22.totalMinutes}, verwag 300`);
  /* Inhaal: Do 22 dek die HELE Nov 2025 V1-vraestel (Vraag 1-5, 150 punte) voor die eksamen */
  const nrs22 = p22.blocks.filter((b) => b.soort === "skrif" && b.werk && b.werk.id === "dbe-2024-nov-wg-v1").flatMap((b) => b.werk.nrs);
  if (nrs22.slice().sort().join() !== "1,2,3,4,5") fails.push(`22 Okt: die skrif-blokke dek Vraag ${nrs22.join(",")}, verwag 1-5`);
  /* Die Wisk. Gel.-toetse tot 20 Okt was "toets" (oortjie-slot). Vanaf 21 Okt is die DBE-PDF in die app, dus "skrif" (hierbo). */
  for (const dag of ["2026-10-16", "2026-10-17", "2026-10-18", "2026-10-20"]) {
    const wgb = ctx.WALLIE.buildDayPlan(dag).blocks.find((b) => b.id === `${dag}-wg-v1`);
    if (!wgb || wgb.soort !== "toets") fails.push(`${dag}: wg-v1 is nie soort toets nie`);
  }
}

/* Plan v5 (vervolg 2): Wisk. Gel. V1-eksamen Vr 23 Okt 09:00, V2 Ma 26 Okt 09:00 (150 punte, 3 uur; 1,2 min per punt).
   Eksamen-blokke is break/pouse (by die skool, geen oortjie-slot); wg-v2-blokke is soort toets met punte, sonder item/werk. */
{
  const verwag = {
    "2026-10-23": [
      ["opstaan", "06:45", "07:15", "break"], ["formules", "07:15", "07:35", "warm"], ["tas", "07:35", "08:00", "break"], ["eksamen", "09:00", "12:00", "break"],
      ["rus", "12:00", "14:00", "break"], ["terugskou", "14:00", "14:20", "groen"], ["pouse1", "14:20", "14:30", "break"], ["wg-v2", "14:30", "15:45", "groen"],
      ["merk-wg-v2", "15:45", "16:05", "groen"], ["klaar", "16:05", "16:05", "break"]
    ],
    "2026-10-24": [
      ["opstaan", "08:00", "08:30", "break"], ["wg-v2", "08:30", "09:45", "groen"], ["merk-wg-v2", "09:45", "10:05", "groen"], ["pouse1", "10:05", "10:25", "break"],
      ["wg-v2-5", "10:25", "11:05", "groen"], ["merk-wg-v2-5", "11:05", "11:25", "groen"], ["middag", "11:25", "12:30", "break"], ["foutlog", "12:30", "13:00", "groen"], ["klaar", "13:00", "13:00", "break"]
    ],
    "2026-10-25": [
      ["opstaan", "08:30", "09:00", "break"], ["formules", "09:00", "09:40", "groen"], ["pouse1", "09:40", "10:00", "break"], ["foutlog", "10:00", "10:40", "groen"],
      ["middag", "10:40", "13:00", "break"], ["tas", "13:00", "13:20", "warm"], ["klaar", "13:20", "13:20", "break"]
    ],
    "2026-10-26": [
      ["opstaan", "06:45", "07:15", "break"], ["formules", "07:15", "07:35", "warm"], ["tas", "07:35", "08:00", "break"], ["eksamen", "09:00", "12:00", "break"],
      ["rus", "12:00", "14:00", "break"], ["terugskou", "14:00", "14:20", "groen"], ["klaar", "14:20", "14:20", "break"]
    ]
  };
  for (const [dag, lysVerwag] of Object.entries(verwag)) {
    const plan = ctx.WALLIE.buildDayPlan(dag);
    const lys = plan.blocks;
    if (lys.map((b) => b.id).join() !== lysVerwag.map(([s]) => `${dag}-${s}`).join()) fails.push(`${dag}: blokke of volgorde verskil van die plan`);
    lysVerwag.forEach(([s, a, e, kind]) => {
      const b = lys.find((x) => x.id === `${dag}-${s}`);
      if (!b || b.start !== a || b.end !== e) fails.push(`${dag} ${s}: tye ${b && b.start}-${b && b.end}, verwag ${a}-${e}`);
      if (b && b.kind !== kind) fails.push(`${dag} ${s}: kind ${b.kind}, verwag ${kind}`);
      if (b && kind === "groen" && b.subjectSlug !== "wiskgelett") fails.push(`${dag} ${s}: groen blok moet wiskgelett wees`);
      if (b && kind === "break" && (b.subjectSlug !== "break" || b.soort !== "pouse")) fails.push(`${dag} ${s}: pouse moet break/break/pouse wees`);
      if (b && b.minutes !== min(e) - min(a)) fails.push(`${dag} ${s}: minute ${b.minutes} ≠ ${min(e) - min(a)}`);
      if (b && b.item) fails.push(`${dag} ${s}: Wisk. Gel. het geen item nie`);
      /* Net die werk- en merk-blokke dra 'n DBE-vraestel; terugskou, formules, foutlog en tas nie */
      const moetWerk = b && ["skrif", "toets", "merk"].includes(b.soort);
      if (b && moetWerk && !b.werk) fails.push(`${dag} ${s}: ${b.soort}-blok sonder DBE-werk`);
      if (b && !moetWerk && b.werk) fails.push(`${dag} ${s}: ${b.soort}-blok behoort geen werk te hê nie`);
    });
    const studie = lys.filter((b) => b.kind !== "break").reduce((x, b) => x + b.minutes, 0);
    if (plan.totalMinutes !== studie) fails.push(`${dag}: totalMinutes ${plan.totalMinutes} ≠ ${studie}`);
  }
  /* Eksamen-blokke: break, 09:00-12:00 by die skool */
  for (const [dag, naam] of [["2026-10-23", "V1"], ["2026-10-26", "V2"]]) {
    const b = ctx.WALLIE.buildDayPlan(dag).blocks.find((x) => x.id === `${dag}-eksamen`);
    if (!b || b.kind !== "break" || b.start !== "09:00" || b.end !== "12:00") fails.push(`${dag}: eksamen-blok moet break 09:00-12:00 wees`);
    if (b && !new RegExp(`WISK. GEL. ${naam}-EKSAMEN`).test(b.title)) fails.push(`${dag}: eksamen-titel noem nie ${naam} nie`);
  }
  /* wg-v2-blokke: soort skrif (die PDF is in 'n ander oortjie oop), gegewe punte; 1,2 min per punt moet binne die blok pas */
  for (const [dag, id, punte, minute] of [["2026-10-23", "wg-v2", 62, 75], ["2026-10-24", "wg-v2", 62, 75], ["2026-10-24", "wg-v2-5", 26, 40]]) {
    const b = ctx.WALLIE.buildDayPlan(dag).blocks.find((x) => x.id === `${dag}-${id}`);
    if (!b || b.soort !== "skrif" || b.punte !== punte || b.minutes !== minute) fails.push(`${dag}-${id}: moet soort skrif, ${punte} punte, ${minute} min wees`);
    if (b && b.minutes < Math.round(punte * 1.2)) fails.push(`${dag}-${id}: ${b.minutes} min is te min vir ${punte} punte (1,2 min per punt)`);
  }
  if (ctx.WALLIE.buildDayPlan("2026-10-23").totalMinutes !== 20 + 20 + 75 + 20) fails.push("23 Okt: totalMinutes verwag 135");
  if (ctx.WALLIE.buildDayPlan("2026-10-24").totalMinutes !== 75 + 20 + 40 + 20 + 30) fails.push("24 Okt: totalMinutes verwag 185");
  if (ctx.WALLIE.buildDayPlan("2026-10-25").totalMinutes !== 40 + 40 + 20) fails.push("25 Okt: totalMinutes verwag 100");
  if (ctx.WALLIE.buildDayPlan("2026-10-26").totalMinutes !== 20 + 20) fails.push("26 Okt: totalMinutes verwag 40");
  /* Eksamenrooster: Wisk. Gel. V1 Vr 23 Okt 09:00, V2 Ma 26 Okt 09:00 */
  for (const [re, at] of [[/V1/, "2026-10-23T09:00"], [/V2/, "2026-10-26T09:00"]]) {
    const ex = ctx.PK.EXAMS.find((x) => x.s === "wiskgelett" && re.test(x.n));
    if (!ex || !ex.at.startsWith(at)) fails.push(`Wisk. Gel. ${re} se eksamen is nie ${at} nie (${ex && ex.at})`);
  }
}

/* "voor-eksamen" is 'n studieblok (nie 'n pouse nie) met kind "warm" (opwarm), sodat Pa se oorsig dit nooit vlag nie */
for (const [dag, id, kind] of [["2026-10-15", "2026-10-15-formaat", "warm"], ["2026-10-19", "2026-10-19-tas", "warm"], ["2026-10-20", "2026-10-20-formaat", "warm"], ["2026-10-22", "2026-10-22-tas", "warm"], ["2026-10-23", "2026-10-23-formules", "warm"], ["2026-10-25", "2026-10-25-tas", "warm"], ["2026-10-26", "2026-10-26-formules", "warm"]]) {
  const b = ctx.WALLIE.buildDayPlan(dag).blocks.find((x) => x.id === id);
  if (!b || b.soort !== "voor-eksamen") fails.push(`${id}: soort moet voor-eksamen wees`);
  if (b && b.kind !== kind) fails.push(`${id}: kind is ${b.kind}, verwag ${kind}`);
}

/* 18-19 Okt (Hanno, 18 Okt): die Afrikaans V3-items se vraagteks stem nie ooreen met hul DBE-anker nie, dus werk die laaste
   twee dae voor die eksamen uit die REGTE DBE Nov 2025-vraestel op papier (soort skrif, sonder item, Pa gee):
   So 18 middag Afdeling A (opstel 100 min) + merk; Ma 19 Afdeling B (kies 20 min, 2 x 40 min) + merk, foutlog,
   'n tweede opstel (ander onderwerp, 100 min) + merk, formaat, en eers dan die tas. Geen vraebank-item op 18 middag of 19 nie. */
{
  const p18 = ctx.WALLIE.buildDayPlan("2026-10-18").blocks;
  const p19 = ctx.WALLIE.buildDayPlan("2026-10-19").blocks;
  const blok = (lys, dag, s) => lys.find((b) => b.id === dag + "-" + s);
  const skrif = (b, min, punte) => b && b.soort === "skrif" && b.minutes === min && b.punte === punte && !b.item && !b.werk &&
    b.subjectSlug === "afrikaans" && b.kind === "rooi";
  const a18 = blok(p18, "2026-10-18", "afr-a-nov25");
  if (!skrif(a18, 100, 50) || !/REGTE DBE Nov 2025/.test(a18.title)) fails.push("18 Okt: afr-a-nov25 moet 'n Afrikaans skrif-blok (100 min, 50 punte, sonder item) uit die regte DBE Nov 2025-vraestel wees");
  const m18 = blok(p18, "2026-10-18", "merk-afr-a-nov25");
  if (!m18 || m18.soort !== "merk" || m18.minutes !== 30 || !/amptelike DBE-opstelrubriek/.test(m18.title)) fails.push("18 Okt: merk-afr-a-nov25 moet 30 min merk met die amptelike DBE-opstelrubriek wees");
  if (p18.some((b) => b.item && b.start >= "14:00")) fails.push("18 Okt: geen vraebank-item in die middag nie");
  const keuse = blok(p19, "2026-10-19", "keuse-b");
  if (!keuse || keuse.soort !== "toets" || keuse.minutes !== 20 || keuse.item || !/Afdeling B/.test(keuse.title)) fails.push("19 Okt: keuse-b moet 'n 20-min Afdeling B-kies-en-beplan sonder item wees");
  for (const id of ["afr-b-1", "afr-b-2"]) if (!skrif(blok(p19, "2026-10-19", id), 40, 25)) fails.push(`19 Okt: ${id} moet 'n skrif-blok van 40 min / 25 punte sonder item wees`);
  const a19 = blok(p19, "2026-10-19", "afr-a-2");
  if (!skrif(a19, 100, 50) || !/ANDER onderwerp/.test(a19.title)) fails.push("19 Okt: afr-a-2 moet 'n tweede opstel (ander onderwerp, 100 min, 50 punte) op papier wees");
  for (const [id, min] of [["merk-b", 40], ["merk-a-2", 30]]) {
    const m = blok(p19, "2026-10-19", id);
    if (!m || m.soort !== "merk" || m.minutes !== min) fails.push(`19 Okt: ${id} moet ${min} min merk wees`);
  }
  if (p19.some((b) => b.item)) fails.push("19 Okt: geen vraebank-item nie (net die regte DBE-vraestel)");
  const tas = blok(p19, "2026-10-19", "tas");
  if (!tas || !a19 || tas.start < a19.end) fails.push("19 Okt: die tas kom ná die tweede opstel");
  /* Ma 19: Hanno werk; Wallie werk alleen met die gedrukte vraestel en rubriek (geen blok wag op Pa nie) */
  for (const b of p19) if (/saam met Pa|Pa gee|Pa merk/.test(b.title + " " + b.detail)) fails.push(`19 Okt ${b.id}: wag op Pa (Hanno werk Ma 19)`);
  for (const id of ["merk-b", "merk-a-2"]) {
    const m = blok(p19, "2026-10-19", id);
    if (!m || !/self, streng, met die gedrukte amptelike DBE/.test(m.title)) fails.push(`19 Okt ${id}: moet self streng met die gedrukte DBE-rubriek merk`);
  }
  /* Di 20: eksamendag-tydkaart (gereedheidsverslag R5) */
  const f20 = ctx.WALLIE.buildDayPlan("2026-10-20").blocks.find((b) => b.id === "2026-10-20-formaat");
  if (!f20 || !["09:00-09:15", "10:40", "11:20", "12:00", "nooit 'n afdeling oop"].every((x) => f20.detail.includes(x)))
    fails.push("20 Okt: formaat-blok moet die eksamen-tydkaart (09:00-09:15 / 10:40 / 11:20 / 12:00) en 'nooit oop laat' hê");
}

/* 21 Okt (Hanno: die blok het net "Pa gee" gesê, en Wallie het niks gehad om te doen nie): elke Wisk. Gel.-werk- en
   merk-blok van 21-24 Okt dra 'n amptelike DBE-vraestel uit die katalogus. Niemand hoef iets te gee nie, en die punte klop. */
{
  vm.runInContext(fs.readFileSync(path.join(root, "assets/js/dbe-vraestelle.js"), "utf8"), ctx, { filename: "dbe-vraestelle.js" });
  const DBE = ctx.WALLIE.DBE;
  let gekoppel = 0;
  for (const dag of ["2026-10-21", "2026-10-22", "2026-10-23", "2026-10-24"]) {
    for (const b of ctx.WALLIE.buildDayPlan(dag).blocks) {
      if (b.subjectSlug !== "wiskgelett") continue;
      if (/Pa gee/.test(`${b.title} ${b.detail}`)) fails.push(`${b.id}: sê nog "Pa gee"; die vraestel moet in die app wees`);
      if (!["skrif", "toets", "merk"].includes(b.soort)) continue;
      const p = b.werk && DBE.item(b.werk.id);
      if (!p) {
        fails.push(`${b.id}: werk ${JSON.stringify(b.werk)} is nie in die DBE-katalogus nie`);
        continue;
      }
      gekoppel += 1;
      if (p.vak !== "wiskgelett") fails.push(`${b.id}: ${p.id} is nie 'n Wisk. Gel.-vraestel nie`);
      const sk = DBE.skakels(b.werk);
      for (const k of ["vraestel", sk.antwoordeboek ? "antwoordeboek" : "bylae", "memo"])
        if (!/^https:\/\/www\.education\.gov\.za\/LinkClick\.aspx\?fileticket=/.test(sk[k] || "")) fails.push(`${b.id}: ${k}-skakel is nie 'n amptelike DBE-skakel nie`);
      if (b.punte != null) {
        const nrs = DBE.vraagNommers(b.werk);
        const som = nrs.reduce((s, n) => s + p.vrae[Number(n) - 1], 0);
        if (som !== b.punte) fails.push(`${b.id}: blok sê ${b.punte} punte, maar ${p.id} ${nrs.join("+")} is ${som}`);
      }
      if (b.werk.tipe === "vraestel" && b.soort === "skrif" && !/150 punte/.test(b.title)) fails.push(`${b.id}: volle vraestel moet 150 punte noem`);
    }
  }
  if (gekoppel !== 15) fails.push(`Wisk. Gel. 21-24 Okt: ${gekoppel} blokke met DBE-werk, verwag 15`);
  /* Elke Wisk. Gel.-vraestel: 5 vrae, 150 punte (Nov 2025 uit die memo, Jun 2026 uit die vraestel se [..]-totale) */
  for (const id of ["dbe-2025-nov-wg-v1", "dbe-2025-nov-wg-v2", "dbe-2026-jun-wg-v1", "dbe-2026-jun-wg-v2", "dbe-2024-jun-wg-v1", "dbe-2023-nov-wg-v1", "dbe-2024-nov-wg-v1"]) {
    const p = DBE.item(id);
    if (!p || p.vrae.length !== 5 || p.vrae.reduce((s, x) => s + x, 0) !== 150) fails.push(`${id}: moet 5 vrae en 150 punte hê`);
  }
  /* LL-18 (21 Okt 13:00, "dieselfde vrae as voorheen"): geen blok vanaf 21 Okt 13:00 mag 'n vraestel gee wat Wallie al
     gekry het nie (REEDS_GESIEN), ook nie ná 'n omruil nie; en geen vervanger in 'n omruil-groep mag reeds gesien wees nie. */
  const gesien = DBE.ruil.REEDS_GESIEN;
  for (const dag of ["2026-10-21", "2026-10-22", "2026-10-23", "2026-10-24", "2026-10-25", "2026-10-26"]) {
    for (const b of ctx.WALLIE.buildDayPlan(dag).blocks) {
      if (!b.werk || (dag === "2026-10-21" && b.end <= "13:00")) continue;
      const w = ctx.WALLIE.werkVirBlok(b, {});
      if (gesien[b.werk.id] || gesien[w.id]) fails.push(`${b.id}: gee ${w.id}, wat Wallie al gekry het (${gesien[b.werk.id] || gesien[w.id]})`);
    }
  }
  for (const g of DBE.ruil.GROEPE) for (const id of g) if (gesien[id]) fails.push(`omruil-groep bevat ${id}, wat reeds gesien is`);
  /* Die inhaal-vraestel van vandag (Jun 2024) mag nie môre as vervanger terugkom nie */
  if (DBE.ruil.GROEPE.some((g) => g.includes("dbe-2024-jun-wg-v1"))) fails.push("omruil-groep bevat vandag se inhaal-vraestel (Jun 2024 V1)");

  /* Net RTT roteer: geen Wisk. Gel.-vraestel in ORDE nie */
  if (DBE.ORDE.some((id) => DBE.item(id).vak === "wiskgelett")) fails.push("ORDE bevat 'n Wisk. Gel.-vraestel; net RTT roteer");
}

if (fails.length) {
  console.error("plan-v5: FOUT\n - " + fails.join("\n - "));
  process.exit(1);
}
console.log(`plan-v5: ${DAE.length} dae, ${blokke} blokke, ${itemBlokke} item-blokke ok`);
