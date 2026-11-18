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
for (const lêer of ["assets/js/data.js", "assets/js/pa-konsole/exams.js", "assets/js/schedule.js", "assets/js/dbe-vraestelle.js", "assets/js/dbe-vraestelle-oorblywend.js", "assets/js/lessons.js"]) {
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
    for (const n of b.werk.nrs || []) {
      if (!(parseInt(String(n), 10) >= 1 && parseInt(String(n), 10) <= p.vrae.length)) fails.push(`${b.id}: Vraag ${n} bestaan nie in ${p.id}`);
      /* 8 Nov (LL-25): 'n subvraag moet in die katalogus se nagegaande `subvrae` staan */
      if (!Number.isInteger(Number(n)) && !(p.subvrae && p.subvrae[String(n)])) fails.push(`${b.id}: subvraag ${n} het geen nagegaande punte in ${p.id}.subvrae nie`);
    }
    /* QC 30 Okt (B1): die punte wat die skerm wys. Heel vraestel = sy totaal (keusevraestel: `totaal`); vrae = hul som. */
    const verwag = b.werk.tipe === "vraestel" ? (Number.isFinite(p.totaal) ? p.totaal : p.vrae.reduce((x, y) => x + y, 0)) : (b.werk.nrs || []).reduce((x, n) => x + (Number.isInteger(Number(n)) ? p.vrae[Number(n) - 1] : (p.subvrae || {})[String(n)]), 0);
    const sonderBlokPunte = W.DBE.punte(b.werk, null);
    if (sonderBlokPunte !== verwag) fails.push(`${b.id}: die skerm wys ${sonderBlokPunte} punte, verwag ${verwag}`);
    if (Number.isFinite(b.punte) && b.punte !== verwag) fails.push(`${b.id}: blok sê ${b.punte} punte, die vraestel gee ${verwag}`);
    if (/-(afr|eng)-v2$/.test(p.id) && !(Number.isFinite(p.totaal) && p.beantwoord)) fails.push(`${p.id}: keusevraestel sonder totaal/beantwoord`);
    /* Net Wallie se eie werke (Hanno, 30 Okt): Afr V2 = gedigte V1-5, Onderwêreld V6-7, Krismis van Map Jacobs V14-15;
       Engels P2 = Macbeth V3, kortverhale V5, poësie V6. Nooit 'n ander roman of drama nie. */
    const EIE = { "afr-v2": [1, 2, 3, 4, 5, 6, 7, 14, 15], "eng-v2": [3, 5, 6] };
    const tipe = Object.keys(EIE).find((t) => p.id.endsWith("-" + t));
    if (tipe) for (const n of b.werk.nrs || []) if (!EIE[tipe].includes(Number(n))) fails.push(`${b.id}: Vraag ${n} van ${p.id} is nie een van Wallie se werke nie`);
  }
}
/* LL-25 (8 Nov, Hanno: "slim spotting", nie net vraestelle nie): vir Afrikaans V1 (Wo 11 Nov) moet elke voorbereidingsdag
   (8-10 Nov) 'n teorie-kaart (les met 'n bestaande `kaart`) EN 'n dril van herhalende vrae (skrif met subvrae) hê; die
   eksamentegniek-kaart (v1-spotting) kom voor die eksamen; die eksamendag self gee geen nuwe werk nie; en die Nov 2023-vraestel
   (verkeerde memo op education.gov.za) word nooit gegee nie. */
{
  const kaarte = new Set(((ctx.WALLIE.LESSONS || {}).afrikaans || { concepts: [] }).concepts.map((c) => c.id));
  for (const dag of ["2026-11-08", "2026-11-09", "2026-11-10"]) {
    const bl = W.buildDayPlan(dag).blocks.filter((b) => b.subjectSlug === "afrikaans");
    const les = bl.filter((b) => b.soort === "les" && b.kaart);
    if (!les.length) fails.push(`${dag}: Afrikaans V1-voorbereiding sonder 'n teorie-kaart (LL-25)`);
    for (const b of les) if (!kaarte.has(b.kaart)) fails.push(`${b.id}: kaart ${b.kaart} bestaan nie in lessons.js`);
    if (dag !== "2026-11-10" && !bl.some((b) => b.soort === "skrif" && (b.werk?.nrs || []).some((n) => !Number.isInteger(Number(n)))))
      fails.push(`${dag}: geen dril van herhalende vrae (subvrae) nie (LL-25)`);
  }
  const voor = ["2026-11-08", "2026-11-09", "2026-11-10"].flatMap((d) => W.buildDayPlan(d).blocks);
  /* QC PR 56: geen skryfblok uit 'n vraestel waarvan die memo reeds in 'n vroeëre merkblok oopgemaak is nie (AGENTS §2.6) */
  const oop = new Set();
  for (const b of voor) {
    if (b.soort === "skrif" && b.werk && oop.has(b.werk.id)) fails.push(`${b.id}: ${b.werk.id} se memo is reeds vroeër oopgemaak`);
    if (b.soort === "merk" && b.werk) oop.add(b.werk.id);
  }
  /* 8 Nov 17:40 (Hanno: "hy moet ten minste 7 ure môre en Dinsdag se sessies hê"): Ma en Di elk ≥ 7 uur werk
     (les, skrif, merk, herdoen; nie pouses of tas pak nie). */
  const hm = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  for (const dag of ["2026-11-09", "2026-11-10"]) {
    const min = W.buildDayPlan(dag).blocks.filter((b) => ["les", "skrif", "merk", "herdoen"].includes(b.soort)).reduce((s, b) => s + hm(b.end) - hm(b.start), 0);
    if (min < 420) fails.push(`${dag}: net ${min} min werk, Hanno vra ten minste 7 uur (420 min)`);
  }
  for (const k of ["v1-spotting", "opsomming-v1", "swaar-formule", "leesbegrip-spotting"]) if (!voor.some((b) => b.kaart === k)) fails.push(`kaart ${k} kom nie voor die V1-eksamen nie (LL-25)`);
  for (const b of W.buildDayPlan("2026-11-11").blocks) if (b.werk) fails.push(`${b.id}: nuwe werk op die eksamendag`);
  for (let d = new Date("2026-10-30T12:00:00Z"); d <= laaste; d.setUTCDate(d.getUTCDate() + 1))
    for (const b of W.buildDayPlan(d.toISOString().slice(0, 10)).blocks)
      if ([b.werk, ...(b.werk_ekstra || [])].some((w) => w && /2023-nov-afr-v1/.test(w.id))) fails.push(`${b.id}: Nov 2023 Afr V1 (verkeerde memo)`);
}
/* LL-27 (18 Nov, Wallie se antwoord op Pa se vraelys: "Hou op om vir my vraestelle te gee"): Wo 18 en Do 19 Nov
   (voor Engels V2 en Afrikaans V2) gee geen vraestel-, merk- of herdoenblokke nie; die Macbeth-inhoudkaarte kom voor
   die Engels V2-eksamen; elke kaart bestaan; elke werkblok is hoogstens 25 min (25 min werk, 5 min rus). */
{
  const engKaarte = new Set(((ctx.WALLIE.LESSONS || {}).engels || { concepts: [] }).concepts.map((c) => c.id));
  const hm = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  const gesien = new Set();
  for (const dag of ["2026-11-18", "2026-11-19"]) {
    for (const b of W.buildDayPlan(dag).blocks) {
      if (b.werk || ["skrif", "merk", "herdoen", "toets"].includes(b.soort)) fails.push(`${b.id}: vraestelwerk na Wallie se "hou op om vir my vraestelle te gee" (LL-27)`);
      if (b.soort === "les" && hm(b.end) - hm(b.start) > 25) fails.push(`${b.id}: ${hm(b.end) - hm(b.start)} min, Wallie vra 25 min werk + 5 min rus (LL-27)`);
      if (b.kaart && b.subjectSlug === "engels" && !engKaarte.has(b.kaart)) fails.push(`${b.id}: kaart ${b.kaart} bestaan nie in lessons.js`);
      if (b.kaart) gesien.add(b.kaart);
    }
  }
  for (const k of ["macbeth-bedryf-1-2", "macbeth-bedryf-3-5", "macbeth-karakters", "macbeth-temas"]) if (!gesien.has(k)) fails.push(`kaart ${k} kom nie voor Engels V2 nie (LL-27)`);
}

