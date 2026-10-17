# Opdrag: gereedheid-kruiskontrole (Hanno, 17 Okt 2026)

**Vraag van Hanno:** is die lesse en planne genoeg voorbereiding om Wallie van sy huidige druippunt (rekordeksamen) na die gestelde doelwit te kry? Stel 'n kruiskontroleerder aan vir:
- moeilikheidsgraad;
- eksamentegniek-afrigting;
- kognitiewe en visuele beste praktyk;
- die beste "911-metode" vir die min tyd wat oorbly.

**Agent:** Opus, onafhanklik, LEES-NET. Geen kode, commit, push of merge nie. Supabase: net SELECT op projek `jxfmzxebekqzwnlurtxg`, skema `wallie911`. Moenie die lewendige app oopmaak nie (dit skryf rooster-rye; sien LL-16).

## Feite (uit die repo; verifieer self)
- **Vertrekpunt en doelwit per vak** (`assets/js/data.js`, `prelim` / `jaar` / `teiken`):
  - Gasvryheid 27 / 45 → 60
  - Afrikaans HT 39 / 39 → 60
  - RTT 37 / 46 → 60 (V1 reeds geskryf 13 Okt)
  - Engels EAT 50 / 56 → 70 (V3 geskryf 15 Okt)
  - Toerisme 61 / 61 → 60
  - Wisk. Gel. 66 / 66 → 80
- **Eksamenrooster** (`assets/js/pa-konsole/exams.js`):
  - Afrikaans V3: Di 20 Okt
  - Wisk. Gel. V1 / V2: 23 en 26 Okt
  - Engels V1: 28 Okt
  - RTT V2: 29 Okt
  - Toerisme: 30 Okt
  - Gasvryheid: 6 Nov
  - Afrikaans V1 / V2: 11 en 20 Nov
  - Engels V2: 19 Nov
- **Planne:** `assets/js/schedule.js` het VASTE_PLANNE 13–26 Okt. 27 Okt en later is die generiese rotasie.
- **Vraagbanke:**
  - Engels V3 (7) en Afrikaans V3 (7): `data/vraebank-v3.json`
  - RTT V1-oefenvrae (30, 1–7 punte)
  - Ander vakke: niks.
- **DBE-spesifikasies:** `data/dbe-spesifikasie/*.json`, almal geverifieer teen die Nov 2025-vraestelle.
- **DBE-vraestelle en memo's:** `C:\Users\nHunter\DBE-cache\nov2025\`. Die Wisk. Gel.-vraestelle is beelde; render met `pymupdf` en lees dit as prent. Moenie DBE-teks in die repo sit nie.
- **Werklike gedrag:**
  - 14 Okt (LL-01) en 17 Okt: A2 6/100 min, merk 5/30, B4 2/40, almal "VROEG KLAAR". Self: fokus 4–5, eerlikheid 100, "moeg".
  - Wallie: "te lang sessies vir basiese vrae", "die standaard is reg".
  - Sy laptop is baie stadig, en die iPhone het nie die webwerf oopgemaak nie (16 Okt).
- **Metode van die app ("911"):** toe-boek → memo → foutlog → spasieer. Sien `docs/superpowers/specs/2026-09-27-wallie-911-pro-design.md`, `docs/lessons.md` en die les-kaarte in `assets/js/lessons.js`.
- **Ontwerp:** `docs/ontwerp/kognitief/SPESIFIKASIE.md`. Reëls: `AGENTS.md` en `docs/LESSONS-LEARNED.md`.

## Bestek: ELKE vraestel wat nog geskryf moet word (Hanno, 17 Okt: "dieselfde vir al sy vraestelle en vakke")
Die verslag dek al tien vraestelle hieronder. Elkeen kry sy eie ry en uitspraak; geen een mag uitval nie. Waar die vraestel-tipe verskil van die vak se ander vraestel, word dit apart beoordeel.

