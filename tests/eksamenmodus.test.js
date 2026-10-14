/* Eksamenmodus: suiwer logika (tyd, hek, punte, event-data). `node tests/eksamenmodus.test.js` */
const path = require("path");
const fs = require("fs");
const E = require(path.join(__dirname, "..", "assets", "js", "eksamenmodus.js"));

const fails = [];
let passed = 0;
const ok = (c, m) => (c ? passed++ : fails.push(m));
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}: ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`);

const V3 = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "vraebank-v3.json"), "utf8"));
const RTT = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "vraebank-rtt-v1.json"), "utf8"));

/* tyd: eie tyd_min wen; anders punte × (vraestel-minute / vraestel-punte) */
eq(E.tydMin({ vak: "engels", punte: 50, tyd_min: 80 }), 80, "tyd_min wen");
eq(E.tydMin({ vak: "engels", punte: 50 }), 75, "engels 50 punte = 75 min (150/100)");
eq(E.tydMin({ vak: "rtt", punte: 5 }, "rtt"), 6, "rtt 5 punte = 6 min (180/150)");
eq(E.tydMin({ vak: "gasvryheid", punte: 20 }), 18, "gasvryheid 20 punte = 18 min (180/200)");
eq(E.tydMin({ vak: "rtt", punte: 1 }), 1, "minstens 1 min");
eq(E.tydMin({ vak: "onbekend", punte: 5 }), null, "onbekende vak, geen tyd");
V3.forEach((i) => ok(E.tydMin(i) === i.tyd_min, `${i.id} gebruik eie tyd_min`));
RTT.forEach((i) => ok(E.tydMin(i, "rtt") >= 1, `${i.id} kry 'n tyd`));

/* woorde */
eq(E.tel("  een twee\n drie  "), 3, "woordtelling");
eq(E.tel(""), 0, "leeg = 0");

/* hek: skryf */
const sk = (o) => Object.assign({ tipe: "skryf", woorde: 0, minWoorde: 120, verlopeSek: 0, tydSek: 2400, klaar: false, begin: true }, o);
ok(!E.memoOntsluit(sk({})), "skryf: toe aan die begin");
ok(!E.memoOntsluit(sk({ woorde: 130 })), "skryf: genoeg woorde maar nie klaar nie → toe");
ok(!E.memoOntsluit(sk({ woorde: 50, klaar: true })), "skryf: klaar maar te min woorde → toe");
ok(E.memoOntsluit(sk({ woorde: 120, klaar: true })), "skryf: min woorde + klaar → oop");
ok(E.memoOntsluit(sk({ verlopeSek: 2400 })), "skryf: tyd verby → oop (ook sonder werk)");
ok(!E.memoOntsluit(sk({ verlopeSek: 2399 })), "skryf: 1 sek voor die tyd → toe");

/* hek: praktiese */
const pr = (o) => Object.assign({ tipe: "praktiese", bevestig: false, verlopeSek: 0, tydSek: 600, klaar: false, begin: true }, o);
ok(!E.memoOntsluit(pr({ klaar: true })), "prakties: klaar sonder bevestiging → toe");
ok(!E.memoOntsluit(pr({ bevestig: true, klaar: true, verlopeSek: 359 })), "prakties: bevestig + klaar maar < 60% → toe");
ok(E.memoOntsluit(pr({ bevestig: true, klaar: true, verlopeSek: 360 })), "prakties: bevestig + klaar + 60% → oop");
ok(!E.memoOntsluit(pr({ bevestig: true, verlopeSek: 600 - 1 })), "prakties: nie klaar gedruk nie → toe");
ok(E.memoOntsluit(pr({ verlopeSek: 600 })), "prakties: tyd verby → oop");
ok(E.memoRede(sk({ begin: false })).includes("Begin"), "rede: eers Begin");
ok(E.memoRede(sk({ woorde: 100 })).includes("20"), "rede: noem die ontbrekende woorde");

/* punte */
const A1 = V3.find((i) => i.id === "eng-v3-A1");
eq(E.riglyn(A1).map((r) => r.punte), [30, 15, 5], "Engels A rubriek 30/15/5");
eq(E.totaal(A1, [25, 10, 5]), { behaal: 40, totaal: 50, riglynTotaal: 50 }, "totaal 40/50");
eq(E.totaal(A1, [99, -3, "x"]).behaal, 30, "waardes word geknip tot 0..maks (30 + 0 + 0)");
V3.concat(RTT).forEach((i) => {
  const t = E.totaal(i, []);
  ok(t.riglynTotaal === i.punte, `${i.id}: riglyn som (${t.riglynTotaal}) = punte (${i.punte})`);
});
eq(E.uitslagVan(35, 50), "reg", "70% = reg");
eq(E.uitslagVan(20, 50), "gedeeltelik", "40% = gedeeltelik");
eq(E.uitslagVan(19, 50), "fout", "< 40% = fout");
eq(E.minuteGebruik(0, 5), 0, "geen begin = 0 min");
eq(E.minuteGebruik(1000, 1000 + 90000), 1.5, "90 sek = 1.5 min");

/* event-data: presies die gevraagde velde */
eq(
  Object.keys(E.eventData(A1, "engels", { behaal: 40, totaal: 50, woorde: 270, minuteGebruik: 71, tydMin: 80, memoNaMin: 79 })).sort(),
  ["item_id", "memo_oopgemaak_na_min", "minute_gebruik", "punte_behaal", "punte_totaal", "tyd_min", "vak", "woorde"],
  "event-velde"
);
ok(E.EVENT.kind === null, "event staan AF totdat die bediener die soort aanvaar");

if (fails.length) {
  console.error("eksamenmodus: FOUT\n - " + fails.join("\n - "));
  process.exit(1);
}
console.log(`eksamenmodus: ${passed} kontroles ok`);
