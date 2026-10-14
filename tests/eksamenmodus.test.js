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

/* hek: skryf, op papier geskryf (F2): bevestiging + minstens 60% van die tyd vervang die woordtelling */
ok(!E.memoOntsluit(sk({ bevestig: true, klaar: true, verlopeSek: 1439 })), "skryf: papier bevestig + klaar maar < 60% → toe");
ok(E.memoOntsluit(sk({ bevestig: true, klaar: true, verlopeSek: 1440 })), "skryf: papier bevestig + klaar + 60% → oop (0 woorde)");
ok(!E.memoOntsluit(sk({ bevestig: true, verlopeSek: 2000 })), "skryf: papier bevestig maar nie klaar gedruk nie → toe");
ok(!E.memoOntsluit(sk({ klaar: true, verlopeSek: 2000 })), "skryf: 60% verby maar nie bevestig en geen woorde nie → toe");
ok(E.minWerkGedoen(sk({ woorde: 120 })), "skryf: genoeg woorde is werk gedoen (sonder bevestiging)");
ok(!E.minWerkGedoen(sk({ minWoorde: 0, woorde: 0 })), "skryf: 0 woorde is nooit werk nie (ook sonder minimum)");
ok(!E.minWerkGedoen(sk({ bevestig: true, verlopeSek: 100 })), "skryf: bevestig te vroeg is nog nie werk nie");
ok(E.memoRede(sk({ bevestig: true, verlopeSek: 600 })).includes("Nog ±14 min"), "rede (papier): noem die minute tot 60%");
ok(E.memoRede(sk({ woorde: 100 })).includes("op papier"), "rede: wys die papier-opsie");
ok(E.memoRede(sk({ bevestig: true, klaar: false, verlopeSek: 1440 })).includes("Ek is klaar"), "rede (papier): 60% bereik → druk Ek is klaar");

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

/* sessie-gekoppelde klok (F3): vroegsteBegin(itemId, state, vandag[, eie, sedert]) */
const T = (h, m) => new Date(2026, 9, 16, h, m).getTime(); /* plaaslike 16 Okt */
const VANDAG = "2026-10-16";
const toestand = (o) =>
  Object.assign(
    {
      blocks: [
        { id: "2026-10-16-afr-a1", item: "afr-v3-A1" },
        { id: "2026-10-16-afr-b3", item: "afr-v3-B3" },
        { id: "2026-10-16-pouse1" }
      ],
      sessions: [],
      live: { status: "off", subject: null, warnings: 0, startedAt: null }
    },
    o
  );
