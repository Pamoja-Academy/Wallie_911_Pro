/* Voorskou-wag. MOET die eerste skrip in index.html wees (voor enige ander skrip).

   Wanneer aktief?
   - pamoja-academy.github.io (lewendig)      → heeltemal NIKS (geen omhulsels, geen banier).
   - localhost / 127.0.0.1 / [::1]            → NIKS (die Playwright-toetse loop hier met hul eie nagemaakte bediener),
                                                 BEHALWE met ?voorskou-toets=1 in die URL: dan presies die voorskougedrag
                                                 (net vir toetse). Die parameter word op enige ander gasheer geïgnoreer,
                                                 so dit kan die wag nooit AF skakel nie.
   - enige ander gasheer (bv. raw.githack.com, file://) → AKTIEF.

   Wat word geblokkeer? Versoeke na *.supabase.co (en supabase.co) en ntfy.sh (en *.ntfy.sh). Alles anders gaan normaal.
   Wat kry die app terug? Presies wat 'n vanlyn blaaier gee, sodat die bestaande kode dit as "vanlyn" hanteer
   (die tou bly plaaslik en niks gaan verlore nie):
   - fetch(...)               → Promise verwerp met TypeError("Failed to fetch (VOORSKOU: geblokkeer)").
                                  LIVE.rpc gee dan { ok:false, transient:true, status:0, error:"netwerk: ..." }.
   - XMLHttpRequest.send()    → geen netwerk; asinchroon readyState 4, status 0, leë response, dan die gebeure
                                  'readystatechange', 'error' en 'loadend' (soos 'n netwerkfout).
   - navigator.sendBeacon()   → false (die blaaier kon dit nie in die tou sit nie), niks gestuur.
   - new WebSocket(...)       → 'n vals voorwerp met readyState 3 (CLOSED); asinchroon 'error' en daarna 'close' (kode 1006).
   - new EventSource(...)     → 'n vals voorwerp met readyState 2 (CLOSED); asinchroon 'error'.
   Bo-aan verskyn 'n vaste banier (#voorskou-banier). body kry padding-top en die taai .topbar skuif af,
   sodat geen bestaande kontrole versteek word nie.
   window.__VOORSKOU__ = { aktief:true, geblokkeer:[...urls] } net wanneer aktief (vir toetse en diagnose). */
