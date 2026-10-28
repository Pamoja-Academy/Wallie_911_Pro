/* Daaglikse verslag vir Hanno (opdrag 28 Okt 2026): 'n opsomming van ALLE kontroles, plus wat
   Wallie vandag in die app het en wat live is.

   `node scripts/dagverslag.js`            → die vinnige node-kontroles (sekondes)
   `node scripts/dagverslag.js --volledig` → ook Playwright (minute; een lopie op 'n slag, LL-13)
   `node scripts/dagverslag.js --json`     → masjienleesbaar
   `node scripts/dagverslag.js --html`     → die HTML-liggaam vir die e-pos

   Dit SKRYF niks en raak nie aan Supabase nie: dit hardloop die toetse, lees version.json plaaslik
   en haal die live version.json oor HTTP. Vir "het Wallie die app gebruik" is 'n Supabase-SELECT
   nodig; dit kan hierdie skrip nie doen nie (geen sleutel in die repo), dus sê die verslag dit
   eerlik in plaas van om 'n getal uit te dink. */
const fs = require("fs");
const path = require("path");
const https = require("https");
const { spawnSync } = require("child_process");

const root = path.join(__dirname, "..");
const LIVE = "https://pamoja-academy.github.io/Wallie_911_Pro/version.json";

const volledig = process.argv.includes("--volledig");
const asJson = process.argv.includes("--json");
const asHtml = process.argv.includes("--html");

/* ---------- die kontroles ---------- */
/* Elke node-toets druk 'n slotreël soos "fout-rag: ok (205 kontroles, 27 inskrywings)" of
   "fout-vanger: 93 kontroles geslaag". Ons tel die getal kontroles daaruit. */
const NODE_TOETSE = [
  "scripts/proctor-test.js",
  "scripts/smoke-parse.js",
  "tests/sql-migration.test.js",
  "tests/vraebank-store.test.js",
  "tests/vraebank.test.js",
  "tests/preview-guard.test.js",
  "tests/dbe-vraestelle.test.js",
  "tests/ondersteuning.test.js",
  "tests/fout-rag.test.js",
  "tests/fout-vanger.test.js",
  "tests/vraebank-v3.test.js",
  "tests/weergawe.test.js",
  "tests/eksamenmodus.test.js",
  "tests/agtergrond.test.js",
  "tests/vroeg-klaar.test.js",
  "tests/eksamenvlak-hek.test.js",
  "tests/plan-v5.test.js",
  "tests/roete.test.js",
  "tests/vraelys.test.js",
  "scripts/eksamenvlak-hek.js",
  "scripts/bou-fout-rag.js --kyk"
];

/* Die LAASTE "N kontroles" in die uitset, nie die eerste nie: 'n toets se slotreël staan onder, en
   stderr kan 'n vroeëre getal bevat (QC 28 Okt). */
function tel(uitset) {
  const almal = String(uitset).match(/(\d+)\s+kontroles/g);
  if (!almal || !almal.length) return null;
  const m = /(\d+)/.exec(almal[almal.length - 1]);
  return m ? Number(m[1]) : null;
}