eq(E.vroegsteBegin("afr-v3-A1", null, VANDAG, null), null, "geen toestand, geen eie begin → null");
eq(E.vroegsteBegin("afr-v3-A1", null, VANDAG, T(9, 0)), T(9, 0), "geen toestand → net die eie begin");
eq(E.vroegsteBegin("afr-v3-A1", toestand(), VANDAG, null), null, "geen sessies → null");
eq(
  E.vroegsteBegin("afr-v3-A1", toestand({ sessions: [{ date: VANDAG, block: { id: "2026-10-16-afr-a1" }, startedAt: T(8, 2) }] }), VANDAG, T(8, 40)),
  T(8, 2),
  "sessie vroeër as eie begin → sessie wen"
);
eq(
  E.vroegsteBegin("afr-v3-A1", toestand({ sessions: [{ date: VANDAG, block: { id: "2026-10-16-afr-a1" }, startedAt: T(8, 50) }] }), VANDAG, T(8, 40)),
  T(8, 40),
  "eie begin vroeër as sessie → eie begin bly"
);
eq(
  E.vroegsteBegin(
    "afr-v3-A1",
    toestand({
      sessions: [
        { date: VANDAG, block: { id: "2026-10-16-afr-a1" }, startedAt: T(9, 0) },
        { date: VANDAG, block: { id: "2026-10-16-afr-a1" }, startedAt: T(8, 5) },
        { date: VANDAG, block: { id: "2026-10-16-afr-b3" }, startedAt: T(7, 0) }
      ]
    }),
    VANDAG,
    null
  ),
  T(8, 5),
  "vroegste van meer sessies; sessie van 'n ander item se blok tel nie"
);
eq(
  E.vroegsteBegin("afr-v3-A1", toestand({ sessions: [{ date: "2026-10-15", block: { id: "2026-10-16-afr-a1" }, startedAt: T(1, 0) }] }), VANDAG, null),
  null,
  "sessie van 'n ander dag tel nie"
);
eq(
  E.vroegsteBegin("afr-v3-A1", toestand({ sessions: [{ date: VANDAG, block: null, startedAt: T(1, 0) }, { date: VANDAG, startedAt: T(1, 0) }] }), VANDAG, null),
  null,
  "sessie sonder blok tel nie"
);
eq(
  E.vroegsteBegin("afr-v3-A1", toestand({ live: { status: "active", block: { id: "2026-10-16-afr-a1" }, startedAt: T(8, 10) } }), VANDAG, T(8, 40)),
  T(8, 10),
  "aktiewe sessie tel"
);
eq(
  E.vroegsteBegin("afr-v3-A1", toestand({ live: { status: "locked", block: { id: "2026-10-16-afr-a1" }, startedAt: T(8, 10) } }), VANDAG, null),
  T(8, 10),
  "gesluite (locked) sessie is ook aktief"
);
eq(
  E.vroegsteBegin("afr-v3-A1", toestand({ live: { status: "off", block: { id: "2026-10-16-afr-a1" }, startedAt: T(8, 10) } }), VANDAG, null),
  null,
  "live met status off tel nie"
);
eq(
  E.vroegsteBegin("afr-v3-A1", toestand({ live: { status: "active", block: { id: "2026-10-16-afr-b3" }, startedAt: T(8, 10) } }), VANDAG, null),
  null,
  "aktiewe sessie op 'n ander item se blok tel nie"
);
eq(
  E.vroegsteBegin("afr-v3-A1", toestand({ sessions: [{ date: VANDAG, block: { id: "2026-10-16-afr-a1" }, startedAt: T(8, 5) }] }), VANDAG, null, 0),
  T(8, 5),
  "sedert wat nie gestel is nie, filter niks"
);
eq(
  E.vroegsteBegin("afr-v3-A1", toestand({ sessions: [{ date: VANDAG, block: { id: "2026-10-16-afr-a1" }, startedAt: T(8, 5) }] }), VANDAG, null, T(8, 30)),
  null,
  "sessie voor 'sedert' (nuwe poging) tel nie"
);
eq(
  E.vroegsteBegin("afr-v3-A1", toestand({ blocks: undefined, sessions: [{ date: VANDAG, block: { id: "x" }, startedAt: T(8, 5) }] }), VANDAG, T(9, 0)),
  T(9, 0),
  "geen blokke in die toestand → net eie begin (geen fout nie)"
);
eq(E.dagSleutel(T(23, 59)), VANDAG, "dagSleutel: plaaslike dag");
eq(E.hhmm(T(8, 5)), "08:05", "hhmm: voorloopnulle");

/* nuwe poging (F4): argiveer in `vorige` (nuutste laaste) en stel terug; suiwer */
const ou = { begin: T(8, 0), konsep: "my antwoord", bevestig: true, lêer: "foto.jpg", klaarMin: 71.5 };
const n1 = E.nuwePoging(ou, 111);
eq({ begin: n1.begin, konsep: n1.konsep, bevestig: n1.bevestig, lêer: n1.lêer, klaarMin: n1.klaarMin }, { begin: null, konsep: "", bevestig: false, lêer: "", klaarMin: null }, "nuwePoging: vyf velde teruggestel");
eq(n1.vorige, [{ begin: T(8, 0), konsep: "my antwoord", bevestig: true, lêer: "foto.jpg", klaarMin: 71.5, geargiveerOp: 111 }], "nuwePoging: huidige waardes geargiveer");
eq(ou.konsep, "my antwoord", "nuwePoging verander die ingevoer-rekord nie");
const n2 = E.nuwePoging(Object.assign({}, n1, { begin: T(9, 0), konsep: "tweede" }), 222);
eq(n2.vorige.map((v) => v.konsep), ["my antwoord", "tweede"], "nuutste laaste, niks weggegooi");
eq(n2.vorige.length, 2, "twee pogings geargiveer");
eq(E.nuwePoging(n1, 333).vorige.length, 1, "leë poging word nie geargiveer nie");
eq(E.nuwePoging(null, 1).vorige, [], "geen rekord → leë argief, geen fout");
eq(E.nuwePoging({ begin: T(8, 0), sedert: 5 }, 1).sedert, 5, "ander velde (sedert) bly");
ok(E.nuwePoging({ konsep: "x" }, 1).vorige[0].begin === null, "konsep sonder begin word ook bewaar");
ok(E.moetNuwePoging({ begin: new Date(2026, 9, 15, 23, 59).getTime() }, T(0, 1)), "vroeër dag (gister 23:59) → nuwe poging");
ok(!E.moetNuwePoging({ begin: T(0, 0) }, T(23, 59)), "dieselfde dag → nie");
ok(!E.moetNuwePoging({ begin: null }, T(8, 0)), "geen begin → nie");
ok(!E.moetNuwePoging(null, T(8, 0)), "geen rekord → nie");
ok(!E.moetNuwePoging({ begin: new Date(2026, 9, 17, 8, 0).getTime() }, T(8, 0)), "begin in die toekoms → nie");

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
