# AI-tot-AI: Wallie se support-chatbot ("Hulp nou") — 3 Nov 2026

**Vir:** Claude Code, Cursor, Grok Bot, DeepSeek — wie ook al hierdie werk oorneem.
**Eienaar:** Hanno van Zyl (nie-tegnies; antwoord in gewone Afrikaans, gee skakels, vra hom nooit om opdragte te loop nie).
**Repo:** `C:\Users\nHunter\Projects\Wallie_wg` (GitHub `Pamoja-Academy/Wallie_911_Pro`), tak `hulp-klets` vanaf `master` @ `dc77870`.
**Live app:** https://pamoja-academy.github.io/Wallie_911_Pro/ (weergawe `2026-11-02a`).

Lees eers `AGENTS.md` en `docs/LESSONS-LEARNED.md`. Hulle reëls geld steeds.

---

## 1. Opdrag (Hanno, 3 Nov 2026, woordeliks die kern)

> "WALLIE BENODIG 'N SUPPORT CHATBOT WAT JOU STUPID APP PROBLEME DADELIK MOET OPLOS ANDERS IS DIE HELE APP USELESS."

Hanno het weke gelede 'n foutbank gevra wat probleme **self binne 10 minute** oplos. Wat gebou is (`fout-vanger.js` + `fout-rag.js` + `data/fout-rag.json`, 31 vaste antwoorde, sleutelwoord-soek) verstaan nie Wallie se vraag nie, en die **Foutbank**-skerm (`#view-foutbank`) is net Wallie se plaaslike leer-lys: `state.faults` in localStorage, gaan nêrens heen nie. Wallie het app-foute daar ingesit en niemand het dit gesien nie.

Dit is sy **eindeksamen**. Eksamens oor: Gasvryheid **Vr 6 Nov 14:00**, Afrikaans HT V1 **Wo 11 Nov 09:00**, Engels EAT V2 **Do 19 Nov**, Afrikaans HT V2 **Vr 20 Nov**. Elke uur tel.

Hanno se boodskap is die skriftelike goedkeuring vir 'n bediener wat LL-21 vereis.

## 2. Ontwerp (besluit — moenie heroorweeg nie)

**Twee dele:**

### 2a. Bediener: `hulp-api/` (nuwe Vercel-projek `wallie-hulp`, span `hannos-project-team`)
- `hulp-api/api/klets.js`: Node-funksie, `POST` JSON `{ vraag, geskiedenis[], konteks{} }` → `{ antwoord, aksies[], ernstig }`.
- Model: Claude Opus 5.5 via **Vercel AI Gateway** (`baseURL: "https://ai-gateway.vercel.sh"`, model `anthropic/claude-opus-5.5`), met `@anthropic-ai/sdk@0.135.0`.
  Auth: **OIDC** via `@vercel/oidc@4.0.1` `getVercelOidcToken()`. **Geen API-sleutel nodig nie**; moenie Hanno vir een vra nie.
  Die span se gratis Gateway-krediet betaal. As dit opraak, val die app terug (2b).
- `output_config: { effort: "low", format: json_schema }` (vinnig + gestruktureerde antwoord). Hanteer `stop_reason: "refusal"` → terugval-teks.
- Stelselprompt (Afrikaans, gekas): rol, app-feite, die volle `fout-rag.json`-kennisbank, harde reëls:
  geen uitgedinkte DBE-vraagnommers/punte/memo-antwoorde; eers 'n omweg wat NOU werk; sê eerlik as dit 'n app-fout is ("Pa is ingelig"); nooit die leerling blameer nie; kort, genommerde stappe, maks ±120 woorde.
- Kennis: `hulp-api/kennis/fout-rag.json` is 'n kopie van `data/fout-rag.json`. 'n Toets moet faal as hulle verskil.
- Sekuriteit: CORS net `https://pamoja-academy.github.io` (+ `http://localhost:9123` vir toetse); liggaam ≤ 16 KB; geskiedenis ≤ 8 boodskappe; ≈20 versoeke / 10 min per IP (in-geheue, beste poging); `max_tokens` 2000. Geen geheime in die kode nie (die repo is publiek).
- Ontplooi: `npx vercel deploy --prod --yes --scope hannos-project-team` vanuit `hulp-api/` (eers `vercel link --yes --project wallie-hulp`). Verifieer met 'n `curl`-POST vanaf die regte Origin.

### 2b. App: `assets/js/hulp-klets.js` (+ CSS in `assets/css/`)
- Swewende knoppie **"💬 Hulp nou"** regs onder op **elke** skerm, ook in fokusmodus (`body.fokus-sessie`). Dit maak 'n kletspaneel in die bladsy oop (geen nuwe oortjie nie, dus geen oortjie-slot nie).
- Stuur saam met die vraag: weergawe (`WALLIE.APP_VERSION`), aktiewe skerm, tyd, vandag se blokke uit `WALLIE.app.state().blocks` (id/tyd/titel/soort/klaar), die huidige blok, die laaste 10 oop Foutbank-inskrywings (`state.faults`), die foutvanger se onlangse foute (localStorage `WALLIE.FOUTVANGER.SLEUTEL`), en `navigator.onLine`.
- Antwoord + aksie-knoppies uit 'n vaste lys: `herlaai` (harde herlaai na die nuutste weergawe), `missie`, `sessie`, `leer`, `foutbank` (`WALLIE.app.showView`).
- **Elke vraag gaan ook na Pa:** `WALLIE.REMOTE.bugReport({ text, data:{ id:"klets_…", bron:"klets", ernstig }, blocking: ernstig })`. Dit is 'n bestaande soort (`probleem`), dus **geen skemawysiging nie** (AGENTS §2.2).
- **Terugval** (bediener weg/stadig > 20 s/fout): `WALLIE.FOUTRAG.soek(vraag)` se antwoord, anders "Ek kon nie nou die hulpdiens bereik nie; Pa is ingelig", en `bugReport` met `blocking: true`.
- Geen nuwe localStorage-sleutel nie; die klets bly in geheue.
- Foutbank-skerm: een lyn "App-probleem? Druk 💬 Hulp nou". Moenie Wallie se bestaande foute verander nie (§2.3).
- `WALLIE.KLETS_URL` = die werklike ontplooide URL.

