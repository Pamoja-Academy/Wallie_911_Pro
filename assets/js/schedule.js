/* Daaglikse plan — Sondag 27 Sep 2026 het rugby-venster */
window.WALLIE = window.WALLIE || {};

/** Dae sedert 27 Sep 2026 — vir geel-rotasie (LO / Engels / Toerisme). */
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
  const beforeKickoff = dateStr < WALLIE.EXAM_START;
  const geelSlot = beforeKickoff
    ? geel[0]
    : geel[((WALLIE.geelDayIndex(dateStr) % geel.length) + geel.length) % geel.length];

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
      {
        id: `${dateStr}-geel`,
        kind: "geel",
        subjectSlug: geelSlot.slug,
        minutes: 55,
        start: "15:40",
        end: "16:35",
        title: `${geelSlot.naam} — scenario-aanval`,
        detail: geelSlot.fokus
      },
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
    {
      id: `${dateStr}-geel`,
      kind: "geel",
      subjectSlug: geelSlot.slug,
      minutes: 70,
      title: `${geelSlot.naam} — geel-sone`,
      detail: geelSlot.fokus
    },
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

/** Lewendige stadium-klok tot openingswedstryd (12 Okt 09:00). */
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
