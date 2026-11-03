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
  Die span se Gateway-krediet betaal, maar die Gateway diens eers versoeke nadat 'n **kredietkaart op lêer** is (`customer_verification_required`, 3 Nov). Net Hanno kan dit doen: https://vercel.com/hannos-project-team/~/ai?modal=add-credit-card. Tot dan, of as die krediet opraak, gee die bediener 503 en val die app terug (2b).
- `output_config: { effort: "low", format: json_schema }` (vinnig + gestruktureerde antwoord). Hanteer `stop_reason: "refusal"` → terugval-teks.
- Stelselprompt (Afrikaans, gekas): rol, app-feite, die volle `fout-rag.json`-kennisbank, harde reëls:
  geen uitgedinkte DBE-vraagnommers/punte/memo-antwoorde; eers 'n omweg wat NOU werk; sê eerlik as dit 'n app-fout is ("jou vraag word aan Pa gestuur"; LL-22: nooit "Pa het dit" nie); nooit die leerling blameer nie; kort, genommerde stappe, maks ±120 woorde.
- Kennis: `hulp-api/kennis/fout-rag.json` is 'n kopie van `data/fout-rag.json`. 'n Toets moet faal as hulle verskil.
- Sekuriteit: CORS net `https://pamoja-academy.github.io` (+ `http://localhost:9123` vir toetse); liggaam ≤ 16 KB; geskiedenis ≤ 8 boodskappe; ≈20 versoeke / 10 min per IP (in-geheue, beste poging); `max_tokens` 2000. Geen geheime in die kode nie (die repo is publiek).
- Ontplooi: `npx vercel deploy --prod --yes --scope hannos-project-team` vanuit `hulp-api/` (eers `vercel link --yes --project wallie-hulp`). Verifieer met 'n `curl`-POST vanaf die regte Origin.