/* LL-28 (18 Nov 11:09, Wallie se stemnota + Hanno): die les-blokke het die ou PEEL-kaart (Okt) drie keer herhaal, elke kaart
   had net EEN toe-boek-vraag, en Wallie moes self die DBE-memo op education.gov soek. Vir die laaste dae voor 'n eksamen
   (18-19 Nov) faal die hek as:
   - 'n les-blok nie sy eie kaart noem nie (sonder kaart roteer pickConcept ou kaarte in), of die kaart nie bestaan nie;
   - dieselfde kaart twee keer gebruik word (geen herhaling nie);
   - 'n kaart minder as 5 vrae in sy toe-boek of minder as 5 memo-reëls het (substansie, en die memo is IN die kaart);
   - 'n Engelse DBE-uittreksel uit 'n vraestel kom wat Wallie al in 'n blok gekry het (LL-18: geen gesiene vraestel);
   - die eerste DBE-uittreksel vir Macbeth (V3) of vir die kortverhale (V5) nie eers die DBE-nasienreëls gee nie
     (Hanno: teorie en eksamentegniek EERSTE). */
{
  const LS = ctx.WALLIE.LESSONS || {};
  const kaartVan = (slug, id) => ((LS[slug] || { concepts: [] }).concepts || []).find((c) => c.id === id);
  const vrae = (t) => (String(t || "").match(/(^|\n)\s*(\d+\)|\d+\.\d+(\.\d+)?\s)/g) || []).length;
  /* Watter Engelse V2-vraestelle het Wallie al in 'n blok gekry (alle dae tot 17 Nov)? */
  const gekry = new Set();
  for (let d = new Date("2026-10-01T12:00:00Z"); d <= new Date("2026-11-17T12:00:00Z"); d.setUTCDate(d.getUTCDate() + 1)) {
    for (const b of W.buildDayPlan(d.toISOString().slice(0, 10)).blocks) if (b.werk && b.werk.id) gekry.add(b.werk.id);
  }
  const MAAND = { JUN: "jun", NOV: "nov" };
  const gebruik = new Map();
  const eersteDbe = {};
  for (const dag of ["2026-11-18", "2026-11-19"]) {
    for (const b of W.buildDayPlan(dag).blocks) {
      if (b.soort !== "les") continue;
      if (!b.kaart) { fails.push(`${b.id}: les-blok sonder eie kaart (roteer ou kaarte in, LL-28)`); continue; }
      const c = kaartVan(b.subjectSlug, b.kaart);
      if (!c) { fails.push(`${b.id}: kaart ${b.kaart} bestaan nie vir ${b.subjectSlug}`); continue; }
      if (gebruik.has(b.kaart)) fails.push(`${b.id}: kaart ${b.kaart} herhaal (ook in ${gebruik.get(b.kaart)}) (LL-28)`);
      gebruik.set(b.kaart, b.id);
      if (vrae(c.toeBoek) < 5) fails.push(`${b.id}: kaart ${b.kaart} het ${vrae(c.toeBoek)} vrae (min 5, LL-28)`);
      if ((c.memo || []).length < 5) fails.push(`${b.id}: kaart ${b.kaart} het ${(c.memo || []).length} memo-reëls (min 5, LL-28)`);
      const m = String(c.toeBoek || "").match(/DBE (JUN|NOV) (\d{4})/);
      /* Afrikaans V2 (LL-28): ook geen gesiene vraestel nie, en die eerste DBE-kaart gee eers die nasienreëls. */
      if (b.subjectSlug === "afrikaans" && m) {
        const id = `dbe-${m[2]}-${MAAND[m[1]]}-afr-v2`;
        if (gekry.has(id)) fails.push(`${b.id}: ${id} is al aan Wallie gegee (LL-18/LL-28)`);
        if (!eersteDbe.afrikaans) {
          eersteDbe.afrikaans = b.id;
          if (!/SO SIEN DIE DBE NA/.test(c.toeBoek)) fails.push(`${b.id}: eerste Afrikaanse DBE-kaart sonder die nasienreëls eerste (LL-28)`);
        }
      }
      if (b.subjectSlug === "engels" && m) {
        const id = `dbe-${m[2]}-${MAAND[m[1]]}-eng-v2`;
        if (gekry.has(id)) fails.push(`${b.id}: ${id} is al aan Wallie gegee (LL-18/LL-28)`);
        const soort = /\n3\.\d\.\d/.test(c.toeBoek) ? "Macbeth" : /\n5\.\d\.\d/.test(c.toeBoek) ? "kortverhale" : null;
        if (soort && !eersteDbe[soort]) {
          eersteDbe[soort] = b.id;
          if (!/HOW THE DBE MARKS IT/.test(c.toeBoek)) fails.push(`${b.id}: eerste DBE-${soort}-uittreksel sonder die nasienreëls eerste (LL-28)`);
        }
      }
    }
  }
  for (const s of ["Macbeth", "kortverhale", "afrikaans"]) if (!eersteDbe[s]) fails.push(`geen DBE-${s}-uittreksel met memo voor die eksamen nie (LL-28)`);
}
if (dae < 20) fails.push(`net ${dae} dae nagegaan`);
if (werkBlokke < 40) fails.push(`net ${werkBlokke} werk-blokke nagegaan: die hek moet werklike blokke toets`);

if (fails.length) {
  console.error("plan-nov: FOUT\n - " + fails.join("\n - "));
  process.exit(1);
}
console.log(`plan-nov: ${dae} dae tot ${laaste.toISOString().slice(0, 10)}, ${werkBlokke} werk-blokke ok (vak en vraestel-tipe pas by die eerskomende eksamen)`);
