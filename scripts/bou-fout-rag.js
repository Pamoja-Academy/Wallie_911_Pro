/* Bou data/fout-rag.json — die korpus waarin die foutvanger 'n antwoord vir Wallie soek.
   `node scripts/bou-fout-rag.js` (voeg `--kyk` by om net te kyk of die nagespoorde lêer nog klop)

   AGENTS.md §2.4: geen hallusinasie. Elke inskrywing het 'n `bron` wat na 'n werklike lêer + reël
   in hierdie repo wys, en `node tests/fout-rag.test.js` faal as 'n bron nie bestaan nie of as die
   nagespoorde JSON nie meer by die bronne pas nie.

   Drie bronne:
   1. assets/js/hulp.js → SUPPORT_FAQ (die vrae en antwoorde wat reeds vir Wallie geskryf is)
   2. docs/LESSONS-LEARNED.md → die lesse met 'n simptoom wat Wallie self op die skerm sien
   3. docs/SPEK-FOUTVANGER-2026-10-28.md §4 → die tegniese foutseine

   Bron 1 word outomaties onttrek (die teks bly woordeliks dié van hulp.js). Bron 2 en 3 se
   Wallie-antwoorde staan hier onder met die hand geskryf, want die lesse is vir ontwikkelaars
   geskryf en nie in Wallie se register nie — maar elkeen wys na die reël wat dit regverdig. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const UIT = path.join(root, "data", "fout-rag.json");
const SPEK = "docs/SPEK-FOUTVANGER-2026-10-28.md";

/* CRLF word altyd afgeplat: met `core.autocrlf=true` op Windows het die werkkopie CRLF, en dan sou
   die onttrekking hier plaaslik faal maar op CI (LF) werk — presies die vals verskil van LL-05. */
function lees(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8").replace(/\r\n/g, "\n");
}

/* Die reël (1-gebaseer) waar `soek` die eerste keer in `teks` voorkom. */
function reëlVan(teks, soek) {
  const i = teks.indexOf(soek);
  if (i < 0) return null;
  return teks.slice(0, i).split("\n").length;
}

/* FAQ-inskrywings wat NIE in die RAG hoort nie. Die FAQ is 'n blad wat Wallie self deurblaai; die
   RAG is 'n AKTIEWE antwoord wat die app hom gee. 'n Reël wat in die FAQ begrawe lê, mag nie 'n
   aanbeveling word nie (QC 28 Okt). Elkeen met die rede. */
const UITGESLUIT = {
  /* "Pa gee jou die vraestel op papier of as PDF … vra vir Pa" breek AGENTS.md §2.9 (die inhoud is
     IN die app) en is presies LL-17 se mislukking. `les-werk-in-die-app` gee die korrekte antwoord.
     Die FAQ-teks in hulp.js:89 moet ook reggemaak word — dit is 'n aparte besluit vir Hanno. */
  "ander-vraestel": true,
  /* "Het jy die volle vraestel nodig, vra vir Pa" (hulp.js:32) — dieselfde probleem. Die nuttige
     helfte van hierdie inskrywing (hoe die bron-teks en 'Wys memo' werk) word reeds deur
     faq-rubriek en les-memo-hek gedek. */
  "vraestel-memo": true,
  /* "Pa kry dit." — hulp.js skryf net na wallie911.support wat niemand lees nie (QC rondte 2). Die
     antwoord het ook by "dit stuur nie na Pa nie" uitgekom, juis wanneer sending stukkend is. */
  stuur: true,
  /* "...Laai die blad dan, laat weet vir Pa." (hulp.js:59) — lees as herlaai-raad en stuur na Pa (QC rondte 3). */
  "rtt-skakel": true,
  /* "…Sien jy 'Kon nie stoor nie', maak 'n gewone venster oop" (hulp.js:31): 'n nuwe venster kos 'n sessie sy fokus (QC rondte 3).
     Die outomatiese `sein-stoor-vol` dek hierdie geval reeds, sonder die venster-raad. */
  "skryf-stoor": true
};

/* ---------- 1. SUPPORT_FAQ uit hulp.js ---------- */
/* Ons eval net die konstantes + die SUPPORT_FAQ-letterlike in 'n leë sandbox: hulp.js self raak
   aan document/localStorage en kan nie in Node loop nie. */
