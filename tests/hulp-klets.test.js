/* Hulp nou (hulp-klets.js + hulp-api): suiwer funksies, terugval, en die bediener se kennis = die app se kennisbank. */
const fs = require("fs");
const path = require("path");
const assert = require("assert");

const root = path.join(__dirname, "..");
global.window = global;
global.WALLIE = { APP_VERSION: "toets" };
require(path.join(root, "assets", "js", "hulp-klets.js"));
const K = global.WALLIE.HULPKLETS;
let ok = 0;
const t = (naam, fn) => { fn(); ok++; console.log("  ✓ " + naam); };

t("konteks: huidige blok, oop foutbank-items, geen opgeloste nie", () => {
  const state = {
    planDate: "2026-11-03",
    blocks: [
      { id: "a", start: "08:00", end: "11:00", title: "Gasvryheid proef 3", soort: "skrif", subjectSlug: "gasvryheid" },
      { id: "b", start: "11:15", end: "12:15", title: "Merk proef 3", soort: "merk", done: true }
    ],
    faults: [
      { subjectSlug: "gasvryheid", text: "memo maak nie oop nie", resolved: false },
      { subjectSlug: "engels", text: "ou fout", resolved: true }
    ]
  };
  const k = K.bouKonteks(state, new Date(2026, 10, 3, 9, 30), { skerm: "sessie", foute: ["x"], aanlyn: true });
  assert.strictEqual(k.huidigeBlok.id, "a");
  assert.strictEqual(k.tyd, "09:30");
  assert.strictEqual(k.skerm, "sessie");
  assert.strictEqual(k.vandag.length, 2);
  assert.strictEqual(k.vandag[1].klaar, true);
  assert.deepStrictEqual(k.foutbank, [{ vak: "gasvryheid", teks: "memo maak nie oop nie" }]);
  assert.strictEqual(k.weergawe, "toets");
});

t("konteks: leë state breek nie", () => {
  const k = K.bouKonteks(undefined, new Date(2026, 10, 3, 7, 5));
  assert.strictEqual(k.huidigeBlok, null);
  assert.deepStrictEqual(k.vandag, []);
});

t("antwoord: net bekende aksies, hoogstens twee", () => {
  const u = K.ontleedAntwoord({ antwoord: " Herlaai. ", aksies: ["herlaai", "<img onerror=x>", "missie", "leer"], ernstig: 1, bron: "claude" });
  assert.strictEqual(u.antwoord, "Herlaai.");
  assert.deepStrictEqual(u.aksies, ["herlaai", "missie"]);
  assert.strictEqual(u.ernstig, true);
});

t("antwoord: gemors gee leë antwoord (dan val die app terug)", () => {
  assert.strictEqual(K.ontleedAntwoord(null).antwoord, "");
  assert.strictEqual(K.ontleedAntwoord({ antwoord: 5 }).antwoord, "");
});

t("terugval sonder kennisbank: eerlike boodskap, ernstig, Missie-aksie", () => {
  const u = K.terugval("enigiets");
  assert.ok(/Pa het jou vraag dringend gekry/.test(u.antwoord));
  assert.strictEqual(u.ernstig, true);
  assert.deepStrictEqual(u.aksies, ["missie"]);
});

t("terugval met kennisbank: gebruik die vaste antwoord", () => {
  global.WALLIE.FOUTRAG = { soek: () => ({ antwoord: "Druk Ctrl+Shift+R." }) };
  const u = K.terugval("die app lyk oud");
  assert.ok(u.antwoord.startsWith("Druk Ctrl+Shift+R."));
  assert.strictEqual(u.bron, "vanlyn");
  delete global.WALLIE.FOUTRAG;
});

t("bediener se kennis is presies die app se kennisbank (data/fout-rag.json)", () => {
  const a = fs.readFileSync(path.join(root, "data", "fout-rag.json"), "utf8").replace(/\r\n/g, "\n");
  const b = fs.readFileSync(path.join(root, "hulp-api", "kennis", "fout-rag.json"), "utf8").replace(/\r\n/g, "\n");
  assert.strictEqual(b, a, "kopieer data/fout-rag.json na hulp-api/kennis/fout-rag.json");
});

t("bediener: geen sleutel of geheim in die kode; CORS net Pages + plaaslike toets", () => {
  const s = fs.readFileSync(path.join(root, "hulp-api", "api", "klets.js"), "utf8");
  assert.ok(!/sk-ant-|ANTHROPIC_API_KEY|AI_GATEWAY_API_KEY/.test(s));
  assert.ok(s.includes('"https://pamoja-academy.github.io"'));
  assert.ok(s.includes("getVercelOidcToken"));
  for (const a of Object.keys(K.AKSIES)) assert.ok(s.includes(`"${a}"`), "bediener ken aksie " + a);
});

t("app: knoppie en stylblad is in index.html; geen nuwe localStorage-skryf nie", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.ok(/assets\/js\/hulp-klets\.js\?v=/.test(html));
  assert.ok(/assets\/css\/hulp-klets\.css\?v=/.test(html));
  assert.ok(/data-klets-oop/.test(html));
  const js = fs.readFileSync(path.join(root, "assets", "js", "hulp-klets.js"), "utf8");
  assert.ok(!/localStorage\.setItem|localStorage\.removeItem/.test(js));
  assert.ok(/bugReport/.test(js));
});

console.log(`hulp-klets: ${ok} ok`);
