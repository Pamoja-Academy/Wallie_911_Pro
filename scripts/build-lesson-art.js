/* Genereer statiese SVG-lesprente onder assets/img/lessons/<vak>/<konsep>.svg.
 * Wallie het nie Node nodig nie: die uitset word saam met die repo gestoor.
 * Herbou: node scripts/build-lesson-art.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const outDir = path.join(root, "assets/img/lessons");

const sandbox = { window: {}, WALLIE: {} };
sandbox.window = sandbox;
vm.runInNewContext(fs.readFileSync(path.join(root, "assets/js/data.js"), "utf8"), sandbox);
const SUBJECTS = sandbox.WALLIE.SUBJECTS;

const C = {
  bg: "#071d11",
  bg2: "#0c2a19",
  panel: "#123a24",
  line: "#2f6b47",
  text: "#f6f8f3",
  muted: "#b9d0c0",
  gold: "#f2c94c",
  red: "#ff6b57",
  green: "#3ddc84",
  blue: "#5cc8ff",
  purple: "#c9a2ff",
  ink: "#10140f",
  paper: "#f4f1e8"
};

const ZONE = {
  rooi: { fill: "#d4472f", text: "#ffffff", label: "ROOI-SONE" },
  geel: { fill: "#f2c94c", text: "#1a1400", label: "GEEL-SONE" },
  groen: { fill: "#0a8f5a", text: "#ffffff", label: "GROEN-SONE" },
  slot: { fill: "#5cc8ff", text: "#04140b", label: "SLOT" }
};

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function T(x, y, s, o = {}) {
  const size = o.size || 22;
  const lines = Array.isArray(s) ? s : [s];
  const attrs = [
    `x="${x}"`,
    `y="${y}"`,
    `font-size="${size}"`,
    `fill="${o.fill || C.text}"`,
    `font-weight="${o.weight || 700}"`,
    o.anchor ? `text-anchor="${o.anchor}"` : "",
    o.italic ? `font-style="italic"` : "",
    o.family ? `font-family="${o.family}"` : "",
    o.ls ? `letter-spacing="${o.ls}"` : ""
  ]
    .filter(Boolean)
    .join(" ");
  if (lines.length === 1 && !o.raw) return `<text ${attrs}>${esc(lines[0])}</text>`;
  if (o.raw) return `<text ${attrs}>${s}</text>`;
  const lh = o.lh || size * 1.22;
  const spans = lines
    .map((l, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : lh}">${esc(l)}</tspan>`)
    .join("");
  return `<text ${attrs}>${spans}</text>`;
}

/* Kleurgekodeerde reël: segs = [[teks, kleur], ...] */
function TC(x, y, segs, o = {}) {
  const spans = segs
    .map(([s, col, w]) => `<tspan fill="${col || C.text}"${w ? ` font-weight="${w}"` : ""}>${esc(s)}</tspan>`)
    .join("");
  return `<text x="${x}" y="${y}" font-size="${o.size || 22}" font-weight="${o.weight || 700}"${
    o.anchor ? ` text-anchor="${o.anchor}"` : ""
  }${o.family ? ` font-family="${o.family}"` : ""}>${spans}</text>`;
}

function R(x, y, w, h, o = {}) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r ?? 14}" fill="${o.fill || C.panel}"${
    o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw || 3}"` : ""
  }${o.dash ? ` stroke-dasharray="${o.dash}"` : ""}${o.opacity ? ` opacity="${o.opacity}"` : ""}/>`;
}

function Ci(cx, cy, r, o = {}) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${o.fill || C.panel}"${
    o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw || 3}"` : ""
  }${o.dash ? ` stroke-dasharray="${o.dash}"` : ""}/>`;
}

const markerName = (col) => "ah" + col.replace("#", "");
const usedMarkers = new Set();

function A(x1, y1, x2, y2, col = C.gold, w = 5) {
  usedMarkers.add(col);
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="${w}" stroke-linecap="round" marker-end="url(#${markerName(col)})"/>`;
}

function P(d, col = C.gold, w = 5, arrow = true, dash) {
  if (arrow) usedMarkers.add(col);
  return `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"${
    dash ? ` stroke-dasharray="${dash}"` : ""
  }${arrow ? ` marker-end="url(#${markerName(col)})"` : ""}/>`;
}

function L(x1, y1, x2, y2, col = C.line, w = 3, dash) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="${w}"${
    dash ? ` stroke-dasharray="${dash}"` : ""
  }/>`;
}

function pill(x, y, w, h, fill, label, o = {}) {
  return (
    R(x, y, w, h, { fill, r: o.r ?? h / 2, stroke: o.stroke, sw: o.sw }) +
    T(x + w / 2, y + h / 2 + (o.size || 20) * 0.36, label, {
      size: o.size || 20,
      fill: o.fill || C.ink,
      anchor: "middle",
      weight: o.weight || 800,
      family: o.family
    })
  );
}

function num(cx, cy, n, fill = C.gold, r = 22, textFill = C.ink) {
  return Ci(cx, cy, r, { fill }) + T(cx, cy + r * 0.38, String(n), { size: r * 1.05, anchor: "middle", fill: textFill, weight: 900 });
}

function person(cx, cy, col = C.blue, s = 1) {
  return (
    Ci(cx, cy - 26 * s, 13 * s, { fill: col }) +
    `<path d="M${cx - 20 * s},${cy + 22 * s} Q${cx - 20 * s},${cy - 8 * s} ${cx},${cy - 8 * s} Q${cx + 20 * s},${cy - 8 * s} ${cx + 20 * s},${cy + 22 * s} Z" fill="${col}"/>`
  );
}

function frame({ zone, kicker, title, body, label }) {
  const z = ZONE[zone] || ZONE.groen;
  const markers = [...usedMarkers]
    .map(
      (col) =>
        `<marker id="${markerName(col)}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4.2" markerHeight="4.2" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${col}"/></marker>`
    )
    .join("");
  usedMarkers.clear();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" width="800" height="520" role="img" aria-label="${esc(
    label || `${kicker}: ${title}`
  )}" font-family="Arial, Helvetica, sans-serif">
<defs>${markers}</defs>
<rect width="800" height="520" rx="18" fill="${C.bg}"/>
<rect width="800" height="72" rx="18" fill="${z.fill}"/><rect y="50" width="800" height="22" fill="${z.fill}"/>
${T(24, 27, kicker.toUpperCase(), { size: 15, fill: z.text, ls: 2, weight: 800 })}
${T(24, 60, title, { size: 29, fill: z.text, weight: 900 })}
${body}
</svg>
`;
}

/* ---------- Ikone vir voorblaaie ---------- */
const ICON = {
  gasvryheid: (x, y) => `
    <g transform="translate(${x},${y})">
      <circle cx="60" cy="80" r="46" fill="#fff"/><circle cx="110" cy="58" r="56" fill="#fff"/><circle cx="160" cy="80" r="46" fill="#fff"/>
      <rect x="40" y="90" width="140" height="70" rx="10" fill="#fff"/>
      <rect x="40" y="150" width="140" height="34" rx="6" fill="${C.gold}"/>
      <path d="M20,210 Q110,150 200,210 Z" fill="${C.muted}"/><rect x="10" y="208" width="200" height="10" rx="5" fill="${C.muted}"/>
    </g>`,
  afrikaans: (x, y) => `
    <g transform="translate(${x},${y})">
      <path d="M10,20 h200 a16,16 0 0 1 16,16 v120 a16,16 0 0 1 -16,16 h-120 l-50,44 v-44 h-30 a16,16 0 0 1 -16,-16 v-120 a16,16 0 0 1 16,-16 z" fill="${C.gold}"/>
      <text x="113" y="128" font-size="92" font-weight="900" fill="${C.ink}" text-anchor="middle">Aa</text>
    </g>`,
  rtt: (x, y) => `
    <g transform="translate(${x},${y})">
      <rect x="0" y="10" width="220" height="150" rx="12" fill="${C.blue}"/>
      <rect x="14" y="24" width="192" height="122" rx="4" fill="#e9f6ff"/>
      ${[0, 1, 2, 3].map((r) => `<line x1="14" y1="${54 + r * 24}" x2="206" y2="${54 + r * 24}" stroke="#7aa7c4" stroke-width="2"/>`).join("")}
      ${[0, 1, 2].map((c) => `<line x1="${62 + c * 48}" y1="24" x2="${62 + c * 48}" y2="146" stroke="#7aa7c4" stroke-width="2"/>`).join("")}
      <rect x="62" y="78" width="48" height="24" fill="${C.gold}"/>
      <rect x="90" y="160" width="40" height="30" fill="${C.blue}"/><rect x="50" y="188" width="120" height="14" rx="7" fill="${C.blue}"/>
    </g>`,
  engels: (x, y) => `
    <g transform="translate(${x},${y})">
      <path d="M110,40 Q60,10 0,24 v150 Q60,160 110,190 Z" fill="#fff"/>
      <path d="M110,40 Q160,10 220,24 v150 Q160,160 110,190 Z" fill="#e6efe8"/>
      <line x1="110" y1="40" x2="110" y2="190" stroke="${C.line}" stroke-width="4"/>
      ${[0, 1, 2, 3].map((i) => `<line x1="22" y1="${70 + i * 24}" x2="90" y2="${66 + i * 24}" stroke="#9ab" stroke-width="5" stroke-linecap="round"/>`).join("")}
      <text x="165" y="130" font-size="110" font-weight="900" fill="${C.red}" text-anchor="middle">“</text>
    </g>`,
  toerisme: (x, y) => `
    <g transform="translate(${x},${y})">
      <circle cx="110" cy="115" r="95" fill="${C.blue}"/>
      <ellipse cx="110" cy="115" rx="40" ry="95" fill="none" stroke="#e9f6ff" stroke-width="5"/>
      <line x1="15" y1="115" x2="205" y2="115" stroke="#e9f6ff" stroke-width="5"/>
      <path d="M30,70 Q110,55 190,70 M30,160 Q110,175 190,160" fill="none" stroke="#e9f6ff" stroke-width="4"/>
      <path d="M150,30 l40,-6 l10,8 l-36,14 l-8,24 l-10,2 l2,-22 l-22,8 l-6,10 l-8,0 l4,-16 l-14,-8 l6,-4 l18,4 z" fill="${C.gold}"/>
    </g>`,
  wiskgelett: (x, y) => `
    <g transform="translate(${x},${y})">
      <rect x="10" y="130" width="40" height="70" rx="6" fill="${C.blue}"/>
      <rect x="64" y="96" width="40" height="104" rx="6" fill="${C.green}"/>
      <rect x="118" y="60" width="40" height="140" rx="6" fill="${C.gold}"/>
      <rect x="172" y="24" width="40" height="176" rx="6" fill="${C.red}"/>
      <path d="M20,110 L84,74 L138,40 L196,6" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/>
      <line x1="0" y1="206" x2="222" y2="206" stroke="#fff" stroke-width="6"/>
    </g>`,
  foutbank: (x, y) => `
    <g transform="translate(${x},${y})">
      <circle cx="110" cy="110" r="100" fill="#fff"/><circle cx="110" cy="110" r="74" fill="${C.red}"/>
      <circle cx="110" cy="110" r="48" fill="#fff"/><circle cx="110" cy="110" r="22" fill="${C.red}"/>
      <line x1="220" y1="0" x2="118" y2="102" stroke="${C.gold}" stroke-width="9" stroke-linecap="round"/>
      <path d="M220,0 l-30,4 l26,26 z" fill="${C.gold}"/>
    </g>`
};

function cover(slug, { naam, zone, motto, lessCount, prelim, teiken }) {
  const z = ZONE[zone];
  const bar = (v) => 340 + (420 * v) / 100;
  const hasMarks = typeof prelim === "number";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" width="800" height="520" role="img" aria-label="${esc(
    naam
  )} — voorblad" font-family="Arial, Helvetica, sans-serif">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0d4a2c"/><stop offset="1" stop-color="#04140b"/></linearGradient></defs>
<rect width="800" height="520" rx="18" fill="url(#g)"/>
${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="${i * 100}" y="0" width="50" height="520" fill="#ffffff" opacity="0.025"/>`).join("")}
<rect x="0" y="0" width="16" height="520" rx="8" fill="${z.fill}"/>
${pill(40, 34, 170, 40, z.fill, z.label, { fill: z.text, size: 18 })}
${ICON[slug](70, 140)}
${naam.length > 20 ? T(340, 150, naam.split(" "), { size: 40, weight: 900, lh: 44 }) : T(340, 190, naam, { size: 48, weight: 900 })}
${T(340, 240, motto, { size: 22, fill: C.muted, weight: 600 })}
${
  hasMarks
    ? `${T(340, 312, `Prelim ${prelim}%`, { size: 20, fill: C.red })}${T(760, 312, `Teiken ${teiken}%`, { size: 20, fill: C.gold, anchor: "end" })}
${R(340, 326, 420, 30, { fill: "#06120b", stroke: C.line, sw: 2, r: 15 })}
${R(340, 326, Math.max(30, bar(prelim) - 340), 30, { fill: C.red, r: 15 })}
<line x1="${bar(teiken)}" y1="316" x2="${bar(teiken)}" y2="366" stroke="${C.gold}" stroke-width="6"/>
${T(340, 398, prelim >= teiken ? "Op teiken — vang nou die dom foute" : `Gaping: ${teiken - prelim} punte om te wen`, { size: 20, fill: C.text })}`
    : T(340, 330, "Sluit elke dag hiermee af.", { size: 24, fill: C.gold })
}
${pill(340, 430, 300, 46, C.gold, `${lessCount} visuele lesse →`, { size: 22 })}
${T(770, 500, "#15 · Springbok SOS", { size: 16, fill: C.muted, anchor: "end", weight: 700 })}
</svg>
`;
}

function jersey() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 220" width="240" height="220" role="img" aria-label="Springbok trui nommer 15" font-family="Arial, Helvetica, sans-serif">
<path d="M70,12 L100,4 Q120,26 140,4 L170,12 L232,52 L208,104 L180,92 L180,214 L60,214 L60,92 L32,104 L8,52 Z" fill="#007a4d" stroke="${C.gold}" stroke-width="6" stroke-linejoin="round"/>
<path d="M100,4 Q120,26 140,4" fill="none" stroke="${C.gold}" stroke-width="8"/>
<text x="120" y="160" font-size="86" font-weight="900" fill="${C.gold}" text-anchor="middle">15</text>
<text x="120" y="196" font-size="20" font-weight="900" fill="#fff" text-anchor="middle" letter-spacing="4">SOS</text>
</svg>
`;
}

