/* Daaglikse plan — Sondag 27 Sep 2026 het rugby-venster */
window.WALLIE = window.WALLIE || {};

/** Dae sedert 27 Sep 2026 — vir geel-rotasie (Engels / Toerisme). */
WALLIE.geelDayIndex = function geelDayIndex(dateStr) {
  const epoch = Date.parse("2026-09-27T00:00:00");
  const day = Date.parse(dateStr + "T00:00:00");
  return Math.round((day - epoch) / 86400000);
};

WALLIE.buildDayPlan = function buildDayPlan(dateStr) {
  const byPri = [...WALLIE.SUBJECTS].sort((a, b) => a.prioriteit - b.prioriteit);
  const rooi = byPri.filter((s) => s.zone === "rooi");
  const geel = byPri.filter((s) => s.zone === "geel");
  const groen = byPri.find((s) => s.slug === "wiskgelett");
  /* Die dagplan skakel oor na eksamen-rotasie op 13 Okt (RTT/CAT-praktiese). Voor dit is die geel-blok
     ’n RTT V1-oefenblok (Oefenvrae). */
  const beforeKickoff = dateStr < WALLIE.EXAM_PERIOD_START;
  const geelSlot = beforeKickoff
    ? null
    : geel[((WALLIE.geelDayIndex(dateStr) % geel.length) + geel.length) % geel.length];

  /* Geel-blok: voor 13 Okt 'n RTT V1-oefenblok (kind "rooi", dieselfde id), daarna die geel-rotasie. */
  const geelBlock = (minutes, geelTitle, extra) =>
    geelSlot
      ? { id: `${dateStr}-geel`, kind: "geel", subjectSlug: geelSlot.slug, minutes, ...extra, title: geelTitle(geelSlot), detail: geelSlot.fokus }
      : {
          id: `${dateStr}-geel`,
          kind: "rooi",
          subjectSlug: "rtt",
          minutes,
          ...extra,
          title: "RTT V1 — praktiese oefening (Oefenvrae)",
          detail: "Kies 'n oefenvraag in Oefenvrae (RTT V1) en doen dit in Excel, Word of Access."
        };

  /* Plan v4 (Hanno, 11 Okt): So 11 en Ma 12 Okt is RTT V1-fokusdae voor die praktiese eksamen (Di 13 Okt).
     Geen Wiskundige Geletterdheid, Gasvryheid, Afrikaans of Toerisme op hierdie twee dae nie.
     Elke werk-blok sê PRESIES watter amptelike DBE-vraestel en watter vrae: `werk` (en `werk_ekstra`)
     verwys na assets/js/dbe-vraestelle.js, sodat die sessieskerm die vraestel, datalêers en memo kan oopmaak.
       werk: { tipe: "vraestel", id }            → volledige vraestel
       werk: { tipe: "vrae", id, nrs: [...] }    → net dié vrae ("5" of "5.2")
     `soort`: "toets" (getimed, memo bly toe tot die tyd om is) · "merk" / "herdoen" (memo dadelik oop) ·
              "les" · "opstel" · "pouse".
     Engels V3 was die enigste nie-RTT-blok wat nie met die nuwe blokke oorvleuel nie: op 11 Okt skuif dit
     na die naaste vrye venster (17:00 → 10:15); op 12 Okt val dit weg (Hanno, 11 Okt) — die dag voor die
     praktiese eksamen is heeltemal RTT.
     Wo 14 herplan (13 Okt aand): Di 13 se Engels het verval; B1, V3-kaart en opstelplan na Wo 14 geskuif, A1 laat val. */
  const VASTE_PLANNE = {
    "2026-10-11": [
      { suffix: "engels", kind: "geel", slug: "engels", start: "10:15", end: "10:45", soort: "les",
        title: "Engels V3 — lees DBE Nov 2025 EAT V3 en die rubrieke",
        detail: "Lees die vraestel en rubrieke; let op wat elke teksoort vra." },
      { suffix: "opstel", start: "10:45", end: "11:00", soort: "opstel",
        title: "Opstel: lêers en rekenaar",
        detail: "Laai die 4 datalêers af (skakels in die tabel). Hardloop elke .exe op Windows; die wagwoord staan op bladsy 1–2 van die vraestel. Maak 'n gids WALLIE-OEFEN met een subgids per vraestel. Maak 'n Foutlog-blad (papier): kolomme Vraestel | Vraag | Wat ek gedoen het | Wat die memo wil hê | Reël.",
        werk_ekstra: [
          { tipe: "vraestel", id: "dbe-2026-jun-v1" },
          { tipe: "vraestel", id: "dbe-2025-nov-v1" },
          { tipe: "vraestel", id: "dbe-2024-nov-v1" },
          { tipe: "vraestel", id: "dbe-2025-jun-v1" }
        ] },
      { suffix: "diagnose", start: "11:00", end: "11:20", soort: "toets", punte: 18,
        title: "Diagnose (20 min, getimed)",
        detail: "Jun 2025 V6.1 (HTML, 10 punte: 6.1.1–6.1.6) + V5.1 (databasis-veldeienskappe, 8 punte: 5.1.1–5.1.4). Geen hulp, geen memo. Doel: wys waar hy staan.",
        werk: { tipe: "vrae", id: "dbe-2025-jun-v1", nrs: ["6.1", "5.1"] } },
      { suffix: "merk-diagnose", start: "11:20", end: "11:35", soort: "merk",
        title: "Merk diagnose met memo + foutlog",
        detail: "Pa of Wallie merk punt-vir-punt met die Jun 2025-memo. Elke punt wat verloor is, gaan in die foutlog. Telling: ≥12/18 = begin by Kaart 3 (sigblad); <12 = bly by Kaart 1 en 2.",
        werk: { tipe: "vrae", id: "dbe-2025-jun-v1", nrs: ["6.1", "5.1"] } },
      { suffix: "kaart12", start: "11:35", end: "11:55", soort: "les",
        title: "Les: Punte-kaart 1 (Databasis) + 2 (HTML)",
        detail: "Lees elke kaart. Bedek dan die voorbeelde en skryf hulle uit die kop neer (herroeping). Kyk na. Herhaal die wat verkeerd was." },
      { suffix: "jun-v5", start: "11:55", end: "12:40", soort: "toets", punte: 35,
        title: "Jun 2026 V5 Databasis (35 punte, 42 min)",
        detail: "Getimed. Volgorde: 5.1.1–5.1.5 (veldeienskappe, toevoermasker, valideringsreël) eerste, dan navrae 5.3–5.5, dan verslag 5.6, vorm 5.2 laaste. Stoor ná elke subvraag.",
        werk: { tipe: "vrae", id: "dbe-2026-jun-v1", nrs: [5] } },
      { suffix: "merk-jun-v5", start: "12:40", end: "13:00", soort: "merk",
        title: "Merk V5 met memo + foutlog",
        detail: "Merk elke ✓ apart. Skryf die 'Verwagte rekords'-getal by elke navraag neer en vergelyk.",
        werk: { tipe: "vrae", id: "dbe-2026-jun-v1", nrs: [5] } },
      { suffix: "middag", kind: "break", slug: "break", start: "13:00", end: "13:40", soort: "pouse",
        title: "Middagete + stap buite", detail: "Geen skerm." },
      { suffix: "herdoen-jun-v5", start: "13:40", end: "14:00", soort: "herdoen",
        title: "Herdoen V5-foute",
        detail: "Doen net die subvrae wat punte verloor het weer, sonder om na die memo te kyk. Dan kyk.",
        werk: { tipe: "vrae", id: "dbe-2026-jun-v1", nrs: [5] } },
      { suffix: "jun-v6", start: "14:00", end: "14:18", soort: "toets", punte: 15,
        title: "Jun 2026 V6 HTML (15 punte, 18 min)",
        detail: "Getimed. Teksredigeerder (Notepad/Notepad++), nie Word nie. Stoor, herlaai in die blaaier, kyk.",
        werk: { tipe: "vrae", id: "dbe-2026-jun-v1", nrs: [6] } },
      { suffix: "merk-jun-v6", start: "14:18", end: "14:30", soort: "merk",
        title: "Merk V6 + foutlog", detail: "Merk met die memo. Herdoen foute dadelik.",
        werk: { tipe: "vrae", id: "dbe-2026-jun-v1", nrs: [6] } },
      { suffix: "pouse1", kind: "break", slug: "break", start: "14:30", end: "14:45", soort: "pouse",
        title: "Pouse", detail: "Water, beweeg." },
      { suffix: "kaart3", start: "14:45", end: "15:00", soort: "les",
        title: "Les: Punte-kaart 3 (Sigblad)",
        detail: "Lees; bedek; skryf die 10 funksies met hul memo-vorm uit die kop neer." },
      { suffix: "jun-v34", start: "15:00", end: "15:50", soort: "toets", punte: 41,
        title: "Jun 2026 V3 + V4 Sigblad (41 punte, 50 min)",
        detail: "Getimed. Eers al die 1–2-punt-items (3.1, 3.2, 3.3, 4.1, 4.2, 4.3), dan die groter items. Skryf altyd iets in die sel: deelpunte tel.",
        werk: { tipe: "vrae", id: "dbe-2026-jun-v1", nrs: [3, 4] } },
      { suffix: "merk-jun-v34", start: "15:50", end: "16:10", soort: "merk",
        title: "Merk V3+V4 + foutlog", detail: "Let op: elke deel van die formule kry sy eie punt.",
        werk: { tipe: "vrae", id: "dbe-2026-jun-v1", nrs: [3, 4] } },
      { suffix: "pouse2", kind: "break", slug: "break", start: "16:10", end: "16:25", soort: "pouse",
        title: "Pouse", detail: "" },
      { suffix: "kaart4", start: "16:25", end: "16:40", soort: "les",
        title: "Les: Punte-kaart 4 (Woordverwerking)",
        detail: "Lees; bedek; skryf die roetine-lys uit die kop neer." },
      { suffix: "jun-v12", start: "16:40", end: "17:35", soort: "toets", punte: 45,
        title: "Jun 2026 V1 + V2 Woordverwerking (45 punte, 55 min)",
        detail: "Getimed. Eksamennommer in die bladsyboskrif eerste. Doen eers die vinnige roetine-items (eienskappe, onderskrif, watermerk, soek-en-vervang).",
        werk: { tipe: "vrae", id: "dbe-2026-jun-v1", nrs: [1, 2] } },
      { suffix: "merk-jun-v12", start: "17:35", end: "17:55", soort: "merk",
        title: "Merk V1+V2 + foutlog", detail: "",
        werk: { tipe: "vrae", id: "dbe-2026-jun-v1", nrs: [1, 2] } },
      { suffix: "aandete", kind: "break", slug: "break", start: "17:55", end: "18:45", soort: "pouse",
        title: "Aandete + rus", detail: "Geen skerm." },
      { suffix: "nov25-v5", start: "18:45", end: "19:25", soort: "toets", punte: 35,
        title: "Nov 2025 V5 Databasis (35 punte, 40 min)",
        detail: "Tweede databasis, nuwe lêer (vervleg: dieselfde vaardighede, ander konteks). Gebruik die foutlog-reëls.",
        werk: { tipe: "vrae", id: "dbe-2025-nov-v1", nrs: [5] } },
      { suffix: "merk-nov25-v5", start: "19:25", end: "19:45", soort: "merk",
        title: "Merk Nov 2025 V5 + foutlog", detail: "Vergelyk met vanmiddag se telling.",
        werk: { tipe: "vrae", id: "dbe-2025-nov-v1", nrs: [5] } },
      { suffix: "kaart5", start: "19:45", end: "20:00", soort: "les",
        title: "Herroeping + Punte-kaart 5 (Eksamentegniek)",
        detail: "Lees die foutlog hardop. Lees Kaart 5. Klaar, skerm af om 21:00, slaap teen 22:00." }
    ],
    "2026-10-12": [
      { suffix: "herroep", start: "08:00", end: "08:15", soort: "les",
        title: "Herroeping op leë papier",
        detail: "Skryf uit die kop: toevoermasker-simbole, Between…And, Like \"*\", Group By/Sum, 6 HTML-merkers, 8 sigbladfunksies. Kyk teen die kaarte." },
      { suffix: "proef-nov24", start: "08:15", end: "11:15", soort: "toets", punte: 150,
        title: "Volledige proef: Nov 2024 V1 (150 punte, 3 uur)",
        detail: "Eksamentoestande. Volgorde soos Kaart 5: V6 → V5 → V1 → V2 → V3 → V4 → V7. Stoor gereeld. Geen foon.",
        werk: { tipe: "vraestel", id: "dbe-2024-nov-v1" } },
      { suffix: "pouse1", kind: "break", slug: "break", start: "11:15", end: "11:30", soort: "pouse",
        title: "Pouse", detail: "" },
      { suffix: "merk-proef", start: "11:30", end: "12:30", soort: "merk",
        title: "Merk Nov 2024 met memo + foutlog",
        detail: "Tel punte per vraag. Merk in die foutlog die 3 kategorieë wat die meeste punte gekos het.",
        werk: { tipe: "vraestel", id: "dbe-2024-nov-v1" } },
      { suffix: "middag", kind: "break", slug: "break", start: "12:30", end: "13:15", soort: "pouse",
        title: "Middagete + stap", detail: "" },
      { suffix: "herdoen-proef", start: "13:15", end: "13:45", soort: "herdoen",
        title: "Herdoen die top-3 foute van die proef",
        detail: "Net die subvrae wat punte verloor het, weer in die Nov 2024-lêers.",
        werk: { tipe: "vraestel", id: "dbe-2024-nov-v1" } },
      { suffix: "jun25-v5", start: "13:45", end: "14:20", soort: "toets", punte: 27,
        title: "Jun 2025 V5.2–5.7 Databasis (27 punte, 32 min)",
        detail: "Vorm, navrae, verslag. (5.1 is gister in die diagnose gedoen.)",
        werk: { tipe: "vrae", id: "dbe-2025-jun-v1", nrs: ["5.2", "5.3", "5.4", "5.5", "5.6", "5.7"] } },
      { suffix: "merk-jun25-v5", start: "14:20", end: "14:35", soort: "merk",
        title: "Merk + foutlog", detail: "",
        werk: { tipe: "vrae", id: "dbe-2025-jun-v1", nrs: ["5.2", "5.3", "5.4", "5.5", "5.6", "5.7"] } },
      { suffix: "pouse2", kind: "break", slug: "break", start: "14:35", end: "14:50", soort: "pouse",
        title: "Pouse", detail: "" },
      { suffix: "nov25-v63", start: "14:50", end: "15:40", soort: "toets", punte: 37,
        title: "Nov 2025 V6 + V3 (HTML + sigblad, 37 punte, 45 min)",
        detail: "V6 eerste (15), dan V3 (22).",
        werk: { tipe: "vrae", id: "dbe-2025-nov-v1", nrs: [6, 3] } },
      { suffix: "merk-nov25-v63", start: "15:40", end: "16:00", soort: "merk",
        title: "Merk + foutlog", detail: "",
        werk: { tipe: "vrae", id: "dbe-2025-nov-v1", nrs: [6, 3] } },
      { suffix: "pouse3", kind: "break", slug: "break", start: "16:00", end: "16:15", soort: "pouse",
        title: "Pouse", detail: "" },
      { suffix: "nov25-v1", start: "16:15", end: "16:45", soort: "toets", punte: 22,
        title: "Nov 2025 V1 Woordverwerking (22 punte, 27 min)", detail: "",
        werk: { tipe: "vrae", id: "dbe-2025-nov-v1", nrs: [1] } },
      { suffix: "v7-integreer", start: "16:45", end: "17:20", soort: "toets", punte: 29,
        title: "Nov 2025 V7 + Jun 2026 V7 (geïntegreer, 29 punte, 35 min)",
        detail: "Doen net die dele wat jy ken (possamevoeging, eenvoudige formules). Slaan die res oor.",
        werk: { tipe: "vrae", id: "dbe-2025-nov-v1", nrs: [7] },
        werk_ekstra: [{ tipe: "vrae", id: "dbe-2026-jun-v1", nrs: [7] }] },
      { suffix: "merk-v1-v7", start: "17:20", end: "17:45", soort: "merk",
        title: "Merk V1 + V7's + foutlog", detail: "",
        werk: { tipe: "vrae", id: "dbe-2025-nov-v1", nrs: [1, 7] },
        werk_ekstra: [{ tipe: "vrae", id: "dbe-2026-jun-v1", nrs: [7] }] },
      { suffix: "aandete", kind: "break", slug: "break", start: "17:45", end: "18:30", soort: "pouse",
        title: "Aandete", detail: "" },
      { suffix: "laaste-herroep", start: "18:30", end: "19:00", soort: "les",
        title: "Laaste herroeping (net foutlog + kaarte)",
        detail: "Lees die foutlog. Skryf elke 'Reël' een keer oor. Geen nuwe werk nie. Pak sak: ID, toelatingsbrief, pen, water." },
      { suffix: "klaar", kind: "break", slug: "break", start: "19:00", end: "19:00", soort: "pouse",
        title: "Klaar. Skerm af 20:30, slaap 21:30.",
        detail: "Slaap konsolideer wat vandag geleer is. Laat-nag-leer kos meer punte as wat dit gee." }
    ],
    /* Engels V3 (Hanno, 13 Okt): Di 13 ná die RTT-prakties, en Wo 14 se proefeksamen.
       Werkblokke is geel/engels. Pouses is break/break. Die proef is soort "skrif"
       (papier, Pa gee die vraestel) — nie "toets" nie, sodat die oortjie-slot nie vuur nie. */
    "2026-10-13": [
      { suffix: "na-rtt", kind: "break", slug: "break", start: "12:00", end: "13:30", soort: "pouse",
        title: "Na die RTT-eksamen: eet en rus", detail: "" },
      { suffix: "v3-kaart", kind: "geel", slug: "engels", start: "13:30", end: "14:00", soort: "les",
        title: "V3 se kaart (wat elke keer kom)",
        detail: "3 afdelings, opstel 50 (80 min), lang teks 30 (40 min), kort teks 20 (30 min)." },
      { suffix: "c1", kind: "geel", slug: "engels", start: "14:00", end: "14:30", soort: "toets",
        title: "Dagboekinskrywings (app C1)",
        detail: "Twee inskrywings, verskillende datums, 80-100 woorde." },
      { suffix: "merk-c1", kind: "geel", slug: "engels", start: "14:30", end: "14:45", soort: "merk",
        title: "Merk C1", detail: "" },
      { suffix: "pouse1", kind: "break", slug: "break", start: "14:45", end: "15:00", soort: "pouse",
        title: "Pouse", detail: "" },
      { suffix: "c2", kind: "geel", slug: "engels", start: "15:00", end: "15:30", soort: "toets",
        title: "Instruksies (app C2)",
        detail: "Genommerde stappe, bevelvorm." },
      { suffix: "merk-c2", kind: "geel", slug: "engels", start: "15:30", end: "15:45", soort: "merk",
        title: "Merk C2", detail: "" },
      { suffix: "aanwysings", kind: "geel", slug: "engels", start: "15:45", end: "16:15", soort: "toets",
        title: "Aanwysings (Pa gee die oefenvraag)",
        detail: "Roete A na B, landmerke, afstande." },
      { suffix: "merk-aanwysings", kind: "geel", slug: "engels", start: "16:15", end: "16:30", soort: "merk",
        title: "Merk aanwysings", detail: "" },
      { suffix: "pouse2", kind: "break", slug: "break", start: "16:30", end: "16:45", soort: "pouse",
        title: "Pouse", detail: "" },
      { suffix: "b2", kind: "geel", slug: "engels", start: "16:45", end: "17:25", soort: "toets",
        title: "Dialoog (app B2)",
        detail: "Konteks bo-aan, 120-150 woorde." },
      { suffix: "merk-b2", kind: "geel", slug: "engels", start: "17:25", end: "17:45", soort: "merk",
        title: "Merk B2", detail: "" },
      { suffix: "aandete", kind: "break", slug: "break", start: "17:45", end: "18:45", soort: "pouse",
        title: "Aandete", detail: "" },
      { suffix: "b1", kind: "geel", slug: "engels", start: "18:45", end: "19:25", soort: "toets",
        title: "Aansoekbrief (app B1)",
        detail: "Formele formaat, 120-150 woorde." },
      { suffix: "merk-b1", kind: "geel", slug: "engels", start: "19:25", end: "19:45", soort: "merk",
        title: "Merk B1", detail: "" },
      { suffix: "opstelplan", kind: "geel", slug: "engels", start: "19:45", end: "20:15", soort: "les",
        title: "Opstelbeplanning",
        detail: "Kies 2 sterkste opsteltipes, 3 onderwerpe uit DBE Nov 2025 V3 V1.1-1.3, 5 min breinkaart elk." },
      { suffix: "klaar", kind: "break", slug: "break", start: "20:15", end: "20:15", soort: "pouse",
        title: "Klaar. Skerms af 21:30.",
        detail: "Werk is klaar. Skerms af om 21:30." }
    ],
    "2026-10-14": [
      { suffix: "opstaan", kind: "break", slug: "break", start: "07:30", end: "08:00", soort: "pouse",
        title: "Opstaan, ontbyt", detail: "" },
      { suffix: "foutlog", kind: "geel", slug: "engels", start: "08:00", end: "08:15", soort: "les",
        title: "Foutlog hardop lees", detail: "" },
      { suffix: "v3-kaart", kind: "geel", slug: "engels", start: "08:15", end: "08:30", soort: "les",
        title: "V3 se kaart (wat elke keer kom)", detail: "3 afdelings, opstel 50 (80 min), lang teks 30 (40 min), kort teks 20 (30 min)." },
      { suffix: "b1", kind: "geel", slug: "engels", start: "08:30", end: "09:10", soort: "toets",
        title: "Aansoekbrief (app B1)", detail: "Formele formaat, 120-150 woorde." },
      { suffix: "merk-b1", kind: "geel", slug: "engels", start: "09:10", end: "09:25", soort: "merk",
        title: "Merk B1", detail: "" },
      { suffix: "pouse1", kind: "break", slug: "break", start: "09:25", end: "09:40", soort: "pouse",
        title: "Pouse", detail: "" },
      { suffix: "opstelplan", kind: "geel", slug: "engels", start: "09:40", end: "10:00", soort: "les",
        title: "Opstelbeplanning", detail: "Kies 2 sterkste opsteltipes, 5 min breinkaart elk." },
      { suffix: "inl-slot", kind: "geel", slug: "engels", start: "10:00", end: "10:30", soort: "herdoen",
        title: "Inleiding en slot vir een opstelplan", detail: "" },
      { suffix: "pouse2", kind: "break", slug: "break", start: "10:30", end: "10:40", soort: "pouse",
        title: "Pouse", detail: "" },
      { suffix: "formaat1", kind: "geel", slug: "engels", start: "10:40", end: "11:00", soort: "les",
        title: "Formaatkaarte deel 1", detail: "Formele brief, dagboek, dialoog, instruksies." },
      { suffix: "c1", kind: "geel", slug: "engels", start: "11:00", end: "11:30", soort: "toets",
        title: "Dagboekinskrywings (app C1)", detail: "Twee inskrywings, verskillende datums, 80-100 woorde." },
      { suffix: "merk-c1", kind: "geel", slug: "engels", start: "11:30", end: "11:45", soort: "merk",
        title: "Merk C1", detail: "" },
      { suffix: "briefing", kind: "geel", slug: "engels", start: "11:45", end: "12:10", soort: "les",
        title: "Proefeksamen-briefing (Pa se opdragblad)", detail: "Afdeling C kies 3.1." },
      { suffix: "middag", kind: "break", slug: "break", start: "12:10", end: "13:00", soort: "pouse",
        title: "Middagete", detail: "" },
      { suffix: "proef", kind: "geel", slug: "engels", start: "13:00", end: "15:30", soort: "skrif",
        title: "Engels V3 proefeksamen - Pa gee die vraestel", detail: "100 punte, 2,5 uur. A 13:00-14:20, B 14:20-15:00, C 15:00-15:30." },
      { suffix: "pouse3", kind: "break", slug: "break", start: "15:30", end: "16:00", soort: "pouse",
        title: "Pouse", detail: "" },
      { suffix: "merk-proef", kind: "geel", slug: "engels", start: "16:00", end: "17:00", soort: "merk",
        title: "Merk die proefeksamen saam met Pa", detail: "" },
      { suffix: "herdoen-foute", kind: "geel", slug: "engels", start: "17:00", end: "17:30", soort: "herdoen",
        title: "Top-3 foute", detail: "" },
      { suffix: "aandete", kind: "break", slug: "break", start: "17:30", end: "18:30", soort: "pouse",
        title: "Aandete", detail: "" },
      { suffix: "formaat", kind: "geel", slug: "engels", start: "18:30", end: "19:00", soort: "les",
        title: "Formaatkaarte deel 2", detail: "" },
      { suffix: "oorlees", kind: "geel", slug: "engels", start: "19:00", end: "19:20", soort: "les",
        title: "B1 en opstelplanne oorlees", detail: "" },
      { suffix: "tas", kind: "geel", slug: "engels", start: "19:20", end: "19:50", soort: "les",
        title: "Kontrolelys en tas pak", detail: "ID, toelatingsbrief, penne, water." },
      { suffix: "klaar", kind: "break", slug: "break", start: "19:50", end: "19:50", soort: "pouse",
        title: "Klaar. Skerms af 21:30, bed 22:00.", detail: "Werk is klaar. Skerms af om 21:30, bed 22:00." }
    ]
  };
  if (VASTE_PLANNE[dateStr]) {
    const mins = (a, b) => {
      const [ah, am] = a.split(":").map(Number);
      const [bh, bm] = b.split(":").map(Number);
      return bh * 60 + bm - (ah * 60 + am);
    };
    /* "toets"/"merk"/"herdoen"/"opstel" is RTT-werk (rooi); "les" is ’n kort opwarm-kaart. */
    const KIND = { pouse: "break", les: "warm" };
    const blocks = VASTE_PLANNE[dateStr].map((b) => {
      const blok = {
        id: `${dateStr}-${b.suffix}`,
        kind: b.kind || KIND[b.soort] || "rooi",
        subjectSlug: b.slug || "rtt",
        minutes: mins(b.start, b.end),
        start: b.start,
        end: b.end,
        title: b.title,
        detail: b.detail,
        soort: b.soort
      };
      if (b.punte != null) blok.punte = b.punte;
      if (b.werk) blok.werk = b.werk;
      if (b.werk_ekstra) blok.werk_ekstra = b.werk_ekstra;
      return blok;
    });
    return {
      date: dateStr,
      blocks,
      totalMinutes: blocks.filter((b) => b.kind !== "break").reduce((s, b) => s + b.minutes, 0)
    };
  }

  /* Sondag 27 Sep: Springbokke vs Australië 11:30–13:45 */
  if (dateStr === "2026-09-27") {
    const blocks = [
      {
        id: `${dateStr}-kickoff`,
        kind: "rooi",
        subjectSlug: rooi[0].slug,
        minutes: 60,
        start: "09:30",
        end: "10:30",
        title: `${rooi[0].naam} — KICKOFF-UUR`,
        detail: "Rassie se eerste keuse-oefening: begrip, nie inkram. Toe-boek → memo."
      },
      {
        id: `${dateStr}-pre-match`,
        kind: "rooi",
        subjectSlug: rooi[1].slug,
        minutes: 50,
        start: "10:35",
        end: "11:25",
        title: `${rooi[1].naam} — pre-match drill`,
        detail: "Kort, hard, geen vermyding. Een ou-vraag-afdeling + foutlog."
      },
      {
        id: `${dateStr}-rugby`,
        kind: "break",
        subjectSlug: "break",
        minutes: 135,
        start: "11:30",
        end: "13:45",
        title: "SPRINGBOKKE vs AUSTRALIË — kyk saam",
        detail: "Amptelike rus. Geen skuld. Herlaai — dan tweede helfte van die dag."
      },
      {
        id: `${dateStr}-htt`,
        kind: "warm",
        subjectSlug: groen.slug,
        minutes: 20,
        start: "14:00",
        end: "14:20",
        title: `${groen.naam} — half-time herstel`,
        detail: "5 sommen toe-boek. Warm die bene weer."
      },
      {
        id: `${dateStr}-2h-rtt`,
        kind: "rooi",
        subjectSlug: rooi[2].slug,
        minutes: 70,
        start: "14:25",
        end: "15:35",
        title: `${rooi[2].naam} — 2de helfte`,
        detail: "MOET DIE WERK INSIT. Teorie + praktyk."
      },
      geelBlock(55, (g) => `${g.naam} — scenario-aanval`, { start: "15:40", end: "16:35" }),
      {
        id: `${dateStr}-eng`,
        kind: "geel",
        subjectSlug: "engels",
        minutes: 45,
        start: "16:40",
        end: "17:25",
        title: "Engels — letterkunde / writing",
        detail: "Die gat was lit 38%. Een quote-paragraaf of creative plan."
      },
      {
        id: `${dateStr}-groen`,
        kind: "groen",
        subjectSlug: groen.slug,
        minutes: 40,
        start: "17:30",
        end: "18:10",
        title: `${groen.naam} — teiken 80%`,
        detail: "Gemengde oefening. #15 in die span — skop die pale."
      },
      {
        id: `${dateStr}-slot`,
        kind: "slot",
        subjectSlug: "foutbank",
        minutes: 20,
        start: "18:15",
        end: "18:35",
        title: "Foutlog + môre se matchday-plan",
        detail: "Top-3 foute. Skryf môre se eerste blok."
      }
    ];
    return {
      date: dateStr,
      blocks,
      totalMinutes: blocks.filter((b) => b.kind !== "break").reduce((s, b) => s + b.minutes, 0)
    };
  }

  const blocks = [
    {
      id: `${dateStr}-warm`,
      kind: "warm",
      subjectSlug: groen.slug,
      minutes: 30,
      title: `${groen.naam} — opwarm`,
      detail: "Retrieval: 5 sommen toe-boek, dan memo."
    },
    {
      id: `${dateStr}-rooi1`,
      kind: "rooi",
      subjectSlug: rooi[0].slug,
      minutes: 80,
      title: `${rooi[0].naam} — rooi-sone`,
      detail: rooi[0].fokus
    },
    {
      id: `${dateStr}-rooi2`,
      kind: "rooi",
      subjectSlug: rooi[1].slug,
      minutes: 80,
      title: `${rooi[1].naam} — rooi-sone`,
      detail: rooi[1].fokus
    },
    geelBlock(70, (g) => `${g.naam} — geel-sone`),
    ...(beforeKickoff
      ? [
          {
            id: `${dateStr}-engels-lit`,
            kind: "geel",
            subjectSlug: "engels",
            minutes: 45,
            title: "Engels — letterkunde",
            detail: "Teiken 70%. Die gat was lit 38%. Een quote-paragraaf of creative plan."
          },
          {
            id: `${dateStr}-toerisme`,
            kind: "geel",
            subjectSlug: "toerisme",
            minutes: 25,
            title: "Toerisme — vraag-lees protokol",
            detail: "20–30 min. Lees elke vraag 2×; onderstreep ‘nie’ / ‘behalwe’. Klein hoofstuk, toe-boek."
          }
        ]
      : []),
    {
      id: `${dateStr}-rtt-or-third`,
      kind: "rooi",
      subjectSlug: rooi[2].slug,
      minutes: 70,
      title: `${rooi[2].naam} — diep werk`,
      detail: rooi[2].fokus
    },
    {
      id: `${dateStr}-groen`,
      kind: "groen",
      subjectSlug: groen.slug,
      minutes: 50,
      title: `${groen.naam} — teiken 80%`,
      detail: "Gemengde oefening + tyd."
    },
    {
      id: `${dateStr}-slot`,
      kind: "slot",
      subjectSlug: "foutbank",
      minutes: 25,
      title: "Foutlog + môre se top-3",
      detail: "Hertoets due foute; skryf 3 prioriteite."
    }
  ];

  const total = blocks.reduce((s, b) => s + b.minutes, 0);
  return { date: dateStr, blocks, totalMinutes: total };
};

