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

  lo: {
    kort: "LO",
    concepts: [
      {
        id: "antwoord-trap",
        titel: "Antwoord-trap",
        cues: [
          "1 Stelling: wat is dit? (1 sin)",
          "2 Toepassing: noem die scenario/naam",
          "3 Voorbeeld of gevolg",
          "(4) = 2 punte × idee + uitbreiding"
        ],
        toeBoek: "Beantwoord met die 3 trappe: “Verduidelik hoe stres Lerato se eksamen kan beïnvloed. (4)”",
        memo: [
          "Stelling: stres is ’n reaksie op druk wat liggaam en gemoed affekteer.",
          "Toepassing: Lerato kan nie slaap of fokus nie omdat sy bang is om te druip.",
          "Gevolg: sy vergeet wat sy geleer het en skryf swakker.",
          "2 punte, elk met uitbreiding = 4 punte."
        ]
      },
      {
        id: "konflik",
        titel: "Konflikhantering",
        cues: [
          "Onderhandeling: julle praat self",
          "Bemiddeling: neutrale 3de help",
          "Arbitrasie: 3de besluit, bindend",
          "Begin altyd onder"
        ],
        toeBoek: "Wat is die verskil tussen bemiddeling en arbitrasie? Gee ’n voorbeeld van elk.",
        memo: [
          "Bemiddeling: ’n neutrale persoon help, maar die partye besluit self.",
          "Arbitrasie: ’n neutrale persoon besluit, en die besluit is bindend.",
          "bv. ’n Onderwyser bemiddel tussen twee maats; die CCMA arbitreer ’n werksgeskil."
        ]
      },
      {
        id: "regte",
        titel: "Regte ↔ verantwoordelikhede",
        cues: [
          "Handves van Regte: Grondwet hoofstuk 2",
          "Elke reg het ’n verantwoordelikheid",
          "Onderwys ↔ gaan skool, doen die werk",
          "Spraakvryheid ↔ geen haatspraak"
        ],
        toeBoek: "Noem 3 regte en die verantwoordelikheid wat by elkeen hoort.",
        memo: [
          "Onderwys ↔ gaan skool toe en werk.",
          "Vryheid van spraak ↔ geen haatspraak of laster.",
          "Gelykheid ↔ moenie diskrimineer nie.",
          "Veiligheid ↔ respekteer ander se liggaam en eiendom."
        ]
      },
      {
        id: "werksoek",
        titel: "Van skool na werk / studie",
        cues: [
          "Ken jouself → vind die pos → CV + dekbrief",
          "→ onderhoud → aanbod",
          "NSFAS = staatsbefondsing",
          "Beurs: nie terugbetaal · lening: wel + rente"
        ],
        toeBoek: "Noem die 5 stappe om werk te kry en 3 maniere om studie te befonds.",
        memo: [
          "Self-assessering → vakature vind → CV + dekbrief → onderhoud → aanbod/kontrak.",
          "NSFAS, beurs (hoef nie terugbetaal, met voorwaardes), studielening (terugbetaal + rente)."
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

WALLIE.lessonImg = function lessonImg(slug, id) {
  return `${WALLIE.LESSON_IMG}${slug}/${id}.svg`;
};