/* ---------- Konsep-prente ---------- */
const ART = {};

/* GASVRYHEID */
ART["gasvryheid/gevaarsone"] = () => {
  const band = (y, h, fill, temp, lines, tcol = C.ink) =>
    R(220, y, 556, h, { fill, r: 12 }) +
    T(240, y + h / 2 + 11, temp, { size: 30, fill: tcol, weight: 900 }) +
    T(400, y + h / 2 + (lines.length > 1 ? -4 : 8), lines, { size: 20, fill: tcol, weight: 700, lh: 24 });
  return frame({
    zone: "rooi",
    kicker: "Gasvryheidstudie · Higiëne",
    title: "Temperatuur-gevaarsone",
    body: `
    ${R(126, 96, 48, 340, { fill: "#e9efe9", r: 24 })}
    ${R(136, 220, 28, 220, { fill: C.red, r: 14 })}
    ${Ci(150, 462, 38, { fill: C.red, stroke: "#e9efe9", sw: 6 })}
    ${[110, 170, 236, 360, 420].map((y) => L(174, y + 18, 210, y + 18, "#e9efe9", 3)).join("")}
    ${band(96, 58, C.green, "75 °C", ["Gaar & herverhit: kern 75 °C+"])}
    ${band(160, 58, "#9be7b9", "60 °C+", ["Warm hou: bo 60 °C"])}
    ${R(220, 224, 556, 128, { fill: C.red, r: 12, stroke: "#fff", sw: 4 })}
    ${T(240, 280, "5 – 60 °C", { size: 36, weight: 900, fill: "#fff" })}
    ${T(240, 318, "GEVAARSONE", { size: 26, weight: 900, fill: "#fff", ls: 2 })}
    ${T(450, 270, ["Bakterieë verdubbel", "± elke 20 minute", "Maks. 2 uur hier"], { size: 21, fill: "#fff", lh: 27 })}
    ${[0, 1, 2].map((i) => Ci(712 + (i % 2) * 26, 262 + i * 26, 11, { fill: "#ffe2dc" })).join("")}
    ${band(358, 58, C.blue, "0 – 5 °C", ["Yskas: koud hou"])}
    ${band(422, 58, "#2f7fb0", "−18 °C", ["Vrieskas: −18 °C of kouer"], "#fff")}
    ${T(150, 510, "", { size: 10 })}`
  });
};

ART["gasvryheid/haccp"] = () => {
  const row1 = [
    [1, "Gevaar-", "analise", "Wat kan skade doen?"],
    [2, "Kritieke", "beheerpunte", "Waar keer ek dit?"],
    [3, "Kritieke", "limiete", "bv. kern 75 °C"],
    [4, "Monitor", "", "meet & kyk"]
  ];
  const row2 = [
    [5, "Regstel-", "aksie", "as limiet gemis is"],
    [6, "Verifieer", "", "werk die stelsel?"],
    [7, "Rekords", "", "skryf alles neer"]
  ];
  const xs = [120, 300, 480, 660];
  const node = (x, y, [n, a, b, sub], col) =>
    Ci(x, y, 36, { fill: col, stroke: "#fff", sw: 4 }) +
    T(x, y + 13, String(n), { size: 36, anchor: "middle", fill: C.ink, weight: 900 }) +
    T(x, y + 66, b ? [a, b] : [a], { size: 21, anchor: "middle", lh: 23 }) +
    T(x, y + (b ? 112 : 90), sub, { size: 16, anchor: "middle", fill: C.muted, weight: 600 });
  return frame({
    zone: "rooi",
    kicker: "Gasvryheidstudie · Voedselveiligheid",
    title: "HACCP — 7 beginsels",
    body: `
    ${row1.map((r, i) => node(xs[i], 140, r, C.gold)).join("")}
    ${[0, 1, 2].map((i) => A(xs[i] + 42, 140, xs[i + 1] - 46, 140, C.gold, 5)).join("")}
    ${P("M700,150 C790,170 790,320 700,330", C.gold, 5)}
    ${row2.map((r, i) => node(xs[3 - i], 330, r, C.green)).join("")}
    ${[3, 2].map((i) => A(xs[i] - 42, 330, xs[i - 1] + 46, 330, C.green, 5)).join("")}
    <path d="M120,282 l52,20 v34 q0,40 -52,62 q-52,-22 -52,-62 v-34 z" fill="${C.blue}" stroke="#fff" stroke-width="4"/>
    ${T(120, 350, "HACCP", { size: 20, anchor: "middle", fill: C.ink, weight: 900 })}
    ${R(30, 452, 740, 50, { fill: C.bg2, stroke: C.gold, sw: 2 })}
    ${T(400, 485, "Gevaar → Punt → Limiet → Meet → Regmaak → Toets → Skryf", { size: 21, anchor: "middle", fill: C.gold })}`
  });
};

ART["gasvryheid/koste"] = () => {
  const steps = [
    ["Totale koste", ["tel alle", "bestanddele op"], "R240"],
    ["Per porsie", ["÷ aantal porsies", "(8 porsies)"], "R30"],
    ["+ Wins-%", ["R30 + 150%", "(R45 wins)"], "R75"],
    ["+ BTW 15%", ["R75 × 1,15"], "R86,25"]
  ];
  const x0 = [24, 220, 416, 612];
  return frame({
    zone: "rooi",
    kicker: "Gasvryheidstudie · Kosteberekening",
    title: "Van resep tot verkoopprys",
    body: `
    ${steps
      .map(
        ([t, sub, v], i) =>
          R(x0[i], 96, 168, 230, { fill: C.panel, stroke: i === 3 ? C.gold : C.line, sw: 3 }) +
          num(x0[i] + 84, 128, i + 1) +
          T(x0[i] + 84, 186, t, { size: 21, anchor: "middle" }) +
          T(x0[i] + 84, 216, sub, { size: 17, anchor: "middle", fill: C.muted, weight: 600, lh: 21 }) +
          T(x0[i] + 84, 300, v, { size: 34, anchor: "middle", fill: C.gold, weight: 900 })
      )
      .join("")}
    ${[0, 1, 2].map((i) => A(x0[i] + 170, 210, x0[i + 1] - 4, 210, C.gold, 4)).join("")}
    ${R(24, 346, 360, 150, { fill: "#3a1712", stroke: C.red, sw: 3 })}
    ${T(44, 384, "LEES DIE VRAAG!", { size: 22, fill: C.red, weight: 900 })}
    ${T(44, 418, ["Wins-% (opmerking op koste)", "≠ voedselkoste-% van prys.", "Watter een vra hulle?"], { size: 19, lh: 25 })}
    ${R(404, 346, 372, 150, { fill: C.bg2, stroke: C.green, sw: 3 })}
    ${T(424, 384, "Voedselkoste-%", { size: 22, fill: C.green, weight: 900 })}
    ${T(424, 418, ["= koste ÷ verkoopprys × 100", "= 30 ÷ 75 × 100", "= 40%"], { size: 19, lh: 25 })}`
  });
};

