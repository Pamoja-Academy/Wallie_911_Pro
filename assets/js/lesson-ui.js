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

  function pickConcept(slug, occurrence = 0) {
    const L = lesson(slug);
    if (!L) return null;
    const open = L.concepts.filter((c) => statusOf(slug, c.id) !== "reg");
    if (open.length) return open[occurrence % open.length];
    const day = Math.floor(Date.now() / 86400000);
    return L.concepts[(day + occurrence) % L.concepts.length];
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

  /* ---------- Missie ---------- */

  function blockLabel(b) {
    const parts = String(b.title || "").split(" — ");
    return parts.length > 1 ? parts.slice(1).join(" — ") : "";
  }

  function matchdayCard(b, done, occurrence) {
    const kindLabel = KIND_LABEL[b.kind] || b.kind;
    const time = b.start && b.end ? `${b.start}–${b.end}` : `${b.minutes} min`;
    if (b.kind === "break") {
      return `
      <li class="md-card kind-break ${done ? "done" : ""}" data-id="${b.id}">
        <div class="md-body">
          <div class="md-meta"><span class="zone-tag break">${kindLabel}</span><span class="md-time">${time}</span></div>
          <h3>${esc(b.title)}</h3>
          <p class="md-concept">${esc(b.detail)}</p>
          <div class="md-actions"><button type="button" class="btn big ghost mark-done" data-id="${b.id}">Was daar ✓</button></div>
        </div>
      </li>`;
    }
    const slug = b.subjectSlug;
    const c = pickConcept(slug, occurrence);
    const img = c ? WALLIE.lessonImg(slug, c.id) : WALLIE.lessonImg(slug, "cover");
    const task = c ? `${b.title} · ${c.titel}` : b.title;
    const label = blockLabel(b);
    return `
      <li class="md-card kind-${b.kind} ${done ? "done" : ""}" data-id="${b.id}">
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
          ${c ? `<p class="md-concept"><small>Wat leer ek?</small>${esc(c.titel)}</p>` : `<p class="md-concept">${esc(b.detail)}</p>`}
          <div class="md-actions">
            <button type="button" class="btn big primary start-block" data-block="${b.id}" data-slug="${slug}" data-concept="${c?.id || ""}" data-min="${b.minutes}" data-title="${encodeURIComponent(task)}">▶ Begin ${b.minutes} min</button>
            ${c ? `<button type="button" class="btn big ghost open-lesson" data-slug="${slug}" data-concept="${c.id}">Kyk les</button>` : ""}
            <button type="button" class="btn big ghost mark-done" data-id="${b.id}" aria-label="Merk klaar">✓</button>
          </div>
        </div>
      </li>`;
  }

  function renderBlocks(state) {
    const seen = {};
    return state.blocks
      .filter((b) => !WALLIE.isVerborgeVak(b.subjectSlug))
      .map((b) => {
        const occ = seen[b.subjectSlug] || 0;
        seen[b.subjectSlug] = occ + 1;
        return matchdayCard(b, !!state.completedBlocks[b.id], occ);
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
    const c = pickConcept(next.subjectSlug, Math.max(0, seen));
    const time = next.start && next.end ? `${next.start}–${next.end} · ` : "";
    const task = c ? `${next.title} · ${c.titel}` : next.title;
    el.innerHTML = `
      <div class="next-card kind-${next.kind}">
        <button type="button" class="next-img open-lesson" data-slug="${next.subjectSlug}" data-concept="${c?.id || ""}" aria-label="Kyk les">
          <img src="${c ? WALLIE.lessonImg(next.subjectSlug, c.id) : WALLIE.lessonImg(next.subjectSlug, "cover")}" alt="${esc(c?.titel || "")}" />
        </button>
        <div class="next-body">
          <p class="next-kicker"><span class="zone-tag ${next.kind}">${KIND_LABEL[next.kind] || next.kind}</span> Volgende blok · ${time}${next.minutes} min</p>
          <h2>${esc(subjectName(next.subjectSlug))}</h2>
          ${c ? `<p class="next-concept">${esc(c.titel)}</p><ul class="next-cues">${c.cues.slice(0, 3).map((q) => `<li>${esc(q)}</li>`).join("")}</ul>` : ""}
          <div class="md-actions">
            <button type="button" class="btn big primary js-start" data-block="${next.id}" data-slug="${next.subjectSlug}" data-concept="${c?.id || ""}" data-min="${next.minutes}" data-title="${encodeURIComponent(task)}">▶ Begin nou</button>
            ${c ? `<button type="button" class="btn big ghost open-lesson" data-slug="${next.subjectSlug}" data-concept="${c.id}">Kyk les eers</button>` : ""}
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

  /* ---------- Sessie ---------- */

  let pendingConcept = null;

  function renderSessionLesson(slug, conceptId) {
    const el = $("#session-lesson");
    if (!el) return;
    slug = slug || $("#session-subject")?.value;
    if (!slug || !lesson(slug)) {
      el.innerHTML = "";
      return;
    }
    const c = (conceptId && lesson(slug).concepts.find((x) => x.id === conceptId)) || pickConcept(slug);
    el.innerHTML = `
      <div class="panel-head"><h2>Les vir hierdie sessie</h2><span class="hint">Oop hier binne — dit tel nie as wegkyk nie.</span></div>
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

  function onSessionStart(slug) {
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
    if (active === "view-sessie") renderSessionLesson();
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
    matchdayCard,
    renderBlocks,
    renderNextUp,
    renderLeer,
    renderSessionLesson,
    onSessionStart,
    subjectStrip,
    masteredCount,
    openViewer,
    openFromQuery
  };
})();
