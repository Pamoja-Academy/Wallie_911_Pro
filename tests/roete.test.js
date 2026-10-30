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
  "afr-v1": { som: 70, afd: [[0, 1, 30], [1, 2, 10], [2, 5, 30]] },
  /* 30 Okt: letterkunde. Hier is "som" die som van ELKE vraag in die inhoudsopgawe, nie die vraestel se totaal nie:
     Wallie kies. Afr V2 (80) = 2 van V1-4 (10) + V5 (10) + een roman- (V6-13, 25) en een drama-vraag (V14-17, 25).
     Engels P2 (70) = 2 van 4 afdelings x 35 (V1-2 roman, V3-4 drama, V5 kortverhale, V6 poesie). */
  "afr-v2": { som: 350, afd: [[0, 5, 50], [5, 13, 200], [13, 17, 100]] },
  "eng-v2": { som: 210, afd: [[0, 2, 70], [2, 4, 70], [4, 5, 35], [5, 6, 35]] }
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
/* 26 tot 30 Okt; +2 Afr V1, +4 Afr V2, +3 Engels P2 (planne 7-20 Nov) */
if (nuut !== 35) fails.push(`oorblywende katalogus: ${nuut} vraestelle, verwag 35`);
const gas = spec("gasvryheid").afdeling_punte;
if (!gas || gas.A + gas.B + gas.C + gas.D !== 200) fails.push("gasvryheid.json: afdelings A-D moet 200 wees");
const toer = spec("toerisme").afdeling_punte;
if (!toer || toer.E !== 30 || Object.values(toer).reduce((s, x) => s + x, 0) !== 200) fails.push("toerisme.json: afdeling E (30) en totaal 200");

/* 8. QC PR #44: GEEN herhaling nie, van 21 Okt 13:00 tot 20 Nov (30 Okt uitgebrei), ook nie ná enige kombinasie van omruil-antwoorde nie.
   - geen vraag van 'n vraestel word twee keer as skrif gegee nie;
   - geen vraestel uit REEDS_GESIEN nie;
   - elke merk-blok gebruik dieselfde (opgeloste) vraestel as sy skrif-blok;
   - 'n blok sonder rooster-werk (voor-eksamen, herdoen, ...) kry nooit werk nie (bv. rotasie). */
{
  const W = ctx.WALLIE;
  const R = W.DBE.ruil;
  const dae = [];
  for (let d = new Date("2026-10-21T12:00:00Z"); d <= new Date("2026-11-20T12:00:00Z"); d.setUTCDate(d.getUTCDate() + 1)) dae.push(d.toISOString().slice(0, 10));
  const blokke = dae.flatMap((dag) => W.buildDayPlan(dag).blocks.filter((b) => !(dag === "2026-10-21" && b.end <= "13:00")));
  for (const b of blokke) if (!b.werk && W.werkVirBlok(b, {})) fails.push(`${b.id}: kry werk (${W.werkVirBlok(b, {}).id}) sonder dat die rooster dit gee`);
  const scenario = (naam, gesien) => {
    ctx.localStorage.setItem(R.KEY, JSON.stringify({ v: 1, gesien }));
    const gegee = {};
    for (const b of blokke) {
      if (!b.werk || b.soort !== "skrif") continue;
      const w = W.werkVirBlok(b, {});
      if (R.REEDS_GESIEN[w.id]) fails.push(`[${naam}] ${b.id}: gee ${w.id}, wat reeds gesien is`);
      for (const n of W.DBE.vraagNommers(w)) {
        const k = `${w.id} Vraag ${n}`;
        if (gegee[k]) fails.push(`[${naam}] ${b.id}: ${k} is reeds in ${gegee[k]} gegee`);
        gegee[k] = b.id;
      }
    }
    for (const b of blokke) {
      if (!b.werk || b.soort !== "merk") continue;
      const skrif = blokke.find((x) => x.soort === "skrif" && x.werk && x.werk.id === b.werk.id && JSON.stringify(x.werk.nrs || null) === JSON.stringify(b.werk.nrs || null));
      if (skrif && W.werkVirBlok(b, {}).id !== W.werkVirBlok(skrif, {}).id) fails.push(`[${naam}] ${b.id}: merk-vraestel verskil van ${skrif.id}`);
    }
  };
  scenario("niemand geantwoord", {});
  let n = 1;
  for (const g of R.GROEPE) {
    for (let k = 1; k <= g.length; k++) {
      const gs = {};
      g.slice(0, k).forEach((id) => (gs[id] = true));
      scenario(`groep ${g[0]} ${k}x ja`, gs);
      n++;
    }
  }
  for (let k = 1; k <= 3; k++) {
    const gs = {};
    for (const g of R.GROEPE) g.slice(0, k).forEach((id) => (gs[id] = true));
    scenario(`alle groepe ${k}x ja`, gs);
    n++;
  }
  ctx.localStorage.removeItem(R.KEY);
  /* Elke beplande skrif-vraestel (sonder vaste uitsondering) word deur die app gevra */
  for (const b of blokke) {
    if (!b.werk || b.soort !== "skrif") continue;
    if (b.werk.id === "dbe-2024-jun-wg-v1") continue; /* vandag se inhaal: bewustelik nie gevra nie */
    if (!R.GROEPE.some((g) => g.includes(b.werk.id))) fails.push(`${b.id}: ${b.werk.id} het geen omruil-groep nie; die app vra nooit "al gedoen?" nie`);
  }
  if (!fails.length) console.log(`roete: herhaling-hek ${n} omruil-scenario's ok`);
}

/* Die prioriteit van die ontwerp: die vak met die grootste gaping (Gasvryheid, 33) moet die vereiste haal sonder verskoning */
const grootste = roete.slice().sort((a, b) => b.gaping - a.gaping)[0];
if (grootste && (grootste.aanvaar || !grootste.genoeg)) fails.push(`${grootste.eksamen}: die grootste gaping (${grootste.gaping}) moet die volle vereiste haal`);

if (fails.length) {
  console.error("roete: FOUT\n - " + fails.join("\n - "));
  process.exit(1);
}
console.log(`roete: ${roete.length} vraestelle ok (${roete.filter((r) => r.genoeg).length} haal die vereiste; ${roete.filter((r) => r.aanvaar).length} met 'n eerlike aanvaar-rede)`);