ART["gasvryheid/tafel"] = () => {
  const fork = (x, top = 238, bottom = 392) =>
    `<rect x="${x - 4}" y="${top + 26}" width="8" height="${bottom - top - 26}" rx="4" fill="#dfe6df"/>
     <rect x="${x - 9}" y="${top + 20}" width="18" height="10" rx="3" fill="#dfe6df"/>
     ${[-7, 0, 7].map((d) => `<rect x="${x + d - 1.5}" y="${top}" width="3" height="24" fill="#dfe6df"/>`).join("")}`;
  const knife = (x, top = 238, bottom = 392) =>
    `<rect x="${x - 4}" y="${top + 60}" width="8" height="${bottom - top - 60}" rx="4" fill="#dfe6df"/>
     <path d="M${x - 5},${top + 62} L${x - 5},${top + 6} Q${x + 7},${top + 14} ${x + 6},${top + 62} Z" fill="#dfe6df"/>`;
  const spoon = (x, top = 238, bottom = 392) =>
    `<ellipse cx="${x}" cy="${top + 18}" rx="11" ry="18" fill="#dfe6df"/><rect x="${x - 3.5}" y="${top + 32}" width="7" height="${bottom - top - 32}" rx="3.5" fill="#dfe6df"/>`;
  const lab = (x, y, lines, anchor = "start", col = C.gold) => T(x, y, lines, { size: 17, anchor, fill: col, lh: 20 });
  return frame({
    zone: "rooi",
    kicker: "Gasvryheidstudie · Kos- & drankdiens",
    title: "Formele tafeldekking (bo-aansig)",
    body: `
    ${R(150, 96, 500, 340, { fill: "#1d4a30", r: 18 })}
    ${Ci(400, 318, 84, { fill: "#f4f6f2" })}${Ci(400, 318, 60, { fill: "#e3e9e2" })}
    <path d="M372,300 L428,300 L400,346 Z" fill="${C.red}"/>
    ${fork(298)}${fork(270)}
    ${knife(504)}${knife(530)}${spoon(560)}
    <ellipse cx="338" cy="206" rx="14" ry="9" fill="#dfe6df"/><rect x="350" y="203" width="120" height="6" rx="3" fill="#dfe6df"/>
    <rect x="330" y="182" width="112" height="6" rx="3" fill="#dfe6df"/>
    ${[0, 1, 2].map((i) => `<rect x="440" y="${176 + i * 6}" width="22" height="3" fill="#dfe6df"/>`).join("")}
    ${Ci(214, 222, 40, { fill: "#f4f6f2" })}<rect x="186" y="219" width="58" height="6" rx="3" fill="#9aa59a"/>
    ${Ci(512, 168, 20, { fill: "none", stroke: C.blue, sw: 5 })}${Ci(560, 186, 17, { fill: "none", stroke: C.purple, sw: 5 })}
    ${L(150, 222, 172, 222, C.gold, 2)}${lab(142, 214, ["Kleinbord +", "bottermes"], "end")}
    ${L(150, 330, 262, 330, C.gold, 2)}${lab(142, 322, ["Vurke links:", "buitenste =", "eerste gang"], "end")}
    ${L(572, 330, 650, 330, C.gold, 2)}${lab(658, 322, ["Messe regs,", "lem na bord;", "soplepel buite"])}
    ${L(578, 178, 650, 150, C.gold, 2)}${lab(658, 146, ["Glase bo", "die hoofmes"])}
    ${L(400, 178, 400, 120, C.gold, 2)}${lab(400, 116, "Nagereg-lepel & -vurk bo die bord", "middle")}
    ${R(30, 450, 740, 52, { fill: C.gold })}
    ${T(400, 484, "Reël: werk van BUITE na BINNE — een stel per gang", { size: 22, anchor: "middle", fill: C.ink, weight: 900 })}`
  });
};

/* AFRIKAANS */
ART["afrikaans/opdragwoorde"] = () => {
  const cards = [
    ["NOEM / LYS", ["Net die feit.", "Geen rede nie."], "1 feit = 1 punt", C.blue],
    ["VERDUIDELIK", ["Hoe of waarom?", "Gebruik ‘omdat’."], "feit + rede", C.gold],
    ["BESPREEK", ["Meer as een kant", "of aspek."], "2+ punte", C.green],
    ["MOTIVEER", ["Gee ’n rede of", "bewys uit die teks."], "staaf dit", C.purple],
    ["VERGELYK", ["Ooreenkoms én", "verskil."], "albei kante", C.red],
    ["HAAL AAN", ["Presiese woorde", "in ‘aanhalings’."], "kopieer net", "#ffffff"]
  ];
  return frame({
    zone: "rooi",
    kicker: "Afrikaans HT · Eksamentegniek",
    title: "Opdragwoorde: wat wil hulle hê?",
    body: cards
      .map(([w, sub, tag, col], i) => {
        const x = 26 + (i % 3) * 254;
        const y = 92 + Math.floor(i / 3) * 206;
        return (
          R(x, y, 240, 192, { fill: C.panel, stroke: col, sw: 4 }) +
          T(x + 18, y + 46, w, { size: 27, fill: col, weight: 900 }) +
          T(x + 18, y + 86, sub, { size: 19, lh: 25 }) +
          pill(x + 18, y + 138, 204, 38, col, tag, { size: 18 })
        );
      })
      .join("")
  });
};

ART["afrikaans/indirekte-rede"] = () => {
  const rules = [
    ["1", ["Voeg ‘dat’ in — die werkwoord", "skuif na die einde"]],
    ["2", ["Voornaamwoorde: ek → hy/sy", "ons → hulle · my → sy"]],
    ["3", ["Verlede tyd: is → was", "sal → sou · kan → kon"]],
    ["4", ["hier → daar · nou → toe", "môre → die volgende dag"]]
  ];
  return frame({
    zone: "rooi",
    kicker: "Afrikaans HT · Taal",
    title: "Direkte → indirekte rede",
    body: `
    ${T(28, 112, "DIREK", { size: 16, fill: C.muted, ls: 2 })}
    ${R(24, 120, 752, 64, { fill: C.panel, stroke: C.line })}
    ${TC(44, 162, [["Pieter het gesê: “", C.text], ["Ek", C.blue], [" speel ", C.red], ["môre", C.gold], [" ", C.text], ["hier", C.green], [".”", C.text]], { size: 26 })}
    ${A(400, 192, 400, 222, C.gold, 5)}
    ${T(28, 236, "INDIREK", { size: 16, fill: C.muted, ls: 2 })}
    ${R(24, 244, 752, 64, { fill: C.panel, stroke: C.gold })}
    ${TC(44, 286, [["Pieter het gesê ", C.text], ["dat", C.purple], [" ", C.text], ["hy", C.blue], [" ", C.text], ["die volgende dag", C.gold], [" ", C.text], ["daar", C.green], [" ", C.text], ["sou speel", C.red], [".", C.text]], { size: 24 })}
    ${rules
      .map(([n, lines], i) => {
        const x = 24 + (i % 2) * 382;
        const y = 326 + Math.floor(i / 2) * 90;
        return R(x, y, 370, 80, { fill: C.bg2, stroke: C.line, sw: 2 }) + num(x + 30, y + 40, n, C.gold, 18) + T(x + 60, y + 34, lines, { size: 18, lh: 24 });
      })
      .join("")}`
  });
};

ART["afrikaans/lydende-vorm"] = () => {
  const block = (x, y, w, label, fill, tag, tcol = C.ink) =>
    R(x, y, w, 58, { fill, r: 10 }) +
    T(x + w / 2, y + 38, label, { size: 24, anchor: "middle", fill: tcol, weight: 900 }) +
    (tag ? T(x + w / 2, y + 84, tag, { size: 16, anchor: "middle", fill: C.muted, weight: 700 }) : "");
  return frame({
    zone: "rooi",
    kicker: "Afrikaans HT · Taal",
    title: "Bedrywend → lydend",
    body: `
    ${T(28, 112, "BEDRYWEND", { size: 16, fill: C.muted, ls: 2 })}
    ${block(120, 124, 200, "Die afrigter", C.blue, "onderwerp")}
    ${block(334, 124, 110, "roep", C.red, "werkwoord")}
    ${block(458, 124, 200, "die speler", C.gold, "voorwerp")}
    ${P("M558,214 C558,250 180,226 150,262", C.gold, 4)}
    ${T(28, 262, "LYDEND", { size: 16, fill: C.muted, ls: 2 })}
    ${block(30, 274, 170, "Die speler", C.gold, "voorwerp vorentoe")}
    ${block(212, 274, 100, "word", "#ffffff", "hulpww")}
    ${block(324, 274, 260, "deur die afrigter", C.blue, "deur + doener")}
    ${block(596, 274, 170, "geroep", C.red, "ge- + ww")}
    ${[
      ["NOU", "word … ge-ww", "Die speler word geroep."],
      ["VERLEDE", "is … ge-ww", "Die speler is geroep."],
      ["TOEKOMS", "sal … ge-ww word", "Hy sal geroep word."]
    ]
      .map(([h, f, ex], i) => {
        const x = 24 + i * 254;
        return (
          R(x, 384, 242, 116, { fill: C.panel, stroke: C.line, sw: 2 }) +
          T(x + 16, 414, h, { size: 17, fill: C.gold, ls: 1 }) +
          T(x + 16, 446, f, { size: 21 }) +
          T(x + 16, 480, ex, { size: 16, fill: C.muted, italic: true, weight: 600 })
        );
      })
      .join("")}`
  });
};

ART["afrikaans/formele-brief"] = () => {
  const bar = (x, y, w, col = "#9aa39a", h = 8) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${col}"/>`;
  const labL = (y, ty, lines) => L(236, y, 266, y, C.gold, 2) + T(228, ty, lines, { size: 17, anchor: "end", fill: C.gold, lh: 20 });
  const labR = (y, ty, lines) => L(534, y, 566, y, C.gold, 2) + T(574, ty, lines, { size: 17, fill: C.gold, lh: 20 });
  return frame({
    zone: "rooi",
    kicker: "Afrikaans HT · Transaksionele skryf",
    title: "Formele brief — uitleg",
    body: `
    ${R(250, 90, 300, 410, { fill: C.paper, r: 6 })}
    ${bar(440, 106, 90)}${bar(440, 120, 80)}${bar(440, 134, 70)}${bar(440, 154, 76, "#4c6b57")}
    ${bar(270, 180, 110)}${bar(270, 194, 96)}${bar(270, 208, 104)}
    ${T(270, 238, "Geagte mnr. Botha", { size: 14, fill: C.ink, weight: 700 })}
    ${T(270, 262, "AANSOEK OM DIE POS", { size: 13, fill: C.ink, weight: 900 })}<rect x="270" y="266" width="148" height="2" fill="${C.ink}"/>
    ${[288, 302, 316].map((y) => bar(270, y, y === 316 ? 160 : 260)).join("")}
    ${[338, 352, 366, 380].map((y) => bar(270, y, y === 380 ? 190 : 260)).join("")}
    ${[402, 416].map((y) => bar(270, y, y === 416 ? 120 : 260)).join("")}
    ${T(270, 446, "Die uwe", { size: 14, fill: C.ink, weight: 700 })}
    <path d="M272,470 q14,-18 26,0 t26,0 t26,-4" fill="none" stroke="${C.ink}" stroke-width="2.5"/>
    ${bar(270, 482, 110, "#4c6b57")}
    ${labR(124, 120, ["Jou adres", "(bo regs)"])}
    ${labR(158, 166, ["Datum"])}
    ${labL(194, 190, ["Ontvanger:", "titel + adres"])}
    ${labL(234, 238, ["Aanhef: Geagte …"])}
    ${labL(262, 268, ["Onderwerp: vet", "of onderstreep"])}
    ${labR(352, 334, ["Inleiding →", "liggaam → slot", "Formeel: ‘u’,", "geen sms-taal"])}
    ${labL(446, 442, ["Die uwe +", "handtekening +", "naam"])}`
  });
};

