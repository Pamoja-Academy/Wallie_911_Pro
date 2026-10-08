# Hoe om Wallie_911_Pro oop te maak

## Maklikste (geen Node nodig — kamera werk)

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
- Tydens ’n hard-sessie sien jy elke 15 s: vak, tyd oor, waarskuwings (nou / hele sessie), slot, ouderdom
  van die laaste hartklop, en elke 45 s ’n klein kamera-foto. **SEIN WEG** = geen hartklop vir 45 s.
- Vandag se sessies en gebeure bly staan (ook ná ntfy se 12 uur). Kies ’n ander dag met die datum-kies.
- Kamera-foto’s word ná 3 dae outomaties uitgevee.

## Sagter slot

- Een tab-wissel = een waarskuwing. Fokus-blippies korter as 1,5 s tel nie.
- 8 s grasie ná **Begin** (kamera-toestemming) en 5 s ná ontsluit.
- Tyd **pouseer** terwyl gesluit; ontsluit sit waarskuwings terug na 0/3 (die sessie-totaal bly in die verslag).
- **Maak memo oop (PDF)** in die Sessie-blad wys die memo binne die app — dit tel nie as wegkyk nie
  (maks 15 min). Tab-wissel of ’n ander program tel steeds.

## Opsioneel: plaaslik met START-HIER.bat

As Node.js geïnstalleer is:

```bash
START-HIER.bat
```

→ http://localhost:9110

Sonder Node maak `START-HIER.bat` outomaties die HTTPS-skakel hierbo oop.

## Agter die skerms

- Pa-konsole: Supabase-projek `bic-tender-ops`, aparte skema `wallie911` (nie deur die API blootgestel nie).
  SQL: `supabase/wallie911_live.sql`. Pa se vrye Supabase-limiet (2 projekte) was vol; skuif dit na ’n eie
  projek deur die SQL daar te plak en `assets/js/live-config.js` se URL/sleutel te verander.
- Foon-push bly op ntfy: topic `wallie911-pa-15sos-hanno` (net belangrike gebeure; geen hartklop meer nie).
- Toetse: `node scripts/proctor-test.js` (slot + uitboks), `node scripts/smoke-parse.js`.

**[Hoof-briefing (Afrikaans)](principal-briefing.html)** — https://pamoja-academy.github.io/Wallie_911_Pro/principal-briefing.html

**[English](principal-briefing-en.html)** — https://pamoja-academy.github.io/Wallie_911_Pro/principal-briefing-en.html
