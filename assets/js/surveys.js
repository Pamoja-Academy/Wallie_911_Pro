/* Dubbele survey-lus: Wallie + Pa → daaglikse verbeterings */
window.WALLIE = window.WALLIE || {};

WALLIE.SURVEY = {
  /** Wallie — na elke sessie (verpligtend, ±90 sek) */
  wallieFields: [
    {
      id: "fokus",
      label: "Hoe gefokus was jy werklik? (1 = iewers anders, 5 = voluit)",
      type: "scale",
      min: 1,
      max: 5
    },
    {
      id: "metode",
      label: "Het jy toe-boek probeer EN toe eers memo gekyk?",
      type: "choice",
      options: [
        { v: "ja", t: "Ja — toe-boek eers" },
        { v: "gedeeltelik", t: "Gedeeltelik" },
        { v: "nee", t: "Nee — ek het gelees / memo eers" }
      ]
    },
    {
      id: "moeilikheid",
      label: "Hoe moeilik was die blok?",
      type: "choice",
      options: [
        { v: "te_maklik", t: "Te maklik (verspil tyd)" },
        { v: "reg", t: "Reg vir my" },
        { v: "te_swaar", t: "Te swaar / vasgeslaan" }
      ]
    },
    {
      id: "blokkade",
      label: "Wat het jou die meeste gestop?",
      type: "choice",
      options: [
        { v: "niks", t: "Niks ernstigs" },
        { v: "vermyding", t: "Ek wou nie begin / vermyding" },
        { v: "verward", t: "Ek verstaan nie die werk" },
        { v: "moeg", t: "Moeg / konsentrasie" },
        { v: "foon", t: "Foon / afleiding" },
        { v: "tyd", t: "Te min tyd / gejaag" }
      ]
    },
    {
      id: "eerlikheid",
      label: "As Pa nou jou skryfwerk / foutlog sou nagaan — hoe eerlik was hierdie sessie?",
      type: "choice",
      options: [
        { v: "100", t: "100% — hy kan alles sien" },
        { v: "meeste", t: "Meeste was eg" },
        { v: "half", t: "Half-half" },
        { v: "swak", t: "Ek het die bal gerol" }
      ]
    },
    {
      id: "help_more",
      label: "Een ding wat môre / volgende blok beter sal maak",
      type: "text",
      placeholder: "Bv. korter blokke, meer voorbeelde, Pa check mid-sessie…"
    }
  ],

  /** Pa — na jy gekyk / einde van blok of dag */
  paFields: [
    {
      id: "teenwoordig",
      label: "Was hy fisies by die lessenaar / kamera aktief toe jy gekyk het?",
      type: "choice",
      options: [
        { v: "ja", t: "Ja" },
        { v: "gedeeltelik", t: "Gedeeltelik / later eers" },
        { v: "nee", t: "Nee / afwesig" },
        { v: "nie_gecheck", t: "Ek het nog nie nagegaan nie" }
      ]
    },
    {
      id: "produksie",
      label: "Lyk die werk soos egte produksie (vrae/foutlog) of “besig wees”?",
      type: "choice",
      options: [
        { v: "produksie", t: "Duidelike produksie" },
        { v: "gemeng", t: "Gemeng" },
        { v: "besig", t: "Lyk soos besig wees" },
        { v: "onbekend", t: "Kon nie oordeel nie" }
      ]
    },
    {
      id: "houding",
      label: "Houding / energie wat jy gesien het",
      type: "choice",
      options: [
        { v: "betrokke", t: "Betrokke" },
        { v: "neutraal", t: "Neutraal" },
        { v: "weerstand", t: "Weerstand / lui-sein" },
        { v: "moeg", t: "Moeg maar probeer" }
      ]
    },
    {
      id: "vertroue",
      label: "Hoeveel vertrou jy sy sessie-terugvoer t.o.v. wat jy gesien het?",
      type: "choice",
      options: [
        { v: "hoog", t: "Hoog — pas by wat ek sien" },
        { v: "medium", t: "Medium" },
        { v: "laag", t: "Laag — gaps / spin" }
      ]
    },
    {
      id: "verandering",
      label: "Wat moet môre / volgende blok verander? (Pa se roep)",
      type: "choice",
      options: [
        { v: "hou_aan", t: "Hou plan so" },
        { v: "korter", t: "Korter blokke" },
        { v: "swaarder_proctor", t: "Strenger proctor / meer checks" },
        { v: "makliker_eers", t: "Eers makliker low-hanging" },
        { v: "ander_vak", t: "Skuif vak-prioriteit" },
        { v: "rus", t: "Meer rus / korter dag" }
      ]
    },
    {
      id: "nota",
      label: "Kort Pa-nota (opsioneel)",
      type: "text",
      placeholder: "Bv. hy was in die buitegebou, kos-druk — check 10:00…"
    }
  ]
};

