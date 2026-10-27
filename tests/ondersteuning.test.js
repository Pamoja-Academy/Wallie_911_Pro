/* Realtyd-ondersteuning: die kontrole wat die sessieskerm voor die werk wys.
   `node tests/ondersteuning.test.js`

   Wat hier getoets word:
   1. die regte vraestel (2025-nov-wg-v2) kom deur as groen;
   2. sonder die RAG-tabel is dit nog steeds groen (net "nie nagegaan nie"), nooit 'n fout nie;
   3. 'n vraestel wat al gesien is (REEDS_GESIEN of Wallie se eie antwoord) is rooi;
   4. 'n RAG wat 'n ander punt per vraag sien, is rooi (die standaard word nie blindelings geglo nie);
   5. te min tyd vir die punte is geel; "Pa gee" is rooi; 'n skrif-blok sonder werk is rooi;
   6. die kontrole skryf NIKS (geen localStorage, geen netwerk) en is deterministies. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const fails = [];
let passed = 0;
function assert(cond, msg) {
  if (cond) passed += 1;
  else fails.push(msg);
}

const store = {};
const skryf = [];
const sandbox = {
  console,
  JSON,
  Math,
  Date,
  URL,
  localStorage: {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => {
      skryf.push(k);
      store[k] = String(v);
    },
    removeItem: (k) => {
      skryf.push(k);
      delete store[k];
    }
  },
  document: { getElementById: () => null, querySelector: () => null, addEventListener: () => {} }
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;

for (const f of ["assets/js/vraebank-rtt-v1.js", "assets/js/dbe-vraestelle.js",
  "assets/js/dbe-vraestelle-oorblywend.js", "assets/js/ondersteuning.js"]) {
  vm.runInNewContext(fs.readFileSync(path.join(root, f), "utf8"), sandbox, { filename: f });
}

const OND = sandbox.WALLIE && sandbox.WALLIE.ONDERSTEUNING;
assert(Boolean(OND), "WALLIE.ONDERSTEUNING is nie gedefinieer nie");
if (!OND) {
  console.error("ondersteuning: FOUT\n - " + fails.join("\n - "));
  process.exit(1);
}

const RAG = {
  vraestelle: {
    "dbe-2025-nov-wg-v2": { vak: "wiskgelett", sessie: "2025-nov", vraestel: "V2",
      vrae: [28, 34, 32, 30, 26], bron: "memo", gedek: true, volledig: true, stem: true }
  }
};

/* --- 1. die vraestel van die 24ste --- */
const blokVandag = {
  id: "wg-v2-proef-a", soort: "skrif", minutes: 180, punte: 150,
  title: "Wisk. Gel. V2 proefeksamen: DBE November 2025 V2, volledige vraestel (150 punte, 3 uur)",
  detail: "Volle eksamentoestande."
};
const werkVandag = { tipe: "vraestel", id: "dbe-2025-nov-wg-v2" };

OND._setRag(RAG);
const groen = OND.kontroleer(werkVandag, blokVandag);
assert(groen.vlak === "groen", `regte vraestel moet groen wees, is ${groen.vlak} (${groen.opsomming})`);
assert(/stem met die DBE-teks/i.test(groen.opsomming), `opsomming moet die DBE-kontrole noem: ${groen.opsomming}`);
assert(groen.reëls.some((r) => r.id === "katalogus" && r.erns === "ok"), "katalogus-reël ontbreek");
assert(groen.reëls.some((r) => r.id === "herhaling" && r.erns === "ok"), "herhaling-reël ontbreek");
assert(groen.reëls.every((r) => !/undefined/.test(r.teks)), "reël met 'undefined' in");

/* --- 2. sonder die RAG (bv. file:// of die eerste oomblik) --- */
OND._setRag(null);
const sonderRag = OND.kontroleer(werkVandag, blokVandag);
assert(sonderRag.vlak === "groen", `sonder RAG moet dit groen bly, is ${sonderRag.vlak}`);
assert(/nog nie .*nagegaan nie/i.test(sonderRag.reëls.find((r) => r.id === "standaard").teks), "sonder RAG moet die standaard-reël dit sê");

/* --- 3. herhaling: die app se register en Wallie se eie antwoord --- */
OND._setRag(RAG);
const herhaling = OND.kontroleer({ tipe: "vraestel", id: "dbe-2026-jun-wg-v1" },
  { ...blokVandag, title: "… volledige vraestel" });
