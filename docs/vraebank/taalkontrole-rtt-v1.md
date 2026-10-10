# Taalkontrole RTT V1-vraebank (chunk B2, 2026-10-10)

Omvang: al 30 items in `data/vraebank-rtt-v1.json`, net die velde `vraag`, `antwoord`, `verduideliking` en `nasienriglyn[].kriterium`. Inhoud, memo, punte, `bron` en `toets` is nie verander nie. Elke regstelling hou die betekenis presies dieselfde.

## 1. Regstellings

| item | bevinding | regstelling |
|---|---|---|
| S02 | Lomp sinsbou: "COUNT of SUM tel of tel op sonder 'n voorwaarde" | "COUNT tel en SUM tel op sonder enige voorwaarde" |
| S03 | G5: "kaartjieverkope" (onnodige samestelling) | "die verkope van kaartjies" |
| S04 | Dubbelsinnig: "gelyk waar is" | "gelyktydig waar is" |
| S06 | Dubbelsinnig: "die van van die afrigter" | "die afrigter se van" |
| S06 | Terminologie: "ry-indeksnommer" vir VLOOKUP se derde argument (dit is 'n kolom, en S07 sê "kolomnommer") | "kolomnommer" in verduideliking en nasienriglyn ("Kolomnommer: 3") |
| S06 | Anglisisme "afkopieer" ('copy down'); G5 "dollartekens" | "die absolute selverwysings (met $) is net nodig as jy die formule na ander selle kopieer" |
| S06 | G5: "werkbladnaam" | "die naam van die werkblad en die uitroepteken" |
| S08 | Anglisisme "afkopieer"; "dollartekens" | "Die absolute selverwysings (met $) is opsioneel, maar handig as jy die formule na ander selle kopieer" |
| S08 | Onduidelik: "dan kry 16:00 presies die verkeerde kategorie" | "dan kry 'n besoek om presies 16:00 die verkeerde kategorie" |
| S09 | G5: "groepbesoeke" (twyfel oor die verbindingsvorm) | "besoeke deur groepe" |
| S10 | G5: "reeksgetal" (nuutskepping) | "'n lang getal soos 46095 (die datum soos die sigblad dit stoor)" |
| W02 | Spelling: "uitgeleg" | "uitgelê" |
| W03 | G5: "Dokumenteienskappe" | "Die eienskappe van 'n dokument" |
| W04 | Woordorde: "Voeg 'n kruisverwysing … in op die teks …" | "Voeg by die teks 'See Prices' 'n kruisverwysing ('cross-reference') in wat …" |
| W04 | G5: "Veldkode" (antwoord en verduideliking) | "'Field code' (Alt+F9)" en "die kode van die veld ('field code')" |
| W05 | G5: "afdelingsbreuk"; DBE gebruik "seksiebreuk" | "seksiebreuk" (5×); "afdeling ('section')" → "seksie ('section')" (3×, ook in die antwoord) |
| W06 | Onduidelike opdrag ("Soek en vervang slegs elke keer wat … voorkom met die … styl"); "heel woord" | "Gebruik 'Find and Replace' om die 'Sport Char'-styl toe te pas op slegs elke plek waar die presiese woord 'netball' (net kleinletters, as 'n hele woord) voorkom." |
| W07 | G5: "bladsyopskrif" (nie DBE nie); vir eenvormigheid ook "bladsyonderskrif" | 'header' / 'footer' tussen aanhalingstekens, met "(bo-aan elke bladsy)" / "(onder aan die bladsy)" by die eerste keer (vraag, antwoord, verduideliking, nasienriglyn) |
| W07 | "regs-belyn"/"links-belyn" teenoor "regs in lyn" in die vraag | "regs in lyn" / "links in lyn" |
| W08 | Dubbelsinnig: "oortjies ('tabs')". Elders beteken "oortjie" 'n lintoortjie | "met 'Tab'-karakters geskei" |
| W08 | "4 die onderstreep" (selfstandige naamwoord ontbreek) | "4 'n soliede lyn" |
| D05 | Anglisisme "'n poging is aangewend"; G5 "lidkode"; "staan tans as" | "Iemand het reeds probeer om 'n kode vir elke lid te skep, maar die berekende veld lees tans net `Expr1: Left([Surname])`." |
| D06 | G5: "interhuis-atletiek" | "by die atletiek tussen die skool se huise" |
| H01 | Kaal kode in lopende teks: title=, alt= | `` `title=` ``, `` `alt=` `` |
| H02 | Terminologie: "sluitmerker"; DBE gebruik "sluitingsmerker" | "sluitingsmerker" (2×) |
| H02 | G5: "Kleurname" | "Die name van kleure, soos 'silver', …" |
| H02 | Kaal kode: width=, size= | `` `width=` ``, `` `size=` `` |
| H03 | "sluitmerker(s)" | "oop- en sluitingsmerker" (verduideliking), "(oop- en sluitingsmerkers)" (nasienriglyn) |
| H04 | Kaal `rowspan`; "oopmerker" (nie DBE nie); "sluitmerker" | "`rowspan` op die verkeerde sel sit, net <ol> bo-aan verander en die sluitingsmerker </ol> laat staan"; "(oop- en sluitingsmerker)" |
| A01 | G5: "hoekhakies" | "getikte << en >> is net gewone teks" |
| A01 | G5: "samevoegveld"; DBE gebruik "saamvoegvelde ('merge fields')" | "saamvoegveld" (verduideliking en nasienriglyn) |
| A02 | G5: "organiseringskomitee" | "in die komitee wat die 2027-matriekafskeid reël, kan dien" |

Totaal: 33 bevindings, 50 teksvervangings.

**Nie verander nie (buite omvang):** `toets.handmatig` van W04 ("veldkode") en W07 ("bladsyopskrif") bevat nog die ou woorde. Die opdrag verbied wysigings aan `toets`, en G5 kontroleer nie `toets` (of `antwoord`) nie. Dis interne nasienkontroles, nie leerderteks nie.

## 2. G5-vlae

Rede (a) = kom in die DBE-Afrikaanse korpus voor; (b) = reëlmatige samestelling volgens AWS 2017 uit standaardwoorde.

| woord | besluit | rede |
|---|---|---|
| heelgetalle | ALLOW | (a) "heelgetal" in DBE (Junie 2025); (b) heel+getal, reëlmatige meervoud |
| kaartjieverkope | FIX | onnodige samestelling → "verkope van kaartjies" |
| rugbydag | ALLOW | (b) rugby+dag (soos sportdag) |
| wetenskapsfees | ALLOW | (b) wetenskap+s+fees, korrekte verbindings-s (vgl. wetenskapsonderwys) |
| afkopieer | FIX | anglisisme ('copy down') → "na ander selle kopieer" |
| dollartekens | FIX | DBE sê "absolute selverwysing" → "absolute selverwysings (met $)" |
| indeksnommer | FIX | val weg saam met ry-indeksnommer |
| kolomnommer | ALLOW | (a) DBE-memo ("Kolomnommer: 2") |
| opskrifry | ALLOW | (a) 1 treffer volgens g5-vlae; (b) opskrif+ry |
| ry-indeksnommer | FIX | sakelik verwarrend (dis 'n kolom); vervang deur "kolomnommer" vir eenvormigheid met S07 |
| sportspanne | ALLOW | (b) sport+spanne |
| werkbladnaam | FIX | → "die naam van die werkblad" |
| produkkode | ALLOW | (b) produk+kode |
| produkkodes | ALLOW | (b) produk+kodes |
| geneste | ALLOW | (a) 9 treffers ("geneste IF-funksie") |
| groepbesoeke | FIX | twyfel oor verbindingsvorm (groep-/groeps-) → "besoeke deur groepe" |
| bespreekkode | ALLOW | (b) bespreek+kode |
| reeksgetal | FIX | nuutskepping vir Excel se 'serial number' → omskrywing |
| voetslaanroete | ALLOW | (b) voetslaan+roete, gangbare woord |
| bladsybreuk | ALLOW | (a) DBE-memo ("geforseerde bladsybreuk") |
| uitgeleg | FIX | spelfout → "uitgelê" |
| dokumenteienskappe | FIX | → "die eienskappe van 'n dokument" |
| veldkode | FIX | nie in DBE nie → 'field code' / "die kode van die veld" |
| sportverslag | ALLOW | (b) sport+verslag (dokumentnaam "Sportverslag") |
| afdelingsbreuk | FIX | DBE gebruik "seksiebreuk" |
| bladsyoriëntasie | ALLOW | (a) 2 treffers (DBE "bladsyoriëntasie"/"bladsyorientasie") |
| merkblokkies | ALLOW | (a) DBE "merkblokkie" (4 bladsye) |
| bladsyopskrif | FIX | nie in DBE nie → 'header' |
| aankomstye | ALLOW | (b) aankoms+tye (aankomstyd is 'n standaardwoord) |
| tabelstoppe | ALLOW | (a) 3 treffers |
| lidkode | FIX | twyfel (lid-/lede-) → "'n kode vir elke lid" |
| interhuis-atletiek | FIX | → "die atletiek tussen die skool se huise" |
| kleurname | FIX | → "die name van kleure" |
| sluitmerker | FIX | DBE gebruik "sluitingsmerker" |
| debatsklub | ALLOW | (b) debat+s+klub (vgl. debatsvereniging) |
| sluitmerkers | FIX | DBE gebruik "sluitingsmerkers" |
| oopmerker | FIX | nie in DBE nie; herskryf sonder die woord |
| rowspan | FIX | Engelse kodeterm nou in backticks |
| samevoegveld | FIX | DBE gebruik "saamvoegvelde" → "saamvoegveld" |
| databron | ALLOW | (a) 6 treffers |
| herinneringsbrief | ALLOW | (b) herinnering+s+brief |
| hoekhakies | FIX | → "<< en >>" |
| organiseringskomitee | FIX | → "die komitee wat … reël" |

Nuwe woorde wat die regstellings inbring en ook op die allow-lys is: **seksiebreuk** (a: DBE-memo "seksiebreuk"), **sluitingsmerker** en **sluitingsmerkers** (a: DBE-memo's, 11 bladsye), **saamvoegveld** (a: DBE "saamvoegvelde"; b: saamvoeg+veld).

Telling: 23 FIX en 20 ALLOW uit die 43 woorde in die g5-lys, plus 4 nuwe ALLOW-woorde. Dit gee 24 woorde in `af_allow.txt` onder `# B2 taalkontrole 2026-10-10`.

## 3. Terminologie (eenvormig in al 30 items)

| begrip | term |
|---|---|
| VLOOKUP se 1ste argument | opsoekwaarde |
| VLOOKUP se 2de argument | tabelreeks |
| VLOOKUP se 3de argument | kolomnommer |
| FALSE / TRUE as 4de argument | presiese passing / benaderde passing |
| SUMIF/COUNTIF-reekse | kriteriareeks, optelreeks; kriterium (mv. kriteria) |
| $A$2 | absolute selverwysing (met $) |
| 'copy down' | na ander selle kopieer |
| IF binne IF | geneste IF-funksie |
| uitkoms van IF | uitset; laaste geval: 'vang alles' |
| sheet | werkblad; naam van die werkblad |
| select | kies |
| cursor | wyser ("Plaas die wyser …") |
| ribbon tab | oortjie (bv. oortjie 'Line and Page Breaks') |
| tab-karakter | 'Tab'-karakter |
| tab stop / alignment / leader | tabelstop / inlynstelling / vuller ('Leader') |
| page break / section / section break | bladsybreuk / seksie / seksiebreuk |
| header / footer | 'header' / 'footer' |
| field code | 'field code' / kode van die veld |
| check box | merkblokkie |
| mail merge / merge field / data source | possamevoeging / saamvoegveld / databron |
| query / calculated field / field | navraag / berekende veld / veld |
| wildcard | sterretjie ('wildcard') |
| HTML tag / closing tag | merker / sluitingsmerker; albei saam: "oop- en sluitingsmerker" ("oopmerker" word nie alleen gebruik nie) |
| HTML attribute | attribuut; kodename in backticks (`cellpadding`, `rowspan`, `size`) |
| ordered / unordered list | geordende lys (<ol>) / ongeordende lys (<ul>) |
