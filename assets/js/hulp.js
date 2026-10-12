/* Hulp-paneel: dryfknoppie + skuifpaneel met kort wenke en kortpaaie. Staan op sy eie; geen afhanklikhede nie. */
(function () {
  "use strict";

  var TOPICS = [
    { view: "missie", titel: "Missie", wenk: "Jou plan vir vandag en die dae tot die eerste vraestel." },
    { view: "leer", titel: "Lesse", wenk: "Kort lesse per vak. Lees, doen die oefening, gaan aan." },
    { view: "sessie", titel: "Sessie", wenk: "Begin 'n gefokusde oefensessie en hou tred met tyd." },
    { view: "foutbank", titel: "Foutbank", wenk: "Foute wat jy gemaak het, sodat jy hulle herhaal tot hulle sit." },
    { view: "oefenvrae", titel: "Oefenvrae", wenk: "RTT-oefenvrae uit regte DBE-vraestelle." },
    { view: "skryfwerk", titel: "Skryfwerk", wenk: "Engels en Afrikaans skryfwerk met rubrieke." },
    { view: "probleem", titel: "Iets werk nie", wenk: "Rapporteer 'n fout gou. Pa sien dit dadelik." }
  ];

  var open = false;
  var lastFocus = null;

  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (text != null) n.textContent = text;
    return n;
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
  var closeBtn = el("button", { type: "button", class: "hulp-close", "aria-label": "Maak hulp toe" }, "✕");
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
  body.appendChild(el("p", { class: "hulp-voet" }, "Sneltoets: druk Esc om hierdie paneel toe te maak."));
  panel.appendChild(body);

  function setOpen(v) {
    open = v;
    panel.hidden = backdrop.hidden = !v;
    fab.setAttribute("aria-expanded", v ? "true" : "false");
    if (v) {
      lastFocus = document.activeElement;
      closeBtn.focus();
    } else if (lastFocus && lastFocus.focus) {
      lastFocus.focus();
    }
  }
  function close() { if (open) setOpen(false); }

  fab.addEventListener("click", function () { setOpen(!open); });
  closeBtn.addEventListener("click", close);
  backdrop.addEventListener("click", close);
  list.addEventListener("click", function (e) {
    var b = e.target.closest("[data-hulp-view]");
    if (b) goTo(b.getAttribute("data-hulp-view"));
  });
  document.addEventListener("keydown", function (e) {
    if (!open) return;
    if (e.key === "Escape") { close(); return; }
    if (e.key === "Tab") {
      var f = panel.querySelectorAll("button");
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  document.body.appendChild(fab);
  document.body.appendChild(backdrop);
  document.body.appendChild(panel);
})();
