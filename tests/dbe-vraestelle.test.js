/* DBE-vraestelkatalogus: elke skakel is ’n geldige amptelike https-URL, en GEEN DBE-lêer is in die repo.
   `node tests/dbe-vraestelle.test.js` */
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

/* Net die amptelike bronne mag voorkom (geen spieëls, geen afleilêers van derdepartye). */
const TOEGELATE = ["www.education.gov.za", "education.gov.za", "wcedeportal.westerncape.gov.za"];
const NOTA = "Wagwoordbeskermde .exe, werk net op Windows; wagwoord staan in die vraestel se instruksies.";

/* Laai die lêer soos die blaaier dit laai (geen DOM nodig). */
const store = {};
const sandbox = {
  console,
  JSON,
  Math,
  Date,
  URL,
  localStorage: {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => {
      store[k] = String(v);
    },
    removeItem: (k) => delete store[k]
  },
  document: { getElementById: () => null, querySelector: () => null, addEventListener: () => {} }
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.runInNewContext(fs.readFileSync(path.join(root, "assets/js/vraebank-rtt-v1.js"), "utf8"), sandbox, {
  filename: "assets/js/vraebank-rtt-v1.js"
});
vm.runInNewContext(fs.readFileSync(path.join(root, "assets/js/dbe-vraestelle.js"), "utf8"), sandbox, {
  filename: "assets/js/dbe-vraestelle.js"
});

const DBE = sandbox.WALLIE && sandbox.WALLIE.DBE;
assert(DBE && DBE.KATALOGUS, "WALLIE.DBE gelaai");

if (DBE) {
  const alleIds = Object.keys(DBE.KATALOGUS);
  /* RTT (met datalêers) en Wisk. Gel. (met 'n antwoordeboek, 21 Okt) */
  const ids = alleIds.filter((id) => !DBE.KATALOGUS[id].vak);
  const wgIds = alleIds.filter((id) => DBE.KATALOGUS[id].vak === "wiskgelett");
  assert(ids.length === 4, `4 RTT-vraestelle in die katalogus (gekry: ${ids.length})`);
  assert(wgIds.length === 4, `4 Wisk. Gel.-vraestelle in die katalogus (gekry: ${wgIds.length})`);
  assert(ids.length + wgIds.length === alleIds.length, "elke vraestel is RTT of Wisk. Gel.");
  assert(
    JSON.stringify(DBE.ORDE.slice().sort()) === JSON.stringify(ids.slice().sort()),
    "ORDE dek presies die RTT-vraestelle (Wisk. Gel. roteer nie)"
  );
  assert(DBE.DATA_NOTA === NOTA, "die .exe-nota staan woordeliks in die katalogus");

  for (const id of wgIds) {
    const p = DBE.KATALOGUS[id];
    assert(p.id === id, `${id}: id stem met die sleutel ooreen`);
    assert(/Wisk\. Gel\. V[12] \(Afr\)$/.test(p.titel), `${id}: titel noem Wisk. Gel. V1/V2 (Afr)`);
    assert(!p.data && !p.datatipe, `${id}: geen datalêers nie`);
    assert(Array.isArray(p.vrae) && p.vrae.length === 5, `${id}: punte vir V1–V5`);
    const tot = (p.vrae || []).reduce((s, n) => s + n, 0);
    assert(tot === 150, `${id}: die vrae tel op na 150 punte (gekry: ${tot})`);
    for (const soort of ["vraestel", "antwoordeboek", "memo"]) {
      let u = null;
      try {
        u = new URL(p[soort]);
      } catch {
        u = null;
      }
      assert(!!u && u.protocol === "https:" && TOEGELATE.includes(u.hostname), `${id}/${soort}: amptelike https-skakel`);
    }
    assert(new Set([p.vraestel, p.antwoordeboek, p.memo]).size === 3, `${id}: vraestel, antwoordeboek en memo verskil`);
    const sk = DBE.skakels({ tipe: "vraestel", id });
    assert(sk.antwoordeboek === p.antwoordeboek && sk.data === null, `${id}: skakels() gee die antwoordeboek en geen data nie`);
  }
  const wgAlle = wgIds.flatMap((id) => ["vraestel", "antwoordeboek", "memo"].map((k) => DBE.KATALOGUS[id][k]));
  assert(new Set(wgAlle).size === wgAlle.length, "al 12 Wisk. Gel.-skakels is uniek");
  assert(DBE.punte({ tipe: "vrae", id: "dbe-2025-nov-wg-v1", nrs: [1, 2] }) === 62, "Nov 2025 Wisk. Gel. V1 Vraag 1+2 is 62 punte");
  assert(DBE.punte({ tipe: "vrae", id: "dbe-2025-nov-wg-v2", nrs: [5] }) === 26, "Nov 2025 Wisk. Gel. V2 Vraag 5 is 26 punte");
  assert(
    DBE.vraagLabels({ tipe: "vrae", id: "dbe-2025-nov-wg-v1", nrs: [1, 2] }).join(",") === "Vraag 1,Vraag 2",
    "Wisk. Gel.: vrae voluit ('V1' sou Vraestel 1 beteken)"
  );

  for (const id of ids) {
    const p = DBE.KATALOGUS[id];
    assert(p.id === id, `${id}: id stem met die sleutel ooreen`);
    assert(typeof p.titel === "string" && p.titel.length > 5, `${id}: titel`);
    assert(typeof p.datatipe === "string" && p.datatipe.length > 3, `${id}: datatipe beskryf die lêer`);
    assert(Array.isArray(p.vrae) && p.vrae.length === 7, `${id}: punte vir V1–V7`);
    const tot = (p.vrae || []).reduce((s, n) => s + n, 0);
    assert(tot === 150, `${id}: die vrae tel op na 150 punte (gekry: ${tot})`);

    for (const soort of ["vraestel", "data", "memo"]) {
      const raw = p[soort];
      assert(typeof raw === "string" && raw.length > 10, `${id}/${soort}: skakel bestaan`);
      let u = null;
      try {
        u = new URL(raw);
      } catch {
        u = null;
      }
      assert(!!u, `${id}/${soort}: geldige URL`);
      if (u) {
        assert(u.protocol === "https:", `${id}/${soort}: https (gekry: ${u.protocol})`);
        assert(TOEGELATE.includes(u.hostname), `${id}/${soort}: amptelike gasheer (gekry: ${u.hostname})`);
      }
    }

    /* Die drie skakels van een vraestel moet van mekaar verskil (nie dieselfde lêer 3× nie). */
    assert(new Set([p.vraestel, p.data, p.memo]).size === 3, `${id}: vraestel, data en memo is drie verskillende skakels`);
  }

  /* Elke skakel is uniek oor die hele katalogus (geen kopie-en-plak-fout tussen jare nie). */
  const alle = ids.flatMap((id) => ["vraestel", "data", "memo"].map((k) => DBE.KATALOGUS[id][k]));
  assert(new Set(alle).size === alle.length, "al 12 skakels is uniek");

  /* Hulpfunksies: wat die sessieskerm wys. */
  const w5 = { tipe: "vrae", id: "dbe-2026-jun-v1", nrs: [5] };
  assert(DBE.punte(w5) === 35, "Jun 2026 V5 is 35 punte");
  assert(DBE.werkId(w5) === "dbe-2026-jun-v1 V5", "werkId noem die vraestel en die vraag");
  assert(/DBE Mei\/Junie 2026 V1/.test(DBE.werkLabel(w5)), "werkLabel noem die vraestel se naam");
  assert(DBE.vraagLabels(w5).join(",") === "V5", "vraagLabels: hele vraag");
  assert(
    DBE.vraagLabels({ tipe: "vrae", id: "dbe-2025-jun-v1", nrs: ["6.1", "5.1"] }).join(",") === "V6.1,V5.1",
    "vraagLabels: subvrae"
  );
  const vol = { tipe: "vraestel", id: "dbe-2024-nov-v1" };
  assert(DBE.punte(vol) === 150, "volledige Nov 2024-vraestel is 150 punte");
  assert(DBE.vraagLabels(vol).join(",") === "V1,V2,V3,V4,V5,V6,V7", "volledige vraestel = V1–V7");
  assert(DBE.punte({ tipe: "vrae", id: "dbe-2025-jun-v1", nrs: ["6.1"] }) === null, "subvrae gee geen punte uit vrae[] nie");
  assert(DBE.skakels({ tipe: "oefenvraag", id: "rtt-v1-S01" }) === null, "’n oefenvraag het geen DBE-skakels nie");
  assert(/rtt-v1-S01/.test(DBE.werkLabel({ tipe: "oefenvraag", id: "rtt-v1-S01" })), "oefenvraag se label noem die item");

  /* Rotasie: eers die 4 vraestelle, dan die 30 oefenvrae. */
  const poel = DBE.poel();
  assert(poel.length === 34, `rotasie-poel = 4 vraestelle + 30 oefenvrae (gekry: ${poel.length})`);
  assert(poel.slice(0, 4).every((w) => w.tipe === "vraestel"), "die vraestelle kom eerste in die poel");
}

/* Kopiereg: geen DBE-vraestel, memo of datalêer word in die repo gestoor nie. */
const VERBODE = /\.(pdf|exe|zip|accdb|docx|xlsx|rtf)$/i;
function loop(dir, uit) {
  for (const naam of fs.readdirSync(dir)) {
    if (naam === ".git" || naam === "node_modules" || naam === "test-artifacts") continue;
    const vol = path.join(dir, naam);
    const st = fs.statSync(vol);
    if (st.isDirectory()) loop(vol, uit);
    else if (VERBODE.test(naam)) uit.push(path.relative(root, vol));
  }
  return uit;
}
const lekkasie = loop(root, []);
assert(lekkasie.length === 0, `geen vraestel/memo/datalêer in die repo (gekry: ${lekkasie.join(", ")})`);

console.log(`dbe-vraestelle: ${passed} geslaag, ${fails.length} faal`);
if (fails.length) {
  fails.forEach((f) => console.log(" - " + f));
  process.exit(1);
}