function faqUitHulp() {
  const rel = "assets/js/hulp.js";
  const bron = lees(rel);
  const begin = bron.indexOf("  var SKRYF_STOOR");
  const eindMerk = "\n  ];\n";
  const faqBegin = bron.indexOf("  var SUPPORT_FAQ = [");
  if (begin < 0 || faqBegin < 0) throw new Error("hulp.js: SKRYF_STOOR of SUPPORT_FAQ nie gevind nie");
  const eind = bron.indexOf(eindMerk, faqBegin);
  if (eind < 0) throw new Error("hulp.js: die einde van SUPPORT_FAQ nie gevind nie");
  const brokkie = bron.slice(begin, eind + eindMerk.length) + "\n;SUPPORT_FAQ";
  const faq = vm.runInNewContext(brokkie, Object.create(null), { timeout: 5000 });
  if (!Array.isArray(faq) || !faq.length) throw new Error("hulp.js: SUPPORT_FAQ is leeg");

  return faq.filter((e) => !UITGESLUIT[e.id]).map((e) => ({
    id: "faq-" + e.id,
    soort: "faq",
    vakke: e.vakke.slice().sort(),
    /* Die vraag soos dit vir Wallie geskryf is, is presies die simptoom wat hy sou rapporteer. */
    simptome: [e.vraag],
    seine: [],
    antwoord: e.antwoord,
    bron: rel + ":" + reëlVan(bron, 'id: "' + e.id + '"')
  }));
}

/* ---------- 2. Lesse met 'n simptoom wat Wallie sien ---------- */
/* Net die lesse waar die app iets aan Wallie gedoen het wat hy op die skerm sien. Die antwoord is
   wat hy op daardie oomblik moet doen — nie die ontwikkelaar se regstelling nie. */