/* RTT */
ART["rtt/sigblad-funksies"] = () => {
  const cols = [
    ["", 44],
    ["A", 150],
    ["B", 100],
    ["C", 150]
  ];
  const rows = [
    ["1", "Naam", "Punt", "Uitslag"],
    ["2", "Thabo", "72", "Slaag"],
    ["3", "Anri", "45", "Druip"],
    ["4", "Sipho", "58", "Slaag"],
  ];
  let grid = "";
  const x0 = 24;
  const y0 = 142;
  const rh = 34;
  let x = x0;
  cols.forEach(([h, w], ci) => {
    grid += R(x, y0, w, rh, { fill: "#2a4a38", r: 0, stroke: "#5b7f6a", sw: 1 }) + T(x + w / 2, y0 + 23, h, { size: 16, anchor: "middle", fill: C.muted });
    rows.forEach((r, ri) => {
      const y = y0 + rh * (ri + 1);
      const isHdr = ci === 0;
      const active = ci === 3 && ri === 1;
      const fill = isHdr ? "#2a4a38" : ri === 0 ? "#dff0e6" : "#f7faf8";
      grid += R(x, y, w, rh, { fill: active ? "#fff4cc" : fill, r: 0, stroke: active ? C.gold : "#9fb7a8", sw: active ? 3 : 1 });
      const val = r[ci];
      const col = isHdr ? C.muted : val === "Slaag" ? "#0a7a43" : val === "Druip" ? "#c0392b" : C.ink;
      grid += T(isHdr ? x + w / 2 : x + 10, y + 23, val, { size: 17, anchor: isHdr ? "middle" : "start", fill: col, weight: ri === 0 ? 800 : 600 });
    });
    x += w;
  });
  const chips = [
    ["SUM", "tel op"],
    ["AVERAGE", "gemiddeld"],
    ["MAX / MIN", "grootste / kleinste"],
    ["COUNT", "tel getalle"],
    ["COUNTIF", "tel AS …"],
    ["SUMIF", "som AS …"],
    ["ROUND", "rond af"],
    ["VLOOKUP", "soek in tabel"]
  ];
  return frame({
    zone: "rooi",
    kicker: "RTT (CAT) · Sigblad",
    title: "Funksies wat altyd kom",
    body: `
    ${R(24, 94, 444, 38, { fill: "#f7faf8", r: 6, stroke: C.gold, sw: 2 })}
    ${T(36, 120, "fx", { size: 18, fill: "#6b7f72", italic: true })}
    ${T(70, 120, '=IF(B2>=50,"Slaag","Druip")', { size: 18, fill: C.ink, family: "Consolas, 'Courier New', monospace", weight: 700 })}
    ${grid}
    ${R(488, 94, 288, 222, { fill: C.panel, stroke: C.line })}
    ${T(506, 126, "IF in 3 dele", { size: 20, fill: C.gold })}
    ${pill(506, 140, 252, 46, C.blue, "toets: B2>=50", { size: 19 })}
    ${pill(506, 196, 252, 46, C.green, 'waar → "Slaag"', { size: 19 })}
    ${pill(506, 252, 252, 46, C.red, 'vals → "Druip"', { size: 19 })}
    ${chips
      .map(([f, s], i) => {
        const cx = 24 + (i % 4) * 190;
        const cy = 332 + Math.floor(i / 4) * 86;
        return R(cx, cy, 178, 76, { fill: C.bg2, stroke: C.line, sw: 2 }) + T(cx + 14, cy + 32, f, { size: 21, fill: C.gold, family: "Consolas, 'Courier New', monospace", weight: 800 }) + T(cx + 14, cy + 60, s, { size: 16, fill: C.muted, weight: 600 });
      })
      .join("")}`
  });
};

ART["rtt/absolute-verwysing"] = () => {
  const cols = [
    ["", 50],
    ["A", 150],
    ["B", 100],
    ["C", 250],
    ["D", 70],
    ["E", 130]
  ];
  const data = [
    ["1", "Item", "Prys", "Met BTW", "", "1,15"],
    ["2", "Pizza", "80", "=B2*$E$1", "", ""],
    ["3", "Koeldrank", "20", "=B3*$E$1", "", ""],
    ["4", "Koek", "35", "=B4*$E$1", "", ""]
  ];
  const mono = "Consolas, 'Courier New', monospace";
  let g = "";
  let x = 24;
  const y0 = 96;
  const rh = 40;
  cols.forEach(([h, w], ci) => {
    g += R(x, y0, w, 34, { fill: "#2a4a38", r: 0, stroke: "#5b7f6a", sw: 1 }) + T(x + w / 2, y0 + 23, h, { size: 16, anchor: "middle", fill: C.muted });
    data.forEach((r, ri) => {
      const y = y0 + 34 + rh * ri;
      const hdr = ci === 0;
      const isE1 = ci === 5 && ri === 0;
      g += R(x, y, w, rh, { fill: hdr ? "#2a4a38" : isE1 ? "#fff4cc" : "#f7faf8", r: 0, stroke: isE1 ? C.gold : "#9fb7a8", sw: isE1 ? 4 : 1 });
      const v = r[ci];
      if (ci === 3 && ri > 0) {
        g += TC(x + 12, y + 27, [["=", C.ink], [`B${ri + 1}`, "#0a6fb0", 900], ["*", C.ink], ["$E$1", "#b8860b", 900]], { size: 20, family: mono });
      } else {
        g += T(hdr ? x + w / 2 : x + 12, y + 27, v, { size: 19, anchor: hdr ? "middle" : "start", fill: hdr ? C.muted : C.ink, weight: ri === 0 ? 800 : 600 });
      }
    });
    x += w;
  });
  const lockX = 24 + 50 + 150 + 100 + 250 + 70 + 96;
  return frame({
    zone: "rooi",
    kicker: "RTT (CAT) · Sigblad",
    title: "Absolute verwysing: $ sluit vas",
    body: `
    ${g}
    <rect x="${lockX - 10}" y="140" width="22" height="18" rx="3" fill="#b8860b"/><path d="M${lockX - 5},140 v-6 a6,6 0 0 1 12,0 v6" fill="none" stroke="#b8860b" stroke-width="3"/>
    ${A(609, 178, 609, 274, C.gold, 6)}
    ${R(24, 312, 370, 88, { fill: C.panel, stroke: C.blue, sw: 3 })}
    ${TC(44, 346, [["B2", C.blue, 900], [" → B3 → B4", C.text]], { size: 24 })}
    ${T(44, 378, "Relatief: skuif saam as jy afsleep", { size: 18, fill: C.muted, weight: 600 })}
    ${R(406, 312, 370, 88, { fill: C.panel, stroke: C.gold, sw: 3 })}
    ${TC(426, 346, [["$E$1", C.gold, 900], [" bly $E$1", C.text]], { size: 24 })}
    ${T(426, 378, "Absoluut: gesluit, skuif nooit", { size: 18, fill: C.muted, weight: 600 })}
    ${R(24, 412, 370, 88, { fill: C.bg2, stroke: C.line, sw: 2 })}
    ${T(44, 446, "F4 = sit die $ in", { size: 24 })}
    ${T(44, 478, "druk weer: $A1 → A$1 → A1", { size: 18, fill: C.muted, weight: 600 })}
    ${R(406, 412, 370, 88, { fill: C.bg2, stroke: C.line, sw: 2 })}
    ${T(426, 446, "Gemeng", { size: 24 })}
    ${T(426, 478, "$A1 kolom vas · A$1 ry vas", { size: 18, fill: C.muted, weight: 600 })}`
  });
};

ART["rtt/databasis"] = () => {
  const table = (x, y, name, heads, widths, rows, keyCols, fkCol, hiRow) => {
    let s = T(x, y - 30, name, { size: 18, fill: C.gold, family: "Consolas, 'Courier New', monospace" });
    let cx = x;
    heads.forEach((h, i) => {
      const w = widths[i];
      s += R(cx, y, w, 38, { fill: i === fkCol ? C.purple : keyCols.includes(i) ? C.gold : "#2a4a38", r: 0, stroke: "#5b7f6a", sw: 1 });
      if (keyCols.includes(i) || i === fkCol) s += T(cx + w / 2, y - 4, keyCols.includes(i) ? "PK" : "FK", { size: 13, anchor: "middle", fill: keyCols.includes(i) ? C.gold : C.purple, weight: 900 });
      s += T(cx + 8, y + 26, h, { size: 15, fill: keyCols.includes(i) || i === fkCol ? C.ink : C.text, weight: 800 });
      rows.forEach((r, ri) => {
        const ry = y + 38 + ri * 34;
        s += R(cx, ry, w, 34, { fill: "#f7faf8", r: 0, stroke: "#9fb7a8", sw: 1 });
        s += T(cx + 8, ry + 23, r[i], { size: 16, fill: C.ink, weight: 600 });
      });
      cx += w;
    });
    if (hiRow != null) {
      const total = widths.reduce((a, b) => a + b, 0);
      s += R(x - 4, y + 38 + hiRow * 34 - 2, total + 8, 38, { fill: "none", stroke: C.gold, sw: 4, r: 4 });
    }
    return s;
  };
  return frame({
    zone: "rooi",
    kicker: "RTT (CAT) · Databasis",
    title: "Veld · rekord · sleutels",
    body: `
    ${table(24, 150, "tblLeerder", ["LeerderID", "Naam", "Graad"], [130, 120, 80], [["1", "Thabo", "12"], ["2", "Anri", "12"], ["3", "Sipho", "11"]], [0], -1, 1)}
    ${table(430, 150, "tblPunte", ["PuntID", "LeerderID", "Vak", "Punt"], [100, 110, 86, 50], [["7", "1", "RTT", "64"], ["8", "1", "WG", "71"], ["9", "2", "RTT", "58"]], [0], 1, null)}
    ${P("M154,148 C160,98 520,96 585,146", C.purple, 4)}
    ${T(168, 124, "1", { size: 24, fill: C.purple, weight: 900 })}${T(604, 122, "∞", { size: 28, fill: C.purple, weight: 900 })}
    ${A(340, 100, 290, 146, C.gold, 3)}${T(348, 104, "VELD = kolom", { size: 18, fill: C.gold })}
    ${T(24, 326, "↑ REKORD = een ry (een leerder)", { size: 18, fill: C.gold })}
    ${T(430, 326, ["Vreemde sleutel (pers) wys na", "die primêre sleutel (goud) → 1 : baie"], { size: 16, fill: C.purple, lh: 20 })}
    ${T(24, 384, "DATATIPES", { size: 16, fill: C.muted, ls: 2 })}
    ${["Teks", "Getal", "Datum/Tyd", "Ja/Nee", "Geldeenheid", "OutoNommer"]
      .map((t, i) => pill(24 + (i % 3) * 252, 396 + Math.floor(i / 3) * 54, 240, 44, i % 2 ? C.blue : C.green, t, { size: 19 }))
      .join("")}`
  });
};