/**
 * Vergelyk Wallie + Pa antwoorde → vlae + aksies vir môre
 */
WALLIE.synthesizeDay = function synthesizeDay(state, dateKey) {
  const wallie = (state.wallieSurveys || []).filter((s) => s.date === dateKey);
  const pa = (state.paSurveys || []).filter((s) => s.date === dateKey);
  const sessions = (state.sessions || []).filter((s) => s.date === dateKey);
  const flags = [];
  const aksies = [];

  if (!wallie.length && sessions.length) {
    flags.push({ level: "warn", text: "Sessies sonder Wallie-survey — stelsel kan nie leer nie." });
    aksies.push("Maak einde-van-sessie survey verpligtend (moenie Skip druk nie).");
  }
  if (!pa.length && sessions.length) {
    flags.push({ level: "warn", text: "Geen Pa-check vandag nie — slegs sy woord." });
    aksies.push("Doen minstens 1 Pa-survey ná ’n rooi-sone blok (selfs 60 sek).");
  }

  wallie.forEach((w) => {
    const matchPa = pa.find((p) => p.sessionId === w.sessionId) || pa[0];
    if (w.answers?.metode === "nee") {
      flags.push({
        level: "alert",
        text: `${subjectLabel(w.subjectSlug)}: memo/lees eers i.p.v. toe-boek.`
      });
      aksies.push("Volgende blok: dwing blanko-blad 10 min vóór memo oopgaan.");
    }
    if (w.answers?.blokkade === "vermyding" || w.answers?.blokkade === "foon") {
      flags.push({
        level: "alert",
        text: `${subjectLabel(w.subjectSlug)}: self-aangee ${w.answers.blokkade}.`
      });
      aksies.push("Pa: mid-blok check + foon by jou / buite bereik.");
    }
    if (Number(w.answers?.fokus) <= 2) {
      flags.push({
        level: "warn",
        text: `${subjectLabel(w.subjectSlug)}: fokus self ≤2.`
      });
      aksies.push("Korter 25–30 min blokke, dan pouse.");
    }
    if (w.answers?.eerlikheid === "swak" || w.answers?.eerlikheid === "half") {
      flags.push({
        level: "alert",
        text: `${subjectLabel(w.subjectSlug)}: hy sê eerlikheid was ${w.answers.eerlikheid}.`
      });
      aksies.push("Pa: vra fisiese foutlog / skryfwerk te sien ná blok.");
    }
    if (matchPa) {
      if (matchPa.answers?.vertroue === "laag") {
        flags.push({
          level: "alert",
          text: `Pa-vertroue LAAG t.o.v. ${subjectLabel(w.subjectSlug)} — nie net sy woord nie.`
        });
        aksies.push("Môre: strenger proctor + Pa mid-sessie by buitegebou.");
      }
      if (
        matchPa.answers?.produksie === "besig" &&
        (w.answers?.fokus >= 4 || w.answers?.eerlikheid === "100")
      ) {
        flags.push({
          level: "alert",
          text: "MISMATCH: hy beweer sterk fokus/eerlikheid; Pa sien “besig wees”."
        });
        aksies.push("Moenie sy survey as wet vat — vereis bewys (foto van werk / foutlog).");
      }
      if (matchPa.answers?.teenwoordig === "nee" && Number(w.answers?.fokus) >= 4) {
        flags.push({
          level: "alert",
          text: "MISMATCH: Pa sê nie teenwoordig; hy sê hoë fokus."
        });
      }
      if (matchPa.answers?.verandering && matchPa.answers.verandering !== "hou_aan") {
        aksies.push(`Pa-roep: ${labelPaChange(matchPa.answers.verandering)}`);
      }
    }
    if (w.answers?.help_more) {
      aksies.push(`Wallie vra: “${w.answers.help_more}”`);
    }
  });

  const avgFokus =
    wallie.length > 0
      ? (
          wallie.reduce((s, w) => s + (Number(w.answers?.fokus) || 0), 0) / wallie.length
        ).toFixed(1)
      : "—";

  const uniqueAksies = [...new Set(aksies)].slice(0, 8);

  return {
    date: dateKey,
    wallieCount: wallie.length,
    paCount: pa.length,
    sessionCount: sessions.length,
    avgFokus,
    flags,
    aksies: uniqueAksies.length
      ? uniqueAksies
      : ["Nog te min data — voltooi 1 Wallie + 1 Pa survey na die eerste rooi-blok."]
  };
};

function subjectLabel(slug) {
  return WALLIE.SUBJECTS?.find((s) => s.slug === slug)?.naam || slug || "Sessie";
}

function labelPaChange(v) {
  const map = {
    hou_aan: "Hou plan so",
    korter: "Korter blokke",
    swaarder_proctor: "Strenger proctor",
    makliker_eers: "Eers low-hanging",
    ander_vak: "Skuif vak-prioriteit",
    rus: "Meer rus"
  };
  return map[v] || v;
}
