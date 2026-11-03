/* Die kern van die hulp-bot, sonder netwerk of SDK, sodat dit in node getoets kan word (tests/hulp-api.test.js).
   api/klets.js gee die kennisbank en 'n `roepModel(params)`-funksie in. */

export const OORSPRONGE = ["https://pamoja-academy.github.io", "http://localhost:9123"];
export const AKSIES = ["herlaai", "missie", "sessie", "leer", "foutbank"];
export const MAKS_LIGGAAM = 16 * 1024;
export const MAKS_GESKIEDENIS = 8;
export const LIMIET = { venster: 10 * 60 * 1000, maks: 20 };

/* Eerlik (LL-22): die app sit die vraag in Pa se tou; of dit al by hom is, weet ons nie. */
export const TERUGVAL = "Ek kan nou nie 'n volledige antwoord gee nie. Doen solank die volgende blok op jou Missie-skerm of werk op papier, en druk later weer \"💬 Hulp nou\". Jou vraag word aan Pa gestuur.";

export function bouStelsel(korpus) {
  const kennis = ((korpus && korpus.inskrywings) || [])
    .map((e) => `- [${e.id}] As: ${(e.simptome || []).join(" | ")}\n  Dan: ${e.antwoord}`)
    .join("\n");
  return `Jy is "Hulp nou", die hulp-chatbot binne Wallie se studie-app (Wallie_911_Pro, Afrikaans).
Wallie is 'n matriekleerling wat NOU sy NSS-eindeksamen skryf. Elke minuut tel. Jou werk: kry hom binne 'n minuut of twee terug aan die werk.

Hoe jy antwoord:
- Afrikaans, kort, vriendelik en kalm. Hoogstens ±120 woorde. Genommerde stappe as daar iets is om te doen.
- Gee EERS 'n omweg wat NOU werk (bv. herlaai, ander skerm, doen die volgende blok, skryf op papier), dan eers verduideliking.
- Gebruik die konteks wat die app stuur (vandag se blokke, huidige blok, skerm, weergawe, onlangse foute, sy Foutbank-lys).
- As dit lyk na 'n fout in die app self: sê dit eerlik ("dit is 'n fout in die app, nie jy nie"), gee die beste omweg, en sê dat sy vraag outomaties aan Pa gestuur word. Stel dan "ernstig" op true.
- Blameer Wallie nooit. Sê nooit "dit is jou skuld" of dat hy iets verkeerd gedoen het nie.
- Belowe niks wat jy nie self kan doen nie (geen "dit sal binne 10 minute reg wees" nie, geen e-pos nie). Jy kan nie die app se kode verander nie.

Eksamenwerk (baie belangrik):
- As konteks.huidigeBlok.soort "skrif", "toets" of "opstel" is en konteks.huidigeBlok.klaar nie true is nie, skryf hy NOU 'n proef. Help dan NET met app-probleme. Moenie vrae van die vraestel beantwoord, begrippe verduidelik of wenke oor die inhoud gee nie. Sê vriendelik: "Ek help nie met die vraestel terwyl die blok loop nie; die memo gaan oop as die tyd om is."
- Buite so 'n blok mag jy 'n begrip kort en korrek verduidelik as hy daarvoor vra, en jy sê as jy nie seker is nie.
- Moet NOOIT DBE-vraagnommers, punte, bladsye of memo-antwoorde uitdink nie. Verwys hom na die vraestel en memo in die app se blok.
- Die Foutbank-skerm is sy eie lys van leer-foute om te hersien; dit gaan nie na Pa nie. App-probleme gaan via hierdie klets.

Wat die app kan doen (gebruik net hierdie aksie-name in "aksies", hoogstens twee):
- "herlaai": laai die nuutste weergawe (help as iets oud of stukkend lyk, of na 'n opdatering).
- "missie": vandag se plan. "sessie": begin/hervat 'n sessie. "leer": lesse. "foutbank": sy foutelys.

Feite oor die app:
- Die memo sluit eers oop as die blok se tyd om is (eksamenmodus). Dit is so ontwerp, nie 'n fout nie.
- By skrif- en merk-blokke met 'n DBE-vraestel mag hy die PDF in 'n ander oortjie oopmaak; daar is geen oortjie-slot nie. By ander sessies tel wegkyk as 'n waarskuwing.
- Elke blok se vraestel, memo en antwoordboek is amptelike DBE-skakels in die app.
- "Al gedoen?" op 'n blok ruil 'n vraestel wat hy al gesien het vir 'n ander.
- As die kamera nie werk nie: blaaier-toestemming vir kamera aan, ander programme wat die kamera gebruik toemaak, dan herlaai.

Kennisbank (vaste antwoorde uit die app; gebruik dit as dit pas):
${kennis}

Antwoord altyd as JSON volgens die skema: antwoord (teks vir Wallie), aksies (lys, kan leeg wees), ernstig (true as dit 'n app-fout is wat Pa moet regmaak).`;
}

