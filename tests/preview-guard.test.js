/* Voorskou-wag (assets/js/preview-guard.js) in 'n vm met 'n nagemaakte blaaier.
   Bewys: op pamoja-academy.github.io (en localhost sonder ?voorskou-toets=1) is dit 'n volle no-op;
   op enige ander gasheer word Supabase/ntfy geblokkeer en die parameter kan dit nie afskakel nie.
   `node tests/preview-guard.test.js` */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const code = fs.readFileSync(path.join(__dirname, "..", "assets", "js", "preview-guard.js"), "utf8");
const fails = [];
let passed = 0;
function assert(cond, msg) {
  if (cond) passed += 1;
  else fails.push(msg);
}

function makeBrowser(href) {
  const u = new URL(href);
  const domCalls = [];
  const timers = [];
  const net = [];
  const el = (tag) => ({
    tag,
    style: {},
    attrs: {},
    classList: { add: (c) => domCalls.push(`classList.add:${c}`) },
    setAttribute(k, v) { this.attrs[k] = v; },
    offsetHeight: 36
  });
  const body = Object.assign(el("body"), {
    firstChild: null,
    children: [],
    insertBefore(n) { domCalls.push(`body.insertBefore:${n.id}`); this.children.unshift(n); return n; },
    appendChild(n) { domCalls.push(`body.appendChild:${n.id}`); this.children.push(n); return n; }
  });
  const head = Object.assign(el("head"), { appendChild(n) { domCalls.push(`head.appendChild:${n.id}`); return n; } });
  const document = {
    body,
    head,
    documentElement: { style: { setProperty: (k, v) => domCalls.push(`setProperty:${k}=${v}`) } },
    createElement: (t) => { domCalls.push(`createElement:${t}`); return el(t); },
    getElementById: (id) => body.children.find((c) => c.id === id) || null,
    addEventListener: (t) => domCalls.push(`document.addEventListener:${t}`)
  };
  function fetch(input) { net.push(["fetch", String(input && input.url ? input.url : input)]); return Promise.resolve({ ok: true }); }
  function XMLHttpRequest() { this.listeners = {}; }
  XMLHttpRequest.prototype.open = function (m, url) { this._url = url; };
  XMLHttpRequest.prototype.send = function () { net.push(["xhr", this._url]); };
  XMLHttpRequest.prototype.dispatchEvent = function (e) { (this.listeners[e.type] = this.listeners[e.type] || []).push(e); const h = this["on" + e.type]; if (h) h.call(this, e); };
  const navigator = { sendBeacon(url) { net.push(["beacon", url]); return true; } };
  function WebSocket(url) { net.push(["ws", url]); this.url = url; }
  WebSocket.CLOSED = 3;
  function EventSource(url) { net.push(["es", url]); this.url = url; }
  const win = {
    location: { href, hostname: u.hostname, search: u.search },
    document,
    navigator,
    fetch,
    XMLHttpRequest,
    WebSocket,
    EventSource,
    addEventListener: (t) => domCalls.push(`window.addEventListener:${t}`)
  };
  win.window = win;
  const orig = { fetch, open: XMLHttpRequest.prototype.open, send: XMLHttpRequest.prototype.send, beacon: navigator.sendBeacon, WebSocket, EventSource };
  const ctx = Object.assign(win, {
    URL, Promise, TypeError, Object, String, RegExp,
    Event: class { constructor(type) { this.type = type; } },
    CloseEvent: class { constructor(type, o) { this.type = type; Object.assign(this, o); } },
    EventTarget: class {
      constructor() { this._l = {}; }
      addEventListener(t, f) { (this._l[t] = this._l[t] || []).push(f); }
      dispatchEvent(e) { (this._l[e.type] || []).forEach((f) => f(e)); }
    },
    setTimeout: (fn) => timers.push(fn)
  });
  vm.createContext(ctx);
  vm.runInContext(code, ctx, { filename: "preview-guard.js" });
  const flush = () => { while (timers.length) timers.shift()(); };
  return { win: ctx, orig, domCalls, net, flush };
}

function expectNoop(href, label) {
  const b = makeBrowser(href);
  assert(b.win.fetch === b.orig.fetch, `${label}: fetch identies aan oorspronklik`);
  assert(b.win.XMLHttpRequest.prototype.open === b.orig.open, `${label}: XHR.open identies`);
  assert(b.win.XMLHttpRequest.prototype.send === b.orig.send, `${label}: XHR.send identies`);
  assert(b.win.navigator.sendBeacon === b.orig.beacon, `${label}: sendBeacon identies`);
  assert(b.win.WebSocket === b.orig.WebSocket, `${label}: WebSocket identies`);
  assert(b.win.EventSource === b.orig.EventSource, `${label}: EventSource identies`);
  assert(b.domCalls.length === 0, `${label}: geen DOM-verandering (kry ${b.domCalls.join(", ")})`);
  assert(!("__VOORSKOU__" in b.win), `${label}: geen __VOORSKOU__`);
}

/* ---------- no-op ---------- */
expectNoop("https://pamoja-academy.github.io/Wallie_911_Pro/", "lewendig");
expectNoop("https://pamoja-academy.github.io/Wallie_911_Pro/?voorskou-toets=1#missie", "lewendig + parameter");
expectNoop("https://PAMOJA-ACADEMY.github.io/Wallie_911_Pro/", "lewendig (hoofletters)");
expectNoop("http://localhost:9123/index.html", "localhost");
expectNoop("http://127.0.0.1:9123/index.html#missie", "127.0.0.1");
expectNoop("http://localhost:9123/index.html?voorskou-toets=0", "localhost ?voorskou-toets=0");
expectNoop("http://localhost:9123/index.html?x-voorskou-toets=1", "localhost ander parameter");