assert(herhaling.vlak === "rooi", `REEDS_GESIEN moet rooi wees, is ${herhaling.vlak}`);
assert(/register/i.test(herhaling.opsomming), `rooi opsomming moet die register noem: ${herhaling.opsomming}`);

store["wallie911_vraestel_gesien"] = JSON.stringify({ v: 1, gesien: { "dbe-2025-nov-wg-v2": true } });
const self = OND.kontroleer(werkVandag, blokVandag);
assert(self.vlak === "rooi", `Wallie se eie "gesien" moet rooi wees, is ${self.vlak}`);
delete store["wallie911_vraestel_gesien"];

/* --- 4. die RAG sien 'n ander punt: die standaard mag NIE stilweg aanvaar word nie --- */
OND._setRag({ vraestelle: { "dbe-2025-nov-wg-v2": { ...RAG.vraestelle["dbe-2025-nov-wg-v2"], vrae: [28, 34, 33, 30, 26] } } });
const verskil = OND.kontroleer(werkVandag, blokVandag);
assert(verskil.vlak === "rooi", `verskil in punte moet rooi wees, is ${verskil.vlak}`);
assert(/Vraag 3: app sê 32, DBE sê 33/.test(verskil.opsomming), `verskil moet die vraag noem: ${verskil.opsomming}`);

/* --- 5. gedeeltelik nagegaan is 'n kennisgewing, nie 'n fout nie --- */
OND._setRag({ vraestelle: { "dbe-2025-nov-wg-v2": { ...RAG.vraestelle["dbe-2025-nov-wg-v2"], volledig: false } } });
const deel = OND.kontroleer(werkVandag, blokVandag);
assert(deel.vlak === "groen", `gedeeltelik nagegaan moet groen wees, is ${deel.vlak}`);
assert(/Gedeeltelik/i.test(deel.opsomming), `moet "Gedeeltelik" sê: ${deel.opsomming}`);

/* --- 6. te min tyd --- */
OND._setRag(RAG);
const kort = OND.kontroleer(werkVandag, { ...blokVandag, minutes: 60 });
assert(kort.vlak === "geel", `te min tyd moet geel wees, is ${kort.vlak}`);
assert(/60 min/.test(kort.opsomming), `moet die blok se minute noem: ${kort.opsomming}`);

/* --- 7. formaat: "Pa gee" mag nooit --- */
const paGee = OND.kontroleer(werkVandag, { ...blokVandag, title: "Wisk. Gel. V2: Pa gee die vraestel" });
assert(paGee.vlak === "rooi", `"Pa gee" moet rooi wees, is ${paGee.vlak}`);
assert(/Pa gee/i.test(paGee.opsomming), `moet "Pa gee" noem: ${paGee.opsomming}`);

const sonderVolledig = OND.kontroleer(werkVandag, { ...blokVandag, title: "Wisk. Gel. V2: 5 vrae" });
assert(sonderVolledig.vlak === "geel", `volle vraestel sonder "volledige vraestel" moet geel wees, is ${sonderVolledig.vlak}`);

/* --- 8. onbekende vraestel en 'n skrif-blok sonder werk --- */
const onbekend = OND.kontroleer({ tipe: "vraestel", id: "dbe-1999-nov-wg-v9" }, blokVandag);
assert(onbekend.vlak === "rooi", `onbekende id moet rooi wees, is ${onbekend.vlak}`);
assert(/nie in die DBE-katalogus nie/.test(onbekend.opsomming), `moet die katalogus noem: ${onbekend.opsomming}`);

const geenWerk = OND.kontroleer(null, blokVandag);
assert(geenWerk.vlak === "rooi", `skrif sonder werk moet rooi wees, is ${geenWerk.vlak}`);

const pouse = OND.kontroleer(null, { id: "p1", soort: "pouse", minutes: 20, title: "Pouse" });
assert(pouse.vlak === "groen", `'n pouse moet groen wees (geen werk nodig), is ${pouse.vlak}`);

/* --- 9. merk-blok: geen tydtoets, maar die punte word nog nagegaan --- */
const merk = OND.kontroleer(werkVandag, { ...blokVandag, soort: "merk", minutes: 60 });
assert(merk.vlak === "groen", `merk-blok moet groen wees, is ${merk.vlak} (${merk.opsomming})`);
assert(merk.reëls.find((r) => r.id === "tyd").erns === "ok", "merk-blok moet geen tydwaarskuwing gee nie");