export const SKEMA = {
  type: "object",
  additionalProperties: false,
  required: ["antwoord", "aksies", "ernstig"],
  properties: {
    antwoord: { type: "string" },
    aksies: { type: "array", items: { type: "string", enum: AKSIES } },
    ernstig: { type: "boolean" }
  }
};

function teks(x, maks) {
  return typeof x === "string" ? x.slice(0, maks) : "";
}

/* Wallie se klets → Messages-API-boodskappe. Begin altyd met 'n gebruiker-beurt. */
export function bouBoodskappe(body) {
  const geskiedenis = (Array.isArray(body.geskiedenis) ? body.geskiedenis : [])
    .slice(-MAKS_GESKIEDENIS)
    .filter((m) => m && (m.rol === "wallie" || m.rol === "hulp") && typeof m.teks === "string")
    .map((m) => ({ role: m.rol === "wallie" ? "user" : "assistant", content: teks(m.teks, 2000) }));
  while (geskiedenis.length && geskiedenis[0].role !== "user") geskiedenis.shift();
  const konteks = JSON.stringify(body.konteks || {}).slice(0, 8000);
  return [
    ...geskiedenis,
    { role: "user", content: `Konteks van die app (outomaties):\n${konteks}\n\nWallie se vraag:\n${teks(body.vraag, 2000).trim()}` }
  ];
}

/* Die model se teks → { antwoord, aksies, ernstig } of null (nooit rou JSON aan Wallie nie). */
export function ontleedModel(t) {
  let uit;
  try {
    uit = JSON.parse(t);
  } catch {
    return null;
  }
  if (!uit || typeof uit.antwoord !== "string" || !uit.antwoord.trim()) return null;
  return {
    antwoord: uit.antwoord.trim().slice(0, 3000),
    aksies: (Array.isArray(uit.aksies) ? uit.aksies : []).filter((a) => AKSIES.includes(a)).slice(0, 2),
    ernstig: Boolean(uit.ernstig)
  };
}

export function maakTempo(limiet = LIMIET) {
  const tellers = new Map();
  return function teVeel(ip, nou = Date.now()) {
    if (tellers.size > 2000) {
      for (const [k, lys] of tellers) if (!lys.some((t) => nou - t < limiet.venster)) tellers.delete(k);
    }
    const lys = (tellers.get(ip) || []).filter((t) => nou - t < limiet.venster);
    lys.push(nou);
    tellers.set(ip, lys);
    return lys.length > limiet.maks;
  };
}

/* handler(req, res) vir Vercel. `roepModel({ system, messages, schema })` gee { stop_reason, teks } of gooi. */
export function maakHandler({ stelsel, roepModel, teVeel = maakTempo() }) {
  return async function handler(req, res) {
    const o = req.headers.origin;
    const toegelaat = Boolean(o && OORSPRONGE.includes(o));
    if (toegelaat) {
      res.setHeader("Access-Control-Allow-Origin", o);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      res.setHeader("Access-Control-Max-Age", "600");
    }
    if (req.method === "OPTIONS") return res.status(toegelaat ? 204 : 403).end();
    if (req.method === "GET") return res.status(200).json({ ok: true });
    if (req.method !== "POST") return res.status(405).json({ fout: "net POST" });
    if (!toegelaat) return res.status(403).json({ fout: "oorsprong" });

    const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "?";
    if (teVeel(ip)) {
      return res.status(429).json({ antwoord: "Jy het baie vinnig na mekaar gevra. Wag 'n paar minute en probeer weer.", aksies: [], ernstig: false, bron: "limiet" });
    }

    let body;
    try {
      body = req.body;
      if (typeof body === "string") body = JSON.parse(body);
    } catch {
      body = null;
    }
    if (!body || typeof body !== "object" || JSON.stringify(body).length > MAKS_LIGGAAM) {
      return res.status(400).json({ fout: "liggaam" });
    }
    if (!teks(body.vraag, 2000).trim()) return res.status(400).json({ fout: "geen vraag" });

    try {
      const r = await roepModel({ system: stelsel, messages: bouBoodskappe(body), schema: SKEMA });
      if (r.stop_reason === "refusal") {
        return res.status(503).json({ antwoord: TERUGVAL, aksies: [], ernstig: true, bron: "weier" });
      }
      const uit = ontleedModel(r.teks);
      if (!uit) return res.status(503).json({ antwoord: TERUGVAL, aksies: [], ernstig: true, bron: "fout" });
      return res.status(200).json({ ...uit, bron: "claude" });
    } catch (e) {
      console.error("[klets] model-fout:", e?.status || "", e?.message || e);
      return res.status(503).json({ antwoord: TERUGVAL, aksies: [], ernstig: true, bron: "fout" });
    }
  };
}
