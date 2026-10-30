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
    ],
    /* Plan 18-19 Okt (18 Okt, Hanno): die Afrikaans V3-items in data/vraebank-v3.json se vraagteks stem nie ooreen met hul eie DBE-anker nie (nie regte DBE-vrae nie). Daarom werk So 18 middag en Ma 19 uit die REGTE DBE Nov 2025-vraestel op papier (soort skrif, Pa gee): So Afdeling A (opstel); Ma Afdeling B (2 tekste) en 'n tweede opstel met 'n ander onderwerp, elk met merk saam met Pa. Plan v5 (Claude as projekbestuurder, 14 Okt aand; Hanno moet bevestig): 15-26 Okt: Do 15 eksamendag Engels V3,
       dan Afrikaans HT V3 (Di 20), Wisk. Gel. V1 (Vr 23) en V2 (Ma 26) (ook vaste eksamendag-planne) met eksamenvlak-items; elke studieblok se hooftaak is 'n item (`item`) of DBE-werk.
       `item` is die id van 'n eksamenvlak-item (data/vraebank-v3.json) en wen as hooftaak (lesson-ui.js hoofTaak).
       Soort "voor-eksamen" is 'n ligte eksamendag-opwarm wat sy eie titel as hooftaak hou. */
    "2026-10-15": [
      { suffix: "opstaan", kind: "break", slug: "break", start: "06:45", end: "07:15", soort: "pouse",
        title: "Opstaan, ontbyt", detail: "" },
      { suffix: "formaat", kind: "geel", slug: "engels", start: "07:15", end: "07:35", soort: "voor-eksamen",
        title: "Laaste kyk: formaatkaarte (net lees, geen nuwe werk)",
        detail: "Aansoekbrief, dagboek, dialoog, instruksies. Kies jou opsteltipe. Geen nuwe werk nie." },
      { suffix: "tas", kind: "break", slug: "break", start: "07:35", end: "08:00", soort: "pouse",
        title: "Tas: ID, toelatingsbrief, penne, water", detail: "" },
      { suffix: "eksamen", kind: "break", slug: "break", start: "09:00", end: "11:30", soort: "pouse",
        title: "ENGELS EAT V3-EKSAMEN (skool) 09:00-11:30", detail: "A 80 min, B 40 min, C 30 min. Sterkte!" },
      { suffix: "rus", kind: "break", slug: "break", start: "11:30", end: "13:30", soort: "pouse",
        title: "Rus en middagete", detail: "" },
      { suffix: "terugskou", kind: "geel", slug: "engels", start: "13:30", end: "13:50", soort: "herdoen",
        title: "Engels V3: skryf neer wat gekom het + 3 lesse",
        detail: "Watter onderwerpe, watter teksoorte, wat het jy anders gedoen. Vir Afrikaans V3 (Di 20)." },
      { suffix: "pouse1", kind: "break", slug: "break", start: "13:50", end: "14:00", soort: "pouse",
        title: "Pouse", detail: "" },
      { suffix: "afr-b1", kind: "rooi", slug: "afrikaans", start: "14:00", end: "14:40", soort: "toets",
        item: "afr-v3-B1", punte: 25,
        title: "Afrikaans V3 B1 (25 punte, 40 min)",
        detail: "Getimed, op papier of in die app. Memo eers ná die tyd." },
      { suffix: "merk-afr-b1", kind: "rooi", slug: "afrikaans", start: "14:40", end: "15:00", soort: "merk",
        title: "Merk B1 met die rubriek", detail: "" },
      { suffix: "pouse2", kind: "break", slug: "break", start: "15:00", end: "15:15", soort: "pouse",
        title: "Pouse", detail: "" },
      { suffix: "afr-b2", kind: "rooi", slug: "afrikaans", start: "15:15", end: "15:55", soort: "toets",
        item: "afr-v3-B2", punte: 25,
        title: "Afrikaans V3 B2 (25 punte, 40 min)", detail: "Getimed." },
      { suffix: "merk-afr-b2", kind: "rooi", slug: "afrikaans", start: "15:55", end: "16:15", soort: "merk",
        title: "Merk B2 met die rubriek", detail: "" },
      { suffix: "klaar", kind: "break", slug: "break", start: "16:15", end: "16:15", soort: "pouse",
        title: "Klaar. Skerms af 21:30.", detail: "Eksamendag: genoeg vir vandag." }
    ],
    "2026-10-16": [
      { suffix: "opstaan", kind: "break", slug: "break", start: "07:30", end: "08:00", soort: "pouse",
        title: "Opstaan, ontbyt", detail: "" },
      { suffix: "afr-a1", kind: "rooi", slug: "afrikaans", start: "08:00", end: "09:40", soort: "toets",
        item: "afr-v3-A1", punte: 50,
        title: "Afrikaans V3 A1 opstel (50 punte, 100 min)",
        detail: "Beplan 10 min, skryf 80, lees oor 10. 400-450 woorde." },
      { suffix: "pouse1", kind: "break", slug: "break", start: "09:40", end: "10:00", soort: "pouse",
        title: "Pouse", detail: "" },
      { suffix: "merk-afr-a1", kind: "rooi", slug: "afrikaans", start: "10:00", end: "10:30", soort: "merk",
        title: "Merk A1 met die rubriek (30/15/5)", detail: "" },
      { suffix: "afr-b3", kind: "rooi", slug: "afrikaans", start: "10:30", end: "11:10", soort: "toets",
        item: "afr-v3-B3", punte: 25,
        title: "Afrikaans V3 B3 (25 punte, 40 min)", detail: "Getimed." },
      { suffix: "merk-afr-b3", kind: "rooi", slug: "afrikaans", start: "11:10", end: "11:30", soort: "merk",
        title: "Merk B3 met die rubriek", detail: "" },
      { suffix: "middag", kind: "break", slug: "break", start: "11:30", end: "12:30", soort: "pouse",
        title: "Middagete", detail: "" },
      { suffix: "wg-v1", kind: "groen", slug: "wiskgelett", start: "12:30", end: "13:45", soort: "toets", punte: 62,
        title: "Wisk. Gel. V1: een DBE-vraestel (Pa gee), Vraag 1 en 2 op papier, getimed (62 punte, 75 min)",
        detail: "Wisk. Gel. V1 is Vr 23 Okt. Gebruik 'n amptelike DBE-vraestel en memo." },
      { suffix: "merk-wg-v1", kind: "groen", slug: "wiskgelett", start: "13:45", end: "14:05", soort: "merk",
        title: "Merk Wisk. Gel. Vraag 1 en 2 met die memo", detail: "" },
      { suffix: "klaar", kind: "break", slug: "break", start: "14:05", end: "14:05", soort: "pouse",
        title: "Klaar. Skerms af 21:30.", detail: "" }
    ],
    "2026-10-17": [
      { suffix: "opstaan", kind: "break", slug: "break", start: "08:00", end: "08:30", soort: "pouse",
        title: "Opstaan, ontbyt", detail: "" },
      { suffix: "afr-a2", kind: "rooi", slug: "afrikaans", start: "08:30", end: "10:10", soort: "toets",
        item: "afr-v3-A2", punte: 50,
        title: "Afrikaans V3 A2 opstel (50 punte, 100 min)", detail: "Ander opsteltipe as gister." },
      { suffix: "pouse1", kind: "break", slug: "break", start: "10:10", end: "10:30", soort: "pouse",
        title: "Pouse", detail: "" },
      { suffix: "merk-afr-a2", kind: "rooi", slug: "afrikaans", start: "10:30", end: "11:00", soort: "merk",
        title: "Merk A2 met die rubriek (30/15/5)", detail: "" },
      { suffix: "afr-b4", kind: "rooi", slug: "afrikaans", start: "11:00", end: "11:40", soort: "toets",
        item: "afr-v3-B4", punte: 25,
        title: "Afrikaans V3 B4 (25 punte, 40 min)", detail: "Getimed." },
      { suffix: "merk-afr-b4", kind: "rooi", slug: "afrikaans", start: "11:40", end: "12:00", soort: "merk",
        title: "Merk B4 met die rubriek", detail: "" },
      { suffix: "middag", kind: "break", slug: "break", start: "12:00", end: "13:00", soort: "pouse",
        title: "Middagete", detail: "" },
      { suffix: "wg-v1", kind: "groen", slug: "wiskgelett", start: "13:00", end: "14:10", soort: "toets", punte: 58,
        title: "Wisk. Gel. V1: Vraag 3 en 4 uit dieselfde DBE-vraestel, op papier, getimed (58 punte, 70 min)", detail: "" },
      { suffix: "merk-wg-v1", kind: "groen", slug: "wiskgelett", start: "14:10", end: "14:30", soort: "merk",
        title: "Merk Wisk. Gel. Vraag 3 en 4 met die memo", detail: "" },
      { suffix: "klaar", kind: "break", slug: "break", start: "14:30", end: "14:30", soort: "pouse",
        title: "Klaar. Skerms af 21:30.", detail: "" }
    ],
    "2026-10-18": [
      { suffix: "opstaan", kind: "break", slug: "break", start: "08:00", end: "08:45", soort: "pouse",
        title: "Opstaan, ontbyt", detail: "" },
      { suffix: "afr-b5", kind: "rooi", slug: "afrikaans", start: "08:45", end: "09:25", soort: "toets",
        item: "afr-v3-B5", punte: 25,
        title: "Afrikaans V3 B5 (25 punte, 40 min)", detail: "Getimed." },
      { suffix: "merk-afr-b5", kind: "rooi", slug: "afrikaans", start: "09:25", end: "09:45", soort: "merk",
        title: "Merk B5 met die rubriek", detail: "" },
      { suffix: "pouse1", kind: "break", slug: "break", start: "09:45", end: "10:00", soort: "pouse",
        title: "Pouse", detail: "" },
      { suffix: "foutlog", kind: "rooi", slug: "afrikaans", start: "10:00", end: "10:30", soort: "herdoen",
        title: "Afrikaans: top-3 foute uit A1, A2 en B1-B5 herskryf",
        detail: "Net die paragrawe/dele wat punte gekos het." },
      { suffix: "middag", kind: "break", slug: "break", start: "10:30", end: "13:00", soort: "pouse",
        title: "Familie / middagete", detail: "" },
      { suffix: "wg-v1", kind: "groen", slug: "wiskgelett", start: "13:00", end: "13:40", soort: "toets", punte: 30,
        title: "Wisk. Gel. V1: Vraag 5 (die res van die DBE-vraestel), op papier, getimed (30 punte, 40 min)", detail: "" },
      { suffix: "merk-wg-v1", kind: "groen", slug: "wiskgelett", start: "13:40", end: "14:00", soort: "merk",
        title: "Merk Wisk. Gel. met die memo", detail: "" },
      { suffix: "pouse2", kind: "break", slug: "break", start: "14:00", end: "14:20", soort: "pouse",
        title: "Pouse", detail: "" },
      { suffix: "afr-a-nov25", kind: "rooi", slug: "afrikaans", start: "14:20", end: "16:00", soort: "skrif", punte: 50,
        title: "Afrikaans V3 Afdeling A uit die REGTE DBE Nov 2025-vraestel (Pa gee): kies 1 van die 5 onderwerpe en skryf die volle opstel op papier (50 punte, 100 min)",
        detail: "Werk soos in die eksamen: beplan 10 min, skryf 80, lees oor 10. 400-450 woorde. Skryf tot die tyd om is: 'n onvoltooide opstel kos die meeste punte." },
      { suffix: "merk-afr-a-nov25", kind: "rooi", slug: "afrikaans", start: "16:00", end: "16:30", soort: "merk",
        title: "Merk die opstel saam met Pa met die amptelike DBE-opstelrubriek (30/15/5)", detail: "Inhoud 30, taal 15, struktuur 5. Skryf die 3 grootste foute neer vir môre." },
      { suffix: "klaar", kind: "break", slug: "break", start: "16:30", end: "16:30", soort: "pouse",
        title: "Klaar. Skerms af 21:30.", detail: "" }
    ],
    "2026-10-19": [
      { suffix: "opstaan", kind: "break", slug: "break", start: "07:30", end: "08:00", soort: "pouse",
        title: "Opstaan, ontbyt", detail: "" },
      { suffix: "keuse-b", kind: "rooi", slug: "afrikaans", start: "08:00", end: "08:20", soort: "toets",
        title: "Afrikaans V3 Afdeling B (die gedrukte REGTE DBE Nov 2025-vraestel): lees al die opsies, kies 2 tekste en beplan elkeen (20 min)",
        detail: "Eksamentegniek: kies die tekste waarvan jy die formaat ken en waaroor jy genoeg het om te sê. 'n Kort breinkaart vir elk. Kies 2 ander teksoorte as wat jy die week al geskryf het." },
      { suffix: "afr-b-1", kind: "rooi", slug: "afrikaans", start: "08:20", end: "09:00", soort: "skrif", punte: 25,
        title: "Afrikaans V3 Afdeling B, teks 1 op papier, getimed (25 punte, 40 min)",
        detail: "180-200 woorde, met die regte formaat. Skryf dit klaar; moenie iets oop los nie." },
      { suffix: "pouse1", kind: "break", slug: "break", start: "09:00", end: "09:15", soort: "pouse",
        title: "Pouse", detail: "" },
      { suffix: "afr-b-2", kind: "rooi", slug: "afrikaans", start: "09:15", end: "09:55", soort: "skrif", punte: 25,
        title: "Afrikaans V3 Afdeling B, teks 2 op papier, getimed (25 punte, 40 min)",
        detail: "'n Ander teksoort as teks 1. 180-200 woorde. Skryf dit klaar." },
      { suffix: "pouse2", kind: "break", slug: "break", start: "09:55", end: "10:15", soort: "pouse",
        title: "Pouse", detail: "" },
      { suffix: "merk-b", kind: "rooi", slug: "afrikaans", start: "10:15", end: "10:55", soort: "merk",
        title: "Merk albei tekste self, streng, met die gedrukte amptelike DBE-rubriek vir transaksionele tekste (15/10 elk)", detail: "Merk elke kriterium apart en skryf langs elke punt waarom. Twyfel jy tussen twee vlakke, kies die laer een. Wys Pa vanaand die tekste en jou punte." },
      { suffix: "foutlog", kind: "rooi", slug: "afrikaans", start: "10:55", end: "11:25", soort: "herdoen",
        title: "Afrikaans: herskryf net die dele wat punte gekos het (gister se opstel en vandag se tekste)",
        detail: "Inleiding, slot, formaat of taalfoute: wat die memo sê jy verloor het." },
      { suffix: "middag", kind: "break", slug: "break", start: "11:25", end: "12:15", soort: "pouse",
        title: "Middagete", detail: "" },
      { suffix: "afr-a-2", kind: "rooi", slug: "afrikaans", start: "12:15", end: "13:55", soort: "skrif", punte: 50,
        title: "Afrikaans V3 Afdeling A weer: 'n ANDER onderwerp (ander opsteltipe) uit die DBE Nov 2025-vraestel, volledig op papier (50 punte, 100 min)",
        detail: "Nie die onderwerp van gister nie. Gebruik die 3 foute wat jy gister neergeskryf het. 400-450 woorde; lees oor in die laaste 10 min." },
      { suffix: "pouse3", kind: "break", slug: "break", start: "13:55", end: "14:10", soort: "pouse",
        title: "Pouse", detail: "" },
      { suffix: "merk-a-2", kind: "rooi", slug: "afrikaans", start: "14:10", end: "14:40", soort: "merk",
        title: "Merk die opstel self, streng, met die gedrukte amptelike DBE-opstelrubriek (30/15/5)", detail: "Inhoud 30, taal 15, struktuur 5: merk elkeen apart; twyfel jy, kies die laer vlak. Skryf een ding om môre anders te doen bo-aan jou kontrolelys. Wys Pa vanaand die opstel en jou punte." },
      { suffix: "formaat", kind: "rooi", slug: "afrikaans", start: "14:40", end: "15:10", soort: "herdoen",
        title: "Afrikaans: formaat van elke transaksionele teks (een bladsy, uit jou kop)",
        detail: "Brief, dagboek, verslag, toespraak, e-pos, dialoog: net die formaat." },
      { suffix: "tas", kind: "rooi", slug: "afrikaans", start: "15:10", end: "15:40", soort: "voor-eksamen",
        title: "Kontrolelys en tas pak vir môre", detail: "ID, toelatingsbrief, penne, water. Slaap vroeg." },
      { suffix: "klaar", kind: "break", slug: "break", start: "15:40", end: "15:40", soort: "pouse",
        title: "Klaar. Skerms af 21:00, bed 21:30.", detail: "Rus is deel van die voorbereiding." }
    ],
    "2026-10-20": [
      { suffix: "opstaan", kind: "break", slug: "break", start: "06:45", end: "07:15", soort: "pouse",
        title: "Opstaan, ontbyt", detail: "" },
      { suffix: "formaat", kind: "rooi", slug: "afrikaans", start: "07:15", end: "07:35", soort: "voor-eksamen",
        title: "Laaste kyk: formaat van transaksionele tekste en jou tydkaart vir die eksamen (net lees, geen nuwe werk)",
        detail: "Tydkaart: 09:00-09:15 lees alles, kies 1 opstel + 2 tekste en beplan. Opstel klaar teen ±10:40. Teks 1 klaar teen ±11:20. Teks 2 klaar teen ±12:00. Laat nooit 'n afdeling oop nie: 'n halwe teks kry punte, 'n leë kry nul." },
      { suffix: "tas", kind: "break", slug: "break", start: "07:35", end: "08:00", soort: "pouse",
        title: "Tas: ID, toelatingsbrief, penne, water", detail: "" },
      { suffix: "eksamen", kind: "break", slug: "break", start: "09:00", end: "12:00", soort: "pouse",
        title: "AFRIKAANS HT V3-EKSAMEN (skool) 09:00-12:00", detail: "A opstel ±100 min, B twee tekste ±40 min elk. Sterkte!" },
      { suffix: "rus", kind: "break", slug: "break", start: "12:00", end: "14:00", soort: "pouse",
        title: "Rus en middagete", detail: "" },
      { suffix: "terugskou", kind: "rooi", slug: "afrikaans", start: "14:00", end: "14:20", soort: "herdoen",
        title: "Afrikaans V3: skryf neer wat gekom het + 3 lesse", detail: "" },
      { suffix: "pouse1", kind: "break", slug: "break", start: "14:20", end: "14:30", soort: "pouse",
        title: "Pouse", detail: "" },
      { suffix: "wg-v1", kind: "groen", slug: "wiskgelett", start: "14:30", end: "15:45", soort: "toets", punte: 62,
        title: "Wisk. Gel. V1: nog 'n DBE-vraestel (Pa gee), Vraag 1 en 2 op papier, getimed (62 punte, 75 min)",
        detail: "Wisk. Gel. V1 is Vr 23 Okt. Gebruik 'n amptelike DBE-vraestel en memo." },
      { suffix: "merk-wg-v1", kind: "groen", slug: "wiskgelett", start: "15:45", end: "16:05", soort: "merk",
        title: "Merk Wisk. Gel. Vraag 1 en 2 met die memo", detail: "" },
      { suffix: "klaar", kind: "break", slug: "break", start: "16:05", end: "16:05", soort: "pouse",
        title: "Klaar. Skerms af 21:30.", detail: "" }
    ],
    /* Plan v5 (vervolg): Wisk. Gel. V1 is Vr 23 Okt; Hanno moet bevestig.
       Wisk. Gel.-blokke (15 Okt, teen die DBE Nov 2025-vraestelle nagegaan): V1 = 150 punte / 3 uur (1,2 min per punt);
       V1-vrae 30/32/30/28/30 punte. Dus Vraag 1+2 = 62 punte ≈ 75 min, Vraag 3+4 = 58 ≈ 70 min, Vraag 5 = 30 ≈ 40 min.
       Wo 21: volle proefeksamen soort "skrif" (papier; soos 14 Okt, sodat die oortjie-slot nie vuur nie).
       21 Okt (Claude): elke Wisk. Gel.-blok van 21-24 Okt het nou `werk` met die amptelike DBE-vraestel, antwoordeboek en memo
       (WALLIE.DBE.KATALOGUS) - niemand hoef iets te gee nie. Die werkblokke is "skrif": die PDF is in 'n ander oortjie oop.
       Do 22: Vraag 1 en 2 uit 'n ander vraestel, formuleblad, en die tas vir môre. */
    "2026-10-21": [
      { suffix: "opstaan", kind: "break", slug: "break", start: "07:30", end: "08:00", soort: "pouse",
        title: "Opstaan, ontbyt", detail: "" },
      { suffix: "wg-v1-proef", kind: "groen", slug: "wiskgelett", start: "08:00", end: "11:00", soort: "skrif",
        title: "Wisk. Gel. V1 proefeksamen: DBE Mei/Junie 2026 V1, volledige vraestel (150 punte, 3 uur)",
        detail: "Volle eksamentoestande. Maak die vraestel en antwoordeboek hier oop en skryf op papier. Die memo sluit eers oop as die tyd om is.",
        werk: { tipe: "vraestel", id: "dbe-2026-jun-wg-v1" } },
      { suffix: "middag", kind: "break", slug: "break", start: "11:00", end: "13:00", soort: "pouse",
        title: "Middagete. Maak gereed: sakrekenaar, penne, liniaal, papier", detail: "" },
      { suffix: "wg-v1-proef-inhaal", kind: "groen", slug: "wiskgelett", start: "13:00", end: "16:00", soort: "skrif",
        title: "INHAAL: Wisk. Gel. V1 proefeksamen, DBE Mei/Junie 2024 V1 (nuut vir jou), volledige vraestel (150 punte, 3 uur)",
        detail: "Druk Begin sodra jy gereed is: jy kry die volle 3 uur. Maak die vraestel en die bylae hier oop en skryf op papier. Die memo sluit eers oop as die tyd om is.",
        werk: { tipe: "vraestel", id: "dbe-2024-jun-wg-v1" } },
      { suffix: "pouse1", kind: "break", slug: "break", start: "16:00", end: "16:15", soort: "pouse",
        title: "Pouse", detail: "" },
      { suffix: "merk-wg-v1-proef", kind: "groen", slug: "wiskgelett", start: "16:15", end: "17:15", soort: "merk",
        title: "Merk die proefeksamen met die DBE-memo (Mei/Junie 2024 V1)", detail: "Merk streng; skryf jou punt per vraag neer.",
        werk: { tipe: "vraestel", id: "dbe-2024-jun-wg-v1" } },
      { suffix: "foutlog", kind: "groen", slug: "wiskgelett", start: "17:15", end: "17:45", soort: "herdoen",
        title: "Wisk. Gel.: top-3 foute herdoen", detail: "Net die vrae wat die meeste punte gekos het." },
      { suffix: "klaar", kind: "break", slug: "break", start: "17:45", end: "17:45", soort: "pouse",
        title: "Klaar. Skerms af 21:30.", detail: "" }
    ],
    "2026-10-22": [
      { suffix: "opstaan", kind: "break", slug: "break", start: "07:30", end: "08:00", soort: "pouse",
        title: "Opstaan, ontbyt", detail: "" },
      { suffix: "wg-v1", kind: "groen", slug: "wiskgelett", start: "08:00", end: "09:15", soort: "skrif", punte: 59,
        title: "Wisk. Gel. V1: DBE November 2024 V1, Vraag 1 en 2, op papier, getimed (59 punte, 75 min)",
        detail: "Maak die vraestel en die bylae hier oop. Die memo sluit eers oop as die tyd om is.",
        werk: { tipe: "vrae", id: "dbe-2024-nov-wg-v1", nrs: [1, 2] } },
      { suffix: "merk-wg-v1", kind: "groen", slug: "wiskgelett", start: "09:15", end: "09:35", soort: "merk",
        title: "Merk Vraag 1 en 2 met die DBE-memo (November 2024 V1)", detail: "",
        werk: { tipe: "vrae", id: "dbe-2024-nov-wg-v1", nrs: [1, 2] } },
      { suffix: "pouse1", kind: "break", slug: "break", start: "09:35", end: "09:55", soort: "pouse",
        title: "Pouse", detail: "" },
      { suffix: "wg-v1-34", kind: "groen", slug: "wiskgelett", start: "09:55", end: "11:10", soort: "skrif", punte: 60,
        title: "Wisk. Gel. V1: DBE November 2024 V1, Vraag 3 en 4, op papier, getimed (60 punte, 75 min)",
        detail: "Dieselfde vraestel as vanoggend. Die memo sluit eers oop as die tyd om is.",
        werk: { tipe: "vrae", id: "dbe-2024-nov-wg-v1", nrs: [3, 4] } },
      { suffix: "merk-wg-v1-34", kind: "groen", slug: "wiskgelett", start: "11:10", end: "11:30", soort: "merk",
        title: "Merk Vraag 3 en 4 met die DBE-memo (November 2024 V1)", detail: "",
        werk: { tipe: "vrae", id: "dbe-2024-nov-wg-v1", nrs: [3, 4] } },
      { suffix: "middag", kind: "break", slug: "break", start: "11:30", end: "12:15", soort: "pouse",
        title: "Middagete", detail: "" },
      { suffix: "wg-v1-5", kind: "groen", slug: "wiskgelett", start: "12:15", end: "12:55", soort: "skrif", punte: 31,
        title: "Wisk. Gel. V1: DBE November 2024 V1, Vraag 5, op papier, getimed (31 punte, 40 min)",
        detail: "Die laaste vraag: daarna het jy die hele vraestel gedoen. Die memo sluit eers oop as die tyd om is.",
        werk: { tipe: "vrae", id: "dbe-2024-nov-wg-v1", nrs: [5] } },
      { suffix: "merk-wg-v1-5", kind: "groen", slug: "wiskgelett", start: "12:55", end: "13:15", soort: "merk",
        title: "Merk Vraag 5 met die DBE-memo (November 2024 V1)", detail: "",
        werk: { tipe: "vrae", id: "dbe-2024-nov-wg-v1", nrs: [5] } },
      { suffix: "pouse2", kind: "break", slug: "break", start: "13:15", end: "13:30", soort: "pouse",
        title: "Pouse", detail: "" },
      { suffix: "formules", kind: "groen", slug: "wiskgelett", start: "13:30", end: "14:00", soort: "herdoen",
        title: "Wisk. Gel.: formuleblad en eenhede-omskakelings (een bladsy, uit jou kop)", detail: "" },
      { suffix: "tas", kind: "groen", slug: "wiskgelett", start: "14:00", end: "14:20", soort: "voor-eksamen",
        title: "Kontrolelys en tas pak vir môre", detail: "ID, toelatingsbrief, sakrekenaar, penne, liniaal. Slaap vroeg." },
      { suffix: "klaar", kind: "break", slug: "break", start: "14:20", end: "14:20", soort: "pouse",
        title: "Klaar. Skerms af 21:00, bed 21:30.", detail: "" }
    ],
    /* Vr 23 Okt: Wisk. Gel. V1-eksamen 09:00-12:00; middag begin Wisk. Gel. V2 (Ma 26 Okt 09:00). */
    "2026-10-23": [
      { suffix: "opstaan", kind: "break", slug: "break", start: "06:45", end: "07:15", soort: "pouse",
        title: "Opstaan, ontbyt", detail: "" },
      { suffix: "formules", kind: "groen", slug: "wiskgelett", start: "07:15", end: "07:35", soort: "voor-eksamen",
        title: "Laaste kyk: formuleblad en eenhede (net lees, geen nuwe werk)", detail: "Rente, BTW, persentasie, skaal, oppervlakte en volume. Geen nuwe werk nie." },
      { suffix: "tas", kind: "break", slug: "break", start: "07:35", end: "08:00", soort: "pouse",
        title: "Tas: ID, toelatingsbrief, sakrekenaar, penne, liniaal", detail: "" },
      { suffix: "eksamen", kind: "break", slug: "break", start: "09:00", end: "12:00", soort: "pouse",
        title: "WISK. GEL. V1-EKSAMEN (skool) 09:00-12:00", detail: "150 punte, 3 uur. Sterkte!" },
      { suffix: "rus", kind: "break", slug: "break", start: "12:00", end: "14:00", soort: "pouse",
        title: "Rus en middagete", detail: "" },
      { suffix: "terugskou", kind: "groen", slug: "wiskgelett", start: "14:00", end: "14:20", soort: "herdoen",
        title: "Wisk. Gel. V1: skryf neer wat gekom het + 3 lesse vir V2", detail: "" },
      { suffix: "klaar", kind: "break", slug: "break", start: "14:20", end: "14:20", soort: "pouse",
        title: "Klaar. Rus ná die eksamen. Môre 09:00: die volledige Wisk. Gel. V2-vraestel.", detail: "" }
    ],
    /* Sa 24 (Hanno, 23 Okt 23:05: "begin môre eers 09:00"): Vrydag se V2 Vraag 1+2 (14:30) is nie gedoen nie, dus die
       VOLLEDIGE DBE Nov 2025 V2 in een sitting (soos die eksamen), dan merk en foute. So 25: die volledige Jun 2026 V2. */
    "2026-10-24": [
      { suffix: "opstaan", kind: "break", slug: "break", start: "08:30", end: "09:00", soort: "pouse",
        title: "Opstaan, ontbyt", detail: "" },
      { suffix: "wg-v2-proef-a", kind: "groen", slug: "wiskgelett", start: "09:00", end: "12:00", soort: "skrif",
        title: "Wisk. Gel. V2 proefeksamen: DBE November 2025 V2, volledige vraestel (150 punte, 3 uur)",
        detail: "Volle eksamentoestande. Maak die vraestel en antwoordeboek hier oop en skryf op papier. Die memo sluit eers oop as die tyd om is.",
        werk: { tipe: "vraestel", id: "dbe-2025-nov-wg-v2" } },
      { suffix: "merk-wg-v2-proef-a", kind: "groen", slug: "wiskgelett", start: "12:15", end: "13:15", soort: "merk",
        title: "Merk die V2-proefeksamen met die DBE-memo (November 2025 V2)", detail: "Merk streng; skryf jou punt per vraag neer.",
        werk: { tipe: "vraestel", id: "dbe-2025-nov-wg-v2" } },
      { suffix: "middag", kind: "break", slug: "break", start: "13:15", end: "14:00", soort: "pouse",
        title: "Middagete", detail: "" },
      { suffix: "foutlog", kind: "groen", slug: "wiskgelett", start: "14:00", end: "14:30", soort: "herdoen",
        title: "Wisk. Gel.: top-3 foute uit V1 en V2 herdoen", detail: "Net die vrae wat die meeste punte gekos het." },
      { suffix: "klaar", kind: "break", slug: "break", start: "14:30", end: "14:30", soort: "pouse",
        title: "Klaar. Skerms af 21:30.", detail: "" }
    ],
    "2026-10-25": [
      { suffix: "opstaan", kind: "break", slug: "break", start: "08:30", end: "09:00", soort: "pouse",
        title: "Opstaan, ontbyt", detail: "" },
      { suffix: "wg-v2-proef", kind: "groen", slug: "wiskgelett", start: "09:00", end: "12:00", soort: "skrif",
        title: "Wisk. Gel. V2 proefeksamen: DBE Mei/Junie 2026 V2, volledige vraestel (150 punte, 3 uur)",
        detail: "Laaste volle V2 voor die eksamen. Maak die vraestel en antwoordeboek hier oop en skryf op papier. Die memo sluit eers oop as die tyd om is.",
        werk: { tipe: "vraestel", id: "dbe-2026-jun-wg-v2" } },
      { suffix: "merk-wg-v2-proef", kind: "groen", slug: "wiskgelett", start: "12:15", end: "13:15", soort: "merk",
        title: "Merk die V2-proefeksamen met die DBE-memo (Mei/Junie 2026 V2) en skryf jou top-3 foute neer", detail: "Merk streng; skryf jou punt per vraag neer.",
        werk: { tipe: "vraestel", id: "dbe-2026-jun-wg-v2" } },
      { suffix: "middag", kind: "break", slug: "break", start: "13:15", end: "14:00", soort: "pouse",
        title: "Middagete", detail: "" },
      { suffix: "eng-v1-a", kind: "geel", slug: "engels", start: "14:00", end: "16:00", soort: "skrif", punte: 80,
        title: "Engels EAT V1 proef: DBE Mei/Junie 2025 English FAL P1, volledige vraestel (80 punte, 2 uur)",
        detail: "Tydkaart: A begrip 50 min, B opsomming 20 min, C taal 50 min. Op papier. Die memo sluit eers oop as die tyd om is.",
        werk: { tipe: "vraestel", id: "dbe-2025-jun-eng-v1" } },
      { suffix: "merk-eng-v1-a", kind: "geel", slug: "engels", start: "16:15", end: "16:55", soort: "merk",
        title: "Merk die Engels V1-proef met die DBE-memo (Mei/Junie 2025)", detail: "Merk streng; skryf jou punt per afdeling neer.",
        werk: { tipe: "vraestel", id: "dbe-2025-jun-eng-v1" } },
      { suffix: "tas", kind: "groen", slug: "wiskgelett", start: "17:00", end: "17:20", soort: "voor-eksamen",
        title: "Wisk. Gel.: kontrolelys en tas pak vir môre", detail: "ID, toelatingsbrief, sakrekenaar, penne, liniaal. Slaap vroeg." },
      { suffix: "klaar", kind: "break", slug: "break", start: "17:20", end: "17:20", soort: "pouse",
        title: "Klaar. Skerms af 21:00, bed 21:30.", detail: "" }
    ],
    "2026-10-26": [
      { suffix: "opstaan", kind: "break", slug: "break", start: "06:45", end: "07:15", soort: "pouse",
        title: "Opstaan, ontbyt", detail: "" },
      { suffix: "formules", kind: "groen", slug: "wiskgelett", start: "07:15", end: "07:35", soort: "voor-eksamen",
        title: "Laaste kyk: formuleblad en eenhede (net lees, geen nuwe werk)", detail: "Geen nuwe werk nie." },
      { suffix: "tas", kind: "break", slug: "break", start: "07:35", end: "08:00", soort: "pouse",
        title: "Tas: ID, toelatingsbrief, sakrekenaar, penne, liniaal", detail: "" },
      { suffix: "eksamen", kind: "break", slug: "break", start: "09:00", end: "12:00", soort: "pouse",
        title: "WISK. GEL. V2-EKSAMEN (skool) 09:00-12:00", detail: "150 punte, 3 uur. Sterkte!" },
      { suffix: "rus", kind: "break", slug: "break", start: "12:00", end: "14:00", soort: "pouse",
        title: "Rus en middagete", detail: "" },
      { suffix: "terugskou", kind: "groen", slug: "wiskgelett", start: "14:00", end: "14:20", soort: "herdoen",
        title: "Wisk. Gel. V2: skryf neer wat gekom het", detail: "" },
      { suffix: "eng-v1-b", kind: "geel", slug: "engels", start: "14:30", end: "16:30", soort: "skrif", punte: 80,
        title: "Engels EAT V1 proef: DBE November 2024 English FAL P1, volledige vraestel (80 punte, 2 uur)",
        detail: "Tydkaart: A begrip 50 min, B opsomming 20 min, C taal 50 min. Op papier. Die memo sluit eers oop as die tyd om is.",
        werk: { tipe: "vraestel", id: "dbe-2024-nov-eng-v1" } },
      { suffix: "merk-eng-v1-b", kind: "geel", slug: "engels", start: "16:45", end: "17:25", soort: "merk",
        title: "Merk die Engels V1-proef met die DBE-memo (November 2024)", detail: "Vergelyk met gister: watter afdeling het verbeter?",
        werk: { tipe: "vraestel", id: "dbe-2024-nov-eng-v1" } },
      { suffix: "klaar", kind: "break", slug: "break", start: "17:25", end: "17:25", soort: "pouse",
        title: "Klaar. Skerms af 21:30.", detail: "" }
    ],
    "2026-10-27": [
      { suffix: "opstaan", kind: "break", slug: "break", start: "07:30", end: "08:00", soort: "pouse",
        title: "Opstaan, ontbyt", detail: "" },
      { suffix: "eng-v1-c", kind: "geel", slug: "engels", start: "08:00", end: "10:00", soort: "skrif", punte: 80,
        title: "Engels EAT V1 proef: DBE Mei/Junie 2024 English FAL P1, volledige vraestel (80 punte, 2 uur)",
        detail: "Laaste volle Engels V1 voor die eksamen. Tydkaart: A 50 min, B 20 min, C 50 min. Die memo sluit eers oop as die tyd om is.",
        werk: { tipe: "vraestel", id: "dbe-2024-jun-eng-v1" } },
      { suffix: "merk-eng-v1-c", kind: "geel", slug: "engels", start: "10:00", end: "10:40", soort: "merk",
        title: "Merk die Engels V1-proef met die DBE-memo (Mei/Junie 2024) en skryf jou top-3 foute uit al drie proewe neer", detail: "",
        werk: { tipe: "vraestel", id: "dbe-2024-jun-eng-v1" } },
      { suffix: "middag", kind: "break", slug: "break", start: "10:40", end: "13:00", soort: "pouse",
        title: "Middagete", detail: "" },
      { suffix: "rtt-v2-a", kind: "rooi", slug: "rtt", start: "13:00", end: "16:00", soort: "skrif", punte: 150,
        title: "RTT V2 (teorie) proef: DBE Mei/Junie 2026 RTT V2, volledige vraestel (150 punte, 3 uur)",
        detail: "Een punt per feit; nie meer antwoorde as gevra nie; geen 'goedkoper/vinniger' sonder rede nie; geen handelsname nie. Die memo sluit eers oop as die tyd om is.",
        werk: { tipe: "vraestel", id: "dbe-2026-jun-rtt-v2" } },
      { suffix: "merk-rtt-v2-a", kind: "rooi", slug: "rtt", start: "16:15", end: "17:00", soort: "merk",
        title: "Merk die RTT V2-proef met die DBE-memo (Mei/Junie 2026)", detail: "",
        werk: { tipe: "vraestel", id: "dbe-2026-jun-rtt-v2" } },
      { suffix: "tas", kind: "geel", slug: "engels", start: "17:00", end: "17:15", soort: "voor-eksamen",
        title: "Engels: tas pak vir môre en die tydkaart (A 50 / B 20 / C 50)", detail: "ID, toelatingsbrief, penne. Slaap vroeg." },
      { suffix: "klaar", kind: "break", slug: "break", start: "17:15", end: "17:15", soort: "pouse",
        title: "Klaar. Skerms af 21:00, bed 21:30.", detail: "" }
    ],
    "2026-10-28": [
      { suffix: "opstaan", kind: "break", slug: "break", start: "06:45", end: "07:15", soort: "pouse",
        title: "Opstaan, ontbyt", detail: "" },
      { suffix: "tydkaart", kind: "geel", slug: "engels", start: "07:15", end: "07:35", soort: "voor-eksamen",
        title: "Laaste kyk: Engels V1-tydkaart (A 50 min, B 20 min, C 50 min) en opsomming-reëls", detail: "Geen nuwe werk nie." },
      { suffix: "tas", kind: "break", slug: "break", start: "07:35", end: "08:00", soort: "pouse",
        title: "Tas: ID, toelatingsbrief, penne", detail: "" },
      { suffix: "eksamen", kind: "break", slug: "break", start: "09:00", end: "11:00", soort: "pouse",
        title: "ENGELS EAT V1-EKSAMEN (skool) 09:00-11:00", detail: "80 punte, 2 uur. Sterkte!" },
      { suffix: "rus", kind: "break", slug: "break", start: "11:00", end: "12:30", soort: "pouse",
        title: "Rus en middagete", detail: "" },
      { suffix: "terugskou", kind: "geel", slug: "engels", start: "12:30", end: "12:45", soort: "herdoen",
        title: "Engels V1: skryf neer wat gekom het", detail: "" },
      { suffix: "rtt-v2-b", kind: "rooi", slug: "rtt", start: "13:00", end: "16:00", soort: "skrif", punte: 150,
        title: "RTT V2 (teorie) proef: DBE November 2025 RTT V2, volledige vraestel (150 punte, 3 uur)",
        detail: "Een punt per feit; nie meer antwoorde as gevra nie; geen handelsname nie. Die memo sluit eers oop as die tyd om is.",
        werk: { tipe: "vraestel", id: "dbe-2025-nov-rtt-v2" } },
      { suffix: "merk-rtt-v2-b", kind: "rooi", slug: "rtt", start: "16:15", end: "17:15", soort: "merk",
        title: "Merk die RTT V2-proef met die DBE-memo (November 2025)", detail: "Vergelyk met gister: watter afdeling het verbeter?",
        werk: { tipe: "vraestel", id: "dbe-2025-nov-rtt-v2" } },
      { suffix: "klaar", kind: "break", slug: "break", start: "17:15", end: "17:15", soort: "pouse",
        title: "Klaar. Skerms af 21:00, bed 21:30.", detail: "" }
    ],
    "2026-10-29": [
      { suffix: "opstaan", kind: "break", slug: "break", start: "07:00", end: "07:30", soort: "pouse",
        title: "Opstaan, ontbyt", detail: "" },
      { suffix: "rtt-v2-c", kind: "rooi", slug: "rtt", start: "07:30", end: "09:00", soort: "skrif", punte: 75,
        title: "RTT V2: DBE Mei/Junie 2025 RTT V2, Vraag 1 tot 6 (afdeling A + V4-V6), getimed (75 punte, 90 min)",
        detail: "Afdeling A (25) is die vinnigste punte. Die memo sluit eers oop as die tyd om is.",
        werk: { tipe: "vrae", id: "dbe-2025-jun-rtt-v2", nrs: [1, 2, 3, 4, 5, 6] } },
      { suffix: "merk-rtt-v2-c", kind: "rooi", slug: "rtt", start: "09:00", end: "09:30", soort: "merk",
        title: "Merk Vraag 1 tot 6 met die DBE-memo (Mei/Junie 2025 RTT V2)", detail: "",
        werk: { tipe: "vrae", id: "dbe-2025-jun-rtt-v2", nrs: [1, 2, 3, 4, 5, 6] } },
      { suffix: "reels", kind: "rooi", slug: "rtt", start: "09:45", end: "10:05", soort: "voor-eksamen",
        title: "RTT V2: die vier reëls van die instruksiebladsy en jou top-3 foute (net lees)", detail: "Een punt per feit · nie meer antwoorde as gevra nie · geen vae vergelykings nie · geen handelsname nie." },
      { suffix: "rus", kind: "break", slug: "break", start: "10:05", end: "13:00", soort: "pouse",
        title: "Rus en middagete (eet voor 13:00)", detail: "" },
      { suffix: "eksamen", kind: "break", slug: "break", start: "14:00", end: "17:00", soort: "pouse",
        title: "RTT V2-EKSAMEN (skool) 14:00-17:00", detail: "150 punte, 3 uur. Sterkte!" },
      { suffix: "klaar", kind: "break", slug: "break", start: "17:00", end: "17:00", soort: "pouse",
        title: "Klaar. Toerisme is môre 14:00. Skerms af 21:30.", detail: "" }
    ],
    "2026-10-30": [
      { suffix: "opstaan", kind: "break", slug: "break", start: "07:30", end: "08:00", soort: "pouse",
        title: "Opstaan, ontbyt", detail: "" },
      { suffix: "toer-a", kind: "geel", slug: "toerisme", start: "08:00", end: "09:25", soort: "skrif", punte: 90,
        title: "Toerisme: DBE Mei/Junie 2026 Toerisme, Vraag 1 tot 3 (afdeling A + B), getimed (90 punte, 85 min)",
        detail: "Valuta tot 2 desimale; toon berekeninge; lees elke vraag twee keer. Die memo sluit eers oop as die tyd om is.",
        werk: { tipe: "vrae", id: "dbe-2026-jun-toer", nrs: [1, 2, 3] } },
      { suffix: "merk-toer-a", kind: "geel", slug: "toerisme", start: "09:25", end: "09:55", soort: "merk",
        title: "Merk Toerisme Vraag 1 tot 3 met die DBE-memo (Mei/Junie 2026)", detail: "",
        werk: { tipe: "vrae", id: "dbe-2026-jun-toer", nrs: [1, 2, 3] } },
      { suffix: "mcq-vinnig", kind: "geel", slug: "toerisme", start: "09:55", end: "10:25", soort: "voor-eksamen", punte: 20,
        title: "Toerisme: 20 vinnige MCQs (doeane, groen/rooi, UTC, kaartwerk, minister)",
        detail: "Uit jou notas + SARS/DBE-patroon. Een vraag op 'n slag; sien dadelik of dit reg is.",
        mcq: "toer-vinnig" },
      { suffix: "laaste-kyk", kind: "geel", slug: "toerisme", start: "10:25", end: "10:40", soort: "voor-eksamen",
        title: "Toerisme: laaste kyk (wisselkoers, tydsones, punte bepaal lengte)", detail: "Geen nuwe werk nie. Tas: ID, toelatingsbrief, sakrekenaar." },
      { suffix: "rus", kind: "break", slug: "break", start: "10:40", end: "13:00", soort: "pouse",
        title: "Rus en middagete (eet voor 13:00)", detail: "" },
      { suffix: "eksamen", kind: "break", slug: "break", start: "14:00", end: "17:00", soort: "pouse",
        title: "TOERISME-EKSAMEN (skool) 14:00-17:00", detail: "200 punte, 3 uur. Sterkte!" },
      { suffix: "klaar", kind: "break", slug: "break", start: "17:00", end: "17:00", soort: "pouse",
        title: "Klaar. Môre begin Gasvryheid (6 Nov). Skerms af 21:30.", detail: "" }
    ],
    "2026-10-31": [
      { suffix: "opstaan", kind: "break", slug: "break", start: "08:00", end: "08:30", soort: "pouse",
        title: "Opstaan, ontbyt", detail: "" },
      { suffix: "gas-a", kind: "rooi", slug: "gasvryheid", start: "08:30", end: "11:30", soort: "skrif", punte: 200,
        title: "Gasvryheidstudie proef 1: DBE Mei/Junie 2026, volledige vraestel (200 punte, 3 uur)",
        detail: "Afdeling C (80) en D (60) is 70% van die punte: begin daar as jy vasval. Die memo sluit eers oop as die tyd om is.",
        werk: { tipe: "vraestel", id: "dbe-2026-jun-gas" } },
      { suffix: "merk-gas-a", kind: "rooi", slug: "gasvryheid", start: "11:45", end: "12:45", soort: "merk",
        title: "Merk Gasvryheid-proef 1 met die DBE-memo (Mei/Junie 2026)", detail: "Skryf jou punt per afdeling (A/B/C/D) neer.",
        werk: { tipe: "vraestel", id: "dbe-2026-jun-gas" } },
      { suffix: "klaar", kind: "break", slug: "break", start: "12:45", end: "12:45", soort: "pouse",
        title: "Klaar. Rus ná 'n swaar week. Skerms af 21:30.", detail: "" }
    ],
    "2026-11-01": [
      { suffix: "opstaan", kind: "break", slug: "break", start: "08:30", end: "09:00", soort: "pouse",
        title: "Opstaan, ontbyt", detail: "" },
      { suffix: "foutlog-gas", kind: "rooi", slug: "gasvryheid", start: "09:00", end: "09:45", soort: "herdoen",
        title: "Gasvryheid: herdoen die 5 vrae wat gister die meeste punte gekos het (toe-boek, dan die memo van gister se merk-blok)", detail: "" },
      { suffix: "klaar", kind: "break", slug: "break", start: "09:45", end: "09:45", soort: "pouse",
        title: "Klaar. Familie-dag. Skerms af 21:30.", detail: "" }
    ],
    "2026-11-02": [
      { suffix: "opstaan", kind: "break", slug: "break", start: "07:30", end: "08:00", soort: "pouse",
        title: "Opstaan, ontbyt", detail: "" },
      { suffix: "gas-b", kind: "rooi", slug: "gasvryheid", start: "08:00", end: "11:00", soort: "skrif", punte: 200,
        title: "Gasvryheidstudie proef 2: DBE Mei/Junie 2025, volledige vraestel (200 punte, 3 uur)",
        detail: "Die memo sluit eers oop as die tyd om is.",
        werk: { tipe: "vraestel", id: "dbe-2025-jun-gas" } },
      { suffix: "merk-gas-b", kind: "rooi", slug: "gasvryheid", start: "11:15", end: "12:15", soort: "merk",
        title: "Merk Gasvryheid-proef 2 met die DBE-memo (Mei/Junie 2025)", detail: "Vergelyk per afdeling met proef 1.",
        werk: { tipe: "vraestel", id: "dbe-2025-jun-gas" } },
      { suffix: "klaar", kind: "break", slug: "break", start: "12:15", end: "12:15", soort: "pouse",
        title: "Klaar met Gasvryheid vir vandag. Skerms af 21:30.", detail: "" }
    ],
    "2026-11-03": [
      { suffix: "opstaan", kind: "break", slug: "break", start: "07:30", end: "08:00", soort: "pouse",
        title: "Opstaan, ontbyt", detail: "" },
      { suffix: "gas-c", kind: "rooi", slug: "gasvryheid", start: "08:00", end: "11:00", soort: "skrif", punte: 200,
        title: "Gasvryheidstudie proef 3: DBE November 2024, volledige vraestel (200 punte, 3 uur)",
        detail: "Die memo sluit eers oop as die tyd om is.",
        werk: { tipe: "vraestel", id: "dbe-2024-nov-gas" } },
      { suffix: "merk-gas-c", kind: "rooi", slug: "gasvryheid", start: "11:15", end: "12:15", soort: "merk",
        title: "Merk Gasvryheid-proef 3 met die DBE-memo (November 2024)", detail: "",
        werk: { tipe: "vraestel", id: "dbe-2024-nov-gas" } },
      { suffix: "klaar", kind: "break", slug: "break", start: "12:15", end: "12:15", soort: "pouse",
        title: "Klaar met Gasvryheid vir vandag. Skerms af 21:30.", detail: "" }
    ],
    "2026-11-04": [
      { suffix: "opstaan", kind: "break", slug: "break", start: "07:30", end: "08:00", soort: "pouse",
        title: "Opstaan, ontbyt", detail: "" },
      { suffix: "gas-d", kind: "rooi", slug: "gasvryheid", start: "08:00", end: "11:00", soort: "skrif", punte: 200,
        title: "Gasvryheidstudie proef 4: DBE November 2023, volledige vraestel (200 punte, 3 uur)",
        detail: "Die memo sluit eers oop as die tyd om is.",
        werk: { tipe: "vraestel", id: "dbe-2023-nov-gas" } },
      { suffix: "merk-gas-d", kind: "rooi", slug: "gasvryheid", start: "11:15", end: "12:15", soort: "merk",
        title: "Merk Gasvryheid-proef 4 met die DBE-memo (November 2023)", detail: "",
        werk: { tipe: "vraestel", id: "dbe-2023-nov-gas" } },
      { suffix: "klaar", kind: "break", slug: "break", start: "12:15", end: "12:15", soort: "pouse",
        title: "Klaar met Gasvryheid vir vandag. Skerms af 21:30.", detail: "" }
    ],
    "2026-11-05": [
      { suffix: "opstaan", kind: "break", slug: "break", start: "07:30", end: "08:00", soort: "pouse",
        title: "Opstaan, ontbyt", detail: "" },
      { suffix: "gas-e", kind: "rooi", slug: "gasvryheid", start: "08:00", end: "09:00", soort: "skrif", punte: 60,
        title: "Gasvryheid: DBE Mei/Junie 2023, afdeling A en B (Vraag 1 en 2), getimed (60 punte, 60 min)",
        detail: "Kortvrae oor al die onderwerpe: die vinnigste punte. Die memo sluit eers oop as die tyd om is.",
        werk: { tipe: "vrae", id: "dbe-2023-jun-gas", nrs: [1, 2] } },
      { suffix: "merk-gas-e", kind: "rooi", slug: "gasvryheid", start: "09:00", end: "09:25", soort: "merk",
        title: "Merk Gasvryheid Vraag 1 en 2 met die DBE-memo (Mei/Junie 2023)", detail: "",
        werk: { tipe: "vrae", id: "dbe-2023-jun-gas", nrs: [1, 2] } },
      { suffix: "foutlog-gas", kind: "rooi", slug: "gasvryheid", start: "09:40", end: "10:25", soort: "herdoen",
        title: "Gasvryheid: herdoen die top-5 foute uit al vier proewe (afdeling C en D eerste)", detail: "" },
      { suffix: "tas", kind: "rooi", slug: "gasvryheid", start: "10:30", end: "10:45", soort: "voor-eksamen",
        title: "Gasvryheid: tas pak vir môre", detail: "ID, toelatingsbrief, penne. Slaap vroeg." },
      { suffix: "klaar", kind: "break", slug: "break", start: "10:45", end: "10:45", soort: "pouse",
        title: "Klaar met Gasvryheid. Skerms af 21:00, bed 21:30.", detail: "" }
    ],
    "2026-11-06": [
      { suffix: "opstaan", kind: "break", slug: "break", start: "08:00", end: "08:30", soort: "pouse",
        title: "Opstaan, ontbyt", detail: "" },
      { suffix: "laaste-kyk", kind: "rooi", slug: "gasvryheid", start: "09:00", end: "09:20", soort: "voor-eksamen",
        title: "Gasvryheid: laaste kyk aan jou top-5 foute (net lees)", detail: "Geen nuwe werk nie." },
      { suffix: "rus", kind: "break", slug: "break", start: "09:20", end: "13:00", soort: "pouse",
        title: "Rus en middagete (eet voor 13:00)", detail: "" },
      { suffix: "eksamen", kind: "break", slug: "break", start: "14:00", end: "17:00", soort: "pouse",
        title: "GASVRYHEIDSTUDIE-EKSAMEN (skool) 14:00-17:00", detail: "200 punte, 3 uur. Sterkte!" },
      { suffix: "klaar", kind: "break", slug: "break", start: "17:00", end: "17:00", soort: "pouse",
        title: "Klaar. Skerms af 21:30.", detail: "" }
    ],
    /* ---- 30 Okt (Hanno: "bou dit", LL-02/LL-23): 7-20 Nov. Afrikaans V1 (Wo 11 Nov 09:00, 70 punte, 2 u), Engels V2
       (Do 19 Nov 09:00, 70, 2½ u) en Afrikaans V2 (Vr 20 Nov 09:00, 80, 2½ u). Elke werkblok het 'n amptelike DBE-vraestel
       (katalogus, 30 Okt nagegaan). Werke (Hanno, 30 Okt): Afr roman Onderwêreld; Afr drama ONGEVERIFIEER (hy kies die
       drama wat hy in die klas gedoen het); Engels Macbeth (V3), kortverhale (V5), poësie (V6): op die dag kies hy 2. ---- */
    "2026-11-07": [
      { suffix: "opstaan", kind: "break", slug: "break", start: "08:00", end: "08:30", soort: "pouse",
        title: "Opstaan, ontbyt", detail: "" },
      { suffix: "afr1-a", kind: "rooi", slug: "afrikaans", start: "08:30", end: "10:30", soort: "skrif", punte: 70,
        title: "Afrikaans V1 proef 1: DBE Mei/Junie 2026, volledige vraestel (70 punte, 2 uur)",
        detail: "Tydindeling van die vraestel self: A leesbegrip 50 min, B opsomming 30 min, C taal 40 min. Die memo sluit eers oop as die tyd om is.",
        werk: { tipe: "vraestel", id: "dbe-2026-jun-afr-v1" } },
      { suffix: "merk-afr1-a", kind: "rooi", slug: "afrikaans", start: "10:45", end: "11:30", soort: "merk",
        title: "Merk Afrikaans V1-proef 1 met die DBE-memo (Mei/Junie 2026)", detail: "Skryf jou punt per afdeling (A/B/C) neer.",
        werk: { tipe: "vraestel", id: "dbe-2026-jun-afr-v1" } },
      { suffix: "klaar", kind: "break", slug: "break", start: "11:30", end: "11:30", soort: "pouse",
        title: "Klaar. Skerms af 21:30.", detail: "" }
    ],
    "2026-11-08": [
      { suffix: "opstaan", kind: "break", slug: "break", start: "08:30", end: "09:00", soort: "pouse",
        title: "Opstaan, ontbyt", detail: "" },
      { suffix: "afr1-b", kind: "rooi", slug: "afrikaans", start: "09:00", end: "10:10", soort: "skrif", punte: 40,
        title: "Afrikaans V1: DBE November 2025, Vraag 2 tot 5 (opsomming + taal), getimed (40 punte, 70 min)",
        detail: "Opsomming 30 min, taal 40 min. Die memo sluit eers oop as die tyd om is.",
        werk: { tipe: "vrae", id: "dbe-2025-nov-afr-v1", nrs: [2, 3, 4, 5] } },
      { suffix: "merk-afr1-b", kind: "rooi", slug: "afrikaans", start: "10:20", end: "10:50", soort: "merk",
        title: "Merk Afrikaans V1 Vraag 2 tot 5 met die DBE-memo (November 2025)", detail: "",
        werk: { tipe: "vrae", id: "dbe-2025-nov-afr-v1", nrs: [2, 3, 4, 5] } },
      { suffix: "klaar", kind: "break", slug: "break", start: "10:50", end: "10:50", soort: "pouse",
        title: "Klaar. Skerms af 21:30.", detail: "" }
    ],
    "2026-11-09": [
      { suffix: "opstaan", kind: "break", slug: "break", start: "07:30", end: "08:00", soort: "pouse",
        title: "Opstaan, ontbyt", detail: "" },
      { suffix: "afr1-c", kind: "rooi", slug: "afrikaans", start: "08:00", end: "10:00", soort: "skrif", punte: 70,
        title: "Afrikaans V1 proef 2: DBE Mei/Junie 2025, volledige vraestel (70 punte, 2 uur)",
        detail: "A 50 min, B 30 min, C 40 min. Die memo sluit eers oop as die tyd om is.",
        werk: { tipe: "vraestel", id: "dbe-2025-jun-afr-v1" } },
      { suffix: "merk-afr1-c", kind: "rooi", slug: "afrikaans", start: "10:15", end: "11:00", soort: "merk",
        title: "Merk Afrikaans V1-proef 2 met die DBE-memo (Mei/Junie 2025)", detail: "Vergelyk per afdeling met proef 1.",
        werk: { tipe: "vraestel", id: "dbe-2025-jun-afr-v1" } },
      { suffix: "klaar", kind: "break", slug: "break", start: "11:00", end: "11:00", soort: "pouse",
        title: "Klaar. Skerms af 21:30.", detail: "" }
    ],
    "2026-11-10": [
      { suffix: "opstaan", kind: "break", slug: "break", start: "07:30", end: "08:00", soort: "pouse",
        title: "Opstaan, ontbyt", detail: "" },
      { suffix: "afr1-d", kind: "rooi", slug: "afrikaans", start: "08:00", end: "08:50", soort: "skrif", punte: 30,
        title: "Afrikaans V1: DBE November 2024, Vraag 1 (leesbegrip), getimed (30 punte, 50 min)",
        detail: "Die memo sluit eers oop as die tyd om is.",
        werk: { tipe: "vrae", id: "dbe-2024-nov-afr-v1", nrs: [1] } },
      { suffix: "merk-afr1-d", kind: "rooi", slug: "afrikaans", start: "09:00", end: "09:25", soort: "merk",
        title: "Merk Afrikaans V1 Vraag 1 met die DBE-memo (November 2024)", detail: "",
        werk: { tipe: "vrae", id: "dbe-2024-nov-afr-v1", nrs: [1] } },
      { suffix: "afr1-e", kind: "rooi", slug: "afrikaans", start: "09:40", end: "10:10", soort: "skrif", punte: 10,
        title: "Afrikaans V1: DBE November 2024, Vraag 2 (opsomming), getimed (10 punte, 30 min)",
        detail: "Die memo sluit eers oop as die tyd om is.",
        werk: { tipe: "vrae", id: "dbe-2024-nov-afr-v1", nrs: [2] } },
      { suffix: "merk-afr1-e", kind: "rooi", slug: "afrikaans", start: "10:10", end: "10:25", soort: "merk",
        title: "Merk Afrikaans V1 Vraag 2 met die DBE-memo (November 2024)", detail: "",
        werk: { tipe: "vrae", id: "dbe-2024-nov-afr-v1", nrs: [2] } },
      { suffix: "tas", kind: "rooi", slug: "afrikaans", start: "10:40", end: "10:55", soort: "voor-eksamen",
        title: "Afrikaans V1: tas pak vir môre en lees jou top-3 foute uit die vier proewe", detail: "ID, toelatingsbrief, penne. Slaap vroeg." },
      { suffix: "klaar", kind: "break", slug: "break", start: "10:55", end: "10:55", soort: "pouse",
        title: "Klaar. Skerms af 21:00, bed 21:30.", detail: "" }
    ],
    "2026-11-11": [
      { suffix: "opstaan", kind: "break", slug: "break", start: "07:00", end: "07:30", soort: "pouse",
        title: "Opstaan, ontbyt", detail: "" },
      { suffix: "laaste-kyk", kind: "rooi", slug: "afrikaans", start: "07:30", end: "07:45", soort: "voor-eksamen",
        title: "Afrikaans V1: laaste kyk aan jou top-3 foute (net lees)", detail: "Tydindeling: A 50 min, B 30 min, C 40 min. Geen nuwe werk nie." },
      { suffix: "eksamen", kind: "break", slug: "break", start: "09:00", end: "11:00", soort: "pouse",
        title: "AFRIKAANS HT V1-EKSAMEN (skool) 09:00-11:00", detail: "70 punte, 2 uur. Sterkte!" },
      { suffix: "klaar", kind: "break", slug: "break", start: "11:00", end: "11:00", soort: "pouse",
        title: "Klaar. Môre begin letterkunde: Engels V2 (19 Nov) en Afrikaans V2 (20 Nov).", detail: "" }
    ],
    "2026-11-12": [
      { suffix: "opstaan", kind: "break", slug: "break", start: "07:30", end: "08:00", soort: "pouse",
        title: "Opstaan, ontbyt", detail: "" },
      { suffix: "eng2-a", kind: "geel", slug: "engels", start: "08:00", end: "09:15", soort: "skrif", punte: 35,
        title: "English P2: DBE Mei/Junie 2026, Vraag 3 (Macbeth), getimed (35 punte, 75 min)",
        detail: "Answer the questions on BOTH extracts. Die memo sluit eers oop as die tyd om is.",
        werk: { tipe: "vrae", id: "dbe-2026-jun-eng-v2", nrs: [3] } },
      { suffix: "merk-eng2-a", kind: "geel", slug: "engels", start: "09:30", end: "10:00", soort: "merk",
        title: "Merk English P2 Vraag 3 (Macbeth) met die DBE-memo (Mei/Junie 2026)", detail: "",
        werk: { tipe: "vrae", id: "dbe-2026-jun-eng-v2", nrs: [3] } },
      { suffix: "afr2-a", kind: "rooi", slug: "afrikaans", start: "10:15", end: "10:35", soort: "skrif", punte: 10,
        title: "Afrikaans V2: DBE Mei/Junie 2026, Vraag 5 (ongesiene gedig, verpligtend), getimed (10 punte, 20 min)",
        detail: "Die memo sluit eers oop as die tyd om is.",
        werk: { tipe: "vrae", id: "dbe-2026-jun-afr-v2", nrs: [5] } },
      { suffix: "merk-afr2-a", kind: "rooi", slug: "afrikaans", start: "10:35", end: "10:50", soort: "merk",
        title: "Merk Afrikaans V2 Vraag 5 met die DBE-memo (Mei/Junie 2026)", detail: "",
        werk: { tipe: "vrae", id: "dbe-2026-jun-afr-v2", nrs: [5] } },
      { suffix: "klaar", kind: "break", slug: "break", start: "10:50", end: "10:50", soort: "pouse",
        title: "Klaar. Skerms af 21:30.", detail: "" }
    ],
    "2026-11-13": [
      { suffix: "opstaan", kind: "break", slug: "break", start: "07:30", end: "08:00", soort: "pouse",
        title: "Opstaan, ontbyt", detail: "" },
      { suffix: "afr2-b", kind: "rooi", slug: "afrikaans", start: "08:00", end: "08:55", soort: "skrif", punte: 25,
        title: "Afrikaans V2: DBE Mei/Junie 2026, Vraag 7 (Onderwêreld, kontekstueel), getimed (25 punte, 55 min)",
        detail: "Die memo sluit eers oop as die tyd om is.",
        werk: { tipe: "vrae", id: "dbe-2026-jun-afr-v2", nrs: [7] } },
      { suffix: "merk-afr2-b", kind: "rooi", slug: "afrikaans", start: "09:10", end: "09:40", soort: "merk",
        title: "Merk Afrikaans V2 Vraag 7 met die DBE-memo (Mei/Junie 2026)", detail: "",
        werk: { tipe: "vrae", id: "dbe-2026-jun-afr-v2", nrs: [7] } },
      { suffix: "eng2-b", kind: "geel", slug: "engels", start: "10:00", end: "11:15", soort: "skrif", punte: 35,
        title: "English P2: DBE Mei/Junie 2026, Vraag 5 (short stories 5.1 + 5.2), getimed (35 punte, 75 min)",
        detail: "Answer the questions on BOTH extracts. Die memo sluit eers oop as die tyd om is.",
        werk: { tipe: "vrae", id: "dbe-2026-jun-eng-v2", nrs: [5] } },
      { suffix: "merk-eng2-b", kind: "geel", slug: "engels", start: "11:30", end: "12:00", soort: "merk",
        title: "Merk English P2 Vraag 5 met die DBE-memo (Mei/Junie 2026)", detail: "",
        werk: { tipe: "vrae", id: "dbe-2026-jun-eng-v2", nrs: [5] } },
      { suffix: "klaar", kind: "break", slug: "break", start: "12:00", end: "12:00", soort: "pouse",
        title: "Klaar. Skerms af 21:30.", detail: "" }
    ],
    "2026-11-14": [
      { suffix: "opstaan", kind: "break", slug: "break", start: "08:00", end: "08:30", soort: "pouse",
        title: "Opstaan, ontbyt", detail: "" },
      { suffix: "eng2-c", kind: "geel", slug: "engels", start: "08:30", end: "11:00", soort: "skrif", punte: 70,
        title: "English P2 proef: DBE Mei/Junie 2025, Vraag 3 (Macbeth) en Vraag 6 (poetry), 2½ uur (70 punte)",
        detail: "Soos die eksamen: twee afdelings, ±75 min elk. Die memo sluit eers oop as die tyd om is.",
        werk: { tipe: "vrae", id: "dbe-2025-jun-eng-v2", nrs: [3, 6] } },
      { suffix: "merk-eng2-c", kind: "geel", slug: "engels", start: "11:15", end: "12:00", soort: "merk",
        title: "Merk English P2-proef (Vraag 3 en 6) met die DBE-memo (Mei/Junie 2025)", detail: "",
        werk: { tipe: "vrae", id: "dbe-2025-jun-eng-v2", nrs: [3, 6] } },
      { suffix: "klaar", kind: "break", slug: "break", start: "12:00", end: "12:00", soort: "pouse",
        title: "Klaar. Skerms af 21:30.", detail: "" }
    ],
    "2026-11-15": [
      { suffix: "opstaan", kind: "break", slug: "break", start: "08:30", end: "09:00", soort: "pouse",
        title: "Opstaan, ontbyt", detail: "" },
      { suffix: "afr2-c", kind: "rooi", slug: "afrikaans", start: "09:00", end: "09:55", soort: "skrif", punte: 25,
        title: "Afrikaans V2: DBE November 2025, Vraag 6 (Onderwêreld, opstel 400-450 woorde), getimed (25 punte, 55 min)",
        detail: "Die memo sluit eers oop as die tyd om is.",
        werk: { tipe: "vrae", id: "dbe-2025-nov-afr-v2", nrs: [6] } },
      { suffix: "merk-afr2-c", kind: "rooi", slug: "afrikaans", start: "10:10", end: "10:40", soort: "merk",
        title: "Merk Afrikaans V2 Vraag 6 met die DBE-memo (November 2025)", detail: "",
        werk: { tipe: "vrae", id: "dbe-2025-nov-afr-v2", nrs: [6] } },
      { suffix: "afr2-d", kind: "rooi", slug: "afrikaans", start: "10:50", end: "11:10", soort: "skrif", punte: 10,
        title: "Afrikaans V2: DBE November 2025, Vraag 5 (ongesiene gedig, verpligtend), getimed (10 punte, 20 min)",
        detail: "Die memo sluit eers oop as die tyd om is.",
        werk: { tipe: "vrae", id: "dbe-2025-nov-afr-v2", nrs: [5] } },
      { suffix: "merk-afr2-d", kind: "rooi", slug: "afrikaans", start: "11:10", end: "11:25", soort: "merk",
        title: "Merk Afrikaans V2 Vraag 5 met die DBE-memo (November 2025)", detail: "",
        werk: { tipe: "vrae", id: "dbe-2025-nov-afr-v2", nrs: [5] } },
      { suffix: "klaar", kind: "break", slug: "break", start: "11:25", end: "11:25", soort: "pouse",
        title: "Klaar. Skerms af 21:30.", detail: "" }
    ],
    "2026-11-16": [
      { suffix: "opstaan", kind: "break", slug: "break", start: "07:30", end: "08:00", soort: "pouse",
        title: "Opstaan, ontbyt", detail: "" },
      { suffix: "afr2-e", kind: "rooi", slug: "afrikaans", start: "08:00", end: "10:30", soort: "skrif", punte: 80,
        title: "Afrikaans V2 proef: DBE Mei/Junie 2025, volledige vraestel (80 punte, 2½ uur)",
        detail: "Twee gesiene gedigte (V1-4), die ongesiene gedig (V5, verplig), Onderwêreld (V6 of V7) en die drama wat jy in die klas gedoen het (Krismis van Map Jacobs V14/15 of Mis V16/17): een opstel en een kontekstueel. A 40, B 55, C 55 min. Die memo sluit eers oop as die tyd om is.",
        werk: { tipe: "vraestel", id: "dbe-2025-jun-afr-v2" } },
      { suffix: "merk-afr2-e", kind: "rooi", slug: "afrikaans", start: "10:45", end: "11:45", soort: "merk",
        title: "Merk Afrikaans V2-proef met die DBE-memo (Mei/Junie 2025)", detail: "Skryf jou punt per vraag neer.",
        werk: { tipe: "vraestel", id: "dbe-2025-jun-afr-v2" } },
      { suffix: "klaar", kind: "break", slug: "break", start: "11:45", end: "11:45", soort: "pouse",
        title: "Klaar. Skerms af 21:30.", detail: "" }
    ],
    "2026-11-17": [
      { suffix: "opstaan", kind: "break", slug: "break", start: "07:30", end: "08:00", soort: "pouse",
        title: "Opstaan, ontbyt", detail: "" },
      { suffix: "eng2-d", kind: "geel", slug: "engels", start: "08:00", end: "10:30", soort: "skrif", punte: 70,
        title: "English P2 proef: DBE November 2024, Vraag 5 (short stories) en Vraag 6 (poetry), 2½ uur (70 punte)",
        detail: "Soos die eksamen: twee afdelings, ±75 min elk. Die memo sluit eers oop as die tyd om is.",
        werk: { tipe: "vrae", id: "dbe-2024-nov-eng-v2", nrs: [5, 6] } },
      { suffix: "merk-eng2-d", kind: "geel", slug: "engels", start: "10:45", end: "11:30", soort: "merk",
        title: "Merk English P2-proef (Vraag 5 en 6) met die DBE-memo (November 2024)", detail: "",
        werk: { tipe: "vrae", id: "dbe-2024-nov-eng-v2", nrs: [5, 6] } },
      { suffix: "afr2-h", kind: "rooi", slug: "afrikaans", start: "14:00", end: "14:55", soort: "skrif", punte: 25,
        title: "Afrikaans V2: DBE November 2025, Vraag 7 (Onderwêreld, kontekstueel), getimed (25 punte, 55 min)",
        detail: "Die memo sluit eers oop as die tyd om is.",
        werk: { tipe: "vrae", id: "dbe-2025-nov-afr-v2", nrs: [7] } },
      { suffix: "merk-afr2-h", kind: "rooi", slug: "afrikaans", start: "15:05", end: "15:35", soort: "merk",
        title: "Merk Afrikaans V2 Vraag 7 met die DBE-memo (November 2025)", detail: "",
        werk: { tipe: "vrae", id: "dbe-2025-nov-afr-v2", nrs: [7] } },
      { suffix: "klaar", kind: "break", slug: "break", start: "15:35", end: "15:35", soort: "pouse",
        title: "Klaar. Skerms af 21:30.", detail: "" }
    ],
    "2026-11-18": [
      { suffix: "opstaan", kind: "break", slug: "break", start: "07:30", end: "08:00", soort: "pouse",
        title: "Opstaan, ontbyt", detail: "" },
      { suffix: "eng2-e", kind: "geel", slug: "engels", start: "08:00", end: "09:15", soort: "skrif", punte: 35,
        title: "English P2: DBE November 2024, Vraag 3 (Macbeth), getimed (35 punte, 75 min)",
        detail: "Die memo sluit eers oop as die tyd om is.",
        werk: { tipe: "vrae", id: "dbe-2024-nov-eng-v2", nrs: [3] } },
      { suffix: "merk-eng2-e", kind: "geel", slug: "engels", start: "09:30", end: "10:00", soort: "merk",
        title: "Merk English P2 Vraag 3 met die DBE-memo (November 2024)", detail: "",
        werk: { tipe: "vrae", id: "dbe-2024-nov-eng-v2", nrs: [3] } },
      { suffix: "afr2-i", kind: "rooi", slug: "afrikaans", start: "11:00", end: "11:55", soort: "skrif", punte: 25,
        title: "Afrikaans V2: DBE Mei/Junie 2026, Vraag 6 (Onderwêreld, opstel 400-450 woorde), getimed (25 punte, 55 min)",
        detail: "Die memo sluit eers oop as die tyd om is.",
        werk: { tipe: "vrae", id: "dbe-2026-jun-afr-v2", nrs: [6] } },
      { suffix: "merk-afr2-i", kind: "rooi", slug: "afrikaans", start: "12:05", end: "12:35", soort: "merk",
        title: "Merk Afrikaans V2 Vraag 6 met die DBE-memo (Mei/Junie 2026)", detail: "",
        werk: { tipe: "vrae", id: "dbe-2026-jun-afr-v2", nrs: [6] } },
      { suffix: "tas", kind: "geel", slug: "engels", start: "12:45", end: "13:00", soort: "voor-eksamen",
        title: "Engels V2: kies nou jou twee afdelings, pak jou tas en lees jou top-3 foute", detail: "ID, toelatingsbrief, penne. Slaap vroeg." },
      { suffix: "klaar", kind: "break", slug: "break", start: "13:00", end: "13:00", soort: "pouse",
        title: "Klaar. Skerms af 21:00, bed 21:30.", detail: "" }
    ],
    "2026-11-19": [
      { suffix: "opstaan", kind: "break", slug: "break", start: "07:00", end: "07:30", soort: "pouse",
        title: "Opstaan, ontbyt", detail: "" },
      { suffix: "laaste-kyk", kind: "geel", slug: "engels", start: "07:30", end: "07:45", soort: "voor-eksamen",
        title: "Engels V2: laaste kyk aan jou top-3 foute (net lees)", detail: "Twee afdelings, ±75 min elk. Geen nuwe werk nie." },
      { suffix: "eksamen", kind: "break", slug: "break", start: "09:00", end: "11:30", soort: "pouse",
        title: "ENGELS EAT V2-EKSAMEN (skool) 09:00-11:30", detail: "70 punte, 2½ uur. Sterkte!" },
      { suffix: "afr2-f", kind: "rooi", slug: "afrikaans", start: "14:00", end: "14:55", soort: "skrif", punte: 25,
        title: "Afrikaans V2: DBE November 2024, Vraag 7 (Onderwêreld, kontekstueel), getimed (25 punte, 55 min)",
        detail: "Die memo sluit eers oop as die tyd om is.",
        werk: { tipe: "vrae", id: "dbe-2024-nov-afr-v2", nrs: [7] } },
      { suffix: "merk-afr2-f", kind: "rooi", slug: "afrikaans", start: "15:05", end: "15:35", soort: "merk",
        title: "Merk Afrikaans V2 Vraag 7 met die DBE-memo (November 2024)", detail: "",
        werk: { tipe: "vrae", id: "dbe-2024-nov-afr-v2", nrs: [7] } },
      { suffix: "tas", kind: "rooi", slug: "afrikaans", start: "15:45", end: "16:00", soort: "voor-eksamen",
        title: "Afrikaans V2: pak jou tas en lees jou top-3 foute", detail: "ID, toelatingsbrief, penne. Slaap vroeg." },
      { suffix: "klaar", kind: "break", slug: "break", start: "16:00", end: "16:00", soort: "pouse",
        title: "Klaar. Skerms af 21:00, bed 21:30.", detail: "" }
    ],
    "2026-11-20": [
      { suffix: "opstaan", kind: "break", slug: "break", start: "07:00", end: "07:30", soort: "pouse",
        title: "Opstaan, ontbyt", detail: "" },
      { suffix: "laaste-kyk", kind: "rooi", slug: "afrikaans", start: "07:30", end: "07:45", soort: "voor-eksamen",
        title: "Afrikaans V2: laaste kyk aan jou top-3 foute (net lees)", detail: "A 40 min, B 55 min, C 55 min. Een opstel en een kontekstueel oor roman en drama." },
      { suffix: "eksamen", kind: "break", slug: "break", start: "09:00", end: "11:30", soort: "pouse",
        title: "AFRIKAANS HT V2-EKSAMEN (skool) 09:00-11:30", detail: "80 punte, 2½ uur. Jou laaste vraestel. Sterkte!" },
      { suffix: "klaar", kind: "break", slug: "break", start: "11:30", end: "11:30", soort: "pouse",
        title: "Klaar met matriek.", detail: "" }
    ]
  };
  if (VASTE_PLANNE[dateStr]) {
    const mins = (a, b) => {
      const [ah, am] = a.split(":").map(Number);
      const [bh, bm] = b.split(":").map(Number);
      return bh * 60 + bm - (ah * 60 + am);
    };
    /* "toets"/"merk"/"herdoen"/"opstel" is RTT-werk (rooi); "les" is ’n kort opwarm-kaart. */
    const KIND = { pouse: "break", les: "warm", "voor-eksamen": "warm" };
    const blocks = VASTE_PLANNE[dateStr].map((b) => {
      const blok = {
        id: `${dateStr}-${b.suffix}`,
        /* "voor-eksamen" is altyd opwarm (kind "warm"): Pa se oorsig ken net `kind`, nie `soort` nie, en vlag dit dan nie as GEEN POGING nie */
        kind: b.soort === "voor-eksamen" ? "warm" : b.kind || KIND[b.soort] || "rooi",
        subjectSlug: b.slug || "rtt",
        minutes: mins(b.start, b.end),
        start: b.start,
        end: b.end,
        title: b.title,
        detail: b.detail,
        soort: b.soort
      };
      if (b.punte != null) blok.punte = b.punte;
      if (b.item) blok.item = b.item;
      if (b.werk) blok.werk = b.werk;
      if (b.werk_ekstra) blok.werk_ekstra = b.werk_ekstra;
      if (b.mcq) blok.mcq = b.mcq;
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
