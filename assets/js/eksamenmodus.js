/* Eksamenmodus — gedeeld deur al die vraagskerms (Skryfwerk V3 en Oefenvrae RTT).
   Doel: oefen soos die eksamen. Eers werk (antwoord / papier-bevestiging) onder 'n aftelklok, DAN die memo,
   DAN selfnasien in punte volgens die rubriek/riglyn.

   Stoor NIKS op die bediener nie. Plaaslik:
     wallie911_eksamen_v1  { v:1, items:{ <id>:{ begin:<ms>|null, konsep:"", bevestig:bool, lêer:"", klaarMin:<n>|null,
                                                  sedert:<ms>|null, vorige:[ { begin, konsep, bevestig, lêer, klaarMin, geargiveerOp }, … ],
                                                  begin_eie?:<ms>, sedert_vorige?:<ms> } } }
       (vorige = geargiveerde vorige pogings, nuutste laaste; sedert = wanneer Wallie self 'n nuwe poging begin het;
        begin_eie / sedert_vorige = die oorskrewe waarde van begin / sedert, bewaar sodat niks verlore gaan nie, sien metBewaring)
     wallie911_vraebank_v1 (VraebankStore.saveAttempt) kry die punte-poging as ekstra velde.
   Bediener-event: elke gestoorde punte-poging stuur EEN event van soort "v3_poging" (EVENT.kind) via WALLIE.SYNC.enqueue,
   met NET die agt velde van eventData (geen konsep-teks, geen persoonlike data). Hanno het die soort op 15 Okt 2026
   goedgekeur; 'wallie_ingest_v2' ken dit eers ná migrations/004_v3_poging.sql (deur Hanno toegepas). Tot dan wag die
   event "geparkeer" in die sync-tou (sync.js, parkOnBadKind) en lewer vanself af. Sien EVENT hieronder.

   Alle teks via textContent (nooit innerHTML met item-teks nie). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Eksamenmodus = factory();
})(typeof window !== "undefined" ? window : globalThis, function () {
  const KEY = "wallie911_eksamen_v1";

  /* Die DBE-vraestel se totale tyd en punte per vak, vir items sonder eie tyd_min.
     Engels EAT V3: 150 min / 100 punte (Hanno). Ander vakke volgens PK.EXAMS (duur) en die DBE-puntetotaal. */
  const VRAESTEL = {
    engels: { min: 150, punte: 100 },
    afrikaans: { min: 180, punte: 100 },
    rtt: { min: 180, punte: 150 },
    wiskgelett: { min: 180, punte: 150 }, /* CAPS: 150 punte per 180 min; ONGEVERIFIEER (Hanno moet bevestig) */
    toerisme: { min: 180, punte: 200 }, /* ONGEVERIFIEER (Hanno) — sien data/dbe-spesifikasie */
    gasvryheid: { min: 180, punte: 200 } /* ONGEVERIFIEER (Hanno) */
  };

  /* Bediener-event: een konstante soort. event_id = "v3_poging:<item_id>:<poging-tyd>" (poging-tyd = ms van die
     "Stoor my punte"-klik), dus uniek en deterministies per poging; 'n herstuur ontdubbel op event_id. */
  const EVENT = { kind: "v3_poging" };

  /* ---------- suiwer logika (getoets in tests/eksamenmodus.test.js) ---------- */

  function tydMin(item, vak) {
    if (item && Number(item.tyd_min) > 0) return Number(item.tyd_min);
    const v = VRAESTEL[vak || (item && item.vak)];
    const p = item && Number(item.punte);
    if (!v || !(p > 0)) return null;
    return Math.max(1, Math.round((p * v.min) / v.punte));
  }

  function tel(teks) {
    return String(teks || "").split(/\s+/).filter(Boolean).length;
  }

  /* 'skryf' = teks wat getel word, OF (as Wallie op papier geskryf het) die papier-bevestiging met minstens
     60% van die tyd; enigiets anders = papier/toepassing-bevestiging. */
  function minWerkGedoen(st) {
    if (st.tipe === "skryf") {
      return (st.woorde >= (st.minWoorde || 0) && st.woorde > 0) || (Boolean(st.bevestig) && st.verlopeSek >= 0.6 * st.tydSek);
    }
    return Boolean(st.bevestig) && st.verlopeSek >= 0.6 * st.tydSek;
  }

  /* Memo oop as die tyd verby is, OF (minimum werk gedoen EN "Ek is klaar" gedruk). */
  function memoOntsluit(st) {
    if (st.tydSek > 0 && st.verlopeSek >= st.tydSek) return true;
    return Boolean(st.klaar) && minWerkGedoen(st);
  }

  /* Waarom nog nie? (vir die teks langs die gesluite knoppie) */
  function memoRede(st) {
    if (st.begin === false) return "Druk Begin — die klok loop dan, en die memo bly toe totdat jy klaar is.";
    if (st.tipe === "skryf") {
      const woordeOk = st.woorde >= (st.minWoorde || 0) && st.woorde > 0;
      if (!woordeOk) {
        /* Op papier geskryf: dieselfde 60%-tydreël as die praktiese werk */
        if (st.bevestig) {
          const nog = Math.ceil(0.6 * st.tydSek - st.verlopeSek);
          if (nog > 0) return "Nog ±" + Math.ceil(nog / 60) + " min werk voor die memo oopgaan (minstens 60% van die tyd), of wag vir die tyd om is.";
        } else {
          const kort = Math.max(0, (st.minWoorde || 0) - st.woorde);
          if (kort > 0) return "Skryf nog " + kort + " woord" + (kort === 1 ? "" : "e") + " (minimum " + st.minWoorde + "), of merk dat jy dit op papier geskryf het, of wag vir die tyd om is.";
          return "Skryf jou antwoord, of merk dat jy dit op papier geskryf het, of wag vir die tyd om is.";
        }
      }
    } else {
      if (!st.bevestig) return "Doen die werk en merk dit hierbo as gedoen, of wag vir die tyd om is.";
      const nog = Math.ceil(0.6 * st.tydSek - st.verlopeSek);
      if (nog > 0) return "Nog ±" + Math.ceil(nog / 60) + " min werk voor die memo oopgaan (minstens 60% van die tyd), of wag vir die tyd om is.";
    }
    return "Druk “Ek is klaar” om die memo te sien.";
  }

  function riglyn(item) {
    return (item.nasienriglyn || []).map((r) => ({ kriterium: String(r.kriterium), punte: Number(r.punte) || 0 }));
  }

  function knip(n, max) {
    const x = Math.round(Number(n));
    if (!Number.isFinite(x) || x < 0) return 0;
    return Math.min(x, max);
  }

  /* waardes: [n, n, …] in die volgorde van riglyn(item) */
  function totaal(item, waardes) {
    const r = riglyn(item);
    const behaal = r.reduce((s, k, i) => s + knip(waardes[i], k.punte), 0);
    const maks = r.reduce((s, k) => s + k.punte, 0);
    return { behaal, totaal: Number(item.punte) > 0 ? Number(item.punte) : maks, riglynTotaal: maks };
  }

  /* Die ou drie-knoppie-uitslag, afgelei van die punte (die knoppies bly as ekstra beskikbaar). */
  function uitslagVan(behaal, tot) {
    if (!(tot > 0)) return "fout";
    const f = behaal / tot;
    return f >= 0.7 ? "reg" : f >= 0.4 ? "gedeeltelik" : "fout";
  }

  function minuteGebruik(beginMs, eindMs) {
    if (!beginMs) return 0;
    return Math.max(0, Math.round(((eindMs - beginMs) / 60000) * 10) / 10);
  }

  /* Sessie-gekoppelde klok. Wallie begin gewoonlik 'n SESSIE op die blok (kamera, ■ Klaar) en maak dan eers die item
     oop: die eksamenklok moet nie later begin as haar sessie nie. 'n Item se effektiewe begin = die vroegste van
       · sy eie gestoorde begin (`eie`),
       · die startedAt van VANDAG se plaaslike sessies (`date === vandag`) wie se `block.id` een van vandag se blokke
         met `item === itemId` is, en
       · die aktiewe sessie (`state.live`, status ≠ "off") op so 'n blok.
     `sedert` (ms): sessies wat voor 'n "nuwe poging" begin het, tel nie meer nie. Suiwer: geen DOM, geen WALLIE.
     Gee ms of null. */
  function vroegsteBegin(itemId, state, vandag, eie, sedert) {
    const st = state || {};
    const blokIds = new Set((st.blocks || []).filter((b) => b && b.item === itemId).map((b) => b.id));
    const kandidate = [];
    const nuttig = (ms) => Number.isFinite(ms) && ms > 0 && !(sedert > 0 && ms < sedert);
    if (eie != null && Number(eie) > 0) kandidate.push(Number(eie));
    if (blokIds.size) {
      (st.sessions || []).forEach((s) => {
        if (s && s.date === vandag && s.block && blokIds.has(s.block.id) && nuttig(Number(s.startedAt))) kandidate.push(Number(s.startedAt));
      });
      const live = st.live;
      if (live && live.status && live.status !== "off" && live.block && blokIds.has(live.block.id) && nuttig(Number(live.startedAt))) {
        kandidate.push(Number(live.startedAt));
      }
    }
    return kandidate.length ? Math.min.apply(null, kandidate) : null;
  }

  /* Nuwe poging (dieselfde item word weer gebruik, bv. afr-v3-A1 op 16 én 19 Okt): die item-staat is anders
     permanent, dus sou die klok van die vorige poging bly loop en die memo oop wees. nuwePoging argiveer die
     huidige waardes in `vorige` (nuutste laaste, nooit weggegooi nie) en stel die vyf velde terug. Suiwer: gee 'n
     nuwe rekord, verander `rec` nie. 'n Leë poging (niks gedoen nie) word nie geargiveer nie. */
  function nuwePoging(rec, nou) {
    const r = rec || {};
    const vorige = Array.isArray(r.vorige) ? r.vorige.slice() : [];
    const iets = r.begin != null || Boolean(r.konsep) || Boolean(r.bevestig) || Boolean(r.lêer) || r.klaarMin != null;
    if (iets) {
      vorige.push({
        begin: r.begin == null ? null : r.begin,
        konsep: r.konsep || "",
        bevestig: Boolean(r.bevestig),
        lêer: r.lêer || "",
        klaarMin: r.klaarMin == null ? null : r.klaarMin,
        geargiveerOp: nou == null ? Date.now() : nou
      });
    }
    return Object.assign({}, r, { begin: null, konsep: "", bevestig: false, lêer: "", klaarMin: null, vorige });
  }

  /* Outomaties: die gestoorde begin is van 'n vroeër dag as vandag (WALLIE.todayKey-reël, plaaslike dag). */
  function moetNuwePoging(rec, nou) {
    return Boolean(rec && Number(rec.begin) > 0 && dagSleutel(Number(rec.begin)) < dagSleutel(nou == null ? Date.now() : nou));
  }

  /* O1: Het Wallie VANDAG werk aan hierdie item gedoen, ook al het sy nog nie "Stoor my punte" gedruk nie (dan is daar
     nog geen VraebankStore-poging nie)? Suiwer: neem die item-rekord (soos kry() dit gee).
       minute = klaarMin (as "Ek is klaar" gedruk is), anders die verlope tyd sedert begin tot `nou`; begrens by `tmin` (die
                item se tyd), nooit negatief nie. Net pogings waarvan die begin VANDAG is (plaaslike dag) tel, dus nie
                gister se poging nie; die geargiveerde `vorige` pogings van vandag ook (die meeste minute wen, nie die som nie).
       werk   = daar is iets gedoen: papier/toepassing-bevestiging, of 'n konsep met minstens `minWoorde` woorde
                (dieselfde drempel as die memo-hek; LL-01: een letter tik mag nie die "Seker?"-waarskuwing omseil nie). */
  function werkVanRekord(rec, nou, tmin, minWoorde) {
    const drempel = Math.max(1, Number(minWoorde) || 1);
    const n = nou == null ? Date.now() : nou;
    const vandag = dagSleutel(n);
    const kap = Number(tmin) > 0 ? Number(tmin) : Infinity;
    const poging = (begin, klaarMin, einde, bevestig, konsep) => {
      if (!(Number(begin) > 0) || dagSleutel(Number(begin)) !== vandag) return null;
      const rou = klaarMin != null && Number.isFinite(Number(klaarMin)) ? Number(klaarMin) : (Number(einde) - Number(begin)) / 60000;
      return { minute: Math.round(Math.min(Math.max(0, rou), kap) * 10) / 10, werk: Boolean(bevestig) || tel(konsep) >= drempel };
    };
    const r = rec || {};
    const lys = [poging(r.begin, r.klaarMin, n, r.bevestig, r.konsep)];
    (Array.isArray(r.vorige) ? r.vorige : []).forEach((v) => {
      if (v) lys.push(poging(v.begin, v.klaarMin, v.geargiveerOp == null ? n : v.geargiveerOp, v.bevestig, v.konsep));
    });
    const werk = lys.filter((x) => x && x.werk);
    if (!werk.length) return { minute: 0, werk: false };
    return { minute: Math.max.apply(null, werk.map((x) => x.minute)), werk: true };
  }

  /* Plaaslike stoor-weergawe van werkVanRekord (wallie911_eksamen_v1). `tmin` weggelaat → die item se tyd uit die
     vraagbank (VRAEBANK_V3 / VRAEBANK_RTT_V1); onbekende item → geen begrensing. Lees-net: skryf niks. */
  function vandagWerk(itemId, nou, tmin) {
    if (!itemId) return { minute: 0, werk: false };
    let kap = tmin;
    let minW = null;
    try {
      const g = typeof window !== "undefined" ? window : globalThis;
      const item = (g.VRAEBANK_V3 || []).concat(g.VRAEBANK_RTT_V1 || []).find((i) => i && i.id === itemId);
      if (kap === undefined) kap = item ? tydMin(item, item.vak || "rtt") : null;
      minW = item && item.woorde ? item.woorde.min : null;
    } catch (e) {
      if (kap === undefined) kap = null;
    }
    return werkVanRekord(kry(itemId), nou, kap, minW);
  }

  /* O4 (AGENTS §2.3: Wallie se plaaslike data word nooit herskryf nie): word 'n bestaande `begin` deur 'n ander (vroeër
     sessie-) begin vervang, of 'n bestaande `sedert` deur 'n nuwe een, dan bewaar die ou waarde eers in `begin_eie` /
     `sedert_vorige` (net as dit nog nie gestel is nie; die eerste waarde bly dus altyd). 'n Terugstelling na null
     (nuwePoging) raak dit nie: daar is die ou begin reeds in `vorige` geargiveer. Suiwer: gee die aangevulde patch. */
  function metBewaring(rec, patch) {
    const r = rec || {};
    const p = Object.assign({}, patch);
    if (p.begin != null && r.begin != null && p.begin !== r.begin && r.begin_eie == null) p.begin_eie = r.begin;
    if (p.sedert != null && r.sedert != null && p.sedert !== r.sedert && r.sedert_vorige == null) p.sedert_vorige = r.sedert;
    return p;
  }

  /* Dagsleutel "JJJJ-MM-DD" van 'n tydstempel: dieselfde reël as WALLIE.todayKey (toestel se plaaslike dag, SAST). */
  function dagSleutel(ms) {
    const d = new Date(ms);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  /* "HH:MM" van 'n tydstempel (toestel se plaaslike tyd, soos WALLIE.todayKey) */
  function hhmm(ms) {
    const d = new Date(ms);
    return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }

  function eventData(item, vak, st) {
    return {
      item_id: item.id,
      vak: vak,
      punte_behaal: st.behaal,
      punte_totaal: st.totaal,
      woorde: st.woorde == null ? null : st.woorde,
      minute_gebruik: st.minuteGebruik,
      tyd_min: st.tydMin,
      memo_oopgemaak_na_min: st.memoNaMin == null ? null : st.memoNaMin
    };
  }

  /* ---------- plaaslike stoor (net wallie911_eksamen_v1) ---------- */

  let mem = null;
  function lees() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw == null) return mem || { v: 1, items: {} };
      const d = JSON.parse(raw);
      return d && d.v === 1 && d.items && typeof d.items === "object" ? d : { v: 1, items: {} };
    } catch (e) {
      return mem || { v: 1, items: {} };
    }
  }
  function skryf(d) {
    mem = d;
    try {
      localStorage.setItem(KEY, JSON.stringify(d));
      return true;
    } catch (e) {
      return false;
    }
  }
  function kry(id) {
    return Object.assign({ begin: null, konsep: "", bevestig: false, lêer: "", klaarMin: null, sedert: null, vorige: [] }, lees().items[id] || {});
  }
  function bewaar(id, patch) {
    const d = lees();
    const nou = kry(id);
    d.items[id] = Object.assign(nou, metBewaring(nou, patch));
    skryf(d);
    return d.items[id];
  }

  /* ---------- DOM ---------- */

  /* WALLIE.app.state() (plaaslike sessies, blokke, aktiewe sessie), of null as die toepassing nog nie daar is nie. */
  function appState() {
    try {
      const a = typeof window !== "undefined" && window.WALLIE && window.WALLIE.app;
      return a && typeof a.state === "function" ? a.state() : null;
    } catch (e) {
      return null;
    }
  }

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function mmss(sek) {
    const s = Math.max(0, Math.floor(sek));
    return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
  }

  /* at = tyd (ms) van die poging; 'n fout hier mag nooit die UI breek nie (alles in try/catch) */
  function stuurEvent(item, vak, st, at) {
    if (!EVENT.kind) return false;
    try {
      const S = window.WALLIE && window.WALLIE.SYNC;
      if (!S || !S.enqueue) return false;
      at = Number.isFinite(at) ? at : Date.now();
      S.enqueue(EVENT.kind + ":" + item.id + ":" + at, {
        kind: EVENT.kind,
        client_at: at,
        title: "EKSAMENPOGING " + item.id,
        body: item.id + " · " + st.behaal + "/" + st.totaal + " punte",
        data: eventData(item, vak, st)
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  /* opts:
       item, vak, tipe: "skryf" | "praktiese", voor: Node (waarvoor die werkarea ingevoeg word),
       bouMemo: () => Node (net geroep as die memo ontsluit en oopgemaak word),
       memoHouer: Node (leë houer vir die memo), selfnasien: Node (word eers ontsluit as die memo oop is),
       store: VraebankStore, kls: "sw" | "oe" (CSS-voorvoegsel) */
  function pasToe(opts) {
    const { item, vak, tipe, voor, bouMemo, memoHouer, selfnasien, store } = opts;
    const kls = opts.kls || "em";
    const tmin = tydMin(item, vak);
    const tydSek = tmin ? tmin * 60 : 0;
    const wr = item.woorde || {};
    let rec0 = kry(item.id);
    /* Nuwe dag, nuwe poging: die vorige dag se poging word geargiveer (nooit uitgevee nie) en die item begin skoon. */
    const nou0 = Date.now();
    const outoNuut = moetNuwePoging(rec0, nou0);
    if (outoNuut) rec0 = bewaar(item.id, nuwePoging(rec0, nou0));
    /* Klok loop sedert die vroegste van: eie begin en vandag se sessie op hierdie item se blok (vroegsteBegin). */
    const vandag = dagSleutel(Date.now());
    const effBegin = vroegsteBegin(item.id, appState(), vandag, rec0.begin, rec0.sedert);
    const sessieBegin = vroegsteBegin(item.id, appState(), vandag, null, rec0.sedert);
    const uitSessie = sessieBegin != null && sessieBegin === effBegin;
    if (effBegin !== rec0.begin) {
      rec0.begin = effBegin;
      bewaar(item.id, { begin: effBegin });
    }
    const tstate = { begin: rec0.begin, klaar: rec0.klaarMin != null, memoOpen: false, memoNaMin: null, gestoor: false };
    const parent = voor.parentNode;

    const kas = el("section", "em-kas");
    kas.dataset.eksamenmodus = tipe;

    /* --- klok --- */
    const klok = el("div", "em-klok");
    const klokTeks = el("span", "em-tyd", "");
    klokTeks.setAttribute("role", "timer");
    const klokInfo = el("span", "em-tyd-info", tmin ? "DBE-tyd: " + tmin + " min" : "");
    const beginKnop = el("button", "btn primary em-begin", "Begin (klok loop)");
    beginKnop.type = "button";
    const nuutKnop = el("button", "btn ghost em-nuut", "Begin nuwe poging");
    nuutKnop.type = "button";
    nuutKnop.hidden = true;
    /* K4: "nog N min" + die klok sit in 'n taai balk bo-aan die paneel. K13: "Begin nuwe poging" staan onderaan die kas,
       klein en sekondêr, en vra 'n tweede klik (een verkeerde tik middel-in 'n getimede opstel mag nie die poging terugstel nie). */
    const nog = el("span", "em-nog", "");
    nog.hidden = true;
    klok.append(klokTeks, nog, klokInfo, beginKnop);
    const klokBalk = el("div", "em-klok-balk");
    klokBalk.append(klok);
    const nuutRij = el("div", "em-nuut-rij");
    nuutRij.hidden = true;
    const nuutSeker = el("div", "em-nuut-seker");
    nuutSeker.hidden = true;
    const nuutSekerTeks = el("p", "em-nuut-seker-teks", "Seker? Jou huidige poging word bewaar onder Vorige pogings");
    nuutSekerTeks.setAttribute("role", "status");
    const nuutJa = el("button", "btn ghost small em-nuut-ja", "Ja, begin nuwe poging");
    nuutJa.type = "button";
    const nuutNee = el("button", "btn ghost small em-nuut-nee", "Nee, gaan voort");
    nuutNee.type = "button";
    const nuutKnoppies = el("div", "em-nuut-seker-knoppies");
    nuutKnoppies.append(nuutNee, nuutJa);
    nuutSeker.append(nuutSekerTeks, nuutKnoppies);
    nuutRij.append(nuutKnop, nuutSeker);
    const nuutMeld = el("p", "hint em-nuut-meld", outoNuut ? "Nuwe dag, nuwe poging. Jou vorige poging is veilig bewaar." : "");
    nuutMeld.hidden = !outoNuut;
    const sessieWenk = el("p", "hint em-sessie-wenk", uitSessie ? "Klok loop sedert jou sessie om " + hhmm(sessieBegin) + " begin het." : "");
    sessieWenk.hidden = !uitSessie;

    /* --- werkarea --- */
    const werk = el("div", "em-werk");
    let area = null;
    let teller = null;
    let boks = null;
    let lêerVeld = null;
    if (tipe === "skryf") {
      area = document.createElement("textarea");
      area.className = "em-antwoord";
      area.rows = 12;
      area.value = rec0.konsep || "";
      area.setAttribute("aria-label", "Jou antwoord");
      area.placeholder = "Skryf jou antwoord hier — of skryf op papier en merk die blokkie hieronder.";
      teller = el("p", "em-woorde", "");
      teller.setAttribute("aria-live", "polite");
      /* Wie op papier skryf, tik nie alles oor nie: dieselfde bevestiging as by die praktiese werk */
      const papier = el("label", "em-bevestig");
      boks = document.createElement("input");
      boks.type = "checkbox";
      boks.checked = Boolean(rec0.bevestig);
      papier.append(boks, el("span", null, "Ek het dit op papier geskryf"));
      werk.append(area, teller, papier);
    } else {
      const lab = el("label", "em-bevestig");
      boks = document.createElement("input");
      boks.type = "checkbox";
      boks.checked = Boolean(rec0.bevestig);
      lab.append(boks, el("span", null, "Ek het dit op papier / in die toepassing gedoen"));
      lêerVeld = document.createElement("input");
      lêerVeld.type = "text";
      lêerVeld.className = "em-lêer";
      lêerVeld.value = rec0.lêer || "";
      lêerVeld.placeholder = "Foto- of lêernaam (opsioneel)";
      lêerVeld.setAttribute("aria-label", "Foto- of lêernaam (opsioneel)");
      werk.append(lab, lêerVeld);
    }

    /* --- klaar + memo-hek --- */
    const klaarRij = el("div", "btn-row em-klaar-rij");
    const klaarKnop = el("button", "btn em-klaar", "Ek is klaar");
    klaarKnop.type = "button";
    klaarRij.append(klaarKnop);
    const rede = el("p", "hint em-rede", "");
    rede.setAttribute("role", "status");

    const memoKnop = el("button", "btn primary em-memo-knoppie " + kls + "-memo-knoppie", "Memo gesluit");
    memoKnop.type = "button";
    memoKnop.disabled = true;
    memoKnop.setAttribute("aria-expanded", "false");

    /* O3: vorige pogings (geargiveerde nuwePoging-rekords), lees-net. Raak die memo-hek NIE aan nie: die hek volg net
       die huidige poging. Teks altyd via textContent. */
    const vorigeKas = document.createElement("details");
    vorigeKas.className = "em-vorige";
    vorigeKas.hidden = true;
    function tekenVorige() {
      const lys = kry(item.id).vorige || [];
      vorigeKas.textContent = "";
      vorigeKas.hidden = !lys.length;
      if (!lys.length) return;
      vorigeKas.append(el("summary", "em-vorige-opsom", "Vorige pogings (" + lys.length + ")"));
      lys.forEach((v, i) => {
        const ms = Number(v.begin) > 0 ? Number(v.begin) : Number(v.geargiveerOp) > 0 ? Number(v.geargiveerOp) : 0;
        const rij = el("div", "em-vorige-poging");
        rij.append(el("p", "em-vorige-datum", "Poging " + (i + 1) + (ms ? " · " + dagSleutel(ms) + " " + hhmm(ms) : "")));
        rij.append(el("p", "em-vorige-konsep", v.konsep ? String(v.konsep) : "(geen teks bewaar nie)"));
        if (v.lêer) rij.append(el("p", "em-vorige-lêer", "Lêer: " + v.lêer));
        vorigeKas.append(rij);
      });
    }
    tekenVorige();

    kas.append(nuutMeld, sessieWenk, werk, klaarRij, rede, memoKnop, vorigeKas, nuutRij);
    parent.insertBefore(kas, voor);
    parent.insertBefore(klokBalk, parent.firstChild);
    parent.insertBefore(memoHouer, voor);
    parent.insertBefore(selfnasien, voor);
    memoHouer.hidden = true;
    selfnasien.hidden = true;
    voor.remove();

    function verlope() {
      return tstate.begin ? Math.max(0, (Date.now() - tstate.begin) / 1000) : 0;
    }
    function huidig() {
      return {
        tipe,
        woorde: area ? tel(area.value) : 0,
        minWoorde: wr.min || 0,
        bevestig: boks ? boks.checked : false,
        verlopeSek: verlope(),
        tydSek,
        klaar: tstate.klaar,
        begin: Boolean(tstate.begin)
      };
    }

    function ontsluit() {
      return memoOntsluit(huidig());
    }

    function teken() {
      const st = huidig();
      const v = st.verlopeSek;
      if (!tstate.begin) {
        klokTeks.textContent = tmin ? "00:00 / " + mmss(tydSek) : "00:00";
      } else if (tydSek && v > tydSek) {
        klokTeks.textContent = "Tyd om · +" + mmss(v - tydSek);
        klokTeks.classList.add("em-oor");
      } else {
        klokTeks.textContent = mmss(v) + (tydSek ? " / " + mmss(tydSek) : "");
        klokTeks.classList.remove("em-oor");
      }
      /* K4: vorderingstrook en "nog N min" (net vertoning; die memo-hek bly onveranderd) */
      const deel = tstate.begin && tydSek ? Math.min(1, v / tydSek) : 0;
      klokBalk.style.setProperty("--em-vordering", deel.toFixed(4));
      klokBalk.classList.toggle("em-laaste", Boolean(tstate.begin && tydSek && v >= 0.75 * tydSek && v <= tydSek));
      klokBalk.classList.toggle("em-verby", Boolean(tstate.begin && tydSek && v > tydSek));
      nog.textContent = tstate.begin && tydSek && v <= tydSek ? "nog " + Math.max(1, Math.ceil((tydSek - v) / 60)) + " min" : "";
      nog.hidden = !nog.textContent;
      beginKnop.hidden = Boolean(tstate.begin);
      nuutKnop.hidden = !tstate.begin || !nuutSeker.hidden;
      nuutRij.hidden = !tstate.begin;
      if (!tstate.begin) nuutSeker.hidden = true;
      if (teller) {
        const lim = wr.min ? " (doel " + wr.min + "–" + wr.max + ")" : "";
        teller.textContent = st.woorde + " woorde" + lim;
        teller.classList.toggle("em-onder", Boolean(wr.min) && st.woorde < wr.min);
        teller.classList.toggle("em-bo", Boolean(wr.max) && st.woorde > wr.max);
      }
      const oop = ontsluit();
      memoKnop.disabled = !oop;
      if (!oop) {
        memoKnop.textContent = "Memo gesluit";
        rede.textContent = memoRede(st);
      } else if (!tstate.memoOpen) {
        memoKnop.textContent = "Wys memo";
        rede.textContent = "Die memo is oop. Maak dit oop en gee jouself punte.";
      } else {
        rede.textContent = "";
      }
    }

    function begin() {
      if (tstate.begin) return;
      tstate.begin = Date.now();
      bewaar(item.id, { begin: tstate.begin });
      nuutMeld.hidden = true;
      teken();
    }

    beginKnop.addEventListener("click", begin);

    /* Op aanvraag: argiveer die huidige poging en begin skoon. `sedert` keer dat vandag se (vroeër) sessie die
       nuwe klok terugsleep (sien vroegsteBegin). */
    function doeNuwePoging() {
      const nou = Date.now();
      bewaar(item.id, Object.assign(nuwePoging(kry(item.id), nou), { sedert: nou }));
      tstate.begin = null;
      tstate.klaar = false;
      tstate.memoOpen = false;
      tstate.memoNaMin = null;
      if (area) area.value = "";
      if (boks) boks.checked = false;
      if (lêerVeld) lêerVeld.value = "";
      memoHouer.hidden = true;
      selfnasien.hidden = true;
      memoKnop.setAttribute("aria-expanded", "false");
      velde.forEach((v) => (v.inp.value = ""));
      somTeken();
      stoorMeld.textContent = "";
      sessieWenk.hidden = true;
      nuutMeld.textContent = "Nuwe poging. Die vorige poging is veilig bewaar.";
      nuutMeld.hidden = false;
      nuutSeker.hidden = true;
      tekenVorige();
      teken();
    }
    /* K13: die eerste klik vra net "Seker?"; eers "Ja, begin nuwe poging" stel terug */
    nuutKnop.addEventListener("click", () => {
      nuutSeker.hidden = false;
      nuutKnop.hidden = true;
      nuutJa.focus();
    });
    nuutNee.addEventListener("click", () => {
      nuutSeker.hidden = true;
      teken();
      nuutKnop.focus();
    });
    nuutJa.addEventListener("click", doeNuwePoging);
    if (area) {
      area.addEventListener("input", () => {
        if (!tstate.begin) begin();
        bewaar(item.id, { konsep: area.value });
        teken();
      });
    }
    if (boks) {
      boks.addEventListener("change", () => {
        if (!tstate.begin) begin();
        bewaar(item.id, { bevestig: boks.checked });
        teken();
      });
    }
    if (lêerVeld) lêerVeld.addEventListener("input", () => bewaar(item.id, { lêer: lêerVeld.value }));

    klaarKnop.addEventListener("click", () => {
      if (!tstate.begin) begin();
      tstate.klaar = true;
      bewaar(item.id, { klaarMin: minuteGebruik(tstate.begin, Date.now()) });
      teken();
    });

    memoKnop.addEventListener("click", () => {
      if (!ontsluit()) return;
      if (!memoHouer.firstChild) memoHouer.append(bouMemo());
      memoHouer.hidden = !memoHouer.hidden;
      tstate.memoOpen = !memoHouer.hidden;
      if (tstate.memoOpen && tstate.memoNaMin == null) tstate.memoNaMin = minuteGebruik(tstate.begin, Date.now());
      selfnasien.hidden = !tstate.memoOpen;
      memoKnop.textContent = tstate.memoOpen ? "Steek memo weg" : "Wys memo";
      memoKnop.setAttribute("aria-expanded", String(tstate.memoOpen));
      teken();
    });

    /* --- selfnasien in punte --- */
    const r = riglyn(item);
    const punte = el("div", "em-punte");
    punte.append(el("h3", null, "Gee jouself punte (soos die memo)"));
    const velde = r.map((k, i) => {
      const rij = el("label", "em-punt-rij");
      const inp = document.createElement("input");
      inp.type = "number";
      inp.min = "0";
      inp.max = String(k.punte);
      inp.step = "1";
      inp.inputMode = "numeric";
      inp.className = "em-punt-inp";
      inp.dataset.kriterium = String(i);
      inp.setAttribute("aria-label", k.kriterium + " (uit " + k.punte + ")");
      rij.append(el("span", "em-punt-naam", k.kriterium), inp, el("span", "em-punt-maks", "/ " + k.punte));
      return { k, inp, rij };
    });
    velde.forEach((v) => punte.append(v.rij));
    const som = el("p", "em-som", "");
    som.setAttribute("aria-live", "polite");
    const stoorPunte = el("button", "btn primary em-stoor-punte", "Stoor my punte");
    stoorPunte.type = "button";
    const stoorMeld = el("p", "em-gestoor", "");
    stoorMeld.setAttribute("role", "status");
    punte.append(som, stoorPunte, stoorMeld);
    selfnasien.insertBefore(punte, selfnasien.firstChild);

    function waardes() {
      return velde.map((v) => v.inp.value);
    }
    function somTeken() {
      const t = totaal(item, waardes());
      som.textContent = "Totaal: " + t.behaal + " / " + t.totaal;
    }
    velde.forEach((v) => v.inp.addEventListener("input", somTeken));
    somTeken();

    stoorPunte.addEventListener("click", () => {
      const t = totaal(item, waardes());
      const eind = Date.now();
      const st = {
        behaal: t.behaal,
        totaal: t.totaal,
        woorde: area ? tel(area.value) : null,
        minuteGebruik: minuteGebruik(tstate.begin, eind),
        tydMin: tmin,
        memoNaMin: tstate.memoNaMin
      };
      const uitslag = uitslagVan(t.behaal, t.totaal);
      const poging = store && store.saveAttempt(item.id, uitslag, eventData(item, vak, st));
      if (poging) stuurEvent(item, vak, st, eind);
      stoorMeld.textContent = poging ? "Gestoor: " + t.behaal + " / " + t.totaal + " punte." : "Kon nie stoor nie.";
    });

    teken();
    const tik = setInterval(() => {
      if (!document.body.contains(kas)) {
        clearInterval(tik);
        return;
      }
      teken();
    }, 1000);

    return { teken, begin, ontsluit };
  }

  return {
    KEY,
    EVENT,
    VRAESTEL,
    tydMin,
    tel,
    minWerkGedoen,
    memoOntsluit,
    memoRede,
    riglyn,
    totaal,
    uitslagVan,
    minuteGebruik,
    vroegsteBegin,
    nuwePoging,
    moetNuwePoging,
    werkVanRekord,
    vandagWerk,
    metBewaring,
    dagSleutel,
    hhmm,
    eventData,
    pasToe
  };
});
