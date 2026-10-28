/* Foutvanger (28 Okt 2026): vang 'n fout in die blad, gee Wallie dadelik 'n kort antwoord as die app een
   het (WALLIE.FOUTRAG), en sê vir Pa. Spesifikasie: docs/SPEK-FOUTVANGER-2026-10-28.md §2.3 en §5.

   Wat gevang word:
     - 'n JS-fout (window "error")                       → soort "js"
     - 'n gebreekte belofte (unhandledrejection)         → soort "belofte"
     - 'n <script>/<link>/<img> van ons eie bediener wat nie laai nie → soort "hulpbron"
     - WALLIE.FOUTVANGER.meld(fout, opsies)              → soort "hand" (vir ander modules)

   Wat dit doen, in hierdie orde: sein bou → ontdubbel → FOUTRAG.soek → strokie wys → na Pa rapporteer.
   Rapporteer gaan deur die BESTAANDE paaie (AGENTS.md §2.2: geen nuwe event-soort, geen migrasie):
     WALLIE.REMOTE.bugReport()  → event kind "probleem"
     WALLIE.HULP.stuur()        → wallie911.support, bron "outo"

   HARDE REËLS
     1. Breek NOOIT 'n sessie nie. Tydens WALLIE.proctor.active: die strokie steel geen fokus nie, blokkeer
        niks (pointer-events: none, geen knoppie, geen modal), raak nie die klok of proctor aan nie en kan
        dus nooit as wegkyk/waarskuwing tel nie (proctor meet net visibilitychange/blur/focus).
     2. Gooi self NOOIT 'n fout nie: alles in try/catch, stil gesluk. 'n Fout in die rapporteer-pad word
        nie weer gevang nie (`besig`-vlag, 'n lêer-filter en elke belofte van ons het 'n .catch).
     3. Geen lus: dieselfde sein hoogstens 1× per 10 min, hoogstens 20 meldings per bladsy-sessie.
     4. Enigste localStorage-sleutel: w911_fout_seine (die ontdubbel-register). Nooit 'n wallie911_*-sleutel nie.
     5. Wallie sien nooit 'n stack trace nie; die stapel gaan net in die data vir Pa.

   Hierdie lêer moet laai VOOR die ander skrifte (anders vang dit nie 'n skrif wat nie laai nie) en werk
   sonder WALLIE.FOUTRAG, WALLIE.REMOTE en WALLIE.HULP: hulle word eers gesoek wanneer 'n fout opkom. */
window.WALLIE = window.WALLIE || {};

