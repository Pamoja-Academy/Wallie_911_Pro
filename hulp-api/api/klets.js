/* Wallie se hulp-chatbot ("💬 Hulp nou").
   POST { vraag, geskiedenis[], konteks{} } → { antwoord, aksies[], ernstig, bron }
   Claude via Vercel AI Gateway; die funksie se OIDC-token is die sleutel, so daar is geen geheim in die repo nie.
   Hierdie funksie lees en skryf GEEN Wallie-data nie (AGENTS §2.2): die app stuur die konteks, en die app self
   meld elke vraag by Pa (WALLIE.REMOTE.bugReport). Sien docs/OORDRAG-AI-HULPBOT-2026-11-03.md. */
import Anthropic from "@anthropic-ai/sdk";
import { getVercelOidcToken } from "@vercel/oidc";
import { readFileSync } from "node:fs";

const MODEL = "anthropic/claude-opus-5.5";
const GATEWAY = "https://ai-gateway.vercel.sh";
const OORSPRONGE = ["https://pamoja-academy.github.io", "http://localhost:9123"];
const AKSIES = ["herlaai", "missie", "sessie", "leer", "foutbank"];
const MAKS_LIGGAAM = 16 * 1024;
const MAKS_GESKIEDENIS = 8;
const LIMIET = { venster: 10 * 60 * 1000, maks: 20 };

const KORPUS = JSON.parse(readFileSync(new URL("../kennis/fout-rag.json", import.meta.url), "utf8"));
const KENNIS = (KORPUS.inskrywings || [])
  .map((e) => `- [${e.id}] As: ${(e.simptome || []).join(" | ")}\n  Dan: ${e.antwoord}`)
  .join("\n");

const STELSEL = `Jy is "Hulp nou", die hulp-chatbot binne Wallie se studie-app (Wallie_911_Pro, Afrikaans).
Wallie is 'n matriekleerling wat NOU sy NSS-eindeksamen skryf. Elke minuut tel. Jou werk: kry hom binne 'n minuut of twee terug aan die werk.

Hoe jy antwoord:
- Afrikaans, kort, vriendelik en kalm. Hoogstens ±120 woorde. Genommerde stappe as daar iets is om te doen.
- Gee EERS 'n omweg wat NOU werk (bv. herlaai, ander skerm, doen die volgende blok, skryf op papier), dan eers verduideliking.
- Gebruik die konteks wat die app stuur (vandag se blokke, huidige blok, skerm, weergawe, onlangse foute, sy Foutbank-lys).
- As dit lyk na 'n fout in die app self: sê dit eerlik ("dit is 'n fout in die app, nie jy nie"), gee die beste omweg, en sê dat Pa dit outomaties gekry het. Stel dan "ernstig" op true.
- Blameer Wallie nooit. Sê nooit "dit is jou skuld" of dat hy iets verkeerd gedoen het nie.
- Belowe niks wat jy nie self kan doen nie (geen "dit sal binne 10 minute reg wees" nie). Jy kan nie die app se kode verander nie.
- Eksamen-inhoud: moet NOOIT DBE-vraagnommers, punte, bladsye of memo-antwoorde uitdink nie. Verwys hom na die vraestel en memo in die app se blok. Jy mag 'n begrip kort en korrek verduidelik as hy daarvoor vra, maar sê as jy nie seker is nie.
- Die Foutbank-skerm is sy eie lys van leer-foute om te hersien; dit gaan nie na Pa nie. App-probleme gaan via hierdie klets.

Wat die app kan doen (gebruik net hierdie aksie-name in "aksies", hoogstens twee):
- "herlaai": laai die nuutste weergawe (help as iets ou of stukkend lyk, of na 'n opdatering).
- "missie": vandag se plan. "sessie": begin/hervat 'n sessie. "leer": lesse. "foutbank": sy foutelys.

Feite oor die app:
- Die memo sluit eers oop as die blok se tyd om is (eksamenmodus). Dit is so ontwerp, nie 'n fout nie.
- By skrif- en merk-blokke met 'n DBE-vraestel mag hy die PDF in 'n ander oortjie oopmaak; daar is geen oortjie-slot nie. By ander sessies tel wegkyk as 'n waarskuwing.
- Elke blok se vraestel, memo en antwoordboek is amptelike DBE-skakels in die app.
- "Al gedoen?" op 'n blok ruil 'n vraestel wat hy al gesien het vir 'n ander.
- As die kamera nie werk nie: blaaier-toestemming vir kamera aan, ander programme wat die kamera gebruik toemaak, dan herlaai.

Kennisbank (vaste antwoorde uit die app; gebruik dit as dit pas):
${KENNIS}

Antwoord altyd as JSON volgens die skema: antwoord (teks vir Wallie), aksies (lys, kan leeg wees), ernstig (true as dit 'n app-fout is wat Pa moet regmaak).`;

