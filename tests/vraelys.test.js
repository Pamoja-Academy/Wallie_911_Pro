/* Kort ná-sessie-vraelys: suiwer kort/volledig-reël (WALLIE.SURVEY.velde) en veilige verbruikers van `answers`
   (surveyText, synthesizeDay). `node tests/vraelys.test.js` */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const fails = [];
let n = 0;
const ok = (c, m) => (c ? n++ : fails.push(m));
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}: ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`);

/* surveys.js + sync.js soos in die blaaier (window = globale objek) */
const sb = {
  console,
  localStorage: { getItem: () => null, setItem() {} },
  navigator: {},
  document: { addEventListener() {} },
  addEventListener() {},
  setInterval() {},
  setTimeout() {}
};
sb.window = sb;
vm.createContext(sb);
for (const f of ["assets/js/surveys.js", "assets/js/sync.js"]) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", f), "utf8"), sb, { filename: f });
}
const S = sb.WALLIE.SURVEY;

/* Dagplan: pouse, 3 studieblokke, pouse (soos 'n VASTE_PLANNE-dag, 17 Okt) */
const BLOKKE = [
  { id: "d-opstaan", kind: "break" },
  { id: "d-a", kind: "rooi", soort: "toets" },
  { id: "d-pouse", kind: "break" },
  { id: "d-b", kind: "rooi", soort: "toets" },
  { id: "d-c", kind: "groen", soort: "toets" },
  { id: "d-klaar", kind: "break" }
];
const dag = (uur, min = 0) => new Date(2026, 9, 17, uur, min, 0);
const state = (wallieSurveys = []) => ({ blocks: BLOKKE, wallieSurveys });
const KORT = ["fokus", "moeilikheid"];
const ALLES = ["fokus", "metode", "moeilikheid", "blokkade", "eerlikheid", "help_more"];
const VOL_ZONDER_BLOKKADE = ["fokus", "metode", "moeilikheid", "eerlikheid", "help_more"];

/* volledig(): eerste/middel-blok = kort; laaste studieblok (pouse ná dit ignoreer) = volledig */
ok(S.volledig({ id: "d-a" }, state(), dag(9)) === false, "eerste blok vroeg = kort");
ok(S.volledig({ id: "d-b" }, state(), dag(11)) === false, "middel-blok = kort");
ok(S.volledig({ id: "d-c" }, state(), dag(9)) === true, "laaste studieblok = volledig (die klaar-pouse ná dit tel nie)");
ok(S.volledig(null, state(), dag(9)) === true, "geen blok gekoppel = volledig");
ok(S.volledig({ id: "bestaan-nie" }, state(), dag(9)) === true, "blok nie in die plan = volledig");
ok(S.volledig({ id: "d-a" }, { blocks: [], wallieSurveys: [] }, dag(9)) === true, "leë plan = volledig");
ok(S.volledig({ id: "d-a" }, {}, dag(9)) === true, "state sonder blokke = volledig");
ok(S.volledig({ id: "d-a" }, state(), dag(15, 59)) === false, "15:59 = nog kort");
ok(S.volledig({ id: "d-a" }, state(), dag(16, 0)) === true, "16:00, nog geen volledige vorm vandag = volledig");
ok(S.volledig({ id: "d-b" }, state(), dag(18)) === true, "ná 16:00 sonder volledige vorm = volledig");
const GEHAD = { date: "2026-10-17", answers: { fokus: "4", metode: "ja", moeilikheid: "reg", eerlikheid: "100", help_more: "" } };
ok(S.volledig({ id: "d-b" }, state([GEHAD]), dag(18)) === false, "ná 16:00 maar volledige vorm reeds vandag = kort");
ok(S.volledig({ id: "d-b" }, state([{ ...GEHAD, date: "2026-10-16" }]), dag(18)) === true, "gister se volledige vorm tel nie");
ok(S.volledig({ id: "d-b" }, state([{ date: "2026-10-17", answers: { fokus: "4", moeilikheid: "reg" } }]), dag(18)) === true, "'n kort survey vandag tel nie as volledig nie");
ok(S.volledig({ id: "d-b" }, state([GEHAD]), dag(18).getTime()) === false, "nou as ms werk ook");
ok(S.volledig({ id: "d-c" }, state([GEHAD]), dag(18)) === true, "laaste blok = altyd volledig, ook as een reeds gestoor is");

/* R2 (QC 17 Okt): volledig as vandag nog geen dagvorm is nie EN geen latere toets-/skrif-blok kom nie.
   Sonder dit kry Wallie op 'n normale dag nooit die dagvorm nie (laaste blok = merk/voorbereiding sonder sessie). */
const BLOKKE_MERK = [
  { id: "m-a", kind: "rooi", soort: "toets" },
  { id: "m-merk-a", kind: "rooi", soort: "merk" },
  { id: "m-b", kind: "rooi", soort: "toets" },
  { id: "m-merk-b", kind: "rooi", soort: "merk" },
  { id: "m-tas", kind: "warm", soort: "voor-eksamen" }
];
const stM = (w = []) => ({ blocks: BLOKKE_MERK, wallieSurveys: w });
ok(S.volledig({ id: "m-a" }, stM(), dag(9)) === false, "R2: eerste toets, nog 'n toets kom = kort");
ok(S.volledig({ id: "m-merk-a" }, stM(), dag(10)) === false, "R2: merk-blok, nog 'n toets kom = kort");
ok(S.volledig({ id: "m-b" }, stM(), dag(11)) === true, "R2: LAASTE toets van die dag = volledig (al is die laaste studieblok 'n voorbereidingsblok)");
ok(S.volledig({ id: "m-b" }, stM([GEHAD]), dag(11)) === false, "R2: dagvorm reeds gestoor = kort");
ok(S.volledig({ id: "m-merk-b" }, stM(), dag(12)) === true, "R2: merk ná die laaste toets, nog geen dagvorm = volledig");
ok(S.volledig({ id: "m-merk-b" }, stM([GEHAD]), dag(12)) === false, "R2: merk ná die laaste toets, dagvorm reeds = kort");
/* Generiese rotasie (geen blok het 'n soort): bly die oorspronklike reël — net die laaste blok / ná 16:00 */
const GEN = { blocks: [{ id: "g1", kind: "rooi" }, { id: "g2", kind: "geel" }, { id: "g3", kind: "slot" }], wallieSurveys: [] };
ok(S.volledig({ id: "g1" }, GEN, dag(9)) === false && S.volledig({ id: "g2" }, GEN, dag(11)) === false, "generies: eerste/middel-blok = kort (nie elke survey volledig nie)");
ok(S.volledig({ id: "g3" }, GEN, dag(13)) === true, "generies: laaste blok = volledig");
/* Dae sonder toets/skrif: herdoen-blokke tel, voor-eksamen nie */
const HERD = { blocks: [{ id: "h1", kind: "groen", soort: "herdoen" }, { id: "h2", kind: "groen", soort: "herdoen" }, { id: "h-tas", kind: "warm", soort: "voor-eksamen" }], wallieSurveys: [] };
ok(S.volledig({ id: "h1" }, HERD, dag(9)) === false && S.volledig({ id: "h2" }, HERD, dag(10)) === true, "herdoen-dag: die laaste herdoen-blok (voor die tas) = volledig");

/* velde(): blokkade net by fokus <= 3 of moeilikheid anders as reg */
const kort = (a) => S.velde({ id: "d-a" }, state(), dag(9), a);
const MET_BLOKKADE = ["fokus", "moeilikheid", "blokkade"];
eq(kort({}), KORT, "niks beantwoord: net fokus + moeilikheid");
eq(kort(), KORT, "antwoorde weggelaat");
eq(kort({ fokus: "4", moeilikheid: "reg" }), KORT, "fokus 4 + reg: geen blokkade");
eq(kort({ fokus: "5", moeilikheid: "reg" }), KORT, "fokus 5 + reg: geen blokkade");
eq(kort({ fokus: "3", moeilikheid: "reg" }), MET_BLOKKADE, "fokus 3: blokkade");
eq(kort({ fokus: 2, moeilikheid: "reg" }), MET_BLOKKADE, "fokus 2 (getal): blokkade");
eq(kort({ fokus: "1" }), MET_BLOKKADE, "fokus 1, moeilikheid nog nie beantwoord");
eq(kort({ fokus: "5", moeilikheid: "te_swaar" }), MET_BLOKKADE, "te_swaar: blokkade");
eq(kort({ fokus: "5", moeilikheid: "te_maklik" }), MET_BLOKKADE, "te_maklik: blokkade");
eq(kort({ moeilikheid: "te_swaar" }), MET_BLOKKADE, "net moeilikheid beantwoord");
eq(kort({ fokus: "5", moeilikheid: "reg" }), KORT, "terug by reg + fokus 5: blokkade weer weg");
eq(S.velde({ id: "d-c" }, state(), dag(9), { fokus: "5", moeilikheid: "reg" }), VOL_ZONDER_BLOKKADE, "volle vorm, fokus 5 + reg: geen blokkade");
eq(S.velde({ id: "d-c" }, state(), dag(9), { fokus: "2", moeilikheid: "reg" }), ALLES, "volle vorm, fokus 2: al 6 velde");
eq(S.velde(null, state(), dag(9), { fokus: "1", moeilikheid: "te_swaar" }), ALLES, "geen blok: volle vorm");
/* veld-ids en antwoordwaardes is ongewysig */
eq(S.wallieFields.map((f) => f.id), ALLES, "veld-ids ongewysig");
eq(S.wallieFields.find((f) => f.id === "moeilikheid").options.map((o) => o.v), ["te_maklik", "reg", "te_swaar"], "moeilikheid-waardes ongewysig");
eq(S.wallieFields.find((f) => f.id === "blokkade").options.map((o) => o.v), ["niks", "vermyding", "verward", "moeg", "foon", "tyd"], "blokkade-waardes ongewysig");

/* ---------- Verbruikers van `answers`: nooit "undefined", nooit 'n fout ---------- */
const KORT_S = { id: "ws_1", sessionId: "s_1", subjectSlug: "engels", date: "2026-10-17", at: 1, answers: { fokus: "4", moeilikheid: "reg" } };
const KORT_B = { ...KORT_S, id: "ws_2", answers: { fokus: "2", moeilikheid: "te_swaar", blokkade: "moeg" } };
const VOL_S = { ...KORT_S, id: "ws_3", answers: { fokus: "5", metode: "ja", moeilikheid: "reg", eerlikheid: "100", help_more: "Meer tyd." } };
const HELP_OU = "Meer ou vraestelle asseblief — en ’n kort breek.";
const OU_S = { ...KORT_S, id: "ws_4", answers: { fokus: "4", metode: "ja", moeilikheid: "reg", blokkade: "moeg", eerlikheid: "meeste", help_more: HELP_OU } };
const LEEG_S = { ...KORT_S, id: "ws_5", answers: null };
const GEEN_S = { id: "ws_6", date: "2026-10-17", subjectSlug: "rtt" };
const NULL_S = { ...KORT_S, id: "ws_7", answers: { fokus: "3", moeilikheid: null, metode: undefined } };

const teks = (w) => sb.WALLIE.SYNC.surveyText(w);
eq(teks(KORT_S), "Vak: engels\nFokus: 4/5\nmoeilikheid: reg", "surveyText kort");
eq(teks(KORT_B), "Vak: engels\nFokus: 2/5\nBlokkade: moeg\nmoeilikheid: te_swaar", "surveyText kort + blokkade");
eq(teks(VOL_S), "Vak: engels\nFokus: 5/5\nMetode: ja\nEerlikheid: 100\nHelp: Meer tyd.\nmoeilikheid: reg", "surveyText volledig");
eq(
  teks(OU_S),
  ["Vak: engels", "Fokus: 4/5", "Metode: ja", "Blokkade: moeg", "Eerlikheid: meeste", "Help: " + HELP_OU, "moeilikheid: reg"].join("\n"),
  "surveyText ou (alle ses velde) onveranderd"
);
for (const [naam, w] of [["kort", KORT_S], ["kort+b", KORT_B], ["vol", VOL_S], ["ou", OU_S], ["null", LEEG_S], ["geen", GEEN_S], ["nulle", NULL_S]]) {
  let t = null;
  try {
    t = teks(w);
  } catch (e) {
    fails.push(`surveyText ${naam} het 'n fout gegooi: ${e.message}`);
  }
  ok(t != null && !/undefined|null|NaN/.test(t), `surveyText ${naam} bevat nie undefined/null nie: ${t}`);
}

