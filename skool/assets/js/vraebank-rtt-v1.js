/* GEGENEREER deur scripts/build-vraebank.js – moenie met die hand wysig nie */
window.VRAEBANK_RTT_V1 = [
  {
    "antwoord": "=LARGE(E8:E40,3)",
    "bron": {
      "bladsy": 9,
      "memo_bladsy": 7,
      "verwysing": "DBE Nov 2024 V1 V4.2"
    },
    "id": "rtt-v1-S01",
    "nasienriglyn": [
      {
        "kriterium": "Funksie LARGE met reeks E8:E40",
        "punte": 1
      },
      {
        "kriterium": "Waarde (k): 3",
        "punte": 1
      }
    ],
    "onderwerp": "sigblad",
    "punte": 2,
    "tipe": "formule",
    "toets": {
      "formule": {
        "blaaie": {
          "Wasdag": {
            "E10": 800,
            "E11": 1200,
            "E12": 300,
            "E8": 450,
            "E9": 1200
          }
        },
        "selle": [
          {
            "blad": "Wasdag",
            "formule": "=LARGE(E8:E40,3)",
            "sel": "C4",
            "verwag": 800
          }
        ]
      }
    },
    "vak": "rtt",
    "verduideliking": "LARGE(reeks,k) gee die k-de grootste waarde in 'n reeks. Hier is die reeks E8:E40 en k is 3. Jy hoef niks te sorteer nie, en die antwoord bly reg as die bedrae later verander. Algemene fout: MAX gee net die heel grootste bedrag, en SMALL soek van onder af (die derde kleinste). Let ook op: as twee klasse presies dieselfde bedrag het, tel LARGE elkeen apart. Met 1200, 1200, 800, 450 en 300 is die derde grootste dus 800, nie 450 nie.",
    "vlak": 1,
    "vraag": "'n Skool hou 'n dag waarop leerders motors was om geld vir die matriekafskeid in te samel. Die Wasdag-werkblad bevat die bedrag wat elke klas ingesamel het in kolom E (ry 8 tot 40). Voeg 'n funksie in sel C4 in wat die derde grootste bedrag gee.",
    "vraestel": 1
  },
  {
    "antwoord": "=COUNTIF(D6:D27,\"<20\")\nOF\n=COUNTIF(D6:D27,\"<=19\")",
    "bron": {
      "bladsy": 8,
      "memo_bladsy": 5,
      "verwysing": "DBE Nov 2023 V1 V3.3"
    },
    "id": "rtt-v1-S02",
    "nasienriglyn": [
      {
        "kriterium": "Funksie: COUNTIF(D6:D27,…)",
        "punte": 1
      },
      {
        "kriterium": "Kriterium: \"<20\" OF \"<=19\"",
        "punte": 1
      }
    ],
    "onderwerp": "sigblad",
    "punte": 2,
    "tipe": "formule",
    "toets": {
      "formule": {
        "blaaie": {
          "Pasteie": {
            "D10": 31,
            "D6": 25,
            "D7": 19,
            "D8": 20,
            "D9": 8
          }
        },
        "selle": [
          {
            "blad": "Pasteie",
            "formule": "=COUNTIF(D6:D27,\"<20\")",
            "sel": "F3",
            "verwag": 2
          },
          {
            "blad": "Pasteie",
            "formule": "=COUNTIF(D6:D27,\"<=19\")",
            "sel": "F4",
            "verwag": 2
          }
        ]
      }
    },
    "vak": "rtt",
    "verduideliking": "COUNTIF tel die selle in 'n reeks wat aan EEN voorwaarde voldoen. Die eerste argument is die reeks (D6:D27) en die tweede die kriterium. 'n Kriterium met 'n vergelykingsteken moet altyd binne aanhalingstekens staan: \"<20\". Omdat pasteie heelgetalle is, beteken \"<=19\" presies dieselfde en is dit ook reg. Algemene foute: \"<=20\" tel ook die dae waarop presies 20 verkoop is; COUNT tel en SUM tel op sonder enige voorwaarde; en sonder die aanhalingstekens (<20) aanvaar die sigblad nie die formule nie.",
    "vlak": 1,
    "vraag": "Die snoepwinkel hou in die Pasteie-werkblad rekord van hoeveel pasteie elke skooldag verkoop is. Die getalle staan in kolom D (ry 6 tot 27). Voeg 'n funksie in sel F3 in om te bepaal op hoeveel dae minder as 20 pasteie verkoop is.",
    "vraestel": 1
  },
  {
    "antwoord": "=SUMIF(C7:C55,\"Child\",F7:F55)",
    "bron": {
      "bladsy": 9,
      "memo_bladsy": 7,
      "verwysing": "DBE Nov 2024 V1 V4.3"
    },
    "id": "rtt-v1-S03",
    "nasienriglyn": [
      {
        "kriterium": "Kriteriareeks: C7:C55",
        "punte": 1
      },
      {
        "kriterium": "Kriterium: \"Child\"",
        "punte": 1
      },
      {
        "kriterium": "Optelreeks: F7:F55",
        "punte": 1
      }
    ],
    "onderwerp": "sigblad",
    "punte": 3,
    "tipe": "formule",
    "toets": {
      "formule": {
        "blaaie": {
          "Kaartjies": {
            "C10": "Child",
            "C11": "Adult",
            "C7": "Adult",
            "C8": "Child",
            "C9": "Pensioner",
            "F10": 5,
            "F11": 1,
            "F7": 4,
            "F8": 3,
            "F9": 2
          }
        },
        "selle": [
          {
            "blad": "Kaartjies",
            "formule": "=SUMIF(C7:C55,\"Child\",F7:F55)",
            "sel": "H4",
            "verwag": 8
          }
        ]
      }
    },
    "vak": "rtt",
    "verduideliking": "SUMIF tel net die getalle op in die rye wat aan die voorwaarde voldoen. Die volgorde van die argumente is vas: eers die reeks waarin gesoek word (C7:C55), dan die kriterium (\"Child\"), en laaste die reeks wat opgetel word (F7:F55). Teks as kriterium staan in aanhalingstekens. Algemene foute: COUNTIF tel net hoeveel verkopings daar was, nie hoeveel kaartjies nie; en as jy die twee reekse omruil, soek die funksie die woord 'Child' tussen die getalle en die antwoord is 0.",
    "vlak": 1,
    "vraag": "Die Kaartjies-werkblad bevat die verkope van kaartjies vir die skool se rugbydag. Kolom C bevat die soort kaartjie ('Adult', 'Child' of 'Pensioner') en kolom F die getal kaartjies in elke verkoping (ry 7 tot 55). Voeg 'n funksie in sel H4 in om die totale getal 'Child'-kaartjies te bereken wat verkoop is.",
    "vraestel": 1
  },
  {
    "antwoord": "=COUNTIFS(C5:C60,\"Fiction\",F5:F60,\">=7\")\nOF\n=COUNTIFS(F5:F60,\">=7\",C5:C60,\"Fiction\")",
    "bron": {
      "bladsy": 8,
      "memo_bladsy": 5,
      "verwysing": "DBE Nov 2024 V1 V3.4"
    },
    "id": "rtt-v1-S04",
    "nasienriglyn": [
      {
        "kriterium": "Kriterium 1: \"Fiction\"",
        "punte": 1
      },
      {
        "kriterium": "in die reeks C5:C60",
        "punte": 1
      },
      {
        "kriterium": "Kriterium 2: \">=7\"",
        "punte": 1
      },
      {
        "kriterium": "in die reeks F5:F60",
        "punte": 1
      }
    ],
    "onderwerp": "sigblad",
    "punte": 4,
    "tipe": "formule",
    "toets": {
      "formule": {
        "blaaie": {
          "Leners": {
            "C5": "Fiction",
            "C6": "Fiction",
            "C7": "Non-fiction",
            "C8": "Fiction",
            "C9": "Fiction",
            "F5": 7,
            "F6": 6,
            "F7": 12,
            "F8": 15,
            "F9": 0
          }
        },
        "selle": [
          {
            "blad": "Leners",
            "formule": "=COUNTIFS(C5:C60,\"Fiction\",F5:F60,\">=7\")",
            "sel": "E3",
            "verwag": 2
          },
          {
            "blad": "Leners",
            "formule": "=COUNTIFS(F5:F60,\">=7\",C5:C60,\"Fiction\")",
            "sel": "E4",
            "verwag": 2
          }
        ]
      }
    },
    "vak": "rtt",
    "verduideliking": "COUNTIFS tel net die rye waar AL die voorwaardes gelyktydig waar is. Elke voorwaarde is 'n paar: eers die reeks, dan die kriterium vir daardie reeks. Die volgorde van die twee pare maak nie saak nie, solank elke reeks by sy eie kriterium staan. Die vergelykingsteken en die getal staan saam binne die aanhalingstekens: \">=7\". Algemene fout: \">7\" laat die boeke uit wat presies sewe dae laat was. Nog 'n fout is COUNTIF (sonder S), wat net een voorwaarde kan hanteer.",
    "vlak": 2,
    "vraag": "Die skoolbiblioteek hou rekord van boeke wat laat terugbesorg is in die Leners-werkblad. Kolom C bevat die soort boek ('Fiction' of 'Non-fiction') en kolom F die getal dae wat die boek laat was (ry 5 tot 60). Voeg 'n COUNTIFS-funksie in sel E3 in om te bepaal hoeveel 'Fiction'-boeke sewe of meer dae laat was.",
    "vraestel": 1
  },
  {
    "antwoord": "=ROUNDUP(E8/65,0)",
    "bron": {
      "bladsy": 12,
      "memo_bladsy": 9,
      "verwysing": "DBE Junie 2024 V1 V4.5"
    },
    "id": "rtt-v1-S05",
    "nasienriglyn": [
      {
        "kriterium": "Funksie: ROUNDUP(…,0)",
        "punte": 1
      },
      {
        "kriterium": "E8",
        "punte": 1
      },
      {
        "kriterium": "/65",
        "punte": 1
      }
    ],
    "onderwerp": "sigblad",
    "punte": 3,
    "tipe": "formule",
    "toets": {
      "formule": {
        "blaaie": {
          "Busse": {
            "E10": 66,
            "E8": 140,
            "E9": 65
          }
        },
        "selle": [
          {
            "blad": "Busse",
            "formule": "=ROUNDUP(E8/65,0)",
            "sel": "H8",
            "verwag": 3
          },
          {
            "blad": "Busse",
            "formule": "=ROUNDUP(E9/65,0)",
            "sel": "H9",
            "verwag": 1
          },
          {
            "blad": "Busse",
            "formule": "=ROUNDUP(E10/65,0)",
            "sel": "H10",
            "verwag": 2
          }
        ]
      }
    },
    "vak": "rtt",
    "verduideliking": "Deel eers die getal leerders deur 65 om te sien hoeveel busse vol sal wees. Selfs 'n paar oorblywende leerders het 'n ekstra bus nodig, dus moet die antwoord altyd na die volgende heelgetal toe afgerond word: ROUNDUP(…,0). Die 0 beteken geen desimale plekke nie. Voorbeeld: 140 leerders gee 140/65 = 2,15, en ROUNDUP maak dit 3 busse. Algemene foute: ROUND gee 2 (dan bly 10 leerders by die skool agter), en INT of ROUNDDOWN sny die breuk heeltemal af. Nog 'n fout is om die getal 140 in te tik in plaas van die selverwysing E8.",
    "vlak": 2,
    "vraag": "Skole wat die wetenskapsfees bywoon, ry met busse. Elke bus kan 65 leerders neem, en vir 'n gedeelte van 65 leerders is ook 'n hele bus nodig. In die Busse-werkblad staan die getal leerders van elke skool in kolom E. Gebruik 'n formule in sel H8 om te bepaal hoeveel busse die skool in ry 8 nodig het.",
    "vraestel": 1
  },
  {
    "antwoord": "=VLOOKUP(B5,Coaches!$A$2:$D$19,3)\nOF =VLOOKUP(B5,Coaches!$A$1:$D$19,3)\nOF =VLOOKUP(B5,Coaches!A2:D19,3)\nOF =VLOOKUP(B5,Coaches!A1:D19,3)",
    "bron": {
      "bladsy": 10,
      "memo_bladsy": 7,
      "verwysing": "DBE Nov 2022 V1 V4.3"
    },
    "id": "rtt-v1-S06",
    "nasienriglyn": [
      {
        "kriterium": "Opsoekwaarde: B5",
        "punte": 1
      },
      {
        "kriterium": "Tabelreeks: `Coaches!$A$2:$D$19` OF `Coaches!$A$1:$D$19` OF `Coaches!A2:D19` OF `Coaches!A1:D19` (net hierdie vier vorme: met of sonder die opskrifry, en óf heeltemal absoluut óf heeltemal relatief)",
        "punte": 1
      },
      {
        "kriterium": "Kolomnommer: 3",
        "punte": 1
      }
    ],
    "onderwerp": "sigblad",
    "punte": 3,
    "tipe": "formule",
    "toets": {
      "formule": {
        "blaaie": {
          "Coaches": {
            "A1": "ID",
            "A2": 101,
            "A3": 102,
            "A4": 103,
            "A5": 104,
            "B1": "Name",
            "B2": "Lerato",
            "B3": "Pieter",
            "B4": "Ayesha",
            "B5": "Johan",
            "C1": "Surname",
            "C2": "Mokoena",
            "C3": "Botha",
            "C4": "Khan",
            "C5": "Nel",
            "D1": "Cell",
            "D2": "0821110001",
            "D3": "0821110002",
            "D4": "0821110003",
            "D5": "0821110004"
          },
          "Spanne": {
            "A5": "Hockey U16",
            "B5": 103
          }
        },
        "selle": [
          {
            "blad": "Spanne",
            "formule": "=VLOOKUP(B5,Coaches!$A$2:$D$19,3)",
            "sel": "C5",
            "verwag": "Khan"
          },
          {
            "blad": "Spanne",
            "formule": "=VLOOKUP(B5,Coaches!A1:D19,3)",
            "sel": "C6",
            "verwag": "Khan"
          }
        ]
      }
    },
    "vak": "rtt",
    "verduideliking": "VLOOKUP soek die opsoekwaarde (B5) in die EERSTE kolom van die tabelreeks en gee dan die waarde uit die kolom met die gegewe nommer terug. Die tabelreeks begin by kolom A (die ID-nommers) en loop tot by kolom D. Die van staan in die derde kolom van die reeks, dus is die kolomnommer 3. Die opskrifry mag ingesluit word of nie, en die absolute selverwysings (met $) is net nodig as jy die formule na ander selle kopieer. Omdat die ID-nommers gesorteer is, werk die funksie sonder 'n vierde argument. Algemene foute: die reeks by kolom B laat begin (dan soek VLOOKUP die ID-nommer tussen die voorname en vind dit nie), of die kolomnommer verkeerd tel: 2 gee die voornaam en 4 die selfoonnommer. Vergeet ook nie die naam van die werkblad en die uitroepteken (`Coaches!`) voor die reeks nie.",
    "vlak": 2,
    "vraag": "Die Spanne-werkblad lys die skool se sportspanne. Elke span se afrigter word deur 'n ID-nommer in kolom B aangedui. Die Coaches-werkblad bevat die afrigters: opskrifte in ry 1, en in ry 2 tot 19 die ID-nommer (kolom A, van klein na groot gesorteer), die voornaam (kolom B), die van (kolom C) en die selfoonnommer (kolom D). Voeg 'n VLOOKUP-funksie in sel C5 van die Spanne-werkblad in om die afrigter se van te vertoon, gebaseer op die ID-nommer in sel B5 en die lys in die Coaches-werkblad.",
    "vraestel": 1
  },
  {
    "antwoord": "=VLOOKUP(C6,Pryse!A3:D300,4,FALSE)",
    "bron": {
      "bladsy": 8,
      "memo_bladsy": 6,
      "verwysing": "DBE Junie 2025 V1 V3.7"
    },
    "id": "rtt-v1-S07",
    "nasienriglyn": [
      {
        "kriterium": "Opsoekwaarde: C6",
        "punte": 1
      },
      {
        "kriterium": "Tabelreeks: Pryse!A3:D300",
        "punte": 1
      },
      {
        "kriterium": "Kolomnommer: 4",
        "punte": 1
      },
      {
        "kriterium": "Presiese passing: FALSE",
        "punte": 1
      }
    ],
    "onderwerp": "sigblad",
    "punte": 4,
    "tipe": "formule",
    "toets": {
      "formule": {
        "blaaie": {
          "Bestellings": {
            "C6": "K230"
          },
          "Pryse": {
            "A3": "K150",
            "A4": "K101",
            "A5": "K230",
            "A6": "K104",
            "B3": "Pen set",
            "B4": "Ruler",
            "B5": "Calculator",
            "B6": "Eraser",
            "D3": 45,
            "D4": 12,
            "D5": 289,
            "D6": 8
          }
        },
        "selle": [
          {
            "blad": "Bestellings",
            "formule": "=VLOOKUP(C6,Pryse!A3:D300,4,FALSE)",
            "sel": "G6",
            "verwag": 289
          }
        ]
      }
    },
    "vak": "rtt",
    "verduideliking": "Daar is drie foute in die oorspronklike funksie. (1) Die tabelreeks eindig by kolom B, maar die prys staan in kolom D; die reeks moet dus A3:D300 wees. (2) Die prys is die vierde kolom van die reeks, dus is die kolomnommer 4, nie 2 nie. (3) Omdat die kodes nie gesorteer is nie, moet VLOOKUP 'n presiese passing soek; daarvoor is die vierde argument FALSE. Sonder FALSE soek die funksie 'n benaderde passing en gee dit dikwels die prys van 'n ander produk, sonder enige foutboodskap. Die opsoekwaarde C6 bly dieselfde. Algemene fout: net die kolomnommer verander en vergeet om die reeks tot by kolom D te verleng, wat die fout #REF! gee.",
    "vlak": 2,
    "vraag": "Die Bestellings-werkblad gebruik die produkkode in kolom C om die prys van elke produk uit die Pryse-werkblad te vind. In die Pryse-werkblad staan die produkkodes in kolom A en die pryse in kolom D, in ry 3 tot 300. Die kodes is NIE gesorteer nie. Sel G6 bevat tans die funksie =VLOOKUP(C6,Pryse!A3:B300,2), wat 'n verkeerde waarde gee. Verander die funksie in sel G6 sodat die korrekte prys getoon word.",
    "vraestel": 1
  },
  {
    "antwoord": "=IF(F6<$L$2,\"Early\",IF(F6>=$L$3,\"Evening\",\"Day\"))\nOF\n=IF(F6>=$L$3,\"Evening\",IF(F6<$L$2,\"Early\",\"Day\"))\nOF\n=IF(F6>=$L$3,\"Evening\",IF(F6>=$L$2,\"Day\",\"Early\"))",
    "bron": {
      "bladsy": 10,
      "memo_bladsy": 8,
      "verwysing": "DBE Nov 2022 V1 V4.4"
    },
    "id": "rtt-v1-S08",
    "nasienriglyn": [
      {
        "kriterium": "Geneste IF-sintaks wat die korrekte uitset gee",
        "punte": 1
      },
      {
        "kriterium": "Voor 09:00: F6<$L$2 OF F6<L2",
        "punte": 1
      },
      {
        "kriterium": "Uitset: \"Early\"",
        "punte": 1
      },
      {
        "kriterium": "Vanaf 16:00: F6>=$L$3 OF F6>=L3",
        "punte": 1
      },
      {
        "kriterium": "Uitset: \"Evening\"",
        "punte": 1
      },
      {
        "kriterium": "Vang alles (09:00 tot voor 16:00): \"Day\"",
        "punte": 1
      }
    ],
    "onderwerp": "sigblad",
    "punte": 6,
    "tipe": "formule",
    "toets": {
      "formule": {
        "blaaie": {
          "Besoeke": {
            "F10": 0.375,
            "F6": 0.3,
            "F7": 0.5,
            "F8": 0.75,
            "F9": 0.6666666666666666,
            "L2": 0.375,
            "L3": 0.6666666666666666
          }
        },
        "selle": [
          {
            "blad": "Besoeke",
            "formule": "=IF(F6<$L$2,\"Early\",IF(F6>=$L$3,\"Evening\",\"Day\"))",
            "sel": "C6",
            "verwag": "Early"
          },
          {
            "blad": "Besoeke",
            "formule": "=IF(F7<$L$2,\"Early\",IF(F7>=$L$3,\"Evening\",\"Day\"))",
            "sel": "C7",
            "verwag": "Day"
          },
          {
            "blad": "Besoeke",
            "formule": "=IF(F8>=$L$3,\"Evening\",IF(F8<$L$2,\"Early\",\"Day\"))",
            "sel": "C8",
            "verwag": "Evening"
          },
          {
            "blad": "Besoeke",
            "formule": "=IF(F9>=$L$3,\"Evening\",IF(F9>=$L$2,\"Day\",\"Early\"))",
            "sel": "C9",
            "verwag": "Evening"
          },
          {
            "blad": "Besoeke",
            "formule": "=IF(F10<L2,\"Early\",IF(F10>=L3,\"Evening\",\"Day\"))",
            "sel": "C10",
            "verwag": "Day"
          }
        ]
      }
    },
    "vak": "rtt",
    "verduideliking": "Met drie moontlike uitsette het jy twee toetse nodig: die eerste IF toets een grens, en die tweede IF (binne die eerste) toets die ander grens. Wat oorbly, is die 'vang alles'-uitset. Die grense moet presies wees: 'voor 09:00' is F6<L2, en 'vanaf 16:00' sluit 16:00 self in, dus F6>=L3. Die absolute selverwysings (met $) is opsioneel, maar handig as jy die formule na ander selle kopieer. Punte word gegee vir twee korrekte toetse met hul passende uitsette, plus een punt vir die 'vang alles'. Aanvaar ook die Afrikaanse uitsette (Vroeg, Dag, Aand). Algemene foute: F6>L3 (dan kry 'n besoek om presies 16:00 die verkeerde kategorie), om die tye as teks in te tik (\"16:00\") in plaas van die selle te gebruik, en om die uitsette sonder aanhalingstekens te skryf.",
    "vlak": 3,
    "vraag": "Die munisipale swembad deel kaartjies volgens die tyd van die besoek in:\nVoor 09:00 → 'Early'\nVanaf 09:00 en voor 16:00 → 'Day'\nVanaf 16:00 → 'Evening'\nDie tyd 09:00 staan in sel L2 en die tyd 16:00 in sel L3 van die Besoeke-werkblad. Voeg 'n geneste IF-funksie in sel C6 in om die besoek te klassifiseer, deur die aankomstyd in sel F6 en die tye in selle L2 en L3 te gebruik.",
    "vraestel": 1
  },
  {
    "antwoord": "=IF(AND(H8=\"School\",C8=\"Weekday\"),(F8*G8)*0.9,IF(H8=\"Pensioner\",(F8*G8)*0.96,F8*G8))\nOF\n=IF(AND(H8=\"School\",C8=\"Weekday\"),(F8*G8)-(F8*G8)*10/100,IF(H8=\"Pensioner\",(F8*G8)-(F8*G8)*4/100,F8*G8))\nOF\n=IF(H8=\"School\",IF(C8=\"Weekday\",(F8*G8)*0.9,F8*G8),IF(H8=\"Pensioner\",(F8*G8)*0.96,F8*G8))",
    "bron": {
      "bladsy": 9,
      "memo_bladsy": 8,
      "verwysing": "DBE Nov 2024 V1 V4.6"
    },
    "id": "rtt-v1-S09",
    "nasienriglyn": [
      {
        "kriterium": "Korrekte sintaks en logika toegepas",
        "punte": 1
      },
      {
        "kriterium": "Kriterium: AND (1) met (H8=\"School\",C8=\"Weekday\") (1)",
        "punte": 2
      },
      {
        "kriterium": "Waarde as albei kriteria TRUE is: (F8*G8)*0.9 OF 90/100 OF trek 10/100 af",
        "punte": 1
      },
      {
        "kriterium": "Kriterium: H8=\"Pensioner\"",
        "punte": 1
      },
      {
        "kriterium": "Waarde indien TRUE: (F8*G8)*0.96 OF 96/100 OF trek 4/100 af",
        "punte": 1
      },
      {
        "kriterium": "Waarde as alle kriteria FALSE is: F8*G8",
        "punte": 1
      }
    ],
    "onderwerp": "sigblad",
    "punte": 7,
    "tipe": "formule",
    "toets": {
      "formule": {
        "blaaie": {
          "Groepe": {
            "C10": "Weekday",
            "C11": "Weekend",
            "C8": "Weekday",
            "C9": "Weekend",
            "F10": 40,
            "F11": 60,
            "F8": 50,
            "F9": 50,
            "G10": 10,
            "G11": 4,
            "G8": 30,
            "G9": 30,
            "H10": "Pensioner",
            "H11": "Family",
            "H8": "School",
            "H9": "School"
          }
        },
        "selle": [
          {
            "blad": "Groepe",
            "formule": "=IF(AND(H8=\"School\",C8=\"Weekday\"),(F8*G8)*0.9,IF(H8=\"Pensioner\",(F8*G8)*0.96,F8*G8))",
            "sel": "K8",
            "verwag": 1350
          },
          {
            "blad": "Groepe",
            "formule": "=IF(AND(H9=\"School\",C9=\"Weekday\"),(F9*G9)*0.9,IF(H9=\"Pensioner\",(F9*G9)*0.96,F9*G9))",
            "sel": "K9",
            "verwag": 1500
          },
          {
            "blad": "Groepe",
            "formule": "=IF(AND(H10=\"School\",C10=\"Weekday\"),(F10*G10)-(F10*G10)*10/100,IF(H10=\"Pensioner\",(F10*G10)-(F10*G10)*4/100,F10*G10))",
            "sel": "K10",
            "verwag": 384
          },
          {
            "blad": "Groepe",
            "formule": "=IF(H11=\"School\",IF(C11=\"Weekday\",(F11*G11)*0.9,F11*G11),IF(H11=\"Pensioner\",(F11*G11)*0.96,F11*G11))",
            "sel": "K11",
            "verwag": 240
          }
        ]
      }
    },
    "vak": "rtt",
    "verduideliking": "Die eerste toets het TWEE voorwaardes wat albei waar moet wees, daarom gebruik jy AND(H8=\"School\",C8=\"Weekday\"). As dit waar is, betaal die groep 90% van die volle koste: (F8*G8)*0.9 (of 90/100, of trek 10/100 van die koste af). As dit nie waar is nie, toets die tweede IF of die groep 'n 'Pensioner'-groep is; dan betaal hulle 96%: (F8*G8)*0.96. Die laaste argument is die volle koste F8*G8 vir alle ander gevalle. Algemene foute: *0.1 of *0.04 gee net die afslag self, nie die bedrag wat betaal moet word nie; OR in plaas van AND gee ook 'n skool oor naweke afslag; en om die laaste argument weg te laat, gee FALSE in plaas van 'n bedrag.",
    "vlak": 3,
    "vraag": "Die akwarium se Groepe-werkblad bereken die koste van besoeke deur groepe. Kolom C bevat die soort dag ('Weekday' of 'Weekend'), kolom F die prys per persoon, kolom G die getal mense en kolom H die soort groep ('School', 'Pensioner' of 'Family'). Die finale koste is die prys per persoon maal die getal mense, minus afslag indien van toepassing:\n• As die groep 'n 'School' is EN die besoek op 'n 'Weekday' is, kry die groep 10% afslag.\n• As die groep 'n 'Pensioner'-groep is, kry dit 4% afslag.\n• In alle ander gevalle is daar geen afslag nie.\nVoeg 'n geneste IF-funksie in sel K8 in om die finale koste te bereken.",
    "vraestel": 1
  },
  {
    "antwoord": "=DAY(B15)&LEFT(C15,4)&\"#BK\"\nOF\n=DAY(B15)&MID(C15,1,4)&\"#BK\"\nOF\n=CONCATENATE(DAY(B15),LEFT(C15,4),\"#BK\")\nOF\n=CONCAT(DAY(B15),LEFT(C15,4),\"#BK\")",
    "bron": {
      "bladsy": 8,
      "memo_bladsy": 6,
      "verwysing": "DBE Nov 2024 V1 V3.5"
    },
    "id": "rtt-v1-S10",
    "nasienriglyn": [
      {
        "kriterium": "Funksie: CONCATENATE OF CONCAT OF &",
        "punte": 1
      },
      {
        "kriterium": "Funksie: DAY(B15)",
        "punte": 1
      },
      {
        "kriterium": "Funksie: LEFT(C15,…) OF MID(C15,1,…)",
        "punte": 1
      },
      {
        "kriterium": "Aantal karakters: 4",
        "punte": 1
      },
      {
        "kriterium": "Teks: \"#BK\"",
        "punte": 1
      }
    ],
    "onderwerp": "sigblad",
    "punte": 5,
    "tipe": "formule",
    "toets": {
      "formule": {
        "blaaie": {
          "Roetes": {
            "B15": 46095,
            "C15": "Otter Trail"
          }
        },
        "selle": [
          {
            "blad": "Roetes",
            "formule": "=DAY(B15)&LEFT(C15,4)&\"#BK\"",
            "sel": "A15",
            "verwag": "14Otte#BK"
          },
          {
            "blad": "Roetes",
            "formule": "=CONCATENATE(DAY(B15),MID(C15,1,4),\"#BK\")",
            "sel": "A16",
            "verwag": "14Otte#BK"
          }
        ]
      }
    },
    "vak": "rtt",
    "verduideliking": "Drie stukke word aan mekaar geheg. DAY(B15) haal die dag van die maand (bv. 14) uit die datum. LEFT(C15,4) gee die eerste vier karakters van die naam (MID(C15,1,4) doen presies dieselfde: begin by karakter 1 en neem 4). Die vaste teks #BK staan tussen aanhalingstekens. Die stukke word met &, of met CONCATENATE of CONCAT, saamgevoeg. Algemene foute: die datum self saamvoeg in plaas van DAY(B15), wat 'n lang getal soos 46095 (die datum soos die sigblad dit stoor) in die kode sit; RIGHT in plaas van LEFT; en #BK sonder aanhalingstekens, wat 'n fout gee.",
    "vlak": 3,
    "vraag": "Die bergklub skep 'n bespreekkode vir elke voetslaanroete in die Roetes-werkblad. Sel B15 bevat die datum van die bespreking en sel C15 die naam van die roete. Die kode word soos volg saamgestel:\n• Die dag van die maand van die bespreking, gevolg deur\n• Die eerste vier letters van die naam van die roete, gevolg deur\n• #BK\nVoeg 'n kombinasie van funksies in sel A15 in om die bespreekkode te skep.",
    "vraestel": 1
  },
  {
    "antwoord": "Kies die opskrif 'Chocolate Muffins' en die paragraaf daaronder → 'Paragraph'-dialoog → oortjie 'Line and Page Breaks' → merk 'Keep with next' → 'OK'.",
    "bron": {
      "bladsy": 5,
      "memo_bladsy": 2,
      "verwysing": "DBE Nov 2024 V1 V1.3"
    },
    "id": "rtt-v1-W01",
    "nasienriglyn": [
      {
        "kriterium": "'Keep with next' toegepas op die opskrif 'Chocolate Muffins' (en paragraaf)",
        "punte": 1
      }
    ],
    "onderwerp": "woordverwerking",
    "punte": 1,
    "tipe": "stappe",
    "toets": {
      "handmatig": "Kontroleer in 'Paragraph' → 'Line and Page Breaks' dat 'Keep with next' op die opskrif (en die paragraaf voor die foto) gemerk is."
    },
    "vak": "rtt",
    "verduideliking": "'Keep with next' koppel 'n paragraaf aan die paragraaf wat volg, sodat Word hulle nie oor twee bladsye verdeel nie. Die foto staan in die volgende paragraaf, dus bly dit ook by. Algemene fout: 'Keep lines together' hou net die reëls van EEN paragraaf bymekaar, nie die opskrif by die volgende paragraaf nie. 'n Handmatige bladsybreuk ('Page Break') of ekstra leë reëls (met die 'Enter'-sleutel) kry nie die punt nie, want die uitleg breek weer sodra die teks bo verander.",
    "vlak": 1,
    "vraag": "In die Resepte-dokument staan die opskrif 'Chocolate Muffins', met 'n kort paragraaf en 'n foto daaronder. Sorg dat die opskrif nooit alleen onderaan 'n bladsy beland nie: die opskrif, die paragraaf en die foto moet altyd op dieselfde bladsy bly.",
    "vraestel": 1
  },
  {
    "antwoord": "Plaas die wyser onder 'Sources' → 'References' → 'Style': kies 'MLA' → 'Bibliography' → kies 'n ingeboude bibliografie (bv. 'Bibliography' of 'Works Cited').",
    "bron": {
      "bladsy": 7,
      "memo_bladsy": 4,
      "verwysing": "DBE Nov 2024 V1 V2.4"
    },
    "id": "rtt-v1-W02",
    "nasienriglyn": [
      {
        "kriterium": "Outomatiese bibliografie ingevoeg",
        "punte": 1
      },
      {
        "kriterium": "Styl: 'MLA'",
        "punte": 1
      }
    ],
    "onderwerp": "woordverwerking",
    "punte": 2,
    "tipe": "stappe",
    "toets": {
      "handmatig": "Klik in die bibliografie: dit moet 'n veld wees (grys skadu, 'Update Field' beskikbaar). Kontroleer op die 'References'-oortjie dat 'Style' op 'MLA' staan en dat die bronne in MLA-uitleg vertoon."
    },
    "vak": "rtt",
    "verduideliking": "'n Outomatiese bibliografie is 'n veld wat Word bou uit die bronne wat met 'Insert Citation' of 'Manage Sources' ingevoer is. Die styl ('MLA', 'APA', 'Harvard' …) bepaal hoe elke bron uitgelê word, en word in die 'Style'-lys op die 'References'-oortjie gekies. Jy kan die styl ook ná die invoeging verander; die bibliografie werk dan self by. Daar is twee punte: een vir die bibliografie self en een vir die regte styl. Algemene foute: die bronne self oortik (dan is dit nie outomaties nie en is die punt weg), 'n 'Table of Contents' invoeg, of die styl op 'APA' laat staan.",
    "vlak": 1,
    "vraag": "Die Klimaat-verslag bevat reeds bronne wat met 'Insert Citation' bygevoeg is. Voeg 'n outomatiese bibliografie in die 'MLA'-styl in, onder die teks 'Sources' aan die einde van die dokument.",
    "vraestel": 1
  },
  {
    "antwoord": "'File' → 'Info' → 'Show All Properties' → klik by 'Status' en tik 'Ready for print'.\nOF 'File' → 'Info' → 'Properties' → 'Advanced Properties' → oortjie 'Custom' → 'Status' → 'Value': 'Ready for print' → 'Add' → 'OK'.",
    "bron": {
      "bladsy": 5,
      "memo_bladsy": 2,
      "verwysing": "DBE Junie 2025 V1 V1.1"
    },
    "id": "rtt-v1-W03",
    "nasienriglyn": [
      {
        "kriterium": "'Status'-eienskap bevat presies 'Ready for print' (via 'Show All Properties' OF 'Advanced Properties' → 'Custom'; geen punt vir die oopmaak van die dialoog self nie)",
        "punte": 1
      }
    ],
    "onderwerp": "woordverwerking",
    "punte": 1,
    "tipe": "stappe",
    "toets": {
      "handmatig": "Kontroleer onder 'File' → 'Info' → 'Show All Properties' dat 'Status' presies Ready for print bevat."
    },
    "vak": "rtt",
    "verduideliking": "Die eienskappe van 'n dokument is inligting OOR die lêer, nie teks in die dokument self nie. 'Status' wys nie by die eerste paar eienskappe op die 'Info'-blad nie; jy moet eers op 'Show All Properties' klik. In Office 2016/365 werk die 'Custom'-oortjie van 'Advanced Properties' ook; die 'Summary'-oortjie het egter GEEN 'Status'-veld nie. Die teks moet presies so gespel wees, met dieselfde hoofletters. Daar is net een punt: die 'Status'-eienskap bevat 'Ready for print', ongeag watter van die twee roetes jy gebruik. Algemene foute: die teks in 'Title', 'Tags' of 'Comments' tik, of dit bo-aan die dokument intik.",
    "vlak": 1,
    "vraag": "Voeg die teks 'Ready for print' in die 'Status'-eienskap van die Nuusbrief-dokument in. ('Status' is een van die lêereienskappe ('Properties') onder 'File' → 'Info', nie teks op die bladsy nie.)",
    "vraestel": 1
  },
  {
    "antwoord": "Plaas die wyser by (of kies) die teks 'See Prices' → 'References' (of 'Insert') → 'Cross-reference' → 'Reference type': 'Bookmark' → 'Insert reference to': 'Bookmark text' → kies 'Tariffs' → 'Insert'.\n'Field code' (Alt+F9): { REF Tariffs \\h }",
    "bron": {
      "bladsy": 5,
      "memo_bladsy": 2,
      "verwysing": "DBE Nov 2024 V1 V1.4"
    },
    "id": "rtt-v1-W04",
    "nasienriglyn": [
      {
        "kriterium": "Kruisverwysing ingevoeg op 'See Prices'",
        "punte": 1
      },
      {
        "kriterium": "Boekmerk: 'Tariffs'",
        "punte": 1
      }
    ],
    "onderwerp": "woordverwerking",
    "punte": 2,
    "tipe": "stappe",
    "toets": {
      "handmatig": "Druk Alt+F9 by 'See Prices': die veldkode moet { REF Tariffs \\h } (of { REF Tariffs }) wees."
    },
    "vak": "rtt",
    "verduideliking": "'n Kruisverwysing is 'n veld (REF) wat die teks van die boekmerk invoeg en bywerk as die boekmerk verander. Daar is twee punte: een dat dit 'n kruisverwysing by 'See Prices' is, en een dat dit na die boekmerk 'Tariffs' verwys. Met `Alt+F9` kan jy die kode van die veld ('field code') sien. Algemene foute: 'n 'Hyperlink' na die boekmerk invoeg (dit is 'n ander veld, HYPERLINK, en nie 'n kruisverwysing nie), of 'Reference type' op 'Heading' laat staan en 'n opskrif kies in plaas van die boekmerk.",
    "vlak": 2,
    "vraag": "Die Toer-dokument bevat 'n boekmerk met die naam 'Tariffs'. Voeg by die teks 'See Prices' 'n kruisverwysing ('cross-reference') in wat na die 'Tariffs'-boekmerk verwys.",
    "vraestel": 1
  },
  {
    "antwoord": "Plaas die wyser heel aan die begin van die laaste bladsy → 'Layout' → 'Breaks' → 'Section Breaks': 'Next Page' → bly in die nuwe seksie → 'Orientation' → 'Landscape'.\nOF kies die inhoud van die laaste bladsy → 'Page Setup'-dialoog → 'Landscape' → 'Apply to': 'Selected text' → 'OK'.",
    "bron": {
      "bladsy": 7,
      "memo_bladsy": 4,
      "verwysing": "DBE Nov 2024 V1 V2.6"
    },
    "id": "rtt-v1-W05",
    "nasienriglyn": [
      {
        "kriterium": "Laaste bladsy: 'Landscape'",
        "punte": 1
      },
      {
        "kriterium": "Alle ander bladsye in 'Portrait'",
        "punte": 1
      }
    ],
    "onderwerp": "woordverwerking",
    "punte": 2,
    "tipe": "stappe",
    "toets": {
      "handmatig": "Kontroleer in 'Print Preview' (of 'Multiple Pages'-aansig) dat net die laaste bladsy in 'Landscape' is en al die vorige bladsye in 'Portrait'."
    },
    "vak": "rtt",
    "verduideliking": "Oriëntasie geld vir 'n hele seksie ('section'). Om net een bladsy anders te maak, moet daardie bladsy in sy eie seksie wees; daarom is 'n seksiebreuk ('Section Break') nodig, nie 'n gewone bladsybreuk nie. Met 'Apply to: Selected text' sit Word self die seksiebreuk in. Twee punte: die laaste bladsy is 'Landscape', en al die ander bladsye is nog 'Portrait'. Algemene foute: 'Orientation' kies sonder 'n seksiebreuk, sodat die hele dokument draai, of die seksiebreuk een bladsy te vroeg invoeg.",
    "vlak": 2,
    "vraag": "Die laaste bladsy van die Sportverslag bevat 'n breë tabel met uitslae. Verander die bladsyoriëntasie ('page orientation') van slegs die laaste bladsy na 'Landscape'. Al die ander bladsye moet in 'Portrait' bly.",
    "vraestel": 1
  },
  {
    "antwoord": "Ctrl+H ('Find and Replace') → 'Find what': netball → klik 'More >>' → merk 'Match case' en 'Find whole words only' → klik in 'Replace with' (laat dit leeg of tik netball) → 'Format' → 'Style' → kies 'Sport Char' → 'Replace All'.",
    "bron": {
      "bladsy": 5,
      "memo_bladsy": 2,
      "verwysing": "DBE Junie 2025 V1 V1.4"
    },
    "id": "rtt-v1-W06",
    "nasienriglyn": [
      {
        "kriterium": "Teks: 'netball' in 'Find what' ('Replace with' leeg gelaat OF 'netball')",
        "punte": 1
      },
      {
        "kriterium": "Formaat: 'Style': 'Sport Char'",
        "punte": 1
      },
      {
        "kriterium": "Regte getal veranderinge: elke 'netball' in kleinletters as hele woord, en geen 'Netball' of 'netballers' nie ('Match case' en 'Find whole words only')",
        "punte": 1
      }
    ],
    "onderwerp": "woordverwerking",
    "punte": 3,
    "tipe": "stappe",
    "toets": {
      "handmatig": "Soek met 'Find' ('Match case' en 'Find whole words only') na netball: elke treffer moet die 'Sport Char'-styl hê, terwyl 'Netball' en 'netballers' hul oorspronklike styl behou."
    },
    "vak": "rtt",
    "verduideliking": "Die styl word op die VERVANG-kant gestel: die wyser moet in die 'Replace with'-blokkie wees as jy 'Format' → 'Style' kies. As die blokkie leeg is, hou Word die oorspronklike teks en verander net die formaat. 'Match case' sorg dat 'Netball' met 'n hoofletter nie verander nie, en 'Find whole words only' sorg dat 'netballers' nie verander nie. Daarvoor is die derde punt: die regte getal veranderinge. Algemene foute: die styl op die 'Find what'-kant stel, of een van die twee merkblokkies vergeet, sodat te veel woorde verander.",
    "vlak": 2,
    "vraag": "Die Sportdag-dokument noem die woord 'netball' op baie plekke, ook in woorde soos 'netballers' en in die opskrif 'Netball Results'. Gebruik 'Find and Replace' om die 'Sport Char'-styl toe te pas op slegs elke plek waar die presiese woord 'netball' (net kleinletters, as 'n hele woord) voorkom.",
    "vraestel": 1
  },
  {
    "antwoord": "Dubbelklik in die 'header' → merk 'Different Odd & Even Pages' → op 'n ongelyke bladsy: 'Page Number' → 'Top of Page' → 'Page X of Y' (regs in lyn, bv. 'Bold Numbers 3') → op 'n gelyke bladsy: 'Page Number' → 'Top of Page' → 'Page X of Y' (links in lyn, bv. 'Bold Numbers 1') → 'Close Header and Footer'.",
    "bron": {
      "bladsy": 6,
      "memo_bladsy": 3,
      "verwysing": "DBE Nov 2024 V1 V1.9"
    },
    "id": "rtt-v1-W07",
    "nasienriglyn": [
      {
        "kriterium": "Outomatiese bladsynommers in die 'header'",
        "punte": 1
      },
      {
        "kriterium": "Formaat: 'Page X of Y'",
        "punte": 1
      },
      {
        "kriterium": "'Different Odd & Even Pages' gekies",
        "punte": 1
      },
      {
        "kriterium": "Inlynstelling: ongelyke nommers regs EN gelyke nommers links",
        "punte": 1
      }
    ],
    "onderwerp": "woordverwerking",
    "punte": 4,
    "tipe": "stappe",
    "toets": {
      "handmatig": "Open die bladsyopskrif: 'Different Odd & Even Pages' moet gemerk wees. Op bladsy 1 (ongelyk) staan 'Page 1 of N' regs en op bladsy 2 (gelyk) 'Page 2 of N' links; Alt+F9 wys die velde PAGE en NUMPAGES."
    },
    "vak": "rtt",
    "verduideliking": "Afleidingsreël: in 'n dubbelsydige boek is die ongelyke ('odd') bladsye regterbladsye, met die buiterand regs, en die gelyke ('even') bladsye linkerbladsye, met die buiterand links. Verskillende belyning op ongelyke en gelyke bladsye beteken dat jy 'Different Odd & Even Pages' nodig het; 'Page 3 of 12' is die formaat 'Page X of Y'; en \"werk self by\" beteken velde, nie getikte getalle nie. Met 'Different Odd & Even Pages' kry ongelyke en gelyke bladsye elk hul eie 'header'; daarom moet jy die nommer TWEE keer invoeg, een keer op elke soort bladsy. 'Page X of Y' gebruik twee velde: PAGE (die huidige bladsy) en NUMPAGES (die totale getal bladsye), wat albei self bywerk. Vier punte: outomatiese nommers in die 'header', die formaat 'Page X of Y', 'Different Odd & Even Pages' gekies, en die inlynstelling (ongelyk regs EN gelyk links). Algemene foute: die nommers in die 'footer' (onder aan die bladsy) sit, die getalle self intik, of 'Different Odd & Even Pages' vergeet en dan net een inlynstelling hê.",
    "vlak": 3,
    "vraag": "Die Jaarblad-dokument word dubbelsydig gedruk en soos 'n boek gebind, met bladsy 1 as 'n regterbladsy. Die redakteur wil die volgende hê:\n• Bo-aan elke bladsy moet die bladsynommer saam met die totale getal bladsye verskyn, bv. 'Page 3 of 12', en die getalle moet self bywerk as bladsye bygevoeg of verwyder word.\n• Die nommer moet altyd aan die BUITERAND van die oop boek staan (weg van die binding), sodat 'n mens maklik kan deurblaai.\nLei self af watter 'header'-instellings hierdie uitleg gee, en voeg die bladsynommers in.",
    "vraestel": 1
  },
  {
    "antwoord": "Kies die vier reëls → 'Paragraph'-dialoog → 'Tabs…' → 'Tab stop position': 9 cm → 'Alignment': 'Center' → 'Leader': 2 (……) → 'Set' → 'Tab stop position': 14 cm → 'Alignment': 'Right' → 'Set' → 'OK'.",
    "bron": {
      "bladsy": 7,
      "memo_bladsy": 4,
      "verwysing": "DBE Nov 2024 V1 V2.5"
    },
    "id": "rtt-v1-W08",
    "nasienriglyn": [
      {
        "kriterium": "Tweede tabelstop: posisie 9 cm",
        "punte": 1
      },
      {
        "kriterium": "Tweede tabelstop: inlynstelling 'Center'",
        "punte": 1
      },
      {
        "kriterium": "Tweede tabelstop: vuller ('Leader') 2 (kolletjies)",
        "punte": 1
      },
      {
        "kriterium": "Derde tabelstop (14 cm): inlynstelling 'Right'",
        "punte": 1
      }
    ],
    "onderwerp": "woordverwerking",
    "punte": 4,
    "tipe": "stappe",
    "toets": {
      "handmatig": "Kies die vier reëls en open 'Tabs…': daar moet 'n tabelstop op 9 cm wees ('Center', 'Leader' 2) en een op 14 cm ('Right'). Die liniaal wys dieselfde merke vir al vier reëls."
    },
    "vak": "rtt",
    "verduideliking": "'n Tabelstop het drie eienskappe: die posisie, die inlynstelling ('Left', 'Center', 'Right', 'Decimal') en die vuller ('Leader'). Vuller 2 is die kolletjies, 3 die strepies en 4 'n soliede lyn. Die vraag noem nie die belyning nie; jy moet hulle uit die uitleg aflei. As die middel van die teks op die merk lê, is dit 'Center'; as die teks by die merk eindig, is dit 'Right' (by 'Left' begin die teks by die merk). Jy moet AL vier reëls eers kies, anders kry net een reël die tabelstoppe. Druk 'Set' ná elke tabelstop, anders word net die laaste een gestoor. Punte: die tweede tabelstop se posisie (9 cm), inlynstelling ('Center') en vuller (2), en die derde tabelstop se inlynstelling ('Right'). Algemene foute: spasies tik in plaas van tabelstoppe, die vuller op die derde tabelstop sit, of 'Left' laat staan vir die aankomstye.",
    "vlak": 3,
    "vraag": "Onder die opskrif 'Bus Timetable' in die Uitstappie-dokument staan vier reëls. Op elke reël is die plek, die vertrektyd en die aankomstyd met 'Tab'-karakters geskei. Die eerste tabelstop (2 cm, 'Left') is reeds gestel. Op die liniaal moet die voltooide reëls so lyk:\n• Die middelpunt van elke vertrektyd lê presies by die 9 cm-merk, en die spasie tussen die plek en die vertrektyd is met kolletjies gevul (soos Durban ……… 07:30).\n• Die laaste syfer van elke aankomstyd eindig presies by die 14 cm-merk, sodat die aankomstye se regterkante in 'n reguit lyn onder mekaar staan.\nLei uit hierdie uitleg af watter tabelstoppe nodig is, en stel hulle vir die vier reëls.",
    "vraestel": 1
  },
  {
    "antwoord": "In 'n leë kolom se 'Field'-ry: AmountDue: [EntryFee]-[Discount]",
    "bron": {
      "bladsy": 11,
      "memo_bladsy": 11,
      "verwysing": "DBE Nov 2024 V1 V5.3"
    },
    "id": "rtt-v1-D01",
    "nasienriglyn": [
      {
        "kriterium": "Nuwe veld: AmountDue",
        "punte": 1
      },
      {
        "kriterium": "[EntryFee]",
        "punte": 1
      },
      {
        "kriterium": "- [Discount]",
        "punte": 1
      }
    ],
    "onderwerp": "databasis",
    "punte": 3,
    "tipe": "formule",
    "toets": {
      "sql": {
        "sqlite": "SELECT EntryID, EntryFee - Discount AS AmountDue FROM tblEntries ORDER BY EntryID",
        "tabelle": [
          {
            "naam": "tblEntries",
            "rye": [
              {
                "Discount": 20,
                "EntryFee": 150,
                "EntryID": 1,
                "Runner": "Thabo"
              },
              {
                "Discount": 0,
                "EntryFee": 150,
                "EntryID": 2,
                "Runner": "Anika"
              },
              {
                "Discount": 15,
                "EntryFee": 90,
                "EntryID": 3,
                "Runner": "Sipho"
              }
            ]
          }
        ],
        "verwag": [
          [
            1,
            130
          ],
          [
            2,
            150
          ],
          [
            3,
            75
          ]
        ]
      }
    },
    "vak": "rtt",
    "verduideliking": "'n Berekende veld in Access begin met die naam van die nuwe veld, dan 'n dubbelpunt, dan die berekening. Die name van bestaande velde staan tussen vierkantige hakies, presies soos hulle in die tabel gespel is. Die volgorde is belangrik: die afslag word VAN die fooi afgetrek. Algemene foute: sonder die dubbelpunt noem Access die veld self `Expr1` en jy verloor die punt vir die naam; getalle in plaas van die name van die velde werk net vir een rekord; [Discount]-[EntryFee] gee 'n negatiewe bedrag.",
    "vlak": 1,
    "vraag": "Die inskrywings vir 'n pretdraf word in die tblEntries-tabel gestoor. Die tabel het onder andere die velde 'EntryFee' (die volle inskrywingsfooi) en 'Discount' (die afslag in rand). Maak die qryFees-navraag, wat op tblEntries gebaseer is, in 'Design View' oop. Voeg 'n berekende veld 'AmountDue' by wat bereken hoeveel elke deelnemer moet betaal nadat die afslag afgetrek is. Stoor en maak die navraag toe.",
    "vraestel": 1
  },
  {
    "antwoord": "Velde: Guest (Sort: Ascending), Amount, BookingDate\nBookingDate se 'Criteria'-ry: Between #2026/03/01# And #2026/05/31#\nOF >=#2026/03/01# And <=#2026/05/31#\nOF >#2026/02/28# And <#2026/06/01#",
    "bron": {
      "bladsy": 12,
      "memo_bladsy": 9,
      "verwysing": "DBE Junie 2025 V1 V5.3"
    },
    "id": "rtt-v1-D02",
    "nasienriglyn": [
      {
        "kriterium": "Navraag geskep met die velde Guest, Amount en BookingDate",
        "punte": 1
      },
      {
        "kriterium": "BookingDate-kriterium, begindatum: `Between #2026/03/01#` OF >=#2026/03/01# OF >#2026/02/28#",
        "punte": 1
      },
      {
        "kriterium": "BookingDate-kriterium, koppelwoord: `And` (afsonderlike punt)",
        "punte": 1
      },
      {
        "kriterium": "BookingDate-kriterium, einddatum: #2026/05/31# OF <=#2026/05/31# OF <#2026/06/01#",
        "punte": 1
      },
      {
        "kriterium": "Gesorteer: 'Guest'-veld stygend ('Ascending')",
        "punte": 1
      }
    ],
    "onderwerp": "databasis",
    "punte": 5,
    "tipe": "formule",
    "toets": {
      "sql": {
        "sqlite": "SELECT Guest, Amount FROM tblBookings WHERE BookingDate BETWEEN '2026-03-01' AND '2026-05-31' ORDER BY Guest",
        "tabelle": [
          {
            "naam": "tblBookings",
            "rye": [
              {
                "Amount": 1800,
                "BookingDate": "2026-02-28",
                "BookingID": 1,
                "Guest": "Van Wyk"
              },
              {
                "Amount": 950,
                "BookingDate": "2026-03-01",
                "BookingID": 2,
                "Guest": "Dlamini"
              },
              {
                "Amount": 2400,
                "BookingDate": "2026-04-17",
                "BookingID": 3,
                "Guest": "Pillay"
              },
              {
                "Amount": 1200,
                "BookingDate": "2026-05-31",
                "BookingID": 4,
                "Guest": "Adams"
              },
              {
                "Amount": 600,
                "BookingDate": "2026-06-01",
                "BookingID": 5,
                "Guest": "Botha"
              }
            ]
          }
        ],
        "verwag": [
          [
            "Adams",
            1200
          ],
          [
            "Dlamini",
            950
          ],
          [
            "Pillay",
            2400
          ]
        ]
      }
    },
    "vak": "rtt",
    "verduideliking": "Die navraag het die 'BookingDate'-veld nodig om die kriterium op te sit, al vra die vraag net om 'Guest' en 'Amount' te vertoon (jy mag die 'Show'-blokkie van 'BookingDate' afmerk). Datums staan in Access tussen #-tekens. 'Tot en met 31 Mei' sluit 31 Mei in, daarom <=#2026/05/31# of <#2026/06/01#; `Between … And` sluit albei datums in. Die twee helftes word met `And` verbind omdat 'n datum aan albei moet voldoen. Algemene foute: `Or` in plaas van `And` (dan kom AL die besprekings deur), <#2026/05/31# (dan val 31 Mei uit), datums sonder #-tekens of tussen aanhalingstekens, en om die sortering op 'Amount' in plaas van 'Guest' te sit.",
    "vlak": 1,
    "vraag": "Die gastehuis stoor besprekings in die tblBookings-tabel, met onder andere die velde 'Guest', 'Amount' en 'BookingDate'. Skep 'n navraag met die naam qryAutumn, wat op die tblBookings-tabel gebaseer is. Vertoon die 'Guest'- en 'Amount'-velde vir AL die besprekings vanaf 1 Maart 2026 tot en met 31 Mei 2026. Sorteer die lys alfabeties volgens die 'Guest'-veld. Stoor en maak die navraag toe.",
    "vraestel": 1
  },
  {
    "antwoord": "Ry 'Criteria': Item: Like \"*Blazer*\" en InStock: <3\nRy 'or': InStock: >=20",
    "bron": {
      "bladsy": 11,
      "memo_bladsy": 11,
      "verwysing": "DBE Nov 2024 V1 V5.4"
    },
    "id": "rtt-v1-D03",
    "nasienriglyn": [
      {
        "kriterium": "Item-kriterium: `Like` (1) \"*Blazer*\" met albei sterretjies (1)",
        "punte": 2
      },
      {
        "kriterium": "InStock-kriterium: <3",
        "punte": 1
      },
      {
        "kriterium": "InStock-kriterium: >=20",
        "punte": 1
      },
      {
        "kriterium": "AND- en OR-logika korrek (twee rye)",
        "punte": 1
      }
    ],
    "onderwerp": "databasis",
    "punte": 5,
    "tipe": "formule",
    "toets": {
      "sql": {
        "sqlite": "SELECT ItemID FROM tblUniform WHERE (Item LIKE '%Blazer%' AND InStock < 3) OR InStock >= 20 ORDER BY ItemID",
        "tabelle": [
          {
            "naam": "tblUniform",
            "rye": [
              {
                "InStock": 2,
                "Item": "Junior Blazer Navy",
                "ItemID": 1
              },
              {
                "InStock": 7,
                "Item": "Senior Blazer",
                "ItemID": 2
              },
              {
                "InStock": 25,
                "Item": "Grey Trousers",
                "ItemID": 3
              },
              {
                "InStock": 19,
                "Item": "School Tie",
                "ItemID": 4
              },
              {
                "InStock": 0,
                "Item": "Blazer Badge",
                "ItemID": 5
              },
              {
                "InStock": 22,
                "Item": "Senior Blazer Large",
                "ItemID": 6
              }
            ]
          }
        ],
        "verwag": [
          [
            1
          ],
          [
            3
          ],
          [
            5
          ],
          [
            6
          ]
        ]
      }
    },
    "vak": "rtt",
    "verduideliking": "Twee aparte groepe moet vertoon word, dus het jy twee rye nodig. Kriteria op DIESELFDE ry word met AND verbind ('Blazer' EN minder as 3); kriteria op die 'or'-ry is 'n tweede, aparte moontlikheid (enige item met 20 of meer). Omdat die woord 'Blazer' oral in die naam kan staan (bv. 'Junior Blazer Navy'), gebruik jy `Like` met 'n sterretjie ('wildcard') aan albei kante. Algemene foute: <3 en >=20 op dieselfde ry sit (geen item kan albei wees nie, dus kom niks deur nie), 'Blazer' sonder sterretjies (dan word net items met presies die naam 'Blazer' gevind), en <=3 in plaas van <3.",
    "vlak": 2,
    "vraag": "Die skool se klerewinkel stoor sy voorraad in die tblUniform-tabel, met onder andere die velde 'Item' en 'InStock'. Maak die qryReorder-navraag, wat op die tblUniform-tabel gebaseer is, in 'Design View' oop. Skep 'n lys wat al die items vertoon waarvan die naam die woord 'Blazer' bevat en waarvan minder as drie in voorraad is, asook enige ander item waarvan 20 of meer in voorraad is. Stoor en maak die navraag toe.",
    "vraestel": 1
  },
  {
    "antwoord": "Ry 'Criteria': Genre: <>\"Fantasy\" en Rating: >7\nRy 'or': Genre: \"Poetry\"\n(Aanvaar Not \"Fantasy\" en >=8)",
    "bron": {
      "bladsy": 12,
      "memo_bladsy": 10,
      "verwysing": "DBE Junie 2025 V1 V5.4"
    },
    "id": "rtt-v1-D04",
    "nasienriglyn": [
      {
        "kriterium": "Genre-kriterium: \"Poetry\"",
        "punte": 1
      },
      {
        "kriterium": "Genre-kriterium: `Not \"Fantasy\"` OF <>\"Fantasy\"",
        "punte": 1
      },
      {
        "kriterium": "Rating-kriterium: >7 OF >=8",
        "punte": 1
      },
      {
        "kriterium": "Logika: <>\"Fantasy\" `AND` >7 op een ry, `OR` \"Poetry\" op 'n ander ry",
        "punte": 1
      }
    ],
    "onderwerp": "databasis",
    "punte": 4,
    "tipe": "formule",
    "toets": {
      "sql": {
        "sqlite": "SELECT BookID FROM tblBooks WHERE Genre = 'Poetry' OR (Genre <> 'Fantasy' AND Rating > 7) ORDER BY BookID",
        "tabelle": [
          {
            "naam": "tblBooks",
            "rye": [
              {
                "BookID": 1,
                "Genre": "Poetry",
                "Rating": 5,
                "Title": "Klein Gedigte"
              },
              {
                "BookID": 2,
                "Genre": "Fantasy",
                "Rating": 9,
                "Title": "Dragon Gate"
              },
              {
                "BookID": 3,
                "Genre": "Biography",
                "Rating": 8,
                "Title": "The Long Walk"
              },
              {
                "BookID": 4,
                "Genre": "Thriller",
                "Rating": 7,
                "Title": "Night Bus"
              },
              {
                "BookID": 5,
                "Genre": "Poetry",
                "Rating": 9,
                "Title": "Ocean Songs"
              },
              {
                "BookID": 6,
                "Genre": "Science",
                "Rating": 10,
                "Title": "Space Facts"
              }
            ]
          }
        ],
        "verwag": [
          [
            1
          ],
          [
            3
          ],
          [
            5
          ],
          [
            6
          ]
        ]
      }
    },
    "vak": "rtt",
    "verduideliking": "Afleidingsreël: skryf die versoek eers as groepe boeke wat ELK op die lys moet kom (groep 1 OF groep 2), en dan die voorwaardes binne elke groep wat SAAM moet geld. Groep 1 is al die 'Poetry'-boeke, sonder 'n gradering. Groep 2 is boeke wat nie 'Fantasy' is nie EN hoër as 7 gegradeer is. Die woord 'daarby' in die versoek beteken dus 'n OR tussen twee rye in Access, nie 'n AND nie. Die twee voorwaardes van groep 2 staan op dieselfde ry: <>\"Fantasy\" en >7. 'Poetry' staan op die 'or'-ry sonder 'n gradering, omdat die bibliotekaris ook die swak gegradeerde digbundels wil hê. Die 'Fantasy'-uitsluiting hoef nie op die 'Poetry'-ry nie, want 'n 'Poetry'-boek is nooit 'n 'Fantasy'-boek nie. Omdat die gradering 'n heelgetal is, is >=8 dieselfde as >7. Algemene foute: >7 ook op die 'Poetry'-ry sit (dan val die 'Poetry'-boeke met 'n gradering van 7 of laer uit), al die kriteria op een ry sit, en >=7 in plaas van >7.",
    "vlak": 3,
    "vraag": "Die biblioteek se tblBooks-tabel het onder andere die velde 'Title', 'Genre' en 'Rating' ('n heelgetal van 1 tot 10). Die bibliotekaris beskryf die vakansieleeslys so: \"Ek wil al ons digbundels ('Poetry') op die lys hê, ook dié wat swak gegradeer is. Daarby wil ek enige ander boek hê wat hoër as 7 gegradeer is, maar geen 'Fantasy'-boeke nie, want hulle het reeds hul eie uitstalling.\" Maak die qryReadingList-navraag, wat op die tblBooks-tabel gebaseer is, in 'Design View' oop. Ontleed die versoek, lei self af watter kriteria nodig is en hoe hulle in die ontwerprooster gekombineer moet word, en wysig die navraag sodat presies hierdie boeke vertoon word. Stoor en maak die navraag toe.",
    "vraestel": 1
  },
  {
    "antwoord": "MemberCode: Left([Surname],4)&Year([JoinDate])",
    "bron": {
      "bladsy": 13,
      "memo_bladsy": 10,
      "verwysing": "DBE Junie 2025 V1 V5.6"
    },
    "id": "rtt-v1-D05",
    "nasienriglyn": [
      {
        "kriterium": "Nuwe veld: MemberCode",
        "punte": 1
      },
      {
        "kriterium": "Funksie: `Left([Surname], …)`",
        "punte": 1
      },
      {
        "kriterium": "Aantal karakters: 4",
        "punte": 1
      },
      {
        "kriterium": "Funksie: &",
        "punte": 1
      }
    ],
    "onderwerp": "databasis",
    "punte": 4,
    "tipe": "formule",
    "toets": {
      "sql": {
        "sqlite": "SELECT MemberID, substr(Surname,1,4) || strftime('%Y', JoinDate) AS MemberCode FROM tblMembers ORDER BY MemberID",
        "tabelle": [
          {
            "naam": "tblMembers",
            "rye": [
              {
                "JoinDate": "2023-04-02",
                "MemberID": 1,
                "Surname": "Mokgadi"
              },
              {
                "JoinDate": "2024-11-20",
                "MemberID": 2,
                "Surname": "Fourie"
              },
              {
                "JoinDate": "2025-08-07",
                "MemberID": 3,
                "Surname": "Naidoo"
              }
            ]
          }
        ],
        "verwag": [
          [
            1,
            "Mokg2023"
          ],
          [
            2,
            "Four2024"
          ],
          [
            3,
            "Naid2025"
          ]
        ]
      }
    },
    "vak": "rtt",
    "verduideliking": "Die nuwe naam vervang `Expr1` voor die dubbelpunt. `Left([Surname],4)` neem die eerste vier karakters van die van; sonder die 4 neem Access net een letter. `Year([JoinDate])` haal die jaar uit die datum, en & heg die twee stukke aan mekaar. Die punte word gegee vir die nuwe naam, die `Left`-funksie op [Surname], die getal 4 en die &-teken. Algemene foute: + in plaas van & (met + probeer Access getalle optel en kan 'n fout gee), `Right` in plaas van `Left`, en om die naam by `Expr1` te laat staan of dit sonder dubbelpunt te tik.",
    "vlak": 2,
    "vraag": "Maak die qryMembers-navraag, wat op die tblMembers-tabel gebaseer is, in 'Design View' oop. Die tabel het onder andere die velde 'Surname' en 'JoinDate'. Iemand het reeds probeer om 'n kode vir elke lid te skep, maar die berekende veld lees tans net `Expr1: Left([Surname])`. Hernoem die berekende veld na 'MemberCode' en sorg dat 'n kombinasie van funksies 'n kode soos volg skep:\n• Die eerste vier letters van die van ('Surname'), gevolg deur\n• Die jaar van die 'JoinDate'-veld.\nStoor en maak die navraag toe.",
    "vraestel": 1
  },
  {
    "antwoord": "Klik 'Totals' (Σ) → Event: 'Total'-ry = 'Group By' → Points: 'Total'-ry = 'Avg' → 'Property Sheet' van die Points-kolom: 'Format' = 'Fixed' (OF 'Standard'), 'Decimal Places' = 2.",
    "bron": {
      "bladsy": 13,
      "memo_bladsy": 10,
      "verwysing": "DBE Junie 2025 V1 V5.5"
    },
    "id": "rtt-v1-D06",
    "nasienriglyn": [
      {
        "kriterium": "Event-veld: 'Group By'",
        "punte": 1
      },
      {
        "kriterium": "Points-veld: 'Avg'",
        "punte": 1
      },
      {
        "kriterium": "Points-veld: 'Format': 'Fixed' OF 'Standard'",
        "punte": 1
      }
    ],
    "onderwerp": "databasis",
    "punte": 3,
    "tipe": "stappe",
    "toets": {
      "sql": {
        "sqlite": "SELECT Event, ROUND(AVG(Points), 2) FROM tblResults GROUP BY Event ORDER BY Event",
        "tabelle": [
          {
            "naam": "tblResults",
            "rye": [
              {
                "Event": "Long Jump",
                "Points": 8,
                "ResultID": 1
              },
              {
                "Event": "100m",
                "Points": 6,
                "ResultID": 2
              },
              {
                "Event": "Long Jump",
                "Points": 5,
                "ResultID": 3
              },
              {
                "Event": "100m",
                "Points": 9,
                "ResultID": 4
              },
              {
                "Event": "100m",
                "Points": 7,
                "ResultID": 5
              },
              {
                "Event": "Long Jump",
                "Points": 6,
                "ResultID": 6
              }
            ]
          }
        ],
        "verwag": [
          [
            "100m",
            7.33
          ],
          [
            "Long Jump",
            6.33
          ]
        ]
      }
    },
    "vak": "rtt",
    "verduideliking": "Afleidingsreël: kyk na die getalle. Vir 100m is die punte 6, 9 en 7: die som is 22 en die telling 3, maar 22 ÷ 3 = 7.33, dus is dit die gemiddelde ('Avg'). Een ry per item beteken 'Group By' op 'Event'. Twee desimale plekke (7.33 en nie 7.3333… nie) beteken dat die formaat van die kolom gestel moet word. Met 'Totals' kry elke kolom 'n 'Total'-ry. 'Group By' op 'Event' laat elke item net een keer verskyn, en 'Avg' op 'Points' bereken die gemiddelde vir elke groep. Die formaat word in die 'Property Sheet' van die kolom gestel: 'Fixed' en 'Standard' wys albei 'n vaste getal desimale plekke en word albei aanvaar. Drie punte: 'Group By' op 'Event', 'Avg' op 'Points', en die formaat 'Fixed' of 'Standard'. Algemene foute: 'Sum' of 'Count' in plaas van 'Avg', 'Group By' op 'Points' laat staan (dan verskyn elke item baie keer), of die formaat in die tabel verander in plaas van in die navraag.",
    "vlak": 3,
    "vraag": "Die tblResults-tabel bevat die punte van elke atleet by die atletiek tussen die skool se huise, met onder andere die velde 'Event' en 'Points'. Die qryAverages-navraag, wat op die tblResults-tabel gebaseer is, wys tans elke resultaat op 'n eie ry:\n• 'Long Jump' 8 | 100m 6 | 'Long Jump' 5 | 100m 9 | 100m 7 | 'Long Jump' 6\nDie sportorganiseerder wil eerder 'n opsomming hê wat vir hierdie data presies so lyk:\n• 100m 7.33\n• 'Long Jump' 6.33\nVerander die navraag in 'Design View' sodat dit hierdie opsomming lewer. Lei self uit die getalle af watter berekening nodig is en hoe die resultaat vertoon moet word. Stoor en maak die navraag toe.",
    "vraestel": 1
  },
  {
    "antwoord": "<img src=\"ClubBadge.jpg\" alt=\"Badge\">",
    "bron": {
      "bladsy": 16,
      "memo_bladsy": 11,
      "verwysing": "DBE Junie 2025 V1 V6.1.2"
    },
    "id": "rtt-v1-H01",
    "nasienriglyn": [
      {
        "kriterium": "Uitbreiding van die lêer: .jpg",
        "punte": 1
      },
      {
        "kriterium": "Attribuut: alt=\"Badge\"",
        "punte": 1
      }
    ],
    "onderwerp": "html",
    "punte": 2,
    "tipe": "kode",
    "toets": {
      "html": {
        "kode": "<html><head><title>Chess Club</title></head><body><h1>Chess Club</h1><img src=\"ClubBadge.jpg\" alt=\"Badge\"></body></html>",
        "moet_bevat": [
          "src=\"ClubBadge.jpg\"",
          "alt=\"Badge\""
        ]
      }
    },
    "vak": "rtt",
    "verduideliking": "Die blaaier soek die lêer presies soos dit in `src` staan; sonder die uitbreiding .jpg bestaan daar nie so 'n lêer nie, en die prent wys nie. Die `alt`-attribuut gee die teks wat vertoon as die prent nie kan laai nie (sagteware wat die skerm hardop voorlees, lees dit ook). 'n Enkele woord soos 'Badge' hoef nie in aanhalingstekens te wees nie. Algemene foute: `title=` in plaas van `alt=` (`title` wys net 'n wenk as die muis oor die prent beweeg) of die verkeerde uitbreiding, soos .png vir 'n .jpg-lêer.",
    "vlak": 1,
    "vraag": "Die skaakklub se webblad gebruik die merker <img src=\"ClubBadge\">, maar die prent wys nie in die blaaier nie. Die lêer met die prent heet ClubBadge.jpg en staan in dieselfde gids. Redigeer die merker sodat die prent vertoon, en sodat die teks 'Badge' gewys word as die prent nie gelaai kan word nie.",
    "vraestel": 1
  },
  {
    "antwoord": "<h2>Results</h2>\n<hr size=\"6\" color=\"silver\">",
    "bron": {
      "bladsy": 16,
      "memo_bladsy": 11,
      "verwysing": "DBE Junie 2025 V1 V6.1.5"
    },
    "id": "rtt-v1-H02",
    "nasienriglyn": [
      {
        "kriterium": "<hr>-merker ingevoeg",
        "punte": 1
      },
      {
        "kriterium": "Attribuut: size=\"6\"",
        "punte": 1
      },
      {
        "kriterium": "Attribuut: color=\"silver\"",
        "punte": 1
      }
    ],
    "onderwerp": "html",
    "punte": 3,
    "tipe": "kode",
    "toets": {
      "html": {
        "kode": "<html><head><title>Art Show</title></head><body><h2>Results</h2><hr size=\"6\" color=\"silver\"><p>Winners will be announced on Friday.</p></body></html>",
        "moet_bevat": [
          "<hr",
          "size=\"6\"",
          "color=\"silver\""
        ]
      }
    },
    "vak": "rtt",
    "verduideliking": "Die merker vir 'n horisontale lyn is <hr>. Dit is 'n leë merker, dus is daar geen sluitingsmerker nodig nie (<hr/> word ook aanvaar). Die dikte van die lyn word met die attribuut `size` gestel en die kleur met `color`. Die name van kleure, soos 'silver', word in Engels gespel. Drie punte: die <hr>-merker, size=\"6\" en color=\"silver\". Algemene foute: `width=` in plaas van `size=` (`width` bepaal hoe lank die lyn is, nie hoe dik nie), die Afrikaanse woord vir die kleur, of 'n sluitingsmerker </hr> wat nie bestaan nie.",
    "vlak": 2,
    "vraag": "Op die webblad van die skool se kunsuitstalling staan die opskrif `<h2>Results</h2>`. Verander die HTML-kode om direk onder hierdie opskrif 'n horisontale lyn met 'n dikte van 6 en 'n silwer kleur te vertoon.",
    "vraestel": 1
  },
  {
    "antwoord": "<ol type=\"I\">\n<li>Opening speech</li>\n<li>Rebuttal</li>\n<li>Closing speech</li>\n</ol>",
    "bron": {
      "bladsy": 14,
      "memo_bladsy": 12,
      "verwysing": "DBE Nov 2023 V1 V6.1.5"
    },
    "id": "rtt-v1-H03",
    "nasienriglyn": [
      {
        "kriterium": "<ul> verander na <ol> (oop- en sluitingsmerkers)",
        "punte": 1
      },
      {
        "kriterium": "Attribuut: type=\"I\"",
        "punte": 1
      }
    ],
    "onderwerp": "html",
    "punte": 2,
    "tipe": "kode",
    "toets": {
      "html": {
        "kode": "<html><head><title>Debating</title></head><body><h1>Debate Order</h1><ol type=\"I\"><li>Opening speech</li><li>Rebuttal</li><li>Closing speech</li></ol></body></html>",
        "moet_bevat": [
          "<ol type=\"I\">",
          "</ol>"
        ]
      }
    },
    "vak": "rtt",
    "verduideliking": "Afleidingsreël: as die blaaier self moet nommer, is dit 'n geordende lys; vergelyk dan die verlangde nommers met elke moontlike waarde van 'type' en skrap elke waarde wat nie presies pas nie of wat bots met nommering wat reeds op die blad gebruik word. Toegepas: die derde nota sluit handgetikte nommers uit, dus word <ul> 'n <ol>. Van die vyf waardes vir 'type' gee \"1\" getalle (bots met die rondtes), \"A\" en \"a\" gee letters (bots met die spanne en pas nie by 'Speech II' nie), en \"i\" gee kleinletters 'i, ii, iii' (pas nie by die puntestaat nie). Net \"I\" bly oor. 'n Genommerde lys is 'n geordende lys: <ol> in plaas van <ul> (wat kolletjies gee). BEIDE die oop- en die sluitingsmerker moet verander, anders pas die merkers nie by mekaar nie. Die attribuut `type` bepaal die soort nommers: \"1\" (getalle), \"A\" of \"a\" (letters) en \"I\" of \"i\" (Romeinse syfers). 'n Hoofletter `I` gee `I, II, III`. Die <li>-merkers bly dieselfde. Algemene foute: net <ul> verander en </ul> laat staan, type=\"i\" (dit gee kleinletters `i, ii, iii`), of die nommers self in die teks tik.",
    "vlak": 3,
    "vraag": "Die webblad van die debatsklub bevat die volgende lys:\n`<ul>\n<li>Opening speech</li>\n<li>Rebuttal</li>\n<li>Closing speech</li>\n</ul>`\nDie sekretaris stuur hierdie notas oor die lys:\n• Op die beoordelaars se puntestaat heet die toesprake 'Speech I', 'Speech II' en 'Speech III'. Die webblad moet presies dieselfde nommers langs die toesprake wys.\n• Elders op die blad is die rondtes reeds met 1, 2 en 3 genommer en die spanne met A en B. Niemand mag die toesprake met 'n rondte of 'n span verwar nie.\n• Die lys word elke week aangepas, dus mag niemand nommers met die hand in die items tik nie; die blaaier moet self nommer.\nOntleed die notas en lei self af watter merker en watter attribuutwaarde die lys nodig het. Skryf dan die verbeterde HTML-kode vir die lys.",
    "vraestel": 1
  },
  {
    "antwoord": "<table border=\"1\" cellpadding=\"10\">\n<tr><td rowspan=\"2\">Weekend Special</td><td>Friday</td></tr>\n<tr><td>Saturday</td></tr>\n<tr><td>Includes:<ul type=\"square\"><li>Breakfast</li><li>Pool</li></ul></td></tr>\n</table>",
    "bron": {
      "bladsy": 14,
      "memo_bladsy": 13,
      "verwysing": "DBE Nov 2024 V1 V6.1.3"
    },
    "id": "rtt-v1-H04",
    "nasienriglyn": [
      {
        "kriterium": "Attribuut: `cellpadding`",
        "punte": 1
      },
      {
        "kriterium": "Grootte: 10",
        "punte": 1
      },
      {
        "kriterium": "Attribuut: `rowspan` (op 'Weekend Special')",
        "punte": 1
      },
      {
        "kriterium": "Grootte: 2",
        "punte": 1
      },
      {
        "kriterium": "<ol> verander na <ul>",
        "punte": 1
      },
      {
        "kriterium": "Attribuut: type=\"square\"",
        "punte": 1
      }
    ],
    "onderwerp": "html",
    "punte": 6,
    "tipe": "kode",
    "toets": {
      "html": {
        "kode": "<html><head><title>Resort</title></head><body><table border=\"1\" cellpadding=\"10\"><tr><td rowspan=\"2\">Weekend Special</td><td>Friday</td></tr><tr><td>Saturday</td></tr><tr><td>Includes:<ul type=\"square\"><li>Breakfast</li><li>Pool</li></ul></td></tr></table></body></html>",
        "moet_bevat": [
          "cellpadding=\"10\"",
          "<td rowspan=\"2\">Weekend Special",
          "<ul type=\"square\">",
          "</ul>"
        ]
      }
    },
    "vak": "rtt",
    "verduideliking": "Afleidingsreël: ruimte BINNE die sel is 'padding', ruimte TUSSEN selle is 'spacing'; 'n sel wat langs twee rye staan, strek oor rye ('rowspan'), en omdat die tweede ry reeds net een <td> het, moet die eerste sel van ry 1 strek; 'nie meer genommer nie' beteken 'n ongeordende lys, en die vorm van die kolletjie word met 'type' gestel. Drie veranderinge, elk vir twee punte. (1) `cellpadding` is die spasie tussen die teks en die rand van die sel; `cellspacing` is die spasie TUSSEN selle en is dus verkeerd. (2) `rowspan=\"2\"` laat die sel oor twee rye strek; daarom het die tweede ry net een <td> nodig. `colspan=` sou die sel oor kolomme laat strek, wat verkeerd is. (3) 'n Lys met kolletjies is 'n ongeordende lys: verander <ol> na <ul> (oop- en sluitingsmerker), en stel die vorm van die kolletjies met type=\"square\". Algemene foute: `rowspan` op die verkeerde sel sit, net <ol> bo-aan verander en die sluitingsmerker </ol> laat staan, of type=\"square\" op die <ol>-merker laat staan.",
    "vlak": 2,
    "vraag": "Die webblad van 'n vakansieoord bevat die volgende tabel:\n`<table border=\"1\">\n<tr><td>Weekend Special</td><td>Friday</td></tr>\n<tr><td>Saturday</td></tr>\n<tr><td>Includes:<ol><li>Breakfast</li><li>Pool</li></ol></td></tr>\n</table>`\nDie eienaar is nie tevrede met hoe die tabel in die blaaier lyk nie. Verander die kode sodat:\n• daar binne elke sel 10 'pixels' ruimte rondom die teks is (die afstand tussen die selle self bly onveranderd);\n• 'Weekend Special' een hoë sel aan die linkerkant vorm, langs albei die dae, met 'Saturday' reg onder 'Friday';\n• die items in die laaste ry nie meer genommer is nie, maar elkeen met 'n klein vierkantjie begin.\nLei uit die huidige kode af watter attribute en merkers jy moet byvoeg of verander.",
    "vraestel": 1
  },
  {
    "antwoord": "'Mailings' → 'Start Mail Merge' → 'Letters' → 'Select Recipients' → 'Use an Existing List' → kies die 'Fees'-sigblad (en die regte werkblad) → 'Edit Recipient List' → 'Filter': 'Outstanding' 'Equal to' 'Yes' → kies <<NAME>> → 'Insert Merge Field' → 'ParentName' → stoor 'Reminder' → 'Finish & Merge' → 'Edit Individual Documents' → 'All' → stoor die nuwe dokument as 'RemindersMerged'.",
    "bron": {
      "bladsy": 16,
      "memo_bladsy": 15,
      "verwysing": "DBE Nov 2024 V1 V7.1"
    },
    "id": "rtt-v1-A01",
    "nasienriglyn": [
      {
        "kriterium": "Possamevoeging gebruik: 'Fees' gekoppel aan 'Reminder'",
        "punte": 1
      },
      {
        "kriterium": "Filter: 'Outstanding' = 'Yes'",
        "punte": 1
      },
      {
        "kriterium": "Saamvoegveld ingevoeg: 'ParentName'",
        "punte": 1
      },
      {
        "kriterium": "Samevoeging voltooi",
        "punte": 1
      },
      {
        "kriterium": "Gestoor as 'RemindersMerged'",
        "punte": 1
      }
    ],
    "onderwerp": "algemeen",
    "punte": 5,
    "tipe": "stappe",
    "toets": {
      "handmatig": "Open 'RemindersMerged': daar moet presies een brief wees vir elke ry in 'Fees' waar 'Outstanding' 'Yes' is, met die naam van die ouer in die plek van <<NAME>>. In 'Reminder' wys Alt+F9 die veld { MERGEFIELD ParentName }, en 'Edit Recipient List' wys die filter."
    },
    "vak": "rtt",
    "verduideliking": "Possamevoeging koppel een dokument aan 'n lys ontvangers en maak een brief per ry. Die filter in 'Edit Recipient List' sorg dat net die rye met 'Yes' in 'Outstanding' gebruik word; as jy dit vergeet, kry elke ouer 'n brief. Die veld <<ParentName>> word met 'Insert Merge Field' ingevoeg, nie oorgetik nie: getikte << en >> is net gewone teks. 'Finish & Merge' → 'Edit Individual Documents' skep die nuwe dokument met al die briewe, en DAARDIE dokument word as 'RemindersMerged' gestoor. Vyf punte: koppeling, filter, saamvoegveld, samevoeging voltooi, en die regte lêernaam. Algemene foute: die 'Reminder'-dokument self as 'RemindersMerged' stoor (dan is daar geen samevoeging nie), of handmatig die rye uit die sigblad uitvee in plaas van te filter.",
    "vlak": 2,
    "vraag": "Die skool stuur 'n herinneringsbrief aan ouers wat nog skoolfonds skuld. Gebruik possamevoeging ('mail merge') soos volg:\n• Slegs ouers by wie die 'Outstanding'-veld 'Yes' is, moet 'n brief ontvang.\n• Gebruik die 'Fees'-sigblad as die databron ('data source') vir die 'Reminder'-dokument.\n• Vervang die teks <<NAME>> met die 'ParentName'-veld.\n• Stoor die 'Reminder'-dokument, maar moenie dit toemaak nie.\n• Voltooi die samevoeging en stoor die nuwe dokument as 'RemindersMerged'.",
    "vraestel": 1
  },
  {
    "antwoord": "=AND(B6<>\"Yes\",F6<>\"Convenor\",G6<>\"Convenor\")\nOF\n=AND(B6=\"No\",F6<>\"Convenor\",G6<>\"Convenor\")",
    "bron": {
      "bladsy": 18,
      "memo_bladsy": 13,
      "verwysing": "DBE Junie 2025 V1 V7.2"
    },
    "id": "rtt-v1-A02",
    "nasienriglyn": [
      {
        "kriterium": "Bewerkingsteken: <>",
        "punte": 1
      },
      {
        "kriterium": "B6<>\"Yes\" OF B6=\"No\"",
        "punte": 1
      },
      {
        "kriterium": "F6<>\"Convenor\"",
        "punte": 1
      },
      {
        "kriterium": "G6<>\"Convenor\"",
        "punte": 1
      }
    ],
    "onderwerp": "algemeen",
    "punte": 4,
    "tipe": "formule",
    "toets": {
      "formule": {
        "blaaie": {
          "Komitee": {
            "B6": "No",
            "B7": "No",
            "B8": "Yes",
            "E6": "Convenor",
            "E7": "Member",
            "E8": "Member",
            "F6": "Member",
            "F7": "Convenor",
            "F8": "Member",
            "G6": "Member",
            "G7": "Member",
            "G8": "Member"
          }
        },
        "selle": [
          {
            "blad": "Komitee",
            "formule": "=AND(B6<>\"Yes\",F6<>\"Convenor\",G6<>\"Convenor\")",
            "sel": "H6",
            "verwag": "TRUE"
          },
          {
            "blad": "Komitee",
            "formule": "=AND(B7=\"No\",F7<>\"Convenor\",G7<>\"Convenor\")",
            "sel": "H7",
            "verwag": "FALSE"
          },
          {
            "blad": "Komitee",
            "formule": "=AND(B8<>\"Yes\",F8<>\"Convenor\",G8<>\"Convenor\")",
            "sel": "H8",
            "verwag": "FALSE"
          }
        ]
      }
    },
    "vak": "rtt",
    "verduideliking": "Afleidingsreël: die afkeurreël is 'graad 12-klas OF sameroeper in jaar 1 OF sameroeper in jaar 2'. 'Mag dien' is die teenoorgestelde daarvan, en die teenoorgestelde van 'X OF Y OF Z' is 'nie X EN nie Y EN nie Z'. Daarom word die OF'e 'n AND, en elke = word <>. Die twee jaar direk voor 2027 is 2025 en 2026, dus kolomme F en G; kolom E (2024) is nie ter sake nie, want wie net vroeër sameroeper was, mag dien. So kry jy B6<>\"Yes\", F6<>\"Convenor\" en G6<>\"Convenor\" binne een AND. AND gee TRUE net as AL die voorwaardes waar is. Vir kolom B is B6=\"No\" dieselfde as B6<>\"Yes\", omdat daar net twee moontlike waardes is. Vier punte: die <>-teken, die toets vir kolom B, die toets vir F6, en die toets vir G6. Algemene foute: die afkeurreël net oorskryf as =AND(B6=\"Yes\",F6=\"Convenor\",G6=\"Convenor\") (dit gee TRUE net vir iemand wat aan AL die afkeurredes voldoen), OR in plaas van AND (dan is een 'Convenor'-jaar genoeg om deur te kom), kolom E ook toets (dan word iemand wat net in 2024 sameroeper was verkeerdelik afgekeur), of net een van die twee jare toets.",
    "vlak": 3,
    "vraag": "Die Komitee-werkblad lys die personeel wat moontlik kan dien in die komitee wat die 2027-matriekafskeid reël. Kolom B toon of die persoon 'n graad 12-klasonderwyser is ('Yes' of 'No'), en kolomme E, F en G toon die persoon se rol in 2024, 2025 en 2026 (bv. 'Member' of 'Convenor'). Die hoof het die reël as 'n AFKEURREËL gestel: 'n personeellid word afgekeur as die persoon 'n graad 12-klas het, of as die persoon in een van die twee jaar direk voor 2027 die sameroeper ('Convenor') was. Wie net vroeër sameroeper was, word nie afgekeur nie. Sel H6 moet egter TRUE wys vir 'n persoon wat MAG dien, en jy mag net een AND-funksie gebruik (geen OR, NOT of IF nie). Ontleed die afkeurreël, besluit watter kolomme ter sake is, en voeg die AND-funksie in sel H6 in vir die personeellid in ry 6.",
    "vraestel": 1
  }
];