const SKEMA = {
  type: "object",
  additionalProperties: false,
  required: ["antwoord", "aksies", "ernstig"],
  properties: {
    antwoord: { type: "string" },
    aksies: { type: "array", items: { type: "string", enum: AKSIES } },
    ernstig: { type: "boolean" }
  }
};

const TERUGVAL = "Ek kan nou nie 'n volledige antwoord gee nie. Doen solank die volgende blok op jou Missie-skerm of werk op papier, en druk later weer \"💬 Hulp nou\". Pa het jou vraag gekry.";

const tellers = new Map();
function teVeel(ip) {
  const nou = Date.now();
  const lys = (tellers.get(ip) || []).filter((t) => nou - t < LIMIET.venster);
  lys.push(nou);
  tellers.set(ip, lys);
  return lys.length > LIMIET.maks;
}

function cors(req, res) {
  const o = req.headers.origin;
  if (o && OORSPRONGE.includes(o)) {
    res.setHeader("Access-Control-Allow-Origin", o);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Max-Age", "600");
  }
  return Boolean(o && OORSPRONGE.includes(o));
}

function teks(x, maks) {
  return typeof x === "string" ? x.slice(0, maks) : "";
}

export default async function handler(req, res) {
  const toegelaat = cors(req, res);
  if (req.method === "OPTIONS") return res.status(toegelaat ? 204 : 403).end();
  if (req.method === "GET") return res.status(200).json({ ok: true, model: MODEL });
  if (req.method !== "POST") return res.status(405).json({ fout: "net POST" });
  if (!toegelaat) return res.status(403).json({ fout: "oorsprong" });

  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "?";
  if (teVeel(ip)) {
    return res.status(429).json({ antwoord: "Jy het baie vinnig na mekaar gevra. Wag 'n paar minute en probeer weer; Pa het jou vrae gekry.", aksies: [], ernstig: false, bron: "limiet" });
  }

  let body = req.body;
  try {
    if (typeof body === "string") body = JSON.parse(body);
  } catch {
    body = null;
  }
  if (!body || typeof body !== "object" || JSON.stringify(body).length > MAKS_LIGGAAM) {
    return res.status(400).json({ fout: "liggaam" });
  }
  const vraag = teks(body.vraag, 2000).trim();
  if (!vraag) return res.status(400).json({ fout: "geen vraag" });

  const geskiedenis = (Array.isArray(body.geskiedenis) ? body.geskiedenis : [])
    .slice(-MAKS_GESKIEDENIS)
    .filter((m) => m && (m.rol === "wallie" || m.rol === "hulp") && typeof m.teks === "string")
    .map((m) => ({ role: m.rol === "wallie" ? "user" : "assistant", content: teks(m.teks, 2000) }));
  while (geskiedenis.length && geskiedenis[0].role !== "user") geskiedenis.shift();

  const konteks = JSON.stringify(body.konteks || {}).slice(0, 8000);
  const messages = [
    ...geskiedenis,
    { role: "user", content: `Konteks van die app (outomaties):\n${konteks}\n\nWallie se vraag:\n${vraag}` }
  ];

  try {
    const client = new Anthropic({ apiKey: await getVercelOidcToken(), baseURL: GATEWAY, timeout: 25000, maxRetries: 1 });
    const r = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: [{ type: "text", text: STELSEL, cache_control: { type: "ephemeral" } }],
      output_config: { effort: "low", format: { type: "json_schema", schema: SKEMA } },
      messages
    });
    if (r.stop_reason === "refusal") {
      return res.status(200).json({ antwoord: TERUGVAL, aksies: [], ernstig: true, bron: "weier" });
    }
    const t = (r.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
    let uit;
    try {
      uit = JSON.parse(t);
    } catch {
      uit = { antwoord: t, aksies: [], ernstig: false };
    }
    const aksies = (Array.isArray(uit.aksies) ? uit.aksies : []).filter((a) => AKSIES.includes(a)).slice(0, 2);
    const antwoord = teks(uit.antwoord, 3000).trim() || TERUGVAL;
    return res.status(200).json({ antwoord, aksies, ernstig: Boolean(uit.ernstig), bron: "claude" });
  } catch (e) {
    console.error("[klets] model-fout:", e?.status || "", e?.message || e);
    return res.status(200).json({ antwoord: TERUGVAL, aksies: [], ernstig: true, bron: "fout" });
  }
}