(function () {
  "use strict";
  var LIVE_HOST = "pamoja-academy.github.io";
  var loc = window.location;
  var host = String((loc && loc.hostname) || "").toLowerCase();
  if (host === LIVE_HOST) return;
  var isLocal = host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host === "::1";
  var toets = /(?:^|[?&])voorskou-toets=1(?:&|$)/.test(String((loc && loc.search) || "").replace(/^\?/, ""));
  if (isLocal && !toets) return;

  var BANIER_TEKS = "VOORSKOU — niks word na die bediener gestuur nie.";
  var state = { aktief: true, geblokkeer: [] };
  window.__VOORSKOU__ = state;

  function isBlocked(url) {
    var h;
    try {
      h = new URL(String(url), loc.href).hostname.toLowerCase();
    } catch (e) {
      return false;
    }
    return h === "supabase.co" || /\.supabase\.co$/.test(h) || h === "ntfy.sh" || /\.ntfy\.sh$/.test(h);
  }
  function note(url) {
    state.geblokkeer.push(String(url));
  }
  function later(fn) {
    setTimeout(fn, 0);
  }

  /* ---------- fetch ---------- */
  var origFetch = window.fetch;
  if (typeof origFetch === "function") {
    window.fetch = function (input, init) {
      var url = input && typeof input === "object" && "url" in input ? input.url : input;
      if (isBlocked(url)) {
        note(url);
        return Promise.reject(new TypeError("Failed to fetch (VOORSKOU: geblokkeer)"));
      }
      return origFetch.apply(this, arguments);
    };
  }

  /* ---------- XMLHttpRequest ---------- */
  var XHR = window.XMLHttpRequest;
  if (XHR && XHR.prototype) {
    var origOpen = XHR.prototype.open;
    var origSend = XHR.prototype.send;
    XHR.prototype.open = function (method, url) {
      this.__voorskouBlok = isBlocked(url) ? String(url) : null;
      return origOpen.apply(this, arguments);
    };
    XHR.prototype.send = function () {
      if (!this.__voorskouBlok) return origSend.apply(this, arguments);
      var xhr = this;
      note(xhr.__voorskouBlok);
      later(function () {
        var props = { readyState: 4, status: 0, statusText: "", response: "", responseText: "" };
        Object.keys(props).forEach(function (k) {
          try {
            Object.defineProperty(xhr, k, { value: props[k], configurable: true });
          } catch (e) {}
        });
        ["readystatechange", "error", "loadend"].forEach(function (type) {
          try {
            xhr.dispatchEvent(new Event(type));
          } catch (e) {}
        });
      });
    };
  }

  /* ---------- navigator.sendBeacon ---------- */
  var nav = window.navigator;
  if (nav && typeof nav.sendBeacon === "function") {
    var origBeacon = nav.sendBeacon;
    nav.sendBeacon = function (url) {
      if (isBlocked(url)) {
        note(url);
        return false;
      }
      return origBeacon.apply(nav, arguments);
    };
  }

  /* ---------- WebSocket / EventSource ---------- */
  function fakeClosed(url, closedState, events) {
    var t = new EventTarget();
    t.url = String(url);
    t.readyState = closedState;
    t.send = function () {};
    t.close = function () {};
    later(function () {
      events.forEach(function (ev) {
        t.dispatchEvent(ev);
        var h = t["on" + ev.type];
        if (typeof h === "function") h.call(t, ev);
      });
    });
    return t;
  }
  function wrapCtor(name, closedState, makeEvents) {
    var Orig = window[name];
    if (typeof Orig !== "function") return;
    var Wrapped = function (url, opt) {
      if (isBlocked(url)) {
        note(url);
        return fakeClosed(url, closedState, makeEvents());
      }
      return arguments.length > 1 ? new Orig(url, opt) : new Orig(url);
    };
    Wrapped.prototype = Orig.prototype;
    ["CONNECTING", "OPEN", "CLOSING", "CLOSED"].forEach(function (k) {
      if (k in Orig) Wrapped[k] = Orig[k];
    });
    window[name] = Wrapped;
  }
  wrapCtor("WebSocket", 3, function () {
    var close = typeof CloseEvent === "function" ? new CloseEvent("close", { code: 1006, wasClean: false }) : new Event("close");
    return [new Event("error"), close];
  });
  wrapCtor("EventSource", 2, function () {
    return [new Event("error")];
  });

  /* ---------- banier ---------- */
  function showBanner() {
    if (!document.body || document.getElementById("voorskou-banier")) return;
    var style = document.createElement("style");
    style.id = "voorskou-styl";
    style.textContent =
      "#voorskou-banier{position:fixed;top:0;left:0;right:0;z-index:2147483000;box-sizing:border-box;" +
      "padding:.45rem .75rem;background:#b45309;color:#fff;font:700 15px/1.3 system-ui,sans-serif;" +
      "text-align:center;letter-spacing:.02em;box-shadow:0 2px 6px rgba(0,0,0,.35);pointer-events:none;" +
      "overflow-wrap:anywhere}" +
      "body.voorskou-aktief{padding-top:var(--voorskou-h,2.4rem)}" +
      "body.voorskou-aktief .topbar{top:var(--voorskou-h,2.4rem)}";
    document.head.appendChild(style);
    var b = document.createElement("div");
    b.id = "voorskou-banier";
    b.setAttribute("role", "status");
    b.textContent = BANIER_TEKS;
    document.body.insertBefore(b, document.body.firstChild);
    document.body.classList.add("voorskou-aktief");
    var fit = function () {
      document.documentElement.style.setProperty("--voorskou-h", b.offsetHeight + "px");
    };
    fit();
    window.addEventListener("resize", fit);
  }
  if (document.body) showBanner();
  else document.addEventListener("DOMContentLoaded", showBanner);
})();
