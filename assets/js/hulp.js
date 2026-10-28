/* Hulp-paneel: dryfknoppie + skuifpaneel.
   Kortpaaie, vanlyn SUPPORT_FAQ (soek + per vak), en "Stuur probleem" (INSERT na wallie911.support).
   Geen ander localStorage-sleutel word gelees of geskryf nie. Die tou-sleutel is net w911_support_queue. */
(function () {
  "use strict";

  var QUEUE_KEY = "w911_support_queue";

  var TOPICS = [
    { view: "missie", titel: "Missie", wenk: "Jou plan vir vandag en die dae tot die eerste vraestel." },
    { view: "leer", titel: "Lesse", wenk: "Kort lesse per vak. Lees, doen die oefening, gaan aan." },
    { view: "sessie", titel: "Sessie", wenk: "Begin 'n gefokusde oefensessie en hou tred met tyd." },
    { view: "foutbank", titel: "Foutbank", wenk: "Foute wat jy gemaak het, sodat jy hulle herhaal tot hulle sit." },
    { view: "oefenvrae", titel: "Oefenvrae", wenk: "RTT-oefenvrae uit regte DBE-vraestelle." },
    { view: "skryfwerk", titel: "Skryfwerk", wenk: "Engels en Afrikaans skryfwerk met rubrieke." },
    { view: "probleem", titel: "Iets werk nie", wenk: "Rapporteer 'n fout gou. Pa sien dit dadelik." }
  ];

  /* Vak-volgorde soos Wallie dit in die kamp sien. */
  var GROEPE = [
    { vak: "rtt", titel: "RTT (CAT)" },
    { vak: "engels", titel: "Engels EAT" },
    { vak: "afrikaans", titel: "Afrikaans Huistaal" },
    { vak: "gasvryheid", titel: "Gasvryheidstudie" },
    { vak: "toerisme", titel: "Toerisme" },
    { vak: "wiskgelett", titel: "Wiskundige Geletterdheid" },
    { vak: "algemeen", titel: "Algemeen" }
  ];

  /* Die vyf skryf-antwoorde staan woordeliks. Hulle hoort by elke vak wat die antwoord self noem. */
  var SKRYF_STOOR = "Die app stoor nie jou skryfwerk self nie: jy skryf met die hand op lynpapier, soos in die eksamen. Die app stoor net jou self-nasien-uitslag op hierdie toestel wanneer jy op 'Stoor' druk. Sien jy 'Kon nie stoor nie', is jou blaaier waarskynlik in privaat modus of die geheue is vol: neem 'n foto van jou bladsy sodat niks verlore gaan nie, en probeer weer ná die sessie (moenie tydens 'n sessie 'n ander venster oopmaak nie: dit tel as wegkyk).";
  var VRAESTEL_MEMO = "By die Engels- en Afrikaans-skryfitems wys die app net die bron as teks (bv. 'DBE Nov 2024 EAT V3, bl. 5 (memo bl. 7)'); daar is nie 'n knoppie wat die PDF oopmaak nie. Die vraag self, die modelantwoord, formaatlys en rubriek is reeds in die app onder 'Wys memo'. Het jy die volle vraestel nodig, vra vir Pa. By RTT (CAT) maak die vraestel-, datalêer- en memoskakels die DBE-webwerf oop: as dit nie laai nie, kyk of jy internet het en probeer weer; laai die blad dan, laat weet vir Pa.";
  var TYD = "Engels EAT V3 (100 punte, 2½ uur): opstel 50 punte = 80 min (250–300 woorde); lang transaksionele teks 30 punte = 40 min (120–150 woorde); kort teks 20 punte = 30 min (80–100 woorde). Plan 10% van die tyd, skryf, en hou 5 min vir redigeer en woordtelling. Afrikaans Huistaal V3: volg die punte op die vraestel: ongeveer 1 minuut per punt plus 'n paar minute om te beplan. By die ander vakke se langer antwoorde geld dieselfde: kyk na die punte en gee omtrent 1 minuut per punt.";
  var RUBRIEK = "Maak 'n skryfitem oop en druk 'Wys memo': die rubriek (die DBE se puntebande), die formaatlys en die modelantwoord verskyn saam onder die vraag. Kyk eers ná jou getimede poging. Vir die ander vakke is die nasienriglyne in die memo van die betrokke vraestel.";
  var SONDER_NET = "Ja. Skryf op papier met 'n horlosie op die tafel; die app hoef nie aan te wees nie. Het die app reeds gelaai, wys die vraag, memo en rubriek ook sonder internet, en jou self-nasien-uitslag stoor op die toestel. Wat na Pa moet gaan, word gestuur wanneer jy weer internet het. Die RTT (CAT)-skakels na DBE-vraestelle en -datalêers het wel internet nodig: laai dit vooraf af wanneer jy internet het.";

  var ANDER = ["gasvryheid", "toerisme", "wiskgelett"];
  var SKRYF = ["engels", "afrikaans"];
  var ALMAL = ["rtt", "engels", "afrikaans", "gasvryheid", "toerisme", "wiskgelett", "algemeen"];

  /* 28 Okt: die ou teks het hulp "binne ongeveer 10 minute per e-pos" belowe. Daar is geen e-pos-pad
     in hierdie app nie en dit was nooit waar nie (spek §1 F4). Die nuwe teks sê net wat werklik gebeur:
     die melding gaan as 'n `probleem`-event na Pa se konsole, en die app gee self dadelik 'n antwoord
     as die fout-RAG een het. */
  var GESTUUR = "Gestuur. Pa sien dit op sy konsole.";
  var GESTUUR_MET_ANTWOORD = "Gestuur — Pa sien dit. Hier is wat jy nou kan doen:";

  var SUPPORT_FAQ = [
    {
      id: "rtt-maak-oop",
      vakke: ["rtt"],
      vraag: "Word, Excel of die datalêer maak nie oop nie.",
      antwoord: "Die app maak nie Word, Excel of Access oop nie: jy werk self in daardie programme. Die datalêer is 'n wagwoordbeskermde .exe en werk net op Windows. Die wagwoord staan in die vraestel se instruksies (gewoonlik bladsy 1-2), nie in die app nie. Die knoppie Datalêers op die sessieskerm maak die DBE-webwerf oop; laai die lêer daar af en hardloop die .exe op Windows."
    },
    {
      id: "rtt-skakel",
      vakke: ["rtt"],
      vraag: "Die DBE-skakel (vraestel, datalêer of memo) laai nie.",
      antwoord: "By RTT (CAT) maak die knoppies Vraestel (PDF), Datalêers en Memo die DBE-webwerf (education.gov.za) in 'n nuwe oortjie oop. Dit het internet nodig. As dit nie laai nie, kyk of jy internet het en probeer weer. Laai die blad dan, laat weet vir Pa."
    },
    {
      id: "rtt-slot",
      vakke: ["rtt", "algemeen"],
      vraag: "Die skerm sluit wanneer ek die oortjie verlaat.",
      antwoord: "In 'n gewone sessie tel 'n oortjie wat weg is as een waarskuwing. Na 3 waarskuwings sluit die skerm en die tyd staan stil. Tydens 'n RTT-praktiese blok tel oorskakel na Word, Excel, Access of Notepad nie as wegkyk nie: geen waarskuwing en geen slot nie. Pa sien steeds hoe lank jy weg was."
    },
    {
      id: "rtt-praktiese-blok",
      vakke: ["rtt"],
      vraag: "Ek moet Word/Excel gebruik, maar die app wil hê ek moet op die blad bly (minimiseer).",
      antwoord: "Kies RTT (CAT) op die Sessie-skerm, druk Begin sessie en dan die groot knoppie 'Begin praktiese blok (Office)'. Van daar af mag jy die blaaier minimiseer en in Word, Excel, Access of Notepad werk: geen waarskuwing en geen slot nie (tot 3 uur 15 min). Druk 'Klaar met prakties' wanneer jy klaar is. Sonder die praktiese blok tel elke keer wat jy weggaan as 'n waarskuwing, en na 3 sluit die skerm."
    },
    {
      id: "rtt-stoor",
      vakke: ["rtt"],
      vraag: "Hoe stoor ek my RTT-praktiese werk?",
      antwoord: "Jou Word-, Excel- en Access-werk stoor NIE in die app nie: stoor self in die program (Ctrl+S) met die lêernaam wat die vraestel vra, in 'n vouer soos Dokumente\\RTT-eksamen. Stoor elke 10 minute. Die app hou net die tyd en jou self-nasien-punte. Maak die lêers ná die tyd toe voordat jy met die memo nasien."
    },
    {
      id: "rtt-wagwoord",
      vakke: ["rtt"],
      vraag: "Die datalêer (.exe) vra 'n wagwoord.",
      antwoord: "Die DBE-datalêers is wagwoordbeskermde .exe-lêers wat net op Windows werk. Die wagwoord staan in die vraestel se instruksies (gewoonlik bladsy 1-2 van die PDF), nie in die app nie. Tik dit presies soos daar (hoof- en kleinletters tel). Waarsku Windows oor die .exe, kies 'More info' en dan 'Run anyway'."
    },
    {
      id: "ander-vraestel",
      vakke: ANDER,
      vraag: "Die vraestel of memo maak nie oop nie (Toerisme / Gasvryheid / Wiskundige Geletterdheid).",
      antwoord: "Pa gee jou die vraestel op papier of as PDF. In 'n sessie druk jy 'Maak memo oop (PDF)' en kies die memo-lêer op jou rekenaar: dit wys binne die app en tel nie as wegkyk nie (maks 15 min, Pa kry 'n sein). Kies die knoppie maar niks gebeur nie, kyk of die lêer 'n PDF of foto is. Het jy nie die lêer nie, vra vir Pa."
    },
    {
      id: "sakrekenaar",
      vakke: ANDER,
      vraag: "Mag ek 'n sakrekenaar gebruik?",
      antwoord: "Ja, gebruik 'n gewone sakrekenaar op die tafel, soos in die eksamen (Wiskundige Geletterdheid het dit nodig; Toerisme vir wisselkoerse en tydsones; Gasvryheid vir koste en porsies). Moenie die Windows-sakrekenaar gebruik nie: oorskakel na 'n ander program tel in 'n sessie as 'n waarskuwing."
    },
    {
      id: "ander-tyd",
      vakke: ANDER,
      vraag: "Hoe verdeel ek my tyd in die vraestel?",
      antwoord: "Omtrent 1 minuut per punt. Kyk eers vinnig deur die hele vraestel (5 min), doen die vrae wat jy ken eerste, en hou 10 min aan die einde om antwoorde en eenhede (R, km, ure) na te gaan. Toerisme en Gasvryheid: 3 uur vir 200 punte. Wiskundige Geletterdheid: wys altyd jou bewerking, want dit kry punte al is die antwoord verkeerd."
    },
    {
      id: "skryf-tyd-vraag",
      vakke: SKRYF,
      vraag: "Ek raak uit tyd by een vraag (opstel/brief).",
      antwoord: "Sit 'n horlosie op die tafel en skryf die eindtyd vir elke vraag bo-aan die bladsy voor jy begin. Is die tyd vir 'n vraag verby, skryf 'n slotsin en gaan aan: 'n onklaar opstel met 'n slot kry meer punte as 'n kort transaksionele teks wat ontbreek."
    },
    {
      id: "skryf-stoor",
      vakke: SKRYF,
      vraag: "My skryfstuk (opstel, brief, dialoog) stoor nie in die app nie.",
      antwoord: SKRYF_STOOR
    },
    {
      id: "vraestel-memo",
      vakke: SKRYF.concat(["rtt"]),
      vraag: "Die vraestel of memo maak nie oop nie (Engels / Afrikaans).",
      antwoord: VRAESTEL_MEMO
    },
    {
      id: "tyd",
      vakke: SKRYF.concat(ANDER),
      vraag: "Hoeveel tyd het ek per skryfvraag?",
      antwoord: TYD
    },
    {
      id: "rubriek",
      vakke: SKRYF.concat(ANDER),
      vraag: "Waar kry ek die rubriek?",
      antwoord: RUBRIEK
    },
    {
      id: "sonder-net",
      vakke: ALMAL,
      vraag: "Kan ek sonder internet skryf?",
      antwoord: SONDER_NET
    },
    {
      id: "stuur",
      vakke: ["algemeen"],
      vraag: "Hoe stuur ek 'n probleem vir Pa?",
      antwoord: "Gebruik die vorm Stuur probleem hier onder. Kies die vak, skryf wat gebeur het, en op watter skerm jy was. Pa kry dit. Sonder internet bly dit op hierdie toestel en gaan deur sodra jy weer aanlyn is."
    }
  ];

  var open = false;
  var lastFocus = null;
  var lastVak = null;
  var skermOuto = true;
  var vakOuto = true;
  var flushing = false;

  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (text != null) n.textContent = text;
    return n;
  }

  function titelVan(vak) {
    for (var i = 0; i < GROEPE.length; i++) if (GROEPE[i].vak === vak) return GROEPE[i].titel;
    return vak || "";
  }

  function vakKen(vak) {
    return GROEPE.some(function (g) { return g.vak === vak; });
  }

  function overlayOop() {
    return !!document.querySelector(".modal:not(.hidden), .les-viewer:not(.hidden)");
  }

  /* Watter vak se skerm is nou oop? Les-kyker, Lesse, Oefenvrae (RTT), 'n oop skryfitem, of die sessie se vak. */
  function huidigeVak() {
    var viewer = document.getElementById("les-viewer");
    if (viewer && !viewer.classList.contains("hidden")) {
      var naam = (document.getElementById("les-subject") || {}).textContent || "";
      var subs = (window.WALLIE && WALLIE.SUBJECTS) || [];
      for (var i = 0; i < subs.length; i++) if (subs[i].naam === naam.trim()) return subs[i].slug;
    }
    var view = document.querySelector("section.view.active");
    if (!view) return null;
    if (view.id === "view-leer") {
      var b = view.querySelector(".leer-subject.active");
      var slug = b && b.getAttribute("data-leer");
      return slug && slug !== "foutbank" ? slug : null;
    }
    if (view.id === "view-oefenvrae") return "rtt";
    if (view.id === "view-skryfwerk") {
      var bron = view.querySelector(".sw-bron");
      var t = bron ? bron.textContent : "";
      if (/\bHT\b/.test(t)) return "afrikaans";
      if (/\bEAT\b/.test(t)) return "engels";
      return null;
    }
    if (view.id === "view-sessie") {
      try {
        if (window.WALLIE && WALLIE.proctor && WALLIE.proctor.active) {
          var s = JSON.parse(localStorage.getItem("wallie911_v2_bok") || "null");
          if (s && s.live && s.live.subject && vakKen(s.live.subject)) return s.live.subject;
        }
      } catch (e) { /* ignore */ }
      var sel = document.getElementById("session-subject");
      return sel && vakKen(sel.value) ? sel.value : null;
    }
    return null;
  }

  function skermNaam() {
    var v = huidigeVak();
    if (v) return titelVan(v);
    var view = document.querySelector("section.view.active");
    if (!view) return "";
    var id = view.id.replace(/^view-/, "");
    var btn = document.querySelector('.nav-btn[data-view="' + id + '"]');
    return btn ? btn.textContent.replace(/\s+/g, " ").trim() : id;
  }

  function norm(s) {
    return String(s || "").toLowerCase();
  }

  function goTo(view) {
    var btn = document.querySelector('.nav-btn[data-view="' + view + '"]');
    if (btn) btn.click();
    else if (document.getElementById("view-" + view)) location.hash = view;
    close();
  }

  var fab = el("button", { type: "button", id: "hulp-fab", class: "hulp-fab", "aria-haspopup": "dialog", "aria-controls": "hulp-paneel", "aria-expanded": "false" }, "? Hulp");
  var backdrop = el("div", { class: "hulp-backdrop", hidden: "" });
  var panel = el("aside", { id: "hulp-paneel", class: "hulp-paneel", role: "dialog", "aria-modal": "true", "aria-labelledby": "hulp-titel", hidden: "" });

  var head = el("div", { class: "hulp-head" });
  head.appendChild(el("h2", { id: "hulp-titel" }, "Hulp"));
  var closeBtn = el("button", { type: "button", class: "hulp-close", "aria-label": "Maak hulp toe" }, "\u2715");
  head.appendChild(closeBtn);
  panel.appendChild(head);

  var body = el("div", { class: "hulp-body" });
  body.appendChild(el("p", { class: "hulp-intro" }, "Kies waar jy heen wil, of rapporteer 'n probleem. Geen skaamte nie: foute help ons die kamp regmaak."));
  var list = el("ul", { class: "hulp-lys" });
  TOPICS.forEach(function (t) {
    var li = el("li");
    var b = el("button", { type: "button", class: "hulp-item", "data-hulp-view": t.view });
    b.appendChild(el("strong", null, t.titel));
    b.appendChild(el("span", null, t.wenk));
    li.appendChild(b);
    list.appendChild(li);
  });
  body.appendChild(list);

  var soekLabel = el("label", { class: "hulp-soek-label" }, "Soek in die hulp");
  var soek = el("input", { type: "search", id: "hulp-soek", class: "hulp-soek", placeholder: "Soek, bv. rubriek of dataleer" });
  soekLabel.appendChild(soek);
  body.appendChild(soekLabel);
  var faqRoot = el("div", { id: "hulp-faq" });
  body.appendChild(faqRoot);

  var form = el("form", { id: "hulp-vorm", class: "hulp-vorm" });
  form.appendChild(el("h3", null, "Stuur probleem"));
  var vakLabel = el("label", null, "Vak");
  var vakSel = el("select", { id: "hulp-vak", required: "" });
  vakSel.appendChild(el("option", { value: "" }, "Kies 'n vak"));
  GROEPE.forEach(function (g) {
    vakSel.appendChild(el("option", { value: g.vak }, g.titel));
  });
  vakLabel.appendChild(vakSel);
  /* Die keuse-pad (28 Okt): Wallie kies wat gebeur en kry dadelik die antwoord, nog voor hy stuur.
     Vrye teks bly vir wat nie in die lys is nie. */
  var simptoomLabel = el("label", null, "Wat gebeur? Kies die naaste");
  var simptoomSel = el("select", { id: "hulp-simptoom" });
  simptoomLabel.appendChild(simptoomSel);
  var gebeurLabel = el("label", null, "Of beskryf dit self (of voeg by)");
  var gebeur = el("textarea", { id: "hulp-gebeur", rows: "3" });
  gebeurLabel.appendChild(gebeur);
  var skermLabel = el("label", null, "Op watter skerm");
  var skerm = el("input", { type: "text", id: "hulp-skerm", required: "" });
  skermLabel.appendChild(skerm);
  var stuur = el("button", { type: "submit", class: "btn primary", id: "hulp-stuur" }, "Stuur probleem");
  form.appendChild(vakLabel);
  form.appendChild(simptoomLabel);
  form.appendChild(gebeurLabel);
  form.appendChild(skermLabel);
  form.appendChild(stuur);
  body.appendChild(form);
  var statusEl = el("p", { id: "hulp-status", class: "hulp-status", role: "status" }, "");
  body.appendChild(statusEl);
  /* Die dadelike antwoord uit die fout-RAG. Hergebruik die FAQ se `.hulp-qa`-styl, sodat hierdie
     module geen nuwe CSS nodig het nie. */
  var antwoordEl = el("div", { id: "hulp-antwoord", hidden: "" });
  body.appendChild(antwoordEl);
  body.appendChild(el("p", { class: "hulp-voet" }, "Sneltoets: druk Esc om hierdie paneel toe te maak."));
  panel.appendChild(body);

  function renderFaq() {
    var q = norm(soek.value).trim();
    var vak = huidigeVak();
    var seen = {};
    faqRoot.textContent = "";
    GROEPE.forEach(function (g) {
      if (!q && vak && g.vak !== vak && g.vak !== "algemeen") return;
      var items = SUPPORT_FAQ.filter(function (e) {
        if (e.vakke.indexOf(g.vak) < 0) return false;
        if (q && seen[e.id]) return false;
        if (!q) return true;
        return norm(e.vraag + " " + e.antwoord).indexOf(q) >= 0;
      });
      if (!items.length) return;
      var sec = el("section", { class: "hulp-groep", "data-vak": g.vak });
      sec.appendChild(el("h3", null, g.titel));
      items.forEach(function (e) {
        if (q) seen[e.id] = true;
        var art = el("article", { class: "hulp-qa" });
        art.appendChild(el("h4", null, e.vraag));
        art.appendChild(el("p", null, e.antwoord));
        sec.appendChild(art);
      });
      faqRoot.appendChild(sec);
    });
    if (!faqRoot.childNodes.length) {
      faqRoot.appendChild(el("p", { class: "hulp-intro" }, "Niks gevind nie. Probeer 'n ander woord, of stuur die probleem hier onder."));
    }
  }

  function pasKonteks() {
    var v = huidigeVak();
    if (v !== lastVak) {
      lastVak = v;
      if (!soek.value.trim()) renderFaq();
    }
    if (skermOuto) skerm.value = skermNaam();
    if (vakOuto && v && vakKen(v)) vakSel.value = v;
  }

  function setOpen(v, opts) {
    opts = opts || {};
    if (v && overlayOop()) return;
    open = v;
    panel.hidden = backdrop.hidden = !v;
    fab.setAttribute("aria-expanded", v ? "true" : "false");
    if (v) {
      lastFocus = document.activeElement;
      pasKonteks();
      renderFaq();
      vulKeuses();
      closeBtn.focus();
    } else if (!opts.keepFocus && lastFocus && lastFocus.focus) {
      try { lastFocus.focus(); } catch (e) { /* ignore */ }
    }
  }
  function close(opts) { if (open) setOpen(false, opts); }

  function loadQueue() {
    try {
      var raw = localStorage.getItem(QUEUE_KEY);
      var q = raw ? JSON.parse(raw) : [];
      return Array.isArray(q) ? q : [];
    } catch (e) { return []; }
  }
  function saveQueue(q) {
    try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); return true; } catch (e) { return false; }
  }

  /* Die presiese kolomme van wallie911.support (sien tests/fixtures/support-schema.json).
     Stuur NET bestaande kolomme: PostgREST weier die hele ry (400) as een sleutel nie bestaan nie. */
  function supportBody(row) {
    var ctx = { skerm: row.skerm || "", bron: row.bron || "hulp", href: String(location.href || "").slice(0, 300) };
    if (row.extra && typeof row.extra === "object") ctx.extra = row.extra;
    return {
      vak: row.vak,
      gebeur: row.gebeur,
      skerm: row.skerm,
      category: row.vak,
      message: row.gebeur,
      context: ctx,
      app_version: String((window.WALLIE && WALLIE.APP_VERSION) || ""),
      ua: String((typeof navigator !== "undefined" && navigator.userAgent) || "").slice(0, 200)
    };
  }

  function insertRow(row) {
    var live = window.WALLIE && WALLIE.LIVE;
    if (!live || !live.url || !live.key || typeof fetch !== "function") return Promise.resolve(false);
    var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 15000) : null;
    return fetch(live.url + "/rest/v1/support", {
      method: "POST",
      headers: {
        apikey: live.key,
        "Content-Type": "application/json",
        "Content-Profile": "wallie911",
        Accept: "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify(supportBody(row)),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      if (timer) clearTimeout(timer);
      return !!(res && res.ok);
    }, function () {
      if (timer) clearTimeout(timer);
      return false;
    });
  }

  function setStatus(text, ok) {
    statusEl.textContent = text;
    statusEl.className = "hulp-status" + (ok ? " is-ok" : "");
  }

  /* Die dadelike antwoord: wat Wallie NOU kan doen. Gee die RAG niks terug nie, bly dit leeg —
     ons dink nooit 'n antwoord uit nie (AGENTS.md §2.4). Gee true as daar 'n antwoord was. */
  function toonAntwoord(t) {
    antwoordEl.textContent = "";
    antwoordEl.hidden = true;
    if (!t || !t.antwoord) return false;
    var art = el("article", { class: "hulp-qa" });
    art.appendChild(el("h4", null, "Doen dit solank"));
    art.appendChild(el("p", null, t.antwoord));
    antwoordEl.appendChild(art);
    antwoordEl.hidden = false;
    return true;
  }

  function wysAntwoord(vraag, vak) {
    try {
      var rag = window.WALLIE && WALLIE.FOUTRAG;
      if (!rag || !rag.soek) return toonAntwoord(null);
      return toonAntwoord(rag.soek(vraag, { vak: vak }));
    } catch (e) {
      return toonAntwoord(null);
    }
  }

  /* Die gekose simptoom se antwoord, direk uit die korpus (geen telling nie). */
  function wysGekose() {
    try {
      var rag = window.WALLIE && WALLIE.FOUTRAG;
      var id = simptoomSel.value;
      if (!id || !rag || !rag.antwoordVir) return toonAntwoord(null);
      return toonAntwoord(rag.antwoordVir(id));
    } catch (e) {
      return toonAntwoord(null);
    }
  }

  /* Vul die keuselys vir die vak. Die korpus laai asinchronies: is dit nog nie daar nie, probeer ons
     by die volgende oopmaak of vak-wissel weer. Die huidige keuse bly staan as dit nog bestaan. */
  function vulKeuses() {
    try {
      var rag = window.WALLIE && WALLIE.FOUTRAG;
      if (rag && rag.laai && rag.gereed && !rag.gereed()) rag.laai();
      var keuses = rag && rag.keuses ? rag.keuses(String(vakSel.value || huidigeVak() || "")) : [];
      var was = simptoomSel.value;
      simptoomSel.textContent = "";
      simptoomSel.appendChild(el("option", { value: "" }, keuses.length ? "Kies wat gebeur…" : "Iets anders (beskryf dit hier onder)"));
      var bly = false;
      keuses.forEach(function (k) {
        simptoomSel.appendChild(el("option", { value: k.id }, k.teks));
        if (k.id === was) bly = true;
      });
      if (keuses.length) simptoomSel.appendChild(el("option", { value: "" }, "Iets anders (beskryf dit hier onder)"));
      simptoomSel.value = bly ? was : "";
      /* style, nie `hidden` nie: `.hulp-vorm label { display: grid }` oorskryf die hidden-attribuut. */
      simptoomLabel.style.display = keuses.length ? "" : "none";
    } catch (e) { /* die vorm werk steeds met vrye teks */ }
  }

  /* Pa moet dit SIEN. `wallie911.support` word deur niks gelees nie (spek §1 F2), daarom gaan
     dieselfde melding ook as 'n `probleem`-event deur die gewone sinkronisering — 'n soort wat
     `wallie_ingest_v2` reeds ken, dus geen skemawysiging nie (AGENTS.md §2.2). */
  function meldAanPa(row) {
    try {
      var r = window.WALLIE && WALLIE.REMOTE;
      if (!r || typeof r.bugReport !== "function") return;
      r.bugReport({
        text: ["Vak: " + (row.vak || "algemeen"), "Skerm: " + (row.skerm || "?"), row.gebeur]
          .filter(Boolean)
          .join("\n"),
        data: {
          id: row.id,
          bron: row.bron || "hulp",
          vak: row.vak,
          skerm: row.skerm,
          simptoom: row.simptoom || "",
          subjectSlug: row.vak,
          href: String(location.href || "").slice(0, 300)
        },
        blocking: false
      });
    } catch (e) { /* die melding mag nooit die vorm breek nie */ }
  }

  function flush() {
    if (flushing) return;
    var q = loadQueue();
    if (!q.length) return;
    flushing = true;
    function next() {
      if (!q.length) { flushing = false; saveQueue([]); return; }
      insertRow(q[0]).then(function (ok) {
        if (!ok) { flushing = false; saveQueue(q); return; }
        q.shift();
        saveQueue(q);
        if (!q.length) setStatus(GESTUUR, true);
        next();
      });
    }
    next();
  }

  fab.addEventListener("click", function () { setOpen(!open); });
  closeBtn.addEventListener("click", function () { close(); });
  backdrop.addEventListener("click", function () { close(); });
  list.addEventListener("click", function (e) {
    var b = e.target.closest("[data-hulp-view]");
    if (b) goTo(b.getAttribute("data-hulp-view"));
  });
  soek.addEventListener("input", renderFaq);
  vakSel.addEventListener("change", function () { vakOuto = false; vulKeuses(); wysGekose(); });
  simptoomSel.addEventListener("change", function () {
    /* Dadelik: die antwoord verskyn sodra hy kies, nog voor hy stuur. */
    if (wysGekose()) setStatus("Hier is wat jy nou kan doen. Druk 'Stuur probleem' sodat Pa dit ook sien.", true);
    else setStatus("", false);
  });
  skerm.addEventListener("input", function () { skermOuto = false; });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var gekose = simptoomSel.value && simptoomSel.selectedIndex >= 0
      ? simptoomSel.options[simptoomSel.selectedIndex].textContent : "";
    var eie = String(gebeur.value || "").trim();
    var row = {
      id: "s_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      vak: String(vakSel.value || "").trim(),
      gebeur: [gekose, eie].filter(Boolean).join("\n"),
      skerm: String(skerm.value || "").trim(),
      simptoom: simptoomSel.value || ""
    };
    if (!row.vak || !row.gebeur || !row.skerm) {
      setStatus("Kies die vak, kies of beskryf wat gebeur het, en die skerm.", false);
      return;
    }
    stuur.disabled = true;
    /* Eers Pa in kennis stel (dit staan in die tou en oorleef vanlyn), dan die antwoord wys. */
    meldAanPa(row);
    var hetAntwoord = row.simptoom ? wysGekose() : wysAntwoord(row.gebeur, row.vak);
    insertRow(row).then(function (ok) {
      stuur.disabled = false;
      if (ok) {
        gebeur.value = "";
        setStatus(hetAntwoord ? GESTUUR_MET_ANTWOORD : GESTUUR, true);
        return;
      }
      var q = loadQueue();
      q.push(row);
      if (!saveQueue(q)) {
        setStatus("Kon nie stoor nie. Neem 'n foto van die skerm en stuur dit vir Pa.", false);
        return;
      }
      gebeur.value = "";
      setStatus("Geen verbinding nie. Jou probleem is op hierdie toestel gestoor en word gestuur sodra jy weer internet het.", true);
    });
  });

  document.addEventListener("keydown", function (e) {
    if (overlayOop()) { close({ keepFocus: true }); return; }
    if (!open) return;
    if (e.key === "Escape") { close(); return; }
    if (e.key === "Tab") {
      var f = panel.querySelectorAll("button, a[href], input, select, textarea");
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  document.addEventListener("click", function () { if (open) pasKonteks(); });
  document.addEventListener("change", function () { if (open) pasKonteks(); });
  window.addEventListener("hashchange", function () { if (open) pasKonteks(); });
  window.addEventListener("online", flush);

  new MutationObserver(function () {
    if (open && overlayOop()) close({ keepFocus: true });
  }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["class"] });

  /* Publieke ingang: die ou "Iets werk nie"-vorm (app.js) stuur ook hierdeur, sodat elke probleem
     in wallie911.support beland (en vanlyn in dieselfde tou wag). Gee "gestuur" | "tou" | "fout". */
  window.WALLIE = window.WALLIE || {};
  WALLIE.HULP = {
    GESTUUR: GESTUUR,
    body: supportBody,
    stuur: function (row) {
      var r = {
        id: "s_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        vak: String(row.vak || "algemeen"),
        gebeur: String(row.gebeur || ""),
        skerm: String(row.skerm || ""),
        bron: row.bron || "hulp",
        extra: row.extra || null
      };
      return insertRow(r).then(function (ok) {
        if (ok) return "gestuur";
        var q = loadQueue();
        q.push(r);
        return saveQueue(q) ? "tou" : "fout";
      });
    }
  };

  document.body.appendChild(fab);
  document.body.appendChild(backdrop);
  document.body.appendChild(panel);
  flush();
})();
