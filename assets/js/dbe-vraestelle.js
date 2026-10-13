/* Amptelike DBE RTT (CAT) V1-vraestelle + werk-keuse sonder herhaling.

   GEEN DBE-LÊER WORD IN HIERDIE REPO GESTOOR NIE (kopiereg). Net die amptelike skakels — alles op
   education.gov.za, nagegaan op 11 Okt 2026 (HTTP 200, regte PDF/datalêer).

   Elke rooster-blok kan ’n `werk`-veld hê (zie schedule.js):
     { tipe: "vraestel", id: "dbe-2024-nov-v1" }                 → die volle vraestel
     { tipe: "vrae",     id: "dbe-2026-jun-v1", nrs: [5] }       → net Vraag 5
     { tipe: "vrae",     id: "dbe-2025-jun-v1", nrs: ["6.1"] }   → net Vraag 6.1
     { tipe: "oefenvraag", id: "rtt-v1-S01" }                    → een item uit die Oefenvrae-lys

   Blokke SONDER ’n vaste `werk` kry werk uit die rotasie (pickRttWork): eers die vraestelle wat nog
   nie gesien is nie, dan die 30 oefenvrae in die orde van nog-nie-reg. Nooit dieselfde werk as die
   vorige RTT-blok nie.

   Nuwe localStorage-sleutel (die enigste een wat hierdie lêer skryf): wallie911_rtt_history
     { v: 1,
       werk: [ { blok: <blok-id>, dag: "2026-10-11", tipe, id, nrs? } ],   // in die orde van gebruik
       konsepte: { teller: { <vak-slug>: 7 },                               // hoeveel kaarte al uitgedeel is
                   blokke: { <blok-id>: <konsep-id> } } }                   // die kaart van ’n blok bly vas
   Geen tydstempels: die sleutel moet tussen twee identiese lopies greep-identies wees.
   Geen ander sleutel word gelees of geskryf nie (Wallie se data bly onaangeraak). */
window.WALLIE = window.WALLIE || {};