ART["rtt/netwerke"] = () =>
  frame({
    zone: "rooi",
    kicker: "RTT (CAT) · Netwerke",
    title: "PAN · LAN · WAN",
    body: `
    ${Ci(250, 300, 200, { fill: "#0f3350", stroke: C.blue, sw: 4 })}
    ${Ci(250, 330, 132, { fill: "#145a3a", stroke: C.green, sw: 4 })}
    ${Ci(250, 372, 62, { fill: "#5a4512", stroke: C.gold, sw: 4 })}
    ${T(250, 140, "WAN", { size: 30, anchor: "middle", fill: C.blue, weight: 900 })}
    ${T(250, 232, "LAN", { size: 28, anchor: "middle", fill: C.green, weight: 900 })}
    ${T(250, 362, "PAN", { size: 24, anchor: "middle", fill: C.gold, weight: 900 })}
    <rect x="226" y="372" width="18" height="30" rx="4" fill="#fff"/><circle cx="268" cy="390" r="8" fill="#fff"/>
    ${[
      [158, 290],
      [318, 290],
      [158, 400],
      [330, 410]
    ]
      .map(([x, y]) => `<rect x="${x - 16}" y="${y - 12}" width="32" height="22" rx="3" fill="#dff7ea"/><rect x="${x - 6}" y="${y + 10}" width="12" height="6" fill="#dff7ea"/>`)
      .join("")}
    ${[
      [110, 180],
      [400, 190],
      [96, 420]
    ]
      .map(([x, y]) => Ci(x, y, 9, { fill: "#cfeeff" }))
      .join("")}
    ${R(476, 92, 300, 112, { fill: C.panel, stroke: C.gold })}
    ${T(494, 126, "PAN — persoonlik", { size: 21, fill: C.gold })}
    ${T(494, 156, ["Foon + oorfone, horlosie", "Bluetooth, ± 10 m"], { size: 17, weight: 600, lh: 22 })}
    ${R(476, 214, 300, 112, { fill: C.panel, stroke: C.green })}
    ${T(494, 248, "LAN — plaaslik", { size: 21, fill: C.green })}
    ${T(494, 278, ["Een gebou: skool / huis", "WLAN = draadloos (Wi-Fi)"], { size: 17, weight: 600, lh: 22 })}
    ${R(476, 336, 300, 112, { fill: C.panel, stroke: C.blue })}
    ${T(494, 370, "WAN — wyd", { size: 21, fill: C.blue })}
    ${T(494, 400, ["Stede / lande", "Internet = grootste WAN"], { size: 17, weight: 600, lh: 22 })}
    ${T(626, 486, "Deel: lêers · drukker · internet", { size: 17, anchor: "middle", fill: C.muted, weight: 700 })}`
  });

/* ENGELS */
ART["engels/peel"] = () => {
  const rows = [
    ["P", "Point", "Answer the question in 1 sentence.", "The speaker feels trapped.", C.gold],
    ["E", "Evidence", "Quote it — use “ ”.", "“the walls close in”", C.blue],
    ["E", "Explain", "HOW does the quote prove it?", "Walls = no escape → fear.", C.green],
    ["L", "Link", "Back to the question’s key word.", "So the poem’s tone is fearful.", C.red]
  ];
  return frame({
    zone: "geel",
    kicker: "English FAL · Literature",
    title: "PEEL paragraph = full marks",
    body: rows
      .map(([l, w, ins, ex, col], i) => {
        const y = 92 + i * 104;
        return (
          R(24, y, 752, 94, { fill: C.panel, stroke: col, sw: 3 }) +
          Ci(74, y + 47, 34, { fill: col }) +
          T(74, y + 61, l, { size: 40, anchor: "middle", fill: C.ink, weight: 900 }) +
          T(126, y + 40, w, { size: 26, fill: col, weight: 900 }) +
          T(126, y + 72, ins, { size: 18, weight: 600 }) +
          T(500, y + 56, ex, { size: 18, fill: C.muted, italic: true, weight: 600 })
        );
      })
      .join("")
  });
};

ART["engels/stylfigure"] = () => {
  const tiles = [
    ["SIMILE", "as brave as a lion", "uses like / as", C.gold],
    ["METAPHOR", "He is a lion.", "says it IS", C.blue],
    ["PERSONIFICATION", "The wind whispered.", "human action", C.green],
    ["HYPERBOLE", "I told you a million times!", "huge exaggeration", C.red],
    ["ALLITERATION", "Big bold Boks", "same first sound", C.purple],
    ["ONOMATOPOEIA", "BANG! sizzle, buzz", "word = sound", "#ffffff"]
  ];
  return frame({
    zone: "geel",
    kicker: "English FAL · Poetry & language",
    title: "Figures of speech: name + effect",
    body: tiles
      .map(([n, ex, tag, col], i) => {
        const x = 26 + (i % 3) * 254;
        const y = 92 + Math.floor(i / 3) * 206;
        return (
          R(x, y, 240, 192, { fill: C.panel, stroke: col, sw: 4 }) +
          T(x + 18, y + 42, n, { size: n.length > 12 ? 20 : 24, fill: col, weight: 900 }) +
          T(x + 18, y + 96, ex.length > 20 ? [ex.slice(0, ex.lastIndexOf(" ", 20)), ex.slice(ex.lastIndexOf(" ", 20) + 1)] : ex, { size: 20, italic: true, lh: 26 }) +
          pill(x + 18, y + 140, 204, 36, col, tag, { size: 17 })
        );
      })
      .join("")
  });
};

ART["engels/opstel-plan"] = () => {
  const mins = [
    ["1", "Pick type + topic", C.gold],
    ["2–3", "Mind-map 6 ideas", C.blue],
    ["4", "Order: 1-2-3", C.green],
    ["5", "Write a hook line", C.red]
  ];
  const parts = [
    ["Intro", "hook + topic", 120, C.gold],
    ["Body 1", "idea + example", 150, C.blue],
    ["Body 2", "idea + example", 150, C.blue],
    ["Body 3", "idea + example", 150, C.blue],
    ["End", "link to start", 120, C.green]
  ];
  let x = 24;
  const segs = mins.map(([m, t, col], i) => {
    const w = i === 1 ? 220 : 164;
    const s = R(x, 96, w, 120, { fill: C.panel, stroke: col, sw: 3 }) + T(x + 16, 132, `min ${m}`, { size: 18, fill: col, weight: 900 }) + T(x + 16, 176, t.split(" ").length > 2 ? [t.split(" ").slice(0, 2).join(" "), t.split(" ").slice(2).join(" ")] : t, { size: 20, lh: 24 });
    x += w + 12;
    return s;
  });
  let px = 24;
  const blocks = parts.map(([t, sub, w, col]) => {
    const s = R(px, 262, w + 4, 130, { fill: col, r: 10 }) + T(px + (w + 4) / 2, 314, t, { size: 23, anchor: "middle", fill: C.ink, weight: 900 }) + T(px + (w + 4) / 2, 346, sub.split(" + ").length > 1 ? [sub.split(" + ")[0] + " +", sub.split(" + ")[1]] : sub, { size: 15, anchor: "middle", fill: C.ink, weight: 700, lh: 18 });
    px += w + 4 + 8;
    return s;
  });
  return frame({
    zone: "geel",
    kicker: "English FAL · Writing",
    title: "5-minute plan before you write",
    body: `
    ${segs.join("")}
    ${T(24, 248, "ESSAY SHAPE", { size: 16, fill: C.muted, ls: 2 })}
    ${blocks.join("")}
    ${pill(24, 414, 360, 46, C.gold, "Essay: 250–300 words", { size: 20 })}
    ${pill(400, 414, 376, 46, C.blue, "Transactional: 120–150 words", { size: 20 })}
    ${T(400, 494, "Check the word count printed on YOUR paper.", { size: 17, anchor: "middle", fill: C.muted, weight: 700 })}`
  });
};

ART["engels/reported-speech"] = () => {
  const shifts = [
    ["am / is", "was"],
    ["are", "were"],
    ["will", "would"],
    ["can", "could"],
    ["do / does", "did"],
    ["did / have done", "had done"]
  ];
  const words = [
    ["today", "that day"],
    ["tomorrow", "the next day"],
    ["yesterday", "the day before"],
    ["here", "there"],
    ["now", "then"]
  ];
  return frame({
    zone: "geel",
    kicker: "English FAL · Language",
    title: "Reported speech: step back in time",
    body: `
    ${T(28, 110, "DIRECT", { size: 16, fill: C.muted, ls: 2 })}
    ${R(24, 118, 752, 58, { fill: C.panel, stroke: C.line })}
    ${TC(44, 156, [["She said, “", C.text], ["I", C.blue], [" ", C.text], ["am", C.red], [" tired ", C.text], ["today", C.gold], [".”", C.text]], { size: 26 })}
    ${A(400, 182, 400, 206, C.gold, 5)}
    ${T(28, 222, "REPORTED", { size: 16, fill: C.muted, ls: 2 })}
    ${R(24, 230, 752, 58, { fill: C.panel, stroke: C.gold })}
    ${TC(44, 268, [["She said (that) ", C.text], ["she", C.blue], [" ", C.text], ["was", C.red], [" tired ", C.text], ["that day", C.gold], [".", C.text]], { size: 26 })}
    ${shifts
      .map(([a, b], i) => {
        const y = 304 + i * 33;
        return T(44, y + 24, a, { size: 19, fill: C.red }) + T(220, y + 24, "→", { size: 19, fill: C.muted }) + T(254, y + 24, b, { size: 19, fill: C.text });
      })
      .join("")}
    ${R(24, 300, 380, 204, { fill: "none", stroke: C.red, sw: 2 })}
    ${R(420, 300, 356, 204, { fill: "none", stroke: C.gold, sw: 2 })}
    ${words
      .map(([a, b], i) => {
        const y = 306 + i * 39;
        return T(438, y + 26, a, { size: 19, fill: C.gold }) + T(560, y + 26, "→", { size: 19, fill: C.muted }) + T(592, y + 26, b, { size: 19 });
      })
      .join("")}`
  });
};