const syn = (surveys, pa = []) =>
  sb.WALLIE.synthesizeDay({ sessions: [{ date: "2026-10-17" }], wallieSurveys: surveys, paSurveys: pa }, "2026-10-17");
const PA = { date: "2026-10-17", sessionId: "s_1", answers: { produksie: "besig", teenwoordig: "nee", vertroue: "laag", verandering: "korter" } };
for (const [naam, lys] of [
  ["kort", [KORT_S]],
  ["kort+blokkade", [KORT_B]],
  ["volledig", [VOL_S]],
  ["ou", [OU_S]],
  ["gemeng", [KORT_S, KORT_B, VOL_S, OU_S]],
  ["answers null", [LEEG_S]],
  ["geen answers", [GEEN_S]],
  ["nulle", [NULL_S]]
]) {
  for (const pa of [[], [PA]]) {
    let r = null;
    try {
      r = syn(lys, pa);
    } catch (e) {
      fails.push(`synthesizeDay ${naam} (pa=${pa.length}) het 'n fout gegooi: ${e.message}`);
    }
    const t = JSON.stringify(r);
    ok(r && !/undefined|NaN/.test(t), `synthesizeDay ${naam} (pa=${pa.length}) bevat nie undefined/NaN nie: ${t}`);
  }
}
/* Reëls wat 'n afwesige veld nodig het, word oorgeslaan (kort survey: geen eerlikheid/metode-vlae) */
const kortSyn = syn([KORT_S], [PA]);
ok(!kortSyn.flags.some((f) => /hy sê eerlikheid|memo\/lees eers/.test(f.text)), "kort survey: geen eerlikheid/metode-vlag");
ok(kortSyn.flags.some((f) => /MISMATCH: hy beweer sterk fokus/.test(f.text)), "kort survey fokus 4 + Pa 'besig': fokus-mismatch bly (fokus is wel aanwesig)");
ok(!syn([LEEG_S], [PA]).flags.some((f) => /MISMATCH/.test(f.text)), "answers null: geen mismatch");
eq(syn([KORT_S]).avgFokus, "4.0", "gem. fokus van kort survey");
const ouSyn = syn([{ ...OU_S, answers: { fokus: "2", metode: "nee", moeilikheid: "te_swaar", blokkade: "foon", eerlikheid: "swak", help_more: "Pa check mid-sessie" } }], [PA]);
ok(ouSyn.flags.some((f) => /memo\/lees eers/.test(f.text)), "ou survey: metode-vlag onveranderd");
ok(ouSyn.flags.some((f) => /self-aangee foon/.test(f.text)), "ou survey: blokkade-vlag onveranderd");
ok(ouSyn.flags.some((f) => /fokus self ≤2/.test(f.text)), "ou survey: fokus-vlag onveranderd");
ok(ouSyn.flags.some((f) => /eerlikheid was swak/.test(f.text)), "ou survey: eerlikheid-vlag onveranderd");
ok(ouSyn.aksies.some((a) => a.includes("Pa check mid-sessie")), "ou survey: help_more-aksie onveranderd");

