/* Wallie se hulp-chatbot ("💬 Hulp nou"): Vercel-funksie.
   POST { vraag, geskiedenis[], konteks{} } → { antwoord, aksies[], ernstig, bron }  (503 + bron "fout"/"weier" as die model faal)
   Claude via Vercel AI Gateway; die funksie se OIDC-token is die sleutel, so daar is geen geheim in die repo nie.
   Lees en skryf GEEN Wallie-data nie (AGENTS §2.2, reël 10). Die logika is in ../lib/kern.js (getoets in tests/hulp-api.test.js).
   Oordrag: docs/OORDRAG-AI-HULPBOT-2026-11-03.md. */
import Anthropic from "@anthropic-ai/sdk";
import { getVercelOidcToken } from "@vercel/oidc";
import { readFileSync } from "node:fs";
import { bouStelsel, maakHandler } from "../lib/kern.js";

/* Opus eerste. Die span se gratis Gateway-krediet dek nie elke model nie ("Free tier users do not have access to this model",
   3 Nov), dus val ons dan af na die volgende model in plaas van Wallie sonder antwoord te los. Betaalde krediet herstel Opus. */
const MODELLE = ["anthropic/claude-opus-5.5", "anthropic/claude-sonnet-5.5", "anthropic/claude-haiku-5.5", "anthropic/claude-haiku-4.5"];
/* Haiku 4.5 ken nie `effort` nie (400); net die JSON-skema. */
const SONDER_EFFORT = new Set(["anthropic/claude-haiku-4.5"]);
const GATEWAY = "https://ai-gateway.vercel.sh";

const KORPUS = JSON.parse(readFileSync(new URL("../kennis/fout-rag.json", import.meta.url), "utf8"));

function geenToegang(e) {
  return e?.status === 403 && /no_providers_available|do not have access to this model/i.test(String(e?.message || ""));
}

async function roepModel({ system, messages, schema }) {
  /* Korter as die app se 20 s-wag en sonder herprobeer, sodat 'n afgebreekte versoek nie ekstra tokens kos nie. */
  const client = new Anthropic({ apiKey: await getVercelOidcToken(), baseURL: GATEWAY, timeout: 15000, maxRetries: 0 });
  let laaste;
  for (const model of MODELLE) {
    try {
      const r = await client.messages.create({
        model,
        max_tokens: 2000,
        system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
        output_config: SONDER_EFFORT.has(model)
          ? { format: { type: "json_schema", schema } }
          : { effort: "low", format: { type: "json_schema", schema } },
        messages
      });
      const teks = (r.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
      return { stop_reason: r.stop_reason, teks, model };
    } catch (e) {
      laaste = e;
      if (!geenToegang(e)) throw e;
      console.warn("[klets] geen toegang tot", model, "- probeer die volgende");
    }
  }
  throw laaste;
}

export default maakHandler({ stelsel: bouStelsel(KORPUS), roepModel });