### 2b. App: `assets/js/hulp-klets.js` (+ CSS in `assets/css/`)
- Swewende knoppie **"💬 Hulp nou"** regs onder op **elke** skerm, ook in fokusmodus (`body.fokus-sessie`). Dit maak 'n kletspaneel in die bladsy oop (geen nuwe oortjie nie, dus geen oortjie-slot nie).
- Stuur saam met die vraag: weergawe (`WALLIE.APP_VERSION`), aktiewe skerm, tyd, vandag se blokke uit `WALLIE.app.state().blocks` (id/tyd/titel/soort/klaar), die huidige blok, die laaste 10 oop Foutbank-inskrywings (`state.faults`), die foutvanger se onlangse foute (localStorage `WALLIE.FOUTVANGER.SLEUTEL`), en `navigator.onLine`.
- Antwoord + aksie-knoppies uit 'n vaste lys: `herlaai` (harde herlaai na die nuutste weergawe), `missie`, `sessie`, `leer`, `foutbank` (`WALLIE.app.showView`).
- **Elke vraag gaan ook na Pa:** `WALLIE.REMOTE.bugReport({ text, data:{ id:"klets_…", bron:"klets", ernstig }, blocking: ernstig })`. Dit is 'n bestaande soort (`probleem`), dus **geen skemawysiging nie** (AGENTS §2.2).
- **Terugval** (bediener weg/stadig > 20 s/fout): `WALLIE.FOUTRAG.soek(vraag)` se antwoord, anders "Ek kon nou nie die hulpdiens bereik nie. Jou vraag word dringend aan Pa gestuur (sodra jy aanlyn is)", en `bugReport` met `blocking: true`. Die bediener se 503 / `bron` "fout" of "weier" tel ook as terugval.
- Konteks sluit in: `klaar` uit `state.completedBlocks[id]` (nie `b.done` nie), en `sessieLoop` (= `body.fokus-sessie`): tydens 'n sessie, ook oortyd, gee die bot geen inhoud-hulp nie.
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
- [x] `hulp-api/` ontplooi (Hanno het goedgekeur, 3 Nov): https://wallie-hulp.vercel.app/api/klets (= `WALLIE.KLETS_URL`). Inspekteer: https://vercel.com/hannos-project-team/wallie-hulp. CORS nagegaan (Pages 204, vreemd 403).
- [ ] **BLOKKEER die KI:** die egte POST gee 503 `bron:"fout"`; `vercel logs` sê die AI Gateway vra 'n kredietkaart. Hanno moet dit by https://vercel.com/hannos-project-team/~/ai?modal=add-credit-card byvoeg. Daarna is geen herontplooiing nodig nie: herhaal die POST en kyk vir `bron:"claude"`.
- [x] `hulp-klets.js` + `hulp-klets.css` + index.html. **Ontwerp-aanpassing:** daar was reeds 'n swewende Hulp-knoppie (`#hulp-fab`, hulp.js). Daarom is daar nie 'n tweede knoppie nie: die klets staan bo-aan die bestaande Hulp-paneel, en die knoppie heet nou "💬 Hulp nou".
- [x] QC-ronde 1 (BLOCK) reggemaak: eerlike bewoording ("word aan Pa gestuur"), 503 by model-fout → app val terug op vaste kennisbank, geen vraestel-hulp tydens 'n lopende skrif/toets/opstel-blok, bediener-logika in `hulp-api/lib/kern.js` met uitvoerbare toets `tests/hulp-api.test.js` (7/7), 15 s / 0 herprobeer, kleiner versoeke.
- [x] QC-ronde 2: MERGE OK. Reggemaak: `klaar` uit `completedBlocks`, `sessieLoop`-slot, groet "Ek probeer dadelik help".
- [x] Toetse (`tests/hulp-klets.test.js` 9/9, `tests/hulp-api.test.js` 7/7, `tests/e2e/hulp-klets.spec.js` 4/4, `hulp.spec.js` 11/11), weergawe 2026-11-03a, LL-24, AGENTS §2 reël 10.
- [x] Kaart bygevoeg deur Hanno: gratis $5/maand dek GEEN Claude-model nie (Opus/Sonnet/Haiku 5.5 en Haiku 4.5: 403 "Free tier users do not have access"). Hanno wil NIE betaalde krediet koop nie (3 Nov).
- [x] Gratis modelle getoets (3 Nov): nvidia/nemotron-3.5-lightning-free werk maar swak Afrikaans, 11–30 s, belofte-taal → NIE gebruik. beam-free en gemini-3-flash: 403; ling-3.1-flash: 503.
- [x] Bediener: Claude eerste, dan **Gemini 2.5 Flash** met Hanno se eie gratis sleutel as Vercel-omgewingsveranderlike `GEMINI_API_KEY` (geen sleutel in repo). Ontplooi.
- [ ] **Hanno:** maak 'n gratis sleutel by https://aistudio.google.com/apikey en plak dit as `GEMINI_API_KEY` (Production) by https://vercel.com/hannos-project-team/wallie-hulp/settings/environment-variables, dan Redeploy. Agent: herhaal die egte POST; verwag `bron:"claude"` (die bediener sê nie watter model nie; kyk `vercel logs` vir "gebruik Gemini").
- [ ] Saamvoeg, live nagegaan (version.json = 2026-11-03a).
- [ ] Ná die kaart: egte POST gee `bron:"claude"`; bestedingsplafon of Vercel-firewall-limiet op `wallie-hulp` (die Origin-kontrole is nie verifikasie nie).
- [ ] WhatsApp vir Wallie (eerlik, LL-22): "Iets werk nie in die app? Druk 💬 Hulp nou. Jy kry dadelik raad, en jou vraag word ook aan Pa gestuur."

## 5. Moenie
- Moenie Supabase-skema of migrasies raak nie. Wallie se Supabase (`jxfmz…`) is in elk geval nie vir die agent sigbaar nie.
- Moenie 'n API-sleutel in die kode of in die app sit nie.
- Moenie die proef-blokke, Wallie se localStorage of die DBE-katalogus verander nie.
- Moenie Hanno vra om iets te debug nie. As iets geblokkeer is, sê in een sin wat en waarom.
