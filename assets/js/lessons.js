/* Visuele lesse — een konsep per skerm: prent → 2–4 leidrade → toe-boek → memo.
 * Prente: assets/img/lessons/<vak>/<id>.svg (gebou deur scripts/build-lesson-art.js).
 */
window.WALLIE = window.WALLIE || {};

WALLIE.LESSON_IMG = "assets/img/lessons/";

WALLIE.LESSONS = {
  gasvryheid: {
    kort: "Gasvryheid",
    concepts: [
      {
        id: "gevaarsone",
        titel: "Temperatuur-gevaarsone",
        cues: [
          "5–60 °C = gevaarsone: bakterieë groei vinnig",
          "Yskas 0–5 °C · vrieskas −18 °C",
          "Gaarmaak / herverhit tot kern 75 °C",
          "Maks. 2 uur in die gevaarsone"
        ],
        toeBoek: "Teken die termometer uit jou kop. Merk 4 temperature en sê wat by elkeen gebeur.",
        memo: [
          "Gevaarsone: 5 °C tot 60 °C (party handboeke sê 4 °C — volg joune).",
          "Yskas 0–5 °C; vrieskas −18 °C of kouer.",
          "Warm hou bo 60 °C; gaarmaak/herverhit tot kern 75 °C.",
          "Kos nie langer as 2 uur in die gevaarsone nie."
        ]
      },
      {
        id: "haccp",
        titel: "HACCP — 7 beginsels",
        cues: [
          "HACCP = stelsel om voedselgevare te voorkom",
          "Gevaar → Punt → Limiet → Meet",
          "→ Regmaak → Toets → Skryf",
          "Kritieke beheerpunt = waar jy die gevaar keer"
        ],
        toeBoek: "Skryf die 7 HACCP-beginsels in volgorde neer. Gee by elkeen 3–4 woorde verduideliking.",
        memo: [
          "1 Gevaar-analise · 2 Kritieke beheerpunte (KBP) · 3 Kritieke limiete",
          "4 Monitor · 5 Regstel-aksie · 6 Verifieer · 7 Rekordhouding",
          "Voorbeeld KBP: gaarmaak — limiet kern 75 °C — meet met termometer."
        ]
      },
      {
        id: "koste",
        titel: "Van resep tot verkoopprys",
        cues: [
          "Totale koste ÷ porsies = koste per porsie",
          "+ wins-% (opmerking) → verkoopprys",
          "+ BTW 15% → maal met 1,15",
          "Voedselkoste-% = koste ÷ prys × 100"
        ],
        toeBoek: "Bestanddele kos R180 vir 6 porsies. Opmerking 120%. Bereken die verkoopprys met BTW.",
        memo: [
          "R180 ÷ 6 = R30 per porsie.",
          "Wins 120% van R30 = R36 → R30 + R36 = R66.",
          "Met BTW: R66 × 1,15 = R75,90.",
          "Lees altyd: vra hulle wins-% of voedselkoste-%?"
        ]
      },
      {
        id: "tafel",
        titel: "Formele tafeldekking",
        cues: [
          "Vurke links · messe regs, lem na die bord",
          "Werk van BUITE na BINNE",
          "Nagereg-lepel & -vurk bo die bord",
          "Glase bo die hoofmes · kleinbord links"
        ],
        toeBoek: "Teken ’n formele tafeldekking (bo-aansig) vir sop, hoofgereg en nagereg. Benoem elke item.",
        memo: [
          "Soplepel heel buite regs; messe regs met lem na bord.",
          "Vurke links; buitenste stel = eerste gang.",
          "Nagereg-lepel (handvatsel regs) en -vurk (handvatsel links) bo die bord.",
          "Kleinbord + bottermes links; glase regs bo die hoofmes."
        ]
      }
    ]
  },

  afrikaans: {
    kort: "Afrikaans",
    concepts: [
      {
        id: "opdragwoorde",
        titel: "Opdragwoorde",
        cues: [
          "Noem = net die feit",
          "Verduidelik = feit + omdat",
          "Bespreek = meer as een kant",
          "Punte in hakies = aantal feite"
        ],
        toeBoek: "Skryf die 6 opdragwoorde neer en wat elkeen van jou vra — sonder om te kyk.",
        memo: [
          "Noem/Lys: net die feit · Verduidelik: hoe/waarom (omdat).",
          "Bespreek: meer as een kant · Motiveer: rede/bewys uit teks.",
          "Vergelyk: ooreenkoms én verskil · Haal aan: presiese woorde in aanhalingstekens.",
          "(2) beteken 2 aparte feite."
        ]
      },
      {
        id: "indirekte-rede",
        titel: "Direkte → indirekte rede",
        cues: [
          "Voeg ‘dat’ in; werkwoord skuif na die einde",
          "ek → hy/sy · ons → hulle",
          "is → was · sal → sou · kan → kon",
          "hier → daar · môre → die volgende dag"
        ],
        toeBoek: "Skakel om: Ma het gesê: “Ek kan nie vandag hier wag nie.”",
        memo: [
          "Ma het gesê dat sy nie daardie dag daar kon wag nie.",
          "ek → sy · kan → kon · vandag → daardie dag · hier → daar.",
          "‘dat’ stuur die werkwoord na die einde."
        ]
      },
      {
        id: "lydende-vorm",
        titel: "Bedrywend → lydend",
        cues: [
          "Voorwerp skuif vorentoe",
          "word (nou) · is (verlede) · sal … word (toekoms)",
          "deur + die doener",
          "werkwoord kry ge-"
        ],
        toeBoek: "Skryf in die lydende vorm: “Die skeidsregter het die speler gewaarsku.”",
        memo: [
          "Die speler is deur die skeidsregter gewaarsku.",
          "Verlede tyd → ‘is … ge-ww’ (‘gewaarsku’ hou sy ge-).",
          "Moenie ‘het … geword’ skryf nie."
        ]
      },
      {
        id: "formele-brief",
        titel: "Formele brief — uitleg",
        cues: [
          "Jou adres + datum bo regs",
          "Ontvanger links · Geagte …",
          "Onderwerp vet of onderstreep",
          "Die uwe + handtekening + naam"
        ],
        toeBoek: "Teken die raam van ’n formele brief en benoem die 7 dele in volgorde.",
        memo: [
          "Afsender se adres → datum → ontvanger se titel en adres.",
          "Aanhef (Geagte …) → onderwerpreël (vet/onderstreep).",
          "Inleiding → liggaam → slot → ‘Die uwe’ → handtekening → naam.",
          "Formele taal: ‘u’, geen sms-taal. Volg jou skool se uitleg."
        ]
      },
      /* ---- 8 Nov (LL-25): Afrikaans V1 "slim spotting". Die reëls is algemene Afrikaanse grammatika en die DBE-memo
         se opsomming-nasienriglyn (7 jaar dieselfde); die oefensinne is eie sinne, nie DBE-vrae nie. ---- */
      {
        id: "v1-spotting",
        titel: "V1: slim spotting — vang al die maklike punte",
        cues: [
          "Lees eers AL die vrae (5 min); merk M (maklik), T (taalreël), S (swaar)",
          "M: haal aan · EEN woord · kies 'n letter (net nommer + letter) · waar/onwaar + bewys",
          "T ná M: lydend, ontkenning, indirek, bysin, stam, homoniem — elke jaar",
          "S laaste: standpunt + bewys + effek · TWEE = twee aparte punte · Tyd: A 50 · B 30 · C 40 min"
        ],
        toeBoek: "Merk M, T of S: (1) \"Skryf die sin in die lydende vorm.\" (2) \"Evalueer die geslaagdheid van die raampie. Motiveer met TWEE feite.\" (3) \"Skryf slegs die vraagnommer en die letter neer.\" (4) \"Haal EEN woord aan wat …\"",
        memo: [
          "(1) T: taalreël, 1 punt, seker as jy die reël ken.",
          "(2) S: standpunt + twee aparte bewyse uit die raampie.",
          "(3) M: net bv. \"5.5 B\". Geen sin nie.",
          "(4) M: presies EEN woord uit die teks, in aanhalingstekens."
        ]
      },
      {
        id: "sinsveranderinge",
        titel: "Sinsveranderinge wat elke jaar kom",
        cues: [
          "Lydend: voorwerp vorentoe + word (nou) / is (verlede) + deur …; ge- by die ww, maar nie by be-, ver-, her-, ont- nie (voorberei). Geen voorwerp? Daar word … (Daar word sleg geslaap.)",
          "Ontkenning: dubbele nie; iemand → niemand, iets → niks, altyd → nooit",
          "Indirekte rede: dat + ww agter; ek → hy/sy; ná \"het gesê\" (verlede): is → was, kan → kon, sal → sou; hier → daar, vandag → daardie dag, gister → die vorige dag, môre → die volgende dag; vraag → of",
          "Bysinne (ww agter): byvoeglik (wat/wie: beskryf 'n naamwoord) · bywoordelik (omdat, toe, as: rede/tyd/voorwaarde) · naamwoordelik (dat, of) · want/en/maar: woordorde bly"
        ],
        toeBoek: "(1) \"Die kok het die kos voorberei.\" → lydend. (2) Ma het gesê: \"Ek was gister moeg.\" → indirek. (3) \"Iemand het gebel.\" → ontkennend. (4) Benoem die bysin: \"Ek bly tuis omdat ek siek is.\"",
        memo: [
          "(1) Die kos is deur die kok voorberei. (voorberei kry nie ge- nie)",
          "(2) Ma het gesê dat sy die vorige dag moeg was.",
          "(3) Niemand het gebel nie.",
          "(4) \"omdat ek siek is\" = bywoordelike bysin (rede)."
        ]
      },
      {
        id: "woordvorming-spelling",
        titel: "Woordvorming, klanke en spelling",
        cues: [
          "Stam: haal voor- en agtervoegsels af (on-vriend-e-lik → vriend) · samestelling = stam + stam · afleiding = stam + voor-/agtervoegsel",
          "Teenwoordige deelwoord: stam + -end(e): spelend, golf → golwend (f → w) · intensief: yskoud, doodmoeg",
          "Lettergrepe: een klinkerklank per greep (ge-sond-heid) · tweeklank: ei, y, ui, ou, eu (klein, ys, huis, koud, neus)",
          "Deelteken (ë, ï) wys 'n nuwe lettergreep: geëet, opvlieënd · pleonasme = onnodige herhaling (eerste debuut)"
        ],
        toeBoek: "(1) Stam van \"onvriendelik\"? (2) Teenwoordige deelwoord van \"speel\" in 'n sin. (3) Intensiewe vorm van \"koud\". (4) Verdeel \"gesondheid\" in lettergrepe.",
        memo: [
          "(1) vriend",
          "(2) Die spelende kinders lag hard.",
          "(3) yskoud",
          "(4) ge-sond-heid"
        ]
      },
      {
        id: "betekenis",
        titel: "Betekenis: homoniem, sinoniem, idioom, gevoelswaarde",
        cues: [
          "Homoniem: selfde woord, ander betekenis (bank) · sinoniem = selfde · antoniem = teenoorgesteld",
          "Verklarende sin: die sin moet die betekenis bewys",
          "Neutraal: woedend → kwaad · denotasie = woordeboek · konnotasie = gevoel",
          "Idioom: ken die vaste vorm én die betekenis"
        ],
        toeBoek: "(1) Gebruik die homoniem van \"bank\" (geldinstelling) in 'n verklarende sin. (2) 'n Neutrale woord vir \"woedend\". (3) Wat beteken \"die kat in die donker knyp\"?",
        memo: [
          "(1) Ek het my geld by die bank gedeponeer.",
          "(2) kwaad",
          "(3) Om skelm of agteraf dinge te doen."
        ]
      },
      {
        id: "swaar-formule",
        titel: "Spoedkursus: die swaar vrae (Motiveer, evalueer, ironie)",
        cues: [
          "Formule: standpunt + bewys (woord, reël, raampie) + effek op die leser",
          "TWEE feite = twee aparte bewyse · Evalueer = ja/nee + rede uit die teks",
          "Ironie = die teenoorgestelde van wat verwag word · geïmpliseer = bedoel, nie gesê nie",
          "Visueel: lyftaal, gesig, lettergrootte, vetdruk, kleur, uitroeptekens → emosie"
        ],
        toeBoek: "Is die woord \"BUFFELSTERK\" in 'n advertensie effektief? Motiveer met TWEE feite. Skryf dit met die formule.",
        memo: [
          "Standpunt: Ja.",
          "Feit 1: Die hoofletters trek dadelik die oog, sodat die leser die woord raaksien.",
          "Feit 2: 'n Buffel laat aan krag dink, dus glo die leser die produk is baie sterk.",
          "Net 'n standpunt sonder bewys kry gewoonlik geen punt nie."
        ]
      },
      {
        id: "opsomming-v1",
        titel: "Opsomming: 7 feite + 3 taalpunte",
        cues: [
          "10 punte = 7 feite (1 elk) + 3 taalpunte",
          "Eie woorde, volsinne, EEN paragraaf, ≤ 90 woorde; skryf die woordgetal",
          "Aanhalings kos taalpunte (6–7 aanhalings = 0 vir taal); geen titel nie",
          "Metode: onderstreep 7 feite → 1 sin per feit → tel die woorde"
        ],
        toeBoek: "Skryf die 5 stappe van jou opsomming-metode en die 3 reëls wat taalpunte kos, uit die kop neer.",
        memo: [
          "Stappe: lees die vraag (watter 7?) → onderstreep 7 feite → skryf elk in eie woorde → een paragraaf → tel en skryf die getal.",
          "Taalpunte weg: aanhalings, puntsgewys i.p.v. 'n paragraaf, nie volsinne nie.",
          "Meer as 90 woorde: hou by 7 kort sinne van ±12 woorde."
        ]
      },
      {
        id: "leesbegrip-spotting",
        titel: "Leesbegrip (30 punte): slim spotting",
        cues: [
          "Lees eers die vrae, dan die teks; onderstreep die reëls of paragrawe wat die vraag noem",
          "Haal aan / EEN woord / waar of onwaar + bewys: die antwoord staan in die teks, kopieer presies",
          "Verduidelik / Waarom: eie woorde, volsinne, soveel feite as punte (2 punte = 2 feite)",
          "Stylfiguur: noem + effek (vergelyking: soos · metafoor: direk, sonder soos · personifikasie: mens-eienskap · hiperbool: oordrywing)"
        ],
        toeBoek: "Wat doen jy by: (1) \"Haal EEN woord aan wat …\" (2) \"Waarom … ? (2)\" (3) \"Waar of onwaar? Haal 'n frase aan om jou antwoord te staaf.\" (4) \"Benoem die stylfiguur en verduidelik die effek.\"",
        memo: [
          "(1) Een woord presies uit die teks, in aanhalingstekens.",
          "(2) Twee aparte feite in eie woorde, in volsinne.",
          "(3) Waar of Onwaar + die presiese frase uit die teks.",
          "(4) Noem die stylfiguur + wat dit by die leser doen."
        ]
      },
      {
        id: "gedig-v2",
        titel: "Afrikaans V2: 'n gesiene gedig in 4 stappe",
        cues: [
          "Tema: waaroor gaan die gedig? Een sin, in jou eie woorde",
          "Toon en stemming: een woord (bv. bitter, nostalgies) + die woorde in die gedig wat dit wys",
          "Stylfigure: noem dit + die EFFEK (vergelyking, metafoor, personifikasie, herhaling, kontras)",
          "Bou: titel, strofes, enjambement, rym of die slotreël: wat doen dit met die betekenis?"
        ],
        toeBoek: "Kies een van jou gesiene gedigte. Skryf uit die kop:\n1) Die tema in een volsin.\n2) Die toon, met twee woorde uit die gedig as bewys.\n3) Twee stylfigure, elk met naam, aanhaling en effek.\n4) Die funksie van die titel.\n5) Wat gebeur in die slotreël of slotstrofe, en waarom is dit belangrik?",
        memo: [
          "1) Tema: 'n volsin oor die gedig se boodskap, nie 'n opsomming van wat gebeur nie.",
          "2) Toon: een woord (bv. bitter, nostalgies) + aanhaling (\"…\") as bewys.",
          "3) Naam + aanhaling + effek. Sonder die effek kry jy gewoonlik net die helfte van die punte.",
          "4) Titel: wat dit letterlik sê + hoe dit by die tema aansluit.",
          "5) Slot: wys hoe dit die tema opsom, omkeer of afsluit.",
          "Kyk in jou aantekeninge na wat jy gemis het en lees net daardie deel weer."
        ]
      },
      {
        id: "letterkunde-v2",
        titel: "Afrikaans V2: roman en drama (opstel of kontekstueel)",
        cues: [
          "Ken vir elke werk: hoofkarakters (een eienskap + toneel), konflik, keerpunte, einde, temas",
          "Kontekstueel: lees die uittreksel, plaas dit (wat gebeur net voor en net ná?), antwoord in volsinne",
          "Opstel (400-450 woorde): inleiding met jou standpunt → 3-4 paragrawe met voorbeelde uit die werk → slot",
          "Een werk 'n opstel, die ander kontekstueel: kies die werk wat jy die beste ken vir die opstel"
        ],
        toeBoek: "Kies Onderwêreld of Krismis van Map Jacobs. Noem uit die kop: twee hoofkarakters met een eienskap elk, die grootste konflik, en twee temas.",
        memo: [
          "Elke eienskap het 'n toneel uit die werk as bewys nodig, anders is dit net 'n mening.",
          "Konflik: wie of wat staan teenoor mekaar, en hoe eindig dit?",
          "Tema: 'n volsin oor wat die werk oor die lewe sê, nie net een woord nie.",
          "Wat jy nie kon onthou nie: lees dit nou in jou aantekeninge."
        ]
      },
      {
        id: "gedig-vraagtipes",
        titel: "Afrikaans V2: vraagtipes by 'n gesiene gedig (volpunte)",
        cues: [
          "Haal aan: EEN woord of frase, presies soos in die gedig, tussen aanhalingstekens",
          "Stylfiguur: benoem + aanhaling + effek in HIERDIE gedig",
          "Waar/onwaar of meerkeuse: antwoord + rede of aanhaling",
          "Bespreek of stem jy saam: standpunt + punte uit die gedig (punte = aantal feite)"
        ],
        toeBoek: "Kies 'n ANDER gesiene gedig as gister. Skryf uit die kop:\n1) Wat is die tema? (1)\n2) Haal EEN woord aan wat die toon wys, en benoem die toon. (2)\n3) Benoem 'n stylfiguur in die eerste strofe en verduidelik die effek. (2)\n4) Wat is die effek van die enjambement of die rym in die gedig? (2)\n5) Hoe verskil die eerste en die laaste strofe, en wat sê dit oor die tema? (2)\n6) Stem jy saam met die spreker se siening? Motiveer. (2)",
        memo: [
          "1) Tema: 'n volsin oor die boodskap.",
          "2) Een woord tussen aanhalingstekens + die toon (bv. bitter, nostalgies). Meer as een woord = 0.",
          "3) Naam + aanhaling + effek. Sonder die effek: net die helfte.",
          "4) Enjambement: die sin loop oor na die volgende reël; dit beklemtoon die woord aan die begin van die nuwe reël of wys beweging. Rym: bind reëls saam en beklemtoon die rymwoorde.",
          "5) Noem wat in die eerste en die laaste strofe gebeur, en hoe die verandering die tema wys.",
          "6) Standpunt + rede uit die gedig. \"Ja, want dit is mooi\" = 0.",
          "Wat jy nie geweet het nie: lees daardie gedig se aantekeninge weer."
        ]
      },
      {
        id: "onderwereld-v2",
        titel: "Afrikaans V2: Onderwêreld uit jou aantekeninge",
        cues: [
          "Hoofkarakter: drie eienskappe, elk met 'n gebeurtenis as bewys",
          "Konflik: wie teen wie of wat, en hoe dit eindig",
          "Keerpunte: die drie gebeure wat alles verander",
          "Temas en titel: volsinne oor wat die werk oor die lewe sê"
        ],
        toeBoek: "Maak jou aantekeninge oor Onderwêreld toe. Skryf:\n1) Die hoofkarakter: drie eienskappe, elk met 'n gebeurtenis as bewys.\n2) Twee ander karakters en hul verhouding met die hoofkarakter.\n3) Die hoofkonflik en hoe dit opgelos word.\n4) Drie keerpunte in volgorde.\n5) Twee temas in volsinne.\n6) Die betekenis van die titel.",
        memo: [
          "1) Elke eienskap het 'n gebeurtenis nodig, anders is dit net 'n mening.",
          "2) Verhouding: hoe hulle teenoor mekaar optree en of dit verander.",
          "3) Albei kante van die konflik + die uitkoms.",
          "4) 'n Keerpunt verander die rigting van die verhaal; dit is nie net enige gebeurtenis nie.",
          "5) Tema: 'n volsin, nie een woord nie.",
          "6) Titel: letterlik + simbolies (wat is die \"onderwêreld\" in die verhaal?).",
          "Maak nou jou aantekeninge oop: lees net die dele wat jy gemis het."
        ]
      },
      {
        id: "krismis-v2",
        titel: "Afrikaans V2: Krismis van Map Jacobs uit jou aantekeninge",
        cues: [
          "Plaas die uittreksel: wie praat, met wie, waar, wat het net gebeur?",
          "Kaaps: wat die taal sê oor die karakters en hul wêreld",
          "Dramatiese ironie: wat weet die gehoor wat die karakter nie weet nie?",
          "Volsinne; punte = aantal feite"
        ],
        toeBoek: "Maak jou aantekeninge toe. Skryf:\n1) Wie is Map Jacobs, en wat is sy grootste probleem?\n2) Waar speel die drama af, en waarom is die tyd (Kersfees) belangrik?\n3) Twee ander karakters en hul verhouding met Map.\n4) Die hoofkonflik en hoe die drama eindig.\n5) Waarom skryf Adam Small in Kaaps? Gee een rede.\n6) Twee temas in volsinne.",
        memo: [
          "Kyk elke antwoord na in jou aantekeninge. Volpunte vra 'n gebeurtenis of aanhaling as bewys.",
          "2) Plek + tyd + die kontras tussen wat Kersfees moet wees (vrede, familie) en wat in die drama gebeur.",
          "3) Verhouding: hoe hulle teenoor Map optree en of dit verander.",
          "4) Albei kante van die konflik + die einde.",
          "5) Kaaps is die egte taal van die gemeenskap: dit maak die karakters eg en gee hulle waardigheid.",
          "6) Tema: 'n volsin oor wat die drama oor die lewe sê.",
          "Wat jy nie kon onthou nie: lees nou daardie toneel in jou aantekeninge."
        ]
      },
      {
        id: "letterkunde-opstel",
        titel: "Afrikaans V2: Pa vra, jy verduidelik + die opstel (400-450 woorde)",
        cues: [
          "Inleiding: jou standpunt oor die stelling in een sin",
          "3-4 paragrawe: elk een punt + 'n voorbeeld uit die werk + hoe dit jou standpunt bewys",
          "Slot: jou standpunt weer, in ander woorde",
          "Kies vir die opstel die werk wat jy die beste ken"
        ],
        toeBoek: "Pa vra (geen aantekeninge):\n1) Vertel Onderwêreld in een minuut.\n2) Vertel Krismis van Map Jacobs in een minuut.\n3) Wie is die hoofkarakter in elk, en hoe verander hy of sy?\n4) Noem een tema van elke werk.\n5) Kies die werk vir jou opstel. Sê jou inleidingsin hardop vir die stelling: \"Die hoofkarakter is self verantwoordelik vir wat met hom of haar gebeur.\"\n6) Noem jou drie paragraafpunte, elk met 'n voorbeeld.",
        memo: [
          "Pa: 'n volle antwoord noem 'n gebeurtenis of aanhaling, nie net 'n gevoel nie.",
          "3) Hoe die karakter aan die begin en aan die einde is + wat die verandering veroorsaak.",
          "4) 'n Volsin per werk.",
          "5) Inleiding: stem saam, stem nie saam nie of gedeeltelik, in een sin.",
          "6) Elke punt: een gebeurtenis + een sin oor hoe dit die standpunt bewys.",
          "Opstel: 400-450 woorde, ±4-5 paragrawe."
        ]
      }
    ]
  },

  rtt: {
    kort: "RTT",
    concepts: [
      {
        id: "sigblad-funksies",
        titel: "Sigblad-funksies wat altyd kom",
        cues: [
          "IF(toets, waar, vals)",
          "SUM · AVERAGE · MAX/MIN · COUNT",
          "COUNTIF / SUMIF = tel/som AS …",
          "ROUND(getal, 2) · VLOOKUP soek in ’n tabel"
        ],
        toeBoek: "Skryf ’n formule vir D2: as C2 meer as 1000 is, wys “Bonus”, anders “Geen”. Skryf ook ’n COUNTIF wat ‘Slaag’ in C2:C30 tel.",
        memo: [
          '=IF(C2>1000,"Bonus","Geen")',
          '=COUNTIF(C2:C30,"Slaag")',
          "Kommas of kommapunte (;) hang af van die rekenaar se streekinstellings."
        ]
      },
      {
        id: "absolute-verwysing",
        titel: "Absolute verwysing ($)",
        cues: [
          "Relatief (B2) skuif saam as jy kopieer",
          "Absoluut ($E$1) bly vas",
          "F4 sit die $ in",
          "$A1 = kolom vas · A$1 = ry vas"
        ],
        toeBoek: "C2 bevat =B2*$E$1. Wat staan in C5 as jy dit afsleep? Hoekom?",
        memo: [
          "C5: =B5*$E$1",
          "B2 is relatief en skuif na B5; $E$1 is absoluut en bly vas.",
          "Gebruik $ vir ’n vaste waarde soos BTW of ’n koers."
        ]
      },
      {
        id: "databasis",
        titel: "Databasis: veld, rekord, sleutels",
        cues: [
          "Veld = kolom · rekord = ry",
          "Primêre sleutel: uniek vir elke rekord",
          "Vreemde sleutel koppel na ’n ander tabel",
          "Een-tot-baie verhouding"
        ],
        toeBoek: "Verduidelik in jou eie woorde: veld, rekord, primêre sleutel, vreemde sleutel. Gee by elkeen ’n voorbeeld.",
        memo: [
          "Veld: een kategorie data (kolom), bv. Naam.",
          "Rekord: alle data oor een item (ry), bv. een leerder.",
          "Primêre sleutel: uniek, bv. LeerderID.",
          "Vreemde sleutel: veld wat na ’n ander tabel se primêre sleutel wys."
        ]
      },
      {
        id: "netwerke",
        titel: "PAN · LAN · WAN",
        cues: [
          "PAN: persoonlik, Bluetooth ± 10 m",
          "LAN: een gebou; WLAN = Wi-Fi",
          "WAN: stede/lande; Internet = grootste WAN",
          "Voordele: deel lêers, drukkers, internet"
        ],
        toeBoek: "Rangskik PAN, LAN, WAN van klein na groot en gee by elkeen ’n voorbeeld. Noem 2 voordele van ’n netwerk.",
        memo: [
          "PAN (foon + oorfone) < LAN (skool/huis) < WAN (Internet).",
          "Voordele: hulpbronne deel (drukker, internet), lêers deel, sentrale rugsteun.",
          "WLAN = draadlose LAN."
        ]
      }
    ]
  },

  engels: {
    kort: "Engels",
    concepts: [
      {
        id: "peel",
        titel: "PEEL paragraph",
        cues: [
          "Point: answer in 1 sentence",
          "Evidence: quote in “ ”",
          "Explain: HOW the quote proves it",
          "Link: back to the question"
        ],
        toeBoek: "Pick one character from your set work. Write a 4-sentence PEEL paragraph about one of their traits.",
        memo: [
          "P: state the trait. E: a short quote with quotation marks.",
          "E: explain what the words show (tone, image, action).",
          "L: link back to the question’s key word.",
          "Check: did you quote? Did you explain, not just retell?"
        ]
      },
      {
        id: "stylfigure",
        titel: "Figures of speech",
        cues: [
          "Simile: like / as",
          "Metaphor: says it IS",
          "Personification: human action",
          "Always add the EFFECT"
        ],
        toeBoek: "Name the figure of speech and its effect: “The classroom was a zoo.”",
        memo: [
          "Metaphor: the classroom is called a zoo, not ‘like’ one.",
          "Effect: shows it was noisy, wild and out of control.",
          "Name + explain = full marks."
        ]
      },
      {
        id: "opstel-plan",
        titel: "5-minute essay plan",
        cues: [
          "Min 1: pick type + topic",
          "Min 2–3: mind-map 6 ideas",
          "Min 4: order them · Min 5: hook line",
          "Intro → 3 body paragraphs → end"
        ],
        toeBoek: "Topic: “The day everything changed.” Do the 5-minute plan on paper now.",
        memo: [
          "Type chosen (narrative / descriptive / argumentative).",
          "6 ideas → best 3 numbered for the body paragraphs.",
          "A hook first line (question, sound, or short dramatic sentence).",
          "The ending links back to the opening."
        ]
      },
      {
        id: "reported-speech",
        titel: "Reported speech",
        cues: [
          "One tense back: am/is → was, will → would",
          "can → could · did → had done",
          "today → that day · tomorrow → the next day",
          "Pronouns change: I → he/she"
        ],
        toeBoek: "Change to reported speech: Tom said, “I will finish it tomorrow.”",
        memo: [
          "Tom said (that) he would finish it the next day.",
          "I → he · will → would · tomorrow → the next day."
        ]
      },
      /* 18 Nov (Wallie: "hou op om vir my vraestelle te gee"; Macbeth-inhoud is sy swak punt): inhoud, nie vraestelle nie. */
      {
        id: "macbeth-bedryf-1-2",
        titel: "Macbeth: Acts 1–2 (the prophecy and the murder)",
        cues: [
          "Act 1: the witches: Thane of Cawdor, then king; Banquo’s sons will be kings. Duncan makes Macbeth Cawdor",
          "Act 1: Lady Macbeth (“unsex me here”) mocks his doubts (“We will proceed no further”) and plans the murder",
          "Act 2: the dagger speech; Macbeth kills Duncan; Lady Macbeth smears the sleeping guards with blood",
          "Act 2: Macduff finds the body; Macbeth kills the guards; Malcolm and Donalbain flee; Macbeth is crowned"
        ],
        toeBoek: "Close your notes. Write:\n1) The story of Acts 1 and 2 in 5 sentences.\n2) Who says “Fair is foul, and foul is fair”, and what does it warn us about?\n3) What do the witches predict for Macbeth (three things) and for Banquo?\n4) Why does Macbeth hesitate to kill Duncan (Act 1 Scene 7)? Give three reasons.\n5) What does Macbeth see just before the murder, and what does it show about his mind?\n6) What does Lady Macbeth do right after the murder, and why does she have to do it?",
        memo: [
          "1) Witches’ prophecy → Cawdor comes true → Lady Macbeth pushes → Duncan murdered in his sleep → Macbeth becomes king.",
          "2) The witches (Act 1 Scene 1): things are not what they seem. This is the theme of appearance and reality.",
          "3) Macbeth: Thane of Glamis, Thane of Cawdor, king. Banquo: his sons will be kings (“lesser than Macbeth, and greater”).",
          "4) Duncan is his king, his relative and his guest; Duncan is a good king; his only reason is “vaulting ambition”.",
          "5) A dagger (“Is this a dagger which I see before me”): his mind is full of guilt and fear before he even acts.",
          "6) She takes the daggers back and smears the guards with blood: Macbeth is too shocked to go back. She is in control.",
          "What you missed: read only that part of your notes again."
        ]
      },
      {
        id: "macbeth-bedryf-3-5",
        titel: "Macbeth: Acts 3–5 (tyrant and downfall)",
        cues: [
          "Act 3: Macbeth has Banquo murdered; Fleance escapes; Banquo’s ghost appears at the banquet",
          "Act 4: the apparitions: beware Macduff · none of woman born can harm you · safe until Birnam Wood comes",
          "Act 4: Macduff’s wife and children are killed; in England, Malcolm tests Macduff’s loyalty",
          "Act 5: Lady Macbeth sleepwalks and dies; Birnam branches move; Macduff (“untimely ripped”) kills Macbeth"
        ],
        toeBoek: "Close your notes. Write:\n1) How does each of the three apparitions come true in Act 5?\n2) Why does Macbeth have Banquo killed, and what goes wrong?\n3) What happens at the banquet, and what does Lady Macbeth tell the guests?\n4) Why does Malcolm test Macduff in England?\n5) “Tomorrow, and tomorrow, and tomorrow”: how does Macbeth feel about life when he hears his wife is dead?",
        memo: [
          "1) Beware Macduff: Macduff kills Macbeth. None of woman born: Macduff was “untimely ripped” (caesarean). Birnam Wood: Malcolm’s soldiers carry its branches to Dunsinane.",
          "2) The witches said Banquo’s sons would be kings, and Banquo suspects him. Fleance escapes, so the prophecy can still come true.",
          "3) Banquo’s ghost sits in Macbeth’s seat; only Macbeth sees it. Lady Macbeth says he has had this illness since youth and sends the guests away.",
          "4) To see whether Macduff is Macbeth’s spy. Malcolm pretends to be evil; Macduff’s grief for Scotland proves he is loyal.",
          "5) Life is empty and meaningless (“a tale told by an idiot … signifying nothing”). He feels numb, almost nothing.",
          "What you missed: read only that part of your notes again."
        ]
      },
      {
        id: "macbeth-karakters",
        titel: "Macbeth: the characters (trait + proof)",
        cues: [
          "Macbeth: brave soldier → ambitious murderer → cold tyrant (“I am in blood stepped in so far”)",
          "Lady Macbeth: strong and ruthless at first → guilt, sleepwalking, death",
          "Banquo: hears the same prophecy but does NOT act on it (a foil to Macbeth)",
          "Macduff: loyal to Scotland, loses his family, takes revenge · Duncan: a good, trusting king"
        ],
        toeBoek: "Close your notes. Write:\n1) How do Macbeth and Lady Macbeth change from Act 1 to Act 5? Give one example of each.\n2) Give two traits of Banquo, each with proof from the play.\n3) Why is Banquo called a foil to Macbeth?\n4) How does Macduff react when he hears his family has been killed (Act 4 Scene 3)?\n5) Who becomes king at the end, and why is that important?",
        memo: [
          "1) They swap places: in Act 1 she is strong and he doubts; in Act 5 he is cold and she breaks down. Macbeth: “We will proceed no further” → kills Macduff’s family. Lady Macbeth: “unsex me here” → sleepwalks, washing her hands.",
          "2) Loyal/honest: he does not act on the prophecy. Wise/suspicious: he warns that the witches tell small truths to betray us, and “I fear thou play’dst most foully for’t”.",
          "3) Same prophecy, different choice: Banquo stays loyal, Macbeth murders.",
          "4) Deep grief (“All my pretty ones?”). Malcolm says take it like a man; Macduff: “I must also feel it as a man”. His grief becomes revenge.",
          "5) Malcolm, Duncan’s son: the rightful king returns and order is restored in Scotland.",
          "What you missed: read only that part of your notes again."
        ]
      },
      {
        id: "macbeth-temas",
        titel: "Macbeth: themes and how the questions ask",
        cues: [
          "Ambition: unchecked ambition destroys Macbeth and Scotland · fate vs free will: Macbeth CHOOSES to kill",
          "Appearance vs reality: “look like th’ innocent flower, but be the serpent under’t”",
          "Guilt: blood and sleeplessness (“Macbeth does murder sleep”)",
          "Questions: context · tone + a word as proof · dramatic irony · Do you agree? = opinion + reason"
        ],
        toeBoek: "Close your notes. Write:\n1) Explain the dramatic irony when Duncan arrives at Inverness and says the castle has a pleasant seat.\n2) Which theme does “Fair is foul, and foul is fair” introduce? Give another example of it from the play.\n3) Is Macbeth a victim of fate or of his own choices? Give one reason.\n4) Name two images linked to guilt in the play.\n5) Which character is a contrast to Macbeth’s ambition, and how?",
        memo: [
          "1) Dramatic irony: the audience knows what the character does not. Duncan thinks he is safe and welcome; we know the Macbeths plan to kill him there that night.",
          "2) Appearance vs reality. E.g. “look like th’ innocent flower, but be the serpent under’t”; Macbeth is friendly to Banquo while planning his murder.",
          "3) Strongest answer: his own choices. The witches only predict; he decides to kill Duncan, Banquo and Macduff’s family. (Fate also counts if you give a reason.)",
          "4) Blood (hands, daggers, “Out, damned spot!”) and sleeplessness (“Macbeth does murder sleep”, the sleepwalking). Darkness also counts.",
          "5) Banquo: hears the same prophecy but does not act on it. (Macduff: loyal to Scotland, also counts.)",
          "What you missed: read only that part of your notes again."
        ]
      },
      {
        id: "macbeth-pa-vra",
        titel: "Pa asks, you explain: Macbeth quotes",
        cues: [
          "Place the quote: who says it, to whom, when (Act/Scene)",
          "Explain what it means in your own words",
          "Say what it shows: a character trait or a theme",
          "No notes: Pa reads the question, you answer out loud"
        ],
        toeBoek: "Pa reads each quote; you say who, where and what it shows (no notes):\n1) “Look like th’ innocent flower, but be the serpent under’t.”\n2) “When you durst do it, then you were a man.”\n3) “Will all great Neptune’s ocean wash this blood clean from my hand?”\n4) “A little water clears us of this deed.” What is ironic about it later?\n5) “Out, damned spot! Out, I say!”\n6) “I am in blood stepped in so far that, should I wade no more, returning were as tedious as go o’er.”\n7) “Macbeth does murder sleep.”\n8) Do you feel sympathy for Macbeth at the end? Give your view and one reason.",
        memo: [
          "Pa: a mark only if he says WHO and WHEN and WHAT IT SHOWS.",
          "1) Lady Macbeth to Macbeth (Act 1 Scene 5): look welcoming to Duncan but be deadly. Appearance vs reality.",
          "2) Lady Macbeth (Act 1 Scene 7): she attacks his manhood to push him to the murder. She manipulates him.",
          "3) Macbeth after the murder (Act 2 Scene 2): the blood is his guilt; nothing can wash it away.",
          "4) Lady Macbeth (Act 2 Scene 2). Ironic: in Act 5 she sleepwalks and cannot wash the imagined blood off. Guilt destroys her.",
          "5) Lady Macbeth sleepwalking (Act 5 Scene 1), watched by the doctor and gentlewoman: her guilt has broken her.",
          "6) Macbeth after the banquet (Act 3 Scene 4): he has gone so far in murder that he will keep killing. He is becoming a tyrant.",
          "7) The voice Macbeth hears after killing Duncan (Act 2 Scene 2): he killed an innocent sleeping man and will lose his peace. Guilt.",
          "8) Either view counts with a reason from the play (e.g. yes: manipulated, regret in “Tomorrow” speech; no: he chose to kill again and again, even children)."
        ]
      },
      {
        id: "macbeth-dbe-e",
        titel: "Macbeth Q3: how it is marked + DBE Nov 2023 Extract E",
        cues: [
          "No marks for Yes/No or True/False: only the reason counts",
          "Figure of speech: name + 'In the same way that … so does …'",
          "Irony: what is said AND what really happens (both parts)",
          "Discuss (3): three points from the whole play"
        ],
        toeBoek: "HOW THE DBE MARKS IT (from the memos):\n• Yes/No, True/False, I agree: 0 marks. Only the REASON earns marks.\n• Figure of speech (1+2): name it; then 'In the same way that … so does …' + link to the extract.\n• Irony (2): what is said/expected AND what really happens. Both parts, or 0.\n• Tone (1+1): one word, then WHY the character uses it here.\n• Time and place (2): WHERE + WHEN (what is happening at that moment).\n• Character (2): one adjective + proof from the extract.\n• Discuss / your view (3): three WELL-SUBSTANTIATED points from the WHOLE text (weak reasons: only 1-2 marks).\n• A wrong first answer counts, even if the second one is right: write ONE answer.\n\nDBE NOV 2023 · EXTRACT E (Act 1 Scene 6) [Duncan, his sons and noblemen are travelling.]\nBANQUO: This guest of summer, / The temple-haunting martlet, does approve / By his loved masonry that the heaven's breath / Smells wooingly here. No jutty, frieze, / Buttress, nor coign of vantage, but this bird / Hath made his pendent bed and procreant cradle; / Where they most breed and haunt, I have observed / The air is delicate.\nEnter Lady Macbeth.\nDUNCAN: See, see, our honoured hostess! / The love that follows us sometimes is our trouble, / Which still we thank as love. Herein I teach you / How you shall bid God 'ild us for your pains, / And thank us for your trouble.\nLADY M: All our service / In every point twice done, and then done double, / Were poor and single business to contend / Against those honours deep and broad wherewith / Your majesty loads our house; for those of old, / And the late dignities heaped up to them, / We rest your hermits.\nDUNCAN: Where's the Thane of Cawdor? / We coursed him at the heels, and had a purpose / To be his purveyor; but he rides well, / And his great love, sharp as his spur, hath holp him / To his home before us. Fair and noble hostess, / We are your guest to-night.\nLADY M: Your servants ever / Have theirs, themselves, and what is theirs, in compt, / To make their audit at your highness' pleasure, / Still to return your own.\n\nWrite your answers (±20 min), then open the memo:\n3.1.1 Match: (a) Duncan (b) Donalbain (c) Banquo (d) Lennox with A nobleman of Scotland · B attendant to Macbeth · C son of Duncan · D an army general · E king of Scotland (4)\n3.1.2 Describe the time and place where this extract is set. (2)\n3.1.3 'Where they most … air is delicate': (a) What tone would Banquo use? (1) (b) Why? (1)\n3.1.4 'And his great … home before us': (a) Identify the figure of speech. (1) (b) Explain why it is relevant in this extract. (2)\n3.1.5 Explain the irony in Lady Macbeth's words, 'and what is … return your own'. (2)\n3.1.6 What does this extract reveal about Duncan's character? Substantiate. (2)\n3.1.7 Banquo is brave. Discuss your view. (3)",
        memo: [
          "3.1.1 (a) E ✓ (b) C ✓ (c) D ✓ (d) A ✓",
          "3.1.2 Macbeth's castle / Inverness ✓, when King Duncan arrives for a visit ✓.",
          "3.1.3 (a) Appreciation / awe / gentleness ✓ (b) He describes the beauty and pleasantness of the castle and nature ✓.",
          "3.1.4 (a) Simile ✓ (b) In the same way that a spurred horse moves faster ✓, Macbeth's love for his wife makes him hurry home ✓.",
          "3.1.5 She says everything they own belongs to Duncan, as proof of gratitude ✓, yet she plans to 'repay' him by murdering him ✓. BOTH parts, or 0.",
          "3.1.6 Gracious / polite / grateful ✓, he thanks Lady Macbeth for her hospitality ✓. (Or: humorous ✓, he jokes that they should thank him for the trouble ✓.)",
          "3.1.7 No mark for Yes/No. YES: he fights bravely beside Macbeth; he warns Macbeth not to trust the witches; he keeps distrusting them although they promised his sons the crown. NO: he suspects Macbeth but does nothing; he still accepts the banquet invitation; he does not protect Fleance properly. 3 points = 3 marks.",
          "Count your marks out of 18. Every answer you lost marks on: read the rule at the top again."
        ]
      },
      {
        id: "macbeth-dbe-f",
        titel: "Macbeth Q3: DBE Nov 2023 Extract F (Act 5 Scene 5)",
        cues: [
          "Place the extract: Dunsinane, Act 5, the English army is coming",
          "Multiple choice: write only the letter",
          "Director question: TWO actions (body, face, voice)",
          "Theme (3): three examples from the whole play"
        ],
        toeBoek: "DBE NOV 2023 · EXTRACT F (Act 5 Scene 5) [Macbeth is at Dunsinane castle.]\nMACBETH: I have almost forgot the taste of fears; / The time has been, my senses would have cooled / To hear a night-shriek, and my fell of hair / Would at a dismal treatise rouse and stir / As life were in't. I have supped full with horrors; / Direness, familiar to my slaughterous thoughts, / Cannot once start me.\nRe-enter Seyton.\nMACBETH: Wherefore was that cry?\nSEYTON: The Queen, my lord, is dead.\nMACBETH: She should have died hereafter; / There would have been a time for such a word. / Tomorrow, and tomorrow, and tomorrow, / Creeps in this petty pace from day to day, / To the last syllable of recorded time, / And all our yesterdays have lighted fools / The way to dusty death. Out, out, brief candle! / Life's but a walking shadow, a poor player / That struts and frets his hour upon the stage / And then is heard no more. It is a tale / Told by an idiot, full of sound and fury, / Signifying nothing.\nEnter a Messenger.\nMACBETH: Thou comest to use thy tongue; thy story quickly.\nMESS: Gracious my lord, / I should report that which I say I saw, / But know not how to do it.\nMACBETH: Well, say sir.\nMESS: As I did stand my watch upon the hill, / I looked toward Birnam, and anon, methought, / The wood began to move.\nMACBETH: Liar and slave!\n\nWrite your answers (±20 min), then open the memo:\n3.2.1 What are the 'slaughterous thoughts' to which Macbeth refers? (2)\n3.2.2 'The Queen, my lord, is dead.' (a) The cause of Lady Macbeth's death is … A insanity B suicide C insomnia D poisoning (1) (b) You are the director: what TWO actions must Seyton do when he says this line? (2)\n3.2.3 'She should have … such a word.' What do these lines tell us about Macbeth's state of mind? Substantiate. (2)\n3.2.4 What does Macbeth mean by 'a poor player … heard no more'? (2)\n3.2.5 Why do the messenger's words, 'As I did … began to move', anger Macbeth? (1)\n3.2.6 Why is this statement FALSE? Siward and Macduff lead the English army at Birnam Wood. (1)\n3.2.7 One of the themes in Macbeth is betrayal. Discuss this theme. (3)\n3.2.8 Macbeth is a victim of his own ambition. Discuss your view. (3)",
        memo: [
          "3.2.1 The brutal killings of Banquo ✓ and Macduff's family ✓ (or: all the people killed because of him).",
          "3.2.2 (a) B, suicide ✓ (b) Any two: lower his head; hand on his chest; look sad; speak in a low, sympathetic voice ✓✓.",
          "3.2.3 Indifferent / insensitive / cruel ✓: he must focus on the battle and does not feel the need to mourn her now ✓.",
          "3.2.4 Life is like an unimportant actor who appears briefly on stage ✓ and is quickly forgotten ✓.",
          "3.2.5 The witches' prophecy is coming true: Birnam Wood is coming to Dunsinane ✓.",
          "3.2.6 The English army at Birnam Wood is led by Siward and MALCOLM ✓.",
          "3.2.7 Macbeth betrays Duncan by killing him; the (first) Thane of Cawdor betrays Duncan by joining the rebels; the witches betray Macbeth with half-truths. 3 points.",
          "3.2.8 No mark for Yes/No. YES: the prophecies wake his ambition; he lets Lady Macbeth persuade him; his insecurity leads to a killing spree. NO: Malcolm named heir is the obstacle; he knows exactly what he is doing; he kills to prove his manhood to his wife. 3 points.",
          "Count your marks out of 17. Which question types cost you marks? Those are the ones to watch tomorrow."
        ]
      },
      {
        id: "kv-dbe-rejection",
        titel: "Short stories Q5: how it is marked + 'Rejection' (DBE Nov 2023)",
        cues: [
          "Q5 = TWO stories, both compulsory: ±37 min each in the exam",
          "Quote questions: copy exactly the number of words asked",
          "FALSE statement: give the correct fact (0 for just 'false')",
          "Discuss (3): three points from the WHOLE story"
        ],
        toeBoek: "HOW THE DBE MARKS IT (from the memos):\n• Yes/No, True/False, I agree: 0 marks. Only the REASON earns marks.\n• Figure of speech (1+2): name it; then 'In the same way that … so does …' + link to the extract.\n• Irony (2): what is said/expected AND what really happens. Both parts, or 0.\n• Tone (1+1): one word, then WHY the character uses it here.\n• Time and place (2): WHERE + WHEN (what is happening at that moment).\n• Character (2): one adjective + proof from the extract.\n• Discuss / your view (3): three WELL-SUBSTANTIATED points from the WHOLE text (weak reasons: only 1-2 marks).\n• A wrong first answer counts, even if the second one is right: write ONE answer.\n\n'REJECTION' by Mariama Bâ · DBE NOV 2023 · EXTRACT I [The narrator is confused.]\nThey entered laughing, deliberately sniffing the fragrant odour of incense that was floating on the air. I sat in front of them, laughing with them. The Imam attacked:\n'There is nothing one can do when Allah the almighty puts two people side by side.'\n'True, true,' said the other two in support.\nA pause. He took a breath and continued: 'There is nothing new in this world.'\n'True, true,' Tamsir and Mawdo chimed in again.\n'Some things we may find to be sad are much less so than others …'\nI followed the movement of the haughty lips that let fall these axioms, which can precede the announcement of either a happy event or an unhappy one. What was he leading up to with these preliminaries that rather announced a storm? So their visit was obviously planned.\nDoes one announce bad news dressed up like that in one's Sunday best? Or did they want to inspire confidence with their impeccable dress?\nI thought of the absent one. I asked with the cry of a hunted beast: 'Modou'?\nAnd the Imam, who had finally got hold of a leading thread, held tightly on to it. He went on quickly, as if the words were glowing embers in his mouth: 'Yes, Modou Fall, but, happily, he is alive for you, for all of us, thanks be to God.'\n\nWrite your answers (±20 min), then open the memo:\n5.1.1 Match: (a) Daba (b) Binetou (c) Modou (d) Imam with A marries his daughter's friend · B the Islamic spiritual leader · C Binetou's friend and confidant · D brother-in-law of the narrator · E forced into a marriage (4)\n5.1.2 Describe the time and place where this extract is set. (2)\n5.1.3 'There is nothing … in this world': what do these lines tell us about the Imam's state of mind? Substantiate. (2)\n5.1.4 'I asked with … a hunted beast': (a) Identify the figure of speech. (1) (b) Explain why it is relevant. (2)\n5.1.5 Why is this statement FALSE? The men in the extract come to have tea with the narrator. (1)\n5.1.6 One of the themes in 'Rejection' is betrayal. Discuss this theme. (3)\n5.1.7 The narrator can be admired for her strength of character. Discuss your view. (3)",
        memo: [
          "5.1.1 (a) C ✓ (b) E ✓ (c) A ✓ (d) B ✓",
          "5.1.2 The narrator's home ✓, after Modou's second marriage / when the visitors come to tell her about it ✓.",
          "5.1.3 Uncomfortable / uncertain ✓, because he has to break the news of Modou's second marriage to her ✓.",
          "5.1.4 (a) Metaphor ✓ (b) Just as a hunted animal cries out ✓, the narrator cries out when she realises something terrible has happened with Modou ✓.",
          "5.1.5 They come to tell her that her husband Modou has taken a second wife ✓.",
          "5.1.6 Modou betrays his wife and daughter by taking a second wife; Binetou betrays her friend Daba by marrying Modou; the narrator feels betrayed by Binetou, whom she treated like a mother. 3 points.",
          "5.1.7 No mark for Yes/No. YES: she accepts the news with dignity; she refuses Daba's push to divorce; she rejects Tamsir's proposal to stay independent. NO: after 25 years she should fight for her marriage; she missed the warning signs (Modou's diet, new suits); she blames herself. 3 points.",
          "Count your marks out of 18."
        ]
      },
      {
        id: "kv-dbe-eveline",
        titel: "Short stories Q5: 'Eveline' by James Joyce (DBE Nov 2023)",
        cues: [
          "Eveline: 19, works at the Stores, looks after her violent father's home",
          "Frank: a sailor who wants to take her to Buenos Ayres",
          "Her promise to her dying mother keeps her at home",
          "At the harbour she cannot go: she stays behind"
        ],
        toeBoek: "'EVELINE' by James Joyce · DBE NOV 2023 · EXTRACT J [Eveline reflects on her decision.]\nIn her home anyway she had shelter and food; she had those whom she had known all her life about her. Of course she had to work hard, both in the house and at business. What would they say of her in the Stores when they found out that she had run away with a fellow? Say she was a fool, perhaps; and her place would be filled up by advertisement. Miss Gavan would be glad. She had always had an edge on her, especially whenever there were people listening.\n– Miss Hill, don't you see these ladies are waiting?\n– Look lively, Miss Hill, please.\nShe would not cry many tears at leaving the Stores.\nBut in her new home, in a distant unknown country, it would not be like that. Then she would be married – she, Eveline. People would treat her with respect then. She would not be treated as her mother had been. Even now, though she was over nineteen, she sometimes felt herself in danger of her father's violence. She knew it was that that had given her the palpitations. When they were growing up he had never gone for her, like he used to go for Harry and Ernest, because she was a girl, but latterly he had begun to threaten her and say what he would do to her only for her dead mother's sake.\n\nWrite your answers (±20 min), then open the memo:\n5.2.1 What does this extract reveal about Eveline's character? Substantiate. (2)\n5.2.2 Explain the irony in Eveline's words, 'What would they … with a fellow?' (2)\n5.2.3 Eveline falls in love with a … A soldier B lawyer C teacher D sailor (1)\n5.2.4 '– Miss Hill, don't … ladies are waiting?': (a) What tone would Miss Gavan use? (1) (b) Why? (1)\n5.2.5 Name the place where Eveline's 'new home' will be. (1)\n5.2.6 Explain what Eveline means by 'She knew it … her the palpitations.' (2)\n5.2.7 Explain why Eveline's father forbids her to see Frank. (2)\n5.2.8 Where are Harry and Ernest at this point in the story? TWO points. (2)\n5.2.9 Do you feel sorry for Eveline? Discuss your view. (3)",
        memo: [
          "5.2.1 Indecisive ✓, she questions her decision to leave with Frank ✓. (Or: practical / sensible ✓, she weighs the good and the bad of leaving ✓.)",
          "5.2.2 She worries what her co-workers will say about her running away with Frank ✓, yet in the end she does not leave at all / they do not really care about her ✓. BOTH parts.",
          "5.2.3 D, sailor ✓",
          "5.2.4 (a) Sarcastic / bossy / reprimanding ✓ (b) To embarrass Eveline in front of the customers / to show she is the boss ✓.",
          "5.2.5 Buenos Ayres ✓",
          "5.2.6 Her father's violence ✓ made her nervous and her heart pound ✓.",
          "5.2.7 Sailors do not stay anywhere long, so he thinks Frank is not serious ✓✓. (Or: he is afraid to lose her, because she runs the house and gives him money for drink ✓✓.)",
          "5.2.8 Harry is somewhere in the country ✓. Ernest is dead ✓.",
          "5.2.9 No mark for Yes/No. YES: she gives up happiness to keep her promise to her mother; she is trapped by her father's abuse; she works all day and still runs the house. NO: she has a chance at a better life and refuses it; Frank truly loves her and she rejects him; she never stands up to her boss or her father. 3 points.",
          "Count your marks out of 17."
        ]
      },
      {
        id: "kv-dbe-forbidden",
        titel: "Short stories Q5: 'Forbidden love' by Can Themba (DBE Jun 2024)",
        cues: [
          "Sophiatown, apartheid: love across the colour line is against the law",
          "Salome hides the name of her child's father; Michael keeps asking",
          "Quote THREE CONSECUTIVE words: exactly three, no more",
          "Admire / discuss: three points from the whole story"
        ],
        toeBoek: "'FORBIDDEN LOVE' by Can Themba · DBE JUN 2024 · EXTRACT I [Michael confronts Salome once again.]\nMichael was again nagging his sister about the one thing that was eating into his peace of mind.\n'You keep stalling, dodging me, but do you think it is really in the best interests of the child that you hide its name? After all, I've been thinking of getting married myself … sometime soon …' and his voice trailed off.\n'Don't you worry, Mike,' Salome said. 'I've the child's true interest at heart. But there are times when there is good reason for not doing the obvious thing. I assure you the child's father is an honourable man. That is all I can say for the moment. You must trust me.'\nMichael looked into the fire in the stove, his mouth twisted into a strained grimace of concentrated thinking.\n'I still don't like it,' he said at length. 'What about you, what about your future? However romantic, I don't like the picture of a man who will not stand up to his responsibilities.'\n'You don't understand.' And she began to hum one of those catchy songs that fill the streets of Sophiatown now and then for a brief spell.\nMichael felt beaten again. He was always beaten in this game. The trouble was that he had full confidence in his sister's intelligence. But this, she was right, he could not understand.\n\nWrite your answers (±20 min), then open the memo:\n5.1.1 Match: (a) Mr Phillips (b) Meneer Carelse (c) David Randolph (d) Dick Peters with A tries restoring his family's honour · B a victim of Bobby's teasing · C the headmaster of Noordgesig Primary · D works at the Rhythmic Cinema · E a teacher at Noordgesig Primary (4)\n5.1.2 'Michael was again … peace of mind': (a) Identify the figure of speech. (1) (b) Explain why it is relevant. (2)\n5.1.3 What does Michael mean by 'You keep stalling, … hide its name?' (2)\n5.1.4 Explain the irony in Salome's words, 'I assure you … an honourable man'. (2)\n5.1.5 QUOTE THREE CONSECUTIVE words to show that Michael once again loses the argument. (1)\n5.1.6 One of the themes in 'Forbidden love' is defiance. Discuss this theme. (3)\n5.1.7 Do you admire Salome? Discuss your view. (3)",
        memo: [
          "5.1.1 (a) C ✓ (b) E ✓ (c) A ✓ (d) B ✓",
          "5.1.2 (a) Personification / metaphor ✓ (b) In the same way that rust eats into metal ✓, the question of who the child's father is keeps bothering Michael ✓.",
          "5.1.3 Salome keeps postponing / avoiding ✓ telling him who the father of her child is ✓.",
          "5.1.4 She calls the father 'honourable' ✓, yet he and his friends attack Michael like cowards / he does not support the child ✓. BOTH parts.",
          "5.1.5 'felt beaten again' ✓ (exactly three words).",
          "5.1.6 Michael defies the apartheid laws with his relationship with a coloured girl (Dora); Meneer Carelse defies the headmaster by suggesting they keep Dora's relationship secret; Dora's mother defies her husband by insisting on seeing her grandchild. 3 points.",
          "5.1.7 No mark for Yes/No. YES: she protects her future by not naming the father; she cares for Michael after the attack; she bravely exposes David Randolph in the end. NO: the child grows up without a father's support; she does not trust Michael; she waits until Michael is nearly killed. 3 points.",
          "Count your marks out of 18. Done all three stories? Then you have practised every Q5 question type."
        ]
      }
    ]
  },

  toerisme: {
    kort: "Toerisme",
    concepts: [
      {
        id: "wisselkoers",
        titel: "Koop- en verkoopkoers",
        cues: [
          "Kyk uit die BANK se oog",
          "Rand → buitelands: DEEL deur verkoopkoers",
          "Buitelands → Rand: MAAL met koopkoers",
          "Trek kommissie af as die vraag dit gee"
        ],
        toeBoek: "Koop R16,90 · Verkoop R17,50 vir €1. Hoeveel euro kry ’n toeris vir R7 000? Hoeveel rand kry hy vir €50 terug?",
        memo: [
          "R7 000 ÷ 17,50 = €400 (bank verkoop euro → verkoopkoers).",
          "€50 × 16,90 = R845 (bank koop euro → koopkoers).",
          "Bank koop laag, verkoop hoog."
        ]
      },
      {
        id: "tydsones",
        titel: "Tydsones",
        cues: [
          "SA = GMT+2",
          "Oos = tel by · wes = trek af",
          "Verskil = verskil in GMT-getalle",
          "Vlug: vertrektyd + vlugtyd, dan omskakel"
        ],
        toeBoek: "Dit is 09:00 in Johannesburg. Hoe laat is dit in Dubai (GMT+4) en in New York (GMT−5)?",
        memo: [
          "Dubai: +2 uur → 11:00.",
          "New York: −7 uur → 02:00.",
          "Kyk of die vraag somertyd noem."
        ]
      },
      {
        id: "vraag-lees",
        titel: "Lees die vraag 2×",
        cues: [
          "Omkring die opdragwoord",
          "Tel hoeveel hulle wil hê (TWEE)",
          "Rooi sirkel om NIE / BEHALWE",
          "(2) = 2 feite"
        ],
        toeBoek: "Kyk na jou laaste Toerisme-toets. Kies 3 vrae en merk die 4 dele op elkeen.",
        memo: [
          "Opdragwoord omkring, getal gemerk, strikwoord rooi, punte getel.",
          "Elke ‘dom fout’ wat jy kry → Foutbank."
        ]
      },
      {
        id: "vermenigvuldiger",
        titel: "Vermenigvuldiger-effek",
        cues: [
          "Toeris spandeer → geld sirkuleer",
          "Hotel → lone, boere, winkels",
          "Lekkasie: invoere, buitelandse eienaars",
          "Koop plaaslik = groter effek"
        ],
        toeBoek: "Verduidelik die vermenigvuldiger-effek met ’n voorbeeld. Wat is lekkasie?",
        memo: [
          "Toeriste se geld word weer en weer in die plaaslike ekonomie gespandeer → meer inkomste en werk.",
          "bv. hotel betaal personeel en koop by plaaslike boere; hulle spandeer weer by winkels.",
          "Lekkasie: geld wat die land verlaat (invoere, buitelandse eienaars)."
        ]
      }
    ]
  },

  wiskgelett: {
    kort: "Wisk. Gelett.",
    concepts: [
      {
        id: "rente",
        titel: "Enkelvoudige vs saamgestelde rente",
        cues: [
          "Enkelvoudig: A = P(1 + i·n)",
          "Saamgesteld: A = P(1 + i)ⁿ",
          "i as desimaal: 10% = 0,1",
          "Saamgesteld groei vinniger"
        ],
        toeBoek: "R8 000 teen 9% vir 2 jaar. Bereken die bedrag met enkelvoudige én saamgestelde rente.",
        memo: [
          "Enkelvoudig: 8 000 × (1 + 0,09 × 2) = R9 440.",
          "Saamgesteld: 8 000 × 1,09² = R9 504,80.",
          "Verskil: R64,80."
        ]
      },
      {
        id: "data",
        titel: "Gemiddeld · mediaan · modus · omvang",
        cues: [
          "Sorteer eers!",
          "Gemiddeld = som ÷ aantal",
          "Mediaan = middelste · modus = meeste",
          "Omvang = grootste − kleinste"
        ],
        toeBoek: "Data: 12, 7, 9, 7, 15, 10. Bereken gemiddeld, mediaan, modus en omvang.",
        memo: [
          "Sorteer: 7, 7, 9, 10, 12, 15.",
          "Gemiddeld = 60 ÷ 6 = 10.",
          "Mediaan = (9 + 10) ÷ 2 = 9,5 (ewe aantal → gemiddeld van die middelste twee).",
          "Modus = 7 · Omvang = 15 − 7 = 8."
        ]
      },
      {
        id: "skaal",
        titel: "Skaal: van kaart na km",
        cues: [
          "1 : 50 000 → 1 cm = 50 000 cm",
          "Meet × skaal = werklike cm",
          "÷ 100 = m · ÷ 1 000 = km",
          "Groot → klein eenheid: maal"
        ],
        toeBoek: "Skaal 1 : 25 000. Twee dorpe is 6,4 cm uitmekaar op die kaart. Hoe ver is dit in km?",
        memo: [
          "6,4 × 25 000 = 160 000 cm.",
          "÷ 100 = 1 600 m.",
          "÷ 1 000 = 1,6 km."
        ]
      },
      {
        id: "area-volume",
        titel: "Area & volume",
        cues: [
          "Reghoek l × b · driehoek ½ × b × h",
          "Sirkel π × r² · π = 3,142",
          "Silinder π × r² × h",
          "1 cm³ = 1 mℓ · 1 000 cm³ = 1 ℓ"
        ],
        toeBoek: "’n Silindriese tenk: radius 50 cm, hoogte 120 cm. Hoeveel liter hou dit?",
        memo: [
          "V = 3,142 × 50² × 120 = 942 600 cm³.",
          "÷ 1 000 = 942,6 ℓ.",
          "Kwadreer eers die radius: 50² = 2 500."
        ]
      },
      {
        id: "btw",
        titel: "BTW 15%",
        cues: [
          "Sonder → met BTW: × 1,15",
          "Met → sonder BTW: ÷ 1,15",
          "BTW-bedrag = met − sonder",
          "STRIK: nie × 0,85 nie"
        ],
        toeBoek: "’n Foon kos R4 600 met BTW. Wat is die prys sonder BTW, en hoeveel is die BTW?",
        memo: [
          "R4 600 ÷ 1,15 = R4 000 sonder BTW.",
          "BTW = R4 600 − R4 000 = R600.",
          "R4 600 × 0,85 = R3 910 is VERKEERD."
        ]
      }
    ]
  },

  foutbank: {
    kort: "Foutlog",
    concepts: [
      {
        id: "herhaal-lus",
        titel: "Die toets-lus",
        cues: [
          "Toe-boek: skryf wat jy onthou",
          "Memo: merk met rooi pen",
          "Foutbank: 1 sin, wat + hoekom",
          "Hertoets môre"
        ],
        toeBoek: "Kies 1 fout uit vandag. Skryf in 1 sin wat verkeerd was en hoekom.",
        memo: ["Voeg dit by die Foutbank-oortjie.", "Môre: probeer dit weer toe-boek voor jy na die memo kyk."]
      },
      {
        id: "spasieer",
        titel: "Spasieer",
        cues: [
          "Een maraton → jy vergeet",
          "Hertoets môre, dan oor 3 dae",
          "Elke hertoets maak dit langer bly",
          "Kort en gereeld wen"
        ],
        toeBoek: "Kyk na die Foutbank. Watter foute is ‘DUE NOU’? Hertoets 3 daarvan toe-boek.",
        memo: ["Reg gekry → merk ‘Reg gekry’; dit kom oor 2 dae weer.", "Nog verkeerd → laat dit oop vir môre."]
      },
      {
        id: "top3",
        titel: "Môre se top-3",
        cues: [
          "Kies 3 foute wat die meeste punte kos",
          "Skryf môre se eerste blok + tyd",
          "Sit die papier langs die skootrekenaar"
        ],
        toeBoek: "Skryf môre se top-3 op papier, plus die eerste blok en hoe laat dit begin.",
        memo: ["Neem ’n foto en stuur dit vir Pa.", "Môre begin jy met nommer 1, nie met jou gunstelingvak nie."]
      }
    ]
  }
};

/* Elke les-kaart is AGTERGROND: verduideliking om die eksamenwerk te verstaan, nie self eksamenwerk nie.
   Net 'n kaart wat self 'n DBE-eksamenvlak-item is, sou vlak: "eksamen" kry (nog geen een nie).
   Die sessie-taak en blok-hooftaak is nooit 'n agtergrondkaart nie (sien WALLIE.lessonUI hoofTaak). */
Object.values(WALLIE.LESSONS).forEach((L) =>
  L.concepts.forEach((c) => {
    if (!c.vlak) c.vlak = "agtergrond";
  })
);
WALLIE.isAgtergrond = function isAgtergrond(c) {
  return !c || c.vlak !== "eksamen";
};

WALLIE.lessonImg = function lessonImg(slug, id) {
  return `${WALLIE.LESSON_IMG}${slug}/${id}.svg`;
};
