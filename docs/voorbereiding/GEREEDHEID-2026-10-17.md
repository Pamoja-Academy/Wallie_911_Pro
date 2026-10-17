# Gereedheid-kruiskontrole: al tien oorblywende vraestelle (17 Okt 2026)

Kruiskontroleerder: Opus, onafhanklik, net gelees. Bronne: `assets/js/data.js`, `assets/js/schedule.js` (alle dae
17 Okt tot 20 Nov met `buildDayPlan` uitgevoer), `assets/js/lesson-ui.js` (hooftaak-keuse), `assets/js/lessons.js`,
`data/vraebank-*.json`, `data/dbe-spesifikasie/*.json`, die DBE-vraestelle en memo's in `DBE-cache/nov2025`
(Wisk. Gel. as prent gerender), en Supabase `wallie911` (net SELECT op `events`, `live`, `plan`).
Geen DBE-teks word hier aangehaal nie: net getalle, vraagnommers, vlakke en my eie opsomming.

**Kort antwoord op Hanno se vraag:** nee, nog nie. Die planne tot 26 Okt is op DBE-vlak en goed gebou
(veral Wisk. Gel.). Maar vir die ses vraestelle ná 26 Okt is daar **geen vak-spesifieke plan** nie. Die
generiese rotasie gee daarna ±91 uur aan vakke wat reeds geskryf is. Die grootste risiko is egter nie die metode
nie, maar die **volume werk wat werklik gebeur**: die laaste drie dae het in die app 2 tot 6 minute per blok gewys.

---

## 0. Eerlikheid oor die data (eers, want alles hang hiervan af)

| Bewering | Status | Bewys |
|---|---|---|
| 17 Okt: A2-opstel 6 min, merk 4–5 min, B4 1–2 min, al drie "VROEG KLAAR" | **Bewys** | `live`: 6/4/1 min, sigbaar = gefokus = werklike tyd, **ledig 0 min**; `events` `minute_gedoen` 6/5/2 |
| Tydens daardie 6 min het hy op papier geskryf | **Weerspreek vir die sessie self** | ledig = 0: hy het die hele 6 min met die skerm gewerk, nie op papier nie |
| Hy het vóór die sessie op papier geskryf | **Onbekend** | A2-blok was 08:30–10:10; sessie het eers om 10:05 begin. Die 95 min kan papierwerk wees of laat begin. Geen papier-minute is in enige gebeurtenis gestoor nie |
| 15 en 16 Okt: B1, B2, A1, B3 en Wisk. Gel. V1 V1–V2 gedoen | **Geen spoor** | Geen enkele gebeurtenis (geen sessie, geen blok gemerk) op 15 of 16 Okt nie. Kan papier wees; kan ook nie gebeur het nie |
| Blokke word klaar gemerk sonder werk | **Patroon, nie bewys nie** | 12 Okt 17:00: 6 blokke in 8 s gemerk; 14 Okt 11:00: 7 blokke in 25 s (ook die getimede C1 en die proef-briefing) |
| Punte wat hy behaal het | **Onsigbaar** | Migrasie 004 is **nie toegepas nie** (`het_v3_poging = false`). Alle pogings met `punte_behaal` lê geparkeer op sy toestel |
| Selfbeeld | Bewys (self-gerapporteer) | fokus 4–5, eerlikheid 100 (een keer "meeste"), "te maklik" (12, 14 Okt), "reg" (17 Okt), "moeg" 3×, vrye teks: te lang sessies vir basiese vrae, herhaling |
| Prelim/jaar-punte | **Aangeneem** | uit `data.js`; nie teen 'n rapport nagegaan nie |
| Engels V3- en RTT V1-uitslag | **Onbekend** | geen terugskou-gebeurtenis van 15 Okt nie |

