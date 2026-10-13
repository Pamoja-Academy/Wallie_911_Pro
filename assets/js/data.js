/* Wallie_911_Pro — vakdata & low-hanging fruit */
window.WALLIE = window.WALLIE || {};

/* NSC-eksamenrooster: Ma 12 Okt is die laaste voorbereidingsdag (Wallie se aanloopdag).
   Die EERSTE EGTE VRAESTEL is die RTT/CAT-praktiese eksamen op Di 13 Okt 2026 — dáárteen tel die klok af.
   (Begintyd 09:00 is die gewone NSC-begintyd; pas EXAM_KICKOFF aan as die rooster iets anders sê.) */
WALLIE.EXAM_PERIOD_START = "2026-10-13";
WALLIE.EXAM_START = "2026-10-13";
WALLIE.EXAM_KICKOFF = "2026-10-13T09:00:00";
WALLIE.EXAM_LABEL = "Eerste vraestel · RTT (CAT) praktiese eksamen";
WALLIE.EXAM_NOTE = "Ma 12 Okt is die laaste voorbereidingsdag";

WALLIE.SUBJECTS = [
  {
    slug: "gasvryheid",
    naam: "Gasvryheidstudie",
    prelim: 27,
    jaar: 45,
    teiken: 60,
    prioriteit: 1,
    zone: "rooi",
    fokus: "Begrip eers — nie inkram nie. Konsep → toepassing.",
    lowHanging: [
      "Lees elke vraag se merkpunte vóór jy skryf",
      "Definisies: 1 sin + 1 voorbeeld (nie paragraaf-essay)",
      "Veiligheid / higiëne kortfeite uit memo-formaat",
      "Kies-vrae: elimineer 2 opsies eers",
      "Hertoets gister se 5 foute toe-boek"
    ]
  },
  {
    slug: "afrikaans",
    naam: "Afrikaans Huistaal",
    prelim: 39,
    jaar: 39,
    teiken: 60,
    prioriteit: 2,
    zone: "rooi",
    fokus: "Moenie vermy nie. Kort geforseerde blokke + ou vrae + rubrieke.",
    lowHanging: [
      "Taalstrukture: 15 min spoedboor (geen ‘eie notas only’)",
      "Lees-die-vraag protokol: onderstreep opdragwoorde",
      "Rubriek vir opstel/transaksioneel oop langs jou",
      "Ou vraestel: een afdeling volledig + memo",
      "Lys 10 foute wat jy altyd maak — oefen elkeen"
    ]
  },
  {
    slug: "rtt",
    naam: "RTT (CAT)",
    prelim: 37,
    jaar: 46,
    teiken: 60,
    prioriteit: 3,
    zone: "rooi",
    fokus: "MOET DIE WERK INSIT — teorie + praktiese checklist.",
    lowHanging: [
      "Teorie kortvrae uit vorige papers (1 uur)",
      "Spreadsheets: formules wat altyd kom",
      "Database: terms + 1 praktiese taak",
      "Word/Docs: mail merge / styles checklist",
      "Sit tyd: 40 min teorie + 40 min praktyk"
    ]
  },
  {
    slug: "engels",
    naam: "Engels EAT",
    prelim: 50,
    jaar: 56,
    teiken: 70,
    prioriteit: 5,
    zone: "geel",
    fokus: "Letterkunde 38% was die gat. Taal hou; lit + writing opbou.",
    lowHanging: [
      "Literature: quotes + theme vir 2 setwerke",
      "Unseen poetry: structure checklist",
      "Creative writing: plan 5 min vóór skryf",
      "Language paper: error correction spoedboor",
      "Timed literature paragraph (15 min)"
    ]
  },
  {
    slug: "toerisme",
    naam: "Toerisme",
    prelim: 61,
    jaar: 61,
    teiken: 60,
    prioriteit: 6,
    zone: "geel",
    fokus: "Dom foute + klein hoofstukke. Lees vrae deeglik.",
    lowHanging: [
      "Lees elke vraag 2×; onderstreep ‘nie’ / ‘behalwe’",
      "Klein hoofstukke: 20 min flash-retrieval",
      "Kaart / aantreklikhede: 10 feite toe-boek",
      "Berekeninge / buitelandse wissel — 5 sommen",
      "Volledige ou paper-afdeling + foutlog"
    ]
  },
  {
    slug: "wiskgelett",
    naam: "Wiskundige Geletterdheid",
    prelim: 66,
    jaar: 66,
    teiken: 80,
    prioriteit: 7,
    zone: "groen",
    fokus: "Daagliks oefen. Teiken 80% — nie ‘genoeg’ by 66%.",
    lowHanging: [
      "Finansies: rente / huurkoop / begroting",
      "Datahantering: gemiddeld, mediaan, grafieke",
      "Kaarte & skale: 5 vrae",
      "Meetkunde / area / volume spoedstel",
      "Een gemengde ou paper onder tyd"
    ]
  }
];

