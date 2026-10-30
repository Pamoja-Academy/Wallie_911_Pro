/* Toerisme vinnige MCQ: 20 vrae, elke bron, korrekte reg-indeks, JSON ↔ JS-bank. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const fails = [];
const json = JSON.parse(fs.readFileSync(path.join(root, "data", "toerisme-mcq-vinnig.json"), "utf8"));
const js = fs.readFileSync(path.join(root, "assets", "js", "toerisme-mcq-data.js"), "utf8");
const ctx = { window: {} };
vm.runInNewContext(js, ctx);
const bank = ctx.window.TOERISME_MCQ_VINNIG;

if (!Array.isArray(json) || json.length !== 20) fails.push(`JSON: ${json.length} vrae, verwag 20`);
if (!Array.isArray(bank) || bank.length !== 20) fails.push(`JS-bank: ${bank && bank.length} vrae, verwag 20`);
if (JSON.stringify(json) !== JSON.stringify(bank)) fails.push("data/toerisme-mcq-vinnig.json ≠ assets/js/toerisme-mcq-data.js — hergenereer die JS");

const ids = new Set();
json.forEach((q, i) => {
  if (!q.id || ids.has(q.id)) fails.push(`vraag ${i}: id ontbreek of duplikaat`);
  ids.add(q.id);
  if (!q.vraag || !Array.isArray(q.opsies) || q.opsies.length !== 4) fails.push(`${q.id}: vraag/4 opsies`);
  if (!(Number.isInteger(q.reg) && q.reg >= 0 && q.reg < 4)) fails.push(`${q.id}: reg-indeks ongeldig`);
  if (!q.verduideliking) fails.push(`${q.id}: verduideliking ontbreek`);
  const b = q.bron || {};
  if (!b.verwysing || !(Number(b.bladsy) > 0)) fails.push(`${q.id}: geen bron (verwysing + bladsy)`);
});

/* Temas uit die notas moet almal voorkom */
for (const t of ["doeane", "kanaal", "utc", "kaartwerk", "minister"]) {
  if (!json.some((q) => q.tema === t)) fails.push(`geen vraag met tema ${t}`);
}

/* Kernfeite wat SARS/DBE vereis (nie die notas se foute nie) */
const byId = Object.fromEntries(json.map((q) => [q.id, q]));
const moet = [
  ["toer-mcq-01", "200"],
  ["toer-mcq-02", "20"],
  ["toer-mcq-04", "2 liter"],
  ["toer-mcq-06", "R5 000"],
  ["toer-mcq-07", "Rooi kanaal"],
  ["toer-mcq-09", "Groen kanaal"],
  ["toer-mcq-18", "08:00 volgende dag"],
  ["toer-mcq-20", "Patricia de Lille"]
];
moet.forEach(([id, teks]) => {
  const q = byId[id];
  if (!q) return fails.push(`verwagte vraag ${id} ontbreek`);
  if (q.opsies[q.reg] !== teks) fails.push(`${id}: regte antwoord moet "${teks}" wees, is "${q.opsies[q.reg]}"`);
});

/* Schedule: MCQ-blok op eksamendag */
const sched = fs.readFileSync(path.join(root, "assets", "js", "schedule.js"), "utf8");
if (!/mcq:\s*"toer-vinnig"/.test(sched)) fails.push('schedule.js: mcq:"toer-vinnig" ontbreek');
if (!/suffix:\s*"mcq-vinnig"/.test(sched)) fails.push('schedule.js: suffix mcq-vinnig ontbreek');

if (fails.length) {
  console.error("toerisme-mcq: FOUT\n - " + fails.join("\n - "));
  process.exit(1);
}
console.log("toerisme-mcq: ok (20 vrae, bronne, schedule)");