WALLIE.daysUntilExam = function daysUntilExam(from = new Date()) {
  const start = new Date(WALLIE.EXAM_START + "T00:00:00");
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const diff = Math.ceil((start - a) / 86400000);
  return diff;
};

/** Alle vraestelle uit PK.EXAMS (exams.js), gesorteer; geen tyd -> 09:00 SAST. */
WALLIE.examList = function examList() {
  const src = (window.PK && Array.isArray(PK.EXAMS)) ? PK.EXAMS : [];
  return src
    .map((e) => {
      const at = /T\d/.test(e.at) ? e.at : e.at + "T09:00:00+02:00";
      return { ...e, kick: new Date(at) };
    })
    .sort((a, b) => a.kick - b.kick);
};

/** Eerste vraestel met kick > from (opsioneel net vir een vak-slug). */
WALLIE.nextExam = function nextExam(from = new Date(), slug) {
  return WALLIE.examList().find((e) => e.kick > from && (!slug || e.s === slug)) || null;
};

WALLIE.splitMs = function splitMs(ms) {
  const sec = Math.floor(Math.max(0, ms) / 1000);
  return {
    days: Math.floor(sec / 86400),
    hours: Math.floor((sec % 86400) / 3600),
    minutes: Math.floor((sec % 3600) / 60),
    seconds: sec % 60
  };
};