/* --- 10. die kontrole skryf NIKS en is deterministies --- */
assert(skryf.length === 0, `die kontrole het na localStorage geskryf: ${skryf.join(", ")}`);
const a = JSON.stringify(OND.kontroleer(werkVandag, blokVandag));
const b = JSON.stringify(OND.kontroleer(werkVandag, blokVandag));
assert(a === b, "twee lopies met dieselfde insette verskil");

/* --- 11. die RAG-lêer in die repo is bruikbaar en stem ooreen met die katalogus --- */
const ragPad = path.join(root, "data", "rag-dekking.json");
assert(fs.existsSync(ragPad), "data/rag-dekking.json ontbreek");
if (fs.existsSync(ragPad)) {
  const data = JSON.parse(fs.readFileSync(ragPad, "utf8"));
  assert(data.vraestelle && typeof data.vraestelle === "object", "rag-dekking.json het geen vraestelle nie");
  const kat = sandbox.WALLIE.DBE.KATALOGUS;
  const onbekendInRag = Object.keys(data.vraestelle).filter((id) => !kat[id]);
  assert(onbekendInRag.length === 0, `rag-dekking.json het ids wat nie in die katalogus is nie: ${onbekendInRag.join(", ")}`);
  const nieInRag = Object.keys(kat).filter((id) => !data.vraestelle[id]);
  assert(nieInRag.length === 0, `katalogus-vraestelle sonder RAG-inskrywing: ${nieInRag.join(", ")}`);
  const vandag = data.vraestelle["dbe-2025-nov-wg-v2"];
  assert(vandag && JSON.stringify(vandag.vrae) === JSON.stringify(kat["dbe-2025-nov-wg-v2"].vrae),
    "die 24ste se vraestel stem nie tussen rag-dekking.json en die katalogus nie");
  /* Elke vraestel wat die RAG as "volledig" merk, moet presies met die app se eie vrae[] klop. */
  const volle = Object.entries(data.vraestelle).filter(([, v]) => v && v.volledig === true);
  assert(volle.length >= 10, `te min volledig-nagegane vraestelle (${volle.length})`);
  for (const [id, v] of volle) {
    assert(JSON.stringify(v.vrae) === JSON.stringify(kat[id].vrae),
      `${id}: rag-dekking.json se vrae stem nie met die katalogus nie (${JSON.stringify(v.vrae)} vs ${JSON.stringify(kat[id].vrae)})`);
  }
}

/* --- 12. QC W1: 'n merk-blok se titel sê nie "volledige vraestel" nie — die paneel doen dit --- */
OND._setRag(RAG);
const merkTitel = OND.kontroleer(werkVandag, {
  id: "merk-wg-v2-proef-a", soort: "merk", minutes: 60, punte: 150,
  title: "Merk die V2-proefeksamen met die DBE-memo (November 2025 V2)", detail: "Merk streng."
});
assert(merkTitel.vlak === "groen", `merk-blok se titel moet nie vals geel wees nie, is ${merkTitel.vlak} (${merkTitel.opsomming})`);

/* --- 13. QC W2: geen "undefined" in enige opsomming nie --- */
for (const [naam, uitslag] of [["pouse", pouse], ["merk", merkTitel], ["groen", groen], ["geen werk", geenWerk]]) {
  assert(!/undefined/.test(uitslag.opsomming), `${naam}: opsomming het "undefined" in (${uitslag.opsomming})`);
}

/* --- 14. QC W3: 'n oefenvraag is geldige werk, nie 'n onbekende vraestel nie --- */
const oefen = OND.kontroleer({ tipe: "oefenvraag", id: "rtt-v1-S01" },
  { id: "o1", soort: "toets", minutes: 20, title: "Oefenvraag RTT" });
assert(oefen.vlak === "groen", `oefenvraag moet groen wees, is ${oefen.vlak} (${oefen.opsomming})`);
assert(/oefenvraag/i.test(oefen.opsomming), `opsomming moet sê dis 'n oefenvraag: ${oefen.opsomming}`);

/* --- 15. QC W4: 'n RAG met die verkeerde vorm mag nie gooi nie (die paneel mag nie val nie) --- */
OND._setRag({ vraestelle: { "dbe-2025-nov-wg-v2": { vrae: "nie 'n lys nie", gedek: true, volledig: true } } });
let gegooi = false;
try {
  OND.kontroleer(werkVandag, blokVandag);
} catch (e) {
  gegooi = true;
}
assert(!gegooi, "kontroleer het gegooi op 'n RAG met die verkeerde vorm");
OND._setRag(RAG);

