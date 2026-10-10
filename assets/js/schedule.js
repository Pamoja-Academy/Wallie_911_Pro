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

  /* Plan v3 (Hanno, 10 Okt): So 11 en Ma 12 Okt is RTT V1-fokusdae voor die praktiese eksamen (Di 13 Okt).
     Geen Wiskundige Geletterdheid, Gasvryheid, Afrikaans of Toerisme op hierdie twee dae nie.
     Een RTT V1-blok per dag dra die `${dateStr}-geel`-id, sodat completedBlocks stabiel bly. */
  const VASTE_PLANNE = {
    "2026-10-11": [
      ["geel", "rooi", "rtt", "09:00", "12:00", "RTT V1 — volledig getimed (DBE Junie 2026 V1, met datalêers)", "Eksamentoestande: 3 uur, Praktiese modus aan, stoor gereeld. Gebruik die DBE-datalêers."],
      ["middag", "break", "break", "12:00", "13:00", "Middagete en rus", "Weg van die skerm. Eet, beweeg, drink water."],
      ["merk", "rooi", "rtt", "13:00", "14:30", "RTT V1 — merk met die nasienriglyn", "Merk eerlik met die DBE-nasienriglyn. Elke fout gaan in die Foutbank."],
      ["db-html", "rooi", "rtt", "15:00", "16:15", "RTT V1 — DBE Nov 2024 V1: databasis (V5) en HTML (V6), getimed", "Getimed soos in die eksamen. Merk daarna met die nasienriglyn."],
      ["oefenvrae", "rooi", "rtt", "16:30", "17:00", "Oefenvrae: RTT V1 (30 items)", "Kies items in Oefenvrae (RTT V1) wat jy nog nie reg het nie."],
      ["engels", "geel", "engels", "17:00", "17:30", "Engels V3 — lees DBE Nov 2025 EAT V3 en die rubrieke", "Lees die vraestel en rubrieke; let op wat elke teksoort vra."],
      ["slot", "slot", "foutbank", "17:35", "17:55", "Foutlog + môre se plan", "Top-3 foute van vandag. Kyk môre se blokke."]
    ],
    "2026-10-12": [
      ["geel", "rooi", "rtt", "09:00", "10:30", "RTT V1 — Woordverwerking (V1 en V2) uit DBE Nov 2023 V1, getimed", "Getimed, Praktiese modus aan. Merk daarna met die nasienriglyn."],
      ["sigblad", "rooi", "rtt", "10:45", "12:00", "RTT V1 — Sigblad (V3 en V4) uit DBE Junie 2025 V1, getimed en merk", "Getimed, dan merk met die nasienriglyn. Foute in die Foutbank."],
      ["middag", "break", "break", "12:00", "13:00", "Middagete en rus", "Weg van die skerm. Eet, beweeg, drink water."],
      ["db-html", "rooi", "rtt", "13:00", "14:00", "RTT V1 — Databasis (V5) en HTML (V6) uit DBE Junie 2025 V1, getimed en merk", "Getimed, dan merk met die nasienriglyn."],
      ["foutbank", "rooi", "foutbank", "14:15", "15:15", "Herdoen al die Foutbank-items van die naweek", "Doen elke foutbank-item weer, toe-boek, en merk dit eers dan as reg."],
      ["kontrolelys", "rooi", "rtt", "15:30", "16:00", "Eksamenkontrolelys", "Lêername, gereeld stoor, streekinstellings en lysskeier, Notepad++ vir HTML."],
      ["engels", "geel", "engels", "16:15", "17:00", "Engels V3 — kort stuk: transaksionele teks (DBE Junie 2026 EAT V3 Afd C)", "30 min getimed skryf, dan 15 min selfkontrole met die rubriek."],
      ["slot", "slot", "foutbank", "17:05", "17:15", "Aand: niks nuuts nie. Pak die eksamentas en slaap vroeg.", "Môre 09:00 is die RTT/CAT-praktiese. Jy is gereed."]
    ]
  };
  if (VASTE_PLANNE[dateStr]) {
    const mins = (a, b) => {
      const [ah, am] = a.split(":").map(Number);
      const [bh, bm] = b.split(":").map(Number);
      return bh * 60 + bm - (ah * 60 + am);
    };
    const blocks = VASTE_PLANNE[dateStr].map(([suffix, kind, subjectSlug, start, end, title, detail]) => ({
      id: `${dateStr}-${suffix}`,
      kind,
      subjectSlug,
      minutes: mins(start, end),
      start,
      end,
      title,
      detail
    }));
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

/** Lewendige stadium-klok tot die eerste egte vraestel (RTT/CAT praktiese, Di 13 Okt 09:00). */
WALLIE.timeUntilExam = function timeUntilExam(from = new Date()) {
  const kick = new Date(WALLIE.EXAM_KICKOFF || WALLIE.EXAM_START + "T09:00:00");
  let ms = kick - from;
  const past = ms <= 0;
  if (past) ms = 0;
  const sec = Math.floor(ms / 1000);
  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec % 86400) / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;
  return { days, hours, minutes, seconds, ms, past, kick };
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
