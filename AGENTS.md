# AGENTS.md — Wallie_911_Pro (een bron van waarheid vir ALLE agente)

Geld vir Claude Code, Cursor (agent, Bugbot, Approval Agent) en Grokbot. As jy hierdie repo aanraak, lees dit eers.
Die projekbestuurder (tans Claude Code, aangestel deur Hanno op 14 Okt 2026) hou hierdie lêer en
`docs/LESSONS-LEARNED.md` op datum. Wysig dit net via 'n PR.

## 1. Wat die produk is
Statiese Afrikaanse studie-app vir Wallie (matriek, NSS Okt/Nov 2026), op GitHub Pages vanaf `master`:
https://pamoja-academy.github.io/Wallie_911_Pro/ — Pa se kant: `pa-konsole.html`, `pa-afstand.html`.
Data: Wallie se toestel (localStorage) → `wallie_ingest_v2` (Supabase, skema `wallie911`, insert-only).
Eksamenrooster: `assets/js/pa-konsole/exams.js`. Dagplanne: `VASTE_PLANNE` in `assets/js/schedule.js`.

## 2. Harde reëls (nooit oortree nie)
1. **Proef-eksamens**: raak geen proef-blok (bv. `2026-10-14-proef`) of proefvraestel aan nie — nie lees, wys, kopieer of verander nie.
2. **Supabase**: skryf, wysig of vee NIKS (geen migrasie, geen `insert/update/delete`, geen skemawysiging). Lees (SELECT) vir diagnose mag.
   'n Nuwe event-soort vereis 'n skemawysiging (`wallie_ingest_v2` het 'n vaste lys) → STOP en vra Hanno.
3. **Wallie se plaaslike data** (localStorage-sleutels `wallie911_*`): nooit uitvee of herskryf nie; nuwe velde net by-voeg.
4. **Geen hallusinasie**: elke vraag/item het 'n DBE-bron (verwysing + bladsy) en slaag `scripts/eksamenvlak-hek.js`.
   Moenie DBE-vraagnommers, punte of bladsye uitdink nie. Onseker → merk `ONGEVERIFIEER — Hanno moet bevestig`.
5. **Hooftaak = eksamenwerk.** Die hooftaak van 'n studieblok (en die sessie-taakteks) is altyd 'n eksamenvlak-item
   (`blok.item`) of DBE-werk (`blok.werk`), nooit 'n les-kaart nie. Les-kaarte is `vlak: "agtergrond"` (opsioneel).
6. **Memo kom ná die werk** (eksamenmodus): nie een klik weg nie.
7. **Saamvoeg na `master` = live vir Wallie.** Net met groen CI én Hanno se uitdruklike "voeg saam" (of 'n staande opdrag
   in die huidige taak). Geen force-push na `master`. Saamvoeg die aand voor 'n eksamen: verifieer daarna live (foon + laptop, geen konsole-foute) dat die eksamendag-plan reg wys.
8. **Kognitiewe ontwerp (15 Okt, PR #31)**: een primêre aksie per skerm; tydens 'n sessie is fokusmodus aan (net Missie en Sessie in die nav);
   die eksamenklok is taai bo-aan; die hooftaak staan voor die agtergrond-prent; geen herhaalde teks nie. Spesifikasie: `docs/ontwerp/kognitief/SPESIFIKASIE.md`.
9. **Die inhoud is IN die app (21 Okt, LL-17)**: geen blok mag op iets buite die app staatmaak nie ("Pa gee die vraestel" is verbode).
   Elke werk- en merk-blok het 'n `item` of 'n `werk` met die amptelike DBE-skakels (vraestel, antwoordeboek/datalêers, memo)
   in `WALLIE.DBE.KATALOGUS`; elke skakel is afgelaai en nagegaan (HTTP 200, PDF) en die punte per vraag kom uit die vraestel of memo.
   'n Blok waarvan die werk in 'n ander oortjie oop is, is soort `skrif` (geen oortjie-slot nie). Toets: `tests/plan-v5.test.js`.

## 3. Werkwyse (projekbestuur)
- **Eers data, dan mening.** Status = Supabase SELECT op `wallie911.live`/`events` + `git log origin/master` + live `version.json`.
- **Plan vooruit**: daar moet altyd 'n vaste dagplan wees vir die volgende 5 dae en vir elke eksamendag
  (anders val die app terug op die generiese rotasie — sien LL-02).
- **Klein PR's**, elk met eie toetse; stapel as nodig en rebase met `git rebase --onto origin/master <ou-basis>` ná 'n squash-merge.
- **Weergawe**: by elke vrystelling bump `?v=` in `index.html`, `version.json` en `WALLIE.APP_VERSION` saam (`tests/weergawe.test.js`).
- **Modelle en rolle** (koste-effektief, kwaliteit eerste):
  - Bestuurder/beplanner/diagnose en finale QC: sterkste model (Opus).
  - Implementering van 'n PRESIESE spesifikasie, toetse skryf: Sonnet.
  - Wye soektogte/lees: 'n goedkoop verken-agent (Haiku/Explore).
  - Onafhanklike kwaliteitsbeheer: 'n tweede agent wat NIE die kode geskryf het nie, met hierdie lêer as kontrolelys.
  - Beplanmodus net as Hanno wakker is om die plan goed te keur; anders: skryf die plan in die PR-beskrywing.
- **Kwaliteitshek voor saamvoeg** (ook vir elke sub-agent se opdrag: die VOLLE suite, nooit net geteikende toetse — LL-11): `npm run test:skoon` groen · CI `qa` groen · onafhanklike QC-oorsig · lessons-learned nagegaan.

## 4. Toetse en omgewing
- `npm run test:skoon` (alles) · `node scripts/eksamenvlak-hek.js` · Playwright op poort 9123 (een lopie op 'n slag).
- **Windows-CRLF**: met `core.autocrlf=true` kry vendor-lêers en gegenereerde JS CRLF → vals SHA-384- en LF-mislukkings
  plaaslik. Skakel net die werkkopie om (`sed -i 's/\r$//' assets/vendor/*.js assets/js/vraebank-rtt-v1.js assets/js/vraebank-v3.js data/*.json`)
  en commit dit nooit. CI (Linux) is die waarheid.
- Skermkiekies: stel `WALLIE_ARTIFACTS_DIR` sodat die nagespoorde PNG's in `test-artifacts/` nie verander nie.

## 5. Lesse
Sien `docs/LESSONS-LEARNED.md`. Voeg 'n les by elke keer as iets herhaal of 'n mens dit moes vang.