const UIT_LESSE = [
  /* 30 Okt, LL-23: INHOUDSFOUTE. Die foutvanger sien dit nooit; Wallie moet dit kan KIES en presies kan sê. */
  {
    id: "inhoud-prakties-by-teorie",
    soort: "inhoud",
    ll: "LL-23",
    vakke: ["rtt", "engels", "afrikaans", "gasvryheid", "toerisme", "wiskgelett", "algemeen"],
    simptome: [
      "Die blok wys praktiese werk, maar ek skryf teorie.",
      "Dit gee my praktiese vrae wat ek nie gaan skryf nie.",
      "Die Office-knoppie of 'n Excel-les verskyn by 'n teorievraestel."
    ],
    seine: [],
    bewys: [{ lêer: "assets/js/lesson-ui.js", patroon: 'b.soort === "voor-eksamen"' }],
    antwoord:
      "Dit is 'n fout in die plan, nie joune nie. Jou werk is net die DBE-vraestel bo-aan die blok (Vraestel en Memo). " +
      "Ignoreer enige les of Office-knoppie wat nie by daardie vraestel pas nie. Druk 'Stuur probleem' sodat Pa die blok regmaak."
  },
  {
    id: "inhoud-engels",
    soort: "inhoud",
    ll: "LL-23",
    vakke: ["rtt", "engels", "afrikaans", "gasvryheid", "toerisme", "wiskgelett", "algemeen"],
    simptome: [
      "Die vraag of les is in Engels, nie in Afrikaans nie.",
      "Ek moet Google Translate gebruik om die vraag te verstaan."
    ],
    seine: [],
    antwoord:
      "Werk uit die amptelike DBE-vraestel bo-aan die blok: dit is in jou eksamentaal (Afrikaans, behalwe by Engels). " +
      "Ignoreer enigiets anders in die app wat in Engels is; jy hoef niks te vertaal nie. Druk 'Stuur probleem' sodat Pa dit regmaak."
  },
  {
    id: "inhoud-verkeerde-werk",
    soort: "inhoud",
    ll: "LL-23",
    vakke: ["rtt", "engels", "afrikaans", "gasvryheid", "toerisme", "wiskgelett", "algemeen"],
    simptome: [
      "Die blok se werk pas nie by my eksamen nie.",
      "Dit is die verkeerde vraestel of die verkeerde vak."
    ],
    seine: [],
    antwoord:
      "Doen die blok uit die DBE-vraestel van die vak wat jy volgende skryf (sien die aftelling op die Missie-skerm). " +
      "Ignoreer die res. Skryf in die blokkie hier onder wat verkeerd is en druk 'Stuur probleem', sodat Pa presies weet wat om reg te maak."
  },
  {
    id: "les-oortjie-slot",
    ll: "LL-20",
    vakke: ["rtt", "engels", "afrikaans", "gasvryheid", "toerisme", "wiskgelett", "algemeen"],
    simptome: [
      "Die skerm het gesluit terwyl ek die memo in 'n ander oortjie gelees het.",
      "Die app waarsku my en sluit terwyl ek by die vraestel of memo is.",
      "Dit sê ek kyk weg maar ek lees die memo."
    ],
    /* Geen sein nie: 'n oortjie-slot is 'n proctor-besluit, nie 'n blaaierfout wat die vanger sien
       nie. Hierdie inskrywing word deur die simptoom-teks bereik, nie deur 'n sein nie. */
    seine: [],
    antwoord:
      "'n Merk- of skrifblok waarvan die vraestel of memo in 'n ander oortjie oop is, mag jou NIE sluit nie. " +
      "Gebeur dit, is dit 'n fout in die app en nie jou skuld nie. " +
      "Maak die blad NIE toe of weer oop nie (dit beëindig die sessie): gaan aan met merk; jou tyd en punte bly geldig. By 'n RTT-praktiese blok " +
      "druk eers 'Begin praktiese blok (Office)', dan tel Word, Excel, Access en Notepad nie as wegkyk nie."
  },
  {
    id: "les-memo-hek",
    ll: "LL-01",
    vakke: ["algemeen", "engels", "afrikaans", "rtt", "gasvryheid", "toerisme", "wiskgelett"],
    /* Die simptome is wat WALLIE sou tik, nie wat 'n ontwikkelaar sou skryf nie. Die soektog is
       leksikaal, dus moet die gewone Afrikaanse variante hier staan: "reageer nie", "doen niks",
       "gebeur niks". Dit verander geen antwoord nie — dit maak net die bestaande antwoord vindbaar
       (28 Okt: "die memo-knoppie reageer nie" het eers niks gegee nie). */
    simptome: [
      "Die memo wil nie oopmaak nie.",
      "Ek kan nie die antwoorde sien voordat die tyd om is nie.",
      "Die knoppie 'Wys memo' doen niks.",
      "Die memo-knoppie reageer nie.",
      "Niks gebeur as ek op die memo druk nie."
    ],
    seine: [],
    /* 28 Okt, deur QC gevang: die ou teks het gesê die memo gaan oop "as jy 'Klaar' druk" — dit
       nooi presies die LL-01-mislukking uit (8 blokke in 30 s klaar gemerk om by die memo te kom).
       memoOntsluit() vereis die tyd verby, OF 'Klaar' SAAM MET genoeg werk (60% van die tyd). */
    bewys: [{ lêer: "assets/js/eksamenmodus.js", patroon: "Boolean(st.klaar) && minWerkGedoen(st)" }],
    antwoord:
      "Dit is nie 'n fout nie: in eksamenmodus gaan die memo eers oop as die tyd om is. 'Ek is klaar' " +
      "maak dit net oop as jy ook regtig die werk gedoen het (omtrent 60% van die tyd). Dit is " +
      "doelbewus so: 'n memo een klik weg maak die oefening niks werd. Moenie vroeg klaar druk om by " +
      "die memo te kom nie — dan verloor jy die oefening én Pa sien dit. Is die tyd verby en die memo " +
      "bly toe, dán is dit 'n fout: rapporteer dit en gaan aan met die volgende vraag op papier."
  },
  {
    id: "les-selfde-vraestel",
    ll: "LL-18",
    vakke: ["wiskgelett", "rtt", "engels", "afrikaans", "gasvryheid", "toerisme", "algemeen"],
    simptome: [
      "Dit is dieselfde vraestel as voorheen.",
      "Ek het hierdie werk al gedoen.",
      "Dit lyk net na 5 vrae."
    ],
    seine: [],
    antwoord:
      "Die app moet jou nooit 'n vraestel gee wat jy al gehad het nie. Druk die knoppie wat sê jy het " +
      "dit al gedoen, dan ruil die app na 'n ander amptelike DBE-vraestel. Gebeur dit nie, rapporteer " +
      "dit. En let op: '5 vrae' is 'n VOLLEDIGE vraestel — vyf hoofvrae met baie subvrae, nie vyf vragies nie."
  },
  {
    id: "les-werk-in-die-app",
    ll: "LL-17",
    vakke: ["algemeen", "wiskgelett", "engels", "afrikaans", "gasvryheid", "toerisme", "rtt"],
    simptome: [
      "Die blok sê Pa moet my die vraestel gee.",
      "Daar is geen werk in die blok nie.",
      "Ek weet nie wat om te doen in hierdie blok nie."
    ],
    seine: [],
    antwoord:
      "Elke werkblok se vraestel, antwoordeboek en memo moet IN die app wees. Sê 'n blok dat iemand " +
      "anders jou die vraestel moet gee, is dit 'n fout in die plan: rapporteer dit. Begin solank met " +
      "die vorige vraestel van dieselfde vak wat wél in die app is, sodat die tyd nie verlore gaan nie."
  },
  {
    id: "les-sessie-begin-nie",
    /* 28 Okt, deur QC gevang: hierdie antwoord het gesê 'n sessie "mag sonder die kamera begin" en
       dat hy weer moet druk. Dit is ONWAAR — proctor.start() gee {ok:false} en roep begin() nooit
       as getUserMedia misluk nie, dus lewer "druk weer" net dieselfde boodskap, vir altyd. Die bron
       was boonop LL-21, wat niks oor die kamera sê nie. Die antwoord staan nou by wat die kode doen,
       en die bron is die kode self. */
    bron: "assets/js/proctor.js",
    bronSoek: "Hard-modus vereis kamera",
    bewys: [
      { lêer: "assets/js/proctor.js", patroon: "Hard-modus vereis kamera" },
      { lêer: "assets/js/app.js", patroon: "WALLIE.REMOTE?.startFailed" }
    ],
    vakke: ["algemeen", "rtt", "engels", "afrikaans", "gasvryheid", "toerisme", "wiskgelett"],
    simptome: [
      "Die sessie wil nie begin nie.",
      "Niks gebeur as ek 'Begin sessie' druk.",
      "Die app vra vir die kamera en gaan dan nie verder nie.",
      "Die kamera werk nie en die sessie begin nie."
    ],
    seine: ["notallowederror", "notfounderror", "getusermedia"],
    antwoord:
      "Die sessie het die kamera nodig; sonder dit begin dit nie, en weer druk gee dieselfde boodskap. " +
      "Laat die kamera toe in die blaaier (die slotjie langs die adres), en maak seker geen ander program " +
      "(Teams, Zoom, die kamera-app) gebruik die kamera nie. Werk dit steeds nie: begin NIE die sessie nie — skryf op " +
      "papier met 'n horlosie op die tafel en merk die blok daarna klaar. Jou minute gaan nie verlore " +
      "nie."
  }
];

