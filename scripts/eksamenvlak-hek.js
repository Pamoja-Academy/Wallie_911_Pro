/* Eksamenvlak-hek (alle vakke): is 'n item wat as HOOFWERK gebruik word werklik so groot as die DBE se eie vraag?
   Spesifikasies: data/dbe-spesifikasie/<vak>.json (DBE-vraestelstruktuur: afdelings, punte, subvrae, tyd, woordgrense).
   Gebruik:
     node scripts/eksamenvlak-hek.js            (CI) — faal as 'n hoofwerk-item onder die DBE-vraag val en nog nie
                                                 as agtergrond gelys is nie, of as die lys verouderd is
     node scripts/eksamenvlak-hek.js --skryf    herskryf assets/js/eksamenvlak-agtergrond.js
   'n Item faal as dit:  punte < DBE-vraaggrootte · minder subvrae as die DBE-vraag · tyd_min ontbreek of te kort ·
   woordgrense onder die DBE s'n · geen bron (DBE-verwysing + bladsy) · rubriekpunte verskil.
   Spesifikasies met geverifieer:false (ONGEVERIFIEER) gee net WAARSKUWINGS, nooit 'n fout nie, en demoveer niks.
   Sulke (geverifieerde) items word outomaties 'agtergrond': hulle kom in assets/js/eksamenvlak-agtergrond.js
   (window.EKSAMENVLAK_AGTERGROND) en die hooftaak-keuse (lesson-ui.js) slaan hulle oor.
   Geen netwerk, geen Supabase. */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SPEC_DIR = path.join(ROOT, "data", "dbe-spesifikasie");
const OUT = path.join(ROOT, "assets", "js", "eksamenvlak-agtergrond.js");
const HEADER = "/* GEGENEREER deur scripts/eksamenvlak-hek.js – moenie met die hand wysig nie */";

/* Een item teen sy afdeling-spesifikasie. Gee 'n lys redes (leeg = voldoen). */
function kontroleerItem(item, spec) {
  const redes = [];
  const afd = spec.afdelings && spec.afdelings[item.afdeling];
  if (!afd) return [`afdeling ${JSON.stringify(item.afdeling)} is nie in die ${spec.vak}-spesifikasie nie`];
  if (!(Number(item.punte) >= afd.punte)) redes.push(`punte ${item.punte} < DBE-vraag ${afd.punte}`);
  const subvrae = item.subvrae == null ? 1 : Number(item.subvrae);
  if (subvrae < afd.subvrae) redes.push(`subvrae ${subvrae} < DBE ${afd.subvrae}`);
  if (item.tyd_min == null || !(Number(item.tyd_min) > 0)) redes.push("tyd_min ontbreek");
  else if (Number(item.tyd_min) < afd.tyd_min) redes.push(`tyd_min ${item.tyd_min} te kort (DBE ${afd.tyd_min})`);
  const w = item.woorde || {};
  if (afd.woorde) {
    if (!(Number(w.min) >= afd.woorde.min)) redes.push(`woorde.min ${w.min} < DBE ${afd.woorde.min}`);
    if (!(Number(w.max) >= afd.woorde.max)) redes.push(`woorde.max ${w.max} < DBE ${afd.woorde.max}`);
  }
  const b = item.bron || {};
  if (!b.verwysing || !(Number(b.bladsy) > 0)) redes.push("geen bron (DBE-verwysing + bladsy)");
  if (afd.kriteria) {
    const rig = (item.nasienriglyn || []).map((r) => Number(r.punte));
    if (JSON.stringify(rig) !== JSON.stringify(afd.kriteria)) redes.push(`rubriekpunte [${rig}] ≠ DBE [${afd.kriteria}]`);
  }
  return redes;
}

/* spec + items → { fout: [{id, redes}], waarskuwing: [...], agtergrond: [id], inligting: [...] } */
function kontroleer(spec, items) {
  const uit = { fout: [], waarskuwing: [], agtergrond: [], inligting: [] };
  if (!spec.geverifieer) uit.waarskuwing.push({ id: spec.vak, redes: [spec.ONGEVERIFIEER || "ONGEVERIFIEER — Hanno moet bevestig"] });
  if (spec.hoofwerk_bank) {
    items
      .filter((i) => i.vak === spec.vak)
      .forEach((i) => {
        const redes = kontroleerItem(i, spec);
        if (!redes.length) return;
        if (spec.geverifieer) {
          uit.fout.push({ id: i.id, redes });
          uit.agtergrond.push(i.id);
        } else uit.waarskuwing.push({ id: i.id, redes });
      });
  } else if (spec.oefenbank_items != null) {
    uit.inligting.push(`${spec.oefenbank_items} oefenitems is nie hoofwerk nie (${spec.oefenbank_nota || "oefening/agtergrond"})`);
  }
  return uit;
}

function laaiSpesifikasies(dir = SPEC_DIR) {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
}

function laaiBank(pad) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, pad), "utf8"));
}

function bouLys(ids) {
  return `${HEADER}\nwindow.EKSAMENVLAK_AGTERGROND = ${JSON.stringify([...ids].sort())};\n`;
}

function voerUit(argv) {
  const skryf = argv.includes("--skryf");
  const spesse = laaiSpesifikasies();
  let fout = 0;
  const agtergrond = [];
  const reels = [];
  for (const spec of spesse) {
    const bank = spec.hoofwerk_bank ? laaiBank(spec.hoofwerk_bank) : [];
    if (spec.oefenbank) spec.oefenbank_items = laaiBank(spec.oefenbank).length;
    const r = kontroleer(spec, bank);
    agtergrond.push(...r.agtergrond);
    r.fout.forEach((f) => reels.push(`FOUT  ${spec.vak} ${f.id}: ${f.redes.join("; ")}`));
    r.waarskuwing.forEach((f) => reels.push(`WAARSKUWING  ${spec.vak} ${f.id}: ${f.redes.join("; ")}`));
    r.inligting.forEach((t) => reels.push(`INLIGTING  ${spec.vak}: ${t}`));
    if (spec.hoofwerk_bank && !r.fout.length && !r.waarskuwing.some((w) => w.id !== spec.vak)) {
      reels.push(`OK  ${spec.vak}: ${bank.filter((i) => i.vak === spec.vak).length} hoofwerk-items voldoen aan die DBE-vraag`);
    }
  }
  const verwag = bouLys(agtergrond);
  const huidig = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8").replace(/\r\n/g, "\n") : "";
  if (skryf) {
    fs.writeFileSync(OUT, verwag);
    reels.push(`Geskryf: ${path.relative(ROOT, OUT)} (${agtergrond.length} agtergrond-items)`);
  } else if (huidig !== verwag) {
    fout += 1;
    reels.push(`FOUT  ${path.relative(ROOT, OUT)} is verouderd: hoofwerk-items onder die DBE-vraag is nie as agtergrond gelys nie. Hardloop: node scripts/eksamenvlak-hek.js --skryf`);
  }
  console.log(reels.join("\n"));
  console.log(fout ? `eksamenvlak-hek: FOUT (${fout})` : `eksamenvlak-hek: ok (${spesse.length} spesifikasies, ${agtergrond.length} agtergrond-items)`);
  return fout ? 1 : 0;
}

module.exports = { kontroleerItem, kontroleer, bouLys, laaiSpesifikasies, voerUit };

if (require.main === module) process.exit(voerUit(process.argv.slice(2)));