**Gevolgtrekking:** ek kan nie bewys dat hy niks doen nie, en ook nie dat hy iets doen nie. Wat bewys is: die
app sien amper geen eksamenvlak-werk nie, en sonder migrasie 004 sien niemand punte nie. Die eerste regstelling
is dus om dit sigbaar te maak (§3, R1), anders is elke uitspraak hieronder 'n skatting.

---

## 1. Oorsig: gaping, tyd en uitspraak

Gaping = (teiken − vertrekpunt) × vraestelpunte. **Aanname:** die teiken geld as eksamenpersentasie; die SBA/PAT-deel
(±25%) is buite rekening. Twee vertrekpunte: prelim en jaar. "Beplan" = alle nie-pouse-minute vir die vak in
`buildDayPlan` vanaf 17 Okt 12:00 (of die vak se vorige vraestel) tot die eksamen; "eksamenvlak" = vaste blokke met
soort `toets`/`skrif`/`merk`/`herdoen`. Generiese blokke het geen tyd nie en tel vanaf 08:00 (dus ook die oggend van
'n middag-eksamen).

| # | Vraestel | Datum | Punte / tyd | min/punt | Gaping (prelim / jaar) | Beplan | Waarvan eksamenvlak | Uitspraak |
|---|---|---|---|---|---|---|---|---|
| 1 | Afrikaans HT V3 | Di 20 Okt | 100 / 3 u | 1,8 | **21 / 21** | 300 min | 250 (190 toets+merk) | **Onwaarskynlik** (60); 48–50 moontlik |
| 2 | Wisk. Gel. V1 | Vr 23 Okt | 150 / 3 u | 1,2 | **21 / 21** | 680 | 640 | **Moontlik** |
| 3 | Wisk. Gel. V2 | Ma 26 Okt | 150 / 3 u | 1,2 | **21 / 21** | 420 | 380 | **Moontlik** |
| 4 | Engels EAT V1 | Wo 28 Okt | 80 / 2 u | 1,5 | **16 / 11** | 70 (generies) | 0 | **Onwaarskynlik** |
| 5 | RTT V2 (teorie) | Do 29 Okt | 150 / 3 u | 1,2 | **35 / 21** | 210 (generies) | 0 (verkeerde inhoud) | **Onwaarskynlik** |
| 6 | Toerisme | Vr 30 Okt | 200 / 3 u | 0,9 | **−2 / −2** (op teiken) | 140 (generies) | 0 | **Haalbaar** (behou) |
| 7 | Gasvryheidstudie | Vr 6 Nov | 200 / 3 u | 0,9 | **66 / 30** | 880 (generies) | 0 | **Onwaarskynlik** (60 v. prelim); moontlik v. jaar |
| 8 | Afrikaans HT V1 | Wo 11 Nov | 70 / 2 u | 1,7 | **15 / 15** | 1 280 (generies) | 0 | **Moontlik** as gebou |
| 9 | Engels EAT V2 | Do 19 Nov | 70 / 2½ u | 2,1 | **14 / 10** (lit 38% → 22) | 770 (generies) | 0 | **Onwaarskynlik** |
| 10 | Afrikaans HT V2 | Vr 20 Nov | 80 / 2½ u | 1,9 | **17 / 17** | 720 (generies) | 0 | **Onwaarskynlik** |

Die generiese rotasie (27 Okt e.v.) is elke dag dieselfde: Wisk. Gel. 30+50, Gasvryheid 80, Afrikaans 80,
Engels óf Toerisme 70 (om die beurt), RTT 70, foutlog 25 = 405 min. Dit **weet nie van eksamens nie**:
- **5 450 min (±91 uur)** gaan na vakke wie se laaste vraestel al geskryf is (Wisk. Gel. ná 26 Okt, RTT ná 29 Okt,
  Toerisme ná 30 Okt, Gasvryheid ná 6 Nov).
- Eksamendae kry 'n volle 405-min-dag, ook 28/29/30 Okt en 11/19/20 Nov.
- Hooftaak (`lesson-ui.js hoofTaak`): RTT kry die **V1-praktiese** oefenvrae (1–7 punte) as hooftaak vir V2-teorie,
  want `eksamenKlaar` filter net Engels/Afrikaans en `EKSAMENVLAK_AGTERGROND` is leeg. Afrikaans en Engels kry ná
  hul V3 net die bloknaam ("rooi-sone"/"geel-sone"), want hul V3-items word weggefilter en `GAPING` het geen
  inskrywing vir hulle nie. Engels se blok-detail praat van letterkunde op die dag voor die **taal**-vraestel.

---

## 2. Per vraestel (eksamenvolgorde)

### 2.1 Afrikaans HT V3 (skryfwerk), Di 20 Okt
DBE Nov 2025 (nagegaan): A opstel 50 (1 van 8 onderwerpe, waarvan 3 prente; 400–450 w; ±100 min; rubriek Inhoud &
beplanning 30 / Taal 15 / Struktuur 5). B 2×25 (2 van 6 tekste; 180–200 w; ±40 min elk; Inhoud, beplanning en
formaat 15 / Taal 10). Beplanning moet sigbaar wees en deurgehaal word.
- **Gaping:** 21 punte op 100.
- **Tyd:** 300 min oor (18 Okt 90, 19 Okt 190, 20 Okt 20). 190 min toets+merk: B5, een opstel weer.
- **Moeilikheid:** reg. Die 7 items kom uit DBE Jun 2024/2025 HT V3, vol grootte en vol tyd, met voorbeeldantwoord,
  formaatlys en rubriek. Maar vir 'n 39%-kandidaat wat 2–6 min werk, is 'n 100-min-blok die drempel wat hy vermy.
  Die bank dek 2 van die 6 Nov 2025-tipes (informele brief, verslag); e-pos, notule/agenda, huldeblyk, onderhoud
  ontbreek. Die 19 Okt-blok sê "ander onderwerp uit A1" maar item A1 het net een onderwerp.
- **Eksamentegniek in die app:** tyd per afdeling (sterk), woordtelling (sterk), formaatlys (sterk).
  **Ontbreek:** keuse-oefening (lees alle onderwerpe, kies binne 5 min), "moenie 'n afdeling oop laat nie"
  (een ontbrekende B-teks = −25, die grootste enkele risiko), wat sigbare beplanning werd is, en 'n eksterne nasien
  (selfnasien met 'n rubriek oorskat by swak skrywers).
- **Kognitief:** uitgewerkte voorbeeld + verduideliking is goed; daarna spring dit direk na die volle taak (geen
  *fading* nie: eers die voorbeeld aanvul, dan net inleiding + slot, dan vol).
- **911:** (1) al drie stukke klaar en op lengte; (2) korrekte formaat vir 3 ingeoefende teksoorte; (3) beplan
  10 min. Dit is die 20% wat ±80% van die bereikbare wins gee. **Nie meer nie:** nóg 'n volle 100-min-opstel, die
  voorbeeldantwoord passief lees, nuwe lesse.
- **Uitspraak:** 60 is onwaarskynlik in 2 dae. ±48–50 is moontlik as hy net volledig, op lengte en in formaat skryf.

### 2.2 Wisk. Gel. V1, Vr 23 Okt
DBE Nov 2025 V1: 5 vrae 30/32/30/28/30; finansies en datahantering (koste per eenheid, belasting/salaris,
mediaan/kwartiele, grafieke, BTW, paaiemente, wisselkoers). Memo merk elke subvraag L1–L4: 20 L1, 16 L2, 10 L3,
7 L4 (aantal subvrae, nie punte nie) en ken M/MA/CA/RT-punte toe.
- **Gaping:** 21 op 150. **Tyd:** 680 min, 640 eksamenvlak, met 'n volle proef (21 Okt), per-vraag blokke van
  40–75 min teen 1,2 min/punt. Dit is die beste plan in die app.
- **Moeilikheid:** reg (presiese DBE-vraaggroottes en tyd). Vir 66→80 moet hy L1–L2 amper vol kry en ±helfte van L3–L4.
- **Tegniek:** geen kaart oor CA-punte nie (verkeerde vorige antwoord kry steeds opvolgpunte), "toon alle
  bewerkings", eenhede, afronding volgens konteks, en L4-"motiveer"-punte. Dit is gratis punte.
- **Risiko:** die plan vra 4 verskillende V1-vraestelle ("Pa gee"); `dbe-vraestelle.js` het geen Wisk. Gel. nie
  en die cache het net Nov 2025. 16/17 Okt se blokke het geen spoor nie.
- **911:** finansies-berekeninge (rente, BTW, belasting, paaiement) + data (mediaan/IKO/grafiek lees): ±70% van V1.
- **Uitspraak:** moontlik, as die papiere bestaan en hy die proef doen.

### 2.3 Wisk. Gel. V2, Ma 26 Okt
DBE Nov 2025 V2: 28/34/32/30/26; kaarte, plane en skaal, meting (omtrek/area/volume, eenhede), tyd/afstand/spoed,
waarskynlikheid. Memo: 20 L1, 15 L2, 7 L3, 7 L4.
- **Gaping:** 21. **Tyd:** 420 / 380 eksamenvlak, eers ná die V1-eksamen (23 Okt middag).
- **Moeilikheid:** reg. Kaarte (skaal, area-volume) bestaan as lesse; geen kaart oor plan-lees of waarskynlikheid nie.
- **Tegniek:** eenhede omskakel, formule wat gegee word gebruik, skaal-berekening wys.
- **911:** skaal + meting + roete/afstand-tyd. **Uitspraak:** moontlik.

### 2.4 Engels EAT V1 (taal), Wo 28 Okt
Nov 2025-memo (vraestel ontbreek in die cache): begrip 30, opsomming 10, taal 40 (advertensie 10, strokiesprent 10,
taal en redigering 20); 80 punte, 2 u.
- **Gaping:** 16 (prelim) / 11 (jaar). **Tyd:** 70 generiese minute op 27 Okt; niks V1-spesifiek nie; blokdetail
  praat van letterkunde.
- **Moeilikheid:** geen werk om te beoordeel nie. Lesse: reported speech, figures of speech (bruikbaar).
- **Tegniek ontbreek:** opsomming (punte-in-eie-woorde, woordtelling), "in jou eie woorde"-vrae, redigering.
- **911:** afdeling C (40 punte) is die mees afrigbare taal; opsomming 10 is amper suiwer tegniek.
- **Uitspraak:** onwaarskynlik met die huidige plan; moontlik met 'n vaste 26 Okt-middag + 27 Okt-plan.

### 2.5 RTT V2 (teorie), Do 29 Okt
DBE Nov 2025 V2: A 25 (meervoudige keuse, pasitems, waar/onwaar), B 75 (stelseltegnologie, internet/netwerke,
inligtingsbestuur, sosiale implikasies, oplossingsontwikkeling), C 50 (twee geïntegreerde scenario's).
Die voorblad se reëls (my opsomming): een punt per feit; ekstra antwoorde word nie nagesien nie; vae woorde soos
"goedkoper/vinniger" tel nie; geen handelsname nie.
- **Gaping:** 35 / 21. **Tyd:** 210 generiese minute, wat die **V1-praktiese** oefenvrae as hooftaak bedien.
- **Moeilikheid:** daar is geen teorie-items nie; net die les "PAN · LAN · WAN". Te maklik én verkeerde vraestel.
- **Les uit V1 (13 Okt):** die 12 Okt-proef is binne 1 min deur die oortjie-slot gesluit (3 waarskuwings), want
  prakties werk mens in Excel/Word. Al die oorblywende vraestelle is pen-en-papier: gebruik soort `skrif`.
- **911:** afdeling A (25) + die "een punt per feit"-reël oor die hele vraestel; daarna B op terminologie.
- **Uitspraak:** onwaarskynlik met die huidige plan; moontlik met Nov 2025 V2 + memo plus een ouer V2.

### 2.6 Toerisme, Vr 30 Okt 14:00
DBE Nov 2025: A 40 (kortvrae) + B 50 (kaartwerk, toerbeplanning, buitelandse valuta) + C 50 + D 30 + E 30 = 200.
Wisselkoers-antwoorde tot 2 desimale; toon berekeninge; punte bepaal lengte.
- **Gaping:** geen (61 teen teiken 60). **Tyd:** 140 min (28 Okt + oggend van 30 Okt).
- **Moeilikheid:** geen bank nie; `GAPING` wys na "Nov 2025, kies 'n vraag" (die enigste ongebruikte proef).
  Lesse: wisselkoers, tydsones, vraag-lees, vermenigvuldiger-effek (goed gekies).
- **911:** afdeling A + valuta-berekeninge + "lees die vraag 2×". **Nie** nuwe hoofstukke nie.
- **Uitspraak:** haalbaar; die doel is om nie punte te verloor nie.

### 2.7 Gasvryheidstudie, Vr 6 Nov 14:00
DBE Nov 2025: A 40 (kortvrae, alle onderwerpe), B 20 (kombuis/restaurant, higiëne en veiligheid), C 80 (voeding,
spyskaart, kommoditeite), D 60 (sektore en loopbane, voedsel- en drankbediening).
- **Gaping:** 66 (prelim 27) / 30 (jaar 45). Laagste vertrekpunt van alle vakke.
- **Tyd:** 880 generiese minute (11 dae × 80), maar sonder inhoud: hooftaak = "Nov 2025, kies 'n vraag ±20 punte".
- **Moeilikheid:** 4 lesse (gevaarsone, HACCP, koste, tafeldekking). Geen eksamenvlak-werk.
- **911:** C (80) + D (60) = 70% van die punte; A (40) is herroeping van feite (retrieval-kaarte werk hier die beste).
- **Uitspraak:** 60 is onwaarskynlik vanaf 27; ±50 is moontlik as die 880 min DBE-vraestelle per afdeling word.

### 2.8 Afrikaans HT V1 (taal), Wo 11 Nov
DBE Nov 2025: A leesbegrip 30 (±50 min), B opsomming 10 (±30 min), C taalstrukture 30 (±40 min:
advertensie 10, strokiesprent 10, artikel 10); 70 punte, 2 u.
- **Gaping:** 15. **Tyd:** 1 280 generiese minute: die meeste van alle vraestelle, maar sonder 'n hooftaak.
- **Moeilikheid:** lesse oor opdragwoorde, indirekte rede, lydende vorm: reg vir afdeling C. Geen begrip-/opsommingswerk.
- **911:** opsomming (10 punte, suiwer tegniek) + taal C (30) met ou vraestelle. **Uitspraak:** moontlik as gebou.

### 2.9 Engels EAT V2 (letterkunde), Do 19 Nov
Die cache se "Nov 2025-vraestel" is eintlik **Mei/Junie 2025** (memo is Nov 2025). Albei: 70 punte, 2 van 4 afdelings
(roman, drama, kortverhale, poësie; 35 elk; ±75 min elk). Werke in 2025: romans *Cry, the Beloved Country*,
*Strange Case of Dr Jekyll and Mr Hyde*; drama's *Macbeth*, *My Children! My Africa!*; plus voorgeskrewe
kortverhale en gedigte (kontekstuele vrae op albei uittreksels).
**Hanno moet bevestig watter twee afdelings en watter werke Wallie se skool doen** (die 2026-lys kan verskil).
- **Gaping:** 14 / 10 op die finale persentasie; teen die letterkunde-punt van 38% is dit 22 punte.
- **Tyd:** 770 generiese minute; **die app het geen letterkunde-inhoud nie** (eksplisiete gaping).
- **911:** kies die 2 afdelings wat hy die beste ken en oefen net kontekstuele vrae daarop (meeste L1–L2: aanhaal,
  waar/onwaar met rede, kort verduideliking). **Uitspraak:** onwaarskynlik sonder inhoud.

### 2.10 Afrikaans HT V2 (letterkunde), Vr 20 Nov
DBE Nov 2025: 80 punte, 2½ u; 5 vrae: 2 gesiene gedigte (10 elk, 4 opsies), **ongesiene gedig verpligtend (10)**,
roman 25 (opsies: *Onderwêreld*, *Manaka Plek van die Horings*, *Vatmaar*, *Die kwart-voor-sewe-lelie*), drama 25
(*Krismis van Map Jacobs*, *Mis*); een opstelvraag en een kontekstuele vraag oor roman/drama.
**Hanno moet bevestig watter roman, drama en gedigte die skool doen.**
- **Gaping:** 17. **Tyd:** 720 generiese minute; geen letterkunde-inhoud nie.
- **911:** die ongesiene gedig (10) is suiwer tegniek (beeldspraak, toon, struktuur); kies kontekstuele vrae oor
  die opstelvraag waar daar keuse is. **Uitspraak:** onwaarskynlik sonder inhoud; moontlik met bevestigde werke.

---

## 3. Topregstellings vir Di 20 Okt (Afrikaans V3), die volgende 2 dae

| # | Wat | Verwagte wins | Moeite | Eienaar |
|---|---|---|---|---|
| R1 | Pas migrasie 004 toe (`docs/MIGRASIE-004.md`), sodat geparkeerde pogings en punte afgelewer word | 0 direk; maak alles meetbaar | 2 min | **Hanno** |
| R2 | 19 Okt 08:00: vervang "opstel weer (100 min)" met 'n **keuse-en-beplan-boor** op die Nov 2025 V3 (Pa druk dit): 15 min lees al 8 + 6 opsies, kies 1 + 2, breinkaart vir al drie; dan **een B-teks getimed (40 min)**; dan opstel-inleiding + een paragraaf + slot (40 min). Elke stuk bly eksamenvlak, maar kort | +3 tot +6 (keuse en beplanning) | Claude 1 u in `schedule.js` 19 Okt + toets; Hanno keur goed | Claude + **Hanno** |
| R3 | Kies vas: **3 transaksionele tipes** wat hy sal skryf (voorstel: informele brief, formele brief/e-pos, verslag). 19 Okt se formaat-blok net daarvoor, plus een reël elk oor die 4 tipes wat nie in die bank is nie (e-pos, notule/agenda, huldeblyk, onderhoud) | +3 tot +5 (formaat sit in die 15-punt-kategorie, 2×) | in dieselfde blok | Claude (teks) |
| R4 | **Pa merk een stuk** met die rubriek (B5 van 18 Okt of die 19 Okt-teks); nie selfnasien nie | +2 tot +4 (realistiese terugvoer) | 20 min | **Hanno** |
| R5 | Eksamendag-tydkaart in die 20 Okt 07:15-blok: 09:00–09:15 kies en beplan alles; A klaar teen ±10:40; B1 teen ±11:20; B2 teen ±12:00. **Laat nooit 'n afdeling oop nie:** 'n halwe teks kry punte, 'n leë kry 0 | tot +25 risiko vermy | 10 min (`schedule.js` detail) | Claude |
| R6 | Pa sit by hom vir 18 Okt se B5 (40 min) en sien dat hy dit op papier klaarmaak; papier-minute word ingetik | maak 1 eksamenvlak-stuk seker | 60 min | **Hanno** |

Hou op met: nóg 'n volle 100-min-opstel op 18/19 Okt, voorbeeldantwoorde passief lees, nuwe lesse, laat aande.

---

## 4. Wat vir die res bygebou moet word (eksamenvolgorde)

Beginsel vir die 911 met min tyd: **amptelike DBE-vraestelle en memo's per vraag/afdeling, getimed, op papier**
(soort `skrif` of `toets` met `werk`). Dit is goedkoper en vinniger as nuwe vraebanke (wat QC nodig het), en dit
is presies eksamenvlak. Hanno moet die papiere kry (per vak minstens Nov 2025, Jun 2025, Nov 2024 + memo's).

| # | Wat (lêer/spesifikasie) | Vir | Verwagte wins | Moeite | Hanno besluit? |
|---|---|---|---|---|---|
| B1 | **Generiese rotasie eksamen-bewus** (`schedule.js` `buildDayPlan`): laat 'n vak val sodra sy laaste vraestel geskryf is (`WALLIE.nextExam(dag, slug)`), gee meer minute aan die vak met die naaste eksamen, en skep 'n ligte eksamendag. Herwin ±91 uur | 5–10 | groot, indirek | Claude 2–3 u + volle `test:skoon` | ja (rotasie-reël) |
| B2 | **Vaste plan 26 Okt-middag en 27 Okt**: Engels V1 afdeling C (40) + opsomming, met die regte Nov 2025 V1-vraestel (Hanno laai af; die cache-lêer is 'n memo) | 4 | +5 tot +8 | Claude 1 u; Hanno: vraestel | ja |
| B3 | **RTT V2-plan 27–29 Okt** (vaste blokke): Nov 2025 V2 afdeling A (25 min), B per vraag, C een scenario; kaart "RTT-teorie: 4 reëls" (een punt per feit, nie meer antwoorde as gevra nie, geen vae vergelykings nie, geen handelsname nie). Plus: `lesson-ui.js` `eksamenKlaar` ook vir `rtt`-V1-items, en `GAPING.rtt` = V2 | 5 | +10 tot +15 | Claude 2 u | ja (vraestelkeuse) |
| B4 | **Toerisme 28 + 30 Okt-oggend** vaste blokke: afdeling A (40) getimed + valuta (B) + kaart "2 desimale, toon berekening" | 6 | beskerm 60%; +3 tot +5 | Claude 45 min | nee |
| B5 | **Gasvryheid 31 Okt–5 Nov** vaste plan per afdeling (C 80 en D 60 eerste, A 40 as daaglikse retrieval). Regstel `data/dbe-spesifikasie/gasvryheid.json`: afdelings A40/B20/C80/D60 ontbreek | 7 | +15 tot +25 (v. jaar 45) | Claude 2 u; Hanno: 2 ou vraestelle | ja |
| B6 | **Afrikaans V1 1–10 Nov** (vervleg met Gasvryheid): opsomming-kaart + getimede opsomming (30 min) + afdeling C (40 min) per ou vraestel; begrip een keer. `GAPING.afrikaans` byvoeg. Spesifikasie vir HT V1 (70: 30/10/30) skep | 8 | +8 tot +12 | Claude 2 u | nee |
| B7 | **Letterkunde 7–19 Nov** (Engels V2 + Afrikaans V2): eers bevestig Hanno die werke; dan kontekstuele vrae uit ou V2-vraestelle op net daardie werke + kaart "ongesiene gedig" (10 punte) | 9, 10 | +8 tot +15 elk | Claude 3 u ná Hanno se lys | **ja (werke)** |
| B8 | **Eksamentegniek-kaarte** (`lessons.js`, een per vraestel-tipe): Wisk. Gel. CA-punte en eenhede; Afrikaans V3 tydkaart/keuse; RTT-teorie 4 reëls; Toerisme valuta; opsomming; ongesiene gedig; letterkunde-keuse | almal | +2 tot +5 elk | Claude 30 min elk | nee |
| B9 | **Spesifikasies regstel/aanvul:** `toerisme.json` (afdeling E 30 ontbreek; A–D tel net 170), `gasvryheid.json` (B5), nuwe vir Engels V1 (80: 30/10/40), Afrikaans V1/V2, RTT V2 (25/75/50). DBE-cache: Afrikaans V3-memo is Mei/Junie 2025, Engels V2-vraestel is Mei/Junie 2025, Engels V1-vraestel ontbreek | almal | korrektheid | Claude 1 u; Hanno: aflaai | nee |
| B10 | **Fading vir skryfwerk** (later, nie voor 20 Okt): "voltooi die voorbeeld"-stap tussen voorbeeldantwoord en volle item (`vraebank-v3`) | 9, 10 | klein | Claude 2 u | ja |
| B11 | **Wisk. Gel.-papiere:** die plan 16–24 Okt vra 4 V1- en 1 V2-vraestel. Lys hulle in `dbe-vraestelle.js` (`werk`) sodat die sessie dit kan oopmaak | 2, 3 | maak die plan uitvoerbaar | Claude 1 u; Hanno: papiere | ja |

---

## 5. Kognitiewe en visuele beste praktyk: waar staan die app

| Beginsel | Sterk | Swak |
|---|---|---|
| Retrieval practice | toe-boek op elke les; memo-hek ná die werk; getimede DBE-items | lesse is agtergrond, nie hooftaak nie (korrek), maar ná 26 Okt is daar geen hooftaak nie |
| Spacing | kaart "Spasieer"; foutlog-blok daagliks | geen skeduleerder wat foute weer aanbied nie; foutlog is papier en onsigbaar |
| Interleaving | Wisk. Gel. vrae gemeng binne 'n vraestel; Nov-2025-teenoor-Jun-papiere vir RTT V1 | ná 26 Okt staan elke vak in 'n vaste blok elke dag (geblok, nie vervleg nie) |
| Worked examples → fading | V3-items het voorbeeldantwoord + verduideliking | geen tussenstap: voorbeeld → volle 100-min-taak (vermy-drempel) |
| Terugvoer | rubriek per kriterium; memo eers ná die tyd | selfnasien by 'n swak skrywer is onbetroubaar; punte word nie gesinkroniseer nie (migrasie 004) |
| Kognitiewe las (PR #31, K1–K13) | fokusmodus, hooftaak eerste, taai klok, leesmaat, kontras reggestel | 100-min-blokke vir iemand wat "moeg" is; 405-min generiese dae |
| Toestel | papier-eerste ontwerp pas by 'n stadige laptop | iPhone kon nie oopmaak nie; die app moet net klok en log wees, die werk op papier |

**Die "911"-metode (toe-boek → memo → foutlog → spasieer) is wetenskaplik reg.** Die bottelnek is aanvang en volume,
nie die metode nie. Die hoogste opbrengs per uur vir die oorblywende tyd: **kort (25–40 min), eksamenvlak,
op papier, met Pa wat die begin sien en een stuk nasien.** Wallie se eie terugvoer ("te lang sessies") wys dieselfde kant toe.

---

## 6. Lesse uit die twee geskrewe vraestelle

| Les | Bron | Toepassing |
|---|---|---|
| Die oortjie-slot sluit praktiese werk binne 1 min | RTT 12 Okt proef: 3 waarskuwings, slot, sessie onderbreek | alle oorblywende vraestelle is papier: soort `skrif` |
| Blokke word in 'n klomp gemerk sonder 'n sessie | 12 Okt (6 in 8 s), 14 Okt (7 in 25 s) | "klaar" sonder papier-minute of punte = geen poging; vra 'n getal |
| Engels V3-voorbereiding was 6–11 min per blok en 1 min beplanning | `live` 14 Okt | die Afrikaans V3-plan het dieselfde vorm en kry dieselfde gedrag: verkort (R2) |
| Geen terugskou van Engels V3 of RTT V1 nie | geen gebeurtenis 13/15 Okt | Pa vra Wallie mondeling: wat het gekom, wat was moeilik; skryf dit in vir Afrikaans V3 |
