/* Roete-verslag vir Hanno: `node scripts/roete-verslag.js` (Markdown-tabel op stdout). */
const { bereken } = require("./roete");

const { roete, doel } = bereken();
const dag = (iso) => new Date(iso).toLocaleDateString("af-ZA", { weekday: "short", day: "numeric", month: "short", timeZone: "Africa/Johannesburg" });
console.log("| Vraestel | Datum | Prelim → teiken | Gaping | R | Beplan (min) | Vraestel-ekw. | Dae | Status |");
console.log("|---|---|---|---|---|---|---|---|---|");
for (const r of roete) {
  const status = r.genoeg ? "✓ haal die vereiste" : `aanvaar: ${r.aanvaar}`;
  console.log(`| ${r.eksamen} | ${dag(r.datum)} | ${r.prelim} → ${r.teiken} | ${r.gaping} (${r.gaping_punte} punte) | ${r.R} | ${r.minute} / ${r.vereis_min} | ${r.ekwivalente} | ${r.dae} | ${status} |`);
}
console.log("");
for (const o of doel.oop) console.log(`- OOP (teen ${o.teen}): ${o.eksamen} — ${o.wat}`);