/* TOERISME */
ART["toerisme/wisselkoers"] = () =>
  frame({
    zone: "geel",
    kicker: "Toerisme · Buitelandse valuta",
    title: "Koop- en verkoopkoers",
    body: `
    ${R(130, 90, 540, 70, { fill: "#06120b", stroke: C.gold, sw: 3, r: 10 })}
    ${T(400, 112, "Bank se bord · USD $1 (voorbeeld)", { size: 15, fill: C.muted, weight: 700, anchor: "middle" })}
    ${T(150, 146, "KOOP R17,80", { size: 22, fill: C.green, family: "Consolas, 'Courier New', monospace", weight: 800 })}
    ${T(650, 146, "VERKOOP R18,60", { size: 22, fill: C.red, family: "Consolas, 'Courier New', monospace", weight: 800, anchor: "end" })}
    <path d="M340,220 L400,184 L460,220 Z" fill="${C.gold}"/>
    ${[350, 380, 410, 440].map((x) => `<rect x="${x}" y="226" width="12" height="72" fill="#e9efe9"/>`).join("")}
    <rect x="336" y="298" width="128" height="14" fill="${C.gold}"/>
    ${T(400, 340, "BANK", { size: 22, anchor: "middle", fill: C.gold, weight: 900 })}
    ${R(24, 184, 290, 222, { fill: C.panel, stroke: C.red, sw: 4 })}
    ${T(42, 218, "✈ VERTREK", { size: 22, fill: C.red, weight: 900 })}
    ${T(42, 250, ["Jy koop $ by die bank.", "Bank VERKOOP →", "gebruik verkoopkoers"], { size: 18, weight: 600, lh: 24 })}
    ${T(42, 352, "R → $ : DEEL", { size: 24, fill: C.red, weight: 900 })}
    ${T(42, 386, "R5 000 ÷ 18,60 = $268,82", { size: 18, fill: C.gold, weight: 800 })}
    ${R(486, 184, 290, 222, { fill: C.panel, stroke: C.green, sw: 4 })}
    ${T(504, 218, "⌂ TERUG", { size: 22, fill: C.green, weight: 900 })}
    ${T(504, 250, ["Jy verkoop $ aan die bank.", "Bank KOOP →", "gebruik koopkoers"], { size: 18, weight: 600, lh: 24 })}
    ${T(504, 352, "$ → R : MAAL", { size: 24, fill: C.green, weight: 900 })}
    ${T(504, 386, "$100 × 17,80 = R1 780", { size: 18, fill: C.gold, weight: 800 })}
    ${A(318, 260, 344, 260, C.red, 4)}${A(482, 260, 456, 260, C.green, 4)}
    ${R(24, 424, 752, 76, { fill: C.gold })}
    ${T(400, 458, "Altyd uit die BANK se oog: bank koop laag, verkoop hoog", { size: 21, anchor: "middle", fill: C.ink, weight: 900 })}
    ${T(400, 486, "Trek kommissie af as die vraag dit gee", { size: 17, anchor: "middle", fill: C.ink, weight: 700 })}`
  });

ART["toerisme/tydsones"] = () => {
  const x = (o) => 60 + (o + 5) * 45.33;
  const cities = [
    [-5, "New York", "GMT−5", "up"],
    [0, "Londen", "GMT 0", "down"],
    [2, "Johannesburg", "GMT+2", "up"],
    [4, "Dubai", "GMT+4", "down"],
    [9, "Tokio", "GMT+9", "up"],
    [10, "Sydney", "GMT+10", "down"]
  ];
  const ticks = [];
  for (let o = -5; o <= 10; o++) ticks.push(L(x(o), 224, x(o), 240, C.muted, 2));
  return frame({
    zone: "geel",
    kicker: "Toerisme · Kaartwerk",
    title: "Tydsones: oos tel by, wes trek af",
    body: `
    ${A(x(2) - 14, 118, x(-5) + 4, 118, C.red, 6)}${T(x(-5) + 10, 106, "WES = TREK AF", { size: 18, fill: C.red, weight: 900 })}
    ${A(x(2) + 14, 118, x(10) - 4, 118, C.green, 6)}${T(x(10) - 6, 106, "OOS = TEL BY", { size: 18, fill: C.green, weight: 900, anchor: "end" })}
    ${L(x(-5), 232, x(10), 232, C.text, 4)}${ticks.join("")}
    ${cities
      .map(([o, n, g, pos]) => {
        const cx = x(o);
        const sa = o === 2;
        const dot = Ci(cx, 232, sa ? 13 : 9, { fill: sa ? C.gold : C.blue, stroke: "#fff", sw: 2 });
        const anchor = o === -5 ? "start" : o === 10 ? "end" : "middle";
        const tx = o === -5 ? cx - 8 : o === 10 ? cx + 8 : cx;
        return pos === "up"
          ? dot + T(tx, 182, n, { size: sa ? 20 : 18, anchor, fill: sa ? C.gold : C.text, weight: 900 }) + T(tx, 204, g, { size: 15, anchor, fill: C.muted })
          : dot + T(tx, 270, n, { size: 18, anchor, weight: 900 }) + T(tx, 290, g, { size: 15, anchor, fill: C.muted });
      })
      .join("")}
    ${[
      ["SA 14:00 → Tokio", "+7 uur", "= 21:00", C.green],
      ["SA 14:00 → New York", "−7 uur", "= 07:00", C.red],
      ["Vlug JHB 20:00 + 11 h", "= 07:00 SA-tyd", "Londen: 05:00", C.gold]
    ]
      .map(([a, b, c, col], i) => {
        const cx = 24 + i * 254;
        return R(cx, 314, 242, 150, { fill: C.panel, stroke: col, sw: 3 }) + T(cx + 16, 350, a, { size: 18 }) + T(cx + 16, 390, b, { size: 22, fill: col, weight: 900 }) + T(cx + 16, 430, c, { size: 26, fill: C.text, weight: 900 });
      })
      .join("")}
    ${T(400, 496, "Somertyd (DST) kan 1 uur skuif — gebruik die tyd in die vraag.", { size: 16, anchor: "middle", fill: C.muted, weight: 700 })}`
  });
};

ART["toerisme/vraag-lees"] = () => {
  const mono = "Consolas, 'Courier New', monospace";
  const cw = 13.2;
  const x0 = 50;
  const lines = ["3.2 Noem TWEE redes waarom toeriste", "Kaapstad in Desember besoek,", "BEHALWE die weer."];
  const box = (li, start, len, col, shape = "rect") => {
    const x = x0 + start * cw - 6;
    const y = 150 + li * 42 - 30;
    const w = len * cw + 12;
    return shape === "ellipse"
      ? `<ellipse cx="${x + w / 2}" cy="${y + 19}" rx="${w / 2 + 6}" ry="22" fill="none" stroke="${col}" stroke-width="4"/>`
      : R(x, y, w, 40, { fill: "none", stroke: col, sw: 4, r: 6 });
  };
  return frame({
    zone: "geel",
    kicker: "Toerisme · Eksamentegniek",
    title: "Lees die vraag 2× — vang die strik",
    body: `
    ${R(24, 96, 752, 172, { fill: C.paper, r: 10 })}
    ${lines.map((l, i) => T(x0, 150 + i * 42, l, { size: 22, fill: C.ink, family: mono, weight: 700 })).join("")}
    ${box(0, 4, 4, "#1d6fd1")}
    ${box(0, 9, 4, "#b8860b")}
    ${box(2, 0, 7, "#d4472f", "ellipse")}
    ${T(700, 234, "(2)", { size: 22, fill: C.ink, family: mono, weight: 700 })}<ellipse cx="720" cy="226" rx="34" ry="22" fill="none" stroke="#0a8f5a" stroke-width="4"/>
    ${[
      ["1", "Omkring die opdragwoord", "Noem", C.blue],
      ["2", "Hoeveel? Tel dit", "TWEE", C.gold],
      ["3", "Rooi sirkel: strikwoorde", "NIE / BEHALWE", C.red],
      ["4", "Punte = aantal feite", "(2) = 2 feite", C.green]
    ]
      .map(([n, t, tag, col], i) => {
        const x = 24 + (i % 2) * 382;
        const y = 288 + Math.floor(i / 2) * 108;
        return R(x, y, 370, 96, { fill: C.panel, stroke: col, sw: 3 }) + num(x + 34, y + 48, n, col, 20) + T(x + 68, y + 40, t, { size: 19 }) + T(x + 68, y + 76, tag, { size: 22, fill: col, weight: 900 });
      })
      .join("")}`
  });
};

ART["toerisme/vermenigvuldiger"] = () =>
  frame({
    zone: "geel",
    kicker: "Toerisme · Ekonomie",
    title: "Die vermenigvuldiger-effek",
    body: `
    ${Ci(230, 300, 196, { fill: "#0d3a24", stroke: C.green, sw: 3, dash: "10 8" })}
    ${Ci(230, 300, 134, { fill: "#11492d", stroke: C.green, sw: 3, dash: "10 8" })}
    ${Ci(230, 300, 70, { fill: C.gold })}
    ${T(230, 294, "Toeris", { size: 20, anchor: "middle", fill: C.ink, weight: 900 })}
    ${T(230, 322, "R1 000", { size: 24, anchor: "middle", fill: C.ink, weight: 900 })}
    ${pill(150, 188, 160, 36, C.blue, "Hotel & gids", { size: 18 })}
    ${pill(110, 124, 240, 36, C.green, "Lone · boere · winkels", { size: 18 })}
    ${pill(130, 446, 200, 36, "#ffffff", "Meer werk + belasting", { size: 17 })}
    ${A(390, 214, 470, 166, C.green, 5)}${A(420, 316, 470, 316, C.red, 5)}
    ${R(476, 92, 300, 140, { fill: C.panel, stroke: C.green, sw: 3 })}
    ${T(494, 128, "Geld sirkuleer", { size: 22, fill: C.green, weight: 900 })}
    ${T(494, 160, ["Elke rand word weer en", "weer gespandeer → méér", "inkomste en werk."], { size: 17, weight: 600, lh: 22 })}
    ${R(476, 246, 300, 150, { fill: "#3a1712", stroke: C.red, sw: 3 })}
    ${T(494, 282, "LEKKASIE", { size: 22, fill: C.red, weight: 900 })}
    ${T(494, 314, ["Geld verlaat die land:", "ingevoerde goedere,", "buitelandse eienaars", "→ kleiner effek."], { size: 17, weight: 600, lh: 22 })}
    ${R(476, 410, 300, 90, { fill: C.gold })}
    ${T(494, 446, "Koop plaaslik", { size: 22, fill: C.ink, weight: 900 })}
    ${T(494, 476, "= groter effek", { size: 19, fill: C.ink, weight: 700 })}`
  });