/* Plan-gebaseerd (QC 17 Okt): op elke vaste plan-dag 15-26 Okt kry Wallie, as hy net op toets-/skrif-blokke 'n sessie doen
   (merk-/les-/voor-eksamen-blokke net klaar gemerk), TEN MINSTE EEN volle dagvorm. Die survey maak 2 min ná die blok se einde oop. */
{
  const ps = { console, localStorage: { getItem: () => null, setItem() {} }, navigator: {}, document: { addEventListener() {} }, addEventListener() {}, setInterval() {}, setTimeout() {} };
  ps.window = ps;
  vm.createContext(ps);
  for (const f of ["assets/js/data.js", "assets/js/pa-konsole/exams.js", "assets/js/schedule.js", "assets/js/surveys.js"]) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, "..", f), "utf8"), ps, { filename: f });
  }
  for (let d = 15; d <= 26; d++) {
    const dagStr = "2026-10-" + d;
    const plan = ps.WALLIE.buildDayPlan(dagStr);
    const surveys = [];
    let volle = 0;
    /* Waar sessies realisties is: toets/skrif; op dae sonder dié (bv. 25 Okt) die herdoen-blokke (nie voor-eksamen nie) */
    const studieBl = plan.blocks.filter((b) => b.kind !== "break");
    const toetse = studieBl.filter((b) => b.soort === "toets" || b.soort === "skrif");
    const reeks = toetse.length ? toetse : studieBl.filter((b) => b.soort && b.soort !== "voor-eksamen");
    for (const b of plan.blocks) {
      if (b.kind === "break" || !reeks.includes(b)) continue;
      const [h, m] = b.end.split(":").map(Number);
      const nou = new Date(2026, 9, d, h, m + 2, 0);
      const vol = ps.WALLIE.SURVEY.volledig({ id: b.id }, { blocks: plan.blocks, wallieSurveys: surveys }, nou);
      if (vol) {
        volle += 1;
        surveys.push({ date: dagStr, answers: { fokus: "4", moeilikheid: "reg", metode: "ja", eerlikheid: "100", help_more: "" } });
      }
    }
    if (reeks.length) ok(volle >= 1, "plan " + dagStr + ": 'n normale dag (sessies op toets/skrif-blokke) gee ten minste een volle dagvorm, nie " + volle);
  }
}

if (fails.length) {
  console.error(`✗ ${fails.length} mislukking(s):\n` + fails.map((f) => " - " + f).join("\n"));
  process.exit(1);
}
console.log(`vraelys.test.js: ${n} kontroles geslaag`);
