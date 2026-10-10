/* Pa-konsole v2 — statiese NSS-eksamenrooster Okt/Nov 2026 (net Wallie se vakke; tye SAST).
   Bron: DBE NSS-rooster soos in PLAN-v3. Geen LO nie (Wallie skryf nie LO nie). Geen punte nie. */
window.PK = window.PK || {};
PK.EXAMS = [
  { s: "rtt", n: "RTT (CAT) V1 · Prakties", at: "2026-10-13T09:00:00+02:00", dur: "3 u" },
  { s: "engels", n: "Engels EAT V3 · Skryfwerk", at: "2026-10-15T09:00:00+02:00", dur: "2½ u" },
  { s: "afrikaans", n: "Afrikaans HT V3 · Skryfwerk", at: "2026-10-20T09:00:00+02:00", dur: "3 u" },
  { s: "wiskgelett", n: "Wiskundige Geletterdheid V1", at: "2026-10-23T09:00:00+02:00", dur: "3 u" },
  { s: "wiskgelett", n: "Wiskundige Geletterdheid V2", at: "2026-10-26T09:00:00+02:00", dur: "3 u" },
  { s: "engels", n: "Engels EAT V1 · Taal", at: "2026-10-28T09:00:00+02:00", dur: "2 u" },
  { s: "rtt", n: "RTT (CAT) V2 · Teorie", at: "2026-10-29T14:00:00+02:00", dur: "3 u" },
  { s: "toerisme", n: "Toerisme", at: "2026-10-30T14:00:00+02:00", dur: "3 u" },
  { s: "gasvryheid", n: "Gasvryheidstudie", at: "2026-11-06T14:00:00+02:00", dur: "3 u" },
  { s: "afrikaans", n: "Afrikaans HT V1 · Taal", at: "2026-11-11T09:00:00+02:00", dur: "2 u" },
  { s: "engels", n: "Engels EAT V2 · Letterkunde", at: "2026-11-19T09:00:00+02:00", dur: "2½ u" },
  { s: "afrikaans", n: "Afrikaans HT V2 · Letterkunde", at: "2026-11-20T09:00:00+02:00", dur: "2½ u" }
];
/* Vak-sleutel uit 'n vry vaknaam/slug (bediener stuur name soos "RTT (CAT)", "Wiskundige Geletterdheid"). */
PK.subjectKey = function (name, slug) {
  const s = String(slug || name || "").toLowerCase();
  if (/rtt|cat|rekenaar/.test(s)) return "rtt";
  if (/wisk|math/.test(s)) return "wiskgelett";
  if (/engels|english|eat/.test(s)) return "engels";
  if (/afrik/.test(s)) return "afrikaans";
  if (/toeris|touris/.test(s)) return "toerisme";
  if (/gasvry|hospit/.test(s)) return "gasvryheid";
  return "ander";
};
PK.SUBJ = {
  rtt: { n: "RTT (CAT)", c: "--s-rtt" },
  wiskgelett: { n: "Wisk. Gel.", c: "--s-wiskgelett" },
  engels: { n: "Engels", c: "--s-engels" },
  afrikaans: { n: "Afrikaans", c: "--s-afrikaans" },
  toerisme: { n: "Toerisme", c: "--s-toerisme" },
  gasvryheid: { n: "Gasvryheid", c: "--s-gasvryheid" },
  ander: { n: "Ander", c: "--off" }
};