WALLIE.fmtCountdown = function fmtCountdown(ms) {
  const t = WALLIE.splitMs(ms);
  return `${t.days}d ${WALLIE.pad2(t.hours)}:${WALLIE.pad2(t.minutes)}:${WALLIE.pad2(t.seconds)}`;
};

/** "Do 15 Okt · 09:00" in SAST, onafhanklik van die toestel se tydsone. */
WALLIE.examWhen = function examWhen(kick) {
  const dag = { Sun: "So", Mon: "Ma", Tue: "Di", Wed: "Wo", Thu: "Do", Fri: "Vr", Sat: "Sa" };
  const mnd = { Jan: "Jan", Feb: "Feb", Mar: "Mrt", Apr: "Apr", May: "Mei", Jun: "Jun", Jul: "Jul", Aug: "Aug", Sep: "Sep", Oct: "Okt", Nov: "Nov", Dec: "Des" };
  const parts = {};
  new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Johannesburg", weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(kick).forEach((p) => { parts[p.type] = p.value; });
  return `${dag[parts.weekday]} ${parts.day} ${mnd[parts.month]} · ${parts.hour}:${parts.minute}`;
};

/** Reël onder 'n vak se kop: volgende vraestel + lewendige aftelling (app.js hou [data-aftel-vak] dop). */
WALLIE.vakAftelKop = function vakAftelKop(slug) {
  const now = new Date();
  const e = WALLIE.nextExam(now, slug);
  if (!e) return `<p class="vak-aftel-kop">Alle vraestelle geskryf · <strong class="vak-aftel-tyd is-klaar" data-aftel-vak="${slug}">Klaar</strong></p>`;
  return `<p class="vak-aftel-kop">Volgende: ${e.n} · ${WALLIE.examWhen(e.kick)} · <strong class="vak-aftel-tyd" data-aftel-vak="${slug}">${WALLIE.fmtCountdown(e.kick - now)}</strong></p>`;
};

/** Lewendige stadium-klok tot die volgende vraestel; past=true net as alles verby is. */
WALLIE.timeUntilExam = function timeUntilExam(from = new Date()) {
  const exam = WALLIE.nextExam(from);
  const list = WALLIE.examList();
  const kick = exam ? exam.kick : (list.length ? list[list.length - 1].kick : new Date(WALLIE.EXAM_KICKOFF || WALLIE.EXAM_START + "T09:00:00"));
  const ms = exam ? kick - from : 0;
  const past = !exam;
  return { ...WALLIE.splitMs(ms), ms, past, kick, exam };
};

WALLIE.pad2 = function pad2(n) {
  return String(n).padStart(2, "0");
};

WALLIE.todayKey = function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