/* ---------- aktief ---------- */
async function expectActive(href, label) {
  const b = makeBrowser(href);
  const w = b.win;
  assert(w.__VOORSKOU__ && w.__VOORSKOU__.aktief === true, `${label}: __VOORSKOU__.aktief`);
  assert(w.fetch !== b.orig.fetch, `${label}: fetch omhul`);
  const blocked = [
    "https://jxfmzxebekqzwnlurtxg.supabase.co/rest/v1/rpc/wallie_ingest",
    "https://ntfy.sh/wallie911-pa-15sos-hanno?title=x",
    "https://abc.SUPABASE.co/storage/v1/x",
    "https://supabase.co/",
    "https://foo.ntfy.sh/bar"
  ];
  for (const url of blocked) {
    let err = null;
    try { await w.fetch(url, { method: "POST" }); } catch (e) { err = e; }
    assert(err && err.name === "TypeError" && /Failed to fetch/.test(err.message), `${label}: fetch ${url} verwerp met TypeError`);
    let err2 = null;
    try { await w.fetch({ url }); } catch (e) { err2 = e; }
    assert(err2 instanceof TypeError, `${label}: fetch(Request ${url}) verwerp`);
    assert(w.navigator.sendBeacon(url, "x") === false, `${label}: sendBeacon ${url} → false`);
  }
  const okRes = await w.fetch("assets/js/data.js");
  assert(okRes && okRes.ok, `${label}: plaaslike fetch gaan deur`);
  await w.fetch("https://fonts.googleapis.com/css2");
  assert(w.navigator.sendBeacon("/log", "x") === true, `${label}: ander sendBeacon gaan deur`);
  assert(!b.net.some(([, u]) => /supabase\.co|ntfy\.sh/i.test(u)), `${label}: niks na supabase/ntfy by die oorspronklike netwerk-API's nie`);
  assert(b.net.filter(([k]) => k === "fetch").length === 2 && b.net.some(([k, u]) => k === "beacon" && u === "/log"), `${label}: nie-geblokkeerde versoeke het die oorspronklikes bereik`);

  const xhr = new w.XMLHttpRequest();
  const seen = [];
  xhr.onerror = () => seen.push("onerror");
  xhr.open("POST", "https://jxfmzxebekqzwnlurtxg.supabase.co/rest/v1/rpc/x");
  xhr.send("{}");
  b.flush();
  assert(xhr.readyState === 4 && xhr.status === 0 && xhr.responseText === "", `${label}: XHR readyState 4 / status 0`);
  assert(JSON.stringify(Object.keys(xhr.listeners)) === JSON.stringify(["readystatechange", "error", "loadend"]) && seen[0] === "onerror", `${label}: XHR gebeure readystatechange/error/loadend`);
  const xhr2 = new w.XMLHttpRequest();
  xhr2.open("GET", "/index.html");
  xhr2.send();
  assert(b.net.some(([k, u]) => k === "xhr" && u === "/index.html"), `${label}: ander XHR gaan deur`);

  const ws = new w.WebSocket("wss://jxfmzxebekqzwnlurtxg.supabase.co/realtime/v1");
  const wsEv = [];
  ws.onerror = () => wsEv.push("error");
  ws.onclose = (e) => wsEv.push(`close:${e.code}`);
  b.flush();
  assert(ws.readyState === 3 && wsEv.join() === "error,close:1006", `${label}: WebSocket vals, gesluit (kry ${wsEv})`);
  const es = new w.EventSource("https://ntfy.sh/topic/sse");
  let esErr = false;
  es.onerror = () => (esErr = true);
  b.flush();
  assert(es.readyState === 2 && esErr, `${label}: EventSource vals, gesluit`);
  const ws2 = new w.WebSocket("wss://echo.example.org/");
  assert(ws2 instanceof b.orig.WebSocket, `${label}: ander WebSocket gaan deur`);
  assert(!b.net.some(([, u]) => /supabase\.co|ntfy\.sh/i.test(u)), `${label}: steeds niks na supabase/ntfy`);
  assert(w.__VOORSKOU__.geblokkeer.length >= blocked.length * 3 + 3, `${label}: geblokkeerde versoeke aangeteken`);

  assert(b.domCalls.includes("body.insertBefore:voorskou-banier"), `${label}: banier ingevoeg`);
  const banier = w.document.getElementById("voorskou-banier");
  assert(banier && banier.textContent === "VOORSKOU — niks word na die bediener gestuur nie.", `${label}: banier-teks presies`);
  assert(b.domCalls.includes("classList.add:voorskou-aktief") && b.domCalls.includes("setProperty:--voorskou-h=36px"), `${label}: body padding-top via --voorskou-h`);
}

(async () => {
  await expectActive("https://raw.githack.com/pamoja-academy/Wallie_911_Pro/fase1/index.html", "raw.githack");
  await expectActive("https://raw.githack.com/x/index.html?voorskou-toets=0", "raw.githack ?voorskou-toets=0 (kan nie afskakel nie)");
  await expectActive("https://raw.githack.com/x/index.html?voorskou-toets=1", "raw.githack ?voorskou-toets=1");
  await expectActive("https://pamoja-academy.github.io.evil.example/", "lyk-soos-lewendig gasheer");
  await expectActive("http://localhost:9123/index.html?voorskou-toets=1#missie", "localhost ?voorskou-toets=1");
  await expectActive("http://127.0.0.1:9123/index.html?a=b&voorskou-toets=1", "127.0.0.1 &voorskou-toets=1");

  if (fails.length) {
    console.error(`preview-guard: ${passed} geslaag, ${fails.length} FAAL`);
    fails.forEach((f) => console.error("  FAAL:", f));
    process.exit(1);
  }
  console.log(`preview-guard: ${passed} geslaag, 0 faal`);
})();
