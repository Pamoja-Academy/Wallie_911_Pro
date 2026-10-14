/* Eksamenvlak-hek: eenheidstoetse. `node tests/eksamenvlak-hek.test.js` */
const fs = require("fs");
const path = require("path");
const H = require("../scripts/eksamenvlak-hek.js");

const fails = [];
let n = 0;
const ok = (c, m) => (c ? n++ : fails.push(m));
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}: ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`);

const spec = {
  vak: "engels",
  geverifieer: true,
  hoofwerk_bank: "x",
  afdelings: {
    A: { punte: 50, subvrae: 1, tyd_min: 80, woorde: { min: 250, max: 300 }, kriteria: [30, 15, 5] },
    B: { punte: 30, subvrae: 2, tyd_min: 40, woorde: { min: 120, max: 150 } }
  }
};
const goed = {
  id: "t-A1", vak: "engels", afdeling: "A", punte: 50, tyd_min: 80, woorde: { min: 250, max: 300 },
  bron: { verwysing: "DBE Nov 2024 EAT V3 V1.4", bladsy: 3 },
  nasienriglyn: [{ punte: 30 }, { punte: 15 }, { punte: 5 }]
};
const met = (o) => Object.assign({}, goed, o);

eq(H.kontroleerItem(goed, spec), [], "goeie item voldoen");
ok(H.kontroleerItem(met({ punte: 40 }), spec).some((r) => r.includes("punte 40 < DBE-vraag 50")), "punte onder DBE");
ok(H.kontroleerItem(met({ tyd_min: undefined }), spec).some((r) => r.includes("tyd_min ontbreek")), "tyd_min ontbreek");
ok(H.kontroleerItem(met({ tyd_min: null }), spec).some((r) => r.includes("tyd_min ontbreek")), "tyd_min null");
ok(H.kontroleerItem(met({ tyd_min: 30 }), spec).some((r) => r.includes("te kort")), "tyd_min te kort");
ok(H.kontroleerItem(met({ woorde: { min: 100, max: 300 } }), spec).some((r) => r.includes("woorde.min")), "woorde.min onder DBE");
ok(H.kontroleerItem(met({ woorde: { min: 250, max: 200 } }), spec).some((r) => r.includes("woorde.max")), "woorde.max onder DBE");
ok(H.kontroleerItem(met({ woorde: undefined }), spec).length >= 2, "geen woordgrense");
ok(H.kontroleerItem(met({ bron: {} }), spec).some((r) => r.includes("geen bron")), "geen bron");
ok(H.kontroleerItem(met({ bron: { verwysing: "DBE" } }), spec).some((r) => r.includes("geen bron")), "bron sonder bladsy");
ok(H.kontroleerItem(met({ bron: undefined }), spec).some((r) => r.includes("geen bron")), "bron ontbreek heeltemal");
ok(H.kontroleerItem(met({ nasienriglyn: [{ punte: 20 }, { punte: 20 }, { punte: 10 }] }), spec).some((r) => r.includes("rubriekpunte")), "rubriekpunte verskil");
ok(H.kontroleerItem(met({ afdeling: "B", punte: 30, woorde: { min: 120, max: 150 }, tyd_min: 40 }), spec).some((r) => r.includes("subvrae 1 < DBE 2")), "subvraag-telling laer");
ok(H.kontroleerItem(met({ afdeling: "B", subvrae: 2, punte: 30, woorde: { min: 120, max: 150 }, tyd_min: 40 }), spec).length === 0, "subvrae gelyk = ok");
ok(H.kontroleerItem(met({ afdeling: "Z" }), spec)[0].includes("nie in die engels-spesifikasie"), "onbekende afdeling");

/* geverifieer: fout + agtergrond; ONGEVERIFIEER: net waarskuwing */
const items = [goed, met({ id: "t-A2", punte: 20 })];
const r = H.kontroleer(spec, items);
eq(r.fout.map((f) => f.id), ["t-A2"], "geverifieerd: fout");
eq(r.agtergrond, ["t-A2"], "geverifieerd: agtergrond");
const r2 = H.kontroleer(Object.assign({}, spec, { geverifieer: false }), items);
eq(r2.fout, [], "ongeverifieerd: geen fout");
eq(r2.agtergrond, [], "ongeverifieerd: niks gedemoveer");
ok(r2.waarskuwing.some((w) => w.id === "t-A2") && r2.waarskuwing.some((w) => w.redes[0].includes("ONGEVERIFIEER")), "ongeverifieerd: waarskuwings");
/* items van 'n ander vak word nie gekontroleer nie */
eq(H.kontroleer(spec, [met({ id: "a", vak: "afrikaans", punte: 1 })]).fout, [], "ander vak ignoreer");
/* bank-lose spesifikasie (bv. RTT) */
eq(H.kontroleer({ vak: "rtt", geverifieer: true, hoofwerk_bank: null, oefenbank_items: 30 }, []).fout, [], "geen hoofwerk-bank");

/* lys-uitset is deterministies en gesorteer */
ok(H.bouLys(["b", "a"]).includes('["a","b"]'), "bouLys sorteer");

/* Werklike spesifikasies */
const spesse = H.laaiSpesifikasies();
eq(spesse.map((s) => s.vak), ["afrikaans", "engels", "gasvryheid", "rtt", "toerisme", "wiskgelett"], "ses vakke");
const eng = spesse.find((s) => s.vak === "engels");
ok(eng.geverifieer === true && eng.punte === 100 && eng.tyd_min === 150, "Engels 100 punte / 150 min");
eq([eng.afdelings.A.punte, eng.afdelings.B.punte, eng.afdelings.C.punte], [50, 30, 20], "Engels A/B/C punte");
eq([eng.afdelings.A.woorde.min, eng.afdelings.A.woorde.max], [250, 300], "Engels A woorde");
eq([eng.afdelings.B.woorde.min, eng.afdelings.B.woorde.max, eng.afdelings.C.woorde.min, eng.afdelings.C.woorde.max], [120, 150, 80, 100], "Engels B/C woorde");
spesse.filter((s) => !s.geverifieer).forEach((s) => ok(/ONGEVERIFIEER — Hanno moet bevestig/.test(s.ONGEVERIFIEER || ""), `${s.vak}: ONGEVERIFIEER-merk`));
/* Die Engels-spesifikasie moet met die RTT-katalogus ooreenstem: elke afdeling-som = vraestel */
eq(Object.values(eng.afdelings).reduce((s, a) => s + a.punte, 0), eng.punte, "Engels afdelings tel op tot 100");
/* Die huidige data voldoen, en die gegenereerde lys is op datum */
const items2 = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "vraebank-v3.json"), "utf8"));
eq(H.kontroleer(eng, items2).fout, [], "huidige Engels-items voldoen aan DBE");
eq(H.voerUit([]), 0, "voerUit (CI-modus) slaag op die huidige data");

if (fails.length) {
  console.error("eksamenvlak-hek: FOUT\n - " + fails.join("\n - "));
  process.exit(1);
}
console.log(`eksamenvlak-hek.test: ${n} kontroles ok`);
