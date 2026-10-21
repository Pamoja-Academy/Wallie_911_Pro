/* Visuele les-UI: matchday-kaarte, volgende-blok, Lesse-oortjie, les-kyker (prent → toe-boek → memo). */
(function () {
  const $ = (sel) => document.querySelector(sel);

  const KIND_LABEL = {
    rooi: "ROOI",
    geel: "GEEL",
    groen: "GROEN",
    warm: "OPWARM",
    slot: "SLOT",
    break: "RUS"
  };

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  const subject = (slug) => WALLIE.SUBJECTS.find((s) => s.slug === slug);
  const lesson = (slug) => WALLIE.LESSONS[slug];
  const subjectName = (slug) => subject(slug)?.naam || (slug === "foutbank" ? "Foutlog & slot" : slug);
  const zoneOf = (slug) => subject(slug)?.zone || "slot";

  function appState() {
    return WALLIE.app?.state?.() || null;
  }

  function progress() {
    const st = appState();
    if (!st) return {};
    st.lessonProgress = st.lessonProgress || {};
    return st.lessonProgress;
  }

  function statusOf(slug, id) {
    return progress()[`${slug}:${id}`]?.status || null;
  }

  /* Les-kaart sonder herhaling. Die verskuiwing is GLOBAAL: ’n teller in die geskiedenis wat met elke
     nuwe kaart aanskuif. Voorheen het die eerste blok van ELKE dag konsep [0] gewys — Wallie het 10 en
     11 Okt presies dieselfde kaart gekry. Die kaart van ’n blok word een keer gekies en gestoor, dus
     verander ’n herlaai (of ’n "reg"-merk) dit nie. */
  function pickConcept(slug, occurrence = 0, blockId = null) {
    const L = lesson(slug);
    if (!L) return null;
    const g = WALLIE.rttGeskiedenis;
    if (blockId && g) {
      const vas = g.kaartVanBlok(blockId);
      const c = vas ? L.concepts.find((x) => x.id === vas) : null;
      if (c) return c;
    }
    const basis = (g ? g.teller(slug) : 0) + (blockId ? 0 : occurrence);
    const open = L.concepts.filter((c) => statusOf(slug, c.id) !== "reg");
    /* Met net een oop konsep sou elke blok dieselfde kaart kry — dan roteer ons oor al die konsepte. */
    const poel = open.length > 1 ? open : L.concepts;
    const keuse = poel[((basis % poel.length) + poel.length) % poel.length];
    if (blockId && g && keuse) g.noteKaart(blockId, slug, keuse.id);
    return keuse;
  }

  /* ---------- DBE-werk per blok ---------- */

  const DBE = () => WALLIE.DBE || null;
  let werkKas = { sleutel: null, kaart: null };

  /* Elke blok se werk, in rooster-orde opgelos sodat twee blokke langs mekaar nooit dieselfde werk kry nie. */
  function werkKaart(state) {
    const blocks = state?.blocks || [];
    const dag = state?.planDate || WALLIE.todayKey();
    const sleutel = `${dag}|${blocks.map((b) => b.id).join("|")}`;
    if (werkKas.sleutel === sleutel && werkKas.kaart) return werkKas.kaart;
    const kaart = {};
    const gebruik = [];
    let vorige = null;
    blocks.forEach((b) => {
      const w = WALLIE.werkVirBlok?.(b, { dag, vorige, gebruik }) || null;
      if (!w) return;
      kaart[b.id] = w;
      gebruik.push(w);
      vorige = w;
    });
    werkKas = { sleutel, kaart };
    return kaart;
  }

  function vergeetWerkKas() {
    werkKas = { sleutel: null, kaart: null };
  }

  function werkVan(blockId) {
    const st = appState();
    if (!st || !blockId) return null;
    return werkKaart(st)[blockId] || null;
  }

  function blokById(blockId) {
    const st = appState();
    return (st?.blocks || []).find((b) => b.id === blockId) || null;
  }

  /* Geen blok gekies (bv. ná ’n herlaai): die blok waarin ons NOU is, vir die vak op die skerm. */
  function huidigeBlok() {
    const st = appState();
    if (!st) return null;
    const slug = $("#session-subject")?.value || "rtt";
    const nou = new Date().toTimeString().slice(0, 5);
    return (
      (st.blocks || []).find(
        (b) => b.subjectSlug === slug && b.kind !== "break" && b.start && b.end && b.start <= nou && nou <= b.end
      ) || null
    );
  }

  /* "Doen: V3 (19) · V4 (22) — 41 punte" */
  function vraeReel(werk, blok) {
    const d = DBE();
    if (!d || !werk) return "";
    const nrs = d.vraagNommers(werk);
    const punte = d.punte(werk, blok);
    if (!nrs.length && punte == null) return "";
    const wysPer = nrs.length > 1;
    const dele = nrs.map((n) => {
      const p = wysPer ? d.vraagPunte(werk, n) : null;
      return p ? `${d.vraagLabel(n, werk)} (${p})` : d.vraagLabel(n, werk);
    });
    const tot = punte != null ? ` — ${punte} punte` : "";
    return `<p class="werk-vrae"><strong>Doen:</strong> ${esc(dele.join(" · "))}${tot}</p>`;
  }

  /* Een reël vir die matchday-kaart: "DBE Mei/Junie 2026 V1 (Afr) · V5 · 35 punte" */
  function werkOpsomming(blok, werk) {
    const d = DBE();
    if (!d) return "";
    if (werk) {
      const punte = d.punte(werk, blok);
      return `${d.werkLabel(werk)}${punte != null ? ` · ${punte} punte` : ""}`;
    }
    if ((blok?.werk_ekstra || []).length) return `${blok.werk_ekstra.length} vraestelle + datalêers`;
    return "";
  }

  function masteredCount() {
    let reg = 0;
    let total = 0;
    Object.entries(WALLIE.LESSONS).forEach(([slug, L]) => {
      L.concepts.forEach((c) => {
        total += 1;
        if (statusOf(slug, c.id) === "reg") reg += 1;
      });
    });
    return { reg, total };
  }

  /* ---------- Hooftaak (eksamenvlak) ---------- */

  /* Blokke wat self al eksamenwerk of nasienwerk is, hou hul eie titel as hooftaak.
     "voor-eksamen" is die ligte eksamendag-opwarm (formaatkaarte lees, tas pak): geen nuwe werk, eie titel. */
  const EIE_TAAK = new Set(["merk", "herdoen", "opstel", "skrif", "toets", "voor-eksamen"]);

  /* Vraagbanke met eksamenvlak-items per vak; die ander vakke het nog geen nie (sien GAPING). */
  function bankVir(slug) {
    /* Items wat scripts/eksamenvlak-hek.js as onder die DBE-vraag gelys het, is agtergrond en nooit hooftaak nie. */
    const af = new Set(window.EKSAMENVLAK_AGTERGROND || []);
    let bank = [];
    if (slug === "engels" || slug === "afrikaans") bank = (window.VRAEBANK_V3 || []).filter((i) => i.vak === slug);
    else if (slug === "rtt") bank = window.VRAEBANK_RTT_V1 || [];
    return bank.filter((i) => !af.has(i.id) && !eksamenKlaar(i));
  }

  /* Die vraestel waaruit die item kom is al geskryf (PK.EXAMS-inskrywing van die vak met "V<n>" in sy naam,
     begintyd + 4 uur verby): daardie item is nie meer hooftaak nie (bv. Engels V3-items ná 15 Okt 13:00).
     Geen PK nie → geen filter. Items wat vas in die rooster staan (blok.item) word hier nie geraak nie. */
  function eksamenKlaar(item) {
    const lys = window.PK && window.PK.EXAMS;
    if (!lys || !item || (item.vak !== "engels" && item.vak !== "afrikaans") || item.vraestel == null) return false;
    const woord = new RegExp("\\bV" + String(item.vraestel) + "\\b");
    const eks = lys.find((x) => x.s === item.vak && woord.test(x.n));
    const begin = eks ? Date.parse(eks.at) : NaN;
    return Number.isFinite(begin) && begin + 4 * 3600000 < Date.now();
  }

  /* Geen vraagbank nie: Wallie werk uit 'n amptelike DBE-vraestel, op papier, getimed. (Gaping — Hanno moet die vraestel kies.) */
  const GAPING = {
    gasvryheid: "Nov 2025 Gasvryheidstudie, kies 'n vraag van ±20 punte (±18 min)",
    toerisme: "Nov 2025 Toerisme, kies 'n vraag van ±20 punte (±24 min)",
    wiskgelett: "Nov 2025 V1 Wisk. Geletterdheid, kies 'n vraag van ±20 punte (±24 min)"
  };

  function itemKort(item) {
    return String(item.id).replace(/^(eng|afr|rtt)-v3-|^rtt-v1-/, "");
  }

  function itemTaak(item, slug) {
    const tyd = window.Eksamenmodus?.tydMin(item, slug) || item.tyd_min;
    const naam = item.teksoort ? `${itemKort(item)} ${item.teksoort}` : itemKort(item);
    return {
      soort: "item",
      itemId: item.id,
      view: slug === "rtt" ? "oefenvrae" : "skryfwerk",
      tekst: `${naam} · ${item.punte} punte${tyd ? ` · ±${tyd} min` : ""} (${item.bron?.verwysing || "DBE"})`
    };
  }

  function pogings(id) {
    try {
      return window.VraebankStore ? window.VraebankStore.attempts(id).length : 0;
    } catch (e) {
      return 0;
    }
  }

  /* Die blok se EKSAMENVLAK-hooftaak. Nooit 'n agtergrondkaart nie.
       1. blok.item (vas in die rooster) · 2. DBE-vraestel (werk) · 3. blok wat self eksamenwerk is
       4. volgende item uit die vak se vraagbank (die minste gedoen eerste) wie se tyd in die blok se minute pas;
          pas geen item nie, dan die blok se eie titel · 5. gaping: DBE-vraestel op papier. */
  function hoofTaak(b, werk, occurrence = 0) {
    const slug = b.subjectSlug;
    const bank = bankVir(slug);
    if (b.item) {
      const vas = (window.VRAEBANK_V3 || []).concat(window.VRAEBANK_RTT_V1 || []).find((i) => i.id === b.item);
      if (vas) return itemTaak(vas, vas.vak || "rtt");
    }
    /* Wisk. Gel. se titel noem self die vraestel en vrae (plan-v5.test): geen herhaling nie (AGENTS §2.8) */
    if (werk) return { soort: "werk", tekst: DBE()?.item(werk.id)?.vak ? b.title : `${b.title} · ${DBE()?.werkLabel(werk) || ""}` };
    if (b.soort && EIE_TAAK.has(b.soort)) return { soort: "blok", tekst: b.title };
    if (bank.length) {
      /* Net items wat in die blok pas: 'n 15-min-blok kry nie 'n ±80-min-opstel as hooftaak nie */
      const pas = bank.filter((it) => {
        const tyd = window.Eksamenmodus?.tydMin(it, slug) || it.tyd_min;
        return tyd > 0 && tyd <= b.minutes;
      });
      if (!pas.length) return { soort: "blok", tekst: b.title };
      const orde = pas.map((it, n) => ({ it, n, p: pogings(it.id) })).sort((x, y) => x.p - y.p || x.n - y.n);
      return itemTaak(orde[((occurrence % orde.length) + orde.length) % orde.length].it, slug);
    }
    const g = GAPING[slug];
    return {
      soort: "gaping",
      tekst: g ? `Gebruik DBE-vraestel ${g} op papier, getimed` : b.title
    };
  }

  function hoofKnoppie(h) {
    return h && h.soort === "item"
      ? `<button type="button" class="btn ghost open-item" data-view="${h.view}" data-item="${esc(h.itemId)}">Maak item oop</button>`
      : "";
  }

  /* ---------- Missie ---------- */

  /* Die blok se eie naam op die kaart: "Vak — naam" wys net die naam (die vak staan al in die opskrif),
     ’n titel sonder streep wys heeltemal (die plan v4-blokke heet bv. "Jun 2026 V5 Databasis"). */
  function blockLabel(b) {
    const parts = String(b.title || "").split(" — ");
    return parts.length > 1 ? parts.slice(1).join(" — ") : String(b.title || "");
  }

  function matchdayCard(b, done, occurrence, ctx = {}) {
    const kindLabel = KIND_LABEL[b.kind] || b.kind;
    const time = b.start && b.end ? `${b.start}–${b.end}` : `${b.minutes} min`;
    if (b.kind === "break") {
      return `
      <li class="md-card kind-break ${done ? "done" : ""}${ctx.nou ? " is-nou" : ""}" data-id="${b.id}">
        <div class="md-body">
          <div class="md-meta"><span class="zone-tag break">${kindLabel}</span><span class="md-time">${time}</span></div>
          <h3>${esc(b.title)}</h3>
          <p class="md-concept">${esc(b.detail)}</p>
          <div class="md-actions"><button type="button" class="btn big ghost mark-done" data-id="${b.id}">Was daar ✓</button></div>
        </div>
      </li>`;
    }
    const slug = b.subjectSlug;
    const c = pickConcept(slug, occurrence, b.id);
    const img = c ? WALLIE.lessonImg(slug, c.id) : WALLIE.lessonImg(slug, "cover");
    const werk = ctx.werk || null;
    const opsomming = werkOpsomming(b, werk);
    /* Die LES is die hoofsaak op elke kaart, vir elke vak. ’n Vraestel kom as ’n ekstra reël daaronder
       by — dit vervang nooit die les nie. */
    const hoof = hoofTaak(b, werk, occurrence);
    const task = hoof.tekst;
    const label = blockLabel(b);
    /* Hooftaak = eksamenwerk. Die les-kaart is agtergrond (opsioneel) en kom onderaan. */
    const hoofReel =
      `<p class="md-hoof" data-soort="${hoof.soort}"><small>Hooftaak</small>${esc(hoof.tekst)}</p>` +
      (opsomming ? `<p class="md-werk"><small>${werk ? "Vraestel" : "Lêers"}</small>${esc(opsomming)}</p>` : "") +
      (c
        ? `<p class="md-concept"><small>Agtergrond (opsioneel)</small>${esc(c.titel)}</p>`
        : b.detail
          ? `<p class="md-concept">${esc(b.detail)}</p>`
          : "");
    return `
      <li class="md-card kind-${b.kind} ${done ? "done" : ""}${ctx.volgende ? " is-volgende" : ""}${ctx.nou ? " is-nou" : ""}" data-id="${b.id}">
        <button type="button" class="md-thumb open-lesson" data-slug="${slug}" data-concept="${c?.id || ""}" aria-label="Kyk les: ${esc(c?.titel || subjectName(slug))}">
          <img src="${img}" alt="${esc(c?.titel || subjectName(slug))}" loading="lazy" />
          ${done ? `<span class="md-done-badge">KLAAR ✓</span>` : ""}
        </button>
        <div class="md-body">
          <div class="md-meta">
            <span class="zone-tag ${b.kind}">${kindLabel}</span>
            <span class="md-time">${time}</span>
            ${label ? `<span class="md-label">${esc(label)}</span>` : ""}
          </div>
          <h3>${esc(subjectName(slug))}</h3>
          ${hoofReel}
          <div class="md-actions">
            <button type="button" class="btn big primary start-block" data-block="${b.id}" data-slug="${slug}" data-concept="${c?.id || ""}" data-min="${b.minutes}" data-title="${encodeURIComponent(task)}">▶ Begin ${b.minutes} min</button>
            ${hoofKnoppie(hoof)}
            ${c ? `<button type="button" class="btn big ghost open-lesson" data-slug="${slug}" data-concept="${c.id}">Agtergrond: kyk les</button>` : ""}
            <button type="button" class="btn big ghost mark-done" data-id="${b.id}" aria-label="Merk klaar">✓</button>
          </div>
        </div>
      </li>`;
  }

  function renderBlocks(state) {
    const seen = {};
    const kaart = werkKaart(state);
    /* K9: dieselfde reël as renderNextUp (eerste oop studieblok), en die blok van "nou" as die plan vandag s'n is */
    const volgende = state.blocks.find(
      (b) => b.kind !== "break" && !WALLIE.isVerborgeVak(b.subjectSlug) && !state.completedBlocks[b.id]
    );
    const nou = new Date().toTimeString().slice(0, 5);
    const vandag = state.planDate === WALLIE.todayKey();
    return state.blocks
      .filter((b) => !WALLIE.isVerborgeVak(b.subjectSlug))
      .map((b) => {
        const occ = seen[b.subjectSlug] || 0;
        seen[b.subjectSlug] = occ + 1;
        return matchdayCard(b, !!state.completedBlocks[b.id], occ, {
          werk: kaart[b.id] || null,
          volgende: Boolean(volgende && volgende.id === b.id),
          nou: Boolean(vandag && b.start && b.end && b.start <= nou && nou < b.end)
        });
      })
      .join("");
  }

  function renderNextUp(state) {
    const el = $("#next-up");
    if (!el) return;
    const next = state.blocks.find(
      (b) => b.kind !== "break" && !WALLIE.isVerborgeVak(b.subjectSlug) && !state.completedBlocks[b.id]
    );
    if (!next) {
      el.innerHTML = `
        <div class="next-card all-done">
          <img src="${WALLIE.lessonImg("foutbank", "top3")}" alt="Môre se top-3" />
          <div class="next-body">
            <p class="next-kicker">Vandag se blokke is klaar</p>
            <h2>Skryf môre se top-3</h2>
            <div class="md-actions"><button type="button" class="btn big primary open-lesson" data-slug="foutbank" data-concept="top3">Wys my hoe</button></div>
          </div>
        </div>`;
      return;
    }
    const seen = state.blocks.filter((b) => b.subjectSlug === next.subjectSlug).indexOf(next);
    const c = pickConcept(next.subjectSlug, Math.max(0, seen), next.id);
    const werk = werkKaart(state)[next.id] || null;
    const opsomming = werkOpsomming(next, werk);
    const time = next.start && next.end ? `${next.start}–${next.end} · ` : "";
    const hoof = hoofTaak(next, werk, Math.max(0, seen));
    const task = hoof.tekst;
    el.innerHTML = `
      <div class="next-card kind-${next.kind}">
        <button type="button" class="next-img open-lesson" data-slug="${next.subjectSlug}" data-concept="${c?.id || ""}" aria-label="Kyk les">
          <img src="${c ? WALLIE.lessonImg(next.subjectSlug, c.id) : WALLIE.lessonImg(next.subjectSlug, "cover")}" alt="${esc(c?.titel || "")}" />
        </button>
        <div class="next-body">
          <p class="next-kicker"><span class="zone-tag ${next.kind}">${KIND_LABEL[next.kind] || next.kind}</span> Volgende blok · ${time}${next.minutes} min</p>
          <h2>${esc(subjectName(next.subjectSlug))}</h2>
          <p class="next-titel">${esc(next.title)}</p>
          <p class="next-hoof" data-soort="${hoof.soort}"><small>Hooftaak</small>${esc(hoof.tekst)}</p>
          ${opsomming ? `<p class="next-werk"><small>${werk ? "Vraestel" : "Lêers"}</small>${esc(opsomming)}</p>` : ""}
          ${c ? `<p class="next-agtergrond"><small>Agtergrond (opsioneel)</small></p><p class="next-concept">${esc(c.titel)}</p><ul class="next-cues">${c.cues.slice(0, 3).map((q) => `<li>${esc(q)}</li>`).join("")}</ul>` : ""}
          <div class="md-actions">
            <button type="button" class="btn big primary js-start" data-block="${next.id}" data-slug="${next.subjectSlug}" data-concept="${c?.id || ""}" data-min="${next.minutes}" data-title="${encodeURIComponent(task)}">▶ Begin nou</button>
            ${hoofKnoppie(hoof)}
            ${c ? `<button type="button" class="btn big ghost open-lesson" data-slug="${next.subjectSlug}" data-concept="${c.id}">Agtergrond: kyk les</button>` : ""}
          </div>
        </div>
      </div>`;
  }

  /* ---------- Lesse-oortjie & galerye ---------- */

  let leerSlug = null;
  const leerOrder = () => [...WALLIE.SUBJECTS.map((s) => s.slug), "foutbank"].filter((s) => lesson(s));

  function conceptTiles(slug, highlightId) {
    const L = lesson(slug);
    if (!L) return "";
    return L.concepts
      .map((c) => {
        const st = statusOf(slug, c.id);
        const badge = st === "reg" ? `<span class="tile-badge ok">REG ✓</span>` : st === "fout" ? `<span class="tile-badge bad">HERTOETS</span>` : "";
        return `
        <button type="button" class="concept-tile open-lesson ${highlightId === c.id ? "is-current" : ""}" data-slug="${slug}" data-concept="${c.id}">
          <img src="${WALLIE.lessonImg(slug, c.id)}" alt="" loading="lazy" />
          <span class="tile-title">${esc(c.titel)}</span>
          ${badge}
        </button>`;
      })
      .join("");
  }

  function renderLeer(slug) {
    const subjEl = $("#leer-subjects");
    const galEl = $("#leer-gallery");
    if (!subjEl || !galEl) return;
    leerSlug = slug || leerSlug || leerOrder()[0];
    subjEl.innerHTML = leerOrder()
      .map((s) => {
        const L = lesson(s);
        const reg = L.concepts.filter((c) => statusOf(s, c.id) === "reg").length;
        return `
        <button type="button" class="leer-subject zone-${zoneOf(s)} ${s === leerSlug ? "active" : ""}" data-leer="${s}">
          <img src="${WALLIE.lessonImg(s, "cover")}" alt="" loading="lazy" />
          <span class="leer-name">${esc(L.kort)}</span>
          <span class="leer-progress">${reg}/${L.concepts.length} reg</span>
        </button>`;
      })
      .join("");
    const s = subject(leerSlug);
    galEl.innerHTML = `
      <div class="leer-head zone-${zoneOf(leerSlug)}">
        <h2>${esc(subjectName(leerSlug))}</h2>
        ${s ? WALLIE.vakAftelKop(leerSlug) : ""}
        ${s ? `<p>${esc(s.fokus)}</p>` : `<p>Sluit elke dag hiermee af.</p>`}
        <button type="button" class="btn big primary open-lesson" data-slug="${leerSlug}" data-concept="${pickConcept(leerSlug)?.id || ""}">▶ Begin by volgende konsep</button>
      </div>
      <div class="concept-grid">${conceptTiles(leerSlug)}</div>`;
    const m = masteredCount();
    const tot = $("#leer-total");
    if (tot) tot.textContent = `${m.reg} / ${m.total} konsepte reg (toe-boek)`;
  }

  function subjectStrip(slug) {
    return `<div class="concept-strip">${conceptTiles(slug)}</div>`;
  }

  /* ---------- Sessie: die vraestel ---------- */

  let pendingConcept = null;
  /* Watter blok se werk wys die sessieskerm nou, en vir watter blokke is die memo al oop? */
  let sessieBlokId = null;
  const memoOop = new Set();
  let memoTimer = null;

  /* Memo bly toe tydens ’n getimede toets of ’n volle vraestel (skrif); by merk/herdoen (en enige ander blok) is dit dadelik oop. */
  function memoGesluit(blok) {
    if (!blok || (blok.soort !== "toets" && blok.soort !== "skrif")) return false;
    if (memoOop.has(blok.id)) return false;
    const links = WALLIE.proctor?.active ? WALLIE.proctor.timeLeft() : null;
    if (links != null && links <= 0) return false;
    /* Die blok se venster is verby (bv. die sessie is vroeër gestop): die memo mag oop. */
    const nou = new Date().toTimeString().slice(0, 5);
    if (!WALLIE.proctor?.active && blok.end && nou > blok.end) return false;
    return true;
  }

  function werkKnoppies(werk, gesluit) {
    const sk = DBE()?.skakels(werk);
    if (!sk) return "";
    const memo = gesluit
      ? `<a class="btn ghost werk-knoppie is-gesluit" data-werk="memo" role="button" aria-disabled="true">Memo</a>`
      : `<a class="btn ghost werk-knoppie" data-werk="memo" href="${esc(sk.memo)}" target="_blank" rel="noopener noreferrer">Memo</a>`;
    /* RTT het datalêers; Wisk. Gel. het 'n antwoordeboek. */
    const tweede = sk.data
      ? `<a class="btn werk-knoppie" data-werk="data" href="${esc(sk.data)}" target="_blank" rel="noopener noreferrer">Datalêers</a>`
      : sk.antwoordeboek
        ? `<a class="btn werk-knoppie" data-werk="antwoordeboek" href="${esc(sk.antwoordeboek)}" target="_blank" rel="noopener noreferrer">Antwoordeboek (PDF)</a>`
        : "";
    return `
        <div class="btn-row werk-knoppies">
          <a class="btn primary werk-knoppie" data-werk="vraestel" href="${esc(sk.vraestel)}" target="_blank" rel="noopener noreferrer">Vraestel (PDF)</a>
          ${tweede}
          ${memo}
        </div>`;
  }

  function werkBlok(werk, blok, { hoof = false, gesluit = false } = {}) {
    const d = DBE();
    const sk = d?.skakels(werk);
    if (!sk) return "";
    return `
      <div class="${hoof ? "werk-hoof" : "werk-ekstra"}">
        <p class="werk-titel">${esc(d.werkLabel(werk))}</p>
        ${hoof ? vraeReel(werk, blok) : ""}
        ${werkKnoppies(werk, gesluit)}
        ${sk.data ? `<p class="hint werk-data-nota">${esc(sk.datatipe)} — ${esc(d.DATA_NOTA)}</p>` : ""}
        ${hoof && gesluit ? `<p class="hint werk-memo-wenk">Memo sluit oop wanneer die tyd verstreke is</p>` : ""}
      </div>`;
  }

  /* K2: tydens 'n sessie op 'n blok met 'n vaste eksamenvlak-item (blok.item): die hooftaak bo-aan, met een
     primêre knoppie na die item. Gebruik dieselfde .open-item-delegasie as die Missie-kaarte (app.js). */
  function renderSessieHooftaak(blok) {
    const el = $("#sessie-hooftaak");
    if (!el) return;
    const h = blok && blok.item && WALLIE.proctor?.active ? hoofTaak(blok, null, 0) : null;
    if (!h || h.soort !== "item") {
      el.hidden = true;
      el.innerHTML = "";
      return;
    }
    el.hidden = false;
    el.innerHTML = `
      <p class="sessie-hoof-kop"><small>Hooftaak</small>${esc(h.tekst)}</p>
      <button type="button" class="btn big primary open-item sessie-hoof-knop" data-view="${h.view}" data-item="${esc(h.itemId)}">Maak hooftaak oop</button>`;
  }

  /* Die vraestel-paneel: drie knoppies (vraestel, datalêers, memo) vir die blok se eie werk. */
  function renderSessionWerk(blockId) {
    const el = $("#session-werk");
    if (!el) return;
    if (blockId) sessieBlokId = blockId;
    const blok = blokById(sessieBlokId) || huidigeBlok();
    if (blok) sessieBlokId = blok.id;
    renderSessieHooftaak(blok);
    const werk = blok ? werkVan(blok.id) : null;
    const ekstra = (blok?.werk_ekstra || []).filter((w) => DBE()?.skakels(w));
    const hoof = DBE()?.skakels(werk) ? werk : null;
    if (!blok || (!hoof && !ekstra.length)) {
      el.hidden = true;
      el.innerHTML = "";
      stopMemoTimer();
      return;
    }
    const gesluit = memoGesluit(blok);
    el.hidden = false;
    el.innerHTML = `
      <div class="panel-head"><h2>Vandag se vraestel</h2><span class="hint">Amptelike DBE-lêers · maak in ’n nuwe oortjie oop</span></div>
      <p class="werk-blok-titel">${esc(blok.title)}</p>
      ${hoof ? werkBlok(hoof, blok, { hoof: true, gesluit }) : ""}
      ${ekstra.length ? `<p class="werk-ekstra-kop">${hoof ? "Ook hierdie blok:" : "Laai alles hier af:"}</p>` : ""}
      ${ekstra.map((w) => werkBlok(w, blok)).join("")}`;
    if (gesluit) startMemoTimer();
    else stopMemoTimer();
  }

  function startMemoTimer() {
    if (memoTimer) return;
    memoTimer = setInterval(() => {
      const blok = blokById(sessieBlokId);
      if (!blok) return;
      if (!memoGesluit(blok)) {
        memoOop.add(blok.id);
        renderSessionWerk();
      }
    }, 1000);
  }

  function stopMemoTimer() {
    if (memoTimer) clearInterval(memoTimer);
    memoTimer = null;
  }

  function onSessionEnd(outcome) {
    const blok = blokById(sessieBlokId);
    /* Die tyd is om: die memo mag nou oop (dit is die hele punt van ’n getimede blok). */
    if (blok && outcome === "tyd_klaar") memoOop.add(blok.id);
    vergeetWerkKas();
    renderSessionWerk();
  }

  /* ---------- Sessie: die les ---------- */

  function renderSessionLesson(slug, conceptId) {
    const el = $("#session-lesson");
    if (!el) return;
    slug = slug || $("#session-subject")?.value;
    if (!slug || !lesson(slug)) {
      el.innerHTML = "";
      return;
    }
    /* Dieselfde kaart as die blok se kaart op die Missie-skerm (vas per blok-id). */
    const c = (conceptId && lesson(slug).concepts.find((x) => x.id === conceptId)) || pickConcept(slug, 0, sessieBlokId);
    /* Die les staan altyd oop op die sessieskerm — ook by ’n blok met ’n DBE-vraestel. */
    el.innerHTML = `
      <div class="panel-head"><h2>Agtergrond (opsioneel)</h2><span class="hint">Les by hierdie sessie — oop hier binne, dit tel nie as wegkyk nie. Die hooftaak is die eksamenwerk hierbo.</span></div>
      <div class="session-lesson-main">
        <button type="button" class="session-lesson-img open-lesson" data-slug="${slug}" data-concept="${c.id}" aria-label="Maak les groot oop">
          <img src="${WALLIE.lessonImg(slug, c.id)}" alt="${esc(c.titel)}" />
        </button>
        <div>
          <h3>${esc(c.titel)}</h3>
          <ul class="next-cues">${c.cues.map((q) => `<li>${esc(q)}</li>`).join("")}</ul>
          <button type="button" class="btn big primary open-lesson" data-slug="${slug}" data-concept="${c.id}" data-mode="toe">Toe-boek nou</button>
        </div>
      </div>
      <div class="concept-strip">${conceptTiles(slug, c.id)}</div>`;
  }

  function onSessionStart(slug, blockId) {
    vergeetWerkKas();
    renderSessionWerk(blockId || null);
    renderSessionLesson(slug, pendingConcept?.slug === slug ? pendingConcept.id : null);
    pendingConcept = null;
  }

  /* ---------- Les-kyker ---------- */

  const viewer = { slug: null, idx: 0, mode: "kyk" };

  function openViewer(slug, conceptId, mode = "kyk") {
    const L = lesson(slug);
    if (!L) return;
    viewer.slug = slug;
    viewer.idx = Math.max(0, L.concepts.findIndex((c) => c.id === conceptId));
    viewer.mode = mode;
    $("#les-viewer").classList.remove("hidden");
    document.body.classList.add("les-open");
    drawViewer();
    $("#les-close")?.focus();
  }

  function closeViewer() {
    $("#les-viewer")?.classList.add("hidden");
    document.body.classList.remove("les-open");
    $("#les-figure")?.classList.remove("zoom");
    refreshAll();
  }

  function drawViewer() {
    const L = lesson(viewer.slug);
    const c = L.concepts[viewer.idx];
    const zone = zoneOf(viewer.slug);
    const v = $("#les-viewer");
    v.className = `les-viewer zone-${zone} mode-${viewer.mode}`;
    $("#les-zone").textContent = zone === "slot" ? "SLOT" : zone.toUpperCase();
    $("#les-zone").className = `zone-tag ${zone}`;
    $("#les-subject").textContent = subjectName(viewer.slug);
    $("#les-count").textContent = `${viewer.idx + 1} / ${L.concepts.length}`;
    $("#les-title").textContent = c.titel;
    const img = $("#les-img");
    img.src = WALLIE.lessonImg(viewer.slug, c.id);
    img.alt = c.titel;
    $("#les-cues").innerHTML = c.cues.map((q) => `<li>${esc(q)}</li>`).join("");
    $("#les-prompt").textContent = c.toeBoek;
    $("#les-memo-list").innerHTML = c.memo.map((m) => `<li>${esc(m)}</li>`).join("");
    $("#les-dots").innerHTML = L.concepts
      .map((x, i) => {
        const st = statusOf(viewer.slug, x.id);
        return `<button type="button" class="les-dot ${i === viewer.idx ? "on" : ""} ${st || ""}" data-dot="${i}" aria-label="Konsep ${i + 1}: ${esc(x.titel)}"></button>`;
      })
      .join("");
    $("#les-prev").disabled = viewer.idx === 0;
    $("#les-next").disabled = viewer.idx === L.concepts.length - 1;

    const actions = $("#les-actions");
    const canFault = !!subject(viewer.slug);
    if (viewer.mode === "kyk") {
      actions.innerHTML = `<button type="button" class="btn big primary" data-les="toe">Toe-boek: toets jouself ▶</button>`;
    } else if (viewer.mode === "toe") {
      actions.innerHTML = `<button type="button" class="btn big primary" data-les="memo">Klaar geskryf — wys memo</button>
        <button type="button" class="btn big ghost" data-les="kyk">Terug na prent</button>`;
    } else {
      actions.innerHTML = `<p class="les-ask">Het jy dit reg gehad — sonder om te loer?</p>
        <button type="button" class="btn big ok" data-les="reg">✓ Reg gehad</button>
        <button type="button" class="btn big danger" data-les="fout">✗ ${canFault ? "Fout → Foutbank" : "Nog nie"}</button>`;
    }
  }

  function mark(status) {
    const L = lesson(viewer.slug);
    const c = L.concepts[viewer.idx];
    const st = appState();
    if (st) {
      st.lessonProgress = st.lessonProgress || {};
      const key = `${viewer.slug}:${c.id}`;
      const prev = st.lessonProgress[key] || { tries: 0 };
      st.lessonProgress[key] = { status, at: Date.now(), tries: (prev.tries || 0) + 1 };
      if (status === "fout" && subject(viewer.slug)) {
        st.faults.unshift({
          id: "f_" + Date.now(),
          subjectSlug: viewer.slug,
          text: `Les: ${c.titel} — hertoets toe-boek`,
          createdAt: Date.now(),
          dueAt: Date.now(),
          resolved: false
        });
      }
      WALLIE.app.persist();
    }
    WALLIE.REMOTE?.publish({
      title: `LES ${status === "reg" ? "REG" : "FOUT"} — ${subjectName(viewer.slug)}`,
      message: `${c.titel}\nToe-boek → memo: ${status === "reg" ? "reg gehad" : "fout, in Foutbank"}`,
      tags: [status === "reg" ? "white_check_mark" : "x", "books"],
      priority: 2
    });
    if (viewer.idx < L.concepts.length - 1) {
      viewer.idx += 1;
      viewer.mode = "kyk";
      drawViewer();
    } else {
      viewer.mode = "kyk";
      drawViewer();
      $("#les-actions").innerHTML = `<p class="les-ask">Al ${L.concepts.length} konsepte gedoen. Sterk werk, #15.</p>
        <button type="button" class="btn big primary" data-les="close">Terug na matchday</button>`;
    }
  }

  function refreshAll() {
    const active = document.querySelector(".view.active")?.id;
    if (active === "view-missie") WALLIE.app?.renderMissie?.();
    if (active === "view-leer") renderLeer();
    if (active === "view-vakke") WALLIE.app?.renderVakke?.();
    if (active === "view-sessie") {
      renderSessionWerk();
      renderSessionLesson();
    }
  }

  /* ---------- Gebeure ---------- */

  document.addEventListener(
    "click",
    (e) => {
      const start = e.target.closest(".start-block");
      if (start && start.dataset.concept) pendingConcept = { slug: start.dataset.slug, id: start.dataset.concept };
    },
    true
  );

  document.addEventListener("click", (e) => {
    const open = e.target.closest(".open-lesson");
    if (open && lesson(open.dataset.slug)) {
      e.preventDefault();
      openViewer(open.dataset.slug, open.dataset.concept, open.dataset.mode || "kyk");
      return;
    }
    const js = e.target.closest(".js-start");
    if (js) {
      const slug = js.dataset.slug;
      if (slug === "foutbank") {
        WALLIE.app?.showView("foutbank");
        return;
      }
      pendingConcept = js.dataset.concept ? { slug, id: js.dataset.concept } : null;
      WALLIE.app?.startSession({ subjectSlug: slug, minutes: Number(js.dataset.min), task: decodeURIComponent(js.dataset.title || ""), blockId: js.dataset.block });
      return;
    }
    const leer = e.target.closest("[data-leer]");
    if (leer) {
      renderLeer(leer.dataset.leer);
      return;
    }
    const act = e.target.closest("[data-les]");
    if (act) {
      const a = act.dataset.les;
      if (a === "reg" || a === "fout") mark(a);
      else if (a === "close") closeViewer();
      else {
        viewer.mode = a;
        drawViewer();
      }
      return;
    }
    const dot = e.target.closest("[data-dot]");
    if (dot) {
      viewer.idx = Number(dot.dataset.dot);
      viewer.mode = "kyk";
      drawViewer();
      return;
    }
    if (e.target.closest(".nav-more .nav-btn")) {
      e.target.closest("details")?.removeAttribute("open");
    }
  });

  $("#les-close")?.addEventListener("click", closeViewer);
  $("#les-prev")?.addEventListener("click", () => {
    viewer.idx = Math.max(0, viewer.idx - 1);
    viewer.mode = "kyk";
    drawViewer();
  });
  $("#les-next")?.addEventListener("click", () => {
    viewer.idx = Math.min(lesson(viewer.slug).concepts.length - 1, viewer.idx + 1);
    viewer.mode = "kyk";
    drawViewer();
  });
  $("#les-figure")?.addEventListener("click", () => $("#les-figure").classList.toggle("zoom"));

  document.addEventListener("keydown", (e) => {
    if ($("#les-viewer")?.classList.contains("hidden")) return;
    if (e.key === "Escape") {
      if ($("#les-figure").classList.contains("zoom")) $("#les-figure").classList.remove("zoom");
      else closeViewer();
    } else if (e.key === "ArrowRight" && !$("#les-next").disabled) $("#les-next").click();
    else if (e.key === "ArrowLeft" && !$("#les-prev").disabled) $("#les-prev").click();
  });

  $("#session-subject")?.addEventListener("change", (e) => renderSessionLesson(e.target.value));

  function openFromQuery() {
    const q = new URLSearchParams(location.search);
    const slug = q.get("les");
    if (slug && lesson(slug)) openViewer(slug, q.get("k") || lesson(slug).concepts[0].id, q.get("mode") || "kyk");
  }

  WALLIE.lessonUI = {
    pickConcept,
    hoofTaak,
    matchdayCard,
    renderBlocks,
    renderNextUp,
    renderLeer,
    renderSessionLesson,
    renderSessionWerk,
    werkVan,
    werkKaart,
    vergeetWerkKas,
    onSessionStart,
    onSessionEnd,
    subjectStrip,
    masteredCount,
    openViewer,
    openFromQuery
  };
})();
