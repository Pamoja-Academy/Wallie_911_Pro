# Wallie_911_Pro — Ontwerp-spesifikasie

> **Status:** Voltooi met Pa-diskresie (27 Sep 2026 nag). **Môre-oggend-hek:** Hersien hierdie spes vóór verdere bou as jy wysigings wil hê.  
> **Taal:** Afrikaans (UI, kopie, sessie-instruksies).  
> **Benadering:** #2 Reddingscockpit (goedgekeur).

---

## 1. Produkdoel & sukses

**Wallie_911_Pro** is ’n Afrikaanse reddingscockpit vir Graad 12 NSC-finale (begin **12 Oktober 2026**, ~16 dae vanaf 27 Sep). Dit is nie ’n motiverings-app of volle LMS nie — dit is ’n eksamen-reddingstelsel wat vermydingsgedrag breek deur **hard sessie-observeering**, en punte maksimeer deur beproefde leerwetenskap + eksamentegniek.

| Rol | Toestel | Funksie |
|-----|---------|---------|
| Wallie (primêr) | Skootrekenaar | Daaglikse missies, hard-proctor sessies, vraestel-werkvloei |
| Pa (sekondêr) | Foon / enige | Lewendige status, waarskuwings, dag-opsomming; fisies naby vir hard checks |

### Meetbare sukses

1. Elke vak ≥ **60%** op die finale (reddings-dolfwit).
2. Wiskundige Geletterdheid ≥ **80%**; Engels ≥ **70%**.
3. ≥ **90%** van beplande daaglikse sessies (6–7u) voltooi onder observeerder-modus.
4. Elke swak area het foutlog + hertoets tot selfstandig korrek.
5. Pa sien binne **30s**: in sessie? watter vak? enige waarskuwing?

### Buite omvang (YAGNI vir 16 dae)

- Sosiale / gamification-afleidings  
- Volle video-wolkargief  
- Outomatiese gradeer van alle opstelle  
- Skool-admin-portaal  
- Foon as primêre hard-proctor toestel  

---

## 2. Bewysgebaseerde metodiek (kern)

### #1 duo (Dunlosky e.a., 2013 — *high utility*)

1. **Praktyktoetsing met terugvoer** — toe-boek probeer → memo → fout merk → hertoets.  
2. **Verspreide herhaling (spacing)** — dieselfde swak punt oor dae, nie een maraton nie.

### Reddings-aanpassings (16 dae, lui-geskiedenis)

| Beginsel | Hoe dit in die produk lyk |
|----------|---------------------------|
| Low-hanging fruit eers | Per vak: “maklike punte”-lys (rubriek/instruksies, definisies, kortvrae, memo-formaat) vóór diep begrip |
| Eksamentegniek > herlees | Elke sessie eindig met *eksamen-gedrag*: tyd, merkpunt-taal, lees-die-vraag |
| Geen “ek het gelees”-illusie | Observeerder + aktiewe produksie (blanko-bladsy / vrae) vereis |
| Foutlog is die leerplan | Volgende sessie prioritiseer oop foute (spasieer) |
| Ou vraestelle | Hibried: Pa/Wallie laai papers+memos; stelsel struktureer blokke |

### Daaglikse ritme (6–7 uur)

Voorbeeldblokke (aanpasbaar):

1. **Opwarm (20–30 min):** Wisk. Gelett. of Engels-taal (momentum + teikenvakke)  
2. **Rooi-sone (2× 70–90 min):** Gasvryheid / Afrikaans / RTT — hard-proctor  
3. **Geel-sone (60–90 min):** LO / Engels-letterkunde / Toerisme-tegniek  
4. **Groen-sone (45–60 min):** Wisk. Gelett. doelgerigte oefening na 80%  
5. **Slot (20 min):** Foutlog-hersiening + môre se top-3  

Tussen blokke: kort pouses; hard-proctor **stop** tydens pouses.

### Eksamenrooster

