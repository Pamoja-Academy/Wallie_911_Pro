# Pa-konsole v2 (`pa-konsole.html`) — MOENIE MERGE NIE sonder Hanno se OK

’n Nuwe, aparte bladsy vir Pa. Die bestaande `pa-afstand.html` bly net soos dit is (die ou konsole werk steeds; daar is ’n skakel heen).

## Wat dit wys (net TYD en AKTIWITEIT, nooit punte of persentasies nie)
- **Nou:** lewendige status (In sessie / Waarskuwing / Slot / Sein weg / Af), vak, blok, tyd besig, tyd oor, laaste hartklop.
- **Fokus-ring:** minute gefokus, sigbaar-maar-ander-venster, oortjie versteek, ledig.
- **Die dag in syfers:** minute gestudeer, blokke klaar, sessies, waarskuwings, slotte.
- **Rooster teenoor werklikheid:** tydlyn (rekenaar) of lys (foon), plus tabel; dag-kieser vir vorige dae.
- **Eksamen-aftelling:** volgende vraestel met aftelling, en die res van die NSS-rooster (geen LO nie).
- **Vak-tyd, laaste 14 dae** (hittekaart) en **hierdie week** (gestapelde kolomme).
- **Waarskuwings & gebeure** met filters, **kamera-strook** (tik vir groot), **stelsel-gesondheid** (sinkronisering, weergawe, hartklop-strook).
- Lig/donker/outo-tema, "Minder beweging"-knoppie en die toestel se "verminder beweging" word gerespekteer.

## Geen databasis-verandering nie
- Gebruik net die bestaande RPC’s: `wallie_pa_login/claim/logout/change_password`, `wallie_pa_overview`, `wallie_pa_live`, `wallie_pa_still`.
- Die 14-dae-geskiedenis word **in die blaaier** afgelei: een `wallie_pa_live`-roep per vorige dag (met 400 ms tussenin), gestoor in `localStorage` (`wallie911_pa_hist_v1`), sodat verlede dae net een keer gelaai word.
- Peiling: oorsig elke 60 s; tydens ’n sessie ’n ligte `wallie_pa_live` elke 15 s; stop wanneer die oortjie versteek is.
- `assets/js/data.js` (met punte) word **nooit** gelaai nie (die toets kontroleer dit).

## Voorskou sonder om lewendige data aan te raak
- `assets/js/preview-guard.js` is ’n greep-vir-greep-kopie van fase 1 se wag. Op enige gasheer behalwe `pamoja-academy.github.io` (bv. raw.githack.com of `file://`) blokkeer dit alle versoeke na Supabase/ntfy, wys die banier **VOORSKOU**, en die konsole loop dan op duidelik gemerkte **VOORBEELDDATA** (met ’n status-wisselaar). Aanmelding en wagwoord-verandering word in voorskou geweier.
- Voorskou-URL (ná push): `https://raw.githack.com/Pamoja-Academy/Wallie_911_Pro/pa-konsole-v2/pa-konsole.html`

## Biblioteke (in die repo, met SRI)
Sien `assets/vendor/README.md`: Apache ECharts 6.1.0 (Apache-2.0) en Motion 14.1.0 (MIT), elk met `integrity="sha384-…"`. ECharts laai asinchroon sodat die status eerste verskyn.

## Toetse
- `tests/e2e/pa-konsole-v2.spec.js` (Playwright, ECHTE Postgres via PGlite met migrasies 001+002): status, blokke, kliënt-kant geskiedenis (presiese minute per vak per dag), geen `%`, geen LO, geen data.js, sessie-verval, voorskou stuur NUL versoeke, SRI-kontrole.
- Hele bestaande suite bly groen (`npm test`).
