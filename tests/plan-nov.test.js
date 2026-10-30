/* Inhoud-hek tot die laaste eksamen (30 Okt 2026, LL-02 + LL-23; QC: "die hek toets die regstelling, nie die
   probleemklas nie"). `node tests/plan-nov.test.js`
   Faal as, vir ELKE dag van 30 Okt tot die laaste eksamen in exams.js:
   - die dag op die generiese rotasie val (geen vaste plan nie);
   - 'n studieblok 'n vak gee wat reeds sy laaste eksamen geskryf het;
   - 'n blok se DBE-werk nie bestaan nie, van 'n ander vak is, of nie die TIPE vraestel is van daardie vak se
     eerskomende eksamen nie (bv. 'n taalvraestel ná die taaleksamen, of teorie teenoor prakties);
   - 'n skryf- of merk-blok geen DBE-werk het nie (AGENTS §2.9: die inhoud is in die app). */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const ctx = { console };
ctx.window = ctx;
ctx.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
vm.createContext(ctx);
for (const lêer of ["assets/js/data.js", "assets/js/pa-konsole/exams.js", "assets/js/schedule.js", "assets/js/dbe-vraestelle.js", "assets/js/dbe-vraestelle-oorblywend.js"]) {
  vm.runInContext(fs.readFileSync(path.join(root, lêer), "utf8"), ctx, { filename: lêer });
}
const W = ctx.WALLIE;
const K = W.DBE.KATALOGUS;
const doel = JSON.parse(fs.readFileSync(path.join(root, "data", "doelwitte.json"), "utf8"));
const katVan = Object.fromEntries(doel.vraestelle.map((v) => [v.eksamen, v.katalogus]));

const GENERIES = /-(warm|rooi1|rooi2|geel|rtt-or-third|groen|slot)$/;
const eksamens = ctx.PK.EXAMS.map((e) => ({ ...e, t: new Date(e.at).getTime() }));
const laaste = new Date(Math.max(...eksamens.map((e) => e.t)));
const tydVan = (dag, hhmm) => new Date(`${dag}T${hhmm}:00+02:00`).getTime();

const fails = [];
let dae = 0;
let werkBlokke = 0;
for (let d = new Date("2026-10-30T12:00:00Z"); d <= laaste; d.setUTCDate(d.getUTCDate() + 1)) {
  const dag = d.toISOString().slice(0, 10);
  dae += 1;
  const blokke = W.buildDayPlan(dag).blocks;
  for (const b of blokke) {
    if (GENERIES.test(b.id)) {
      fails.push(`${dag}: geen vaste plan nie (generiese blok ${b.id})`);
      break;
    }
  }
  for (const b of blokke) {
    if (b.kind === "break") continue;
    const begin = tydVan(dag, b.start);
    const volgende = eksamens.filter((e) => ctx.PK.subjectKey(e.n, e.s) === (b.subjectSlug || b.slug) && e.t >= begin).sort((a, x) => a.t - x.t)[0];
    if (!volgende) {
      fails.push(`${b.id}: ${(b.subjectSlug || b.slug)} het geen eksamen meer nie, maar kry 'n blok`);
      continue;
    }
    if ((b.soort === "skrif" || b.soort === "merk") && !b.werk) fails.push(`${b.id}: ${b.soort}-blok sonder DBE-werk`);
    if (!b.werk) continue;
    werkBlokke += 1;
    const p = K[b.werk.id];
    if (!p) {
      fails.push(`${b.id}: werk ${b.werk.id} is nie in die katalogus nie`);
      continue;
    }
    if (p.vak !== (b.subjectSlug || b.slug)) fails.push(`${b.id}: vraestel ${p.id} is ${p.vak}, blok is ${(b.subjectSlug || b.slug)}`);
    const kat = katVan[volgende.n];
    if (!kat) fails.push(`${b.id}: eerskomende eksamen "${volgende.n}" het geen katalogus-tipe in doelwitte.json nie`);
    else if (!p.id.endsWith(`-${kat}`)) fails.push(`${b.id}: gee ${p.id}, maar die eerskomende ${(b.subjectSlug || b.slug)}-eksamen is "${volgende.n}" (${kat})`);
    for (const n of b.werk.nrs || []) if (!(Number(n) >= 1 && Number(n) <= p.vrae.length)) fails.push(`${b.id}: Vraag ${n} bestaan nie in ${p.id}`);
    /* QC 30 Okt (B1): die punte wat die skerm wys. Heel vraestel = sy totaal (keusevraestel: `totaal`); vrae = hul som. */
    const verwag = b.werk.tipe === "vraestel" ? (Number.isFinite(p.totaal) ? p.totaal : p.vrae.reduce((x, y) => x + y, 0)) : (b.werk.nrs || []).reduce((x, n) => x + p.vrae[Number(n) - 1], 0);
    const sonderBlokPunte = W.DBE.punte(b.werk, null);
    if (sonderBlokPunte !== verwag) fails.push(`${b.id}: die skerm wys ${sonderBlokPunte} punte, verwag ${verwag}`);
    if (Number.isFinite(b.punte) && b.punte !== verwag) fails.push(`${b.id}: blok sê ${b.punte} punte, die vraestel gee ${verwag}`);
    if (/-(afr|eng)-v2$/.test(p.id) && !(Number.isFinite(p.totaal) && p.beantwoord)) fails.push(`${p.id}: keusevraestel sonder totaal/beantwoord`);
  }
}
if (dae < 20) fails.push(`net ${dae} dae nagegaan`);
if (werkBlokke < 40) fails.push(`net ${werkBlokke} werk-blokke nagegaan: die hek moet werklike blokke toets`);

if (fails.length) {
  console.error("plan-nov: FOUT\n - " + fails.join("\n - "));
  process.exit(1);
}
console.log(`plan-nov: ${dae} dae tot ${laaste.toISOString().slice(0, 10)}, ${werkBlokke} werk-blokke ok (vak en vraestel-tipe pas by die eerskomende eksamen)`);