Amptelike datums nog nie beskikbaar nie → beplan met **tipiese NSC-volgorde**-plekhouer; datums later ingevoer sonder herontwerp.

---

## 3. Leerlingprofiel & vakstrategieë

**Bron:** K3/Prelim-rapport (23 Sep 2026) + handgeskrewe selfanalise.

| Vak | Prelim | Jaar | Teiken | Kernfout (selfanalise) | Reddingsfokus |
|-----|--------|------|--------|------------------------|---------------|
| Gasvryheidstudie | 27% | 45% | 60% | Inkram i.p.v. verstaan | Begrip-eers: konsep → toepassingvrae; nie memoriseer-lyste alleen |
| Afrikaans HT | 39% | 39% | 60% | Vermy vak; slegs eie notas | Low-hanging: taalstrukture, rubrieke, ou vrae; kort geforseerde sessies |
| RTT (CAT) | 37% | 46% | 60% | Glad nie geleer | Praktiese take-checklist + theory short-marks; “MOET DIE WERK INSIT” |
| LO | 49% | 77% | 60% | Antwoorde te breed | Scenario-gebaseerd; uitbrei volgens merkpunt-skemas |
| Engels FAL | 50% | 56% | 70% | Letterkunde 38% verwaarloos | Letterkunde + creative writing blokke; taal hou |
| Toerisme | 61% | 61% | 60%+ | Dom foute; klein hoofstukke | Vraag-lees protokol; klein-hoofstuk spoedboor |
| Wisk. Gelett. | 66% | 66% | 80% | Geen ekstra oefening | Daaglikse retrieval + gemengde/tydige vraestelle |

**Prioriteit-gewig (tot rooster kom):** Gasvryheid > Afrikaans > RTT > LO/Engels-lit > Toerisme-tegniek > Wisk.Gelett. (daagliks klein + teiken 80%).

---

## 4. Stelselargitektuur

### Tegnestapel (diskresie)

- **Next.js** (App Router) + **Turbopack** (dev/build)  
- **TypeScript**  
- **Lokale-eerste data:** IndexedDB / SQLite-via-local (sessies, foutlogs, paper-metadata)  
- **Pa-alerts:** minimale wolk of plaaslike LAN-push (sien §6) — **geen volle video in die wolk**  
- UI Afrikaans; CSS-veranderlikes; video-presence panel (nie dekoratiewe “AI purple”-tema)

### Kernmodules

| Module | Verantwoordelikheid |
|--------|---------------------|
| `MissieBord` | Dagplan 6–7u, vakblokke, voortgang |
| `ObserveerderSessie` | Hard-proctor: kamera, teenwoordigheid, aktiwiteitsseine, waarskuwings |
| `VraestelWerkvloei` | Oplaai PDF → blokke → probeer → memo → foutlog |
| `FoutBank` | Per-vak foute, spasieer-hertoets-waglys |
| `VakSporing` | Teikens, low-hanging checklists, tegniek-protokolle |
| `PaDashboard` | Lewendige status, waarskuwingsgeskiedenis, dag-opsomming |
| `Rooster` | Vak→datum (plekhouer tot amptelik) |

### Data-vloei (sessie)

```
MissieBord → Start blok → ObserveerderSessie (kamera AAN)
    → Aktiewe taak (vraestel / blanko / checklist)
    → Memo-check / selfmerk → FoutBank upsert
    → Sessie-einde → log + Pa-opsommingsein
```

---

## 5. Hard observeerder (vereiste C)

### Gedrag

- Sessie begin eers as kamera-toestemming + gesig/teenwoordigheid-baseline OK.  
- Tydens sessie: periodieke teenwoordigheidskontrole (bv. elke 10–20s ligte check; agresiewer as wegkyk).  
- **Waarskuwings:** geen gesig, tab weg, lang stilte, sessie verlaat.  
- Na N waarskuwings: sessie **geskors** tot Pa-onsluitkode / Pa-bevestiging.  
- Alle gebeure in **sessielog** (tydstempel, tipe, vak, duur).

