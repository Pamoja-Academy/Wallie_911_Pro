/* Roete-hek (21 Okt 2026, Hanno: "dit is mos lankal vasgelê in die ontwerp"). `node tests/roete.test.js`
   Faal as:
   - die vasgelegde doelwitte (data/doelwitte.json) van assets/js/data.js verskil;
   - 'n oorblywende eksamen in die rooster (exams.js) nie in doelwitte.json se vraestelle of oop-lys is nie;
   - 'n vraestel minder getimede DBE-werk het as R volle-vraestel-ekwivalente, sonder 'n eerlike 'aanvaar'-rede;
   - 'n 'aanvaar'-rede bestaan terwyl die vereiste reeds gehaal word (verouderde verskoning);
   - 'n getimede DBE-blok geen merk-blok op dieselfde of die volgende dag het nie (terugvoer);
   - 'n vraestel met R >= 2 se werk net op een dag val (spasiëring). */
const { bereken } = require("../scripts/roete");

const fails = [];
const { doel, ctx, roete } = bereken();

/* 1. Die doelwitte is vas: data.js en doelwitte.json stem ooreen */
for (const [slug, v] of Object.entries(doel.vakke)) {
  const s = ctx.WALLIE.SUBJECTS.find((x) => x.slug === slug);
  if (!s) fails.push(`${slug}: nie in data.js nie`);
  else for (const k of ["prelim", "jaar", "teiken"]) if (s[k] !== v[k]) fails.push(`${slug}.${k}: data.js ${s[k]} ≠ doelwitte.json ${v[k]}`);
}

/* 2. Geen eksamen word vergeet nie */
const vanaf = new Date(doel.reel.vanaf);
const bekend = new Set([...doel.vraestelle.map((v) => v.eksamen), ...doel.oop.map((o) => o.eksamen)]);
for (const e of ctx.PK.EXAMS) if (new Date(e.at) > vanaf && !bekend.has(e.n)) fails.push(`${e.n}: nie in doelwitte.json (vraestelle of oop) nie`);
for (const v of doel.vraestelle) if (!ctx.PK.EXAMS.some((e) => e.n === v.eksamen)) fails.push(`${v.eksamen}: nie in exams.js nie`);

/* 3-6. Per vraestel */
for (const r of roete) {
  if (!r.genoeg && !r.aanvaar) fails.push(`${r.eksamen}: ${r.minute} min getimede DBE-werk, vereis ${r.vereis_min} (R=${r.R} vir gaping ${r.gaping}), en geen 'aanvaar'-rede nie`);
  if (r.genoeg && r.aanvaar) fails.push(`${r.eksamen}: haal die vereiste (${r.minute}/${r.vereis_min} min), maar het nog 'n 'aanvaar'-rede: verwyder dit`);
  if (r.aanvaar && r.aanvaar.length < 40) fails.push(`${r.eksamen}: 'aanvaar' moet 'n eerlike rede met getalle wees`);
  if (r.minute === 0) fails.push(`${r.eksamen}: GEEN getimede DBE-werk nie`);
  for (const b of r.sonderMerk) fails.push(`${b.id}: ${b.werk} (${b.nrs}) het geen merk-blok op ${b.dag} of die dag daarna nie`);
  if (!r.spasieer) fails.push(`${r.eksamen}: R=${r.R}, maar al die werk val op een dag (spasiëring)`);
}
/* 7. Die oorblywende katalogus: amptelike skakels en punte wat met die vaste struktuur klop (spesifikasie-lêers) */
const fs = require("fs");
const path = require("path");
const spec = (v) => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "dbe-spesifikasie", `${v}.json`), "utf8"));
const K = ctx.WALLIE.DBE.KATALOGUS;
const STRUK = {
  "rtt-v2": { som: 150, afd: [[0, 3, 25], [3, 8, 75], [8, 10, 50]] },
  toer: { som: 200, afd: [[0, 1, 40], [1, 3, 50], [3, 6, 50], [6, 8, 30], [8, 10, 30]] },
  gas: { som: 200, afd: [[0, 1, 40], [1, 2, 20], [2, 4, 80], [4, 6, 60]] },
  "eng-v1": { som: 80, afd: [[0, 1, 30], [1, 2, 10], [2, 5, 40]] },
  "afr-v1": { som: 70, afd: [[0, 1, 30], [1, 2, 10], [2, 5, 30]] }
};
let nuut = 0;
for (const p of Object.values(K)) {
  const tipe = Object.keys(STRUK).find((t) => p.id.endsWith(`-${t}`));
  if (!tipe) continue;
  nuut += 1;
  const st = STRUK[tipe];
  if (p.vrae.reduce((s, x) => s + x, 0) !== st.som) fails.push(`${p.id}: vrae tel op na ${p.vrae.reduce((s, x) => s + x, 0)}, verwag ${st.som}`);
  for (const [a, b, punte] of st.afd) {
    const som = p.vrae.slice(a, b).reduce((s, x) => s + x, 0);
    if (som !== punte) fails.push(`${p.id}: vrae ${a + 1}-${b} = ${som}, verwag ${punte} (afdeling)`);
  }
  for (const k of ["vraestel", "memo"]) if (!/^https:\/\/www\.education\.gov\.za\/LinkClick\.aspx\?fileticket=/.test(p[k] || "")) fails.push(`${p.id}: ${k} is nie 'n amptelike DBE-skakel nie`);
  if (p.vraestel === p.memo) fails.push(`${p.id}: vraestel en memo is dieselfde skakel`);
}
if (nuut !== 26) fails.push(`oorblywende katalogus: ${nuut} vraestelle, verwag 26`);
const gas = spec("gasvryheid").afdeling_punte;
if (!gas || gas.A + gas.B + gas.C + gas.D !== 200) fails.push("gasvryheid.json: afdelings A-D moet 200 wees");
const toer = spec("toerisme").afdeling_punte;
if (!toer || toer.E !== 30 || Object.values(toer).reduce((s, x) => s + x, 0) !== 200) fails.push("toerisme.json: afdeling E (30) en totaal 200");

/* Die prioriteit van die ontwerp: die vak met die grootste gaping (Gasvryheid, 33) moet die vereiste haal sonder verskoning */
const grootste = roete.slice().sort((a, b) => b.gaping - a.gaping)[0];
if (grootste && (grootste.aanvaar || !grootste.genoeg)) fails.push(`${grootste.eksamen}: die grootste gaping (${grootste.gaping}) moet die volle vereiste haal`);

if (fails.length) {
  console.error("roete: FOUT\n - " + fails.join("\n - "));
  process.exit(1);
}
console.log(`roete: ${roete.length} vraestelle ok (${roete.filter((r) => r.genoeg).length} haal die vereiste; ${roete.filter((r) => r.aanvaar).length} met 'n eerlike aanvaar-rede)`);