function lesInskrywings() {
  return UIT_LESSE.map((e) => {
    /* Die bron is óf 'n les in LESSONS-LEARNED, óf (beter) die kode wat die antwoord waar maak. */
    let bronRel;
    let soek;
    if (e.bron) {
      bronRel = e.bron;
      soek = e.bronSoek;
    } else {
      bronRel = "docs/LESSONS-LEARNED.md";
      soek = "| " + e.ll + " |";
    }
    const teks = lees(bronRel);
    const reël = reëlVan(teks, soek);
    if (!reël) throw new Error(bronRel + ': "' + soek + '" nie gevind nie');
    const uit = {
      id: e.id,
      soort: e.soort || "les",
      vakke: e.vakke.slice().sort(),
      simptome: e.simptome,
      /* Seine word altyd klein gestoor: die soektog vergelyk teen 'n klein gemaakte boodskap. */
      seine: e.seine.map((s) => s.toLowerCase()),
      antwoord: e.antwoord,
      bron: bronRel + ":" + reël
    };
    /* `bewys`: die antwoord maak 'n bewering oor wat die app DOEN. Elke patroon moet in sy lêer
       voorkom, anders faal die bou én tests/fout-rag.test.js. So kan 'n handgeskrewe antwoord nie
       stilweg van die kode af wegdryf nie (QC 28 Okt: die bron-kontrole was net 'n reëlnommer). */
    if (e.bewys) {
      uit.bewys = e.bewys.map((b) => {
        const inhoud = lees(b.lêer);
        if (inhoud.indexOf(b.patroon) < 0) {
          throw new Error(e.id + ": bewys ontbreek in " + b.lêer + ': "' + b.patroon + '"');
        }
        return { lêer: b.lêer, patroon: b.patroon };
      });
    }
    return uit;
  });
}