### Privaatheid (diskresie = hibried)

| Data | Waar |
|------|------|
| Lewendige video / raam-samples | **Plaaslik** (browser geheue / plaaslike skyf) — nie wolk-video-argief |
| Sessie-metadata, waarskuwings, duur, vak | Plaaslik + opsionele Pa-sink vir status |
| Pa-foon | Status “IN SESSIE / WAARSKUWING / KLAAR” + kort teks — nie volle video-stream as verstek |

Wallie is minderjarig / jong volwassene — Pa stem in tot hard-proctor; UI verduidelik kamera-gebruik duidelik.

### “Soos afstand-eksamen”

Doel is **gedragsgelykheid** aan remote invigilation (teenwoordigheid + aktiwiteitslog), nie ’n derdeparty-proctoring-lisensie nie. Geen eis om kommersiële proctor-SDK in MVP.

---

## 6. Hibried inhoud

1. Pa/Wallie laai **vraestel + memo** (PDF) per vak.  
2. Stelsel skep **werksessies**: bv. “Vraag 1–3, 25 min, toe-boek”.  
3. Na poging: memo-oorsig → merk foute → FoutBank.  
4. Gate: gerigte “low-hanging” / tegniek-kaarte (nie volle kurrikulum-herskryf).  

Bronmap (bestaande):  
`C:\Users\User\OneDrive\Documents\Kinders\Wallie Matriekeindeksamen\`  
(rapport PDF + selfanalise-fotos — verwys, nie verplig om in git te commit nie).

---

## 7. Pa-kontrole

- Lewendige “hartklop” terwyl sessie hard-proctor.  
- Waarskuwinglys met tyd.  
- Dag-einde: ure per vak, voltooiings%, top foute, môre se plan.  
- Onsluitkode vir geskorste sessies.  
- Pa is fisies naby → app ondersteun; vervang nie ouerskap nie.

---

## 8. Foute, randgevalle, toetsing

| Geval | Gedrag |
|-------|--------|
| Kamera weier | Sessie mag nie begin (hard-modus) |
| Netwerk af | Kernstudie werk plaaslik; Pa-alerts wag / LAN |
| PDF oplaai misluk | Duidelike fout; handmatige taaktitel steeds moontlik |
| Uitbranding | Dagplan mag “rooi dag” verkort met Pa-goedkeuring |
| Rooster opdateer | Herprioritiseer MissieBord outomaties |

### Toetsing (MVP)

- Eenheid: FoutBank spasieer-logika, waarskuwingdrempels.  
- Handmatig: volle hard-sessie 25 min + Pa-dashboard.  
- Geen e2e-theater vóór kernvloei werk.

---

## 9. Implementasievolgorde (hoë vlak)

1. Projekskil + MissieBord (statiese 16-dae + vakteikens)  
2. ObserveerderSessie (kamera + logs + waarskuwings)  
3. FoutBank + PaDashboard  
4. VraestelWerkvloei (PDF oplaai + sessieblokke)  
5. Per-vak low-hanging checklists / tegniekkaarte  
6. Rooster-invoer + herprioritisering  

---

## 10. Besluite met diskresie (vir môre-hersiening)

| Onderwerp | Keuse |
|-----------|-------|
| Produkbenadering | #2 Reddingscockpit |
| Observeerder | Hard (C) |
| Toestel | Skootrekenaar |
| Inhoud | Hibried oplaai (C) |
| Ure/dag | 6–7 |
| Rooster | Tipiese NSC-plekhouer (B) |
| Privaatheid | Hibried — geen volle video in wolk |
| Stack | Next.js + Turbopack + TS + lokale-eerste |

---

## 11. Self-review (spes)

- Geen TBD-plekhouers vir kernvereistes.  
- Konsekwent: hard-proctor + hibried privaatheid + hibried inhoud.  
- Omvang klein genoeg vir een implementasieplan.  
- Ambigwiteit opgelos: “remote observeerder” = gedragsnabootsing, nie kommersiële proctor-SDK.
