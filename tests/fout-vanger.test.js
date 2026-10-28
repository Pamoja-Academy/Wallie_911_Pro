/* Foutvanger: vang, ontdubbel, antwoord, rapporteer — en breek nooit iets.
   `node tests/fout-vanger.test.js`

   Wat hier getoets word (docs/SPEK-FOUTVANGER-2026-10-28.md §2.3 en §5):
   1. dit hang net "error" (vang-fase) en "unhandledrejection" aan window; geen blur/focus/visibilitychange nie;
   2. 'n JS-fout, 'n gebreekte belofte, 'n skrif wat nie laai nie en die hand-pad word almal gerapporteer;
   3. rapporteer gaan deur WALLIE.REMOTE.bugReport (blocking: false) en WALLIE.HULP.stuur (bron "outo") —
      geen nuwe event-soort: die lêer self noem nêrens 'n `kind` nie;
   4. dieselfde sein hoogstens 1× per 10 min (reëlnommers tel nie), maks 20 meldings per sessie;
   5. die enigste skryfsleutel is w911_fout_seine; wallie911_*-sleutels bly onaangeraak; stukkende berging dedupeer steeds;
   6. tydens 'n sessie (proctor.active): pointer-events: none, geen knoppie, nooit .focus(), proctor ongeskonde;
   7. die vanger gooi nooit en lus nooit: bugReport wat gooi/verwerp, 'n geneste fout, FOUTRAG wat gooi;
   8. sonder FOUTRAG/REMOTE/HULP werk dit steeds ("Onbekende fout."), en sê nie "Pa is in kennis gestel" as niks gestuur is nie;
   9. Wallie sien nooit 'n stack trace; die stapel gaan net in die data vir Pa. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const FILE = "assets/js/fout-vanger.js";
const bron = fs.readFileSync(path.join(root, FILE), "utf8");
const fails = [];
let passed = 0;
function assert(cond, msg) {
  if (cond) passed += 1;
  else fails.push(msg);
}

/* 'n onverwerkte belofte-weiering vanuit die vanger is self 'n fout — tel dit. */
let onverwerk = 0;
process.on("unhandledRejection", () => { onverwerk += 1; });

