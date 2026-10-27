# AI-tot-AI-oordrag: realtydse sessie-ondersteuning (Wallie_911_Pro, 24 Okt 2026)

Vir die volgende agent. Lees dit heeltemal voordat jy iets verander. Elke bewering hieronder het 'n bron; verifieer
dit self met die lêers en die databasis genoem, want die vorige agent het al verkeerde aannames gemaak.

---

## 1. Doel

Wallie (matriek, NSS) skryf sessies in die app. Die huidige app gee hom 'n DBE-vraestel, maar **die vraag self, die
standaard, die herhaling en die formaat** is nie altyd korrek nie. Voorbeeld (23 Okt): hy het 2 van 5 vrae van
die Wisk. Gel.-vraestel gedoen en die ander 3 "geloshet". Hanno wil hê dat 'n ondersteuningsmeganisme **terwyl die
sessie loop** die inhoud kan hanteer: teen die DBE-spesifikasie, die RAG-korpus, en die gebruiker se kritiek oor
standaard, herhaling en formaat, en dit moet sonder 'n mens se tussenkoms gebeur.

## 2. Wat reeds bestaan (verifieer)

| Onderdeel | Waar | Status |
|---|---|---|
| Amptelike DBE-vraestel-katalogus | `assets/js/dbe-vraestelle.js`, `assets/js/dbe-vraestelle-oorblywend.js` | Werkend. 4 RTT + 10 Wisk. Gel. (Nov 2023/24/25, Jun 2024/25/26) + 26 oorblywend. |
| Rooster (wat op watter dag gegee word) | `assets/js/schedule.js` (`VASTE_PLANNE`) | Werkend. Sa 24 09:00 en So 25 09:00 is volle V2. |
| Omruil ("al gedoen?") | `dbe-vraestelle.js` (`ruil`), `lesson-ui.js` | Werkend. |
| Herhaling-hek | `tests/roete.test.js` §8, `tests/plan-v5.test.js` | Werkend. |
| Doelwitte + roete | `data/doelwitte.json`, `scripts/roete.js` | Werkend, R-tabel is 'n VOORSTEL (nie uit spes nie). |
| Oortjie-slot | `assets/js/proctor.js` `skrifSessie()` | skrif, merk-met-werk en herdoen is vry. |
| Aanmelding | `assets/js/toegang.js` (gebruiker `wallie`) | Live. Wagwoord in `C:\Users\nHunter\Documents\Wallie\app-wagwoord.txt`. |
| RAG-korpus (rou) | `C:\Users\nHunter\wallie-rag\` | 181 PDF's, `manifest.json`, `teks-verslag.json`. **Geen indeks, geen inbedding.** |
| RAG-skripte | `C:\Users\nHunter\wallie-rag\scripts\` | `korpus.py`, `teks.py`, `katalogus.py`. |
| Python-omgewing | `C:\Users\nHunter\wallie-rag\.venv` | py 3.12, torch-cpu, FlagEmbedding, pymupdf, rank_bm25, imageio-ffmpeg. |
| Skanderings | Wisk. Gel.-vraestelle 2023–Nov 2025 | **Geskandeer, OCR nodig.** Geen tesseract op die rekenaar. |

### Bekende skakelfoute op education.gov.za (moet nie gebruik word nie)
- Nov 2025 Eng FAL P1 vraestel-skakel = memo; P2/P3 = Jun 2025.
- Nov 2025 Afr HL P3 memo = Jun 2025.
- Jun 2024 Gasvryheid memo = vraestel.
Die duplikate-filter staan in `scripts/katalogus.py` en `teks.py`.

## 3. Wat ontbreek (die werk)

1. **RAG-indeks** oor die tekst (`C:\Users\nHunter\wallie-rag\teks\`). Stukke = een DBE-vraag (vak, vraestel, sessie,
   vraagnommer, subvraag, punte, bladsy). BGE-M3 (inbedding) + bge-reranker-v2-m3 + BM25. Toets: 20 Afrikaanse
   vrae, die regte item moet in die top 3 wees in ≥18 gevalle.
2. **Geskandeerde Wisk. Gel.-vraestelle**: OCR nodig. Eers vra Hanno of hy 'n OCR-hulpmiddel toelaat (installasie
   van stelselsagteware is NIE sonder sy toestemming nie).
3. **Realtyd-ondersteuning**: 'n klein diens of 'n app-hanteerder wat die sessie se teks/antwoord kan nagaan teen:
   - die DBE-spesifikasie (`data/dbe-spesifikasie/*.json`, afdelings en punte),
   - die RAG-indeks (is die vraag 'n DBE-vraag, of 'n nagemaakte?),
   - die herhaling-register (`REEDS_GESIEN`, `wallie911_vraestel_gesien`),
   - formaat-reëls (`docs/superpowers/specs/2026-09-27-wallie-911-pro-design.md` §2, §5).
   Die diens moet NIE die app se data skryf nie (AGENTS §2.2: geen nuwe event-soort, geen skema-wysiging nie).
4. **Toetse teen die spec**: elke nuwe funksie moet 'n toets in `tests/` hê en op `npm run test:skoon` loop.

## 4. Reëls wat NIE oortree mag word nie (AGENTS.md, LESSONS-LEARNED.md)

- Geen DBE-lêer in die repo nie (kopiereg). Net skakels.
- Geen nuwe localStorage-sleutel wat 'n bestaande een verander nie (§2.3).
- Geen skema-wysiging of nuwe event-soort sonder Hanno (§2.2). Migrasie 004 is nog nie deur Hanno toegepas nie.
- Saamvoeg na `master` = live. Net met groen CI én die onafhanklike QC én Hanno se "voeg saam" (§2.7).
- Elke samevoeging het 'n onafhanklike QC-agent (AGENTS §3). LL-18: 'n QC is nie optioneel nie.
- Weergawe: `index.html`, `version.json`, `assets/js/sync.js`, en die e2e-verwagtings bump saam (`tests/weergawe.test.js`).
- Wisselvallige toetse (LL-06, LL-15, LL-19): een herhaling toegelaat; ondersoek by die tweede keer.

## 5. Skills wat die volgende agent moet gebruik

- **Plan:** die bestuurder-agent (Opus) bepaal wat gebou word en keur die QC goed. Nie Haiku vir planne nie.
- **Implementering:** Sonnet/Opus vir presiese spesifikasie (RAG-skrip, toetse).
- **Onafhanklike QC:** 'n aparte Opus-agent wat NIE die kode geskryf het nie, met AGENTS.md as kontrolelys.
  Lees-net. Dit het die afgelope week 4 keer blokkeerders gevind (herhaling, tempo, plan-fouete, slot).
- **Verkenning:** `Explore`-agent vir breë soektogte.
- **Data-navrae:** Supabase `execute_sql` met SELECT net. Projek `jxfmzxebekqzwnlurtxg`, skema `wallie911`.
  Gebruik `to_char(... at time zone 'Africa/Johannesburg' ...)`. Nooit INSERT/UPDATE/DELETE of DDL nie.
- **Toetse:** `npm run test:skoon` (alles), `npx playwright test -c playwright.local2.config.js` (poort 9125).
  Playwright-tak: `npx playwright install chromium` as dit ontbreek.
- **Skermkiekies:** `tests/e2e/zz-*.spec.js` tydelik, met `KIEKIE_DIR` en `WALLIE_ARTIFACTS_DIR` na 'n tydelike gids;
  verwyder die spec ná gebruik.
- **Vraestelle lees:** `pdftotext -layout` (Git Bash) of `pymupdf` (`fitz`) in die `.venv`.
- **Kommunikasie met Hanno:** kort, eerlik, geen PR-skakels, sê eers of Wallie NOU kan begin, geen verskonings
  nie. Sien `C:\Users\nHunter\.claude\projects\C--Users-nHunter-Projects-Wallie-911-Pro\memory\hanno-kommunikasie.md`.

## 6. Toegang tot lêers (vir die agent se sukses)

- **Repo (live):** `C:\Users\nHunter\Projects\Wallie_ruil` (werkgids, tak `master`). Ook `Wallie_roete`, `Wallie_wg`,
  `Wallie_911_Pro` (ouer werkgidse, tak-dependent).
- **Wallie se wagwoord:** `C:\Users\nHunter\Documents\Wallie\app-wagwoord.txt`. Nie in die repo nie.
- **DBE-vraestelle (kopiereg, buite die repo):** `C:\Users\nHunter\DBE-cache\{nov2025,junie2026,vandag}\`.
- **RAG-werkgids:** `C:\Users\nHunter\wallie-rag\` (raw, teks, manifest, skripte, .venv).
- **Lesse en reëls:** `docs/LESSONS-LEARNED.md`, `AGENTS.md`, `docs/superpowers/specs/2026-09-27-wallie-911-pro-design.md`.
- **Geheue:** `C:\Users\nHunter\.claude\projects\C--Users-nHunter-Projects-Wallie-911-Pro\memory\`.
- **Live app:** https://pamoja-academy.github.io/Wallie_911_Pro/ (nie oopmaak sonder om dit te noem; LL-16).
- **Pa-konsole:** https://pamoja-academy.github.io/Wallie_911_Pro/pa-konsole.html (Pa se eie wagwoord).
- **GitHub:** `gh` CLI, repo `Pamoja-Academy/Wallie_911_Pro`.
- **Supabase:** MCP `mcp__959fff47-...__execute_sql` (SELECT).

## 7. Eerste stappe vir die volgende agent

1. Lees `AGENTS.md` en `docs/LESSONS-LEARNED.md` (LL-17 t/m LL-20).
2. Verifieer die stand: `git log origin/master -5`, `curl .../version.json` (moet 23a of later wees).
3. Vra Hanno (net EEN vraag): mag OCR installeer word vir die Wisk. Gel.-skanderings?
4. Bou die RAG-indeks en die 20-vraag-toets; rapporteer die uitslag aan Hanno in gewone woorde (geen PR-skakels nie).
5. Eers ná 'n groen QC en Hanno se "voeg saam" word iets live.

## 8. Wat Hanno het gesê (verbatim-essensie)

- "Wallie se net 2 uit die 5 vrae was op standaard, dis hoekom hy die ander 3 geloshet."
- Geen tyd vir die agent om op te check nie: die agent moet self seker maak dat alles in plek is.
- Die weeklikse kwota is op: die volgende agent moet effektief werk.