/* ---------- 3. Tegniese foutseine (spek §4) ---------- */
/* `seine` is substringe van die foutvanger se sein-string en van die blaaier se eie boodskap; hulle
   word klein gemaak voor vergelyking. Die vanger se sein het 'n vaste vorm:
     JS-fout:     js|<boodskap, getalle vervang met #>|<lêer>
     hulpbron:    hulpbron|script|<pad>   (of link/img)
   LET OP (28 Okt, nagegaan met die vanger se werklike seine): 'n sein moet SPESIFIEK wees.
   "404" en "assets/js/" was te los — elke JS-fout se sein noem sy lêer, en elke mislukte hulpbron
   het 'n statuskode, dus het 'n stoor-fout en 'n kamera-fout die skrip-antwoord gekry. Gebruik
   die `hulpbron|`-voorvoegsel vir hulpbron-foute en die fout se eie naam vir JS-foute. */
const SEINE = [
  {
    id: "sein-rag-dekking",
    vakke: ["algemeen"],
    simptome: ["Die sessieskerm sê die werk is nog nie nagegaan nie."],
    seine: ["rag-dekking"],
    antwoord:
      "Net die nagaan-reël is weg, nie jou werk nie. Die vraestel, die tyd en die memo werk steeds. " +
      "Gaan aan met die blok."
  },
  {
    id: "sein-skrip-laai-nie",
    bewys: [{ lêer: "assets/js/app.js", patroon: 'outcome: "onderbreek"' }],
    vakke: ["algemeen"],
    simptome: ["'n Skerm is leeg.", "'n Knoppie doen niks.", "Die blad lyk stukkend."],
    seine: ["hulpbron|script", "hulpbron|link", "loading chunk", "net::err_abort"],
    /* Vangnet: "'n hulpbron het nie gelaai nie" is die algemene geval. 'n Inskrywing wat 'n spesifieke
       lêer of fout noem (bv. rag-dekking) moet hierdie een altyd klop. */
    sein_algemeen: true,
    antwoord:
      "'n Deel van die app het nie gelaai nie. Moenie die blad herlaai nie: dit beëindig 'n lopende sessie. " +
      "Werk op papier aan met dieselfde vraestel en merk die blok daarna klaar: jou minute tel."
  },
  {
    id: "sein-typeerror",
    bewys: [{ lêer: "assets/js/app.js", patroon: 'outcome: "onderbreek"' }],
    vakke: ["algemeen"],
    simptome: [
      "'n Knoppie doen niks.",
      "Die app hang.",
      "Niks gebeur as ek klik nie.",
      "Die app reageer glad nie meer nie.",
      "Die knoppie reageer nie."
    ],
    seine: ["is not a function", "cannot read properties", "undefined is not an object", "null is not an object"],
    antwoord:
      "Daar is 'n fout in die app, nie in jou werk nie. Moenie die blad herlaai nie: dit beëindig 'n lopende sessie. " +
      "Gaan aan op papier en merk die blok klaar wanneer jy klaar is."
  },
  {
    id: "sein-stoor-vol",
    vakke: ["algemeen", "engels", "afrikaans"],
    simptome: ["Dit sê 'Kon nie stoor nie'.", "My punte stoor nie.", "My self-nasien stoor nie."],
    seine: ["quotaexceedederror", "exceeded the quota", "securityerror", "setitem"],
    antwoord:
      "Jou blaaier is in privaat modus, of die geheue is vol. Moenie nou 'n ander venster oopmaak terwyl 'n sessie loop nie: " +
      "dit tel as wegkyk. Neem solank 'n foto van jou bladsy en skryf jou punt in die foutbank, sodat niks verlore gaan nie; " +
      "probeer weer ná die sessie."
  },
  {
    id: "sein-netwerk",
    vakke: ["algemeen"],
    simptome: ["Die aanwyser bly op 'wag'.", "Dit sê geen verbinding nie.", "Dit stuur nie na Pa nie."],
    seine: ["aborterror", "failed to fetch", "networkerror", "timeout", "err_internet_disconnected"],
    antwoord:
      "Geen internet nie. Dit is nie 'n fout nie: alles bly op hierdie toestel en gaan self deur sodra " +
      "jy weer aanlyn is. Moenie wag of herlaai nie — gaan aan met die werk. Die vraag, memo en rubriek " +
      "werk ook sonder internet as die blad reeds gelaai het."
  },
  {
    id: "sein-dbe-skakel",
    vakke: ["rtt", "wiskgelett", "toerisme", "gasvryheid", "engels", "afrikaans"],
    simptome: ["Die DBE-skakel laai nie.", "Die vraestel-PDF maak nie oop nie.", "Die memo-skakel is dood."],
    seine: ["education.gov.za", "linkclick"],
    antwoord:
      "Die DBE se webwerf antwoord nie. Probeer een keer weer. Bly dit dood, is die skakel verouderd: " +
      "laat weet vir Pa. Gaan solank aan met die vrae wat reeds in die app staan, of met die vorige " +
      "vraestel van dieselfde vak."
  }
];

