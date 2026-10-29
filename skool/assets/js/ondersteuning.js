/* Realtyd-ondersteuning (24 Okt 2026): kyk die werk wat die app op die skerm sit na vóórdat die leerder
   begin — teen die DBE-spesifikasie, die RAG-korpus se punte per vraag, die herhaling-register en die
   formaat-reëls (docs/superpowers/specs/2026-09-27-wallie-911-pro-design.md §2 en §5).

   LEES NET. Hierdie lêer skryf niks: geen localStorage, geen Supabase, geen nuwe event-soort nie
   (AGENTS.md §2.2/§2.3). Dit gee net 'n oordeel terug sodat die skerm dit kan wys.

   WALLIE.ONDERSTEUNING.kontroleer(werk, blok) → {
     vlak: "groen" | "geel" | "rooi",
     reëls: [{ id, erns: "ok"|"waarskuwing"|"fout", teks }],
     opsomming: "…"            // een reël vir die sessieskerm
   }
   Onsekerheid word altyd "geel", nooit "rooi" nie: die app mag nooit 'n blok vals blokkeer nie. */
window.WALLIE = window.WALLIE || {};

(function () {
  /* Minuut per punt, soos in die eksamen (dieselfde tabel as lesson-ui.js se TEMPO). */
  const TEMPO = { wiskgelett: 1.2, rtt: 1.2, engels: 1.5, toerisme: 0.9, gasvryheid: 0.9, afrikaans: 1.7 };
  const RAG_URL = "data/rag-dekking.json";

  let rag = null;
  let ragPogings = 0;

  function laaiRag() {
    /* Twee mislukkings (vanlyn, file://) en dan los ons dit: geen herprobeer-lus op elke herteken nie. */
    if (rag || ragPogings >= 2 || typeof fetch !== "function") return;
    ragPogings += 1;
    fetch(RAG_URL, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && d.vraestelle && typeof d.vraestelle === "object") rag = d;
        /* Een keer weer teken sodat die reël nie op "nog nie nagegaan" bly staan nie. */
        const ui = window.WALLIE && window.WALLIE.lessonUI;
        if (rag && ui && typeof ui.renderSessionWerk === "function") {
          try {
            ui.renderSessionWerk();
          } catch (e) {
            /* die paneel is nie oop nie — niks om te doen nie */
          }
        }
      })
      .catch(() => {
        /* Geen netwerk of file:// — dan bly die RAG-reël "nie nagegaan nie", nie 'n fout nie. */
      });
  }

  function item(id) {
    const DBE = window.WALLIE.DBE;
    return DBE && typeof DBE.item === "function" ? DBE.item(id) : null;
  }

  function vakVan(id) {
    const p = item(id);
    return (p && p.vak) || "rtt";
  }

  /* Die app se eie "al gesien"-register (REEDS_GESIEN) en die leerder se antwoord op die vraag. */
  function gesien(id) {
    const DBE = window.WALLIE.DBE;
    if (DBE && DBE.ruil && DBE.ruil.REEDS_GESIEN && DBE.ruil.REEDS_GESIEN[id]) return "register";
    try {
      const d = JSON.parse(localStorage.getItem("wallie911_vraestel_gesien") || "null");
      if (d && d.gesien && d.gesien[id] === true) return "self";
    } catch (e) {
      /* stukkende sleutel = geen antwoord; dit is nie 'n fout in die ondersteuning nie */
    }
    return null;
  }

  function punteVan(werk, blok) {
    const DBE = window.WALLIE.DBE;
    if (!DBE || typeof DBE.punte !== "function") return null;
    const p = DBE.punte(werk, blok);
    return Number.isFinite(p) ? p : null;
  }

  function formaatTeks(blok) {
    return [blok && blok.title, blok && blok.detail].filter(Boolean).join(" ");
  }

  function kontroleer(werk, blok) {
    const reëls = [];
    const voegBy = (id, erns, teks) => reëls.push({ id, erns, teks });
    laaiRag();

    if (!werk || !werk.id) {
      const verwag = blok && (blok.soort === "skrif" || blok.soort === "merk" || blok.soort === "toets");
      voegBy("werk", verwag ? "fout" : "ok",
        verwag
          ? "Hierdie blok vra werk, maar daar is geen DBE-vraestel aan hom gekoppel nie."
          : "Geen DBE-vraestel nodig vir hierdie blok nie.");
      return afsluit(reëls);
    }

    const p = item(werk.id);
    const vak = vakVan(werk.id);

    /* Oefenvrae kom uit die oefenbank, nie uit die DBE-katalogus nie — hulle is geldige werk
       (AGENTS §2.4) en moet dus nie as "nie in die katalogus" afgekeur word nie. */
    if (werk.tipe === "oefenvraag") {
      voegBy("katalogus", "ok", "Oefenvraag uit die oefenbank (nie 'n DBE-vraestel nie).");
      voegBy("herhaling", "ok", "Die herhaling-register geld net vir volle DBE-vraestelle.");
      voegBy("standaard", "ok", "Oefenvraag — nie deel van die DBE-vraestel-katalogus nie.");
      voegBy("tyd", "ok", "Geen tydtoets vir 'n oefenvraag nie.");
      voegBy("formaat", /pa\s+gee/i.test(formaatTeks(blok)) ? "fout" : "ok",
        /pa\s+gee/i.test(formaatTeks(blok))
          ? "Die blok sê “Pa gee die vraestel” — die inhoud moet in die app wees."
          : "Oefenvraag: in die app, geen PDF nodig nie.");
      return afsluit(reëls);
    }

    /* 1. Is dit 'n amptelike DBE-vraestel uit die katalogus? */
    voegBy("katalogus", p ? "ok" : "fout",
      p ? `Amptelike DBE-vraestel: ${p.titel}.` : `“${werk.id}” is nie in die DBE-katalogus nie.`);

    /* 2. Het die leerder dit al gedoen? (LL-18: nooit dieselfde vraestel twee keer as werk gee nie.) */
    const al = gesien(werk.id);
    /* Het hy die hele groep al gedoen, gee die app die laaste een doelbewus weer (eksamentoestande): geen fout nie. */
    const DBE = window.WALLIE.DBE;
    const almal = al === "self" && DBE && DBE.ruil && typeof DBE.ruil.almalGesien === "function" && DBE.ruil.almalGesien(werk);
    if (almal) {
      /* "ok": die paneel sê dit self al ("Jy het al hierdie vraestelle gedoen …"); geen herhaalde teks nie (§2.8, QC 27 Okt 5). */
      voegBy("herhaling", "ok", "Alles in hierdie groep is gedoen: die app gee dit doelbewus weer.");
    } else {
      voegBy("herhaling", al ? "fout" : "ok",
        al ? (al === "register"
          ? "Hierdie vraestel staan as reeds gedoen in die app se register."
          : "die leerder het gesê hy het hierdie vraestel al gedoen.") : "Nog nie gedoen nie.");
    }

    /* 3. Stem die punte per vraag met die DBE-teks? (die RAG het die memo se koppe gelees) */
    const knot = rag && rag.vraestelle && rag.vraestelle[werk.id];
    const knotVrae = knot && Array.isArray(knot.vrae) ? knot.vrae : null;
    if (!knot || !knotVrae) {
      voegBy("standaard", "ok", rag ? "Hierdie vraestel is nog nie teen die DBE-teks nagegaan nie."
        : "Nog nie teen die DBE-teks nagegaan nie (die tabel laai later).");
    } else if (!knot.gedek) {
      voegBy("standaard", "ok", "Hierdie vraestel is nog nie in die DBE-korpus nie.");
    } else {
      /* Net die vrae van HIERDIE blok (QC 27 Okt 1: 'n blok "Vraag 1 tot 6" is nie die hele vraestel nie). */
      const kat = (p && p.vrae) || [];
      const DBEk = window.WALLIE.DBE;
      const nrs = DBEk && typeof DBEk.vraagNommers === "function" ? DBEk.vraagNommers(werk) : kat.map((_, i) => i + 1);
      const binne = nrs.filter((n) => n >= 1 && n <= kat.length);
      const verskil = [];
      const nagegaan = [];
      for (const n of binne) {
        const r = knotVrae[n - 1];
        if (r == null) continue;
        nagegaan.push(n);
        if (Number(r) !== Number(kat[n - 1])) verskil.push(`Vraag ${n}: app sê ${kat[n - 1]}, DBE sê ${r}`);
      }
      const totaal = binne.reduce((s, n) => s + Number(kat[n - 1] || 0), 0);
      if (!knot.volledig) {
        /* Gedeeltelike dekking: die RAG het nie elke kop gelees nie, dus is 'n verskil onsekerheid — nooit rooi
           nie, en die leerder kry geen RAG-getalle te sien nie (QC 27 Okt 4: Toerisme V3 32 teenoor die memo se 14). */
        voegBy("standaard", "ok", verskil.length
          ? `Gedeeltelik nagegaan; die DBE-teks se punte is onseker (${verskil.join("; ")}).`
          : `Punte nagegaan vir ${nagegaan.length ? nagegaan.map((n) => `Vraag ${n}`).join(", ") : "geen vraag"} (gedeeltelike DBE-teks).`);
      } else {
        voegBy("standaard", verskil.length ? "fout" : "ok",
          verskil.length ? `Die punte stem nie met die DBE-teks nie — ${verskil.join("; ")}.`
            : `${binne.length} vrae, ${totaal} punte — stem met die DBE-teks.`);
      }
    }

    /* 4. Is daar genoeg tyd vir die punte teen die eksamentempo? */
    const punte = punteVan(werk, blok);
    const tempo = TEMPO[vak] || 1.2;
    const nodig = punte != null ? Math.round(punte * tempo) : null;
    const tyd = blok && Number.isFinite(blok.minutes) ? blok.minutes : null;
    if (nodig != null && tyd != null && (blok.soort === "skrif" || blok.soort === "toets")) {
      const kort = tyd < nodig * 0.9;
      voegBy("tyd", kort ? "waarskuwing" : "ok",
        kort ? `${punte} punte vra ±${nodig} min teen die eksamentempo; die blok is ${tyd} min.`
          : `${punte} punte in ${tyd} min — genoeg tyd (eksamentempo ±${nodig} min).`);
    } else {
      voegBy("tyd", "ok", "Geen tydtoets vir hierdie blok nie.");
    }

    /* 5. Formaat: geen “Pa gee” (AGENTS.md §2.9) en 'n volle vraestel word só genoem (LL-18). */
    const teks = formaatTeks(blok);
    const paGee = /\bpa\s+gee\b/i.test(teks);
    /* Die "voluit genoem"-toets geld net waar hy werklik skryf. By 'n merk- of herdoen-blok sê die
       paneel self "… · volledige vraestel" (werkLabel), so 'n waarskuwing daar sou vals wees (QC W1). */
    const skryfBlok = Boolean(blok && (blok.soort === "skrif" || blok.soort === "toets"));
    const vol = werk.tipe === "vraestel" && skryfBlok;
    const sêVol = !vol || /volledige vraestel/i.test(teks) || /volledige vraestel/i.test((p && p.titel) || "");
    if (paGee) {
      voegBy("formaat", "fout", "Die blok sê “Pa gee die vraestel” — die inhoud moet in die app wees.");
    } else if (!sêVol) {
      voegBy("formaat", "waarskuwing", "Dit is 'n volle vraestel, maar die skerm sê nie so nie.");
    } else {
      voegBy("formaat", "ok", "Formaat reg: die werk is in die app en die vraestel word voluit genoem.");
    }

    return afsluit(reëls);
  }

  function afsluit(reëls) {
    const fout = reëls.some((r) => r.erns === "fout");
    const waarsku = reëls.some((r) => r.erns === "waarskuwing");
    const vlak = fout ? "rooi" : waarsku ? "geel" : "groen";
    const eerste = reëls.find((r) => r.erns === "fout") || reëls.find((r) => r.erns === "waarskuwing");
    /* Nooit "Nagegaan: undefined" nie (QC W2): val terug op die katalogus-reël, anders op 'n algemene sin. */
    const kern = reëls.find((r) => r.id === "standaard") || reëls.find((r) => r.id === "katalogus");
    const opsomming = vlak === "groen"
      ? "Nagegaan: " + (kern ? kern.teks : "die werk is in orde.")
      : eerste.teks;
    return { vlak, reëls, opsomming };
  }

  WALLIE.ONDERSTEUNING = {
    TEMPO,
    kontroleer,
    laaiRag,
    rag: () => rag,
    /* vir toetse: 'n RAG-tabel insit sonder netwerk */
    _setRag: (d) => { rag = d || null; }
  };
})();