## 3. Toetse en vrystelling (AGENTS §3, LL-11, LL-18)
- `tests/hulp-klets.test.js` (node): konteks-bou, aksie-ontleding, terugval, die kennis-kopie.
- `tests/e2e/hulp-klets.spec.js`: die knoppie is sigbaar (ook in fokusmodus, foon 390×844 en laptop); met `page.route` op die klets-URL 'n gemaakte antwoord + `herlaai`-aksie; met 'n afgekapte versoek kom die terugval, en Pa kry 'n `probleem`-event (mock-backend). `tests/e2e/mock-backend.js` kap alle ander gashere af, so die lewendige bot word nooit in toetse geroep nie.
- Voeg albei by `package.json` `test` en `scripts/test-skoon.js`.
- Weergawe-bump na **`2026-11-03a`** in `index.html` (alle `?v=`), `version.json`, `assets/js/sync.js`, en `tests/fout-vanger.test.js` se fixture.
- LL-24 in `docs/LESSONS-LEARNED.md`: die belofte "los self op binne 10 min" was nooit gebou nie; die Foutbank lyk soos 'n meld-plek maar is plaaslik. Kontrole: hierdie bot + elke vraag na Pa + toets.
- AGENTS.md §2: reël 10. Die hulpbot is die enigste bediener wat Hanno goedgekeur het (3 Nov). Dit lees en skryf geen Wallie-data nie.
- Volle `npm run test:skoon`, CI `qa` groen, **onafhanklike QC-agent** (nie die skrywer nie), dan saamvoeg. Hanno se opdrag "bou die chatbot" is die staande opdrag om saam te voeg (§2.7). Verifieer live: `curl version.json` = `2026-11-03a`, en een egte POST na die bot vanaf die regte Origin.

## 4. Status (werk dit by soos jy vorder)
- [x] Ontwerp besluit, tak `hulp-klets` gemaak.
- [x] `hulp-api/` gebou en gekoppel aan Vercel-projek `wallie-hulp` (`vercel link`). **Nog NIE ontplooi nie:** Claude Code se outomatiese modus het `vercel deploy --prod` geblokkeer; Hanno moet dit goedkeur. Verwagte URL: https://wallie-hulp.vercel.app/api/klets. Ná die ontplooiing: maak seker die URL stem ooreen met `WALLIE.KLETS_URL` in `assets/js/hulp-klets.js` en die toets se `URL_KLETS`.
- [x] `hulp-klets.js` + `hulp-klets.css` + index.html. **Ontwerp-aanpassing:** daar was reeds 'n swewende Hulp-knoppie (`#hulp-fab`, hulp.js). Daarom is daar nie 'n tweede knoppie nie: die klets staan bo-aan die bestaande Hulp-paneel, en die knoppie heet nou "💬 Hulp nou".
- [x] QC-ronde 1 (BLOCK) reggemaak: eerlike bewoording ("word aan Pa gestuur"), 503 by model-fout → app val terug op vaste kennisbank, geen vraestel-hulp tydens 'n lopende skrif/toets/opstel-blok, bediener-logika in `hulp-api/lib/kern.js` met uitvoerbare toets `tests/hulp-api.test.js` (7/7), 15 s / 0 herprobeer, kleiner versoeke.
- [x] Toetse (`tests/hulp-klets.test.js` 9/9, `tests/e2e/hulp-klets.spec.js` 3/3, `hulp.spec.js` 11/11), weergawe 2026-11-03a, LL-24, AGENTS §2 reël 10.
- [ ] Ontplooi bediener → één egte POST vanaf Origin https://pamoja-academy.github.io (kyk dat `bron` = "claude" is, nie "fout" nie; "fout" beteken die Gateway/OIDC/`output_config` werk nie: lees `vercel logs`).
- [ ] PR, CI, QC, saamvoeg, live nagegaan
- [ ] WhatsApp-teks vir Wallie: "Druk 💬 Hulp nou regs onder as iets nie werk nie; jy kry dadelik 'n antwoord en Pa sien dit ook."

## 5. Moenie
- Moenie Supabase-skema of migrasies raak nie. Wallie se Supabase (`jxfmz…`) is in elk geval nie vir die agent sigbaar nie.
- Moenie 'n API-sleutel in die kode of in die app sit nie.
- Moenie die proef-blokke, Wallie se localStorage of die DBE-katalogus verander nie.
- Moenie Hanno vra om iets te debug nie. As iets geblokkeer is, sê in een sin wat en waarom.
