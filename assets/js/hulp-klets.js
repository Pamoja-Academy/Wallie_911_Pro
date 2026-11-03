/* Hulp nou — Wallie se hulp-chatbot (Hanno, 3 Nov 2026).
   - Die bestaande Hulp-knoppie (#hulp-fab, hulp.js) heet nou "💬 Hulp nou"; die klets staan bo-aan die Hulp-paneel
     (in die bladsy, geen oortjie nie, dus geen oortjie-slot nie). Sigbaar op elke skerm, ook in fokusmodus.
   - Vraag + app-konteks → hulp-api (Claude via Vercel AI Gateway) → antwoord + aksie-knoppies.
   - ELKE vraag gaan ook na Pa as 'n `probleem`-event + foon-push (WALLIE.REMOTE.bugReport; bestaande soort, geen skemawysiging).
   - Bediener weg/stadig: terugval op die vanlyn kennisbank (WALLIE.FOUTRAG) en Pa word dringend ingelig.
   - Geen nuwe localStorage-sleutel nie: die klets bly in geheue (AGENTS §2.3).
   Oordrag: docs/OORDRAG-AI-HULPBOT-2026-11-03.md. */
(function () {
  var W = typeof window !== "undefined" ? window : globalThis;
  W.WALLIE = W.WALLIE || {};
  var WALLIE = W.WALLIE;

  WALLIE.KLETS_URL = WALLIE.KLETS_URL || "https://wallie-hulp.vercel.app/api/klets";
  var AKSIES = {
    herlaai: "🔄 Laai nuutste weergawe",
    missie: "📋 Vandag se plan",
    sessie: "⏱ Sessie",
    leer: "📚 Lesse",
    foutbank: "📝 Foutbank"
  };
  var WAG_MS = 20000;
  var GROET = "Hallo Wallie. Sê wat nie werk nie of waarmee jy vassit. Ek probeer dadelik help, en jou vraag word ook aan Pa gestuur.";
  var GEEN_DIENS = "Ek kon nou nie die hulpdiens bereik nie. Jou vraag word dringend aan Pa gestuur (sodra jy aanlyn is). Doen solank die volgende blok op jou Missie-skerm, of werk op papier.";

  /* ---------- suiwer funksies (getoets in tests/hulp-klets.test.js) ---------- */

  function hhmm(d) {
    return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }

  /* Die konteks wat die bot sien. Net wat nodig is om te help; geen wagwoorde, geen PIN, geen media. */
  function bouKonteks(state, nou, opsies) {
    var o = opsies || {};
    var s = state || {};
    /* Klaar-merke staan in state.completedBlocks[id] (app.js), nie op die blok self nie. */
    var klaarLys = s.completedBlocks || {};
    var tyd = hhmm(nou);
    var blokke = (s.blocks || []).slice(0, 14).map(function (b) {
      return {
        id: b.id,
        tyd: (b.start || "?") + "–" + (b.end || "?"),
        titel: String(b.title || "").slice(0, 100),
        soort: b.soort || b.kind || null,
        vak: b.subjectSlug || null,
        klaar: Boolean(klaarLys[b.id])
      };
    });
    var huidig = (s.blocks || []).find(function (b) {
      return b.start && b.end && b.start <= tyd && tyd < b.end;
    });
    var foutbank = (s.faults || [])
      .filter(function (f) { return f && !f.resolved; })
      .slice(0, 10)
      .map(function (f) { return { vak: f.subjectSlug || f.subject || null, teks: String(f.text || "").slice(0, 200) }; });
    return {
      weergawe: WALLIE.APP_VERSION || null,
      skerm: o.skerm || null,
      tyd: tyd,
      datum: s.planDate || null,
      huidigeBlok: huidig ? { id: huidig.id, titel: String(huidig.title || "").slice(0, 160), tyd: huidig.start + "–" + huidig.end, soort: huidig.soort || null, klaar: Boolean(klaarLys[huidig.id]) } : null,
      /* Die eksamenklok loop van "Begin" af, nie die rooster nie: tydens 'n sessie (ook oortyd) geen inhoud-hulp nie. */
      sessieLoop: Boolean(o.sessieLoop),
      vandag: blokke,
      foutbank: foutbank,
      onlangseFoute: (o.foute || []).slice(-5),
      aanlyn: o.aanlyn !== false
    };
  }

  /* Hou net bekende aksies; die bediener se antwoord word nooit as HTML vertolk nie. */
  function ontleedAntwoord(data) {
    var d = data && typeof data === "object" ? data : {};
    var antwoord = typeof d.antwoord === "string" && d.antwoord.trim() ? d.antwoord.trim() : "";
    var aksies = (Array.isArray(d.aksies) ? d.aksies : []).filter(function (a) { return Object.prototype.hasOwnProperty.call(AKSIES, a); }).slice(0, 2);
    return { antwoord: antwoord, aksies: aksies, ernstig: Boolean(d.ernstig), bron: typeof d.bron === "string" ? d.bron : "" };
  }

  /* Vanlyn terugval: die vaste kennisbank, anders 'n eerlike boodskap. */
  function terugval(vraag) {
    var t = null;
    try {
      t = WALLIE.FOUTRAG && typeof WALLIE.FOUTRAG.soek === "function" ? WALLIE.FOUTRAG.soek(vraag) : null;
    } catch (e) {
      t = null;
    }
    if (t && t.antwoord) {
      return { antwoord: t.antwoord + "\n\n(Die hulpdiens is nou nie bereikbaar nie; hierdie antwoord kom uit die app se vaste hulp-antwoorde. Jou vraag word aan Pa gestuur.)", aksies: [], ernstig: true, bron: "vanlyn" };
    }
    return { antwoord: GEEN_DIENS, aksies: ["missie"], ernstig: true, bron: "geen" };
  }

  function onlangseFoute() {
    try {
      var sleutel = WALLIE.FOUTVANGER && WALLIE.FOUTVANGER.SLEUTEL;
      if (!sleutel) return [];
      var rou = W.localStorage.getItem(sleutel);
      var d = rou ? JSON.parse(rou) : null;
      var lys = Array.isArray(d) ? d : d && typeof d === "object" ? Object.keys(d).map(function (k) { return { sein: k, wanneer: d[k] }; }) : [];
      return lys.slice(-5).map(function (x) { return typeof x === "string" ? x.slice(0, 200) : JSON.stringify(x).slice(0, 200); });
    } catch (e) {
      return [];
    }
  }

  WALLIE.HULPKLETS = { bouKonteks: bouKonteks, ontleedAntwoord: ontleedAntwoord, terugval: terugval, AKSIES: AKSIES, WAG_MS: WAG_MS };

  if (typeof document === "undefined") return;

  /* ---------- UI: die klets is bo-aan die bestaande Hulp-paneel (hulp.js, #hulp-paneel). Een knoppie, geen tweede FAB. ---------- */

  var geskiedenis = [];
  var besig = false;
  var log, invoer, stuurKnop;

  function el(tag, klas, teks) {
    var e = document.createElement(tag);
    if (klas) e.className = klas;
    if (teks != null) e.textContent = teks;
    return e;
  }

  function skerm() {
    var v = document.querySelector(".view.active");
    return v && v.id ? v.id.replace(/^view-/, "") : null;
  }

  function paneelOop() {
    var p = document.getElementById("hulp-paneel");
    return Boolean(p && !p.hidden);
  }

  function sluitPaneel() {
    var k = document.querySelector("#hulp-paneel .hulp-close");
    if (k && paneelOop()) k.click();
  }

  function voerAksieUit(a) {
    if (a === "herlaai") {
      var u = new URL(W.location.href);
      u.searchParams.set("v", String(Date.now()));
      W.location.replace(u.toString());
      return;
    }
    sluitPaneel();
    try {
      WALLIE.app && WALLIE.app.showView(a);
    } catch (e) { /* stil */ }
  }

  function boodskap(rol, teks, aksies) {
    var b = el("div", "klets-msg klets-" + rol);
    b.appendChild(el("div", "klets-teks", teks));
    (aksies || []).forEach(function (a) {
      var k = el("button", "btn klets-aksie", AKSIES[a]);
      k.type = "button";
      k.dataset.aksie = a;
      k.addEventListener("click", function () { voerAksieUit(a); });
      b.appendChild(k);
    });
    log.appendChild(b);
    log.scrollTop = log.scrollHeight;
    return b;
  }

  function meldPa(vraag, uit) {
    try {
      if (!WALLIE.REMOTE || typeof WALLIE.REMOTE.bugReport !== "function") return;
      var nou = Date.now();
      WALLIE.REMOTE.bugReport({
        text: "Wallie vra (Hulp nou): " + vraag + "\n\nHulpbot (" + (uit.bron || "?") + "): " + uit.antwoord.slice(0, 600),
        data: { id: "klets_" + nou, at: nou, bron: "klets", ernstig: uit.ernstig, skerm: skerm(), weergawe: WALLIE.APP_VERSION || null },
        blocking: uit.ernstig
      });
    } catch (e) { /* Pa-melding mag nooit die klets breek nie */ }
  }

  /* Bly onder die bediener se 16 KB: kort antwoorde in die geskiedenis, en laat die oudste val as dit te groot is. */
  function liggaam(vraag, konteks) {
    var g = geskiedenis.slice(-8).map(function (m) { return { rol: m.rol, teks: String(m.teks).slice(0, 1200) }; });
    var json = JSON.stringify({ vraag: vraag, geskiedenis: g, konteks: konteks });
    while (json.length > 14000 && g.length) {
      g.shift();
      json = JSON.stringify({ vraag: vraag, geskiedenis: g, konteks: konteks });
    }
    return json;
  }

  async function vra(vraag) {
    var state = WALLIE.app && typeof WALLIE.app.state === "function" ? WALLIE.app.state() : {};
    var konteks = bouKonteks(state, new Date(), { skerm: skerm(), foute: onlangseFoute(), aanlyn: W.navigator ? W.navigator.onLine : true, sessieLoop: document.body.classList.contains("fokus-sessie") });
    var beheer = typeof AbortController === "function" ? new AbortController() : null;
    var wekker = beheer ? setTimeout(function () { beheer.abort(); }, WAG_MS) : null;
    try {
      var r = await fetch(WALLIE.KLETS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: liggaam(vraag, konteks),
        signal: beheer ? beheer.signal : undefined
      });
      var d = await r.json().catch(function () { return null; });
      var uit = ontleedAntwoord(d);
      /* 503 / bron "fout" of "weier": die model het misluk (bv. krediet op) → die vaste kennisbank, nie 'n leë troos nie. */
      if (!r.ok && r.status !== 429) throw new Error("status " + r.status);
      if (!uit.antwoord || uit.bron === "fout" || uit.bron === "weier") throw new Error("geen model-antwoord");
      return uit;
    } catch (e) {
      return terugval(vraag);
    } finally {
      if (wekker) clearTimeout(wekker);
    }
  }

  async function stuur() {
    var vraag = (invoer.value || "").trim();
    if (!vraag || besig) return;
    besig = true;
    stuurKnop.disabled = true;
    invoer.value = "";
    boodskap("wallie", vraag);
    var wag = boodskap("hulp", "…dink…");
    wag.classList.add("klets-wag");
    var uit = await vra(vraag);
    wag.remove();
    boodskap("hulp", uit.antwoord, uit.aksies);
    geskiedenis.push({ rol: "wallie", teks: vraag }, { rol: "hulp", teks: uit.antwoord });
    meldPa(vraag, uit);
    besig = false;
    stuurKnop.disabled = false;
    invoer.focus();
  }

  function bou() {
    var lyf = document.querySelector("#hulp-paneel .hulp-body");
    if (!lyf || document.getElementById("klets")) return;
    var fab = document.getElementById("hulp-fab");
    if (fab) fab.textContent = "💬 Hulp nou";
    var titel = document.getElementById("hulp-titel");
    if (titel) titel.textContent = "Hulp nou";

    var deel = el("section", "klets");
    deel.id = "klets";
    deel.setAttribute("aria-label", "Vra die hulp-chatbot");
    log = el("div", "klets-log");
    log.id = "klets-log";
    log.setAttribute("aria-live", "polite");
    var vorm = el("form", "klets-vorm");
    vorm.id = "klets-vorm";
    invoer = el("textarea", "klets-invoer");
    invoer.id = "klets-invoer";
    invoer.rows = 2;
    invoer.setAttribute("aria-label", "Jou vraag");
    invoer.placeholder = "Wat werk nie? Bv. \"die memo maak nie oop nie\"";
    invoer.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); stuur(); }
    });
    stuurKnop = el("button", "btn primary klets-stuur", "Vra");
    stuurKnop.type = "submit";
    stuurKnop.id = "klets-stuur";
    vorm.appendChild(invoer);
    vorm.appendChild(stuurKnop);
    vorm.addEventListener("submit", function (e) { e.preventDefault(); stuur(); });
    deel.appendChild(log);
    deel.appendChild(vorm);
    deel.appendChild(el("p", "klets-ander", "Of kies hieronder 'n skerm, soek in die hulp, of stuur 'n probleem-vorm."));
    lyf.insertBefore(deel, lyf.firstChild);
    boodskap("hulp", GROET);
  }

  /* Maak die Hulp-paneel oop met die klets; ook vir die Foutbank se knoppie (`data-klets-oop`). */
  WALLIE.HULPKLETS.maakOop = function () {
    bou();
    var fab = document.getElementById("hulp-fab");
    if (fab && !paneelOop()) fab.click();
    if (invoer) setTimeout(function () { invoer.focus(); }, 0);
  };

  /* Ander skerms (bv. die Foutbank) kan die klets met `data-klets-oop` oopmaak. */
  document.addEventListener("click", function (e) {
    var t = e.target && e.target.closest ? e.target.closest("[data-klets-oop]") : null;
    if (t) WALLIE.HULPKLETS.maakOop();
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bou);
  else bou();
})();