function loopToets(cmd) {
  const r = spawnSync("node", cmd.split(" "), { cwd: root, encoding: "utf8", timeout: 240000 });
  const uit = String(r.stdout || "") + String(r.stderr || "");
  const slot = uit.trim().split("\n").filter(Boolean).pop() || "";
  return {
    /* Die hek loop as toets én as skrip; hou die gids in die naam sodat die twee reëls verskil. */
    naam: cmd.replace(/^tests\//, "").replace(/\.test\.js| --kyk|\.js/g, ""),
    cmd,
    ok: r.status === 0,
    kontroles: tel(uit),
    slot: slot.slice(0, 200)
  };
}

function loopPlaywright() {
  const r = spawnSync("npx", ["playwright", "test", "--reporter=line"], {
    cwd: root,
    encoding: "utf8",
    shell: true,
    timeout: 900000,
    env: Object.assign({}, process.env, {
      WALLIE_ARTIFACTS_DIR: path.join(root, "test-artifacts", "playwright-output", "skermkiekies")
    })
  });
  const uit = String(r.stdout || "") + String(r.stderr || "");
  const m = /(\d+)\s+passed/.exec(uit);
  const f = /(\d+)\s+failed/.exec(uit);
  return {
    naam: "playwright (e2e)",
    cmd: "npx playwright test",
    ok: r.status === 0,
    kontroles: m ? Number(m[1]) : null,
    slot: (f ? f[0] + ", " : "") + (m ? m[0] : "geen uitslag gelees nie")
  };
}

/* ---------- watter kode is gemeet ---------- */
/* Die verslag moet sê wát dit gemeet het. Loop dit in 'n ou tak, dan is 741 groen kontroles
   nie 'n uitspraak oor wat live is nie. */
function gitInfo() {
  const g = (args) => {
    const r = spawnSync("git", args, { cwd: root, encoding: "utf8" });
    return r.status === 0 ? String(r.stdout).trim() : null;
  };
  /* Haal eers die nuutste refs: sonder dit vergelyk `agter` teen 'n ou origin/master en sê die
     verslag "(op origin/master)" terwyl dit dit nie is nie (QC 28 Okt). */
  const gehaal = g(["fetch", "--quiet", "origin"]) !== null;
  return {
    gehaal,
    tak: g(["rev-parse", "--abbrev-ref", "HEAD"]),
    commit: g(["rev-parse", "--short", "HEAD"]),
    /* Hoeveel commits agter origin/master? 0 = dit meet wat live hoort te wees. */
    agter: (() => {
      const t = g(["rev-list", "--count", "HEAD..origin/master"]);
      return t == null ? null : Number(t);
    })(),
    skoon: g(["status", "--porcelain"]) === ""
  };
}

/* ---------- live weergawe ---------- */
function haalLive() {
  return new Promise((gee) => {
    const req = https.get(LIVE, { timeout: 15000 }, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => {
        try {
          gee({ ok: res.statusCode === 200, v: JSON.parse(d).v });
        } catch (e) {
          gee({ ok: false, v: null, fout: "version.json is nie geldige JSON nie" });
        }
      });
    });
    req.on("timeout", () => { req.destroy(); gee({ ok: false, v: null, fout: "tydverstryking" }); });
    req.on("error", (e) => gee({ ok: false, v: null, fout: e.message }));
  });
}

/* ---------- rooster ---------- */
function vandagSleutel(d) {
  const p = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
}

