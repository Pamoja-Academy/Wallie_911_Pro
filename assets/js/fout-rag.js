/* fout-RAG (28 Okt 2026): soek 'n antwoord vir Wallie in data/fout-rag.json.

   LEES NET. Hierdie lêer skryf niks: geen localStorage, geen Supabase, geen event nie
   (AGENTS.md §2.2/§2.3). Dit haal net die korpus en gee 'n oordeel terug. Die korpus bly 'n klein
   data-lêer in die app, nooit 'n bediener nie (LL-21).

   WALLIE.FOUTRAG.soek(navraag, { vak, sein }) → null | {
     id, soort, antwoord, punt, bron, alternatiewe: [{ id, punt }]
   }

   Die model: tf-idf met kosinus-gelykheid oor die korpus (bounded 0..1, deterministies), plus 'n
   bonus as een van 'n inskrywing se `seine` woordeliks in die blaaier se foutboodskap voorkom.
   Onder MIN_PUNT gee dit `null` — die app sê dan eerlik "ek weet nie" in plaas van 'n uitgedinkte
   antwoord (AGENTS.md §2.4). Onsekerheid is nooit 'n vals antwoord nie. */
window.WALLIE = window.WALLIE || {};

(function () {
  "use strict";

  var KORPUS_URL = "data/fout-rag.json";
  /* Kosinus-gelykheid. Onder hierdie punt swyg ons liewer. Gekalibreer in tests/fout-rag.test.js:
     'n navraag wat die simptoom in ander woorde stel, moet bo die drempel kom; onverwante teks nie. */
  /* 28 Okt, ná QC: was 0.17. Te laag — "die app werk nie" het RTT se Word/Excel-stoorraad gekry
     (0.239) en "help" 'n diagnose uit die duim (0.192). Wallie kry liewer niks as iets verkeerds.
     0.26 is gemeet, nie geraai nie: QC se ergste vals treffer was 0.224, die swakste EGTE vraag 0.299. */
  var MIN_PUNT = 0.26;
  /* 'n Woordelikse sein-treffer is sterker bewys as enige woordooreenkoms. */
  var SEIN_PUNT = 0.9;
  /* Die regte vak maak 'n inskrywing meer waarskynlik... */
  var VAK_BONUS = 1.15;
  /* ...en die VERKEERDE vak maak dit minder waarskynlik. Sonder hierdie straf het "ek kan nie my
     werk stoor nie" in 'n Engels-sessie die RTT-antwoord gekry ("Ctrl+S in Word, vouer
     Dokumente\RTT-eksamen") — raad wat niks met sy skryfstuk te doen het nie. Dit sluit niks uit:
     'n sterk ooreenkoms wen steeds, en inskrywings wat "algemeen" insluit, word nie gestraf nie. */
  var VAK_STRAF = 0.75;

  /* Afrikaanse stopwoorde + die woorde wat in byna elke foutmelding staan en dus niks onderskei nie. */
  var STOP = {};
  ("die 'n en of om te in op is was wat nie met vir van dit hy sy ek jy my jou se aan by as dat daar " +
    "het hoe kan mag moet nou ook al na maar uit oor hierdie daardie een twee want sodat dan toe nog " +
    "sal word wees hulle ons u haar hom self so baie meer min net reeds weer wel glad niks iets " +
    "iemand enige elke alles waar wanneer hoekom watter wie").split(" ").forEach(function (w) { STOP[w] = true; });

  var korpus = null;
  var idf = null;
  var vektore = null;
  var onbekendeIdf = 0;
  var pogings = 0;

  /* ---------- teks ---------- */

  /* Diakritiete plat (ê→e, ï→i …) sodat "dataleer" en "datalêer" dieselfde token gee. */
  function plat(s) {
    return String(s == null ? "" : s)
      .toLowerCase()
      .replace(/[áàâä]/g, "a")
      .replace(/[éèêë]/g, "e")
      .replace(/[íìîï]/g, "i")
      .replace(/[óòôö]/g, "o")
      .replace(/[úùûü]/g, "u")
      .replace(/[ý]/g, "y");
  }

  function tokens(s) {
    var rou = plat(s).replace(/[^a-z0-9]+/g, " ").split(" ");
    var uit = [];
    for (var i = 0; i < rou.length; i++) {
      var t = rou[i];
      if (t.length < 2 || STOP[t]) continue;
      uit.push(t);
    }
    return uit;
  }

  function telle(lys) {
    var m = Object.create(null);
    for (var i = 0; i < lys.length; i++) m[lys[i]] = (m[lys[i]] || 0) + 1;
    return m;
  }

  /* ---------- die model ---------- */

  /* Een inskrywing se dokument: die simptome (wat Wallie sou sê) weeg dubbel, want dit is die
     navraag se taal; die antwoord gee die res van die woordeskat. */
  function dokument(e) {
    var simptome = (e.simptome || []).join(" ");
    return tokens(simptome + " " + simptome + " " + e.antwoord + " " + (e.seine || []).join(" "));
  }

  function bou() {
    var lys = korpus.inskrywings;
    var df = Object.create(null);
    var docs = [];
    var i;
    for (i = 0; i < lys.length; i++) {
      var tf = telle(dokument(lys[i]));
      docs.push(tf);
      Object.keys(tf).forEach(function (t) { df[t] = (df[t] || 0) + 1; });
    }
    var N = lys.length;
    idf = Object.create(null);
    Object.keys(df).forEach(function (t) {
      /* Gladde idf; +1 hou dit altyd positief, ook vir 'n woord in elke dokument. */
      idf[t] = Math.log(1 + N / df[t]);
    });
    /* Die gewig van 'n woord wat glad nie in die korpus is nie. Dit was eers log(1+N) — die
       skaarsste moontlike — maar dit was te hard: "die memo-knoppie REAGEER nie" het niks gegee
       nie, want die een onbekende woord het die hele navraag-vektor oorheers (28 Okt, gevang deur
       tests/e2e/hulp.spec.js). Die gemiddelde idf straf 'n navraag wat MEESTAL vreemd is (lorem
       ipsum) steeds swaar, maar laat een ongewone woord in 'n egte vraag deur. */
    var gewigte = Object.keys(idf).map(function (t) { return idf[t]; });
    onbekendeIdf = gewigte.length
      ? gewigte.reduce(function (a, b) { return a + b; }, 0) / gewigte.length
      : 1;
    vektore = docs.map(function (tf) { return vektor(tf); });
  }

  /* tf-idf-vektor, genormaliseer tot lengte 1 (dan is die binneproduk die kosinus). */
  function vektor(tf) {
    var v = Object.create(null);
    var som = 0;
    Object.keys(tf).forEach(function (t) {
      var w = (1 + Math.log(tf[t])) * (idf[t] || 0);
      if (w <= 0) return;
      v[t] = w;
      som += w * w;
    });
    var norm = Math.sqrt(som);
    if (norm > 0) Object.keys(v).forEach(function (t) { v[t] = v[t] / norm; });
    return v;
  }

  /* Die navraag se vektor. Anders as 'n dokument tel 'n woord wat NIE in die korpus is nie hier
     saam in die noemer: 'n onbekende woord is per definisie skaars, dus swaar, en dit kan nooit
     teen enige inskrywing pas nie. So daal die punt van 'n navraag wat meestal uit vreemde woorde
     bestaan ("lorem ipsum dolor sit amet" het net die toevallige "sit" in die korpus), terwyl 'n
     egte vraag, waarvan die woorde wél in die korpus staan, niks verloor nie. Sonder dit gee een
     toevallige woord 'n volsterkte eenheidsvektor en dus 'n vals treffer. */
  function navraagVektor(tf) {
    var v = Object.create(null);
    var som = 0;
    Object.keys(tf).forEach(function (t) {
      var gewig = idf[t];
      var onbekend = gewig == null;
      var w = (1 + Math.log(tf[t])) * (onbekend ? onbekendeIdf : gewig);
      if (w <= 0) return;
      som += w * w;
      /* 'n onbekende woord dra by tot die noemer maar nooit tot 'n ooreenkoms nie */
      if (!onbekend) v[t] = w;
    });
    var norm = Math.sqrt(som);
    if (norm > 0) Object.keys(v).forEach(function (t) { v[t] = v[t] / norm; });
    return v;
  }

  function kosinus(a, b) {
    var ks = Object.keys(a);
    var s = 0;
    for (var i = 0; i < ks.length; i++) if (b[ks[i]]) s += a[ks[i]] * b[ks[i]];
    return s;
  }

  /* Kom een van die inskrywing se seine woordeliks in die foutboodskap voor? Gee die lengte van die
     LANGSTE sein wat pas (0 = geen). Die lengte is die spesifiekheid: pas twee inskrywings se seine
     albei, wen die spesifieker een. Sonder dit kry 'n stoor-fout die algemene skrip-antwoord, net
     omdat die vanger se sein ook die lêernaam noem (nagegaan 28 Okt). */
  function seinTref(e, hooiberg) {
    if (!hooiberg) return 0;
    var seine = e.seine || [];
    var langste = 0;
    for (var i = 0; i < seine.length; i++) {
      var s = plat(seine[i]);
      if (s && hooiberg.indexOf(s) >= 0 && s.length > langste) langste = s.length;
    }
    return langste;
  }

  function soek(navraag, opsies) {
    try {
      if (!korpus || !korpus.inskrywings || !korpus.inskrywings.length) return null;
      if (!idf) bou();
      opsies = opsies || {};
      var teks = String(navraag == null ? "" : navraag);
      /* Die sein word saam met die navraag deursoek: 'n outomatiese melding het dikwels net 'n sein. */
      var hooiberg = plat(teks + " " + (opsies.sein == null ? "" : opsies.sein));
      var qv = navraagVektor(telle(tokens(teks + " " + (opsies.sein == null ? "" : opsies.sein))));
      var qLeeg = !Object.keys(qv).length;

      var punte = [];
      for (var i = 0; i < korpus.inskrywings.length; i++) {
        var e = korpus.inskrywings[i];
        var punt = qLeeg ? 0 : kosinus(qv, vektore[i]);
        var tref = seinTref(e, hooiberg);
        if (tref) {
          /* Basis 0.9, plus spesifiekheid (die langste passende sein) en 'n bietjie woordooreenkoms.
             'n Inskrywing wat as vangnet gemerk is ("'n hulpbron het nie gelaai nie"), begin laer,
             sodat 'n inskrywing wat die spesifieke lêer of fout noem, dit altyd klop. */
          var basis = e.sein_algemeen ? SEIN_PUNT - 0.08 : SEIN_PUNT;
          punt = Math.max(punt, basis) + (Math.min(tref, 24) / 24) * 0.06 + punt * 0.02;
        }
        if (opsies.vak) {
          var vakke = e.vakke || [];
          if (vakke.indexOf(opsies.vak) >= 0) punt *= VAK_BONUS;
          else if (vakke.length && vakke.indexOf("algemeen") < 0) punt *= VAK_STRAF;
        }
        if (punt > 0) punte.push({ i: i, punt: punt > 1 ? 1 : punt });
      }
      if (!punte.length) return null;
      /* Deterministies: gelyke punte val terug op die id se volgorde (die korpus is gesorteer). */
      punte.sort(function (a, b) { return b.punt - a.punt || a.i - b.i; });
      if (punte[0].punt < MIN_PUNT) return null;

      var wen = korpus.inskrywings[punte[0].i];
      return {
        id: wen.id,
        soort: wen.soort,
        antwoord: wen.antwoord,
        punt: Math.round(punte[0].punt * 1000) / 1000,
        bron: wen.bron,
        alternatiewe: punte.slice(1, 3).filter(function (p) { return p.punt >= MIN_PUNT; }).map(function (p) {
          return { id: korpus.inskrywings[p.i].id, punt: Math.round(p.punt * 1000) / 1000 };
        })
      };
    } catch (e) {
      /* Die soektog mag nooit 'n fout gooi nie: dit loop juis ná 'n fout. */
      return null;
    }
  }

  /* ---------- laai ---------- */

  /* Twee mislukkings (vanlyn, file://) en dan los ons dit — geen herprobeer-lus nie, dieselfde
     dissipline as ondersteuning.js. */
  function laai() {
    if (korpus || pogings >= 2 || typeof fetch !== "function") return;
    pogings += 1;
    fetch(KORPUS_URL, { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (d && d.inskrywings && d.inskrywings.length) {
          korpus = d;
          idf = null;
        }
      }, function () { /* vanlyn — die vanger werk sonder 'n antwoord voort */ });
  }

  WALLIE.FOUTRAG = {
    MIN_PUNT: MIN_PUNT,
    soek: soek,
    laai: laai,
    gereed: function () { return !!(korpus && korpus.inskrywings && korpus.inskrywings.length); },
    korpus: function () { return korpus; },
    /* vir toetse: 'n korpus insit sonder netwerk */
    _setKorpus: function (d) { korpus = d && d.inskrywings && d.inskrywings.length ? d : null; idf = null; },
    /* vir toetse en die QC: die tokeniseerder self */
    _tokens: tokens
  };

  laai();
})();