/* WISKUNDIGE GELETTERDHEID */
ART["wiskgelett/rente"] = () => {
  const yv = (v) => 440 - (v - 9000) * 0.062;
  const data = [
    [0, 10000, 10000],
    [1, 11000, 11000],
    [2, 12000, 12100],
    [3, 13000, 13310]
  ];
  const bars = data
    .map(([n, s, c], i) => {
      const gx = 84 + i * 108;
      const fmt = (v) => "R" + String(v).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
      return (
        R(gx, yv(s), 40, 440 - yv(s), { fill: C.blue, r: 4 }) +
        R(gx + 44, yv(c), 40, 440 - yv(c), { fill: C.gold, r: 4 }) +
        (i === 3 ? T(gx + 40, yv(s) - 10, fmt(s), { size: 14, anchor: "end", fill: C.blue }) + T(gx + 64, yv(c) - 28, fmt(c), { size: 14, anchor: "middle", fill: C.gold }) : "") +
        T(gx + 42, 466, `jaar ${n}`, { size: 16, anchor: "middle", fill: C.muted })
      );
    })
    .join("");
  return frame({
    zone: "groen",
    kicker: "Wiskundige Geletterdheid · Finansies",
    title: "Enkelvoudige vs saamgestelde rente",
    body: `
    ${L(70, 440, 520, 440, C.text, 3)}${L(70, 120, 70, 440, C.text, 3)}
    ${[9000, 10000, 11000, 12000, 13000, 14000].map((v) => L(66, yv(v), 520, yv(v), "#24543a", 1) + T(62, yv(v) + 5, v === 9000 ? "≈" : `${v / 1000}k`, { size: 13, anchor: "end", fill: C.muted })).join("")}
    ${bars}
    ${T(84, 112, "P = R10 000 · i = 10% · n = 3", { size: 17, fill: C.text })}
    ${R(540, 92, 236, 190, { fill: C.panel, stroke: C.blue, sw: 3 })}
    ${T(558, 126, "ENKELVOUDIG", { size: 18, fill: C.blue, weight: 900 })}
    ${TC(558, 166, [["A = P(1 + i·n)", C.text]], { size: 22 })}
    ${T(558, 200, ["rente net op die", "beginbedrag"], { size: 16, fill: C.muted, weight: 600, lh: 20 })}
    ${T(558, 266, "R13 000", { size: 30, fill: C.blue, weight: 900 })}
    ${R(540, 296, 236, 204, { fill: C.panel, stroke: C.gold, sw: 3 })}
    ${T(558, 330, "SAAMGESTEL", { size: 18, fill: C.gold, weight: 900 })}
    ${TC(558, 370, [["A = P(1 + i)", C.text], ["ⁿ", C.gold]], { size: 22 })}
    ${T(558, 404, ["rente op rente —", "groei elke jaar meer"], { size: 16, fill: C.muted, weight: 600, lh: 20 })}
    ${T(558, 478, "R13 310", { size: 30, fill: C.gold, weight: 900 })}`
  });
};

ART["wiskgelett/data"] = () => {
  const vals = [3, 5, 5, 7, 8, 10, 12];
  const nx = (v) => 70 + v * 47;
  return frame({
    zone: "groen",
    kicker: "Wiskundige Geletterdheid · Datahantering",
    title: "Gemiddeld · mediaan · modus · omvang",
    body: `
    ${T(24, 108, "1. SORTEER EERS", { size: 16, fill: C.muted, ls: 2 })}
    ${vals
      .map((v, i) => {
        const x = 150 + i * 72;
        const col = i === 3 ? C.gold : v === 5 ? C.blue : "#e9efe9";
        return R(x, 118, 62, 62, { fill: col, r: 10 }) + T(x + 31, 160, String(v), { size: 30, anchor: "middle", fill: C.ink, weight: 900 });
      })
      .join("")}
    ${[
      ["Gemiddeld", "50 ÷ 7 = 7,14", "tel op ÷ aantal", "#e9efe9"],
      ["Mediaan", "7", "middelste getal", C.gold],
      ["Modus", "5", "kom meeste voor", C.blue],
      ["Omvang", "12 − 3 = 9", "grootste − kleinste", C.red]
    ]
      .map(([t, v, sub, col], i) => {
        const x = 24 + i * 190;
        return R(x, 196, 178, 108, { fill: C.panel, stroke: col, sw: 3 }) + T(x + 14, 224, t, { size: 18, fill: col, weight: 900 }) + T(x + 14, 260, v, { size: v.length > 6 ? 21 : 28, weight: 900 }) + T(x + 14, 290, sub, { size: 14, fill: C.muted, weight: 600 });
      })
      .join("")}
    ${T(24, 340, "MOND-EN-SNOR (BOX-AND-WHISKER)", { size: 16, fill: C.muted, ls: 2 })}
    ${L(nx(0), 450, nx(14), 450, C.text, 3)}
    ${Array.from({ length: 15 }, (_, v) => L(nx(v), 444, nx(v), 456, C.text, 2) + (v % 2 === 0 ? T(nx(v), 476, String(v), { size: 14, anchor: "middle", fill: C.muted }) : "")).join("")}
    ${L(nx(3), 400, nx(5), 400, C.text, 4)}${L(nx(10), 400, nx(12), 400, C.text, 4)}
    ${L(nx(3), 384, nx(3), 416, C.text, 4)}${L(nx(12), 384, nx(12), 416, C.text, 4)}
    ${R(nx(5), 370, nx(10) - nx(5), 60, { fill: "#1f5a8a", stroke: C.blue, sw: 3, r: 4 })}
    ${L(nx(7), 370, nx(7), 430, C.gold, 5)}
    ${T(nx(3), 366, "min 3", { size: 15, anchor: "middle" })}${T(nx(5), 362, "Q1 = 5", { size: 15, anchor: "middle", fill: C.blue })}
    ${T(nx(7), 362, "Q2 = 7", { size: 15, anchor: "middle", fill: C.gold })}${T(nx(10), 362, "Q3 = 10", { size: 15, anchor: "middle", fill: C.blue })}
    ${T(nx(12), 366, "maks 12", { size: 15, anchor: "middle" })}
    ${T(776, 412, ["IKO = Q3 − Q1", "= 10 − 5 = 5"], { size: 16, anchor: "end", fill: C.text, lh: 20 })}`
  });
};

ART["wiskgelett/skaal"] = () => {
  const cm = 80;
  const ax = 70;
  return frame({
    zone: "groen",
    kicker: "Wiskundige Geletterdheid · Kaarte & skale",
    title: "Skaal 1 : 50 000 — van kaart na km",
    body: `
    ${R(24, 92, 470, 240, { fill: "#d9e8c9", r: 10 })}
    <path d="M24,190 C120,150 200,240 300,200 S440,150 494,180" fill="none" stroke="#7fb3d5" stroke-width="16"/>
    <path d="M60,300 L180,120 M300,320 L420,110" stroke="#c9b48a" stroke-width="8" fill="none"/>
    ${L(ax, 160, ax + 4.2 * cm, 160, C.red, 4, "10 6")}
    ${Ci(ax, 160, 12, { fill: C.red, stroke: "#fff", sw: 3 })}${Ci(ax + 4.2 * cm, 160, 12, { fill: C.red, stroke: "#fff", sw: 3 })}
    ${T(ax, 140, "A", { size: 22, anchor: "middle", fill: C.ink, weight: 900 })}${T(ax + 4.2 * cm, 140, "B", { size: 22, anchor: "middle", fill: C.ink, weight: 900 })}
    <rect x="${ax - 10}" y="226" width="${4.2 * cm + 40}" height="50" fill="#fff4cc" stroke="#b8860b" stroke-width="2"/>
    ${[0, 1, 2, 3, 4].map((i) => L(ax + i * cm, 226, ax + i * cm, 250, C.ink, 2) + T(ax + i * cm, 268, String(i), { size: 14, anchor: "middle", fill: C.ink })).join("")}
    ${Array.from({ length: 42 }, (_, i) => (i % 10 === 0 ? "" : L(ax + i * (cm / 10), 226, ax + i * (cm / 10), 236, C.ink, 1))).join("")}
    ${L(ax + 4.2 * cm, 214, ax + 4.2 * cm, 262, C.red, 3)}${T(ax + 4.2 * cm + 8, 216, "4,2 cm", { size: 16, fill: C.red })}
    ${T(44, 316, "1 : 50 000", { size: 22, fill: C.ink, weight: 900 })}
    ${R(204, 300, 80, 12, { fill: C.ink, r: 0 })}${R(284, 300, 80, 12, { fill: "#fff", r: 0, stroke: C.ink, sw: 2 })}
    ${T(204, 326, "0", { size: 13, fill: C.ink, anchor: "middle" })}${T(284, 326, "0,5", { size: 13, fill: C.ink, anchor: "middle" })}${T(364, 326, "1 km", { size: 13, fill: C.ink, anchor: "middle" })}
    ${[
      ["1 cm = 50 000 cm werklik", C.muted],
      ["4,2 × 50 000 = 210 000 cm", C.text],
      ["÷ 100 = 2 100 m", C.text],
      ["÷ 1 000 = 2,1 km", C.gold]
    ]
      .map(([t, col], i) => num(530, 120 + i * 58, i + 1, i === 3 ? C.gold : C.green, 18) + T(558, 127 + i * 58, t, { size: i === 0 ? 16 : 19, fill: col, weight: 800 }))
      .join("")}
    ${T(24, 372, "OMSKAKEL", { size: 16, fill: C.muted, ls: 2 })}
    ${[
      ["km", C.gold],
      ["m", C.green],
      ["cm", C.blue],
      ["mm", C.purple]
    ]
      .map(([u, col], i) => pill(40 + i * 196, 392, 120, 54, col, u, { size: 26 }))
      .join("")}
    ${[
      ["× 1 000", "÷ 1 000"],
      ["× 100", "÷ 100"],
      ["× 10", "÷ 10"]
    ]
      .map(([m, d], i) => {
        const x = 164 + i * 196;
        return A(x, 406, x + 68, 406, C.text, 3) + T(x + 34, 398, m, { size: 14, anchor: "middle", fill: C.text }) + A(x + 68, 434, x, 434, C.muted, 3) + T(x + 34, 458, d, { size: 14, anchor: "middle", fill: C.muted });
      })
      .join("")}
    ${T(400, 494, "Groot → klein eenheid: MAAL · klein → groot: DEEL", { size: 18, anchor: "middle", fill: C.gold, weight: 800 })}`
  });
};

