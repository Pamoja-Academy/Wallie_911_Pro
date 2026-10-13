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
  var SKRYF_STOOR = "Die app stoor nie jou skryfwerk self nie: jy skryf met die hand op lynpapier, soos in die eksamen. Die app stoor net jou self-nasien-uitslag op hierdie toestel wanneer jy op 'Stoor' druk. Sien jy 'Kon nie stoor nie', is jou blaaier waarskynlik in privaat modus of die geheue is vol: maak 'n gewone venster oop en probeer weer. Neem 'n foto van jou bladsy en skryf jou punt in die foutlog sodat niks verlore gaan nie.";
  var VRAESTEL_MEMO = "By die Engels- en Afrikaans-skryfitems wys die app net die bron as teks (bv. 'DBE Nov 2024 EAT V3, bl. 5 (memo bl. 7)'); daar is nie 'n knoppie wat die PDF oopmaak nie. Die vraag self, die modelantwoord, formaatlys en rubriek is reeds in die app onder 'Wys memo'. Het jy die volle vraestel nodig, vra vir Pa. By RTT (CAT) maak die vraestel-, datalêer- en memoskakels die DBE-webwerf oop: as dit nie laai nie, kyk of jy internet het en probeer weer; laai die blad dan, laat weet vir Pa.";
  var TYD = "Engels EAT V3 (100 punte, 2½ uur): opstel 50 punte = 80 min (250–300 woorde); lang transaksionele teks 30 punte = 40 min (120–150 woorde); kort teks 20 punte = 30 min (80–100 woorde). Plan 10% van die tyd, skryf, en hou 5 min vir redigeer en woordtelling. Afrikaans Huistaal V3: volg die punte op die vraestel: ongeveer 1 minuut per punt plus 'n paar minute om te beplan. By die ander vakke se langer antwoorde geld dieselfde: kyk na die punte en gee omtrent 1 minuut per punt.";
  var RUBRIEK = "Maak 'n skryfitem oop en druk 'Wys memo': die rubriek (die DBE se puntebande), die formaatlys en die modelantwoord verskyn saam onder die vraag. Kyk eers ná jou getimede poging. Vir die ander vakke is die nasienriglyne in die memo van die betrokke vraestel.";
  var SONDER_NET = "Ja. Skryf op papier met 'n horlosie op die tafel; die app hoef nie aan te wees nie. Het die app reeds gelaai, wys die vraag, memo en rubriek ook sonder internet, en jou self-nasien-uitslag stoor op die toestel. Wat na Pa moet gaan, word gestuur wanneer jy weer internet het. Die RTT (CAT)-skakels na DBE-vraestelle en -datalêers het wel internet nodig: laai dit vooraf af wanneer jy internet het.";

  var ANDER = ["gasvryheid", "toerisme", "wiskgelett"];
  var SKRYF = ["engels", "afrikaans"];
  var ALMAL = ["rtt", "engels", "afrikaans", "gasvryheid", "toerisme", "wiskgelett", "algemeen"];

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
  var gebeurLabel = el("label", null, "Wat het gebeur");
  var gebeur = el("textarea", { id: "hulp-gebeur", rows: "3", required: "" });
  gebeurLabel.appendChild(gebeur);
  var skermLabel = el("label", null, "Op watter skerm");
  var skerm = el("input", { type: "text", id: "hulp-skerm", required: "" });
  skermLabel.appendChild(skerm);
  var stuur = el("button", { type: "submit", class: "btn primary", id: "hulp-stuur" }, "Stuur probleem");
  form.appendChild(vakLabel);
  form.appendChild(gebeurLabel);
  form.appendChild(skermLabel);
  form.appendChild(stuur);
  body.appendChild(form);
  var statusEl = el("p", { id: "hulp-status", class: "hulp-status", role: "status" }, "");
  body.appendChild(statusEl);
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
      body: JSON.stringify({ vak: row.vak, gebeur: row.gebeur, skerm: row.skerm }),
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
        if (!q.length) setStatus("Gestuur. Pa kry jou boodskap.", true);
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
  vakSel.addEventListener("change", function () { vakOuto = false; });
  skerm.addEventListener("input", function () { skermOuto = false; });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var row = {
      id: "s_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      vak: String(vakSel.value || "").trim(),
      gebeur: String(gebeur.value || "").trim(),
      skerm: String(skerm.value || "").trim()
    };
    if (!row.vak || !row.gebeur || !row.skerm) {
      setStatus("Vul die vak, wat gebeur het, en die skerm in.", false);
      return;
    }
    stuur.disabled = true;
    insertRow(row).then(function (ok) {
      stuur.disabled = false;
      if (ok) {
        gebeur.value = "";
        setStatus("Gestuur. Pa kry jou boodskap.", true);
        return;
      }
      var q = loadQueue();
      q.push(row);
      if (!saveQueue(q)) {
        setStatus("Kon nie stoor nie. Maak 'n gewone venster oop, of neem 'n foto en sê vir Pa.", false);
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

  document.body.appendChild(fab);
  document.body.appendChild(backdrop);
  document.body.appendChild(panel);
  flush();
})();
