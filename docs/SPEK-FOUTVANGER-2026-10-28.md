# Spesifikasie — Foutvanger + fout-RAG (28 Okt 2026)

Opdrag van Hanno, 28 Okt: 'n realtyd fout-/kwaliteit-oplossing vir Wallie wat **onmiddellik** antwoord
as iets nie werk nie, met 'n RAG-model agter die foutvanger.

## 1. Wat vandag stukkend is (nagegaan op `origin/master` @ 490aace)

| # | Bevinding | Bewys |
|---|---|---|
| F1 | Die Hulp-paneel se "Stuur probleem" skryf **net** na `wallie911.support`. | `assets/js/hulp.js:367` `insertRow` → `/rest/v1/support` |
| F2 | **Niks lees `wallie911.support` nie.** Die Pa-konsole verwys nêrens daarna nie. | `grep -rn support assets/js/pa-konsole/ pa-konsole.html` = 0 treffers |
| F3 | Migrasie 003 gee `anon/authenticated` **net INSERT** op `support`; daar is geen SELECT-beleid nie, so selfs Pa kan dit nie lees nie. | `migrations/003_support_hulp.sql` (`support_anon_insert`, insert-only) |
| F4 | Die app **belowe hulp per e-pos binne ±10 minute**. Daar is geen e-pos-pad in die repo nie (geen Resend/SendGrid/SMTP/edge-funksie). | `hulp.js:41`, `app.js:1311`; `grep -riE "resend\|sendgrid\|smtp"` = 0 |
| F5 | Daar is **geen outomatiese foutvanger** nie: geen `window.onerror`, geen `unhandledrejection`, geen vang van 'n skrip/data-lêer wat nie laai nie. | `grep -rn "onerror\|unhandledrejection" assets/js` = 0 |
| F6 | Wallie kry **geen antwoord** nie. Die FAQ moet hy self gaan soek. | `hulp.js` SUPPORT_FAQ is net 'n soekblad |

Gevolg: Wallie rapporteer 'n probleem, die app sê "hulp kom binne 10 minute per e-pos", en dit gaan
na 'n tabel wat niemand ooit lees nie. Dit is die ergste moontlike boodskap aan 'n matriek wat sukkel.

## 2. Wat gebou word

### 2.1 `data/fout-rag.json` — die korpus (gegenereer, nagespoor)
Gebou deur `scripts/bou-fout-rag.js` uit **bestaande, werklike bronne** (AGENTS.md §2.4: geen hallusinasie):
- `assets/js/hulp.js` → `SUPPORT_FAQ` (16 vrae+antwoorde, per vak)
- `docs/LESSONS-LEARNED.md` → die lesse wat 'n Wallie-sigbare simptoom het
- `docs/SPEK-FOUTVANGER-2026-10-28.md` §4 → die tegniese foutseine (signatures)

Elke inskrywing: `{ id, soort, vakke[], simptome[], seine[], antwoord, bron }`.
`bron` is verpligtend en wys na lêer + reël. Geen inskrywing sonder bron nie.

### 2.2 `assets/js/fout-rag.js` — soek (vanlyn, geen netwerk)
```
WALLIE.FOUTRAG.soek(navraag, opsies) -> { treffer, punt, bron, antwoord, alternatiewe[] } | null
```
- Normaliseer (kleinletters, Afrikaanse diakritiete, leestekens weg), tokeniseer, stopwoorde weg.
- Telling = BM25-lite (tf-idf oor die korpus) **plus** 'n groot bonus vir 'n presiese sein-treffer
  (bv. `TypeError: x is not a function` of `404 data/rag-dekking.json`).
- Vak-konteks verhoog inskrywings van daardie vak; dit sluit nooit ander uit nie.
- **Drempel:** onder `MIN_PUNT` gee dit `null` → die app sê eerlik "ek weet nie" (LL: nooit 'n
  uitgedinkte antwoord nie). Onsekerheid is nooit 'n vals antwoord nie.
- Suiwer funksie, geen `localStorage`, geen `fetch`, werk in Node (toetse) en in die blaaier.