/* Hulp / FAQ per vak — kort antwoorde op die vrae wat Wallie die meeste vra. */
WALLIE.FAQ = {
  gasvryheid: [
    ["Hoe leer ek sonder om te blok-inkram?", "Verduidelik elke konsep in een sin en gee een voorbeeld. Kan jy dit nie, gaan terug na die les — dan eers die oefenvraag."],
    ["Hoeveel moet ek skryf by ’n definisie?", "Een sin + een voorbeeld. Kyk na die merkpunte: een punt per feit, nie per paragraaf nie."],
    ["Wat doen ek met kies-vrae wat ek nie ken nie?", "Skrap eers twee opsies wat sekerlik verkeerd is, kies dan uit die oorblywende twee. Moet nooit ’n blanko los nie."]
  ],
  afrikaans: [
    ["Hoe begin ek met die opstel of transaksionele teks?", "Skryf eers ’n 5-minute plan (aanhef, 3 punte, slot). Hou die rubriek langsaan en kyk aan die einde of elke rubriek-punt gedek is."],
    ["Wat beteken die opdragwoorde in ’n vraag?", "Onderstreep dit: ‘noem’ = kort lys, ‘verduidelik’ = rede gee, ‘bespreek’ = kante en voorbeelde. Die woord bepaal hoeveel jy skryf."],
    ["Hoe oefen ek taalstrukture vinnig?", "15 minute spoedboor: een onderwerp (bv. indirekte rede of lydende vorm), 10 sinne, nasien teen die memo, foute in die Foutbank."]
  ],
  rtt: [
    ["Wat is die slimste volgorde vir die praktiese eksamen?", "Lees die hele vraestel, doen eers die take wat jy seker ken (Word, sigblad), los die moeilike databasis-taak vir laaste, en stoor gereeld."],
    ["Watter sigblad-formules kom altyd?", "SOM, GEMIDDELDE, ALS, SOEKOP/VLOOKUP, TELALS en absolute verwysings ($A$1). Oefen elkeen met ’n eie voorbeeld."],
    ["Hoe verdeel ek my oefentyd?", "40 minute teorie (kortvrae uit ou vraestelle) en 40 minute praktyk, elke dag."]
  ],
  engels: [
    ["Hoe verbeter ek my letterkunde-punte?", "Leer vir elke setwerk 3–4 kort aanhalings plus die tema wat dit wys. Skryf dan ’n tydgemete paragraaf van 15 minute (PEEL)."],
    ["Hoe lees ek ’n onbekende gedig?", "Titel → wie praat → toon → 2 stylfigure → tema. Skryf die kontrolelys bo-aan jou antwoord."],
    ["Wat as ek nie weet wat om te skryf nie?", "Neem 5 minute: kies ’n invalshoek, skryf 4 kernpunte, en begin eers dan met skryf."]
  ],
  toerisme: [
    ["Hoe vermy ek dom foute?", "Lees elke vraag twee keer en onderstreep ‘nie’ en ‘behalwe’. Kyk voor jy indien na elke merkpunt-getal."],
    ["Hoe onthou ek klein hoofstukke?", "20 minute flash-retrieval: bedek die antwoord, sê dit hardop, kyk. Wat jy mis, gaan in die Foutbank."],
    ["Hoe werk ek buitelandse wisselkoers uit?", "Vermenigvuldig met die koers as jy van rand na vreemde geld gaan; deel as jy van vreemde geld na rand gaan. Kyk of die antwoord logies is."]
  ],
  wiskgelett: [
    ["Waar begin ek met finansiële vrae?", "Skryf die gegewens uit die teks eers uit, kies dan die formule (rente, BTW, huurkoop) en wys elke stap vir deelpunte."],
    ["Hoe gaan ek te werk met gemiddeld, mediaan en modus?", "Orden die getalle van klein na groot. Mediaan = middelste getal, modus = die meeste, gemiddeld = som ÷ aantal."],
    ["Hoe lees ek kaarte en skale?", "Meet die afstand op die kaart, vermenigvuldig met die skaal en skakel om na die regte eenhede (cm → km)."]
  ]
};

/* Ou rekords van ’n vak wat nie meer deel van die app is nie, word nooit uitgevee nie — net nie vertoon nie. */
WALLIE.isVerborgeVak = function isVerborgeVak(slug) {
  return slug === "lo";
};

WALLIE.DEFAULT_PIN = "9110";