ART["wiskgelett/area-volume"] = () => {
  const tiles = [
    ["Reghoek", "A = l × b", "", (x, y) => R(x + 60, y + 30, 120, 70, { fill: "none", stroke: C.blue, sw: 5, r: 2 })],
    ["Driehoek", "A = ½ × b × h", "", (x, y) => `<path d="M${x + 60},${y + 100} L${x + 180},${y + 100} L${x + 100},${y + 26} Z" fill="none" stroke="${C.green}" stroke-width="5"/>` + L(x + 100, y + 26, x + 100, y + 100, C.green, 2, "5 4")],
    ["Sirkel", "A = π × r²", "omtrek = 2 × π × r", (x, y) => Ci(x + 120, y + 64, 40, { fill: "none", stroke: C.gold, sw: 5 }) + L(x + 120, y + 64, x + 160, y + 64, C.gold, 3) + T(x + 140, y + 58, "r", { size: 16, anchor: "middle", fill: C.gold })],
    ["Reghoekige prisma", "V = l × b × h", "", (x, y) => `<path d="M${x + 70},${y + 50} h90 v56 h-90 z M${x + 70},${y + 50} l26,-24 h90 l-26,24 M${x + 160},${y + 106} l26,-24 v-56" fill="none" stroke="${C.purple}" stroke-width="4"/>`],
    ["Silinder", "V = π × r² × h", "", (x, y) => `<ellipse cx="${x + 120}" cy="${y + 30}" rx="40" ry="12" fill="none" stroke="${C.red}" stroke-width="4"/><path d="M${x + 80},${y + 30} v66 a40,12 0 0 0 80,0 v-66" fill="none" stroke="${C.red}" stroke-width="4"/>`],
    ["Eenhede", "1 cm³ = 1 mℓ", "1 000 cm³ = 1 ℓ · 1 m³ = 1 000 ℓ", (x, y) => T(x + 120, y + 84, "π = 3,142", { size: 30, anchor: "middle", fill: C.gold, weight: 900 })]
  ];
  return frame({
    zone: "groen",
    kicker: "Wiskundige Geletterdheid · Meting",
    title: "Area & volume — formule-muur",
    body: tiles
      .map(([n, f, sub, draw], i) => {
        const x = 26 + (i % 3) * 254;
        const y = 92 + Math.floor(i / 3) * 206;
        return R(x, y, 240, 194, { fill: C.panel, stroke: C.line, sw: 2 }) + draw(x, y + 6) + T(x + 18, y + 26, n, { size: 16, fill: C.muted, weight: 800 }) + T(x + 120, y + 146, f, { size: 24, anchor: "middle", weight: 900 }) + (sub ? T(x + 120, y + 176, sub, { size: sub.length > 22 ? 13 : 15, anchor: "middle", fill: C.muted, weight: 700 }) : "");
      })
      .join("")
  });
};

ART["wiskgelett/btw"] = () =>
  frame({
    zone: "groen",
    kicker: "Wiskundige Geletterdheid · Finansies",
    title: "BTW 15%: maal of deel deur 1,15",
    body: `
    ${R(40, 120, 250, 150, { fill: C.panel, stroke: C.blue, sw: 4 })}
    ${T(165, 160, "SONDER BTW", { size: 20, anchor: "middle", fill: C.blue, weight: 900 })}
    ${T(165, 192, "(excl)", { size: 16, anchor: "middle", fill: C.muted })}
    ${T(165, 246, "R300", { size: 44, anchor: "middle", weight: 900 })}
    ${R(510, 120, 250, 150, { fill: C.panel, stroke: C.gold, sw: 4 })}
    ${T(635, 160, "MET BTW", { size: 20, anchor: "middle", fill: C.gold, weight: 900 })}
    ${T(635, 192, "(incl)", { size: 16, anchor: "middle", fill: C.muted })}
    ${T(635, 246, "R345", { size: 44, anchor: "middle", weight: 900 })}
    ${A(300, 160, 498, 160, C.green, 6)}${T(400, 146, "× 1,15", { size: 26, anchor: "middle", fill: C.green, weight: 900 })}
    ${A(498, 236, 300, 236, C.green, 6)}${T(400, 270, "÷ 1,15", { size: 26, anchor: "middle", fill: C.green, weight: 900 })}
    ${T(400, 324, "BTW-bedrag = R345 − R300 = R45", { size: 24, anchor: "middle", fill: C.text, weight: 900 })}
    ${R(40, 350, 720, 140, { fill: "#3a1712", stroke: C.red, sw: 4 })}
    ${T(64, 392, "✗ STRIK", { size: 24, fill: C.red, weight: 900 })}
    ${T(64, 430, "R345 × 0,85 = R293,25  ← VERKEERD", { size: 24, fill: C.text, weight: 900 })}
    ${T(64, 466, "15% van R345 is nie 15% van R300 nie. Haal BTW af: ÷ 1,15.", { size: 18, fill: C.muted, weight: 700 })}`
  });

/* FOUTBANK / SLOT */
ART["foutbank/herhaal-lus"] = () => {
  const node = (cx, cy, n, t, sub, col) => R(cx - 112, cy - 42, 224, 84, { fill: C.panel, stroke: col, sw: 4 }) + num(cx - 82, cy, n, col, 20) + T(cx - 54, cy - 4, t, { size: 21, fill: col, weight: 900 }) + T(cx - 54, cy + 24, sub, { size: 15, fill: C.muted, weight: 600 });
  return frame({
    zone: "slot",
    kicker: "Foutbank · Leerwetenskap",
    title: "Die toets-lus wat punte wen",
    body: `
    ${node(400, 136, 1, "TOE-BOEK", "skryf wat jy onthou", C.gold)}
    ${node(652, 300, 2, "MEMO", "merk met rooi pen", C.red)}
    ${node(400, 456, 3, "FOUTBANK", "1 sin: wat + hoekom", C.blue)}
    ${node(148, 300, 4, "HERTOETS", "môre, weer toe-boek", C.green)}
    ${P("M514,136 Q652,136 652,252", C.gold, 5)}
    ${P("M652,346 Q652,456 516,456", C.red, 5)}
    ${P("M284,456 Q148,456 148,348", C.blue, 5)}
    ${P("M148,252 Q148,136 284,136", C.green, 5)}
    ${T(400, 290, "Elke fout =", { size: 24, anchor: "middle", fill: C.text })}
    ${T(400, 324, "’n punt wat jy", { size: 24, anchor: "middle", fill: C.text })}
    ${T(400, 358, "NOG kan kry", { size: 28, anchor: "middle", fill: C.gold, weight: 900 })}`
  });
};

ART["foutbank/spasieer"] = () => {
  const gx = (d) => 80 + d * 92;
  const gy = (p) => 430 - p * 2.9;
  const decay = (d0, d1, from, to) => {
    const mx = (gx(d0) + gx(d1)) / 2;
    return `M${gx(d0)},${gy(from)} Q${gx(d0) + 18},${gy(to)} ${gx(d1)},${gy(to)}`;
  };
  return frame({
    zone: "slot",
    kicker: "Foutbank · Leerwetenskap",
    title: "Spasieer: herhaal net voor jy vergeet",
    body: `
    ${L(80, 430, 744, 430, C.text, 3)}${L(80, 130, 80, 430, C.text, 3)}
    ${T(70, 140, "100%", { size: 14, anchor: "end", fill: C.muted })}${T(70, 434, "0%", { size: 14, anchor: "end", fill: C.muted })}
    ${[0, 1, 2, 3, 4, 5, 6, 7].map((d) => T(gx(d), 456, `dag ${d}`, { size: 15, anchor: "middle", fill: C.muted })).join("")}
    ${P(`M${gx(0)},${gy(100)} Q${gx(0) + 30},${gy(20)} ${gx(7)},${gy(8)}`, C.red, 4, false, "10 8")}
    ${T(gx(4), gy(4) - 10, "maraton een keer → vergeet", { size: 16, anchor: "middle", fill: C.red })}
    ${P(decay(0, 1, 100, 45), C.green, 5, false)}
    ${L(gx(1), gy(45), gx(1), gy(100), C.green, 5)}
    ${P(decay(1, 3, 100, 62), C.green, 5, false)}
    ${L(gx(3), gy(62), gx(3), gy(100), C.green, 5)}
    ${P(decay(3, 7, 100, 82), C.green, 5, false)}
    ${[1, 3].map((d) => Ci(gx(d), gy(100), 10, { fill: C.gold, stroke: "#fff", sw: 2 })).join("")}
    ${Ci(gx(0), gy(100), 10, { fill: C.gold, stroke: "#fff", sw: 2 })}
    ${T(gx(0) + 14, gy(100) - 14, "leer", { size: 16, fill: C.gold })}
    ${T(gx(1), gy(100) - 16, "hertoets", { size: 16, anchor: "middle", fill: C.gold })}
    ${T(gx(3), gy(100) - 16, "hertoets", { size: 16, anchor: "middle", fill: C.gold })}
    ${T(gx(7) - 4, gy(82) - 14, "onthou!", { size: 18, anchor: "end", fill: C.green, weight: 900 })}
    ${R(24, 470, 752, 40, { fill: C.gold, r: 10 })}
    ${T(400, 497, "Fout vandag → hertoets môre → weer oor 3 dae", { size: 20, anchor: "middle", fill: C.ink, weight: 900 })}`
  });
};

ART["foutbank/top3"] = () =>
  frame({
    zone: "slot",
    kicker: "Slot · Môre se plan",
    title: "Môre se TOP-3 (op papier)",
    body: `
    ${R(150, 96, 500, 404, { fill: C.paper, r: 12 })}
    <rect x="330" y="84" width="140" height="30" rx="8" fill="#9aa39a"/>
    ${T(400, 156, "MÔRE SE TOP-3", { size: 30, anchor: "middle", fill: C.ink, weight: 900 })}
    ${[0, 1, 2]
      .map((i) => num(196, 214 + i * 64, i + 1, [C.red, "#d08b16", "#0a8f5a"][i], 20, "#fff") + L(228, 224 + i * 64, 610, 224 + i * 64, "#9aa39a", 2))
      .join("")}
    ${T(184, 418, "Eerste blok:", { size: 20, fill: C.ink, weight: 800 })}${L(318, 420, 470, 420, "#9aa39a", 2)}${T(480, 418, "om", { size: 20, fill: C.ink, weight: 800 })}${L(518, 420, 610, 420, "#9aa39a", 2)}
    ${T(400, 470, "Kies die 3 foute wat die MEESTE punte kos.", { size: 17, anchor: "middle", fill: "#4c6b57", weight: 800 })}
    ${T(24, 140, ["Sit dit", "langs die", "skoot-", "rekenaar."], { size: 18, fill: C.gold, weight: 800, lh: 23 })}
    ${T(776, 140, ["Rassie", "kies die", "span", "vooraf."], { size: 18, fill: C.gold, weight: 800, lh: 23, anchor: "end" })}`
  });

/* ---------- Skryf ---------- */
const COVERS = {
  gasvryheid: "Begrip eers — konsep → toepassing",
  afrikaans: "Opdragwoorde + taal = maklike punte",
  rtt: "Sigblad, databasis, netwerke",
  engels: "Literature + writing = 70%",
  toerisme: "Lees die vraag. Bereken reg.",
  wiskgelett: "Daagliks. Teiken 80%.",
  foutbank: "Foutbank + môre se top-3"
};

function write(rel, content) {
  const file = path.join(outDir, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  return rel;
}

const written = [];
for (const [key, fn] of Object.entries(ART)) written.push(write(`${key}.svg`, fn()));

for (const [slug, motto] of Object.entries(COVERS)) {
  const s = SUBJECTS.find((x) => x.slug === slug);
  const count = Object.keys(ART).filter((k) => k.startsWith(slug + "/")).length;
  written.push(
    write(
      `${slug}/cover.svg`,
      cover(slug, {
        naam: s ? s.naam : "Foutlog & slot",
        zone: s ? s.zone : "slot",
        motto,
        lessCount: count,
        prelim: s?.prelim,
        teiken: s?.teiken
      })
    )
  );
}
written.push(write("ui/trui-15.svg", jersey()));

console.log(`Geskryf: ${written.length} SVG-lêers onder assets/img/lessons/`);
