/* Amptelike DBE-vraestelle vir die oorblywende vakke (21 Okt 2026): RTT V2 (teorie), Toerisme, Gasvryheidstudie,
   Engels EAT V1 (taal) en Afrikaans HT V1 (taal). GEEN DBE-LÊER IN DIE REPO NIE (kopiereg): net die amptelike skakels.

   Gebou deur wallie-rag/scripts/katalogus.py (buite die repo) uit die DBE-korpus: 7 sessies, Mei/Junie 2023 tot
   Mei/Junie 2026, education.gov.za. Elke vraestel- en memo-skakel is op 21 Okt afgelaai (HTTP 200, application/pdf).
   Uitgesluit, nooit geraai nie: DBE-duplikate (verkeerde lêer agter die skakel), memo's sonder teks, Word-memo's.
   Punte per vraag uit die memo se [..]-totale, teen die vaste struktuur:
     RTT V2 150       = A 25 (V1-3) + B 75 (V4-8) + C 50 (V9-10)
     Toerisme 200     = A 40 (V1) + B 50 (V2-3) + C 50 (V4-6) + D 30 (V7-8) + E 30 (V9-10)
     Gasvryheid 200   = A 40 (V1) + B 20 (V2) + C 80 (V3-4) + D 60 (V5-6)
     Engels V1 80     = A 30 (V1) + B 10 (V2) + C 40 (V3 10, V4 10, V5 20)
     Afrikaans V1 70  = A 30 (V1) + B 10 (V2) + C 30 (V3-5)
   Laai NA dbe-vraestelle.js. Nie in ORDE nie (net RTT V1 roteer). */
