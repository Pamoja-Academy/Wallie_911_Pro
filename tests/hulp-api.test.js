/* Hulp nou se bediener-kern (hulp-api/lib/kern.js): uitgevoer met nagemaakte versoeke en 'n nagemaakte model.
   Die lewendige model of Vercel word nooit geroep nie. */
const assert = require("assert");
const path = require("path");
const fs = require("fs");

const PAGES = "https://pamoja-academy.github.io";

function maakRes() {
  return {
    status_: 0, body: null, headers: {},
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    status(s) { this.status_ = s; return this; },
    json(b) { this.body = b; return this; },
    end() { return this; }
  };
}
const req = (o) => ({ method: "POST", headers: { origin: PAGES, "x-forwarded-for": "1.2.3.4" }, body: { vraag: "hallo" }, ...o });

(async () => {
  const kern = await import("file://" + path.join(__dirname, "..", "hulp-api", "lib", "kern.js").replace(/\\/g, "/"));
  const korpus = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "hulp-api", "kennis", "fout-rag.json"), "utf8"));
  let ok = 0;
  const t = async (naam, fn) => { await fn(); ok++; console.log("  ✓ " + naam); };
  const goed = async () => ({ stop_reason: "end_turn", teks: JSON.stringify({ antwoord: "Druk herlaai.", aksies: ["herlaai", "slegte"], ernstig: false }) });

  await t("stelselprompt: kennisbank, geen uitgedinkte DBE-getalle, nie blameer nie, geen vraestel-hulp tydens 'n proef", () => {
    const s = kern.bouStelsel(korpus);
    assert.ok(s.includes(korpus.inskrywings[0].antwoord.slice(0, 40)));
    assert.ok(/NOOIT DBE-vraagnommers, punte, bladsye of memo-antwoorde uitdink/.test(s));
    assert.ok(/Blameer Wallie nooit/.test(s));
    assert.ok(/konteks\.sessieLoop true/.test(s));
    assert.ok(/huidigeBlok\.soort "skrif"/.test(s) && /Moenie vrae van die vraestel beantwoord/.test(s));
    assert.ok(!/Pa het|gekry|per e-pos|binne 10 minute (?!reg)/.test(s.replace("geen \"dit sal binne 10 minute reg wees\" nie", "")), "geen belofte of 'Pa het'");
  });

  await t("CORS: Pages-oorsprong 204, vreemde oorsprong 403, POST sonder oorsprong 403", async () => {
    const h = kern.maakHandler({ stelsel: "x", roepModel: goed });
    let r = maakRes(); await h(req({ method: "OPTIONS" }), r);
    assert.strictEqual(r.status_, 204); assert.strictEqual(r.headers["access-control-allow-origin"], PAGES);
    r = maakRes(); await h(req({ method: "OPTIONS", headers: { origin: "https://evil.example" } }), r);
    assert.strictEqual(r.status_, 403); assert.strictEqual(r.headers["access-control-allow-origin"], undefined);
    r = maakRes(); await h(req({ headers: {} }), r);
    assert.strictEqual(r.status_, 403);
  });

  await t("liggaam: te groot, stukkende JSON en leë vraag → 400 JSON", async () => {
    const h = kern.maakHandler({ stelsel: "x", roepModel: goed });
    for (const body of [{ vraag: "x".repeat(17000) }, "{stukkend", { vraag: "  " }, null]) {
      const r = maakRes(); await h(req({ body }), r);
      assert.strictEqual(r.status_, 400); assert.ok(r.body && r.body.fout);
    }
  });

  await t("sukses: net bekende aksies; bron claude", async () => {
    const h = kern.maakHandler({ stelsel: "x", roepModel: goed });
    const r = maakRes(); await h(req(), r);
    assert.strictEqual(r.status_, 200);
    assert.deepStrictEqual(r.body, { antwoord: "Druk herlaai.", aksies: ["herlaai"], ernstig: false, bron: "claude" });
  });

  await t("model-fout, weiering en onleesbare teks → 503 JSON (nooit rou JSON aan Wallie nie)", async () => {
    const gevalle = [
      [async () => { throw Object.assign(new Error("krediet op"), { status: 402 }); }, "fout"],
      [async () => ({ stop_reason: "refusal", teks: "" }), "weier"],
      [async () => ({ stop_reason: "max_tokens", teks: '{"antwoord":"half' }), "fout"]
    ];
    for (const [roepModel, bron] of gevalle) {
      const r = maakRes(); await kern.maakHandler({ stelsel: "x", roepModel })(req(), r);
      assert.strictEqual(r.status_, 503); assert.strictEqual(r.body.bron, bron);
      assert.ok(!/^\s*\{/.test(r.body.antwoord) && !/Pa het/.test(r.body.antwoord));
    }
  });

  await t("tempo: die 21ste versoek binne 10 min van een IP → 429; ander IP nie", async () => {
    const h = kern.maakHandler({ stelsel: "x", roepModel: goed, teVeel: kern.maakTempo() });
    for (let i = 0; i < 20; i++) { const r = maakRes(); await h(req(), r); assert.strictEqual(r.status_, 200); }
    let r = maakRes(); await h(req(), r); assert.strictEqual(r.status_, 429);
    r = maakRes(); await h(req({ headers: { origin: PAGES, "x-forwarded-for": "5.6.7.8" } }), r); assert.strictEqual(r.status_, 200);
  });

  await t("boodskappe: begin met Wallie, hoogstens 8 uit die geskiedenis, konteks en vraag in die laaste beurt", () => {
    const geskiedenis = [{ rol: "hulp", teks: "groet" }];
    for (let i = 0; i < 12; i++) geskiedenis.push({ rol: i % 2 ? "hulp" : "wallie", teks: "b" + i });
    const m = kern.bouBoodskappe({ vraag: "nuut", geskiedenis, konteks: { tyd: "09:00" } });
    assert.strictEqual(m[0].role, "user");
    assert.ok(m.length <= 9);
    assert.ok(m[m.length - 1].content.includes("nuut") && m[m.length - 1].content.includes("09:00"));
  });

  console.log(`hulp-api: ${ok} ok`);
})().catch((e) => { console.error(e); process.exit(1); });