/* Lees VASTE_PLANNE en PK.EXAMS sonder om die blaaier-modules te laai: net die blokke van vandag. */
function planVanVandag(dag) {
  const bron = fs.readFileSync(path.join(root, "assets/js/schedule.js"), "utf8").replace(/\r\n/g, "\n");
  const begin = bron.indexOf('"' + dag + '": [');
  if (begin < 0) return null;
  const eind = bron.indexOf("\n    ],", begin);
  const brokkie = bron.slice(begin, eind < 0 ? begin + 4000 : eind);
  const blokke = [];
  const re = /start:\s*"([^"]+)",\s*end:\s*"([^"]+)",\s*soort:\s*"([^"]+)",[\s\S]*?title:\s*"((?:[^"\\]|\\.)*)"/g;
  let m;
  while ((m = re.exec(brokkie))) {
    blokke.push({ van: m[1], tot: m[2], soort: m[3], titel: m[4].replace(/\\"/g, '"') });
  }
  return blokke;
}

function eksamens() {
  const bron = fs.readFileSync(path.join(root, "assets/js/pa-konsole/exams.js"), "utf8");
  const re = /\{\s*s:\s*"([^"]+)",\s*n:\s*"([^"]+)",\s*at:\s*"([^"]+)",\s*dur:\s*"([^"]+)"\s*\}/g;
  const uit = [];
  let m;
  while ((m = re.exec(bron))) uit.push({ vak: m[1], naam: m[2], wanneer: m[3], duur: m[4] });
  return uit;
}

/* ---------- bou ---------- */
(async function () {
  const nou = new Date();
  const dag = vandagSleutel(nou);
  const toetse = NODE_TOETSE.map(loopToets);
  if (volledig) toetse.push(loopPlaywright());

  const live = await haalLive();
  const plaaslik = JSON.parse(fs.readFileSync(path.join(root, "version.json"), "utf8")).v;
  const korpus = JSON.parse(fs.readFileSync(path.join(root, "data/fout-rag.json"), "utf8"));

  const geslaag = toetse.filter((t) => t.ok);
  const gefaal = toetse.filter((t) => !t.ok);
  /* Net GESLAAGDE lopies se kontroles tel. 'n Gefaalde lopie se getal beteken niks (QC 28 Okt). */
  const somKontroles = geslaag.reduce((s, t) => s + (t.kontroles || 0), 0);

  const alleEksamens = eksamens();
  /* "Volgende" is die eerste eksamen wat nog NIE begin het nie. Vandag se eksamen wat verby is,
     moet nie as die volgende een gewys word nie. */
  const volgende = alleEksamens
    .filter((e) => new Date(e.wanneer) > nou)
    .sort((a, b) => new Date(a.wanneer) - new Date(b.wanneer));
  const plan = planVanVandag(dag);

  const git = gitInfo();
  const data = {
    dag,
    gegenereer: nou.toISOString(),
    git,
    weergawe: { plaaslik, live: live.v, live_ok: live.ok, live_fout: live.fout || null, pas: live.v === plaaslik },
    toetse: { totaal: toetse.length, geslaag: geslaag.length, gefaal: gefaal.length, kontroles: somKontroles, volledig, lys: toetse },
    foutvanger: { korpus: korpus.korpus, inskrywings: korpus.inskrywings.length },
    plan: plan,
    volgende_eksamen: volgende[0] || null,
    eksamens_oor: volgende.length
  };

  if (asJson) {
    process.stdout.write(JSON.stringify(data, null, 1) + "\n");
    process.exit(gefaal.length ? 1 : 0);
  }

  /* 'n Lopie SONDER die e2e-suite mag nooit "GROEN" heet nie: op 28 Okt het presies dié verslag
     "GROEN, 741 kontroles" ge-e-pos terwyl die e2e-suite op daardie oomblik 6 mislukkings gehad het.
     Dit is dieselfde sonde as die e-pos-belofte (LL-22): 'n uitspraak wat nie gemeet is nie. */
  const vlag = gefaal.length ? "ROOI" : volledig ? "GROEN" : "GROEN (SONDER E2E)";
  const reëls = [];
  reëls.push(`WALLIE — DAGVERSLAG ${dag} (${vlag})`);
  reëls.push("");
  reëls.push(`Kontroles: ${somKontroles} oor ${toetse.length} toetslopies · ${geslaag.length} geslaag, ${gefaal.length} gefaal`);
  reëls.push(
    volledig
      ? "Die e2e-suite (Playwright) het saam geloop."
      : "LET WEL: die e2e-suite (Playwright) het NIE geloop nie. Hierdie verslag sê niks oor die blaaiergedrag nie — loop `node scripts/dagverslag.js --volledig` daarvoor."
  );
  reëls.push(`Weergawe: live ${live.ok ? live.v : "ONBEKEND (" + (live.fout || "?") + ")"} · in die repo ${plaaslik}${data.weergawe.pas ? " (pas)" : " (VERSKIL — nog nie saamgevoeg nie)"}`);
  reëls.push(
    `Gemeet op: tak ${git.tak || "?"} @ ${git.commit || "?"}` +
      (git.agter ? ` — ${git.agter} commits AGTER origin/master` : git.agter === 0 ? " (op origin/master)" : " — kon nie teen origin/master vergelyk nie") +
      (git.gehaal ? "" : " · git fetch het misluk, die vergelyking kan verouderd wees") +
      (git.skoon ? "" : " · ONGECOMMITTE wysigings: hierdie syfers beskryf nie wat live is nie")
  );
  reëls.push(`Foutvanger-korpus: ${korpus.inskrywings.length} inskrywings (${korpus.korpus.faq} FAQ, ${korpus.korpus.lesse} lesse, ${korpus.korpus.seine} seine)`);
  reëls.push(`Eksamens oor: ${volgende.length}${volgende[0] ? " · volgende: " + volgende[0].naam + " " + volgende[0].wanneer.slice(0, 16).replace("T", " ") : ""}`);
  reëls.push("");
  if (gefaal.length) {
    reëls.push("GEFAAL:");
    gefaal.forEach((t) => reëls.push(`  ✗ ${t.naam} — ${t.slot}`));
    reëls.push("");
  }
  reëls.push("Alle kontroles:");
  toetse.forEach((t) => {
    reëls.push(`  ${t.ok ? "ok" : "✗ "} ${t.naam.padEnd(22)} ${t.kontroles == null ? "" : String(t.kontroles).padStart(4) + " kontroles"}`);
  });
  reëls.push("");
  if (plan && plan.length) {
    reëls.push(`Wallie se plan vandag (${plan.length} blokke):`);
    plan.forEach((b) => reëls.push(`  ${b.van}-${b.tot} ${b.soort.padEnd(13)} ${b.titel.slice(0, 90)}`));
  } else {
    reëls.push(`GEEN VASTE PLAN vir ${dag} in schedule.js nie — die app val terug op die generiese rotasie (LL-02).`);
  }
  reëls.push("");
  reëls.push("Nie in hierdie verslag nie: of Wallie die app vandag gebruik het. Dit vra 'n Supabase-SELECT");
  reëls.push("op wallie911.events; hierdie skrip het geen sleutel nie en dink niks uit.");
  const teks = reëls.join("\n");

  if (asHtml) {
    const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const ry = (t) =>
      `<tr><td style="padding:2px 10px 2px 0">${t.ok ? "✅" : "❌"}</td><td style="padding:2px 10px 2px 0;font-family:ui-monospace,monospace">${esc(t.naam)}</td><td style="padding:2px 0;text-align:right">${t.kontroles == null ? "&mdash;" : t.kontroles}</td></tr>`;
    process.stdout.write(
      `<div style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.5">
<h2 style="margin:0 0 4px">Wallie — dagverslag ${esc(dag)} <span style="color:${gefaal.length ? "#b00" : "#070"}">${vlag}</span></h2>
<p style="margin:0 0 12px"><strong>${somKontroles} kontroles</strong> oor ${toetse.length} toetslopies — ${geslaag.length} geslaag, ${gefaal.length} gefaal.<br>
${volledig ? "Die e2e-suite (Playwright) het saam geloop." : "<strong style=\"color:#b00\">Die e2e-suite het NIE geloop nie</strong> — hierdie verslag sê niks oor die blaaiergedrag nie."}<br>
Live <strong>${esc(live.ok ? live.v : "onbekend")}</strong>, in die repo <strong>${esc(plaaslik)}</strong>${data.weergawe.pas ? "" : " — <strong style=\"color:#b00\">verskil</strong>"}.<br>
Foutvanger-korpus: ${korpus.inskrywings.length} inskrywings.<br>
Eksamens oor: ${volgende.length}${volgende[0] ? ` — volgende <strong>${esc(volgende[0].naam)}</strong> ${esc(volgende[0].wanneer.slice(0, 16).replace("T", " "))}` : ""}.<br>
<span style="color:#666">Gemeet op tak <strong>${esc(git.tak || "?")}</strong> @ ${esc(git.commit || "?")}${git.agter ? ` — <strong style="color:#b00">${git.agter} commits agter origin/master</strong>` : git.agter === 0 ? " (op origin/master)" : " — kon nie teen origin/master vergelyk nie"}${git.gehaal ? "" : " · git fetch het misluk"}${git.skoon ? "" : ' · <strong style="color:#b00">ongecommitte wysigings: hierdie syfers beskryf nie wat live is nie</strong>'}</span></p>
<table style="border-collapse:collapse;font-size:13px">${toetse.map(ry).join("")}</table>
${plan && plan.length ? `<h3 style="margin:16px 0 4px">Wallie se plan vandag</h3><ul style="margin:0;padding-left:18px">${plan.map((b) => `<li>${esc(b.van)}&ndash;${esc(b.tot)} <em>${esc(b.soort)}</em> &mdash; ${esc(b.titel)}</li>`).join("")}</ul>` : `<p style="color:#b00"><strong>Geen vaste plan vir ${esc(dag)} nie</strong> &mdash; die app val terug op die generiese rotasie.</p>`}
<p style="margin:16px 0 0;color:#666;font-size:12px">Nie hierin nie: of Wallie die app vandag gebruik het (dit vra 'n Supabase-SELECT; hierdie skrip het geen sleutel en dink niks uit).</p>
</div>\n`
    );
  } else {
    process.stdout.write(teks + "\n");
  }
  process.exit(gefaal.length ? 1 : 0);
})();