### 2.3 `assets/js/fout-vanger.js` — vang + antwoord + rapporteer
Vang:
- `window.onerror` (JS-foute)
- `unhandledrejection` (gebreekte beloftes, bv. 'n `fetch` wat misluk)
- `error` in die vang-fase op `document` → 'n `<script>`, `<img>`, `<link>` wat nie laai nie
- `WALLIE.FOUTVANGER.meld(...)` — die hand-pad vir ander modules

Doen, in hierdie orde:
1. Bou 'n **sein** (stabiel, sonder tyd/getalle) en **ontdubbel**: dieselfde sein hoogstens een keer
   per 10 minute, en hoogstens 20 meldings per sessie (geen lus, geen Supabase-stormloop).
2. Vra `WALLIE.FOUTRAG.soek(...)`.
3. Wys Wallie 'n klein, nie-blokkerende strokie: die antwoord as daar een is, anders
   "Onbekende fout. Pa is in kennis gestel." Nooit 'n tegniese `stack trace` vir Wallie nie.
4. Rapporteer na Pa deur die **bestaande** pad: `WALLIE.REMOTE.bugReport()` → event `kind: "probleem"`
   (reeds in `wallie_ingest_v2` se toegelate lys, `migrations/001:128`) **plus** `WALLIE.HULP.stuur()`.
   **Geen nuwe event-soort, geen migrasie, geen skemawysiging** (AGENTS.md §2.2).

Harde reëls:
- **Nooit 'n sessie breek nie.** Tydens 'n proef/eksamenblok (`WALLIE.proctor.active`) steel die strokie
  nie fokus nie, blokkeer niks, en tel nie as wegkyk nie. Die klok staan nie stil nie.
- Die vanger self mag nooit 'n fout gooi nie: alles in `try/catch`; 'n fout in die vanger word stil gesluk.
- Geen `localStorage`-sleutel buiten `w911_fout_seine` (die ontdubbel-register) nie.

### 2.4 Eerlikheid (F4) — die teks word regruk
- `hulp.js:41` en `app.js:1311-1313`: die e-pos-belofte val weg. Nuwe teks sê wat waar is:
  die melding gaan na Pa se konsole, en Wallie kry dadelik die antwoord as die app een het.
- Die Hulp-paneel se vorm stuur van nou af **ook** 'n `probleem`-event (F1/F2), sodat Pa dit sien.

## 3. Wat NIE hier gebou word nie (vereis Hanno se klik)
Om `wallie911.support` vir Pa **leesbaar** te maak, is 'n SELECT-beleid nodig = 'n Supabase-migrasie.
AGENTS.md §2.2 verbied my om dit te doen. `migrations/005_support_lees.sql` word voorberei maar
**nie toegepas nie**. Dit is nie 'n blokker nie: die `probleem`-event gee Pa reeds alles.

## 4. Foutseine (die tegniese kant van die korpus)
| sein | wat Wallie sien | antwoord |
|---|---|---|
| `fetch data/rag-dekking.json` misluk | sessieskerm sê "nog nie nagegaan" | Ondersteuning is net 'n nagaan; gaan voort met die werk |
| `404` / `error` op `assets/js/*.js` | 'n skerm is leeg of 'n knoppie doen niks | Herlaai die blad een keer; hou dan aan op papier |
| `TypeError ... is not a function` | 'n knoppie doen niks | Herlaai; die blok bly geldig, werk op papier aan |
| `QuotaExceededError` / `localStorage` | "Kon nie stoor nie" | Privaat modus of vol geheue: gewone venster |
| `NotAllowedError` / kamera | sessie wil nie begin nie | Sessie mag sonder kamera begin; Pa sien die melding |
| `AbortError` / netwerk-tydverstryking | aanwyser bly op "wag" | Dit stuur self sodra daar internet is; moenie wag nie |
| DBE-skakel `403/404` | vraestel/memo laai nie | Die skakel is dood; sê vir Pa, werk aan uit die app |

## 5. Toetse (die volle suite moet groen wees — LL-11)
- `tests/fout-rag.test.js` — bron verpligtend op elke inskrywing; sein-treffers; drempel gee `null`;
  geen netwerk/localStorage; dieselfde navraag gee dieselfde antwoord.
- `tests/fout-vanger.test.js` — ontdubbel oor 10 min; limiet van 20; `probleem`-event word gestuur;
  geen nuwe event-soort; 'n fout in die vanger self breek niks.
- `tests/e2e/fout-vanger.spec.js` — gooi 'n egte fout in die blad: die strokie wys die antwoord,
  en tydens 'n sessie bly die klok loop en die fokus staan.
- `npm run test:skoon` groen, 2×.

## 6. Weergawe
`v2026-10-28a` in `index.html` (`?v=`), `version.json` en `WALLIE.APP_VERSION` saam (`tests/weergawe.test.js`).

## 7. Tydsberekening
Wallie skryf vandag 13:00–16:00 'n **proef** (DBE Nov 2025 RTT V2) en merk dit 16:15–17:15. Die
**eksamen** is môre, Do 29 Okt 14:00–17:00 (RTT V2, 150 punte). Saamvoeg = live. Die weergawe-kontrole
herlaai **nooit** tydens 'n sessie nie, maar niks gaan live voor die volle suite groen is, die
onafhanklike QC dit goedkeur, en Hanno "voeg saam" sê nie.

## 8. Wat die QC op 28 Okt gevang het (en wat daaraan gedoen is)
Die eerste weergawe is **afgekeur**. Die blokkers, en die regstelling:
1. `les-sessie-begin-nie` het gesê 'n sessie "mag sonder die kamera begin" en Wallie moet weer druk.
   **Onwaar**: `proctor.js` se `start()` gee `{ok:false}` en roep `begin()` nooit sonder kamera nie.
   → Die antwoord sê nou dat die kamera nodig is, hoe om dit toe te laat, en wat om te doen as dit
   steeds misluk (op papier skryf, blok klaar merk). Die bron is nou die kode self.
2. Die bron-waarborg was dekoratief: die toets het net nagegaan of 'n reëlnommer binne 'n lêer val.
   Die kamera-antwoord se "bron" was LL-21, wat niks oor die kamera sê. → Elke handgeskrewe antwoord
   wat 'n bewering oor die app maak, het nou 'n `bewys`-patroon wat in die kode moet voorkom, anders
   faal die bou én die toets.
3. Die drempel was te laag (0.17): "die app werk nie" het RTT se Word-stoorraad gekry, "help" 'n
   diagnose uit die duim. → 0.26 (gemeet: ergste vals treffer 0.224, swakste egte vraag 0.299), 'n
   straf vir die verkeerde vak, en "waar/wanneer/wie" as stopwoorde.
4. Die strokie het buite 'n sessie 30 s lank tikke gevang, op die plek wat `kognitief.css` vir die
   Hulp-knoppie moes ontruim. → `pointer-events:none` altyd; net die toe-knoppie is klikbaar.
5. `fout-rag.js` het onderaan `<body>` gelaai, dus was die vanger antwoordloos vir juis 'n vroeë
   skrif wat nie laai nie, en die sein is boonop stilgemaak voordat dit gerapporteer is.
   → Dit laai nou saam met die vanger in `<head>`, en die sein word eers ná 'n werklike melding
   stilgemaak.
6. "Pa is in kennis gestel" is gewys sodra die funksie bestaan het. → Dit sê nou "Pa kry dit sodra
   daar internet is", en net as `WALLIE.SYNC` die melding werklik kon tou.
7. Twee FAQ-inskrywings ("Pa gee jou die vraestel", "vra vir Pa") breek §2.9/LL-17. → Hulle is uit
   die RAG gehou. **Oop vir Hanno:** die teks in `hulp.js` self moet ook reggemaak word.
8. `dagverslag.js` kon "GROEN" e-pos sonder dat die e2e-suite geloop het (dit het op 28 Okt gebeur).
   → Dit heet nou "GROEN (SONDER E2E)", sê dit uitdruklik, tel net geslaagde lopies se kontroles, en
   waarsku as die werkkopie ongecommitte wysigings het.
