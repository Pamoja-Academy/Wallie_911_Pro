/* Skool-eksamenapp — konfigurasie-kontrak.
   Doel: die JSON in config/ valideer en normaliseer sodat die plangenerator en die UI altyd dieselfde
   vorm sien. Pure funksies: geen DOM, geen netwerk, geen klok. Werk in die blaaier én in Node
   (toetse laai dit met 'n vm-harness, soos tests/plan-v5.test.js).
   Reël R1: 'n werkitem sonder 'n nagegane bron word NIE in 'n plan gebruik nie. */
(function (root) {
  "use strict";
  var SKOOL = (root.SKOOL = root.SKOOL || {});

  var STATUSSES = { reg: true, VOORBEELD: true, ONGEVERIFIEER: true };
  var SLUG = /^[a-z0-9][a-z0-9-]{1,40}$/;

  function isDatum(s) {
    return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s + "T00:00:00Z"));
  }
  function isTyd(s) {
    return typeof s === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
  }
  function isGetal(n) {
    return typeof n === "number" && isFinite(n);
  }
  function isString(s) {
    return typeof s === "string" && s.trim() !== "";
  }
  function lys(x) {
    return Array.isArray(x) ? x : [];
  }

  function leesAlles(rou) {
    var foute = [];
    var waarskuwings = [];
    var cfg = rou || {};
    var skool = normaliseerSkool(cfg.skool, foute, waarskuwings);
    var vakke = normaliseerVakke(cfg.vakke, foute, waarskuwings);
    var katalogus = vakke[String(skool.graad)] || { vakke: [] };
    var rooster = normaliseerRooster(cfg.rooster, katalogus, skool, foute, waarskuwings);
    var werk = normaliseerWerk(cfg.werk, katalogus, skool, foute, waarskuwings);
    var leerder = normaliseerLeerder(cfg.leerder, katalogus, skool, foute, waarskuwings);

    if (skool.status === "reg" && rooster.eksamens.length === 0) {
      foute.push("rooster: die skool se rooster is leeg (status is 'reg')");
    }
    if (rooster.eksamens.length > 0) {
      var sonderWerk = [];
      rooster.eksamens.forEach(function (e) {
        if (!werk.some(function (w) { return w.vak === e.vak; })) sonderWerk.push(e.vak);
      });
      if (sonderWerk.length) {
        waarskuwings.push(
          "rooster: geen werkitems vir " + uniek(sonderWerk).join(", ") + " — daardie vakke kry geen studieblokke nie"
        );
      }
    }
    return {
      ok: foute.length === 0,
      foute: foute,
      waarskuwings: waarskuwings,
      skool: skool,
      vakke: vakke,
      rooster: rooster,
      werk: werk,
      leerder: leerder
    };
  }

  function uniek(a) {
    var s = {};
    return a.filter(function (x) {
      if (s[x]) return false;
      s[x] = 1;
      return true;
    });
  }

  function normaliseerSkool(rou, foute, waarskuwings) {
    var s = rou && typeof rou === "object" ? rou : {};
    var skool = {
      weergawe: s.weergawe || 1,
      status: s.status || "ONGEVERIFIEER",
      naam: typeof s.naam === "string" ? s.naam.trim() : "",
      graad: Number(s.graad),
      jaar: Number(s.jaar),
      voorvoegsel: typeof s.voorvoegsel === "string" ? s.voorvoegsel : "skool_",
      proktoring: s.proktoring === true,
      handelsmerk: {
        naam: (s.handelsmerk && s.handelsmerk.naam) || "Eksamenplan",
        slagspreuk: (s.handelsmerk && s.handelsmerk.slagspreuk) || ""
      },
      kontak: { naam: (s.kontak && s.kontak.naam) || "" },
      begin: isDatum(s.begin) ? s.begin : null,
      skooltye: {
        week: tydVenster(s.skooltye && s.skooltye.week),
        naweek: tydVenster(s.skooltye && s.skooltye.naweek)
      },
      reels: normaliseerReels(s.reëls || s.reels, waarskuwings)
    };
    if (!STATUSSES[skool.status]) foute.push("skool.status: '" + skool.status + "' is nie reg/VOORBEELD/ONGEVERIFIEER nie");
    if (!isString(skool.naam)) foute.push("skool.naam ontbreek");
    if (!(skool.graad >= 8 && skool.graad <= 12)) foute.push("skool.graad moet 8–12 wees (is " + s.graad + ")");
    if (!(skool.jaar >= 2020 && skool.jaar <= 2100)) foute.push("skool.jaar is onwaarskynlik (" + s.jaar + ")");
    if (!/^[a-z0-9]{2,20}_$/.test(skool.voorvoegsel)) {
      foute.push("skool.voorvoegsel moet kleinletters + '_' wees, bv. 'skool_' (is '" + skool.voorvoegsel + "')");
    }
    if (skool.voorvoegsel === "wallie911_") {
      waarskuwings.push("skool.voorvoegsel is die ou leerder se voorvoegsel — kies 'n skool-eie voorvoegsel");
    }
    if (s.begin != null && !skool.begin) foute.push("skool.begin moet 'n datum soos 2026-10-24 wees");
    return skool;
  }

  function tydVenster(v) {
    if (!v || typeof v !== "object" || !isTyd(v.van) || !isTyd(v.tot)) return null;
    return { van: v.van, tot: v.tot };
  }

  function normaliseerReels(rou, waarskuwings) {
    var r = rou && typeof rou === "object" ? rou : {};
    var reels = {
      minPerPunt: isGetal(r.minPerPunt) && r.minPerPunt > 0 ? r.minPerPunt : 1.2,
      minBlokMinute: isGetal(r.minBlokMinute) && r.minBlokMinute >= 10 ? r.minBlokMinute : 20,
      maksBlokMinute: isGetal(r.maksBlokMinute) && r.maksBlokMinute >= 30 ? r.maksBlokMinute : 100,
      maksVraestelMinute: isGetal(r.maksVraestelMinute) && r.maksVraestelMinute >= 60 ? r.maksVraestelMinute : 180,
      rusNaMinute: isGetal(r.rusNaMinute) && r.rusNaMinute >= 30 ? r.rusNaMinute : 90,
      rusMinute: isGetal(r.rusMinute) && r.rusMinute >= 5 ? r.rusMinute : 15,
      middagete: Array.isArray(r.middagete) && r.middagete.length === 2 ? r.middagete.slice() : ["12:30", "13:15"],
      aandEinde: isTyd(r.aandEinde) ? r.aandEinde : "21:00",
      maksMinutePerDag: isGetal(r.maksMinutePerDag) && r.maksMinutePerDag >= 60 ? r.maksMinutePerDag : 300,
      eksamenBufferMinute: isGetal(r.eksamenBufferMinute) && r.eksamenBufferMinute >= 0 ? r.eksamenBufferMinute : 60,
      geenNuweWerkOggend: r.geenNuweWerkOggend !== false,
      nuweWerkNaEksamen: r.nuweWerkNaEksamen === true,
      nooitGesieneVraestel: r.nooitGesieneVraestel !== false,
      merkNaWerk: r.merkNaWerk !== false,
      modus: r.modus === "redding" ? "redding" : "normaal",
      vensters: normaliseerVensters(r.vensters)
    };
    if (reels.maxBlokMinute < reels.minBlokMinute) {
      waarskuwings.push("reëls: maksBlokMinute < minBlokMinute — die maksimum word na die minimum opgetrek");
      reels.maksBlokMinute = reels.minBlokMinute;
    }
    return reels;
  }

  function normaliseerVensters(v) {
    var uit = {
      week: [
        ["15:30", "18:00"],
        ["19:00", "21:00"]
      ],
      naweek: [
        ["08:00", "12:00"],
        ["14:00", "17:30"],
        ["19:00", "21:00"]
      ]
    };
    if (!v || typeof v !== "object") return uit;
    ["week", "naweek"].forEach(function (k) {
      if (!Array.isArray(v[k])) return;
      var pare = v[k]
        .filter(function (p) {
          return Array.isArray(p) && p.length === 2 && isTyd(p[0]) && isTyd(p[1]) && p[0] < p[1];
        })
        .map(function (p) {
          return [p[0], p[1]];
        });
      if (pare.length) uit[k] = pare;
    });
    return uit;
  }

  function normaliseerVakke(rou, foute, waarskuwings) {
    var uit = {};
    var grade = lys(rou && rou.grade);
    if (!grade.length) foute.push("vakke: geen grade nie");
    grade.forEach(function (g) {
      var graad = Number(g && g.graad);
      if (!(graad >= 8 && graad <= 12)) {
        foute.push("vakke: ongeldige graad " + (g && g.graad));
        return;
      }
      var gesien = {};
      var vakke = lys(g.vakke)
        .map(function (v) {
          var vak = {
            slug: String((v && v.slug) || ""),
            naam: String((v && v.naam) || ""),
            verpligtend: v && v.verpligtend === true,
            zone: v && ["rooi", "geel", "groen"].indexOf(v.zone) >= 0 ? v.zone : null,
            teiken: v && isGetal(v.teiken) ? Math.max(0, Math.min(100, v.teiken)) : null,
            fokus: (v && typeof v.fokus === "string" && v.fokus) || "",
            lowHanging: lys(v && v.lowHanging).filter(isString).slice(0, 8)
          };
          if (!SLUG.test(vak.slug)) foute.push("vakke: ongeldige slug '" + vak.slug + "' (graad " + graad + ")");
          if (gesien[vak.slug]) foute.push("vakke: dubbele slug '" + vak.slug + "' (graad " + graad + ")");
          gesien[vak.slug] = 1;
          if (!isString(vak.naam)) foute.push("vakke: '" + vak.slug + "' het geen naam nie");
          return vak;
        })
        .filter(function (v) {
          return v.slug && v.naam;
        });
      if (!vakke.length) waarskuwings.push("vakke: graad " + graad + " het geen vakke nie");
      uit[String(graad)] = {
        graad: graad,
        vas: !!(g && g.vas),
        minKies: g && isGetal(g.minKies) ? g.minKies : 0,
        vakke: vakke
      };
    });
    return uit;
  }

  function normaliseerRooster(rou, katalogus, skool, foute, waarskuwings) {
    var r = rou && typeof rou === "object" ? rou : {};
    var graad = Number(r.graad || skool.graad);
    if (graad !== skool.graad) {
      waarskuwings.push("rooster.graad (" + graad + ") verskil van skool.graad (" + skool.graad + ")");
    }
    var slugs = {};
    (katalogus.vakke || []).forEach(function (v) {
      slugs[v.slug] = 1;
    });
    var eksamens = lys(r.eksamens).map(function (e) {
      var eks = {
        vak: String((e && e.vak) || ""),
        vraestel: String((e && e.vraestel) || ""),
        datum: String((e && e.datum) || ""),
        tyd: String((e && e.tyd) || ""),
        duur: Number(e && e.duur),
        punte: Number(e && e.punte)
      };
      if (!isDatum(eks.datum)) foute.push("rooster: ongeldige datum '" + eks.datum + "' (" + eks.vak + " " + eks.vraestel + ")");
      if (!isTyd(eks.tyd)) foute.push("rooster: ongeldige tyd '" + eks.tyd + "' (" + eks.vak + " " + eks.vraestel + ")");
      if (!(eks.duur >= 20 && eks.duur <= 480)) foute.push("rooster: duur " + eks.duur + " min is onwaarskynlik (" + eks.vak + ")");
      if (!(eks.punte >= 0)) foute.push("rooster: punte ontbreek (" + eks.vak + " " + eks.vraestel + ")");
      if (!eks.vraestel) foute.push("rooster: vraestel ontbreek (" + eks.vak + ")");
      if (!slugs[eks.vak]) foute.push("rooster: vak '" + eks.vak + "' is nie in die graad se katalogus nie");
      if (!eks.punte) waarskuwings.push("rooster: " + eks.vak + " " + eks.vraestel + " het 0 punte");
      return eks;
    });
    eksamens.sort(function (a, b) {
      return (a.datum + "T" + a.tyd).localeCompare(b.datum + "T" + b.tyd) || a.vak.localeCompare(b.vak);
    });
    var gesien = {};
    eksamens.forEach(function (e) {
      var k = e.datum + "|" + e.tyd + "|" + e.vak;
      if (gesien[k]) waarskuwings.push("rooster: " + e.vak + " staan twee keer op " + e.datum + " " + e.tyd);
      gesien[k] = 1;
    });
    return { graad: graad, jaar: Number(r.jaar || skool.jaar), eksamens: eksamens };
  }

  function normaliseerWerk(rou, katalogus, skool, foute, waarskuwings) {
    var slugs = {};
    (katalogus.vakke || []).forEach(function (v) {
      slugs[v.slug] = 1;
    });
    var ids = {};
    var uit = [];
    lys(rou).forEach(function (w) {
      if (!w || typeof w !== "object") return;
      var item = {
        id: String(w.id || ""),
        vak: String(w.vak || ""),
        graad: Number(w.graad || skool.graad),
        titel: String(w.titel || ""),
        tipe: String(w.tipe || "vraestel"),
        punte: Number(w.punte),
        tydMin: isGetal(w.tydMin) ? w.tydMin : null,
        vrae: lys(w.vrae).map(Number),
        vraestel: w.vraestel || null,
        memo: w.memo || null,
        data: w.data || null,
        datatipe: w.datatipe || null,
        bylae: w.bylae || null,
        antwoordeboek: w.antwoordeboek || null,
        bron: w.bron && typeof w.bron === "object" ? w.bron : null
      };
      if (!item.id) {
        foute.push("werk: item sonder id (" + item.vak + ")");
        return;
      }
      if (ids[item.id]) {
        foute.push("werk: dubbele id '" + item.id + "'");
        return;
      }
      ids[item.id] = 1;
      if (!slugs[item.vak]) foute.push("werk: '" + item.id + "' se vak '" + item.vak + "' is nie in die katalogus nie");
      if (item.graad !== skool.graad) {
        foute.push("werk: '" + item.id + "' is graad " + item.graad + ", maar die skool is graad " + skool.graad + " — dit mag nooit in hierdie plan kom nie");
        return;
      }
      if (!isString(item.titel)) foute.push("werk: '" + item.id + "' het geen titel nie");
      if (!(item.punte > 0)) foute.push("werk: '" + item.id + "' het geen punte nie");
      if (!item.vraestel) {
        foute.push("werk: '" + item.id + "' het geen vraestel-skakel nie — die leerder kan dit nie oopmaak nie (R4)");
        return;
      }
      if (!item.memo) waarskuwings.push("werk: '" + item.id + "' het geen memo nie — merk sal blind wees");
      if (item.vrae.length) {
        var som = item.vrae.reduce(function (a, b) { return a + b; }, 0);
        if (som !== item.punte) {
          waarskuwings.push("werk: '" + item.id + "' se punte (" + item.punte + ") verskil van die som van die vrae (" + som + ")");
        }
      }
      if (item.bron && isDatum(item.bron.nagegaan) && item.bron.nagegaan > "2026-10-28") {
        foute.push("werk: '" + item.id + "' se bron is in die toekoms nagegaan (" + item.bron.nagegaan + ") — dit kan nie waar wees nie");
        return;
      }
      var nagegaan = item.bron && isDatum(item.bron.nagegaan);
      var verwysing = item.bron && isString(item.bron.verwysing);
      if (!nagegaan || !verwysing) {
        if (skool.status === "VOORBEELD") {
          item.bron = item.bron || {};
          item.bron.fiktief = true;
        } else {
          foute.push(
            "werk: '" + item.id + "' het nie 'n nagegane bron nie (bron.nagegaan + bron.verwysing) — R1 verbied dit"
          );
          return;
        }
      }
      if (item.bron && item.bron.fiktief && skool.status !== "VOORBEELD") {
        foute.push("werk: '" + item.id + "' is fiktief maar die skool se status is nie VOORBEELD nie");
        return;
      }
      uit.push(item);
    });
    if (!uit.length) waarskuwings.push("werk: geen werkitems nie — die plan sal leeg wees");
    return uit;
  }

  function normaliseerLeerder(rou, katalogus, skool, foute, waarskuwings) {
    if (!rou) {
      waarskuwings.push("leerder: geen leerder-konfigurasie nie — die app vra dit by die eerste oopmaak");
      return { graad: skool.graad, vakkeuses: [], teiken: {}, gesien: [], naam: null };
    }
    var l = rou;
    var graad = Number(l.graad || skool.graad);
    if (graad !== skool.graad) foute.push("leerder.graad (" + graad + ") verskil van skool.graad (" + skool.graad + ")");
    var slugs = {};
    (katalogus.vakke || []).forEach(function (v) {
      slugs[v.slug] = 1;
    });
    var keuses = lys(l.vakkeuses)
      .map(function (k) { return String(k).trim(); })
      .filter(Boolean);
    keuses.forEach(function (k) {
      if (!slugs[k]) foute.push("leerder: vakkeuse '" + k + "' is nie in die katalogus nie");
    });
    var gesien = lys(l.gesien)
      .map(function (g) { return String(g).trim(); })
      .filter(Boolean);
    if (keuses.length && !katalogus.vas && katalogus.minKies && keuses.length < katalogus.minKies) {
      waarskuwings.push(
        "leerder: " + keuses.length + " vakke gekies, die skool vra " + katalogus.minKies + " (" + graad + ")"
      );
    }
    var teiken = {};
    Object.keys(l.teiken || {}).forEach(function (k) {
      var n = Number(l.teiken[k]);
      if (isGetal(n) && n >= 0 && n <= 100) teiken[k] = n;
    });
    if (gesien.length) {
      var ids = {};
      lys(rou && rou.werk).forEach(function (w) { if (w && w.id) ids[String(w.id)] = 1; });
      gesien.forEach(function (id) {
        if (!ids[id]) waarskuwings.push("leerder: gesiene vraestel '" + id + "' is nie in die werk-katalogus nie (tikfout?)");
      });
    }
    return {
      graad: graad,
      vakkeuses: keuses,
      teiken: teiken,
      gesien: gesien,
      naam: null /* POPIA: daar is nie 'n naamveld nie (ADR-005) */
    };
  }

  SKOOL.KONTRAK = {
    leesAlles: leesAlles,
    isDatum: isDatum,
    isTyd: isTyd,
    STATUSSES: STATUSSES
  };
})(typeof window !== "undefined" ? window : this);