(function () {
  const K = window.WALLIE && window.WALLIE.DBE && window.WALLIE.DBE.KATALOGUS;
  if (!K) return;
  Object.assign(K, {
    "dbe-2026-jun-afr-v1": {
      id: "dbe-2026-jun-afr-v1",
      vak: "afrikaans",
      titel: "DBE Mei/Junie 2026 Afrikaans HT V1 (taal) (Afr)",
      vraestel: "https://www.education.gov.za/LinkClick.aspx?fileticket=2VGf0Wr0vwI%3d&tabid=5956&portalid=0&mid=15108",
      memo: "https://www.education.gov.za/LinkClick.aspx?fileticket=PKg9z5tuAug%3d&tabid=5956&portalid=0&mid=15108",
      vrae: [30, 10, 10, 10, 10]
    },
    "dbe-2025-nov-afr-v1": {
      id: "dbe-2025-nov-afr-v1",
      vak: "afrikaans",
      titel: "DBE November 2025 Afrikaans HT V1 (taal) (Afr)",
      vraestel: "https://www.education.gov.za/LinkClick.aspx?fileticket=-ndziWymKSo%3d&tabid=5742&portalid=0&mid=14812",
      memo: "https://www.education.gov.za/LinkClick.aspx?fileticket=IrUS0WtPgbM%3d&tabid=5742&portalid=0&mid=14812",
      vrae: [30, 10, 10, 10, 10]
    },
    "dbe-2025-jun-eng-v1": {
      id: "dbe-2025-jun-eng-v1",
      vak: "engels",
      titel: "DBE Mei/Junie 2025 English FAL P1",
      vraestel: "https://www.education.gov.za/LinkClick.aspx?fileticket=GcoicJwVMrY%3d&tabid=5475&portalid=0&mid=14212",
      memo: "https://www.education.gov.za/LinkClick.aspx?fileticket=bNUEZxAOnzo%3d&tabid=5475&portalid=0&mid=14212",
      vrae: [30, 10, 10, 10, 20]
    },
    "dbe-2024-nov-eng-v1": {
      id: "dbe-2024-nov-eng-v1",
      vak: "engels",
      titel: "DBE November 2024 English FAL P1",
      vraestel: "https://www.education.gov.za/LinkClick.aspx?fileticket=ZJZsyNpCu9Y%3d&tabid=5193&portalid=0&mid=13691",
      memo: "https://www.education.gov.za/LinkClick.aspx?fileticket=DLSKutp56QU%3d&tabid=5193&portalid=0&mid=13691",
      vrae: [30, 10, 10, 10, 20]
    },
    "dbe-2024-jun-eng-v1": {
      id: "dbe-2024-jun-eng-v1",
      vak: "engels",
      titel: "DBE Mei/Junie 2024 English FAL P1",
      vraestel: "https://www.education.gov.za/LinkClick.aspx?fileticket=NjE60hPnGFo%3d&tabid=4933&portalid=0&mid=13114",
      memo: "https://www.education.gov.za/LinkClick.aspx?fileticket=06M5u0PGwMU%3d&tabid=4933&portalid=0&mid=13114",
      vrae: [30, 10, 10, 10, 20]
    },
    "dbe-2023-nov-eng-v1": {
      id: "dbe-2023-nov-eng-v1",
      vak: "engels",
      titel: "DBE November 2023 English FAL P1",
      vraestel: "https://www.education.gov.za/LinkClick.aspx?fileticket=rzKvzSdEjAU%3d&tabid=4682&portalid=0&mid=12648",
      memo: "https://www.education.gov.za/LinkClick.aspx?fileticket=AYG7HqfFU9g%3d&tabid=4682&portalid=0&mid=12648",
      vrae: [30, 10, 10, 10, 20]
    },
    "dbe-2023-jun-eng-v1": {
      id: "dbe-2023-jun-eng-v1",
      vak: "engels",
      titel: "DBE Mei/Junie 2023 English FAL P1",
      vraestel: "https://www.education.gov.za/LinkClick.aspx?fileticket=P1TaC8Wb0Xs%3d&tabid=4504&portalid=0&mid=12284",
      memo: "https://www.education.gov.za/LinkClick.aspx?fileticket=QFD_ILsTbOE%3d&tabid=4504&portalid=0&mid=12284",
      vrae: [30, 10, 10, 10, 20]
    },
    "dbe-2026-jun-gas": {
      id: "dbe-2026-jun-gas",
      vak: "gasvryheid",
      titel: "DBE Mei/Junie 2026 Gasvryheidstudie (Afr)",
      vraestel: "https://www.education.gov.za/LinkClick.aspx?fileticket=ZsRm6UoniBU%3d&tabid=5956&portalid=0&mid=15137",
      memo: "https://www.education.gov.za/LinkClick.aspx?fileticket=nVXHotmC9Ck%3d&tabid=5956&portalid=0&mid=15137",
      vrae: [40, 20, 40, 40, 30, 30]
    },
    "dbe-2025-jun-gas": {
      id: "dbe-2025-jun-gas",
      vak: "gasvryheid",
      titel: "DBE Mei/Junie 2025 Gasvryheidstudie (Afr)",
      vraestel: "https://www.education.gov.za/LinkClick.aspx?fileticket=hXQyKHBEThk%3d&tabid=5475&portalid=0&mid=14240",
      memo: "https://www.education.gov.za/LinkClick.aspx?fileticket=atBKS2O_AR0%3d&tabid=5475&portalid=0&mid=14240",
      vrae: [40, 20, 40, 40, 30, 30]
    },
    "dbe-2024-nov-gas": {
      id: "dbe-2024-nov-gas",
      vak: "gasvryheid",
      titel: "DBE November 2024 Gasvryheidstudie (Afr)",
      vraestel: "https://www.education.gov.za/LinkClick.aspx?fileticket=9anaFYADLEY%3d&tabid=5193&portalid=0&mid=13719",
      memo: "https://www.education.gov.za/LinkClick.aspx?fileticket=_VOSmWPQuks%3d&tabid=5193&portalid=0&mid=13719",
      vrae: [40, 20, 40, 40, 30, 30]
    },
    "dbe-2023-nov-gas": {
      id: "dbe-2023-nov-gas",
      vak: "gasvryheid",
      titel: "DBE November 2023 Gasvryheidstudie (Afr)",
      vraestel: "https://www.education.gov.za/LinkClick.aspx?fileticket=raxhHls5gfA%3d&tabid=4682&portalid=0&mid=12676",
      memo: "https://www.education.gov.za/LinkClick.aspx?fileticket=tZqvO-61zs8%3d&tabid=4682&portalid=0&mid=12676",
      vrae: [40, 20, 40, 40, 30, 30]
    },
    "dbe-2023-jun-gas": {
      id: "dbe-2023-jun-gas",
      vak: "gasvryheid",
      titel: "DBE Mei/Junie 2023 Gasvryheidstudie (Afr)",
      vraestel: "https://www.education.gov.za/LinkClick.aspx?fileticket=9evA7Nlv6N4%3d&tabid=4504&portalid=0&mid=12312",
      memo: "https://www.education.gov.za/LinkClick.aspx?fileticket=VYbQljQeMgU%3d&tabid=4504&portalid=0&mid=12312",
      vrae: [40, 20, 40, 40, 30, 30]
    },
    "dbe-2026-jun-rtt-v2": {
      id: "dbe-2026-jun-rtt-v2",
      vak: "rtt",
      titel: "DBE Mei/Junie 2026 RTT V2 (teorie) (Afr)",
      vraestel: "https://www.education.gov.za/LinkClick.aspx?fileticket=UPiuMnHE6yg%3d&tabid=5956&portalid=0&mid=15127",
      memo: "https://www.education.gov.za/LinkClick.aspx?fileticket=mNwYRt8me8s%3d&tabid=5956&portalid=0&mid=15127",
      vrae: [10, 10, 5, 25, 15, 10, 10, 15, 25, 25]
    },
    "dbe-2025-nov-rtt-v2": {
      id: "dbe-2025-nov-rtt-v2",
      vak: "rtt",
      titel: "DBE November 2025 RTT V2 (teorie) (Afr)",
      vraestel: "https://www.education.gov.za/LinkClick.aspx?fileticket=FjnXTA_KMB8%3d&tabid=5742&portalid=0&mid=14831",
      memo: "https://www.education.gov.za/LinkClick.aspx?fileticket=nSEwGvgHCps%3d&tabid=5742&portalid=0&mid=14831",
      vrae: [10, 10, 5, 25, 15, 10, 10, 15, 25, 25]
    },
    "dbe-2025-jun-rtt-v2": {
      id: "dbe-2025-jun-rtt-v2",
      vak: "rtt",
      titel: "DBE Mei/Junie 2025 RTT V2 (teorie) (Afr)",
      vraestel: "https://www.education.gov.za/LinkClick.aspx?fileticket=0H5LD6G7EM4%3d&tabid=5475&portalid=0&mid=14230",
      memo: "https://www.education.gov.za/LinkClick.aspx?fileticket=L9oGxHDkF_E%3d&tabid=5475&portalid=0&mid=14230",
      vrae: [10, 10, 5, 25, 15, 10, 10, 15, 25, 25]
    },
    "dbe-2024-nov-rtt-v2": {
      id: "dbe-2024-nov-rtt-v2",
      vak: "rtt",
      titel: "DBE November 2024 RTT V2 (teorie) (Afr)",
      vraestel: "https://www.education.gov.za/LinkClick.aspx?fileticket=N-u6aB9Cdo0%3d&tabid=5193&portalid=0&mid=13709",
      memo: "https://www.education.gov.za/LinkClick.aspx?fileticket=4ABlXX_yDa4%3d&tabid=5193&portalid=0&mid=13709",
      vrae: [10, 10, 5, 25, 15, 10, 10, 15, 25, 25]
    },
    "dbe-2024-jun-rtt-v2": {
      id: "dbe-2024-jun-rtt-v2",
      vak: "rtt",
      titel: "DBE Mei/Junie 2024 RTT V2 (teorie) (Afr)",
      vraestel: "https://www.education.gov.za/LinkClick.aspx?fileticket=HiXeg2PsvMM%3d&tabid=4933&portalid=0&mid=13132",
      memo: "https://www.education.gov.za/LinkClick.aspx?fileticket=TkB6bqmgmmk%3d&tabid=4933&portalid=0&mid=13132",
      vrae: [10, 10, 5, 25, 15, 10, 10, 15, 25, 25]
    },
    "dbe-2023-nov-rtt-v2": {
      id: "dbe-2023-nov-rtt-v2",
      vak: "rtt",
      titel: "DBE November 2023 RTT V2 (teorie) (Afr)",
      vraestel: "https://www.education.gov.za/LinkClick.aspx?fileticket=LXyob4Rnrg4%3d&tabid=4682&portalid=0&mid=12666",
      memo: "https://www.education.gov.za/LinkClick.aspx?fileticket=p-ijIY0fZJE%3d&tabid=4682&portalid=0&mid=12666",
      vrae: [10, 10, 5, 25, 15, 10, 10, 15, 25, 25]
    },
    "dbe-2023-jun-rtt-v2": {
      id: "dbe-2023-jun-rtt-v2",
      vak: "rtt",
      titel: "DBE Mei/Junie 2023 RTT V2 (teorie) (Afr)",
      vraestel: "https://www.education.gov.za/LinkClick.aspx?fileticket=PR_QToRBkKY%3d&tabid=4504&portalid=0&mid=12302",
      memo: "https://www.education.gov.za/LinkClick.aspx?fileticket=5kdWiP8WCho%3d&tabid=4504&portalid=0&mid=12302",
      vrae: [10, 10, 5, 25, 15, 10, 10, 15, 25, 25]
    },
    "dbe-2026-jun-toer": {
      id: "dbe-2026-jun-toer",
      vak: "toerisme",
      titel: "DBE Mei/Junie 2026 Toerisme (Afr)",
      vraestel: "https://www.education.gov.za/LinkClick.aspx?fileticket=46xelsorp_I%3d&tabid=5956&portalid=0&mid=15150",
      memo: "https://www.education.gov.za/LinkClick.aspx?fileticket=ervF2stABIs%3d&tabid=5956&portalid=0&mid=15150",
      vrae: [40, 32, 18, 28, 12, 10, 16, 14, 20, 10]
    },
    "dbe-2025-nov-toer": {
      id: "dbe-2025-nov-toer",
      vak: "toerisme",
      titel: "DBE November 2025 Toerisme (Afr)",
      vraestel: "https://www.education.gov.za/LinkClick.aspx?fileticket=7SEHgzet6vs%3d&tabid=5742&portalid=0&mid=14852",
      memo: "https://www.education.gov.za/LinkClick.aspx?fileticket=eoG099jbATM%3d&tabid=5742&portalid=0&mid=14852",
      vrae: [40, 37, 13, 30, 12, 8, 16, 14, 20, 10]
    },
    "dbe-2025-jun-toer": {
      id: "dbe-2025-jun-toer",
      vak: "toerisme",
      titel: "DBE Mei/Junie 2025 Toerisme (Afr)",
      vraestel: "https://www.education.gov.za/LinkClick.aspx?fileticket=ow6GraSU1yg%3d&tabid=5475&portalid=0&mid=14251",
      memo: "https://www.education.gov.za/LinkClick.aspx?fileticket=OW7Y3ZiU5gI%3d&tabid=5475&portalid=0&mid=14251",
      vrae: [40, 36, 14, 32, 10, 8, 21, 9, 22, 8]
    },
    "dbe-2024-nov-toer": {
      id: "dbe-2024-nov-toer",
      vak: "toerisme",
      titel: "DBE November 2024 Toerisme (Afr)",
      vraestel: "https://www.education.gov.za/LinkClick.aspx?fileticket=xwai1AvzPeU%3d&tabid=5193&portalid=0&mid=13732",
      memo: "https://www.education.gov.za/LinkClick.aspx?fileticket=pvMivazn0Hw%3d&tabid=5193&portalid=0&mid=13732",
      vrae: [40, 36, 14, 30, 10, 10, 12, 18, 20, 10]
    },
    "dbe-2024-jun-toer": {
      id: "dbe-2024-jun-toer",
      vak: "toerisme",
      titel: "DBE Mei/Junie 2024 Toerisme (Afr)",
      vraestel: "https://www.education.gov.za/LinkClick.aspx?fileticket=KzuGczaNdJE%3d&tabid=4933&portalid=0&mid=13153",
      memo: "https://www.education.gov.za/LinkClick.aspx?fileticket=yENJtYyLQoE%3d&tabid=4933&portalid=0&mid=13153",
      vrae: [40, 42, 8, 32, 8, 10, 14, 16, 20, 10]
    },
    "dbe-2023-nov-toer": {
      id: "dbe-2023-nov-toer",
      vak: "toerisme",
      titel: "DBE November 2023 Toerisme (Afr)",
      vraestel: "https://www.education.gov.za/LinkClick.aspx?fileticket=9XVVgLiN770%3d&tabid=4682&portalid=0&mid=12689",
      memo: "https://www.education.gov.za/LinkClick.aspx?fileticket=IpSsuwxyi3c%3d&tabid=4682&portalid=0&mid=12689",
      vrae: [40, 28, 22, 24, 16, 10, 10, 20, 10, 20]
    },
    "dbe-2023-jun-toer": {
      id: "dbe-2023-jun-toer",
      vak: "toerisme",
      titel: "DBE Mei/Junie 2023 Toerisme (Afr)",
      vraestel: "https://www.education.gov.za/LinkClick.aspx?fileticket=R5pWA87HK3Y%3d&tabid=4504&portalid=0&mid=12325",
      memo: "https://www.education.gov.za/LinkClick.aspx?fileticket=clyab1JjcMQ%3d&tabid=4504&portalid=0&mid=12325",
      vrae: [40, 36, 14, 32, 8, 10, 14, 16, 24, 6]
    }
  });

  /* Omruil-groepe (soos Wisk. Gel., PR #42): die app vra by elke beplande vraestel of Wallie dit al gedoen het.
     Elke beplande vraestel kry sy EIE vervangers wat nêrens anders in die rooster gebruik word nie; waar daar geen
     ongebruikte vraestel oor is nie (al 5 Gasvryheid, Jun 2024 Engels V1, Jun 2026 Wisk. Gel. V2), is die groep net
     die vraestel self: die app vra steeds, teken die antwoord aan, en sê "doen dit weer onder eksamentoestande".
     Hek: tests/roete.test.js (geen herhaling nie, ook nie ná enige kombinasie van omruil-antwoorde nie). */
  const R = window.WALLIE.DBE.ruil;
  if (R && Array.isArray(R.GROEPE)) {
    R.GROEPE.push(
      ["dbe-2026-jun-rtt-v2", "dbe-2024-nov-rtt-v2"],
      ["dbe-2025-nov-rtt-v2", "dbe-2024-jun-rtt-v2"],
      ["dbe-2025-jun-rtt-v2", "dbe-2023-nov-rtt-v2", "dbe-2023-jun-rtt-v2"],
      ["dbe-2025-jun-eng-v1", "dbe-2023-nov-eng-v1"],
      ["dbe-2024-nov-eng-v1", "dbe-2023-jun-eng-v1"],
      ["dbe-2026-jun-toer", "dbe-2025-nov-toer", "dbe-2025-jun-toer"],
      ["dbe-2024-jun-eng-v1"],
      ["dbe-2026-jun-gas"],
      ["dbe-2025-jun-gas"],
      ["dbe-2024-nov-gas"],
      ["dbe-2023-nov-gas"],
      ["dbe-2023-jun-gas"],
      ["dbe-2026-jun-wg-v2"]
    );
  }
})();