/* ---------- 'n klein nagemaakte blad ---------- */
function bou(opsies) {
  const o = Object.assign({ remote: true, hulp: true, rag: null, proctor: false, store: {}, kapotBerging: false, hash: "#missie" }, opsies || {});
  const fokusse = [];
  const skryf = [];
  const store = o.store;
  const tydelik = [];
  const klok = { t: 1000000 };

  function teks(n) {
    if (!n) return "";
    if (n.nodeType === 3) return n.text;
    return (n.children || []).map(teks).join("");
  }
  function maakEl(tag) {
    const el = {
      tagName: String(tag).toUpperCase(), children: [], style: { cssText: "" }, attrs: {}, listeners: {}, parentNode: null,
      className: "", type: "",
      setAttribute(k, v) { this.attrs[k] = String(v); },
      appendChild(c) { c.parentNode = this; this.children.push(c); return c; },
      removeChild(c) { this.children = this.children.filter((x) => x !== c); c.parentNode = null; return c; },
      addEventListener(t, f) { this.listeners[t] = f; },
      focus() { fokusse.push(this); },
      get textContent() { return teks(this); }
    };
    return el;
  }
  const docLuisteraars = {};
  const doc = {
    body: maakEl("body"), documentElement: maakEl("html"), hidden: false,
    createElement: maakEl,
    createTextNode: (t) => ({ nodeType: 3, text: String(t) }),
    addEventListener: (t, f) => { docLuisteraars[t] = f; },
    removeEventListener: () => {}
  };

  const luisteraars = {};
  const sb = {
    console, JSON, Math, URL,
    Date: { now: () => klok.t },
    setTimeout: (fn, ms) => { const t = { fn, ms, weg: false }; tydelik.push(t); return t; },
    clearTimeout: (t) => { if (t) t.weg = true; },
    document: doc,
    location: { href: "http://localhost:9123/index.html", protocol: "http:", host: "localhost:9123", hash: o.hash },
    localStorage: {
      getItem: (k) => { if (o.kapotBerging) throw new Error("SecurityError"); return k in store ? store[k] : null; },
      setItem: (k, v) => { if (o.kapotBerging) throw new Error("QuotaExceededError"); skryf.push(k); store[k] = String(v); },
      removeItem: (k) => { skryf.push(k); delete store[k]; }
    },
    addEventListener: (t, f, vang) => { (luisteraars[t] = luisteraars[t] || []).push({ f, vang }); }
  };
  sb.window = sb;
  sb.globalThis = sb;
  sb.WALLIE = { APP_VERSION: "toets" };

  const bugReports = [];
  const stuurRye = [];
  const log = { bugGooi: false, bugVerwerp: false, stuurGooi: false, bugNeste: null };
  if (o.remote) {
    /* remote.js tou deur WALLIE.SYNC.enqueue; sonder SYNC word niks getou nie en mag die strokie
       nie se Pa kry dit nie (QC 28 Okt). o.sync === false toets juis daardie geval. */
    if (o.sync !== false) sb.WALLIE.SYNC = { enqueue() { return true; } };
    sb.WALLIE.REMOTE = {
      bugReport(arg) {
        bugReports.push(arg);
        if (log.bugNeste) log.bugNeste();
        if (log.bugGooi) throw new Error("bugReport gooi");
        if (log.bugVerwerp) return Promise.reject(new Error("bugReport verwerp"));
        return Promise.resolve();
      }
    };
  }
  if (o.hulp) {
    sb.WALLIE.HULP = {
      stuur(row) {
        stuurRye.push(row);
        if (log.stuurGooi) throw new Error("stuur gooi");
        return Promise.resolve("gestuur");
      }
    };
  }
  const soekOproepe = [];
  if (o.rag) {
    sb.WALLIE.FOUTRAG = {
      soek(q, opts) {
        soekOproepe.push({ q, opts });
        return o.rag(q, opts);
      }
    };
  }
  const proctor = { active: Boolean(o.proctor), warnings: 0, totalWarnings: 0, away: false, endsAt: 5000, locked: false };
  sb.WALLIE.proctor = proctor;

  vm.runInNewContext(bron, sb, { filename: FILE });

  const FV = sb.WALLIE.FOUTVANGER;
  const fire = (tipe, ev) => (luisteraars[tipe] || []).forEach((l) => l.f(ev));
  const strokie = () => doc.body.children.find((c) => c.className === "foutvanger-strokie") || null;
  const jsFout = (err, filename) => fire("error", { target: sb, message: err.message, error: err, filename: filename || "http://localhost:9123/assets/js/app.js?v=1" });
  return {
    sb, FV, store, skryf, klok, tydelik, proctor, fokusse, bugReports, stuurRye, soekOproepe, log, luisteraars, docLuisteraars, doc,
    fire, strokie, jsFout, strokieTeks: () => (strokie() ? strokie().children[0].textContent : null)
  };
}

function tik(n, f) {
  try { f(); } catch (e) { fails.push(`${n}: toets gooi — ${e && e.stack ? e.stack.split("\n").slice(0, 3).join(" | ") : e}`); }
}