(function () {
  "use strict";

  var W = window;
  if (W.WALLIE.FOUTVANGER && W.WALLIE.FOUTVANGER._geinstalleer) return;

  var SLEUTEL = "w911_fout_seine";
  var VENSTER_MS = 10 * 60 * 1000;
  var MAKS_PER_SESSIE = 20;
  var MAKS_REGISTER = 40;
  var WYS_SESSIE_MS = 12000;
  var WYS_GEWOON_MS = 30000;
  /* 28 Okt (QC): was "Pa is in kennis gestel." Dit was 'n belofte oor iets wat nog nie gebeur het
     nie — die melding staan in die tou en gaan deur sodra daar internet is. Sê wat waar is. */
  var PA_TEKS = "Pa kry dit sodra daar internet is.";
  var ONBEKEND = "Onbekende fout.";

  var besig = false;
  var gemeld = 0;
  var geheue = {};
  var strokieEl = null;
  var strokieTimer = null;
  var wagVirBody = null;

  /* ---------- klein hulpfunksies (almal gooi nooit) ---------- */

  function nou() {
    try { return Date.now(); } catch (e) { return 0; }
  }

  function sessieAan() {
    try { return Boolean(W.WALLIE && W.WALLIE.proctor && W.WALLIE.proctor.active); } catch (e) { return false; }
  }

  function kort(s, n) {
    s = String(s == null ? "" : s);
    return s.length > n ? s.slice(0, n - 1) + "…" : s;
  }

  function skerm() {
    try { return String((W.location && W.location.hash) || ""); } catch (e) { return ""; }
  }

  /* Pad sonder ?v=… en sonder die bediener/repo-voorvoegsel: "assets/js/x.js". */
  function skoonPad(url) {
    var s = String(url || "").split("#")[0].split("?")[0];
    var m = s.match(/(assets|data)\/.*$/);
    if (m) return m[0];
    var dele = s.split("/");
    return dele[dele.length - 1] || s;
  }

  /* Dieselfde bediener as die blad? 'n Lettertipe/CDN wat nie laai nie is nie ons fout nie. */
  function eieBron(url) {
    try {
      var u = new URL(String(url), W.location.href);
      if (u.protocol !== "http:" && u.protocol !== "https:" && u.protocol !== "file:") return false;
      return u.protocol + "//" + u.host === W.location.protocol + "//" + W.location.host;
    } catch (e) {
      return false;
    }
  }

  /* Stabiele vorm: geen getalle, geen ?v=, geen blanko-reekse nie (sodat "reël 41" en "reël 97" dieselfde sein is). */
  function normaliseer(s) {
    return String(s == null ? "" : s)
      .replace(/\?v=[^\s'")]*/g, "")
      .replace(/\d+/g, "#")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 160);
  }

  function stil(p) {
    /* Elke belofte wat ons begin kry 'n .catch, sodat ons nooit self 'n unhandledrejection veroorsaak nie. */
    try {
      if (p && typeof p.then === "function") p.then(null, function () { /* stil */ });
    } catch (e) { /* stil */ }
  }

  /* ---------- die ontdubbel-register (w911_fout_seine) ---------- */

  function leesRegister() {
    var r = {};
    var k;
    try {
      var raw = W.localStorage.getItem(SLEUTEL);
      var d = raw ? JSON.parse(raw) : null;
      if (d && d.s && typeof d.s === "object") {
        for (k in d.s) if (Object.prototype.hasOwnProperty.call(d.s, k) && typeof d.s[k] === "number") r[k] = d.s[k];
      }
    } catch (e) { /* stukkende of geblokkeerde berging = leë register; geheue hieronder vang dit */ }
    for (k in geheue) if (Object.prototype.hasOwnProperty.call(geheue, k) && !(r[k] >= geheue[k])) r[k] = geheue[k];
    return r;
  }

  function skryfRegister(r, t) {
    var sleutels = Object.keys(r).filter(function (k) { return r[k] <= t && t - r[k] < VENSTER_MS; });
    sleutels.sort(function (a, b) { return r[b] - r[a]; });
    var uit = {};
    sleutels.slice(0, MAKS_REGISTER).forEach(function (k) { uit[k] = r[k]; });
    geheue = uit;
    try { W.localStorage.setItem(SLEUTEL, JSON.stringify({ v: 1, s: uit })); } catch (e) { /* privaat/vol: die geheue-register hou */ }
  }

  /* true = ons het hierdie sein binne die laaste 10 min al deurgestuur. Kyk NET; skryf niks. */
  function dubbel(sein) {
    var t = nou();
    var vorige = leesRegister()[sein];
    /* 'n Sein uit die "toekoms" (horlosie teruggestel) tel as verstryk: nooit vir altyd stilmaak nie. */
    return typeof vorige === "number" && vorige <= t && t - vorige < VENSTER_MS;
  }

  /* Skryf die sein in — NET nadat dit werklik na Pa toe is. Het die rapporteer-pad nog nie bestaan
     nie (die skrifte onderaan <body> het nog nie gelaai nie), dan word niks gemerk nie, en die
     volgende herlaai probeer weer. Anders sou presies die fout waarvoor hierdie module gebou is —
     'n vroeë skrif wat nie laai nie — ná een keer stilgemaak word vir Wallie én vir Pa (QC 28 Okt). */
  function merkSein(sein) {
    var t = nou();
    var r = leesRegister();
    r[sein] = t;
    skryfRegister(r, t);
  }

  /* ---------- fout → inligting ---------- */

  function inligtingUitFout(soort, fout, ekstra) {
    var naam = "";
    var boodskap = "";
    var stapel = "";
    try {
      if (fout && typeof fout === "object") {
        naam = String(fout.name || "");
        boodskap = String(fout.message != null ? fout.message : "");
        stapel = String(fout.stack || "");
      } else if (fout != null) {
        boodskap = String(fout);
      }
    } catch (e) { /* vreemde voorwerp: val terug op leeg */ }
    boodskap = boodskap.replace(/^Uncaught\s+/, "");
    var volle = boodskap;
    if (naam && naam !== "Error" && boodskap.indexOf(naam) !== 0) volle = naam + ": " + boodskap;
    else if (naam === "Error" && !boodskap) volle = "Error";
    var info = {
      soort: soort,
      boodskap: volle.trim(),
      stapel: kort(stapel, 600),
      bron: ""
    };
    if (ekstra) for (var k in ekstra) if (Object.prototype.hasOwnProperty.call(ekstra, k)) info[k] = ekstra[k];
    return info;
  }

  function seinVan(info) {
    if (info.sein) return info.sein;
    if (info.soort === "hulpbron") return "hulpbron|" + (info.tag || "") + "|" + (info.pad || "");
    return info.soort + "|" + normaliseer(info.boodskap) + "|" + normaliseer(info.bron);
  }

  /* Dinge wat geen fout van ons is nie (of geen inligting dra nie). */
  function ignoreer(info) {
    var b = info.boodskap || "";
    if (info.soort === "js" && !info.bron && /^Script error\.?$/i.test(b)) return true;
    if (/ResizeObserver loop/i.test(b)) return true;
    if (/^(chrome|moz|safari-web)-extension:/i.test(String(info.volleBron || ""))) return true;
    if (/fout-vanger\.js/i.test(String(info.volleBron || ""))) return true;
    return false;
  }

  /* ---------- die antwoord (WALLIE.FOUTRAG, sinchronies, mag ontbreek) ---------- */

  function huidigeVak() {
    try {
      var s = W.WALLIE.app && typeof W.WALLIE.app.state === "function" ? W.WALLIE.app.state() : null;
      var b = s && s.live && s.live.block;
      return (b && b.subjectSlug) || undefined;
    } catch (e) {
      return undefined;
    }
  }

  function vraNavraag(info) {
    if (info.navraag) return info.navraag;
    if (info.soort === "hulpbron") return "404 " + (info.pad || "");
    return info.boodskap || "";
  }

  function soekAntwoord(info, sein) {
    try {
      var F = W.WALLIE && W.WALLIE.FOUTRAG;
      if (!F || typeof F.soek !== "function") return null;
      var t = F.soek(vraNavraag(info), { vak: info.vak || huidigeVak(), sein: sein });
      return t && typeof t === "object" && t.antwoord ? t : null;
    } catch (e) {
      return null;
    }
  }

  /* ---------- die strokie (nie-blokkerend, net textContent) ---------- */

  function sluitStrokie() {
    try {
      if (strokieTimer) { clearTimeout(strokieTimer); strokieTimer = null; }
      if (strokieEl && strokieEl.parentNode) strokieEl.parentNode.removeChild(strokieEl);
    } catch (e) { /* stil */ }
    strokieEl = null;
  }

  function bouStrokie(antwoord, paGestel, insessie) {
    var d = W.document;
    var boks = d.createElement("div");
    boks.className = "foutvanger-strokie";
    boks.setAttribute("role", "status");
    boks.setAttribute("aria-live", "polite");
    boks.setAttribute("data-foutvanger", antwoord ? "antwoord" : "onbekend");
    /* Dieselfde taal as .hulp-*: paneel-agtergrond, goue rand, kreeftekens van die app. Bo die Hulp-knoppie
       (hulp-fab: links, 4.75rem) en onder dialoë (50), die Hulp-paneel (47) en die Hulp-knoppie (45). */
    /* Die boks vang NOOIT 'n tik nie — ook nie buite 'n sessie nie. Dit het eers net tydens 'n sessie
       `pointer-events:none` gehad, en het dus 30 s lank op 'n foon oor Wallie se knoppies gelê, op
       dieselfde plek wat die Hulp-knoppie in kognitief.css al moes ontruim (QC 28 Okt, AGENTS §2.8).
       Net die toe-knoppie is klikbaar; alles anders onder die strokie bly bruikbaar. */
    boks.style.cssText =
      "position:fixed;left:1rem;bottom:8.5rem;z-index:44;box-sizing:border-box;pointer-events:none;" +
      "max-width:min(24rem,calc(100vw - 2rem));padding:0.6rem 0.8rem;border-radius:12px;" +
      "background:var(--panel,#12301f);color:var(--text,#f4f7f2);border:1px solid var(--accent,#c8a84b);" +
      "box-shadow:0 4px 14px rgba(0,0,0,0.45);font-size:0.9rem;line-height:1.35;display:flex;gap:0.6rem;align-items:flex-start;";
    /* Op 'n foon staan die Hulp-knoppie onder regs; die strokie gaan hoër op sodat dit nie oor
       "Ek is klaar" of die memo-rede lê nie. */
    try {
      if (W.matchMedia && W.matchMedia("(max-width: 640px)").matches) {
        boks.style.bottom = "11.5rem";
        boks.style.right = "1rem";
        boks.style.maxWidth = "calc(100vw - 2rem)";
      }
    } catch (e) { /* geen matchMedia: die laptop-posisie is veilig */ }

    var p = d.createElement("p");
    p.style.cssText = "margin:0;flex:1 1 auto;overflow-wrap:anywhere;";
    p.appendChild(d.createTextNode(antwoord || ONBEKEND));
    if (paGestel) {
      var klein = d.createElement("span");
      klein.style.cssText = "color:var(--muted,#9bb5a4);";
      klein.appendChild(d.createTextNode(" " + PA_TEKS));
      p.appendChild(klein);
    }
    boks.appendChild(p);

    /* Buite 'n sessie mag Wallie dit toemaak; in 'n sessie is daar geen knoppie nie (geen fokus-teiken). */
    if (!insessie) {
      var toe = d.createElement("button");
      toe.type = "button";
      toe.className = "foutvanger-toe";
      toe.setAttribute("aria-label", "Maak toe");
      /* Die enigste klikbare deel van die strokie (die boks self is pointer-events:none). */
      toe.style.cssText =
        "flex:0 0 auto;min-width:var(--hit,48px);min-height:var(--hit,48px);margin:-0.6rem -0.8rem -0.6rem 0;" +
        "border:0;background:transparent;color:var(--text,#f4f7f2);font-size:1.1rem;cursor:pointer;pointer-events:auto;";
      toe.appendChild(d.createTextNode("×"));
      toe.addEventListener("click", function () { sluitStrokie(); });
      boks.appendChild(toe);
    }
    return boks;
  }

  function monteer(boks, duur) {
    var d = W.document;
    var gasheer = d.body || d.documentElement;
    if (!gasheer) return false;
    gasheer.appendChild(boks);
    strokieEl = boks;
    strokieTimer = setTimeout(function () {
      try { if (strokieEl === boks) sluitStrokie(); } catch (e) { /* stil */ }
    }, duur);
    try { if (strokieTimer && typeof strokieTimer.unref === "function") strokieTimer.unref(); } catch (e) { /* stil */ }
    return true;
  }

  function wysStrokie(antwoord, paGestel) {
    try {
      var d = W.document;
      if (!d) return;
      var insessie = sessieAan();
      sluitStrokie();
      var boks = bouStrokie(antwoord ? kort(antwoord, 400) : "", paGestel, insessie);
      var duur = insessie ? WYS_SESSIE_MS : WYS_GEWOON_MS;
      if (d.body) { monteer(boks, duur); return; }
      /* Die fout het opgekom voor <body> bestaan (vroeë skrif): wag een keer vir DOMContentLoaded. */
      if (!wagVirBody) {
        wagVirBody = function () {
          try {
            d.removeEventListener("DOMContentLoaded", wagVirBody);
            wagVirBody = null;
            if (!strokieEl) monteer(boks, duur);
          } catch (e) { /* stil */ }
        };
        d.addEventListener("DOMContentLoaded", wagVirBody);
      }
    } catch (e) { /* die strokie is nooit belangriker as die blad nie */ }
  }

  /* ---------- rapporteer na Pa (bestaande paaie) ---------- */

  var SOORT_NAAM = { js: "JS-fout", belofte: "gebreekte belofte", hulpbron: "lêer laai nie", hand: "hand-melding" };

  function rapporteer(info, sein, treffer) {
    var paaie = 0;
    try {
      var t = nou();
      var hash = skerm();
      var tekst = [
        "OUTOMATIESE FOUT (" + (SOORT_NAAM[info.soort] || info.soort) + ")",
        "Sein: " + kort(sein, 160),
        "Boodskap: " + kort(info.boodskap || info.pad || "", 200),
        info.bron ? "Lêer: " + kort(info.bron, 120) : null,
        "Skerm: " + (hash || "—"),
        "In sessie: " + (sessieAan() ? "ja" : "nee"),
        "Wallie het gekry: " + (treffer ? "antwoord " + treffer.id : "Onbekende fout")
      ].filter(Boolean).join("\n").slice(0, 700);
      var data = {
        id: "fv_" + t.toString(36) + Math.random().toString(36).slice(2, 6),
        at: t,
        bron: "outo",
        soort: info.soort,
        sein: kort(sein, 160),
        treffer: treffer ? treffer.id || null : null,
        skerm: hash,
        insessie: sessieAan(),
        versie: String((W.WALLIE && W.WALLIE.APP_VERSION) || ""),
        stapel: info.stapel || null
      };

      var R = W.WALLIE && W.WALLIE.REMOTE;
      /* WALLIE.SYNC moet ook bestaan: sonder dit gee remote.js se `WALLIE.SYNC?.enqueue` stil
         `undefined` en niks word getou nie. Dan is "Pa kry dit" 'n leuen (QC 28 Okt, LL-22). */
      var S = W.WALLIE && W.WALLIE.SYNC;
      if (R && typeof R.bugReport === "function" && S && typeof S.enqueue === "function") {
        try {
          stil(R.bugReport({ text: tekst, data: data, blocking: false }));
          paaie += 1;
        } catch (e) { /* stil */ }
      }
      var H = W.WALLIE && W.WALLIE.HULP;
      if (H && typeof H.stuur === "function") {
        try {
          paaie += 1;
          stil(H.stuur({
            vak: "algemeen",
            gebeur: tekst,
            skerm: hash || "outo",
            bron: "outo",
            extra: data
          }));
        } catch (e) { /* stil */ }
      }
    } catch (e) { /* stil */ }
    return paaie > 0;
  }

  /* ---------- die kern ---------- */

  /* Gee: "gemeld" | "dubbel" | "limiet" | "ignoreer" | "besig" | "fout" (net vir toetse; niemand anders lees dit). */
  function verwerk(info) {
    if (besig) return "besig";
    besig = true;
    try {
      if (ignoreer(info)) return "ignoreer";
      var sein = seinVan(info);
      if (gemeld >= MAKS_PER_SESSIE) return "limiet";
      if (dubbel(sein)) return "dubbel";
      gemeld += 1;
      var treffer = soekAntwoord(info, sein);
      /* Rapporteer eers: dan weet die strokie of "Pa kry dit" waar is. */
      var gestuur = rapporteer(info, sein, treffer);
      /* Net 'n melding wat werklik in die tou is, maak die sein vir 10 min stil. */
      if (gestuur) merkSein(sein);
      if (info.wys !== false) wysStrokie(treffer ? treffer.antwoord : "", gestuur);
      return "gemeld";
    } catch (e) {
      return "fout";
    } finally {
      besig = false;
    }
  }

  /* ---------- die vangers ---------- */

  function opFout(e) {
    try {
      if (!e) return;
      var tg = e.target;
      /* 'n Hulpbron-fout borrel nie, maar die vang-fase op window sien dit. */
      if (tg && tg !== W && tg.tagName) {
        var tag = String(tg.tagName).toLowerCase();
        if (tag !== "script" && tag !== "link" && tag !== "img") return;
        var url = tag === "link" ? tg.href : tg.src;
        if (!url || !eieBron(url)) return;
        var pad = skoonPad(url);
        verwerk(inligtingUitFout("hulpbron", "Kon nie laai nie: " + pad, { tag: tag, pad: pad, bron: pad, volleBron: url }));
        return;
      }
      verwerk(inligtingUitFout("js", e.error || e.message || "", {
        bron: skoonPad(e.filename || ""),
        volleBron: e.filename || ""
      }));
    } catch (x) { /* stil */ }
  }

  function opBelofte(e) {
    try {
      var r = e ? e.reason : null;
      var info = inligtingUitFout("belofte", r == null ? "Onbekende belofte-weiering" : r);
      if (!info.boodskap) info.boodskap = "Onbekende belofte-weiering";
      verwerk(info);
    } catch (x) { /* stil */ }
  }

  /* Die hand-pad: WALLIE.FOUTVANGER.meld(fout, { bron, vak, navraag, wys }). Gooi nooit. */
  function meld(fout, opsies) {
    try {
      var o = opsies && typeof opsies === "object" ? opsies : {};
      var info = inligtingUitFout("hand", fout, { bron: o.bron ? String(o.bron) : "", vak: o.vak, navraag: o.navraag, wys: o.wys });
      if (!info.boodskap) info.boodskap = "Onbekende fout";
      return verwerk(info);
    } catch (e) {
      return "fout";
    }
  }

  W.WALLIE.FOUTVANGER = {
    SLEUTEL: SLEUTEL,
    VENSTER_MS: VENSTER_MS,
    MAKS_PER_SESSIE: MAKS_PER_SESSIE,
    meld: meld,
    /* Die sein wat 'n fout sou kry (vir toetse en vir Pa se diagnose). */
    sein: function (soort, boodskap, bron) {
      try { return seinVan({ soort: soort, boodskap: boodskap, bron: bron }); } catch (e) { return ""; }
    },
    gemeld: function () { return gemeld; },
    _geinstalleer: true,
    /* vir toetse: begin skoon sonder om die blad te herlaai */
    _herstel: function () {
      gemeld = 0;
      geheue = {};
      besig = false;
      sluitStrokie();
      try { W.localStorage.removeItem(SLEUTEL); } catch (e) { /* stil */ }
    }
  };

  try {
    /* Vang-fase op window: sien beide JS-foute en hulpbron-foute (wat nie borrel nie). */
    W.addEventListener("error", opFout, true);
    W.addEventListener("unhandledrejection", opBelofte);
  } catch (e) { /* geen blaaier-omgewing nie: niks om te vang nie */ }
})();
