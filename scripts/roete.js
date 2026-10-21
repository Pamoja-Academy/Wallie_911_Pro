/* Roete (21 Okt 2026): van Wallie se rekordeksamen-punt (prelim) na sy doelwit, per oorblywende vraestel.
   Lees data/doelwitte.json, voer die rooster (schedule.js) en die DBE-katalogus uit, en bereken vir elke vraestel:
   gaping, vereiste volle-vraestel-ekwivalente (R), beplande getimede DBE-werk, merk-dekking en spasiëring.
   Gebruik: require("./roete").bereken() — deur tests/roete.test.js (hek) en scripts/roete-verslag.js (verslag). */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");

function laaiApp() {
  const ctx = { console };
  ctx.window = ctx;
  const store = {};
  ctx.localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => (store[k] = String(v)), removeItem: (k) => delete store[k] };
  vm.createContext(ctx);
  for (const f of ["assets/js/data.js", "assets/js/pa-konsole/exams.js", "assets/js/schedule.js", "assets/js/dbe-vraestelle.js", "assets/js/dbe-vraestelle-oorblywend.js"]) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), ctx, { filename: f });
  }
  return ctx;
}

const dagSleutel = (d) => d.toISOString().slice(0, 10);
const hm = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

function Rvir(gaping, tabel) {
  return tabel.find((r) => gaping <= r.gaping_tot_en_met).R;
}

function bereken() {
  const doel = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "doelwitte.json"), "utf8"));
  const ctx = laaiApp();
  const W = ctx.WALLIE;
  const D = W.DBE;
  const vanaf = new Date(doel.reel.vanaf);
  const uit = [];
  for (const v of doel.vraestelle) {
    const eks = ctx.PK.EXAMS.find((x) => x.n === v.eksamen);
    const vak = doel.vakke[v.vak];
    const gaping = vak.teiken - vak.prelim;
    const R = Rvir(gaping, doel.reel.R);
    const begin = new Date(eks.at);
    const werk = [];
    const merke = [];
    for (let d = new Date(dagSleutel(vanaf)); d <= begin; d.setUTCDate(d.getUTCDate() + 1)) {
      const dag = dagSleutel(d);
      for (const b of W.buildDayPlan(dag).blocks) {
        if (!b.werk || !b.start) continue;
        const bBegin = new Date(`${dag}T${b.start}:00+02:00`);
        const bEinde = new Date(`${dag}T${b.end}:00+02:00`);
        if (bBegin < vanaf || bEinde > begin) continue;
        const w = W.werkVirBlok(b, {});
        if (!w || !w.id.endsWith(`-${v.katalogus}`)) continue;
        const rec = { dag, id: b.id, soort: b.soort, minute: hm(b.end) - hm(b.start), werk: w.id, nrs: D.vraagNommers(w).join(",") };
        if (b.soort === "skrif" || b.soort === "toets") werk.push(rec);
        else if (b.soort === "merk") merke.push(rec);
      }
    }
    const minute = werk.reduce((s, r) => s + r.minute, 0);
    const ekwivalente = minute / v.duur_min;
    /* Terugvoer: 'n merk-blok met dieselfde vraestel en vrae op dieselfde dag, of die volgende dag (bv. 'n 3-uur-proef wat 17:00 eindig) */
    const volgende = (d) => dagSleutel(new Date(new Date(d).getTime() + 86400000));
    const sonderMerk = werk.filter((r) => !merke.some((m) => (m.dag === r.dag || m.dag === volgende(r.dag)) && m.werk === r.werk && m.nrs === r.nrs));
    const dae = new Set(werk.map((r) => r.dag)).size;
    const genoeg = ekwivalente >= R - 1e-9;
    const spasieer = R < 2 || dae >= 2;
    uit.push({
      eksamen: v.eksamen, vak: v.vak, datum: eks.at, prelim: vak.prelim, teiken: vak.teiken, gaping,
      gaping_punte: Math.max(0, Math.round((gaping / 100) * v.punte)), R, minute, vereis_min: R * v.duur_min,
      ekwivalente: Math.round(ekwivalente * 100) / 100, dae, blokke: werk, sonderMerk, genoeg, spasieer, aanvaar: v.aanvaar || null
    });
  }
  return { doel, ctx, roete: uit };
}

module.exports = { bereken, laaiApp };
