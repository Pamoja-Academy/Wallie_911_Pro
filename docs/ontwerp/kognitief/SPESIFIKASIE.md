# Kognitiewe ontwerp — oudit en spesifikasie (K1–K12)

Tak `ontwerp-kognitief` (bo-op PR #27). Opsteller: ontwerp-agent (Opus), 14 Okt 2026 aand.
Implementeerder: Sonnet, **letterlik** volgens hierdie dokument. Live ná Engels V3 (Do 15 Okt 11:30).

> **Hoe om dit te implementeer (kort):**
> 1. Kopieer `bylae/kognitief.css` na `assets/css/kognitief.css` (presies, niks verander nie).
> 2. Doen die vyf lêerveranderinge in §3 (index.html, app.js, lesson-ui.js, eksamenmodus.js). Elke stuk is 'n
>    "soek presies → vervang met"-blok.
> 3. Kopieer `bylae/kognitief.spec.js` na `tests/e2e/kognitief.spec.js`.
> 4. Weergawe-bump saam (AGENTS §3): alle `?v=` in `index.html` (ook die nuwe `kognitief.css`-skakel),
>    `version.json` en `WALLIE.APP_VERSION` in `assets/js/sync.js` → dieselfde nuwe string (bv. `2026-10-15a`).
> 5. `npm run test:skoon` (VOLLE suite, LL-11) moet groen wees.
>
> Al hierdie veranderinge is reeds in 'n weggooi-kopie toegepas en die volle Playwright-suite is daarteen gedraai
> (§5). Die bylae is dus nie teorie nie.

Harde reëls wat geld (AGENTS.md §2): geen proef-blok aangeraak, geen Supabase, geen netwerk na derde partye, hooftaak =
eksamenwerk, memo ná die werk, alle teks Afrikaans. **Nie verander nie:** die logika van die eksamenmodus-hek,
vroeg-klaar, hooftaak-keuse, proctor (kamera/waarskuwings), sinkronisering, die Pa-bladsye, en elke bestaande teks of
klasnaam wat toetse gebruik. Alles hier is vertoning plus nuwe klasse.

---

## 1. Oudit — bevindinge met bewys

Kiekies (voor): `voor-<skerm>-<laptop|foon>.png` in hierdie gids, gemaak met vals tye 15 Okt 14:05, 16 Okt 08:05 en
16 Okt 12:35, op 1366×768 en 390×844. Die oggendblokke van die dag is as klaar gesaai (realisties). Google Fonts is
in die toetsomgewing afgekap, dus wys die kiekies die stelsel-terugvalfont. Prototipe-kiekies (`na-prototipe-*.png`)
wys hoe dit ná K1–K12 lyk (CSS ingespuit, DOM nagemaak).

Metings: `getComputedStyle`/`getBoundingClientRect` in Chromium. Kontras is bereken met die WCAG 2.x-formule op die
`:root`-tokens. Karakters per reël (kpr) = inhoudsbreedte ÷ gemiddelde karakterbreedte van 'n Afrikaanse sin in die
element se font.

### Top-5 (grootste kognitiewe koste)

| # | Probleem | Bewys | Beginsel |
|---|---|---|---|
| 1 | **Die primêre aksie is onder die vou.** Op Missie vul die held (trui, h1, stadionklok) plus "Aftelling per vak" die hele eerste skerm. Die Volgende-kaart begin by y = 698 px (laptop, 768 hoog) en 1409 px (foon, 844 hoog). "▶ Begin nou" is by y = 1056 / 2016. | `voor-missie-laptop.png`, `voor-missie-foon.png` | Visuele hiërargie, een primêre aksie, signaling |
| 2 | **Te veel gelyke keuses.** Missie: 57 interaktiewe elemente, **8 primêre (geel) knoppies** (7× "Begin", ook op klaar-kaarte, plus "Laai log af"). Elke studiekaart het 5 teikens (prent, Begin, Maak item oop, Agtergrond: kyk les, ✓). Die nav bied 12 bestemmings, ook tydens 'n sessie. | metings `missie-*` | Hick se wet, een primêre aksie |
| 3 | **Geen fokusmodus tydens getimede werk nie.** Tydens 'n sessie bly die volle nav, die handelsmerk, en 'n **tweede tikkende klok** (topbalk "4d 18:54:54", sekondes) sigbaar. Op die item is Vorige/Volgende 'n klik weg, en die sessieskerm wys **nie die hooftaak of 'n knoppie daarheen nie**: net die (bewerkbare) Taak-veld. Op die foon is die sessieklok onder die vou (y = 907) onder 'n kamerabeeld van 282 px. | `voor-sessie-*.png`, `voor-sessie-klok-*.png` | Ekstrane las, split attention, coherence |
| 4 | **Die eksamenklok verdwyn wanneer Wallie lees of skryf.** Op die item staan die klok ná die vraag, beplanning en bron (y = 647 laptop / 1041 foon) en rol weg sodra hy in die antwoordarea skryf. Die luidste knoppie is die **gedeaktiveerde** "Memo gesluit" (geel), terwyl "Ek is klaar" grys is. "Tyd om" word in gevaar-rooi gewys. | `voor-skryfwerk-memo-gesluit-*.png`, `voor-skryfwerk-klok-*.png` | Signaling, klok sonder paniek, een primêre aksie |
| 5 | **Lees-reëls is te lank en die bloklys is moeilik om te skandeer.** `.sw-vraag` = 125 kpr, `.sw-teks` (voorbeeldantwoord) = 120 kpr, `.em-antwoord` = 117 kpr op laptop (doel 60–75). Die bloklys is 'n 3-kolom-rooster wat links→regs lees (nie chronologies nie). Elke kaart is 605 px hoog, ook pouses ("Opstaan, ontbyt" = 'n leë 605 px-kaart). Die agtergrondprent is die eerste en grootste ding op elke kaart; die Hooftaak staan ±330 px laer. | `voor-bloklys-*.png`, `voor-skryfwerk-memo-oop-laptop.png` | Leesbaarheid (lynlengte), skandeerbaarheid, signaling |

