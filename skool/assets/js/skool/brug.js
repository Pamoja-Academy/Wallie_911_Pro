/* Skool-eksamenapp — die brug.
   Skakel die generiese laag in sonder om die UI te verander. Gebeurlik NET met ?skool=1 (ADR-007).
   Sonder die vlag (of sonder 'n geldige konfigurasie) doen hierdie lêer niks: die ou pad bly presies
   soos dit was, insluitend die wallie911_*-sleutels en WALLIE.buildDayPlan.

   Met die vlag (en ?graad=9 of ?graad=10, of die leerder se graad):
     WALLIE.SUBJECTS      ← config/graad-<n>/vakke.json + leerder se keuses
     PK.EXAMS             ← config/graad-<n>/rooster.json
     WALLIE.buildDayPlan  ← SKOOL.PLAN.genereer (deterministies, sien plangenerator.js)
     WALLIE.DBE           ← SKOOL.WERK (die werklaag oor config/werk/)
     netwerk              ← af (POPIA, ADR-005): geen Supabase, geen ntfy */
(function (root) {
  "use strict";
  var soek = root.location && root.location.search ? root.location.search : "";
  if (!/(^|[?&])skool=1(&|$)/.test(soek)) return;

  var demo = /(^|[?&])demo=1(&|$)/.test(soek);
  var SKOOL = (root.SKOOL = root.SKOOL || {});
  var WALLIE = (root.WALLIE = root.WALLIE || {});

  function fout(teks) {
    SKOOL.KONFIG_FOUT = teks;
    root.SKOOL_KONFIG_FOUT = teks;
  }

  /* Eerste oopmaak op 'n nuwe toestel: die kind kies sy graad en vakke. Dit bly in localStorage;
     daar gaan niks na die bediener nie (POPIA) en die publieke deployment bevat geen leerderdata nie. */
  var LEERDER_SLEUTEL = "skool_leerder_v1";

  function vakkeVir(g) {
    var ry = (((root.SKOOL_CONFIG.grade[g] || {}).vakke || {}).grade || []).filter(function (x) {
      return Number(x.graad) === Number(g);
    })[0];
    return ry ? ry.vakke : [];
  }

  function toonOpstelling(graad, katalogus) {
    var doc = root.document;
    var grade = Object.keys(root.SKOOL_CONFIG.grade || {}).sort();
    var gekies = {};
    katalogus.forEach(function (v) {
      if (v.verpligtend) gekies[v.slug] = true;
    });
    var huidige = String(graad || grade[0] || "10");

    function teken() {
      var lys = vakkeVir(huidige);
      var knoppe = grade
        .map(function (g) {
          var aan = g === huidige;
          return (
            '<button type="button" data-graad="' + g + '" style="padding:10px 16px;border-radius:10px;border:1px solid ' +
            (aan ? "#d4b45a" : "#2c6b4c") + ";background:" + (aan ? "#d4b45a" : "transparent") + ";color:" + (aan ? "#10241a" : "#e8efe9") +
            ';font-weight:700;cursor:pointer">Graad ' + g + "</button>"
          );
        })
        .join("");
      var bokse = lys
        .map(function (v) {
          return (
            '<label style="display:flex;gap:8px;align-items:flex-start;padding:10px;border:1px solid #1f5c3f;border-radius:10px;cursor:pointer">' +
            '<input type="checkbox" data-vak="' + v.slug + '"' + (gekies[v.slug] ? " checked" : "") + " />" +
            "<span>" + v.naam + (v.verpligtend ? ' <small style="color:#a9c7b6">(verpligtend)</small>' : "") + "</span></label>"
          );
        })
        .join("");
      doc.body.innerHTML =
        '<main style="max-width:820px;margin:6vh auto;padding:24px;font:16px/1.5 system-ui,Segoe UI,Arial;color:#e8efe9;background:#0b1f17;min-height:70vh">' +
        "<h1 style='font-size:1.5rem;margin:0 0 6px'>Welkom by die eksamenplan</h1>" +
        "<p style='color:#a9c7b6;margin:0 0 18px'>Kies jou graad en die vakke wat jy skryf. Dit word net op hierdie laptop gestoor — niks word opgelaai nie.</p>" +
        "<div style='display:flex;gap:8px;margin-bottom:18px'>" + knoppe + "</div>" +
        "<div style='display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:8px'>" + bokse + "</div>" +
        "<label style='display:flex;gap:8px;align-items:center;margin:16px 0 0;color:#a9c7b6'><input type='checkbox' id='op-prok'" + (root.SKOOL_CONFIG.skool && root.SKOOL_CONFIG.skool.proktoring === true ? " checked" : "") + " /> Kamera-toesig (proktrering) aan tydens sessies</label>" +
        "<p id='op-fout' style='color:#ff8a80;min-height:1.3em;margin:14px 0 0'></p>" +
        "<button id='op-stoor' type='button' style='padding:13px 20px;border:0;border-radius:10px;background:#d4b45a;color:#10241a;font-weight:700;font-size:1rem;cursor:pointer'>Stoor en begin</button>" +
        "</main>";
      doc.querySelectorAll("[data-graad]").forEach(function (b) {
        b.addEventListener("click", function () {
          huidige = b.getAttribute("data-graad");
          gekies = {};
          vakkeVir(huidige).forEach(function (v) {
            if (v.verpligtend) gekies[v.slug] = true;
          });
          teken();
        });
      });
      doc.querySelectorAll("[data-vak]").forEach(function (b) {
        b.addEventListener("change", function () {
          gekies[b.getAttribute("data-vak")] = b.checked;
        });
      });
      doc.getElementById("op-stoor").addEventListener("click", function () {
        var lys2 = Object.keys(gekies).filter(function (k) {
          return gekies[k];
        });
        var minKies = 0;
        ((root.SKOOL_CONFIG.grade[huidige] || {}).vakke || { grade: [] }).grade.forEach(function (g) {
          if (Number(g.graad) === Number(huidige)) minKies = Number(g.minKies) || 0;
        });
        if (!lys2.length) {
          doc.getElementById("op-fout").textContent = "Kies ten minste een vak.";
          return;
        }
        if (minKies && lys2.length < minKies) {
          doc.getElementById("op-fout").textContent = "Kies ten minste " + minKies + " vakke (jy het " + lys2.length + " gekies).";
          return;
        }
        var verplig = vakkeVir(huidige)
          .filter(function (v) { return v.verpligtend; })
          .map(function (v) { return v.slug; });
        var mis = verplig.filter(function (v) { return lys2.indexOf(v) < 0; });
        if (mis.length) {
          doc.getElementById("op-fout").textContent = "Die verpligte vakke moet ingesluit wees.";
          return;
        }
        try {
          var prok = doc.getElementById("op-prok") ? doc.getElementById("op-prok").checked : false;
          root.localStorage.setItem(LEERDER_SLEUTEL, JSON.stringify({ v: 1, graad: Number(huidige), vakkeuses: lys2, teiken: {}, gesien: [], proktoring: prok }));
        } catch (e) {
          doc.getElementById("op-fout").textContent = "Kon nie op hierdie toestel stoor nie (privaat modus?).";
          return;
        }
        root.location.reload();
      });
    }
    if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", teken);
    else teken();
  }

  if (/(^|[?&])opstel=1(&|$)/.test(soek)) {
    try {
      root.localStorage.removeItem("skool_leerder_v1");
    } catch (e) {}
    /* Die parameter mag nie bly staan nie: anders vee elke herlaai (ook ná "Stoor") die keuses weer uit. */
    try {
      var skoonUrl = new root.URL(root.location.href);
      skoonUrl.searchParams.delete("opstel");
      root.history.replaceState(null, "", skoonUrl.pathname + (skoonUrl.search || "") + skoonUrl.hash);
    } catch (e) {}
  }

  /* HARDE HEK: in die skool-modus mag niks die netwerk haal nie — ook nie 'n module wat voor hierdie
     brug begin het of 'n foutverslag nie. Dit staan bo-aan, voor enige ander logika. */
  (function () {
    var VERBODE = /(^|\.)supabase\.co$|(^|\.)ntfy\.sh$/i;
    function isVerbode(u) {
      try {
        var s = String((u && u.url) || u || "");
        var h = new root.URL(s, root.location.href).hostname;
        return VERBODE.test(h);
      } catch (e) {
        return false;
      }
    }
    if (root.fetch) {
      var origFetch = root.fetch;
      root.fetch = function (u, o) {
        if (isVerbode(u)) return Promise.resolve(new root.Response("{}", { status: 200, headers: { "Content-Type": "application/json" } }));
        return origFetch.apply(root, arguments);
      };
    }
    if (root.navigator && root.navigator.sendBeacon) {
      var origBeacon = root.navigator.sendBeacon.bind(root.navigator);
      root.navigator.sendBeacon = function (u, d) {
        return isVerbode(u) ? true : origBeacon(u, d);
      };
    }
    if (root.XMLHttpRequest) {
      var OrigXHR = root.XMLHttpRequest;
      var oop = OrigXHR.prototype.open;
      OrigXHR.prototype.open = function (m, u) {
        if (isVerbode(u)) {
          this.__skoolVerbode = true;
          return;
        }
        return oop.apply(this, arguments);
      };
      var stuur = OrigXHR.prototype.send;
      OrigXHR.prototype.send = function () {
        if (this.__skoolVerbode) return;
        return stuur.apply(this, arguments);
      };
    }
  })();

  var rou = root.SKOOL_CONFIG;
  if (!rou) {
    fout("config/gebundel.js het nie gelaai nie. Hardloop 'npm run bou:config'.");
    return;
  }
  /* Watter graad? ?graad=9/10, anders die leerder se graad, anders die skool se verstek. */
  var graadGevra = (soek.match(/[?&]graad=(\d{1,2})/) || [])[1];
  var graad = String(
    graadGevra ||
      (root.SKOOL_LEERDER && root.SKOOL_LEERDER.graad) ||
      rou.skool.graad ||
      Object.keys(rou.grade || {})[0] ||
      ""
  );
  if (!rou.grade || !rou.grade[graad]) {
    fout("Daar is geen konfigurasie vir graad " + graad + " nie (config/graad-" + graad + "/).");
    return;
  }
  var stel = demo ? (rou.voorbeeld && rou.voorbeeld[graad]) || null : Object.assign({}, rou.grade[graad]);
  if (!stel) {
    fout("Die voorbeeld-konfigurasie vir graad " + graad + " ontbreek (config/voorbeeld/graad-" + graad + "/).");
    return;
  }
  stel.skool = Object.assign({}, rou.skool, stel.skool || {}, { graad: Number(graad) });
  /* Die titel moet ook op die keuse-skerm reg wees (anders wys die blaaier se oortjie die ou app). */
  try {
    root.document.title =
      ((stel.skool.handelsmerk && stel.skool.handelsmerk.naam) || "Eksamenplan") +
      " · " + stel.skool.naam + " · Graad " + graad;
  } catch (e) {}
  if (!SKOOL.KONTRAK || !SKOOL.PLAN || !SKOOL.WERK) {
    fout("Die generiese modules (kontrak/plangenerator/werk) het nie gelaai nie.");
    return;
  }

  /* Die leerder se keuses: eers wat hy self op hierdie toestel gekies het, dan 'n plaaslike lêer
     (nooit in git nie, ADR-005), dan die demo-leerder. */
  function leesLeerder() {
    try {
      var d = JSON.parse(root.localStorage.getItem(LEERDER_SLEUTEL) || "null");
      if (d && Number(d.graad) === Number(graad) && Array.isArray(d.vakkeuses) && d.vakkeuses.length) return d;
    } catch (e) {
      /* geen stoor: val terug op die lêer */
    }
    return null;
  }
  var lokaal = root.SKOOL_LEERDER;
  var leerder = leesLeerder() || (lokaal && Number(lokaal.graad) === Number(graad) ? lokaal : stel.leerder || null);
  /* Eerste oopmaak: geen keuses nie. Ons gaan NIE hier terug nie — die netwerk moet eers toegemaak en
     die ou app oorskryf word, anders loop die leerder se app agter die keuse-skerm en stuur sy sync. */
  var kortOpstelling = !leerder && !demo;
  var uitslag = SKOOL.KONTRAK.leesAlles(Object.assign({}, stel, { leerder: leerder }));
  SKOOL.graad = Number(graad);
  if (!uitslag.ok) {
    fout("Die konfigurasie is ongeldig: " + uitslag.foute.slice(0, 6).join(" · "));
    return;
  }
  if (!uitslag.rooster.eksamens.length) {
    fout("Die eksamenrooster is nog nie gelaai nie (config/rooster.json).");
    return;
  }

  var skool = uitslag.skool;
  var katalogus = (uitslag.vakke[String(skool.graad)] || { vakke: [] }).vakke;
  if (!katalogus.length) {
    fout("Graad " + graad + " het geen vakke in die katalogus nie.");
    return;
  }
  var kies = uitslag.leerder.vakkeuses.length
    ? uitslag.leerder.vakkeuses
    : uitslag.rooster.eksamens
        .map(function (e) {
          return e.vak;
        })
        .filter(function (v, i, a) {
          return a.indexOf(v) === i;
        });

  /* ---------- vakke ---------- */

  function eksamenVir(slug) {
    var nou = WALLIE.todayKey ? WALLIE.todayKey() : new Date().toISOString().slice(0, 10);
    return (
      uitslag.rooster.eksamens.filter(function (e) {
        return e.vak === slug && e.datum >= nou;
      })[0] || null
    );
  }

  function daeTot(slug) {
    var e = eksamenVir(slug);
    if (!e) return Infinity;
    var nou = WALLIE.todayKey ? WALLIE.todayKey() : new Date().toISOString().slice(0, 10);
    return Math.round((Date.parse(e.datum + "T00:00:00Z") - Date.parse(nou + "T00:00:00Z")) / 86400000);
  }

  var vakke = kies.map(function (slug, i) {
    var k =
      katalogus.filter(function (v) {
        return v.slug === slug;
      })[0] || { slug: slug, naam: slug };
    var dae = daeTot(slug);
    return {
      slug: k.slug,
      naam: k.naam,
      prelim: null,
      jaar: null,
      teiken: uitslag.leerder.teiken[slug] != null ? uitslag.leerder.teiken[slug] : k.teiken != null ? k.teiken : 60,
      prioriteit: i + 1,
      zone: dae <= 3 ? "rooi" : dae <= 7 ? "geel" : "groen",
      fokus: k.fokus || "",
      lowHanging: k.lowHanging || []
    };
  });

  WALLIE.SUBJECTS = vakke;
  WALLIE.isVerborgeVak = function () {
    return false;
  };

  /* ---------- rooster ---------- */

  var naamVan = function (slug) {
    var v = vakke.filter(function (x) {
      return x.slug === slug;
    })[0];
    return v ? v.naam : slug;
  };

  var PK = (root.PK = root.PK || {});
  /* Net die leerder se eie vraestelle: die aftelling mag nie 'n vak wys wat hy nie skryf nie. */
  var eieEksamens = uitslag.rooster.eksamens.filter(function (e) {
    return kies.indexOf(e.vak) >= 0;
  });
  PK.EXAMS = eieEksamens.map(function (e) {
    return {
      s: e.vak,
      n: naamVan(e.vak) + " " + e.vraestel,
      at: e.datum + "T" + e.tyd + ":00+02:00",
      dur: e.duur + " min"
    };
  });
  if (PK.SUBJ) {
    vakke.forEach(function (v) {
      if (!PK.SUBJ[v.slug]) PK.SUBJ[v.slug] = { n: v.naam, c: "--off" };
    });
  }

  var eerste = eieEksamens[0] || uitslag.rooster.eksamens[0];
  WALLIE.EXAM_START = eerste.datum;
  WALLIE.EXAM_PERIOD_START = eerste.datum;
  WALLIE.EXAM_KICKOFF = eerste.datum + "T" + eerste.tyd + ":00";
  WALLIE.EXAM_LABEL = naamVan(eerste.vak) + " " + eerste.vraestel;
  WALLIE.EXAM_NOTE = skool.naam;

  /* ---------- die plan ---------- */

  SKOOL.WERK.laai(uitslag.werk);
  WALLIE.DBE = SKOOL.WERK;
  WALLIE.werkVirBlok = SKOOL.WERK.werkVirBlok;

  function gesienLys() {
    var uit = uitslag.leerder.gesien.slice();
    try {
      var d = JSON.parse(root.localStorage.getItem("wallie911_vraestel_gesien") || "null");
      if (d && d.gesien && typeof d.gesien === "object") {
        Object.keys(d.gesien).forEach(function (id) {
          if (d.gesien[id] === true && uit.indexOf(id) < 0) uit.push(id);
        });
      }
    } catch (e) {
      /* geen stoor: die leerder se antwoorde ontbreek net, niks breek nie */
    }
    return uit;
  }

  var planInvoer = {
    rooster: uitslag.rooster,
    werk: uitslag.werk,
    vakkeuses: vakke,
    vakke: katalogus,
    reels: skool.reels,
    skool: skool,
    leerder: uitslag.leerder
  };

  WALLIE.buildDayPlan = function buildDayPlan(datum) {
    var invoer = {
      datum: datum,
      begin: skool.begin || null,
      rooster: planInvoer.rooster,
      werk: planInvoer.werk,
      vakkeuses: planInvoer.vakkeuses,
      vakke: planInvoer.vakke,
      reëls: planInvoer.reels,
      skool: planInvoer.skool,
      gesien: gesienLys()
    };
    var plan;
    try {
      plan = SKOOL.PLAN.genereer(invoer);
    } catch (e) {
      /* Die rooster mag nooit die app laat val nie (sync.js:446-457 vang dit ook). */
      plan = { date: datum, blocks: [], totalMinutes: 0, waarskuwings: ["plan het gefaal: " + e.message] };
    }
    return plan;
  };

  /* ---------- berging en netwerk ---------- */

  var basis = (skool.voorvoegsel || "skool_").replace(/_$/, "");
  var voorvoegsel = (demo ? "demo" : basis) + graad + "_";
  SKOOL.voorvoegsel = voorvoegsel;
  if (WALLIE.storage) {
    /* Geen migrasie uit die ou leerder se sleutel nie: 'n skool-toestel begin skoon (POPIA). */
    WALLIE.storage.LEGACY_KEY = null;
    WALLIE.storage.KEY = voorvoegsel + "v2_bok";
  }
  /* Die skool-modus het geen remote-pad nie (geen Supabase, geen ntfy). */
  SKOOL.GEEN_REMOTE = true;
  /* Proktrering is 'n opsie: die skool se verstek, of die keuse wat by die opstelling op hierdie
     toestel gemaak is. Af = geen kamera, geen wegkyk-waarskuwings, geen slot. */
  var proktoringAan = leerder && leerder.proktoring != null ? leerder.proktoring === true : skool.proktoring === true;
  SKOOL.GEEN_PROKTOR = !proktoringAan;
  SKOOL.GEEN_SURVEY = true;
  SKOOL.PROKTERING = proktoringAan;

  /* ?datum=2026-10-29 wys daardie dag se plan (die app gebruik anders die toestel se klok).
     Dit is 'n kyk-instrument; die regte app gebruik die klok. */
  if (true) {
    var datumGevra = (soek.match(/[?&]datum=(\d{4}-\d{2}-\d{2})/) || [])[1];
    if (datumGevra) {
      var vasteDag = datumGevra;
      WALLIE.todayKey = function () {
        return vasteDag;
      };
    }
  }

  /* POPIA (ADR-005): 'n generiese ontplooiing stuur niks na 'n derde party nie. */
  if (WALLIE.LIVE) {
    WALLIE.LIVE.url = "";
    WALLIE.LIVE.key = "";
    WALLIE.LIVE.rpc = function () {
      return Promise.resolve({ ok: false, transient: false, error: "generies: geen bediener" });
    };
  }
  /* Geen uitboks in die skool-modus nie: die gebeure word nie gestoor om later te stuur nie
     (anders groei die tou vir ewig en die "sinkroniseer"-pil lieg). */
  if (WALLIE.SYNC) {
    WALLIE.SYNC.enqueue = function () {
      return null;
    };
  }
  if (WALLIE.REMOTE && WALLIE.REMOTE.publish) {
    WALLIE.REMOTE.ntfyServer = "";
    WALLIE.REMOTE.ntfyTopic = "";
    WALLIE.REMOTE.publish = function () {
      return Promise.resolve({ ok: false, error: "generies: geen bediener" });
    };
  }

  SKOOL.konfig = {
    skool: skool,
    vakke: vakke,
    rooster: uitslag.rooster,
    werk: uitslag.werk,
    leerder: uitslag.leerder,
    waarskuwings: uitslag.waarskuwings,
    demo: demo
  };

  /* ---------- sigbare merke (net in die generiese pad) ---------- */

  /* Die ou bladsy is vir een leerder geskryf: naam, trui, "Pa". In die generiese modus word die
     sigbare dele herdruk uit die skool se konfigurasie (ADR-006, fase 1). Die res van die teks is
     die UI se eie woorde en word in fase 2 aangepak. */
  function handelsmerk() {
    try {
      var doc = root.document;
      doc.title = skool.handelsmerk.naam + " · " + skool.naam + " · Graad " + skool.graad;
      var set = function (sel, teks) {
        var el = doc.querySelector(sel);
        if (el) el.textContent = teks;
      };
      set(".brand strong", skool.handelsmerk.naam + " · Graad " + skool.graad);
      set(".brand-sub", "Graad " + skool.graad + " · " + skool.naam);
      set(".stadium-eyebrow", skool.handelsmerk.slagspreuk + " · Graad " + skool.graad);
      var merk = doc.querySelector(".brand-mark");
      if (merk) merk.style.display = "none";
      var trui = doc.querySelector(".md-trui");
      if (trui) trui.style.display = "none";
      set(".stadium-eyebrow", skool.handelsmerk.slagspreuk);
      set("#view-missie h1", skool.handelsmerk.naam);
      var sesKop = doc.querySelector("#view-sessie h1");
      var sesLede = doc.querySelector("#view-sessie .lede");
      if (sesKop) sesKop.textContent = "Sessie";
      if (sesLede && SKOOL.GEEN_PROKTOR) {
        sesLede.textContent = "Werk rustig. Die klok loop; geen kamera en geen waarskuwings nie. Klik \"Eindig sessie\" as jy klaar is.";
      }
      var pil = doc.querySelector("#sync-pill");
      if (pil) pil.style.display = "none";
      var pa = doc.querySelector('[data-view="pa"]');
      if (pa) pa.style.display = "none";
      var konsent = doc.querySelector("#remote-consent-modal, #remote-panel");
      if (konsent) konsent.style.display = "none";
      if (SKOOL.GEEN_PROKTOR) {
        var styl = doc.createElement("style");
        styl.textContent =
          "#camera,#warn-display,#lock-box,.camera-wrap{display:none!important}" +
          "#session-live .camera-box{display:none!important}";
        doc.head.appendChild(styl);
      }
      var storie = doc.querySelector("#view-missie .stadium");
      if (storie) storie.style.display = "none";
      /* Die 911-kamera-taal hoort nie by 'n gewone skool-app nie. */
      var kamera = doc.querySelector("#view-missie p.hint");
      if (kamera && /kamera/i.test(kamera.textContent)) {
        kamera.textContent = "Begin met die hooftaak. Die prent is opsioneel: tik dit om die les te sien.";
      }
      var kop = doc.querySelectorAll("#view-missie h2");
      for (var i = 0; i < kop.length; i++) {
        if (/matchday/i.test(kop[i].textContent)) kop[i].textContent = "Vandag se blokke";
      }
      var voet = doc.querySelector("footer span, .voet span");
      if (voet) voet.textContent = skool.handelsmerk.naam + " · " + skool.naam + " · plaaslik op hierdie toestel";
    } catch (e) {
      /* die handelsmerk is nie krities nie */
    }
  }

  /* Eerste-keer-toer: drie kaartjies in gewone taal. Een keer per toestel; ?toer=1 wys dit weer. */
  function toonToer() {
    try {
      var doc = root.document;
      if (/(^|[?&])toer=1(&|$)/.test(soek)) {
        try { root.localStorage.removeItem("skool_toer_v1"); } catch (e) {}
      }
      if (root.localStorage.getItem("skool_toer_v1") === "1") return;
      var stappe = [
        {
          titel: "Welkom by jou eksamenplan",
          teks: "Hierdie app wys elke dag wat jy moet doen tot jou laaste vraestel. Jy hoef niks te installeer nie — dit werk in die blaaier."
        },
        {
          titel: "Begin by die eerste blok",
          teks: 'Onder "Vandag se blokke" staan jou werk vir vandag. Klik op die geel "Begin"-knoppie by die eerste blok. Die klok begin dan loop.'
        },
        {
          titel: "Merk en leer",
          teks: 'Ná elke stuk werk kom "Merk en leer": die memo wys hoe die punt verdien word. Skryf neer wat jy gemis het — dit is jou teorie.'
        },
        {
          titel: "Klaar vir vandag",
          teks: "Die laaste blok is die foutlog: skryf jou top-3 foute neer. Môre begin jy daar. Klaar — geen camera, niks word opgelaai nie."
        }
      ];
      var i = 0;
      var wrap = doc.createElement("div");
      wrap.id = "skool-toer";
      wrap.setAttribute("role", "dialog");
      wrap.style.cssText =
        "position:fixed;inset:0;z-index:999998;background:rgba(5,15,11,.86);display:flex;align-items:center;justify-content:center;padding:18px;font:16px/1.5 system-ui,Segoe UI,Arial;color:#e8efe9";
      function teken() {
        var s = stappe[i];
        wrap.innerHTML =
          '<div style="max-width:520px;width:100%;background:#0e2a1e;border:1px solid #2c6b4c;border-radius:16px;padding:24px">' +
          '<p style="margin:0 0 6px;color:#a9c7b6;font-size:.85rem">Stap ' + (i + 1) + " van " + stappe.length + "</p>" +
          '<h2 style="margin:0 0 10px;font-size:1.3rem">' + s.titel + "</h2>" +
          '<p style="margin:0 0 20px">' + s.teks + "</p>" +
          '<div style="display:flex;gap:10px;justify-content:flex-end">' +
          (i > 0 ? '<button type="button" data-toer="terug" style="padding:11px 16px;border-radius:10px;border:1px solid #2c6b4c;background:transparent;color:#e8efe9;cursor:pointer">Terug</button>' : "") +
          '<button type="button" data-toer="volgende" style="padding:11px 18px;border-radius:10px;border:0;background:#d4b45a;color:#10241a;font-weight:700;cursor:pointer">' +
          (i === stappe.length - 1 ? "Kom ons begin" : "Volgende") +
          "</button></div></div>";
        wrap.querySelectorAll("[data-toer]").forEach(function (b) {
          b.addEventListener("click", function () {
            if (b.getAttribute("data-toer") === "terug") i = Math.max(0, i - 1);
            else if (i === stappe.length - 1) {
              try { root.localStorage.setItem("skool_toer_v1", "1"); } catch (e) {}
              wrap.remove();
              return;
            } else i += 1;
            teken();
          });
        });
      }
      teken();
      doc.body.appendChild(wrap);
    } catch (e) {
      /* die toer is nie krities nie */
    }
  }

  function merk() {
    try {
      handelsmerk();
      var body = root.document.body;
      if (!body) return;
      var geenWerk = uitslag.werk.length === 0;
      var boodskap =
        skool.status === "VOORBEELD"
          ? "VOORBEELDDATA — hierdie skool, rooster en vraestelle is fiktief. Vervang config/ voordat 'n leerder dit gebruik."
          : skool.status !== "reg"
            ? "KONFIGURASIE ONGEVERIFIEER — die skool moet config/ nagaan voordat dit aan 'n leerder gegee word."
            : "";
      if (geenWerk && !demo) {
        boodskap = (boodskap ? boodskap + " " : "") + "Geen vraestelle gelaai nie: die plan wys net die eksamens. Laai config/werk/ en bou weer.";
      }
      if (!boodskap || (root.sessionStorage && root.sessionStorage.getItem("skool_lint") === "1")) {
        toonToer();
        return;
      }
      var b = root.document.createElement("div");
      b.id = "skool-lint";
      b.setAttribute("role", "status");
      b.setAttribute("data-status", skool.status);
      b.style.cssText =
        "position:fixed;left:0;right:0;bottom:0;z-index:99999;background:#7a1f1f;color:#fff;font:600 13px/1.35 system-ui,Segoe UI,Arial;padding:8px 12px;text-align:center";
      b.textContent = boodskap + " ";
      var sluit = root.document.createElement("button");
      sluit.type = "button";
      sluit.textContent = "×";
      sluit.setAttribute("aria-label", "Maak toe");
      sluit.style.cssText = "margin-left:10px;background:transparent;border:0;color:#fff;font-size:1.1rem;cursor:pointer";
      sluit.addEventListener("click", function () {
        try { root.sessionStorage.setItem("skool_lint", "1"); } catch (e) {}
        b.remove();
      });
      b.appendChild(sluit);
      body.appendChild(b);
      toonToer();
    } catch (e) {
      /* die merkie is nie krities nie */
    }
  }
  if (kortOpstelling) {
    /* Die app is nou die skool-app (leë plan) en die netwerk is af; die keuse-skerm lê bo-op. */
    toonOpstelling(graad, vakkeVir(graad));
    return;
  }
  if (root.document && root.document.readyState === "loading") {
    root.document.addEventListener("DOMContentLoaded", merk);
  } else {
    merk();
  }
})(typeof window !== "undefined" ? window : this);