(function () {
  const DATA_NOTA = "Wagwoordbeskermde .exe, werk net op Windows; wagwoord staan in die vraestel se instruksies.";

  /* vrae[] = punte vir V1…V7 (uit die vraestel se puntetelling). */
  const KATALOGUS = {
    "dbe-2026-jun-v1": {
      id: "dbe-2026-jun-v1",
      titel: "DBE Mei/Junie 2026 V1 (Afr)",
      vraestel: "https://www.education.gov.za/LinkClick.aspx?fileticket=GmvkgojiEOk%3d&tabid=5956&portalid=0&mid=15127",
      data: "https://www.education.gov.za/LinkClick.aspx?fileticket=ybeQ75SZMDo%3d&tabid=5956&portalid=0&mid=15127",
      memo: "https://www.education.gov.za/LinkClick.aspx?fileticket=IDeLfPOLl24%3d&tabid=5956&portalid=0&mid=15127",
      vrae: [19, 26, 19, 22, 35, 15, 14],
      datatipe: "ZIP met wagwoord-.exe (3,9 MB)"
    },
    "dbe-2025-nov-v1": {
      id: "dbe-2025-nov-v1",
      titel: "DBE November 2025 V1 (Afr)",
      vraestel: "https://www.education.gov.za/LinkClick.aspx?fileticket=yoJAx65WDNc%3d&tabid=5742&portalid=0&mid=14831",
      data: "https://www.education.gov.za/LinkClick.aspx?fileticket=qTsacudvKaI%3d&tabid=5742&portalid=0&mid=14831",
      memo: "https://www.education.gov.za/LinkClick.aspx?fileticket=fbRSLIgenIk%3d&tabid=5742&portalid=0&mid=14831",
      vrae: [22, 23, 22, 18, 35, 15, 15],
      datatipe: "wagwoord-.exe (2,7 MB)"
    },
    "dbe-2024-nov-v1": {
      id: "dbe-2024-nov-v1",
      titel: "DBE November 2024 V1 (Afr)",
      vraestel: "https://www.education.gov.za/LinkClick.aspx?fileticket=KY1feshKi1k%3D&mid=13709&portalid=0&tabid=5193",
      data: "https://www.education.gov.za/LinkClick.aspx?fileticket=IM8ST4pCUws%3d&tabid=5193&portalid=0&mid=13709",
      memo: "https://www.education.gov.za/LinkClick.aspx?fileticket=dUP446MK6Hs%3D&mid=13709&portalid=0&tabid=5193",
      vrae: [25, 20, 21, 19, 35, 15, 15],
      datatipe: "wagwoord-.exe (3,6 MB)"
    },
    "dbe-2025-jun-v1": {
      id: "dbe-2025-jun-v1",
      titel: "DBE Mei/Junie 2025 V1 (Afr)",
      vraestel: "https://www.education.gov.za/LinkClick.aspx?fileticket=y8_26AxaZlY%3d&tabid=5475&portalid=0&mid=14230",
      data: "https://www.education.gov.za/LinkClick.aspx?fileticket=RgGCyv6Sitc%3d&tabid=5475&portalid=0&mid=14230",
      memo: "https://www.education.gov.za/LinkClick.aspx?fileticket=vHeo6iEwQM4%3d&tabid=5475&portalid=0&mid=14230",
      vrae: [27, 18, 16, 24, 35, 15, 15],
      datatipe: "wagwoord-.exe (2,2 MB)"
    }
  };

  /* Rotasie-orde: die nuutste vraestel eerste. */
  const ORDE = ["dbe-2026-jun-v1", "dbe-2025-nov-v1", "dbe-2024-nov-v1", "dbe-2025-jun-v1"];

  const item = (id) => KATALOGUS[id] || null;

  function vraagLabel(nr) {
    return "V" + String(nr);
  }

  /* Watter vrae moet gedoen word? ’n Volle vraestel = V1–V7. */
  function vraagNommers(werk) {
    if (!werk) return [];
    if (werk.tipe === "vraestel") {
      const p = item(werk.id);
      return p ? p.vrae.map((_, i) => i + 1) : [];
    }
    return Array.isArray(werk.nrs) ? werk.nrs.slice() : [];
  }

  function vraagLabels(werk) {
    return vraagNommers(werk).map(vraagLabel);
  }

  /* Punte: die blok se eie telling eerste (sub-vrae kan nie uit vrae[] bereken word nie). */
  function punte(werk, blok) {
    if (blok && Number.isFinite(blok.punte)) return blok.punte;
    const p = werk ? item(werk.id) : null;
    if (!p) return null;
    const nrs = vraagNommers(werk);
    if (!nrs.length || nrs.some((n) => !Number.isInteger(Number(n)) || !p.vrae[Number(n) - 1])) return null;
    return nrs.reduce((s, n) => s + p.vrae[Number(n) - 1], 0);
  }

  /* Punte per hele vraag, vir die lysie op die sessieskerm ("V5 · 35 punte"). */
  function vraagPunte(werk, nr) {
    const p = werk ? item(werk.id) : null;
    const i = Number(nr);
    if (!p || !Number.isInteger(i) || !p.vrae[i - 1]) return null;
    return p.vrae[i - 1];
  }

  function oefenItem(id) {
    const lys = window.VRAEBANK_RTT_V1;
    return (Array.isArray(lys) ? lys : []).find((q) => q && q.id === id) || null;
  }

  /* Tegniese merk vir die taak-veld en die praktiese blok: "dbe-2026-jun-v1 V5" */
  function werkId(werk) {
    if (!werk || !werk.id) return "";
    const labels = werk.tipe === "vrae" ? vraagLabels(werk) : [];
    return labels.length ? `${werk.id} ${labels.join(", ")}` : String(werk.id);
  }

  /* Leesbare naam vir Wallie en Pa: "DBE Mei/Junie 2026 V1 (Afr) · V5" */
  function werkLabel(werk) {
    if (!werk) return "";
    if (werk.tipe === "oefenvraag") {
      const q = oefenItem(werk.id);
      const bron = q && q.bron && q.bron.verwysing ? ` (${q.bron.verwysing})` : "";
      return `Oefenvraag ${werk.id}${bron}`;
    }
    const p = item(werk.id);
    if (!p) return String(werk.id || "");
    if (werk.tipe === "vraestel") return `${p.titel} · volledige vraestel`;
    const labels = vraagLabels(werk);
    return labels.length ? `${p.titel} · ${labels.join(", ")}` : p.titel;
  }

  function skakels(werk) {
    const p = werk ? item(werk.id) : null;
    if (!p) return null;
    return { vraestel: p.vraestel, data: p.data, memo: p.memo, datatipe: p.datatipe, titel: p.titel };
  }

  /* ---------- geskiedenis (nuwe sleutel) ---------- */

  const KEY = "wallie911_rtt_history";

  function leeg() {
    return { v: 1, werk: [], konsepte: { teller: {}, blokke: {} } };
  }

  function regmaakKonsepte(d) {
    const k = d.konsepte && typeof d.konsepte === "object" && !Array.isArray(d.konsepte) ? d.konsepte : {};
    d.konsepte = {
      teller: k.teller && typeof k.teller === "object" && !Array.isArray(k.teller) ? k.teller : {},
      blokke: k.blokke && typeof k.blokke === "object" && !Array.isArray(k.blokke) ? k.blokke : {}
    };
    return d;
  }

  function lees() {
    let raw = null;
    try {
      raw = localStorage.getItem(KEY);
    } catch {
      return leeg();
    }
    if (raw == null) return leeg();
    try {
      const d = JSON.parse(raw);
      if (!d || typeof d !== "object" || d.v !== 1 || !Array.isArray(d.werk)) return leeg();
      return regmaakKonsepte(d);
    } catch {
      return leeg();
    }
  }

  function skryf(d) {
    try {
      localStorage.setItem(KEY, JSON.stringify(d));
      return true;
    } catch {
      /* Vol of privaat modus: die app mag nooit hieroor breek nie. */
      return false;
    }
  }

  function werkVan(rec) {
    const w = { tipe: rec.tipe, id: rec.id };
    if (Array.isArray(rec.nrs)) w.nrs = rec.nrs.slice();
    return w;
  }

  const geskiedenis = {
    KEY,
    lees,

    /* Een blok hou sy werk vir altyd: ’n herlaai of ’n herbegin wys dieselfde werk. */
    werkVanBlok(blokId) {
      if (!blokId) return null;
      const rec = lees().werk.find((w) => w.blok === blokId);
      return rec ? werkVan(rec) : null;
    },

    noteWerk(blokId, werk, dag) {
      if (!blokId || !werk || !werk.id) return null;
      const d = lees();
      if (d.werk.some((w) => w.blok === blokId)) return werk;
      const rec = { blok: blokId, dag: dag || null, tipe: werk.tipe || "vraestel", id: werk.id };
      if (Array.isArray(werk.nrs)) rec.nrs = werk.nrs.slice();
      d.werk.push(rec);
      skryf(d);
      return werk;
    },

    laasteWerk() {
      const d = lees();
      return d.werk.length ? werkVan(d.werk[d.werk.length - 1]) : null;
    },

    /* Hoeveel les-kaarte is al vir hierdie vak uitgedeel? Een GLOBALE teller (nie per dag van voor af
       nie) — dit is hoekom die eerste blok van ’n nuwe dag nie meer gister se kaart herhaal nie. */
    teller(slug) {
      const n = lees().konsepte.teller[slug];
      return Number.isFinite(n) ? n : 0;
    },

    /* Die les-kaart van ’n blok word EEN keer gekies en gestoor: ’n herlaai wys dieselfde kaart. */
    kaartVanBlok(blokId) {
      if (!blokId) return null;
      const id = lees().konsepte.blokke[blokId];
      return typeof id === "string" && id ? id : null;
    },

    noteKaart(blokId, slug, konsepId) {
      if (!blokId || !slug || !konsepId) return null;
      const d = lees();
      if (d.konsepte.blokke[blokId] === konsepId) return konsepId;
      d.konsepte.blokke[blokId] = konsepId;
      const n = d.konsepte.teller[slug];
      d.konsepte.teller[slug] = (Number.isFinite(n) ? n : 0) + 1;
      skryf(d);
      return konsepId;
    }
  };

  /* ---------- rotasie ---------- */

  function gedaanOefen() {
    const uit = new Set();
    try {
      const d = window.VraebankStore?.get?.();
      Object.entries((d && d.items) || {}).forEach(([id, it]) => {
        if ((it?.pogings || []).some((p) => p && p.uitslag === "reg")) uit.add(id);
      });
    } catch {
      /* geen stoor: alles tel as nog-nie-gedaan */
    }
    return uit;
  }

  function poel() {
    const vraestelle = ORDE.filter((id) => KATALOGUS[id]).map((id) => ({ tipe: "vraestel", id }));
    const lys = Array.isArray(window.VRAEBANK_RTT_V1) ? window.VRAEBANK_RTT_V1 : [];
    const oefen = lys.filter((q) => q && q.id).map((q) => ({ tipe: "oefenvraag", id: q.id }));
    const klaar = gedaanOefen();
    return [...vraestelle, ...oefen.filter((o) => !klaar.has(o.id)), ...oefen.filter((o) => klaar.has(o.id))];
  }

  /* Volgende werk vir ’n RTT-blok sonder vaste werk. */
  function pickRttWork(opts = {}) {
    const { blok = null, dag = null, vorige = null, gebruik = [] } = opts;
    const bestaande = geskiedenis.werkVanBlok(blok);
    if (bestaande) return bestaande;
    const d = lees();
    const gesien = new Set(d.werk.map((w) => w.id));
    const nou = new Set(gebruik.filter(Boolean).map((w) => w.id));
    const vorigeId = (vorige && vorige.id) || geskiedenis.laasteWerk()?.id || null;
    const kandidate = poel();
    const kies =
      kandidate.find((w) => !gesien.has(w.id) && !nou.has(w.id) && w.id !== vorigeId) ||
      kandidate.find((w) => !nou.has(w.id) && w.id !== vorigeId) ||
      kandidate[0] ||
      null;
    if (kies && blok) geskiedenis.noteWerk(blok, kies, dag);
    return kies;
  }

  /* ’n Les-, opstel-, merk-, pouse- of skrif-blok kry NOOIT werk uit die rotasie nie.
     "skrif" is ’n papier-eksamen (Pa gee die vraestel) — geen DBE-titel uit die katalogus nie. */
  const GEEN_ROTASIE = ["les", "opstel", "merk", "pouse", "skrif"];

  /* Die werk van ’n blok: vas uit die rooster, anders uit die rotasie. */
  function werkVirBlok(blok, ctx = {}) {
    if (!blok) return null;
    if (blok.werk && blok.werk.id) {
      geskiedenis.noteWerk(blok.id, blok.werk, ctx.dag || null);
      return blok.werk;
    }
    if (blok.subjectSlug !== "rtt") return null;
    if (blok.soort && GEEN_ROTASIE.includes(blok.soort)) return null;
    return pickRttWork({ blok: blok.id, dag: ctx.dag || null, vorige: ctx.vorige || null, gebruik: ctx.gebruik || [] });
  }

  /* Watter werk loop NOU (vir die praktiese blok se merk)? Word deur app.js gestel. */
  let aktief = null;

  WALLIE.DBE = {
    KATALOGUS,
    ORDE,
    DATA_NOTA,
    item,
    vraagNommers,
    vraagLabels,
    vraagLabel,
    vraagPunte,
    punte,
    werkId,
    werkLabel,
    skakels,
    oefenItem,
    poel,
    setAktief(werk) {
      aktief = werk && werk.id ? werk : null;
    },
    aktief() {
      return aktief;
    },
    aktiefId() {
      return aktief ? werkId(aktief) : "";
    }
  };
  WALLIE.rttGeskiedenis = geskiedenis;
  WALLIE.pickRttWork = pickRttWork;
  WALLIE.werkVirBlok = werkVirBlok;
})();