| # | Vraestel | Datum | DBE Nov 2025 in DBE-cache? |
|---|---|---|---|
| 1 | Afrikaans HT V3 (skryfwerk) | Di 20 Okt | ja |
| 2 | Wisk. Gel. V1 | Vr 23 Okt | ja |
| 3 | Wisk. Gel. V2 | Ma 26 Okt | ja |
| 4 | Engels EAT V1 (taal) | Wo 28 Okt | net memo (vraestel-skakel was verkeerd) |
| 5 | RTT V2 (teorie) | Do 29 Okt | ja |
| 6 | Toerisme | Vr 30 Okt | ja |
| 7 | Gasvryheidstudie | Vr 6 Nov | ja |
| 8 | Afrikaans HT V1 (taal) | Wo 11 Nov | ja |
| 9 | Engels EAT V2 (letterkunde) | Do 19 Nov | ja |
| 10 | Afrikaans HT V2 (letterkunde) | Vr 20 Nov | ja |

Vir die letterkunde-vraestelle (9, 10): bepaal eers (uit die vraestel se voorblad) watter voorgeskrewe werke daar is, en sê dat Hanno moet bevestig watter werke Wallie se skool doen. Die app het geen letterkunde-inhoud nie; dit is 'n eksplisiete gaping.

Engels EAT V3 (15 Okt) en RTT V1 (13 Okt) is reeds geskryf. Moenie dit beoordeel nie, behalwe as les vir die res.

## Wat die verslag moet doen
Per vraestel, met eksamendatum, in die volgorde van die eksamens:
1. **Gaping:** hoeveel punte van vertrekpunt na doelwit, uitgedruk in punte op die vraestel.
2. **Beskikbare tyd:** beplande studieminute tot die eksamen (vaste plan plus wat die generiese rotasie sou gee). Hoeveel daarvan is eksamenvlak-werk?
3. **Moeilikheidsgraad:** is die werk op DBE-vlak (vraaggrootte, kognitiewe vlakke L1–L4 waar die memo dit wys, tydsdruk)? Te maklik, reg of te swaar vir sy vertrekpunt? Gebruik die Nov 2025-vraestel/memo en die vraagbanke.
4. **Eksamentegniek:** wat leer die app hom oor tydsindeling, die lees van opdragwoorde, punte-per-minuut, keuse van vrae, om nie oop te laat nie, en die memo-styl van nasien? Wat ontbreek? Dit is waar die maklikste punte lê.
5. **Kognitiewe en visuele beste praktyk:**
   - Retrieval practice, spacing, interleaving, worked examples en daarna fading.
   - Kognitiewe las en die kognitiewe ontwerp (PR #31).
   - Waar staan die app sterk, en waar nie?
6. **"911" vir die min tyd:** die hoogste opbrengs per uur. Watter 20% van die werk gee 80% van die punte vir hierdie vak? Wat moet hy NIE meer doen nie?
7. **Uitspraak:** haalbaar / moontlik / onwaarskynlik met die huidige plan. Sê wat nodig is om dit haalbaar te maak.

Dan, kort en geprioritiseer:
- **Topregstellings vir Di 20 Okt (Afrikaans V3):** wat die volgende 2 dae verander moet word.
- **Wat vir die res bygebou moet word**, in die volgorde van die eksamens. Planne vir 27 Okt tot 20 Nov, eksamenvlak-items per vak en eksamentegniek-kaarte. Elkeen met:
  - die verwagte puntewins;
  - die moeite;
  - presies wat (lêer of spesifikasie);
  - of Hanno moet besluit.
- **Eerlikheid oor die data:** die 6-minuut-sessies kan papier-werk wees. Moenie aannames maak nie; sê wat bewys is en wat nie.

**Uitset:** `docs/voorbereiding/GEREEDHEID-2026-10-17.md` (Afrikaans, bondig, tabelle), en 'n kort opsomming terug aan die bestuurder.
