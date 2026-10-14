/* PR 2: elke les-kaart (alle vakke) is 'agtergrond'. `node tests/agtergrond.test.js` */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ctx = {};
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "assets", "js", "lessons.js"), "utf8"), ctx);

const fails = [];
let n = 0;
const L = ctx.WALLIE.LESSONS;
for (const [slug, les] of Object.entries(L)) {
  if (!les.concepts.length) fails.push(`${slug}: geen kaarte`);
  for (const c of les.concepts) {
    n += 1;
    if (c.vlak !== "agtergrond") fails.push(`${slug}/${c.id}: vlak is ${JSON.stringify(c.vlak)}, nie "agtergrond" nie`);
    if (!ctx.WALLIE.isAgtergrond(c)) fails.push(`${slug}/${c.id}: isAgtergrond is vals`);
  }
}
if (!ctx.WALLIE.isAgtergrond(null)) fails.push("isAgtergrond(null) moet waar wees");
if (ctx.WALLIE.isAgtergrond({ vlak: "eksamen" })) fails.push('vlak "eksamen" is nie agtergrond nie');
if (n < 25) fails.push(`te min kaarte (${n})`);
if (fails.length) {
  console.error("agtergrond: FOUT\n - " + fails.join("\n - "));
  process.exit(1);
}
console.log(`agtergrond: ${n} kaarte ok`);