function seinInskrywings() {
  const bron = lees(SPEK);
  const reël = reëlVan(bron, "## 4. Foutseine");
  if (!reël) throw new Error(SPEK + ": §4 nie gevind nie");
  return SEINE.map((e) => {
    const uit = {
      id: e.id,
      soort: "sein",
      vakke: e.vakke.slice().sort(),
      simptome: e.simptome,
      seine: e.seine.map((s) => s.toLowerCase()),
      antwoord: e.antwoord,
      bron: SPEK + ":" + reël
    };
    if (e.sein_algemeen) uit.sein_algemeen = true;
    /* Cursor Bugbot, 28 Okt: die bewys van die sein-inskrywings is stilweg weggelaat. Dieselfde kontrole as vir lesse. */
    if (e.bewys) {
      uit.bewys = e.bewys.map((b) => {
        if (lees(b.lêer).indexOf(b.patroon) < 0) {
          throw new Error(e.id + ": bewys ontbreek in " + b.lêer + ': "' + b.patroon + '"');
        }
        return { lêer: b.lêer, patroon: b.patroon };
      });
    }
    return uit;
  });
}

/* ---------- bou ---------- */
function bou() {
  const inskrywings = [].concat(faqUitHulp(), lesInskrywings(), seinInskrywings());

  const gesien = Object.create(null);
  inskrywings.forEach((e) => {
    if (gesien[e.id]) throw new Error("dubbele id: " + e.id);
    gesien[e.id] = true;
    if (!e.bron || !/:\d+$/.test(e.bron)) throw new Error(e.id + ": geen bron met 'n reëlnommer nie");
    if (!e.antwoord || e.antwoord.length < 40) throw new Error(e.id + ": antwoord te kort");
    if (!e.simptome.length && !e.seine.length) throw new Error(e.id + ": geen simptoom of sein nie");
  });
  /* Stabiele volgorde sodat die nagespoorde lêer nie sonder inhoudsverandering verskil nie. */
  inskrywings.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  return {
    gegenereer_deur: "scripts/bou-fout-rag.js",
    metode:
      "Onttrek uit assets/js/hulp.js (SUPPORT_FAQ, woordeliks), docs/LESSONS-LEARNED.md (lesse met 'n " +
      "simptoom wat Wallie sien) en docs/SPEK-FOUTVANGER-2026-10-28.md §4 (tegniese foutseine). " +
      "Elke inskrywing wys na sy bron; tests/fout-rag.test.js faal as 'n bron nie bestaan nie.",
    korpus: {
      inskrywings: inskrywings.length,
      faq: inskrywings.filter((e) => e.soort === "faq").length,
      lesse: inskrywings.filter((e) => e.soort === "les").length,
      seine: inskrywings.filter((e) => e.soort === "sein").length
    },
    inskrywings
  };
}

const data = bou();
const teks = JSON.stringify(data, null, 1) + "\n";

if (process.argv.includes("--kyk")) {
  const bestaande = fs.existsSync(UIT) ? fs.readFileSync(UIT, "utf8") : "";
  if (bestaande.replace(/\r\n/g, "\n") !== teks) {
    console.error("data/fout-rag.json is nie op datum nie — hardloop `node scripts/bou-fout-rag.js`");
    process.exit(1);
  }
  console.log("data/fout-rag.json is op datum (" + data.korpus.inskrywings + " inskrywings)");
} else {
  fs.writeFileSync(UIT, teks);
  console.log(
    "data/fout-rag.json geskryf: " +
      data.korpus.inskrywings +
      " inskrywings (" +
      data.korpus.faq +
      " FAQ, " +
      data.korpus.lesse +
      " lesse, " +
      data.korpus.seine +
      " seine)"
  );
}
