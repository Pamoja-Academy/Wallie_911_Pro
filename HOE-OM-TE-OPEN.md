# Hoe om Wallie_911_Pro oop te maak

## Maklikste (kamera werk)

Oop in Chrome/Edge:

**https://pamoja-academy.github.io/Wallie_911_Pro/**

1. Merk **waarneming-toestemming** (een keer per toestel; dit vra weer omdat kamera-foto’s nou na Pa gaan)
2. **Missie → Begin**
3. Pa-PIN by slot: `9110` (Wallie se slot — nie Pa se konsole-wagwoord nie)

## Pa — lewendige konsole (met wagwoord)

**https://pamoja-academy.github.io/Wallie_911_Pro/pa-afstand.html**

- Eerste keer: tik **“Eerste keer? Ek het ’n eenmalige kode”**, sit die kode in wat jy privaat gekry het,
  en kies jou eie wagwoord (8+ karakters). Die kode werk net een keer.
- Daarna: net die wagwoord. Die foon bly 30 dae ingeteken (token in die blaaier). **Teken uit** vee dit.
- Tydens ’n hard-sessie stuur Wallie se toestel elke 60 s ’n hartklop (vak, tyd oor, waarskuwings, slot,
  of die oortjie sigbaar/gefokus is en of daar 5 min geen muis/sleutelbord was nie), en elke 45 s ’n klein
  kamera-foto. Die konsole verfris elke 15 s. **SEIN WEG** = geen hartklop vir 2½ min.
- Die konsole wys ook (sodra `migrations/002_pa_overview.sql` toegepas is): **Vandag** en **Hierdie week** se rooster
  teenoor werklikheid per vak (gepland / klaar / gedeeltelik / gemis), **al Wallie se survey-terugvoer woordeliks**
  met datum en tyd, probleem-rapporte, die kamera-foto’s, en wanneer sy toestel laas suksesvol gesinkroniseer het.
  Alles word op die bediener bereken. Sonder 002 wys dit die basiese weergawe met ’n duidelike boodskap.
- Jy hoef niks van Wallie te kry nie: elke sessie, survey en probleem gaan outomaties na die konsole.
  Sonder internet wag dit in ’n tou op sy skootrekenaar en gaan later (niks verlore, niks dubbel).
  Bo-aan sy skerm staan **Gesinkroniseer** (groen) of **Nie gesinkroniseer nie** (rooi).
  As dit langer as 10 min nie sinkroniseer nie, kry jy ’n ntfy-push **SINK-PROBLEEM**, en by herstel
  **SINK HERSTEL** met hoe lank die gaping was.
- Vandag se sessies en gebeure bly staan (ook ná ntfy se 12 uur). Kies ’n ander dag met die datum-kies.
- Kamera-foto’s word ná 3 dae outomaties uitgevee.

## Sagter slot

- Een tab-wissel = een waarskuwing. Fokus-blippies korter as 1,5 s tel nie.
- 8 s grasie ná **Begin** (kamera-toestemming) en 5 s ná ontsluit.
- Tyd **pouseer** terwyl gesluit; ontsluit sit waarskuwings terug na 0/3 (die sessie-totaal bly in die verslag).
- **Maak memo oop (PDF)** in die Sessie-blad wys die memo binne die app — dit tel nie as wegkyk nie
  (maks 15 min). Tab-wissel of ’n ander program tel steeds.

## START-HIER.bat

Dubbelklik `START-HIER.bat`: dit maak net die lewendige weergawe
(https://pamoja-academy.github.io/Wallie_911_Pro/#missie) in die verstek-blaaier oop.
Geen plaaslike kopie meer nie — so loop Wallie altyd die nuutste weergawe, en sy data sinkroniseer na Pa.

## Agter die skerms

- Pa-konsole: Supabase-projek `bic-tender-ops`, aparte skema `wallie911` (nie deur die API blootgestel nie).
  SQL: `supabase/wallie911_live.sql`. Pa se vrye Supabase-limiet (2 projekte) was vol; skuif dit na ’n eie
  projek deur die SQL daar te plak en `assets/js/live-config.js` se URL/sleutel te verander.
- Foon-push bly op ntfy: topic `wallie911-pa-15sos-hanno` (net belangrike gebeure; geen hartklop meer nie).
- Sinkronisering: `assets/js/sync.js` (tou `wallie911_sync_v2`, terugvul uit `wallie911_v2_bok`).
  Databasisverandering wat nog Pa se OK nodig het, in hierdie volgorde: `migrations/001_wallie_ingest_v2.sql`, dan
  `migrations/002_pa_overview.sql` (die app werk ook sonder; sake wat wag, bly veilig in die toestel se tou).
- Toetse: `npm install && npx playwright install chromium && npm test`
  (eenheid + rook + SQL in PGlite + Playwright met nagemaakte Supabase; skermkiekies in `test-artifacts/`).

**[Hoof-briefing (Afrikaans)](principal-briefing.html)** — https://pamoja-academy.github.io/Wallie_911_Pro/principal-briefing.html

**[English](principal-briefing-en.html)** — https://pamoja-academy.github.io/Wallie_911_Pro/principal-briefing-en.html
