/* PR 3: vroeg-klaar-kontrole (Wallie) + Pa-konsole-vlag. `node tests/vroeg-klaar.test.js` */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const VK = require("../assets/js/vroeg-klaar.js");

const fails = [];
let n = 0;
const ok = (c, m) => (c ? n++ : fails.push(m));
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}: ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`);

const blok = { id: "d-b1", kind: "geel", minutes: 40 };
const sess = (id, min) => ({ block: { id }, actualMin: min });
const NOU = 1_800_000_000_000;

eq(VK.kontroleer(blok, [], null, NOU).kode, "GEEN POGING", "geen sessie = GEEN POGING");
eq(VK.kontroleer(blok, [sess("ander", 60)], null, NOU).soort, "geen_sessie", "sessie van 'n ander blok tel nie");
eq(VK.kontroleer(blok, [sess("d-b1", 23)], null, NOU).kode, "VROEG KLAAR", "23/40 min (57%) = VROEG KLAAR");
eq(VK.kontroleer(blok, [sess("d-b1", 24)], null, NOU), null, "24/40 min (60%) = ok");
eq(VK.kontroleer(blok, [sess("d-b1", 10), sess("d-b1", 15)], null, NOU), null, "twee sessies tel saam (25 ≥ 24)");
eq(VK.kontroleer(blok, [], { blockId: "d-b1", startedAt: NOU - 30 * 60000 }, NOU), null, "sessie wat nou loop tel (30 min)");
eq(VK.kontroleer(blok, [], { blockId: "d-b1", startedAt: NOU - 5 * 60000 }, NOU).kode, "VROEG KLAAR", "sessie wat nou loop, net 5 min");
eq(VK.kontroleer({ id: "p", kind: "break", minutes: 15 }, [], null, NOU), null, "pouse word nooit gevlag nie");
eq(VK.kontroleer({ id: "x", kind: "geel", minutes: 0 }, [], null, NOU), null, "blok sonder minute");
eq(VK.kontroleer(null, [], null, NOU), null, "geen blok");
ok(VK.teks({ soort: "vroeg", gedoen: 10, plan: 40 }).includes("Seker? Dit is eksamenwerk"), "waarskuwingsteks");
ok(VK.teks({ soort: "geen_sessie" }).includes("Seker? Dit is eksamenwerk"), "waarskuwingsteks (geen sessie)");

/* Pa-konsole: PK.blockFlag uit die bestaande oorsig-velde */
const ctx = { console, setTimeout, clearTimeout, setInterval, clearInterval, Date };
ctx.window = ctx;
ctx.location = { search: "" };
ctx.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "assets", "js", "pa-konsole", "data.js"), "utf8"), ctx);
const F = ctx.PK.blockFlag;
eq(F({ manual: true, status: "done", minutes: 40, doneMin: 0 }), "GEEN POGING", "Pa: klaar gemerk, 0 min");
eq(F({ manual: true, status: "done", minutes: 40, doneMin: 20 }), "VROEG KLAAR", "Pa: 20/40 = VROEG KLAAR");
eq(F({ manual: true, status: "done", minutes: 40, doneMin: 24 }), null, "Pa: 24/40 = ok");
eq(F({ manual: false, status: "done", minutes: 40, doneMin: 30 }), null, "Pa: deur gemete tyd klaar = ok");
eq(F({ manual: true, status: "planned", minutes: 40, doneMin: 0 }), null, "Pa: nie klaar nie");
eq(F({ manual: true, status: "done", minutes: 0, doneMin: 0 }), null, "Pa: geen minute");

if (fails.length) {
  console.error("vroeg-klaar: FOUT\n - " + fails.join("\n - "));
  process.exit(1);
}
console.log(`vroeg-klaar: ${n} kontroles ok`);