/* --- 0. die lêer self: geen verbode dinge nie --- */
tik("bron", () => {
  assert(!/\bkind\s*:/.test(bron), "fout-vanger.js noem 'kind:' — geen nuwe event-soort nie (AGENTS §2.2)");
  assert(!/\.focus\s*\(/.test(bron), "fout-vanger.js bevat .focus( — mag nooit fokus steel nie");
  assert(!/\.enqueue\s*\(/.test(bron), "fout-vanger.js roep enqueue self — moet deur bugReport gaan");
  assert(!/wallie911_/.test(bron.replace(/\/\*[\s\S]*?\*\//g, "")), "fout-vanger.js raak 'n wallie911_*-sleutel (buite kommentaar)");
  assert(!/\.stack\b/.test(bron.replace(/\/\*[\s\S]*?\*\//g, "").replace(/textContent[^;]*;/g, "")) || /stapel/.test(bron), "stapel-hantering ontbreek");
  assert(!/(createTextNode|textContent)\([^)]*stapel/.test(bron), "die stapel mag nie in die strokie beland nie");
  assert(!/\.innerHTML\s*=/.test(bron), "fout-vanger.js gebruik innerHTML — net textContent/createTextNode");
});

/* --- 1. wat dit aanhang --- */
tik("luisteraars", () => {
  const t = bou();
  assert(Boolean(t.FV), "WALLIE.FOUTVANGER is nie gedefinieer nie");
  assert(Boolean(t.luisteraars.error && t.luisteraars.error[0] && t.luisteraars.error[0].vang === true), "'error' moet in die vang-fase op window hang");
  assert(Boolean(t.luisteraars.unhandledrejection), "'unhandledrejection' ontbreek");
  assert(Object.keys(t.luisteraars).sort().join(",") === "error,unhandledrejection", "net error + unhandledrejection op window; kry: " + Object.keys(t.luisteraars));
  assert(!("blur" in t.luisteraars) && !("focus" in t.luisteraars) && !("visibilitychange" in t.docLuisteraars), "die vanger raak nie proctor se blur/focus/visibilitychange aan nie");
  /* tweede laai gee nie dubbele luisteraars nie */
  vm.runInNewContext(bron, t.sb, { filename: FILE });
  assert(t.luisteraars.error.length === 1, "'n tweede laai van die lêer hang nie weer luisteraars aan nie");
});

/* --- 2. 'n JS-fout: strokie + albei rapporteer-paaie, Onbekende fout --- */
tik("js-fout", () => {
  const t = bou();
  const fout1 = new TypeError("kaart is not a function");
  fout1.stack = "TypeError: kaart is not a function\n    at x (http://localhost/assets/js/app.js:41:9)";
  t.jsFout(fout1);
  assert(t.strokieTeks() === "Onbekende fout. Pa kry dit sodra daar internet is.", "sonder FOUTRAG: 'Onbekende fout. Pa kry dit sodra daar internet is.'; kry: " + t.strokieTeks());
  assert(t.bugReports.length === 1, "bugReport moet 1× roep; kry " + t.bugReports.length);
  const b = t.bugReports[0] || {};
  assert(b.blocking === false, "bugReport blocking moet false wees");
  assert(typeof b.text === "string" && /OUTOMATIESE FOUT/.test(b.text) && /kaart is not a function/.test(b.text), "bugReport.text wys die fout vir Pa");
  assert(b.data && b.data.bron === "outo" && b.data.soort === "js" && b.data.sein && /stapel|at x/.test(JSON.stringify(b.data)), "bugReport.data het bron/soort/sein/stapel");
  assert(!/\bat x\b/.test(b.text), "die stapel mag nie in die teks (ntfy) wees nie");
  assert(t.stuurRye.length === 1 && t.stuurRye[0].bron === "outo", "HULP.stuur moet 1× roep met bron 'outo'");
  assert(t.stuurRye[0] && t.stuurRye[0].vak && t.stuurRye[0].gebeur && t.stuurRye[0].skerm, "HULP.stuur-ry het vak, gebeur en skerm (anders weier die tabel/vorm dit)");
  assert(t.stuurRye[0] && t.stuurRye[0].skerm === "#missie", "skerm = die hash");
  assert(!/\bat x\b/.test(t.strokieTeks()), "Wallie sien nooit 'n stack trace nie");
  assert(t.strokie().attrs.role === "status", "die strokie is role=status");
  assert(t.FV.gemeld() === 1, "gemeld() = 1");
});

/* --- 3. met 'n FOUTRAG-treffer wys die strokie die antwoord --- */
tik("antwoord", () => {
  const t = bou({ rag: () => ({ id: "ll-001", antwoord: "Herlaai die blad een keer en werk op papier aan.", punt: 9, bron: "docs/x.md:1", soort: "faq" }) });
  t.jsFout(new TypeError("x is not a function"));
  assert(t.strokieTeks() === "Herlaai die blad een keer en werk op papier aan. Pa kry dit sodra daar internet is.", "die strokie wys die FOUTRAG-antwoord; kry: " + t.strokieTeks());
  assert(t.soekOproepe.length === 1 && t.soekOproepe[0].q === "TypeError: x is not a function", "soek kry die skoon navraag; kry: " + JSON.stringify(t.soekOproepe[0]));
  assert(t.soekOproepe[0] && typeof t.soekOproepe[0].opts.sein === "string" && t.soekOproepe[0].opts.sein.length > 0, "soek kry 'n sein in opsies");
  assert(t.bugReports[0] && /ll-001/.test(t.bugReports[0].text) && t.bugReports[0].data.treffer === "ll-001", "Pa sien watter antwoord Wallie gekry het");
});

tik("antwoord-onsekerheid", () => {
  const t = bou({ rag: () => null });
  t.jsFout(new Error("iets vreemds"));
  assert(t.strokieTeks() === "Onbekende fout. Pa kry dit sodra daar internet is.", "soek -> null gee die eerlike 'Onbekende fout'");
  const g = bou({ rag: () => { throw new Error("rag gooi"); } });
  g.jsFout(new Error("iets vreemds"));
  assert(g.strokieTeks() === "Onbekende fout. Pa kry dit sodra daar internet is." && g.bugReports.length === 1, "'n FOUTRAG wat gooi breek niks; Pa kry dit steeds");
  const leeg = bou({ rag: () => ({ id: "x", antwoord: "" }) });
  leeg.jsFout(new Error("iets"));
  assert(leeg.strokieTeks().indexOf("Onbekende fout.") === 0, "'n treffer sonder antwoord = Onbekende fout");
});

/* --- 4. ontdubbel --- */
tik("ontdubbel", () => {
  const t = bou();
  t.jsFout(new Error("Kan nie lees nie (reël 41)"));
  t.jsFout(new Error("Kan nie lees nie (reël 97)"));
  assert(t.bugReports.length === 1, "reëlnommers tel nie: dieselfde sein = 1 melding; kry " + t.bugReports.length);
  t.klok.t += 9 * 60 * 1000;
  t.jsFout(new Error("Kan nie lees nie (reël 3)"));
  assert(t.bugReports.length === 1, "ná 9 min nog steeds dubbel");
  t.klok.t += 61 * 1000;
  t.jsFout(new Error("Kan nie lees nie (reël 3)"));
  assert(t.bugReports.length === 2, "ná 10 min weer gemeld; kry " + t.bugReports.length);
  t.jsFout(new Error("Heeltemal 'n ander fout"));
  assert(t.bugReports.length === 3, "'n ander sein word wel gemeld");
  /* dieselfde boodskap uit 'n ander lêer is 'n ander sein */
  t.jsFout(new Error("Heeltemal 'n ander fout"), "http://localhost:9123/assets/js/hulp.js");
  assert(t.bugReports.length === 4, "dieselfde boodskap uit 'n ander lêer = ander sein");
  /* die register oorleef 'n herlaai (nuwe sandbox, dieselfde berging) */
  const h = bou({ store: t.store });
  t.klok.t += 0;
  h.klok.t = t.klok.t;
  h.jsFout(new Error("Heeltemal 'n ander fout"));
  assert(h.bugReports.length === 0, "die register in w911_fout_seine oorleef 'n herlaai (geen spuit nie)");
  /* 'n sein uit die 'toekoms' (klok teruggestel) vries nie die vanger nie */
  h.klok.t = t.klok.t - 3 * 60 * 60 * 1000;
  h.jsFout(new Error("Heeltemal 'n ander fout"));
  assert(h.bugReports.length === 1, "horlosie teruggestel: nie vir altyd stilgemaak nie");
});

/* --- 5. limiet 20 --- */
tik("limiet", () => {
  const t = bou();
  for (let i = 0; i < 30; i += 1) t.jsFout(new Error("unieke fout " + String.fromCharCode(97 + (i % 26)) + String.fromCharCode(97 + Math.floor(i / 26)) + "x"));
  assert(t.bugReports.length === 20, "maks 20 meldings per sessie; kry " + t.bugReports.length);
  assert(t.stuurRye.length === 20, "ook maks 20 HULP.stuur");
  assert(t.FV.gemeld() === 20, "gemeld() stop by 20");
  assert(t.FV.meld("nog een") === "limiet", "meld() sê 'limiet' ná 20");
});

/* --- 6. berging --- */
tik("berging", () => {
  const seed = { wallie911_v2_bok: '{"a":1}', wallie911_sync_v2: '{"queue":[]}' };
  const kopie = JSON.stringify(seed);
  const t = bou({ store: Object.assign({}, seed) });
  t.jsFout(new Error("een"));
  t.jsFout(new Error("twee"));
  t.FV.meld("drie");
  const uniek = Array.from(new Set(t.skryf));
  assert(uniek.length === 1 && uniek[0] === "w911_fout_seine", "net w911_fout_seine word geskryf; kry " + uniek.join(","));
  assert(JSON.stringify({ wallie911_v2_bok: t.store.wallie911_v2_bok, wallie911_sync_v2: t.store.wallie911_sync_v2 }) === kopie, "wallie911_*-sleutels onaangeraak");
  const reg = JSON.parse(t.store.w911_fout_seine);
  assert(reg.v === 1 && Object.keys(reg.s).length === 3, "register hou 3 seine");
  assert(JSON.stringify(Object.keys(reg)) === '["v","s"]', "register bevat net {v, s}: geen teks of stapel nie");

  const k = bou({ kapotBerging: true });
  k.jsFout(new Error("een"));
  k.jsFout(new Error("een"));
  assert(k.bugReports.length === 1, "stukkende berging: dedupeer steeds (geheue); kry " + k.bugReports.length);
  assert(k.strokieTeks() !== null, "stukkende berging: strokie wys steeds");

  const stuk = bou({ store: { w911_fout_seine: "nie json {{" } });
  stuk.jsFout(new Error("een"));
  assert(stuk.bugReports.length === 1, "stukkende register = leeg, geen fout");
});

/* --- 7. sessie: breek niks --- */
tik("sessie", () => {
  const t = bou({ proctor: true });
  const voor = JSON.stringify(t.proctor);
  t.jsFout(new Error("tydens sessie"));
  const s = t.strokie();
  assert(Boolean(s), "tydens 'n sessie wys die strokie steeds");
  assert(/pointer-events:\s*none/.test(s.style.cssText), "tydens 'n sessie: pointer-events: none (blokkeer geen tik nie)");
  assert(!s.children.some((c) => c.tagName === "BUTTON"), "tydens 'n sessie: geen knoppie (geen fokus-teiken)");
  assert(t.fokusse.length === 0, "nooit .focus() nie");
  assert(JSON.stringify(t.proctor) === voor, "proctor.* is onveranderd (geen waarskuwing, geen weg, klok onaangeraak)");
  assert(t.proctor.active === true && t.proctor.warnings === 0 && t.proctor.totalWarnings === 0, "sessie bly aan, geen waarskuwings");
  assert(t.bugReports[0] && t.bugReports[0].data.insessie === true && t.bugReports[0].blocking === false, "Pa sien dat dit in 'n sessie was, nie-blokkerend");
  /* die strokie verdwyn self ná 'n rukkie */
  const tm = t.tydelik[t.tydelik.length - 1];
  assert(tm && tm.ms === 12000, "in 'n sessie verdwyn dit ná 12 s; kry " + (tm && tm.ms));
  tm.fn();
  assert(t.strokie() === null, "die strokie is weg ná die tydsduur");

  /* Buite 'n sessie: die toe-knoppie werk, maar die BOKS vang steeds geen tik nie.
     28 Okt (QC): hierdie toets het vroeër die teenoorgestelde geëis — dat die boks wél tikke vang.
     Dit het beteken 'n byna volbreedte-balk lê 30 s lank oor Wallie se knoppies op 'n foon, op
     dieselfde plek wat kognitief.css vir die Hulp-knoppie moes ontruim (AGENTS §2.8). */
  const b = bou({ proctor: false });
  b.jsFout(new Error("buite sessie"));
  const knoppie = b.strokie().children.find((c) => c.tagName === "BUTTON");
  assert(Boolean(knoppie), "buite 'n sessie: daar is 'n toe-knoppie");
  assert(
    /pointer-events:\s*none/.test(b.strokie().style.cssText),
    "die boks mag nooit tikke vang nie, ook nie buite 'n sessie nie"
  );
  assert(
    /pointer-events:\s*auto/.test(knoppie.style.cssText),
    "die toe-knoppie moet die enigste klikbare deel wees"
  );
  knoppie.listeners.click();
  assert(b.strokie() === null, "toe-knoppie maak die strokie toe");
  assert(b.fokusse.length === 0, "ook buite 'n sessie nooit .focus() nie");
});

/* --- 8. 'n nuwe strokie vervang die ou een --- */
tik("een-strokie", () => {
  const t = bou();
  t.jsFout(new Error("eerste"));
  t.jsFout(new Error("tweede"));
  const strokies = t.doc.body.children.filter((c) => c.className === "foutvanger-strokie");
  assert(strokies.length === 1 && /Onbekende/.test(strokies[0].textContent), "altyd net een strokie op die skerm");
});

/* --- 9. self-veiligheid: geen lus, geen gooi --- */
tik("lus-veiligheid", () => {
  const a = bou();
  a.log.bugGooi = true;
  let gooi = null;
  try { a.jsFout(new Error("a")); } catch (e) { gooi = e; }
  assert(!gooi, "bugReport wat sinchronies gooi laat die vanger nie gooi nie");
  assert(a.strokie() !== null && a.stuurRye.length === 1, "bugReport wat gooi stop nie die strokie of HULP.stuur nie");

  const b = bou();
  b.log.bugVerwerp = true;
  b.log.stuurGooi = true;
  try { b.jsFout(new Error("b")); } catch (e) { gooi = e; }
  assert(b.strokie() !== null, "bugReport wat verwerp + stuur wat gooi: strokie steeds daar");

  /* 'n fout wat tydens rapporteer opkom (geneste fout) word nie weer gerapporteer nie */
  const c = bou();
  c.log.bugNeste = () => c.jsFout(new Error("geneste fout binne rapporteer"));
  c.jsFout(new Error("buitenste"));
  assert(c.bugReports.length === 1, "geneste fout tydens rapporteer = besig-vlag, geen lus; kry " + c.bugReports.length);
  c.log.bugNeste = null;
  c.jsFout(new Error("geneste fout binne rapporteer"));
  assert(c.bugReports.length === 2, "ná die rapporteer is die vlag weer vry");

  /* 'n fout in die vanger se eie lêer word genegeer */
  const d = bou();
  d.jsFout(new Error("binne"), "http://localhost:9123/assets/js/fout-vanger.js?v=1");
  assert(d.bugReports.length === 0, "foute uit fout-vanger.js self word nie gerapporteer nie");

  /* absurde insette */
  const e = bou();
  const insette = [undefined, null, 0, "", {}, [], { message: null }, { get message() { throw new Error("boos"); } }, Symbol ? "sym" : "x"];
  insette.forEach((x) => { try { e.FV.meld(x); e.fire("unhandledrejection", { reason: x }); e.fire("error", x); e.fire("error", { target: x }); } catch (er) { gooi = er; } });
  try { e.fire("error"); e.fire("unhandledrejection"); e.FV.meld(); e.FV.meld("x", null); e.FV.meld("x", "kaal"); } catch (er) { gooi = er; }
  assert(!gooi, "absurde insette gooi nooit; kry " + (gooi && gooi.message));
});

/* --- 10. gebreekte beloftes --- */
tik("belofte", () => {
  const t = bou({ rag: () => null });
  t.fire("unhandledrejection", { reason: Object.assign(new TypeError("Failed to fetch"), {}) });
  assert(t.bugReports.length === 1 && /gebreekte belofte/.test(t.bugReports[0].text), "'n gebreekte belofte word gerapporteer");
  const r = bou({ rag: () => null });
  r.fire("unhandledrejection", { reason: undefined });
  r.fire("unhandledrejection", { reason: "net 'n string" });
  assert(r.bugReports.length === 2, "reden undefined/string word ook gerapporteer");
  const q = bou({ rag: (x) => null });
  q.fire("unhandledrejection", { reason: Object.assign(new Error("quota vol"), { name: "QuotaExceededError" }) });
  assert(q.soekOproepe[0] && q.soekOproepe[0].q === "QuotaExceededError: quota vol", "die fout-naam gaan saam in die navraag; kry " + (q.soekOproepe[0] && q.soekOproepe[0].q));
});

/* --- 11. hulpbron wat nie laai nie --- */
tik("hulpbron", () => {
  const t = bou({ rag: () => null });
  t.fire("error", { target: { tagName: "SCRIPT", src: "http://localhost:9123/assets/js/ondersteuning.js?v=2026-10-28a" } });
  assert(t.bugReports.length === 1, "skrif wat nie laai nie word gerapporteer");
  assert(t.soekOproepe[0] && t.soekOproepe[0].q === "404 assets/js/ondersteuning.js", "navraag = '404 <pad>'; kry " + (t.soekOproepe[0] && t.soekOproepe[0].q));
  assert(/hulpbron\|script\|assets\/js\/ondersteuning\.js/.test(t.soekOproepe[0].opts.sein), "sein sonder ?v=; kry " + t.soekOproepe[0].opts.sein);
  assert(/lêer laai nie/.test(t.bugReports[0].text), "soort 'lêer laai nie'");
  t.fire("error", { target: { tagName: "LINK", href: "http://localhost:9123/assets/css/app.css?v=1" } });
  t.fire("error", { target: { tagName: "IMG", src: "http://localhost:9123/assets/img/x.png" } });
  assert(t.bugReports.length === 3, "link en img ook");
  /* lettertipes/CDN en ander elemente is nie ons fout nie */
  t.fire("error", { target: { tagName: "LINK", href: "https://fonts.googleapis.com/css2?family=X" } });
  t.fire("error", { target: { tagName: "IMG", src: "data:image/png;base64,AAAA" } });
  t.fire("error", { target: { tagName: "IFRAME", src: "http://localhost:9123/x" } });
  t.fire("error", { target: { tagName: "SCRIPT", src: "" } });
  assert(t.bugReports.length === 3, "eksterne bron, data:, iframe en leë src word geïgnoreer; kry " + t.bugReports.length);
});

/* --- 12. geraas wat geïgnoreer word --- */
tik("geraas", () => {
  const t = bou();
  t.fire("error", { target: t.sb, message: "Script error.", error: null, filename: "" });
  t.fire("error", { target: t.sb, message: "ResizeObserver loop completed with undelivered notifications.", error: null, filename: "http://localhost:9123/assets/js/app.js" });
  t.jsFout(new Error("uit 'n uitbreiding"), "chrome-extension://abcdef/content.js");
  assert(t.bugReports.length === 0 && t.strokie() === null, "Script error., ResizeObserver en uitbreidings tel nie");
});

/* --- 13. die hand-pad --- */
tik("hand", () => {
  const t = bou({ rag: () => null });
  assert(t.FV.meld(new Error("kon nie stoor nie"), { bron: "storage", vak: "rtt" }) === "gemeld", "meld() gee 'gemeld'");
  assert(t.soekOproepe[0] && t.soekOproepe[0].opts.vak === "rtt", "opsies.vak gaan na soek");
  assert(t.FV.meld(new Error("kon nie stoor nie"), { bron: "storage" }) === "dubbel", "meld() ontdubbel ook");
  const voorStrokie = t.strokie();
  assert(t.FV.meld("stil een", { wys: false }) === "gemeld" && t.bugReports.length === 2 && t.strokie() === voorStrokie, "wys:false rapporteer maar wys niks nuuts");
  const s = t.FV.sein("js", "x is not a function (reël 12)", "app.js");
  assert(s === t.FV.sein("js", "x is not a function (reël 99)", "app.js"), "sein is onafhanklik van getalle");
});

/* --- 14. sonder FOUTRAG / REMOTE / HULP --- */
tik("sonder-afhanklikhede", () => {
  const t = bou({ remote: false, hulp: false, rag: null });
  t.jsFout(new Error("niks is gelaai nie"));
  assert(t.strokieTeks() === "Onbekende fout.", "niks kan stuur nie: net 'Onbekende fout.' (geen valse belofte); kry " + t.strokieTeks());
  const r = bou({ remote: true, hulp: false });
  r.jsFout(new Error("net remote"));
  assert(r.bugReports.length === 1 && r.strokieTeks() === "Onbekende fout. Pa kry dit sodra daar internet is.", "net bugReport beskikbaar = steeds gerapporteer");
  /* REMOTE maar GEEN SYNC: remote.js kan niks tou, dus mag die strokie niks belowe nie. */
  const ns = bou({ remote: true, hulp: false, sync: false });
  ns.jsFout(new Error("remote sonder sync"));
  assert(ns.strokieTeks() === "Onbekende fout.", "REMOTE sonder SYNC mag nie 'Pa kry dit' se nie; kry: " + ns.strokieTeks());
  const h = bou({ remote: false, hulp: true });
  h.jsFout(new Error("net hulp"));
  assert(h.stuurRye.length === 1 && /Pa kry dit sodra daar internet is/.test(h.strokieTeks()), "net HULP beskikbaar = steeds gerapporteer");
});

/* --- 15. fout voor <body> bestaan --- */
tik("voor-body", () => {
  const t = bou();
  const liggaam = t.doc.body;
  t.doc.body = null;
  t.jsFout(new Error("vroeg"));
  assert(t.bugReports.length === 1, "fout voor <body> word steeds gerapporteer");
  assert(typeof t.docLuisteraars.DOMContentLoaded === "function", "strokie wag vir DOMContentLoaded");
  t.doc.body = liggaam;
  t.docLuisteraars.DOMContentLoaded();
  assert(t.strokie() !== null, "strokie verskyn sodra <body> bestaan");
});

/* --- 16. geen hallusinasie van die proctor: sessie-skema nie geraak nie --- */
tik("proctor-bron", () => {
  assert(!/proctor\.(warn|lock|tick|begin|start)\b/.test(bron), "die vanger roep nooit proctor-metodes nie");
  assert(!/proctor\.[a-zA-Z]+\s*=[^=]/.test(bron), "die vanger skryf nooit na proctor nie");
});

if (fails.length) {
  console.error("fout-vanger: FOUT\n - " + fails.join("\n - "));
  process.exit(1);
}
setTimeout(() => {
  if (onverwerk) {
    console.error(`fout-vanger: FOUT\n - ${onverwerk} onverwerkte belofte-weiering(s) uit die vanger`);
    process.exit(1);
  }
  console.log(`fout-vanger: ${passed} kontroles geslaag`);
}, 20);