/* --- 16. 27 Okt: die hele groep gedoen → die app gee die laaste doelbewus weer; dit is geel, nooit rooi nie --- */
store["wallie911_vraestel_gesien"] = JSON.stringify({ v: 1, gesien: {
  "dbe-2025-nov-wg-v2": true, "dbe-2024-nov-wg-v2": true, "dbe-2025-jun-wg-v2": true } });
const almal = OND.kontroleer({ tipe: "vraestel", id: "dbe-2025-jun-wg-v2" }, blokVandag);
/* groen (die paneel se eie nota sê dit al; geen herhaalde teks nie), maar nooit rooi */
assert(almal.vlak === "groen", `hele groep gedoen moet groen wees (doelbewuste herdoen), is ${almal.vlak} (${almal.opsomming})`);
assert(/doelbewus/.test(almal.reëls.find((r) => r.id === "herhaling").teks), "herhaling-reël moet sê dis doelbewus");
delete store["wallie911_vraestel_gesien"];

/* --- 17. QC 27 Okt 1: 'n blok met net sommige vrae word net op daardie vrae nagegaan --- */
const deelWerk = { tipe: "vrae", id: "dbe-2025-nov-wg-v2", nrs: [1, 2] };
const deelBlok = { ...blokVandag, soort: "skrif", minutes: 75, punte: 62, title: "Wisk. Gel. V2: Vraag 1 en 2 (62 punte)" };
const deelVrae = OND.kontroleer(deelWerk, deelBlok);
const deelStd = deelVrae.reëls.find((r) => r.id === "standaard").teks;
assert(/^2 vrae, 62 punte/.test(deelStd), `moet net Vraag 1 en 2 tel (2 vrae, 62 punte): ${deelStd}`);
/* 'n verskil in 'n vraag wat NIE in die blok is nie, maak die blok nie rooi nie */
OND._setRag({ vraestelle: { "dbe-2025-nov-wg-v2": { ...RAG.vraestelle["dbe-2025-nov-wg-v2"], vrae: [28, 34, 99, 30, 26] } } });
const buite = OND.kontroleer(deelWerk, deelBlok);
assert(buite.vlak === "groen", `verskil buite die blok se vrae moet nie rooi wees nie, is ${buite.vlak} (${buite.opsomming})`);
OND._setRag(RAG);

/* --- 18. QC 27 Okt 4: gedeeltelike dekking wat met die katalogus bots, is onsekerheid: nooit rooi of geel --- */
OND._setRag({ vraestelle: { "dbe-2025-nov-wg-v2": { ...RAG.vraestelle["dbe-2025-nov-wg-v2"], vrae: [null, 34, 99, null, 26], volledig: false } } });
const bots = OND.kontroleer(werkVandag, blokVandag);
assert(bots.vlak === "groen", `gedeeltelike botsing moet groen (onseker) wees, is ${bots.vlak} (${bots.opsomming})`);
assert(/onseker/.test(bots.reëls.find((r) => r.id === "standaard").teks), "gedeeltelike botsing moet 'onseker' sê");
assert(!/\bV\d/.test(bots.reëls.find((r) => r.id === "standaard").teks), "geen 'V3'-styl vraag-etikette (V beteken Vraestel) nie");
OND._setRag(RAG);

/* --- 19. QC 27 Okt 7: laaiRag probeer hoogstens twee keer as die netwerk faal, en skryf niks --- */
let fetchKeer = 0;
const sb2 = { ...sandbox, WALLIE: undefined };
sb2.window = sb2;
sb2.globalThis = sb2;
sb2.fetch = () => {
  fetchKeer += 1;
  return Promise.reject(new Error("vanlyn"));
};
for (const f of ["assets/js/vraebank-rtt-v1.js", "assets/js/dbe-vraestelle.js",
  "assets/js/dbe-vraestelle-oorblywend.js", "assets/js/ondersteuning.js"]) {
  vm.runInNewContext(fs.readFileSync(path.join(root, f), "utf8"), sb2, { filename: f });
}
for (let i = 0; i < 5; i += 1) sb2.WALLIE.ONDERSTEUNING.kontroleer(werkVandag, blokVandag);
assert(fetchKeer === 2, `laaiRag moet hoogstens 2 keer probeer, het ${fetchKeer} keer`);
assert(skryf.length === 0, `die kontrole het ná toets 16-19 na localStorage geskryf: ${skryf.join(", ")}`);

if (fails.length) {
  console.error("ondersteuning: FOUT\n - " + fails.join("\n - "));
  process.exit(1);
}
console.log(`ondersteuning: ok (${passed} kontroles)`);
