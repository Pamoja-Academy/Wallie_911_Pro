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
  /* 28 Okt, QC rondte 2: sonder 'n woordelikse sein is 'n kosinus-punt tussen 0.26 en 0.5 in 110 toetsnavrae
     telkens 'n verkeerde antwoord (bv. "my werk is weg" -> "net die nagaan-reël is weg"). Vrye teks moet
     dus sterker wees; 'n outomatiese melding met 'n egte sein (0.9+) is nie hierdeur geraak nie. */
  var TEKS_PUNT = 0.5;
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
  var laaiBesig = false;

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
        var vakke = e.vakke || [];
        if (opsies.vak && vakke.indexOf(opsies.vak) >= 0) punt *= VAK_BONUS;
        /* Verkeerde vak, OF geen vak bekend nie: 'n vak-spesifieke antwoord is nie vir 'n onbekende vak bedoel nie. */
        else if (vakke.length && vakke.indexOf("algemeen") < 0 && (opsies.vak || !tref)) punt *= VAK_STRAF;
        if (punt > 0) punte.push({ i: i, punt: punt > 1 ? 1 : punt, sein: !!tref });
      }
      if (!punte.length) return null;
      /* Deterministies: gelyke punte val terug op die id se volgorde (die korpus is gesorteer). */
      punte.sort(function (a, b) { return b.punt - a.punt || a.i - b.i; });
      if (punte[0].punt < (punte[0].sein ? MIN_PUNT : TEKS_PUNT)) return null;

      var wen = korpus.inskrywings[punte[0].i];
      return {
        id: wen.id,
        soort: wen.soort,
        antwoord: wen.antwoord,
        punt: Math.round(punte[0].punt * 1000) / 1000,
        bron: wen.bron,
        alternatiewe: punte.slice(1, 3).filter(function (p) { return p.punt >= (p.sein ? MIN_PUNT : TEKS_PUNT); }).map(function (p) {
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
    /* `laaiBesig`: drie plekke roep laai(); 'n tweede gelyktydige fetch mag nie die laaste poging opgebruik nie. */
    if (korpus || laaiBesig || pogings >= 2 || typeof fetch !== "function") return;
    pogings += 1;
    laaiBesig = true;
    fetch(KORPUS_URL, { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        laaiBesig = false;
        if (d && d.inskrywings && d.inskrywings.length) {
          korpus = d;
          idf = null;
          /* Die keuselyste (Hulp, 'Iets werk nie') vul hulself sodra die korpus daar is. */
          try { window.dispatchEvent(new Event("foutrag-gereed")); } catch (e) { /* ou blaaier: by volgende oopmaak */ }
        }
      }, function () { laaiBesig = false; /* vanlyn — die vanger werk sonder 'n antwoord voort */ });
  }

  /* Die keuse-pad (28 Okt, Hanno): vrye teks kan nie betroubaar reg van verkeerd onderskei nie
     (QC rondte 3: 40 van 49 eie simptome gee null). Wallie KIES dus wat gebeur, en kry die inskrywing
     se antwoord direk: geen telling, geen raaiwerk nie. Een keuse per inskrywing, met sy eerste simptoom
     as etiket; die vak se eie inskrywings eerste, dan die algemene. Geen vak: NET die algemene — 'n
     vak-spesifieke antwoord ("3 uur vir 200 punte") sonder vak is by 'n ander vak verkeerd (QC rondte 5). */
  function keuses(vak) {
    try {
      if (!korpus || !korpus.inskrywings) return [];
      var eie = [], alg = [], gesien = {};
      korpus.inskrywings.forEach(function (e) {
        var teks = e.simptome && e.simptome[0];
        if (!teks || gesien[teks]) return;
        var vakke = e.vakke || [];
        var isEie = vak && vakke.indexOf(vak) >= 0;
        var isAlg = vakke.indexOf("algemeen") >= 0;
        if (!isEie && !isAlg) return;
        gesien[teks] = true;
        (isEie && vak !== "algemeen" ? eie : alg).push({ id: e.id, teks: teks });
      });
      /* LL-23: inhoudsfoute ("dit is prakties", "dit is in Engels") staan altyd bo-aan: die foutvanger sien hulle nooit. */
      var lys = eie.concat(alg);
      var soortVan = {};
      korpus.inskrywings.forEach(function (e) { soortVan[e.id] = e.soort; });
      return lys.filter(function (k) { return soortVan[k.id] === "inhoud"; })
        .concat(lys.filter(function (k) { return soortVan[k.id] !== "inhoud"; }));
    } catch (e) {
      return [];
    }
  }

  function antwoordVir(id) {
    try {
      if (!korpus || !korpus.inskrywings) return null;
      for (var i = 0; i < korpus.inskrywings.length; i++) {
        var e = korpus.inskrywings[i];
        if (e.id === id) return { id: e.id, soort: e.soort, antwoord: e.antwoord, bron: e.bron };
      }
    } catch (e) { /* stil */ }
    return null;
  }

  WALLIE.FOUTRAG = {
    MIN_PUNT: MIN_PUNT,
    TEKS_PUNT: TEKS_PUNT,
    soek: soek,
    keuses: keuses,
    antwoordVir: antwoordVir,
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