### Verdere bevindinge

- **Kontras (WCAG 2.2 AA):** wit op `--rooi` (zone-etiket ROOI, 12.5 px) = **3.84:1** ✗; wit op `--groen` = **3.28:1** ✗;
  wit op `--danger` ("Eindig sessie", 17 px/600) = **3.44:1** ✗; `--danger` as teks op `--panel` = **4.16:1** ✗.
  Knoppie- en veldrande `--line` teen `--panel`/`--bg-2`/`--bg` = **1.79 / 2.05 / 2.26:1** ✗ (1.4.11 vra ≥ 3:1; die
  spookknoppies word net deur hul rand herken). Klaar-kaarte (opacity 0.6): `--muted` teks = **3.57:1** ✗.
  In orde: `--text` op alle panele 13.2–16.7, `--muted` 6.5–8.2, `--accent` 6.2–7.9, `--ink` op `--accent` 8.25.
- **Teikens:** `.btn` is 43 px op die foon (16 px × 1.45 + opvulling); merkblokkies is 13×13 px (ook "Ek het dit op
  papier geskryf", 'n sleutelaksie); die sessievelde is 39–40 px; die sync-pil is 30 px; die `summary` "Lees Rassie se
  oproep" is 32 px.
- **Beweging:** nêrens `prefers-reduced-motion` nie. Die stadionklok se syfers pols elke sekonde (`pulse-digit`,
  oneindig) op die tuisskerm: 'n eksogene aandagtrekker.
- **Redundansie:** op Missie staan dieselfde aftelling vier keer (topbalk, heldreël "4 dae", stadionklok, vak-lys).
  Kaart-etiket "Afrikaans V3 B1 (25 punte, 40 min)" herhaal die Hooftaak-reël.
- **Kleursemantiek:** "rooi" beteken twee dinge: sone-prioriteit (al die Afrikaans-blokke) én gevaar (slot, oortyd,
  "Seker? Dit is eksamenwerk"). Die vroeg-klaar-waarskuwing is rooi teks sonder raam en sonder die alternatief
  (Begin). Dit lees as 'n fout, nie as "doen eerder dit" nie (`voor-seker-waarskuwing-*.png`).
- **Leesbaarheid:** basis 17/16 px is in orde, maar die lynhoogte is 1.45 (doel 1.5). Die instruksie waarom die memo
  toe is (`.em-rede`) is 14.4 px gedemp.
- **Selfnasien:** op laptop is die punte-veld ±800 px van sy kriterium (split attention). Twee gradeerstelsels
  (punte en Goed/Gedeeltelik/Moet oordoen) staan ewe sterk.
- **Foon-topbalk:** 'n taai topbalk van **165 px** (nav breek oor 2 rye) vreet 20% van die skerm, op elke skerm.
- **Buite omvang (vir Hanno):** (a) Die Volgende-kaart kies die eerste oop blok, ook as sy tyd verby is. Sonder
  gesaaide data wys die kaart om 14:05 nog die 07:15-blok. Dit is logika (`renderNextUp`), nie ontwerp nie.
  (b) "Maak memo oop (PDF)" op die sessieskerm is 'n klik weg tydens 'n item-blok. Oorweeg om dit tydens 'n
  `blok.item`-sessie weg te steek (AGENTS reël 6), maar dit raak die proctor-memo-modus, dus net met Hanno.
  (c) Die Hulp-knoppie (FAB) lê op die foon oor inhoud.

---

## 2. Veranderinge (geprioritiseer)

P1 = grootste wins teen laagste risiko. Elke K-nommer verwys na 'n blok in `bylae/kognitief.css` met dieselfde opskrif.
Nuwe tokens (in `:root` van `kognitief.css`):

| Token | Waarde | Rede |
|---|---|---|
| `--line-ui` | `#4f8a66` | rand van knoppies en velde: 4.44 / 4.03 / 3.51 : 1 op `--bg` / `--bg-2` / `--panel` |
| `--danger-teks` | `#ff8a7a` | gevaar as teks: 7.17 : 1 op `--bg-2`, 6.24 : 1 op `--panel` |
| `--let-op` | `var(--geel)` | versigtig of let op, nie gevaar nie (10.3 : 1 as teks op `--bg-2`) |
| `--topbar-h` | `0px` (app.js stel dit) | hoogte van die taai topbalk vir die taai klok |
| `--leesmaat` | `30em` | ±65–72 karakters per reël |

### P1

**K1 — Fokusmodus tydens 'n sessie** · beginsel: ekstrane las, coherence, Hick.
- Probleem: `voor-sessie-*`, `voor-skryfwerk-*`: 12 nav-bestemmings, 'n tweede tikkende klok, Vorige/Volgende tydens die tyd.
- CSS (`kognitief.css` §K1): onder `body.fokus-sessie` word `.brand`, `.countdown`, `.nav-more`,
  `#main-nav > .nav-btn` (behalwe `[data-view="missie"]` en `[data-view="sessie"]`), `.sw-vorige`, `.sw-volgende`,
  `.oe-vorige` en `.oe-volgende` weggesteek (`display: none`). Foon (≤ 640 px): `body.fokus-sessie .nav { order: 0; flex: 1 1 auto; }` (een ry).
- JS (`assets/js/app.js`): `startSessionFromUI` voeg die klas `fokus-sessie` op `body` by ná `startStills();`, en
  `finishSession` verwyder dit ná `WALLIE.proctor.stop();` (§3.2).
- Aanvaarding: voor die sessie is 4 `#main-nav > .nav-btn` sigbaar. Ná die sessiebegin het `body` die klas
  `fokus-sessie`, is presies 2 nav-knoppies sigbaar (Missie, Sessie), en is `.nav-more`, `#countdown` en `.brand`
  versteek. Op die item is `.sw-volgende` en `.sw-vorige` versteek en `.sw-terug` sigbaar. Ná `#end-session` is die
  klas weg.

**K2 — Sessieskerm: hooftaak bo, klok eerste, kamera klein** · beginsel: signaling, een primêre aksie, split attention.
- Probleem: `voor-sessie-*`: geen hooftaak of knoppie na die item nie; die klok is onder die vou op die foon (y = 907);
  "Eindig sessie" (rooi, vol) is die sterkste knoppie; die konsep-strook (6–8 teëls) is 'n keuse-magneet.
- DOM (`index.html`): nuwe `<div class="panel sessie-hooftaak" id="sessie-hooftaak" hidden></div>` reg vóór
  `#praktiese-banner`.
- JS (`assets/js/lesson-ui.js`): nuwe `renderSessieHooftaak(blok)`, geroep uit `renderSessionWerk` (§3.3). Dit wys net
  as daar 'n aktiewe proctor-sessie is EN die blok 'n vaste `blok.item` het. Dit gebruik die bestaande `hoofTaak()` en
  die bestaande `.open-item`-delegasie in app.js (geen nuwe hanteerder nie).
- CSS (§K2): `.sessie-hooftaak` 2 px `--accent`-raam. In fokus: `.session-controls` eerste (`order: -1`) as flex-kolom
  met `#lock-box` (−3), `#timer-display` (−2) en `#warn-display` (−1) bo-aan. Die kamera is 'n kolom van 240 px
  (`#camera` 180 px hoog; ≤ 800 px: 1 kolom en 140 px). `#start-session` is versteek. `#end-session` word 'n
  spookknoppie in `--danger-teks`. `#session-lesson .concept-strip` is versteek, en die les se primêre knoppie word 'n spookknoppie.
  **Die les-prent, h3 en wenke bly sigbaar** (les-terug/rtt-rotasie-toetse).
- Aanvaarding: 15 Okt 14:05, ná "▶ Begin nou": `#sessie-hooftaak` is sigbaar met "Hooftaak" en "B1". Die enigste
  sigbare primêre knoppie in `#view-sessie` is "Maak hooftaak oop". By scrollY 0 is die onderkant van `#timer-display`
  ≤ die viewport-hoogte (laptop én foon). `#session-subject` en `#session-lesson .session-lesson-img img` bly sigbaar.
  Die klik open `#view-skryfwerk` met `.sw-titel` ∋ "B1". Op 'n blok sonder `item` (16 Okt 12:35 WG) is
  `#sessie-hooftaak` versteek.

**K3 — Missie: Volgende-kaart eerste, hooftaak voor die prent** · beginsel: visuele hiërargie, progressiewe onthulling, Hick.
- Probleem: bevinding 1 en 2.
- DOM (`index.html`, §3.1): die volgorde in `#view-missie` word `#next-up` → `#day-stats` → bloklys-paneel →
  `.md-hero` → `details.vak-aftel-panel` → log-paneel. Die bloklys se wenk kry nuwe teks (§3.1). Geen id verander nie.
- CSS (§K3): `.next-card` kolomme `1.7fr / 1fr`, prent (`.next-img`) regs/onder (`order: 2`). `.next-body` word 'n
  flex-kolom met `.md-actions` vóór die agtergrond-blok (`order: 5` teenoor `6`). By 'n item-hooftaak is
  `.next-titel` versteek (dit herhaal die hooftaak). Die agtergrond is gedemp (1 rem / 0.95 rem, `--muted`).
  `.md-actions .open-lesson` is versteek op die kaarte (die prent is self die les-knoppie), maar nie op
  `.next-card.all-done` nie.
- Aanvaarding: by scrollY 0 is `#next-up .js-start` heeltemal in die eerste skerm (laptop gemeet: onderkant 346 px;
  foon: 482 px). `#next-up` kom in die DOM voor `.md-hero` en `#block-list`. `.next-img img` bly sigbaar en staan
  regs van of onder die hooftaak. 0 sigbare `.md-actions .open-lesson` in `#view-missie`.

**K4 — Eksamenmodus: taai klok-balk met vorderingstrook; foon-topbalk nie taai nie** · beginsel: signaling, klok sonder paniek, split attention.
- Probleem: bevinding 4.
- JS (`assets/js/eksamenmodus.js` → `pasToe`, §3.4): die bestaande `.em-klok` (met `.em-tyd`, `.em-tyd-info` en
  `.em-begin`, plus 'n nuwe `.em-nog`) gaan in 'n nuwe `.em-klok-balk` wat **eerste kind van die item-paneel** word.
  `.em-nuut` ("Begin nuwe poging") skuif na 'n nuwe `.em-nuut-rij` bo-aan `.em-kas`. In `teken()` kry die balk
  `--em-vordering` (0–1) en die klasse `em-laaste` (≥ 75% van die tyd) en `em-verby` (oor die tyd), en `.em-nog` kry
  "nog N min". **Die hek (`memoOntsluit`, `minWerkGedoen`, `memoRede`) bly onaangeraak.**
- JS (`assets/js/app.js`, §3.2): nuwe `safe(..., "topbalk-hoogte")` stel `--topbar-h` op die hoogte van `.topbar` as
  dit taai is, anders 0 (ResizeObserver + resize).
- CSS (§K4): `.em-klok-balk { position: sticky; top: var(--topbar-h); z-index: 15; … }`. Die strook (5 px,
  `::after`) is groen; in die laaste kwart geel; oor die tyd heeltemal geel. `.em-tyd.em-oor` word geel
  (nie `--danger` nie). Foon ≤ 640 px: `.topbar { position: static; }`.
- Aanvaarding: `.sw-detail > .panel` se eerste kind het die klas `em-klok-balk`. Ná die eerste woord pas `.em-nog` op
  `/^nog \d+ min$/`. Ná 'n afrol tot die middel van die bladsy is `.em-tyd` in die viewport en
  `elementFromPoint(middel van .em-tyd)` lê binne `.em-klok-balk` (nie bedek nie). Oor die tyd het die balk
  `em-verby` en is `.em-tyd` se kleur `rgb(242, 201, 76)`. Op 390 px is die `.topbar`-posisie `static`, op 1366 `sticky`.

**K5 — Eksamenmodus: een primêre knoppie op 'n slag** · beginsel: een primêre aksie, signaling.
- Probleem: die gedeaktiveerde "Memo gesluit" is geel (primêr) en "Ek is klaar" is grys (`voor-skryfwerk-klok-*`).
- CSS (§K5), sonder JS: `.em-memo-knoppie:disabled` word 'n spookknoppie met 'n gestippelde rand.
  `.panel:has(.em-klok-balk .em-begin[hidden]) .em-kas:has(.em-memo-knoppie:disabled) .em-klaar` kry die primêre
  styl. Sodra die memo oop is, word `.em-memo-knoppie[aria-expanded="true"]` 'n spookknoppie.
- Aanvaarding (knoppies binne `#skryfwerk-root` met agtergrond `rgb(200, 168, 75)`), presies een per toestand:
  (a) nog nie begin nie → ["Begin (klok loop)"]; (b) klok loop → ["Ek is klaar"]; (c) genoeg werk + klaar →
  ["Wys memo"]; (d) memo oop → ["Stoor my punte"].

### P2

**K6 — Leesbaarheid** · beginsel: lynlengte 60–75, lynhoogte 1.5, basis 16–18 px.
- CSS (§K6): `body { line-height: 1.5 }`. `.sw-vraag, .oe-vraag, .sw-teks, .oe-teks { font-size: max(17px, 1em);
  line-height: 1.6; max-width: var(--leesmaat) }`. Die lyste, die bron, `.em-rede`, `.em-sessie-wenk` en
  `.em-nuut-meld` kry `max-width: var(--leesmaat)`. `.em-antwoord { max-width: 32em; font-size: max(17px, 1em);
  line-height: 1.6 }`. `.em-rede, .em-sessie-wenk { font-size: 1rem; color: #d5e6db }` (12.6 : 1).
- Aanvaarding: `.sw-vraag` is ≥ 17 px (albei viewports) met 'n lynhoogte/grootte ≥ 1.5. kpr van `.sw-vraag` op
  laptop is in [55, 78] (prototipe: 69). kpr van `.sw-teks` ≤ 78. `.em-rede` is ≥ 16 px.

**K7 — Kontras en teikengroottes** · beginsel: WCAG 2.2 AA 1.4.3, 1.4.11, 2.5.8 (en ≥ 44 px vir Wallie).
- CSS (§K7): `--ink`-teks op `.zone-tag.rooi/.groen`, `.kind.rooi/.groen` en `.btn.danger` (4.93 / 5.77 / 5.50 : 1).
  `--line-ui`-rande op `.btn`, `.nav-btn`, `summary` en alle velde. `min-height: 44px` op `.btn`, die velde, die
  sync-pil en `.md-story > summary`; `a.btn` word `inline-flex`. Skaal-knoppies in die opname ≥ 44×44. Merkblokkies
  24×24 met `accent-color`, en hul label is ≥ 44 px hoog. `.digit-block small` 12 px. Klaar-kaarte: geen opacity nie,
  maar 'n gestippelde rand en `--muted` op h3/hooftaak (7.46 : 1).
- Aanvaarding: kontras van `#block-list .zone-tag.rooi` ≥ 4.5. Geen sigbare knoppie of `summary` in `#view-missie`
  of `.topbar` < 44 px nie. Geen knoppie of veld in `#view-sessie` < 44 px tydens 'n sessie nie.

**K8 — Beweging** · beginsel: prefers-reduced-motion (WCAG 2.3.3), minder eksogene aandag.
- CSS (§K8): `.stadium-clock.is-live .digit-block span { animation: none }` (altyd). Onder
  `@media (prefers-reduced-motion: reduce)` gaan alle animasies en oorgange na 0.01 ms met 1 iterasie.
- Aanvaarding: `#cd-secs` se animationName is `none`. Met `emulateMedia({ reducedMotion: "reduce" })` is
  `#view-missie` se animationDuration < 0.001 s.

**K9 — Bloklys as tydlyn** · beginsel: skandeerbaarheid (tyd → vak → hooftaak eerste), Hick, progressiewe onthulling.
- JS (`assets/js/lesson-ui.js` → `renderBlocks`/`matchdayCard`, §3.3): `is-volgende` op die eerste oop studieblok
  (dieselfde reël as `renderNextUp`), en `is-nou` as die plan vandag s'n is en `start ≤ nou < end`.
- CSS (§K9): `.md-list` 1 kolom. Elke `.md-card` is 'n rooster met die liggaam links en 'n klein prent regs
  (`clamp(88px, 22%, 200px)`). Die sone-kleur is 'n linkerstreep van 6 px. Foon ≤ 640 px: die prent is 88 px,
  absoluut regs bo, met `padding-right: 96px` op die meta-reël en h3. Pouses is een kompakte ry. Klaar-kaarte
  skuif na onder (`order: 1`). Net `.md-card.is-volgende .start-block` bly primêr; die ander word spookknoppies.
  `.is-nou` kry 'n 3 px `--accent`-buitelyn. By 'n item-hooftaak is `.md-label` versteek (dubbel).
- Aanvaarding (15 Okt 14:05): alle kaarte het dieselfde x (1 kolom). Die hooftaak se bokant is ≤ 160 px onder die
  kaart se bokant (prototipe: 85–135). Pouses is ≤ 130 px (laptop) / ≤ 180 px (foon) hoog. Elke oop kaart staan bo
  elke klaar kaart. `2026-10-15-afr-b1` het `is-nou`. Net dié kaart het `is-volgende`. Hoogstens 2 sigbare primêre
  knoppies in `#view-missie`. Die les-terug-toets bly groen (prente laai steeds).

### P3

**K10 — Kleursemantiek; "Seker?" wys die alternatief** · beginsel: konsekwente kleursemantiek, signaling.
- CSS (§K10): `.vroeg-wenk` word 'n let-op-kaart (geel raam 2 px, linkerstreep 6 px, `--text` op 'n 12% geel
  agtergrond, 11.6 : 1). `.mark-done.is-waarsku` is geel. In die kaart met die wenk kry die Begin-knoppie 'n primêre
  agtergrond en 'n 3 px geel buitelyn: "doen eerder dit". Gevaar-teks gebruik `--danger-teks`. Woordtelling: onder die
  minimum is gedemp, oor die maksimum is geel. `.next-card.kind-rooi` kry die aksent-raam (die etiket dra die sone,
  nie 'n alarm-raam nie).
- Aanvaarding (16 Okt 08:05, klik ✓ op afr-a1): `.vroeg-wenk` se borderTopColor is `rgb(242, 201, 76)`, sy teks is nie
  `rgb(232, 93, 76)` nie, en die kontras is ≥ 4.5. Die kaart se `.start-block` het 'n geel outlineColor en 'n
  aksent-agtergrond.

**K11 — Selfnasien: punte langs hul kriterium** · beginsel: split attention (ruimtelike nabyheid).
- CSS (§K11): `.em-punte` is een rooster `minmax(0, max-content) 5rem auto`, `.em-punt-rij { display: contents }`,
  en die ander kinders span die volle breedte. Knoppies lyn links uit. Die opskrif van die drie-knoppie-ry
  ("Hoe het dit gegaan?") is gedemp, dus sekondêr.
- Aanvaarding: alle `.em-punt-inp` het dieselfde x, ≤ 480 px van die linkerkant van `.em-punte`.

**K12 — Missie: sekondêre panele progressief** · beginsel: progressiewe onthulling, redundansie.
- DOM (§3.1): "Aftelling per vak" word `<details class="panel vak-aftel-panel"><summary class="vak-aftel-summary">`
  (toe by verstek); `#vak-aftel` bly dieselfde `ul`.
- CSS (§K12): `#view-missie .js-export-log` is 'n spookknoppie (die klas bly: smoke-parse). `.md-hero-line` is
  versteek (die aftelling staan al in die klok). Foon: `.md-trui` versteek, en die held is 1 kolom.
- Aanvaarding: `#vak-aftel` is binne `details:not([open])`. countdown.spec bly groen (teks-bewerings werk op
  versteekte elemente).

---

## 3. DOM- en JS-veranderinge (soek presies → vervang)

Die lêers het CRLF in die Windows-werkkopie. Pas net die inhoud aan; moenie lynkodes omskakel nie.

### 3.1 `index.html`

(a) Ná die `vraebank-v3.css`-skakel, voeg by (met dieselfde `?v=` as die res):
```html
  <link rel="stylesheet" href="assets/css/kognitief.css?v=2026-10-14d" />
```
(b) In `<section class="view active" id="view-missie">`: skuif die bestaande blokke sodat die volgorde dít is
(inhoud ongewysig, behalwe die twee aangeduide reëls):
```html
      <div id="next-up" class="next-up" aria-live="polite"></div>
      <div class="stats-row compact" id="day-stats"></div>
      <div class="panel">  <!-- Vandag se matchday-kaarte, ongewysig behalwe die wenk: -->
        …
        <p class="hint"><strong>Begin</strong> sit die kamera aan. Maak dan die hooftaak oop. Die prent is agtergrond (opsioneel): tik dit om die les te sien.</p>
        <ol class="block-list md-list" id="block-list"></ol>
      </div>
      <div class="md-hero"> … ongewysig … </div>
      <details class="panel vak-aftel-panel"><summary class="vak-aftel-summary">Aftelling per vak</summary><ul class="vak-aftel" id="vak-aftel"></ul></details>
      <div class="panel"> … Stuur my log na Pa, ongewysig … </div>
```
(Die ou reël `<div class="panel vak-aftel-panel"><h2>Aftelling per vak</h2><ul …></ul></div>` verdwyn.)

(c) In `#view-sessie`, reg vóór `<div id="praktiese-banner" …>`:
```html
      <div class="panel sessie-hooftaak" id="sessie-hooftaak" hidden></div>
```

### 3.2 `assets/js/app.js`

(a) `startSessionFromUI`: soek
```js
    startStills();
    showView("sessie");
```
vervang met
```js
    startStills();
    /* K1 fokusmodus: minder keuses en geen tweede klok tydens die sessie */
    document.body.classList.add("fokus-sessie");
    showView("sessie");
```
(b) `finishSession`: soek
```js
    WALLIE.proctor.stop();
    $("#camera").srcObject = null;
```
vervang met
```js
    WALLIE.proctor.stop();
    document.body.classList.remove("fokus-sessie");
    $("#camera").srcObject = null;
```
(c) Heel onder: soek `  }, "weergawe");\n})();` en vervang met
```js
  }, "weergawe");

  /* K4: hoogte van die taai topbalk, sodat die eksamenklok-balk net daaronder vassit (0 as die topbalk nie taai is nie) */
  safe(() => {
    const tb = document.querySelector(".topbar");
    if (!tb) return;
    const stel = () =>
      document.documentElement.style.setProperty("--topbar-h", (getComputedStyle(tb).position === "sticky" ? tb.offsetHeight : 0) + "px");
    if (window.ResizeObserver) new ResizeObserver(stel).observe(tb);
    window.addEventListener("resize", stel);
    stel();
  }, "topbalk-hoogte");
})();
```

### 3.3 `assets/js/lesson-ui.js`

(a) `matchdayCard`, pouse-sjabloon: soek
```js
      <li class="md-card kind-break ${done ? "done" : ""}" data-id="${b.id}">
```
vervang met
```js
      <li class="md-card kind-break ${done ? "done" : ""}${ctx.nou ? " is-nou" : ""}" data-id="${b.id}">
```
(b) `matchdayCard`, studie-sjabloon: soek
```js
      <li class="md-card kind-${b.kind} ${done ? "done" : ""}" data-id="${b.id}">
```
vervang met
```js
      <li class="md-card kind-${b.kind} ${done ? "done" : ""}${ctx.volgende ? " is-volgende" : ""}${ctx.nou ? " is-nou" : ""}" data-id="${b.id}">
```
(c) `renderBlocks`: soek
```js
  function renderBlocks(state) {
    const seen = {};
    const kaart = werkKaart(state);
```
vervang met
```js
  function renderBlocks(state) {
    const seen = {};
    const kaart = werkKaart(state);
    /* K9: dieselfde reël as renderNextUp (eerste oop studieblok), en die blok van "nou" as die plan vandag s'n is */
    const volgende = state.blocks.find(
      (b) => b.kind !== "break" && !WALLIE.isVerborgeVak(b.subjectSlug) && !state.completedBlocks[b.id]
    );
    const nou = new Date().toTimeString().slice(0, 5);
    const vandag = state.planDate === WALLIE.todayKey();
```
en soek
```js
        return matchdayCard(b, !!state.completedBlocks[b.id], occ, { werk: kaart[b.id] || null });
```
vervang met
```js
        return matchdayCard(b, !!state.completedBlocks[b.id], occ, {
          werk: kaart[b.id] || null,
          volgende: Boolean(volgende && volgende.id === b.id),
          nou: Boolean(vandag && b.start && b.end && b.start <= nou && nou < b.end)
        });
```
(d) Reg vóór die kommentaar `/* Die vraestel-paneel: drie knoppies …` en `function renderSessionWerk(blockId) {`,
voeg by:
```js
  /* K2: tydens 'n sessie op 'n blok met 'n vaste eksamenvlak-item (blok.item): die hooftaak bo-aan, met een
     primêre knoppie na die item. Gebruik dieselfde .open-item-delegasie as die Missie-kaarte (app.js). */
  function renderSessieHooftaak(blok) {
    const el = $("#sessie-hooftaak");
    if (!el) return;
    const h = blok && blok.item && WALLIE.proctor?.active ? hoofTaak(blok, null, 0) : null;
    if (!h || h.soort !== "item") {
      el.hidden = true;
      el.innerHTML = "";
      return;
    }
    el.hidden = false;
    el.innerHTML = `
      <p class="sessie-hoof-kop"><small>Hooftaak</small>${esc(h.tekst)}</p>
      <button type="button" class="btn big primary open-item sessie-hoof-knop" data-view="${h.view}" data-item="${esc(h.itemId)}">Maak hooftaak oop</button>`;
  }
```
(e) In `renderSessionWerk`: soek
```js
    const blok = blokById(sessieBlokId) || huidigeBlok();
    if (blok) sessieBlokId = blok.id;
    const werk = blok ? werkVan(blok.id) : null;
```
vervang met
```js
    const blok = blokById(sessieBlokId) || huidigeBlok();
    if (blok) sessieBlokId = blok.id;
    renderSessieHooftaak(blok);
    const werk = blok ? werkVan(blok.id) : null;
```
(`onSessionEnd` roep `renderSessionWerk()` ná `proctor.stop()`, dus versteek die paneel vanself ná die sessie.)

### 3.4 `assets/js/eksamenmodus.js` (net `pasToe`, net vertoning)

(a) Soek `    klok.append(klokTeks, klokInfo, beginKnop, nuutKnop);` en vervang met
```js
    /* K4: "nog N min" + die klok sit in 'n taai balk bo-aan die paneel; "Begin nuwe poging" bly in die kas */
    const nog = el("span", "em-nog", "");
    nog.hidden = true;
    klok.append(klokTeks, nog, klokInfo, beginKnop);
    const klokBalk = el("div", "em-klok-balk");
    klokBalk.append(klok);
    const nuutRij = el("div", "em-nuut-rij");
    nuutRij.append(nuutKnop);
```
(b) Soek
```js
    kas.append(klok, nuutMeld, sessieWenk, werk, klaarRij, rede, memoKnop);
    parent.insertBefore(kas, voor);
```
vervang met
```js
    kas.append(nuutRij, nuutMeld, sessieWenk, werk, klaarRij, rede, memoKnop);
    parent.insertBefore(kas, voor);
    parent.insertBefore(klokBalk, parent.firstChild);
```
(c) In `teken()`: soek `      beginKnop.hidden = Boolean(tstate.begin);` en vervang met
```js
      /* K4: vorderingstrook en "nog N min" (net vertoning; die memo-hek bly onveranderd) */
      const deel = tstate.begin && tydSek ? Math.min(1, v / tydSek) : 0;
      klokBalk.style.setProperty("--em-vordering", deel.toFixed(4));
      klokBalk.classList.toggle("em-laaste", Boolean(tstate.begin && tydSek && v >= 0.75 * tydSek && v <= tydSek));
      klokBalk.classList.toggle("em-verby", Boolean(tstate.begin && tydSek && v > tydSek));
      nog.textContent = tstate.begin && tydSek && v <= tydSek ? "nog " + Math.max(1, Math.ceil((tydSek - v) / 60)) + " min" : "";
      nog.hidden = !nog.textContent;
      beginKnop.hidden = Boolean(tstate.begin);
```

---

## 4. CSS

Die volledige, saamgestelde lêer is `bylae/kognitief.css` (kopieer dit presies na `assets/css/kognitief.css`). Dit
laai **ná** `vraebank-v3.css`, sodat dit by gelyke spesifisiteit wen (vraebank.css herdefinieer byvoorbeeld
`.em-tyd.em-oor`). Elke afdeling is gemerk `K1`…`K12`, soos in §2. Bestaande lêers (`app.css`, `vraebank*.css`,
`praktiese-modus.css`) word **nie** gewysig nie.

## 5. Risiko vir bestaande toetse (en wat die proeflopie gewys het)

Die hele spesifikasie (CSS + §3, met die `?v=` onveranderd) is op 14 Okt in 'n weggooi-kopie van die werkgids
toegepas. Die volle Playwright-suite is op 'n eie poort (9232) gedraai:

- **Bestaande suite: 147/147 groen** (9.1 min). `smoke-parse`, `weergawe.test` en `eksamenmodus.test` is ook groen.
- **`bylae/kognitief.spec.js`: 10/10 groen** (K1–K12, laptop + foon).
- Negatiewe kontrole: dieselfde spec teen die ongewysigde `index.html` gee **10/10 rooi**, dus meet die toetse
  werklik die veranderinge.

Bekende aandagpunte:

- Teks-bewerings op versteekte elemente (`#vak-aftel` in toe `<details>`; `#days-left` tydens fokus) werk, want
  Playwright se `toHaveText`/`toContainText` vereis nie sigbaarheid nie.
- `.open-item` op die sessieskerm: toetse soek `.open-item` altyd binne `#next-up` of 'n kaart, dus geen
  strict-mode-botsing nie.
- Die prente bly sigbaar (geen `display: none` op `.md-thumb` of `.next-img` nie), dus laai `loading="lazy"` steeds
  (les-terug).
- `innerText` van `#block-list` word net met `not.toMatch` (vakname) getoets. Die versteekte `.md-label` kan dit nie breek nie.
- Die topbalk is op die foon nie meer taai nie. preview-guard toets net dat die topbalk onder die banier begin (body
  `padding-top` bly).
- Fokusmodus geld net terwyl 'n proctor-sessie loop; geen bestaande toets klik op die nav tydens 'n sessie nie
  (hulle gebruik `WALLIE.app.showView` of `goto`).
