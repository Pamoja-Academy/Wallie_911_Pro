/* Wallie_911_Pro — UI */
(function () {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];

  let state = WALLIE.storage.load();
  let locked = false;
  let sessionMeta = null;

  WALLIE.app = {
    state: () => state,
    persist,
    showView,
    renderMissie,
    renderVakke,
    startSession: startSessionFromUI
  };

  function persist() {
    WALLIE.storage.save(state);
  }

  /* Rekords van 'n verborge vak (ou data) bly in die berging, maar word nie vertoon nie. */
  const vis = (list) => (list || []).filter((x) => !WALLIE.isVerborgeVak(x?.subjectSlug));

  function ensurePlan() {
    const today = WALLIE.todayKey();
    const plan = WALLIE.buildDayPlan(today);
    const missingNewBlocks = ["engels", "toerisme"].some(
      (slug) =>
        plan.blocks.some((b) => b.subjectSlug === slug) &&
        !(state.blocks || []).some((b) => b.subjectSlug === slug)
    );
    /* Plan-handtekening: ’n NUWE plan vir VANDAG moet vandag reeds deurkom — anders sit Wallie vas met
       gister se weergawe van vandag se plan (die 11/12 Okt-blokke sou nooit gewys het nie).
       Die handtekening kyk net na die harde feite van ’n blok (id, tyd, duur, soort, item, werk), NIE na titel,
       detail of vak nie: ’n gestoorde blok wat net in vertoning verskil (bv. ’n ou, verborge vak) bly
       onaangeraak. Voltooide blokke, opnames, sessies en foute word nooit geraak nie — net blocks/planDate. */
    const sig = (blocks) =>
      (blocks || [])
        .map((b) => `${b.id}|${b.start || ""}|${b.end || ""}|${b.minutes}|${b.soort || ""}|${b.item || ""}|${b.werk ? JSON.stringify(b.werk) : ""}`)
        .join(";");
    const planVervang = state.planDate === today && sig(state.blocks) !== sig(plan.blocks);
    if (state.planDate !== today || !state.blocks?.length || missingNewBlocks || planVervang) {
      state.planDate = plan.date;
      state.blocks = plan.blocks;
      persist();
    }
  }

  function subjectBySlug(slug) {
    return WALLIE.SUBJECTS.find((s) => s.slug === slug);
  }

  /* Watter rooster-blok hoort by hierdie sessie? Eksplisiet (Begin-knoppie op ’n blok), anders die
     naaste onvoltooide blok van dieselfde vak vandag. */
  function findBlockRaw(blockId, subjectSlug) {
    const blocks = state.blocks || [];
    let b = blockId ? blocks.find((x) => x.id === blockId) : null;
    if (!b && subjectSlug) {
      const nowHm = new Date().toTimeString().slice(0, 5);
      const same = blocks.filter((x) => x.subjectSlug === subjectSlug && !state.completedBlocks[x.id]);
      b = same.find((x) => x.start && x.end && x.start <= nowHm && nowHm <= x.end) || same[0] || null;
    }
    return b || null;
  }

  /* Die blok soos dit na Pa gaan — presies dieselfde velde as altyd (geen nuwe veld in die payload). */
  function findBlock(blockId, subjectSlug) {
    const b = findBlockRaw(blockId, subjectSlug);
    if (!b) return null;
    return { id: b.id, title: b.title, start: b.start || null, end: b.end || null, minutes: b.minutes, kind: b.kind, subjectSlug: b.subjectSlug };
  }

  function fillSubjectSelects() {
    const opts = WALLIE.SUBJECTS.map(
      (s) => `<option value="${s.slug}">${s.naam}</option>`
    ).join("");
    ["#session-subject", "#fault-subject", "#upload-subject", "#bug-subject"].forEach((id) => {
      const el = $(id);
      if (!el) return;
      if (id === "#bug-subject") {
        el.innerHTML =
          `<option value="">— nie vak-spesifiek —</option>` + opts;
      } else {
        el.innerHTML = opts;
      }
    });
  }

  let vakAftelSig = null;

  function renderCountdown() {
    const now = new Date();
    const t = WALLIE.timeUntilExam(now);
    const ex = t.exam;
    const when = ex ? WALLIE.examWhen(ex.kick) : "";
    const set = (id, val) => {
      const el = $(id);
      if (el) el.textContent = val;
    };
    set("#days-left", t.past ? "Klaar" : WALLIE.fmtCountdown(t.ms));
    set("#countdown-label", ex ? `tot ${ex.n}` : "tot volgende vraestel");
    set("#cd-eyebrow", ex ? `Volgende vraestel · ${ex.n} · ${when}` : "Volgende vraestel");
    set("#missie-next-name", ex ? ex.n : "—");
    set("#cd-days", t.past ? "00" : WALLIE.pad2(t.days));
    set("#cd-hours", t.past ? "00" : WALLIE.pad2(t.hours));
    set("#cd-mins", t.past ? "00" : WALLIE.pad2(t.minutes));
    set("#cd-secs", t.past ? "00" : WALLIE.pad2(t.seconds));
    set(
      "#cd-status",
      t.past
        ? "Klaar — alle vraestelle is geskryf. Trots op jou."
        : `${t.days} dae · ${WALLIE.pad2(t.hours)}:${WALLIE.pad2(t.minutes)}:${WALLIE.pad2(t.seconds)} tot ${ex.n} (${when})`
    );

    const missieDays = $("#missie-days-left");
    if (missieDays) missieDays.textContent = t.past ? "0" : String(t.days);

    const clock = $("#countdown-clock");
    if (clock) clock.classList.toggle("is-live", !t.past);

    const list = $("#vak-aftel");
    if (list) {
      const per = WALLIE.SUBJECTS.map((s) => ({ s, ex: WALLIE.nextExam(now, s.slug) }));
      const sig = per.map((p) => `${p.s.slug}:${p.ex ? p.ex.n : ""}`).join("|");
      if (sig !== vakAftelSig) {
        vakAftelSig = sig;
        list.innerHTML = per
          .map(
            ({ s, ex: e }) => `
          <li class="vak-aftel-item" data-vak="${s.slug}">
            <span class="vak-aftel-naam">${s.naam}</span>
            <span class="vak-aftel-paper">${e ? `${e.n} · ${WALLIE.examWhen(e.kick)}` : "Alle vraestelle geskryf"}</span>
            <span class="vak-aftel-tyd" data-aftel-vak="${s.slug}"></span>
          </li>`
          )
          .join("");
      }
    }
    document.querySelectorAll("[data-aftel-vak]").forEach((el) => {
      const e = WALLIE.nextExam(now, el.dataset.aftelVak);
      el.textContent = e ? WALLIE.fmtCountdown(e.kick - now) : "Klaar";
      el.classList.toggle("is-klaar", !e);
    });
  }

  function renderMissie() {
    ensurePlan();
    const studyBlocks = vis(state.blocks).filter((b) => b.kind !== "break");
    const done = studyBlocks.filter((b) => state.completedBlocks[b.id]).length;
    const mins = studyBlocks.reduce((s, b) => s + b.minutes, 0);
    const doneMins = studyBlocks
      .filter((b) => state.completedBlocks[b.id])
      .reduce((s, b) => s + b.minutes, 0);

    const les = WALLIE.lessonUI.masteredCount();
    $("#day-stats").innerHTML = `
      <div class="stat"><b>${done}/${studyBlocks.length}</b><span>Blokke klaar</span></div>
      <div class="stat"><b>${doneMins}/${mins}m</b><span>Minute klaar</span></div>
      <div class="stat"><b>${les.reg}/${les.total}</b><span>Lesse reg (toe-boek)</span></div>
      <div class="stat"><b>${vis(state.faults).filter((f) => !f.resolved).length}</b><span>Oop foute</span></div>
    `;

    WALLIE.lessonUI.renderNextUp(state);
    $("#block-list").innerHTML = WALLIE.lessonUI.renderBlocks(state);
  }

  function renderVakke() {
    $("#subject-grid").innerHTML = WALLIE.SUBJECTS.map((s) => {
      const crit = s.prelim < 50 ? "crit" : "";
      const checks = s.lowHanging
        .map((item, i) => {
          const key = `${s.slug}:${i}`;
          const on = state.checklist[key] ? "checked" : "";
          return `<li><label><input type="checkbox" data-check="${key}" ${on} /><span>${item}</span></label></li>`;
        })
        .join("");
      const doneCount = s.lowHanging.filter((_, i) => state.checklist[`${s.slug}:${i}`]).length;
      return `
        <article class="subject-card zone-${s.zone}">
          <button type="button" class="subject-cover" data-leer-open="${s.slug}" aria-label="Lesse vir ${s.naam}">
            <img src="${WALLIE.lessonImg(s.slug, "cover")}" alt="" loading="lazy" />
          </button>
          <header>
            <h3>${s.naam}</h3>
            <span class="badge ${crit}">Prelim ${s.prelim}% → ${s.teiken}%</span>
          </header>
          ${WALLIE.vakAftelKop(s.slug)}
          <p class="meta">${s.fokus}</p>
          ${WALLIE.lessonUI.subjectStrip(s.slug)}
          <details class="checklist-wrap">
            <summary>Maklike punte-lys (${doneCount}/${s.lowHanging.length})</summary>
            <ul class="checklist">${checks}</ul>
          </details>
        </article>`;
    }).join("");
  }

  function renderFaults() {
    const list = [...vis(state.faults)].sort((a, b) => (a.resolved ? 1 : 0) - (b.resolved ? 1 : 0));
    $("#fault-list").innerHTML = list.length
      ? list
          .map((f) => {
            const sub = subjectBySlug(f.subjectSlug)?.naam || f.subjectSlug;
            const due = f.resolved
              ? "opgelos"
              : new Date(f.dueAt) <= new Date()
                ? "DUE NOU"
                : `weer ${new Date(f.dueAt).toLocaleDateString("af-ZA")}`;
            return `
            <li class="${f.resolved ? "done-fault" : ""}">
              <div>
                <strong>${sub}</strong> — ${f.text}
                <div class="due">${due}</div>
              </div>
              ${
                f.resolved
                  ? ""
                  : `<button type="button" class="btn small ghost resolve-fault" data-id="${f.id}">Reg gekry</button>`
              }
            </li>`;
          })
          .join("")
      : "<li>Nog geen foute — goeie teken of jy het nog nie eerlik gemerk nie.</li>";
  }

  function renderPapers() {
    const papers = vis(state.papers);
    $("#paper-list").innerHTML = papers.length
      ? papers
          .map((p) => {
            const sub = subjectBySlug(p.subjectSlug)?.naam || p.subjectSlug;
            return `<li><div><strong>${p.title}</strong><br/><span class="meta">${sub} · ${p.fileName || "lêer"}</span></div></li>`;
          })
          .join("")
      : "<li>Nog niks opgelaai nie.</li>";
  }

  function renderPa() {
    const live = state.live || {};
    const statusLabel =
      live.status === "active"
        ? "IN SESSIE"
        : live.status === "warned"
          ? "WAARSKUWING"
          : live.status === "locked"
            ? "GESLUIT"
            : "AF";
    const today = WALLIE.todayKey();
    const todays = vis(state.sessions).filter((s) => s.date === today);
    const mins = todays.reduce((a, s) => a + (s.durationMin || 0), 0);

    $("#pa-status-cards").innerHTML = `
      <div class="stat"><b>${statusLabel}</b><span>Lewendige status</span></div>
      <div class="stat"><b>${live.warnings || 0}</b><span>Waarskuwings (huidig)</span></div>
      <div class="stat"><b>${todays.length}</b><span>Sessies vandag</span></div>
      <div class="stat"><b>${mins}m</b><span>Gelogde minute</span></div>
    `;

    $("#pa-history").innerHTML = todays.length
      ? todays
          .map((s) => {
            const sub = subjectBySlug(s.subjectSlug)?.naam || s.subjectSlug;
            return `<li><strong>${sub}</strong> · ${s.durationMin}m · ${s.warnings} waarskuwings · ${s.outcome} · ${s.task || ""}</li>`;
          })
          .join("")
      : "<li>Nog geen sessies vandag nie.</li>";

    updateLiveDot();
  }

  function updateLiveDot() {
    const el = $("#live-dot");
    const st = state.live?.status || "off";
    el.className = "live-dot " + (st === "active" ? "on" : st === "warned" ? "warn" : st === "locked" ? "lock" : "off");
    el.textContent =
      st === "active" ? "IN SESSIE" : st === "warned" ? "WAARSKUWING" : st === "locked" ? "SLOT" : "AF";
  }

  function formatMs(ms) {
    const s = Math.ceil(ms / 1000);
    const m = String(Math.floor(s / 60)).padStart(2, "0");
    const r = String(s % 60).padStart(2, "0");
    return `${m}:${r}`;
  }

  function logEvent(text) {
    const ul = $("#session-events");
    const li = document.createElement("li");
    li.innerHTML = `<strong>${new Date().toLocaleTimeString("af-ZA")}</strong> — ${text}`;
    ul.prepend(li);
  }

  let memoUrl = null;
  let stillTimer = null;
  const STILL_MS = 45000;

  /* Klein JPEG van die kamera vir Pa se konsole — net tydens ’n aktiewe sessie */
  function captureStill() {
    const video = $("#camera");
    if (!WALLIE.proctor.active || !video?.videoWidth) return;
    const w = 320;
    const h = Math.round((video.videoHeight / video.videoWidth) * w) || 240;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d").drawImage(video, 0, 0, w, h);
    const b64 = canvas.toDataURL("image/jpeg", 0.6).split(",")[1];
    WALLIE.REMOTE?.sendStill(b64);
  }

  function startStills() {
    stopStills();
    setTimeout(captureStill, 5000);
    stillTimer = setInterval(captureStill, STILL_MS);
  }

  function stopStills() {
    if (stillTimer) clearInterval(stillTimer);
    stillTimer = null;
  }

  function openMemoPicker() {
    if (WALLIE.proctor.active && WALLIE.proctor.locked) {
      alert("Sessie is gesluit. Pa moet eers ontsluit.");
      return;
    }
    /* Die lêer-dialoog steel fokus; grasie eindig sodra die venster fokus terugkry */
    if (WALLIE.proctor.active) WALLIE.proctor.grace(60000, { untilFocus: true });
    $("#memo-file").click();
  }

  function showMemo(file) {
    if (memoUrl) URL.revokeObjectURL(memoUrl);
    memoUrl = URL.createObjectURL(file);
    const frame = $("#memo-frame");
    frame.src = memoUrl;
    $("#memo-viewer").classList.remove("hidden");
    $("#memo-toggle").textContent = "Maak memo toe";
    if (WALLIE.proctor.active) {
      const wasOpen = Boolean(WALLIE.proctor.memoSince);
      WALLIE.proctor.setMemoMode(true, frame);
      logEvent(`Memo oop in app: ${file.name}`);
      if (!wasOpen) {
        WALLIE.REMOTE?.memoEvent({
          subjectSlug: sessionMeta?.subjectSlug,
          open: true,
          fileName: file.name
        });
      }
    }
  }

  function closeMemo(why) {
    const viewer = $("#memo-viewer");
    if (!viewer || viewer.classList.contains("hidden")) return;
    viewer.classList.add("hidden");
    $("#memo-frame").removeAttribute("src");
    if (memoUrl) URL.revokeObjectURL(memoUrl);
    memoUrl = null;
    $("#memo-toggle").textContent = "Maak memo oop (PDF)";
    if (WALLIE.proctor.memoSince) {
      WALLIE.proctor.setMemoMode(false);
      logEvent(`Memo toe${why ? ` (${why})` : ""}`);
      WALLIE.REMOTE?.memoEvent({
        subjectSlug: sessionMeta?.subjectSlug,
        open: false,
        minutes: WALLIE.proctor.memoMinutes()
      });
    }
  }

  /* Sinkroniseer-aanwyser: altyd sigbaar bo-aan vir Wallie (en in Pa/Probleem-blaaie as teks) */
  function renderDurableStatus() {
    const sync = WALLIE.SYNC;
    if (!sync) return;
    const st = sync.status();
    const msg = sync.statusText(st);
    $$(".js-durable-status").forEach((el) => {
      el.textContent = msg;
    });
    const pill = $("#sync-pill");
    if (pill) {
      pill.className = `sync-pill sync-${st.level}`;
      pill.dataset.level = st.level;
      $("#sync-label").textContent = sync.label(st);
      pill.title = msg;
    }
  }

  function setCameraStatus(text, cls) {
    const el = $("#camera-status");
    el.textContent = text;
    el.className = "camera-overlay " + (cls || "");
  }

  function ensureRemoteConsent() {
    if (WALLIE.REMOTE?.hasConsent()) return true;
    $("#remote-consent-modal")?.classList.remove("hidden");
    return false;
  }

  function refreshRemoteConsentLabel() {
    const el = $("#remote-consent-status");
    if (!el || !WALLIE.REMOTE) return;
    el.textContent = WALLIE.REMOTE.hasConsent()
      ? "Toestemming: JA op hierdie toestel · seinen gaan na Pa"
      : "Toestemming: nog nie op hierdie toestel — sal gevra word vóór eerste sessie";
  }

  async function startSessionFromUI(opts = {}) {
    if (locked) {
      alert("Sessie is gesluit. Pa moet eers ontsluit.");
      return;
    }
    if (!ensureRemoteConsent()) {
      alert("Merk eers die waarneming-toestemming sodat Pa afstand-seine kan kry.");
      return;
    }
    const subjectSlug = opts.subjectSlug || $("#session-subject").value;
    const minutes = Math.round(Number(opts.minutes || $("#session-minutes").value)) || 45;
    const blockRaw = findBlockRaw(opts.blockId, subjectSlug);
    const block = findBlock(opts.blockId, subjectSlug);
    /* Watter DBE-werk hoort by hierdie blok? Die praktiese blok se merk gebruik dit ook. */
    WALLIE.DBE?.setAktief?.(WALLIE.werkVirBlok?.(blockRaw, { dag: state.planDate }) || null);
    const task = window.Praktiese?.taskFor?.(subjectSlug) || opts.task || $("#session-task").value;

    $("#session-subject").value = subjectSlug;
    $("#session-minutes").value = minutes;
    if (opts.task) $("#session-task").value = task;

    const video = $("#camera");
    const result = await WALLIE.proctor.start({
      minutes,
      onTick: (left, warnings) => {
        const paused = WALLIE.proctor.locked;
        $("#timer-display").textContent = formatMs(left) + (paused ? " ⏸" : "");
        $("#warn-display").textContent = `Waarskuwings: ${warnings} / 3`;
        $("#warn-display").classList.toggle("hot", warnings > 0);
        state.live = {
          status: paused ? "locked" : warnings > 0 ? "warned" : "active",
          sessionId: sessionMeta?.id,
          subject: subjectSlug,
          task,
          minutes,
          block,
          warnings,
          totalWarnings: WALLIE.proctor.totalWarnings,
          locks: WALLIE.proctor.locks,
          lockedMs: WALLIE.proctor.lockedTotalMs(),
          startedAt: sessionMeta?.startedAt || Date.now(),
          /* Laaste oomblik wat die app gelewe het — vir eerlike duur as die sessie onderbreek word */
          lastBeatAt: Date.now()
        };
        persist();
        updateLiveDot();
        WALLIE.REMOTE?.updateLive({
          status: state.live.status,
          warnings,
          totalWarnings: WALLIE.proctor.totalWarnings,
          locks: WALLIE.proctor.locks,
          leftMs: left
        });
      },
      onWarn: (n, reason, total) => {
        logEvent(`Waarskuwing ${n}: ${reason}`);
        setCameraStatus(`Waarskuwing ${n}/3 — ${reason}`, "warn");
        WALLIE.REMOTE?.sessionWarn({
          warnings: n,
          totalWarnings: total,
          reason,
          subjectSlug,
          leftMs: WALLIE.proctor.timeLeft()
        });
      },
      onIgnore: (reason) => {
        logEvent(`Nie getel nie (grasie ná begin/ontsluit): ${reason}`);
      },
      onMemoTimeout: () => {
        closeMemo("15 min memo-limiet");
      },
      onLock: (n, reason) => {
        locked = true;
        state.live.status = "locked";
        persist();
        closeMemo("slot");
        $("#lock-box").classList.remove("hidden");
        setCameraStatus("GESLUIT — tyd gepouseer · Pa-PIN nodig", "lock");
        logEvent(`Sessie gesluit ná 3 waarskuwings (laaste: ${reason}). Tyd gepouseer.`);
        updateLiveDot();
        WALLIE.REMOTE?.sessionLock({
          subjectSlug,
          reason: `3 waarskuwings (laaste: ${reason})`,
          locks: WALLIE.proctor.locks
        });
      },
      onEnd: (reason) => finishSession(reason)
    });

    if (!result.ok) {
      /* Pa moet weet hy het probeer en hoekom dit nie gewerk het nie */
      WALLIE.REMOTE?.startFailed({ subjectSlug, minutes, error: result.error, block });
      alert(result.error);
      setCameraStatus("Kamera af", "");
      return;
    }

    video.srcObject = result.stream;
    if (!$("#memo-viewer").classList.contains("hidden")) {
      WALLIE.proctor.setMemoMode(true, $("#memo-frame"));
    }
    sessionMeta = {
      id: "s_" + Date.now(),
      subjectSlug,
      minutes,
      task,
      block,
      warnings: 0,
      startedAt: Date.now(),
      date: WALLIE.todayKey()
    };
    state.live = {
      status: "active",
      sessionId: sessionMeta.id,
      subject: subjectSlug,
      task,
      minutes,
      block,
      warnings: 0,
      startedAt: sessionMeta.startedAt,
      lastBeatAt: sessionMeta.startedAt
    };
    /* Stuur eers, stoor dan — ’n stoor-fout mag nooit die sein na Pa keer nie */
    WALLIE.REMOTE?.sessionStart({
      sessionId: sessionMeta.id,
      subjectSlug,
      minutes,
      task,
      startedAt: sessionMeta.startedAt,
      block
    });
    persist();
    $("#start-session").disabled = true;
    $("#end-session").disabled = false;
    setCameraStatus("LEWENDIG — hard-proctor + Pa-sein", "live");
    logEvent(`Sessie begin: ${subjectBySlug(subjectSlug)?.naam || subjectSlug} (${minutes}m)`);
    updateLiveDot();
    startStills();
    showView("sessie");
    WALLIE.lessonUI.onSessionStart(subjectSlug, blockRaw ? blockRaw.id : null);
  }

  function finishSession(outcome) {
    closeMemo("sessie klaar");
    /* Die praktiese blok eindig saam met die sessie — anders bly dit loop en oorskryf die taak
       van die volgende sessie met die kaal merk. */
    window.Praktiese?.end?.();
    const warnings = WALLIE.proctor.totalWarnings || 0;
    const locks = WALLIE.proctor.locks || 0;
    const memoMin = WALLIE.proctor.memoMinutes();
    const endedAt = Date.now();
    const lockedMs = WALLIE.proctor.lockedTotalMs();
    const actualMs = sessionMeta ? Math.max(0, endedAt - sessionMeta.startedAt - lockedMs) : 0;
    const elapsedMin = sessionMeta ? Math.max(1, Math.round(actualMs / 60000)) : 0;

    let newSession = null;
    const plannedMin = sessionMeta?.minutes;
    const task = sessionMeta?.task;
    const subjectSlug = sessionMeta?.subjectSlug;
    if (sessionMeta) {
      newSession = {
        id: sessionMeta.id,
        date: sessionMeta.date,
        subjectSlug,
        task,
        durationMin: Math.min(elapsedMin, sessionMeta.minutes),
        actualMin: Math.round(actualMs / 60000),
        plannedMin,
        startedAt: sessionMeta.startedAt,
        endedAt,
        block: sessionMeta.block || null,
        warnings,
        locks,
        memoMin,
        outcome
      };
      /* Stuur eers die verslag (tou in localStorage) — dan die plaaslike staat */
      WALLIE.REMOTE?.sessionEnd({
        sessionId: newSession.id,
        subjectSlug,
        durationMin: newSession.actualMin,
        actualMs,
        lockedMs,
        plannedMin,
        outcome,
        warnings,
        locks,
        memoMin,
        task,
        date: newSession.date,
        startedAt: sessionMeta.startedAt,
        endedAt,
        block: sessionMeta.block || null
      });
      state.sessions.unshift(newSession);
      state.pendingSurveySessionId = newSession.id;
    }

    stopStills();
    WALLIE.proctor.stop();
    $("#camera").srcObject = null;
    $("#start-session").disabled = false;
    $("#end-session").disabled = true;
    state.live = { status: "off", subject: null, warnings: 0, startedAt: null };
    sessionMeta = null;
    persist();
    setCameraStatus("Kamera af", "");
    WALLIE.lessonUI.onSessionEnd?.(outcome);
    logEvent(`Sessie klaar (${outcome})`);
    updateLiveDot();
    renderPa();
    if (newSession) {
      openWallieSurvey(newSession);
    } else {
      WALLIE.REMOTE?.pingOffline();
    }
  }

  function buildSurveyForm(formEl, fields, prefix) {
    formEl.innerHTML = fields
      .map((f) => {
        if (f.type === "scale") {
          const btns = [];
          for (let i = f.min; i <= f.max; i++) {
            btns.push(
              `<button type="button" data-scale="${prefix}-${f.id}" data-val="${i}">${i}</button>`
            );
          }
          return `<div class="survey-q" data-field="${f.id}" data-type="scale">
            <label class="q-label">${f.label}</label>
            <div class="scale-row">${btns.join("")}</div>
            <input type="hidden" name="${f.id}" id="${prefix}-${f.id}" required />
          </div>`;
        }
        if (f.type === "choice") {
          const opts = f.options
            .map(
              (o) =>
                `<label><input type="radio" name="${f.id}" value="${o.v}" required /> <span>${o.t}</span></label>`
            )
            .join("");
          return `<div class="survey-q" data-field="${f.id}" data-type="choice">
            <label class="q-label">${f.label}</label>
            <div class="choice-row">${opts}</div>
          </div>`;
        }
        return `<div class="survey-q" data-field="${f.id}" data-type="text">
          <label class="q-label">${f.label}</label>
          <textarea name="${f.id}" id="${prefix}-${f.id}" placeholder="${f.placeholder || ""}"></textarea>
        </div>`;
      })
      .join("");

    formEl.querySelectorAll("[data-scale]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const name = btn.dataset.scale;
        formEl.querySelectorAll(`[data-scale="${name}"]`).forEach((b) => b.classList.remove("on"));
        btn.classList.add("on");
        const hidden = document.getElementById(name);
        if (hidden) hidden.value = btn.dataset.val;
      });
    });
  }

  function readSurveyAnswers(formEl, fields) {
    const answers = {};
    for (const f of fields) {
      if (f.type === "choice") {
        const checked = formEl.querySelector(`input[name="${f.id}"]:checked`);
        if (!checked) return { ok: false, missing: f.label };
        answers[f.id] = checked.value;
      } else if (f.type === "scale") {
        const el = formEl.querySelector(`#${formEl.id.includes("wallie") ? "wallie" : "pa"}-${f.id}`) ||
          formEl.querySelector(`[name="${f.id}"]`);
        const hidden = formEl.querySelector(`input[type="hidden"][name="${f.id}"]`);
        const val = (hidden || el)?.value;
        if (!val) return { ok: false, missing: f.label };
        answers[f.id] = val;
      } else {
        const ta = formEl.querySelector(`[name="${f.id}"]`);
        answers[f.id] = (ta?.value || "").trim();
      }
    }
    return { ok: true, answers };
  }

  function openWallieSurvey(session) {
    const form = $("#wallie-survey-form");
    buildSurveyForm(form, WALLIE.SURVEY.wallieFields, "wallie");
    $("#wallie-survey-meta").textContent = `${subjectBySlug(session.subjectSlug)?.naam || session.subjectSlug} · ${session.durationMin}m · waarskuwings ${session.warnings}`;
    form.dataset.sessionId = session.id;
    form.dataset.subjectSlug = session.subjectSlug;
    $("#wallie-survey-modal").classList.remove("hidden");
  }

  function fillPaSurveyForm() {
    const form = $("#pa-survey-form");
    if (!form || form.dataset.ready === "1") return;
    buildSurveyForm(form, WALLIE.SURVEY.paFields, "pa");
    form.dataset.ready = "1";
  }

  function fillPaSessionSelect() {
    const sel = $("#pa-survey-session");
    if (!sel) return;
    const today = WALLIE.todayKey();
    const list = vis(state.sessions).filter((s) => s.date === today);
    sel.innerHTML = list.length
      ? list
          .map((s) => {
            const naam = subjectBySlug(s.subjectSlug)?.naam || s.subjectSlug;
            return `<option value="${s.id}">${naam} · ${s.durationMin}m · ${s.warnings}w</option>`;
          })
          .join("")
      : `<option value="">Geen sessie vandag nie</option>`;
  }

  function renderVerbeter() {
    const today = WALLIE.todayKey();
    const syn = WALLIE.synthesizeDay(
      { ...state, sessions: vis(state.sessions), wallieSurveys: vis(state.wallieSurveys) },
      today
    );
    $("#verbeter-stats").innerHTML = `
      <div class="stat"><b>${syn.sessionCount}</b><span>Sessies</span></div>
      <div class="stat"><b>${syn.wallieCount}</b><span>Wallie-surveys</span></div>
      <div class="stat"><b>${syn.paCount}</b><span>Pa-surveys</span></div>
      <div class="stat"><b>${syn.avgFokus}</b><span>Gem. fokus (sy)</span></div>
    `;
    $("#verbeter-flags").innerHTML = syn.flags.length
      ? syn.flags
          .map((f) => `<li class="${f.level}">${f.text}</li>`)
          .join("")
      : `<li>Geen vlae — nog min data of alles lyk in lyn.</li>`;
    $("#verbeter-aksies").innerHTML = syn.aksies.map((a) => `<li>${a}</li>`).join("");

    const wallie = vis(state.wallieSurveys).filter((s) => s.date === today);
    const pa = (state.paSurveys || []).filter((s) => s.date === today);
    const raw = [
      ...wallie.map(
        (w) =>
          `<li><strong>Wallie</strong> ${subjectBySlug(w.subjectSlug)?.naam || w.subjectSlug}: fokus ${w.answers.fokus}/5 · metode ${w.answers.metode} · blokkade ${w.answers.blokkade} · eerlikheid ${w.answers.eerlikheid}${w.answers.help_more ? ` · “${w.answers.help_more}”` : ""}</li>`
      ),
      ...pa.map(
        (p) =>
          `<li><strong>Pa</strong>: teenwoordig ${p.answers.teenwoordig} · produksie ${p.answers.produksie} · vertroue ${p.answers.vertroue} · roep ${p.answers.verandering}${p.answers.nota ? ` · ${p.answers.nota}` : ""}</li>`
      )
    ];
    $("#verbeter-raw").innerHTML = raw.length ? raw.join("") : "<li>Nog geen surveys vandag nie.</li>";

    const bugs = vis(state.bugReports).filter((b) => b.date === today);
    $("#verbeter-bugs").innerHTML = bugs.length
      ? bugs
          .map((b) => {
            const sub = b.subjectSlug
              ? subjectBySlug(b.subjectSlug)?.naam || b.subjectSlug
              : "algemeen";
            return `<li class="${b.severity === "blokkeer" ? "alert-line" : ""}"><strong>${b.tipe}</strong> · ${b.severity} · ${sub}<br/>${b.detail}${b.code ? `<br/><code>${b.code}</code>` : ""} · ${new Date(b.at).toLocaleTimeString("af-ZA")}</li>`;
          })
          .join("")
      : "<li>Geen probleem-rapportee vandag nie.</li>";
  }

  function renderBugs() {
    const today = WALLIE.todayKey();
    const bugs = vis(state.bugReports).filter((b) => b.date === today);
    const el = $("#bug-list-wallie");
    if (!el) return;
    el.innerHTML = bugs.length
      ? bugs
          .map(
            (b) =>
              `<li><strong>${b.tipe}</strong> · ${b.severity}${b.subjectSlug ? " · " + (subjectBySlug(b.subjectSlug)?.naam || "") : ""}<br/>${b.detail}${b.code ? ` · kode: ${b.code}` : ""}</li>`
          )
          .join("")
      : "<li>Nog niks gerapporteer vandag nie. As iets breek — stuur hier.</li>";
  }

  function showView(name) {
    $$(".view").forEach((v) => v.classList.remove("active"));
    $$(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.view === name));
    $(`#view-${name}`)?.classList.add("active");
    if (name === "missie") renderMissie();
    if (name === "leer") WALLIE.lessonUI.renderLeer();
    if (name === "sessie") {
      WALLIE.lessonUI.renderSessionWerk(sessionMeta?.block?.id || null);
      WALLIE.lessonUI.renderSessionLesson(sessionMeta?.subjectSlug);
    }
    if (name === "vakke") renderVakke();
    if (name === "foutbank") renderFaults();
    if (name === "oplaai") renderPapers();
    if (name === "pa") {
      renderPa();
      fillPaSurveyForm();
      fillPaSessionSelect();
    }
    if (name === "verbeter") renderVerbeter();
    if (name === "probleem") renderBugs();
  }

  $("#main-nav").addEventListener("click", (e) => {
    const btn = e.target.closest(".nav-btn");
    if (btn) showView(btn.dataset.view);
  });

  function logFileName() {
    return `wallie911-log-${WALLIE.todayKey()}.json`;
  }

  function rawLogText() {
    const raw = localStorage.getItem(WALLIE.storage.KEY);
    if (!raw) return "{\n}\n";
    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return raw;
    }
  }

  function setExportStatus(msg) {
    $$(".js-export-status").forEach((el) => {
      el.textContent = msg;
    });
  }

  function downloadLog() {
    const text = rawLogText();
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = logFileName();
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    let empty = false;
    try {
      empty = Object.keys(JSON.parse(text)).length === 0;
    } catch {
      empty = !text.trim();
    }
    setExportStatus(
      empty
        ? "Geen log in hierdie blaaier nie — leë JSON afgelaai. Geen sessies bygemaak nie."
        : `Log afgelaai: ${logFileName()}. Stuur die lêer na hannovz@gmail.com.`
    );
  }

  async function copyLog() {
    const text = rawLogText();
    try {
      await navigator.clipboard.writeText(text);
      setExportStatus("Log is in die knipbord. Plak dit in WhatsApp of e-pos na hannovz@gmail.com.");
      return true;
    } catch {
      setExportStatus("Kopieer het nie gewerk nie. Gebruik “Laai log af (JSON)”.");
      return false;
    }
  }

  async function shareLog() {
    const text = rawLogText();
    const name = logFileName();
    const file = new File([text], name, { type: "application/json" });
    const caption = `Wallie_911 kamp-log vir Pa · hannovz@gmail.com · ${WALLIE.todayKey()}`;
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: caption, text: caption });
        setExportStatus("Deel-kieslys oop. Kies WhatsApp of e-pos na hannovz@gmail.com.");
        return;
      } catch (err) {
        if (err && err.name === "AbortError") return;
      }
    }
    await copyLog();
    const subject = encodeURIComponent(`Wallie_911 log ${WALLIE.todayKey()}`);
    const body = encodeURIComponent(
      "Pa — Wallie se volle log (wallie911_v2_bok) is in die knipbord en/of die afgelaaide JSON-lêer. Plak dit hier as die lêer nie geheg is nie. Moenie ’n verkorte weergawe as die volle log behandel nie."
    );
    const mail = document.createElement("a");
    mail.href = `mailto:hannovz@gmail.com?subject=${subject}&body=${body}`;
    mail.click();
    const wa = `https://wa.me/?text=${encodeURIComponent(caption + " — log is in die knipbord, plak dit in hierdie klets.")}`;
    window.open(wa, "_blank", "noopener");
  }

  /* "Maak item oop" (eksamenvlak-hooftaak) staan op die blokkaart (#block-list) EN op die Volgende-kaart
     (#next-up): daarom een dokument-vlak delegasie, nie ’n hanteerder per houer nie. */
  document.body.addEventListener("click", (e) => {
    const item = e.target.closest(".open-item");
    if (item) {
      /* Eksamenvlak-hooftaak: spring na die item in Skryfwerk / Oefenvrae */
      const view = item.dataset.view;
      const opener = { skryfwerk: window.SkryfwerkUI, oefenvrae: window.OefenvraeUI }[view];
      showView(view);
      /* Ná die skerm se eie "lys"-herteken (MutationObserver-mikrotaak) */
      Promise.resolve().then(() => opener?.open(item.dataset.item));
      return;
    }
    if (e.target.closest(".js-export-log")) downloadLog();
    else if (e.target.closest(".js-share-log")) shareLog();
    else if (e.target.closest(".js-copy-log")) copyLog();
  });

  $("#regen-plan").addEventListener("click", () => {
    const plan = WALLIE.buildDayPlan(WALLIE.todayKey());
    state.planDate = plan.date;
    state.blocks = plan.blocks;
    persist();
    renderMissie();
  });

  $("#block-list").addEventListener("click", (e) => {
    const start = e.target.closest(".start-block");
    if (start) {
      const slug = start.dataset.slug;
      if (slug === "foutbank" || slug === "break") {
        if (slug === "foutbank") showView("foutbank");
        return;
      }
      startSessionFromUI({
        subjectSlug: slug,
        minutes: Number(start.dataset.min),
        task: decodeURIComponent(start.dataset.title || ""),
        blockId: start.dataset.block
      });
    }
    const done = e.target.closest(".mark-done");
    if (done) {
      const at = Date.now();
      const blok = state.blocks.find((b) => b.id === done.dataset.id) || { id: done.dataset.id };
      /* Studieblok "klaar" sonder genoeg werk: eers 'n waarskuwing ("Seker? Dit is eksamenwerk"). Die tweede klik bevestig. */
      /* Pogings op die blok se eksamenvlak-item tel ook as werk (net vandag se, met hul minute_gebruik) */
      let pogings = [];
      try {
        const vandag = WALLIE.todayKey();
        if (blok.item && window.VraebankStore) {
          pogings = window.VraebankStore.attempts(blok.item).filter((p) => p && WALLIE.todayKey(new Date(p.t)) === vandag);
        }
      } catch (err) {
        pogings = [];
      }
      /* O1: eksamenmodus-werk van vandag (begin, papier-boks/konsep, "Ek is klaar") tel ook, al is "Stoor my punte" nog nie gedruk nie */
      let eksamen = null;
      try {
        if (blok.item && window.Eksamenmodus?.vandagWerk) eksamen = window.Eksamenmodus.vandagWerk(blok.item, at);
      } catch (err) {
        eksamen = null;
      }
      const vroeg = window.VroegKlaar?.kontroleer(
        blok,
        vis(state.sessions),
        sessionMeta ? { blockId: sessionMeta.block?.id, startedAt: sessionMeta.startedAt } : null,
        at,
        pogings,
        eksamen
      );
      if (vroeg && !done.dataset.bevestig) {
        done.dataset.bevestig = "1";
        done.classList.add("is-waarsku");
        done.textContent = "Seker? Klaar";
        const wenk = document.createElement("p");
        wenk.className = "vroeg-wenk";
        wenk.setAttribute("role", "alert");
        wenk.textContent = window.VroegKlaar.teks(vroeg) + " Druk weer om te bevestig.";
        done.closest(".md-body")?.append(wenk);
        return;
      }
      /* Spoor vir Pa (LL-01): het die eksamenmodus-werk die waarskuwing onderdruk, stuur die minute saam (bestaande soort "block"). */
      const spoor = vroeg
        ? { vroeg_klaar: vroeg.kode, minute_gedoen: vroeg.gedoen, minute_beplan: vroeg.plan }
        : eksamen && eksamen.werk
          ? { eksamen_min: eksamen.minute }
          : null;
      WALLIE.REMOTE?.blockDone(blok, at, spoor);
      /* Tydstempel i.p.v. true (steeds "truthy" vir ou kode) sodat Pa weet wanneer */
      state.completedBlocks[done.dataset.id] = at;
      persist();
      renderMissie();
    }
  });

  $("#subject-grid").addEventListener("click", (e) => {
    const cover = e.target.closest("[data-leer-open]");
    if (!cover) return;
    showView("leer");
    WALLIE.lessonUI.renderLeer(cover.dataset.leerOpen);
  });

  $("#subject-grid").addEventListener("change", (e) => {
    if (e.target.matches("[data-check]")) {
      state.checklist[e.target.dataset.check] = e.target.checked;
      persist();
    }
  });

  $("#fault-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const subjectSlug = $("#fault-subject").value;
    const text = $("#fault-text").value.trim();
    if (!text) return;
    state.faults.unshift({
      id: "f_" + Date.now(),
      subjectSlug,
      text,
      createdAt: Date.now(),
      dueAt: Date.now(),
      resolved: false
    });
    $("#fault-text").value = "";
    persist();
    renderFaults();
  });

  $("#fault-list").addEventListener("click", (e) => {
    const btn = e.target.closest(".resolve-fault");
    if (!btn) return;
    const f = state.faults.find((x) => x.id === btn.dataset.id);
    if (f) {
      f.resolved = true;
      f.dueAt = Date.now() + 2 * 86400000;
      persist();
      renderFaults();
    }
  });

  $("#upload-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const file = $("#upload-file").files[0];
    const title = $("#upload-title").value.trim();
    const subjectSlug = $("#upload-subject").value;
    state.papers.unshift({
      id: "p_" + Date.now(),
      subjectSlug,
      title,
      fileName: file ? file.name : "(geen lêer — slegs titel)",
      memoName: $("#upload-memo").files[0]?.name || null,
      savedAt: Date.now()
    });
    persist();
    $("#upload-title").value = "";
    $("#upload-file").value = "";
    $("#upload-memo").value = "";
    renderPapers();
  });

  $("#start-session").addEventListener("click", () => startSessionFromUI());
  $("#memo-toggle").addEventListener("click", () => {
    if ($("#memo-viewer").classList.contains("hidden")) openMemoPicker();
    else closeMemo();
  });
  $("#memo-file").addEventListener("change", (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (file) showMemo(file);
  });
  $("#end-session").addEventListener("click", () => {
    if (locked) {
      alert("Eers ontsluit met Pa-PIN.");
      return;
    }
    finishSession("handmatig");
  });

  $("#unlock-btn").addEventListener("click", () => {
    const pin = $("#unlock-pin").value;
    if (pin === state.pin) {
      locked = false;
      WALLIE.proctor.unlock();
      $("#lock-box").classList.add("hidden");
      $("#unlock-pin").value = "";
      state.live.status = "active";
      state.live.warnings = 0;
      persist();
      $("#warn-display").textContent = "Waarskuwings: 0 / 3";
      $("#warn-display").classList.remove("hot");
      setCameraStatus("Ontsluit — waarskuwings terug na 0, tyd loop weer", "live");
      logEvent("Pa het sessie ontsluit · waarskuwings terug na 0/3 · tyd loop weer");
      updateLiveDot();
      WALLIE.REMOTE?.sessionUnlock({
        subjectSlug: sessionMeta?.subjectSlug,
        leftMs: WALLIE.proctor.timeLeft(),
        locks: WALLIE.proctor.locks
      });
    } else {
      alert("Verkeerde PIN.");
    }
  });

  $("#save-pin").addEventListener("click", () => {
    const p = $("#new-pin").value.trim();
    if (p.length < 4) {
      alert("PIN moet minstens 4 karakters wees.");
      return;
    }
    state.pin = p;
    persist();
    $("#new-pin").value = "";
    alert("PIN gestoor plaaslik.");
  });

  $("#wallie-survey-save").addEventListener("click", () => {
    const form = $("#wallie-survey-form");
    const result = readSurveyAnswers(form, WALLIE.SURVEY.wallieFields);
    if (!result.ok) {
      alert("Vul asseblief in: " + result.missing);
      return;
    }
    const survey = {
      id: "ws_" + Date.now(),
      sessionId: form.dataset.sessionId,
      subjectSlug: form.dataset.subjectSlug,
      date: WALLIE.todayKey(),
      at: Date.now(),
      answers: result.answers
    };
    /* Alle antwoorde woordeliks (die ou teks het "moeilikheid" weggelaat) */
    WALLIE.REMOTE?.wallieSurvey({ text: WALLIE.SYNC.surveyText(survey), data: survey });
    state.wallieSurveys = state.wallieSurveys || [];
    state.wallieSurveys.unshift(survey);
    state.pendingSurveySessionId = null;
    persist();
    $("#wallie-survey-modal").classList.add("hidden");
    logEvent("Wallie-survey gestoor");
  });

  $("#remote-consent-save")?.addEventListener("click", () => {
    const ok = $("#remote-consent-check")?.checked;
    if (!ok) {
      alert("Merk die kassie om toestemming te bevestig.");
      return;
    }
    WALLIE.REMOTE.setConsent(true);
    $("#remote-consent-modal").classList.add("hidden");
    refreshRemoteConsentLabel();
    logEvent("Afstand-waarneming toestemming gestoor");
  });

  $("#pa-survey-save").addEventListener("click", () => {
    const form = $("#pa-survey-form");
    fillPaSurveyForm();
    const result = readSurveyAnswers(form, WALLIE.SURVEY.paFields);
    if (!result.ok) {
      alert("Vul asseblief in: " + result.missing);
      return;
    }
    const sessionId = $("#pa-survey-session").value;
    if (!sessionId) {
      alert("Geen sessie om aan te koppel nie — laat hom eers ’n blok klaarmaak.");
      return;
    }
    const paEntry = {
      id: "ps_" + Date.now(),
      sessionId,
      date: WALLIE.todayKey(),
      at: Date.now(),
      answers: result.answers
    };
    state.paSurveys = state.paSurveys || [];
    state.paSurveys.unshift(paEntry);
    const pa = result.answers;
    const linked = state.sessions.find((s) => s.id === sessionId);
    WALLIE.REMOTE?.paSurvey({
      text: [
        linked
          ? `Sessie: ${subjectBySlug(linked.subjectSlug)?.naam || linked.subjectSlug} · ${linked.durationMin}m · ${linked.warnings}w`
          : `Sessie: ${sessionId}`,
        `Teenwoordig: ${pa.teenwoordig}`,
        `Produksie: ${pa.produksie}`,
        `Houding: ${pa.houding}`,
        `Vertroue: ${pa.vertroue}`,
        `Verandering: ${pa.verandering}`,
        pa.nota ? `Nota: ${pa.nota}` : null
      ]
        .filter(Boolean)
        .join("\n"),
      data: paEntry
    });
    persist();
    alert("Pa-survey gestoor. Kyk Verbeter vir die daaglikse lus.");
    renderVerbeter();
  });

  $("#bug-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const tipe = document.querySelector('input[name="bugTipe"]:checked')?.value;
    const detail = $("#bug-detail").value.trim();
    if (!tipe || !detail) {
      alert("Kies ’n tipe en beskryf die probleem.");
      return;
    }
    const bug = {
      id: "bug_" + Date.now(),
      date: WALLIE.todayKey(),
      at: Date.now(),
      tipe,
      severity: $("#bug-severity").value,
      subjectSlug: $("#bug-subject").value || "",
      detail,
      code: $("#bug-code").value.trim(),
      userAgent: navigator.userAgent.slice(0, 120),
      href: location.href
    };
    state.bugReports = state.bugReports || [];
    state.bugReports.unshift(bug);
    WALLIE.REMOTE?.bugReport({
      text: [
        `Tipe: ${bug.tipe} · ${bug.severity}`,
        bug.subjectSlug ? `Vak: ${subjectBySlug(bug.subjectSlug)?.naam || bug.subjectSlug}` : null,
        bug.detail,
        bug.code ? `Kode: ${bug.code}` : null,
        `Bladsy: ${bug.href}`
      ]
        .filter(Boolean)
        .join("\n"),
      data: bug,
      blocking: bug.severity === "blokkeer"
    });
    /* Dieselfde pad as die Hulp-paneel: wallie911.support (die hulp-roetine antwoord per e-pos). Push bly. */
    const supportBelofte = WALLIE.HULP?.stuur({
      vak: bug.subjectSlug || "algemeen",
      gebeur: bug.detail + (bug.code ? `\nKode: ${bug.code}` : ""),
      skerm: `Iets werk nie (${bug.tipe}, ${bug.severity})`,
      bron: "iets-werk-nie",
      extra: { tipe: bug.tipe, severity: bug.severity, code: bug.code, bug_id: bug.id }
    });
    persist();
    $("#bug-detail").value = "";
    $("#bug-code").value = "";
    document.querySelectorAll('input[name="bugTipe"]').forEach((r) => (r.checked = false));
    renderBugs();
    const melding = (uitslag) =>
      alert(
        uitslag === "gestuur"
          ? "Dankie — gestuur. Hulp kom binne ongeveer 10 minute per e-pos (kyk jou Gmail). Pa sien dit ook onder Verbeter."
          : uitslag === "tou"
            ? "Dankie — probleem gestoor. Geen verbinding nie: dit gaan deur sodra jy weer internet het, en dan kom hulp per e-pos."
            : "Dankie — probleem gestoor op hierdie toestel, maar kon nie vir hulp gestuur of in die tou gesit word nie (blaaier in privaat modus of geheue vol?). Maak 'n gewone venster oop en probeer weer, of sê vir Pa."
      );
    if (supportBelofte && typeof supportBelofte.then === "function") supportBelofte.then(melding, () => melding("fout"));
    else melding("fout");
  });

  $("#bug-refresh")?.addEventListener("click", () => renderBugs());

  /* Tik op die aanwyser = probeer dadelik weer stuur */
  $("#sync-pill")?.addEventListener("click", () => {
    WALLIE.SYNC?.update((b) => b.queue.forEach((q) => q.state === "retry" && (q.nextTryAt = 0)));
    WALLIE.SYNC?.flush();
    renderDurableStatus();
  });

  /* Hash routing */
  function fromHash() {
    const name = (location.hash || "#missie").slice(1);
    if ($(`#view-${name}`)) showView(name);
  }
  window.addEventListener("hashchange", fromHash);

  /* Een stukkende skerm mag nooit die sinkronisering keer nie: elke stap apart */
  function safe(fn, label) {
    try {
      fn();
    } catch (e) {
      console.error(`[wallie] ${label}:`, e);
    }
  }

  /* Sinkronisering eerste: onderbreekte sessie, ou uitboks en historiese log (terugvul) */
  safe(() => {
    if (state.live?.status && state.live.status !== "off") {
      /* Vorige sessie is nooit klaargemaak nie (lid toe / blaaier gesluit) — sê dit eerlik vir Pa,
         met die minute tot die laaste lewensteken */
      const info = WALLIE.REMOTE?.sessionInterrupted(state.live);
      if (info && !state.sessions.some((s) => s.id === info.sessionId)) {
        state.sessions.unshift({
          id: info.sessionId,
          date: info.startedAt ? WALLIE.todayKey(new Date(info.startedAt)) : WALLIE.todayKey(),
          subjectSlug: state.live.subject,
          task: state.live.task || "",
          durationMin: Math.round(info.actualMs / 60000),
          actualMin: Math.round(info.actualMs / 60000),
          plannedMin: state.live.minutes || null,
          startedAt: info.startedAt,
          endedAt: info.endedAt,
          block: state.live.block || null,
          warnings: state.live.totalWarnings || state.live.warnings || 0,
          locks: state.live.locks || 0,
          memoMin: 0,
          outcome: "onderbreek"
        });
      }
      state.live = { status: "off", subject: null, warnings: 0, startedAt: null };
      persist();
    }
  }, "onderbreek");
  safe(() => {
    if (WALLIE.SYNC) WALLIE.SYNC.onStatus = renderDurableStatus;
    WALLIE.REMOTE?.startOutbox(state);
    setInterval(renderDurableStatus, 15000);
    renderDurableStatus();
  }, "sync");

  safe(fillSubjectSelects, "vakke");
  safe(renderCountdown, "aftelling");
  setInterval(() => safe(renderCountdown, "aftelling"), 1000);
  safe(ensurePlan, "plan");
  safe(fromHash, "hash");
  if (!location.hash) safe(() => showView("missie"), "missie");
  safe(refreshRemoteConsentLabel, "toestemming");
  safe(renderMissie, "missie");
  safe(renderPa, "pa");

  safe(() => WALLIE.lessonUI.openFromQuery(), "les");

  /* Weergawe-kontrole: 'n oop oortjie mag nie ou JS bly loop na 'n ontplooiing nie.
     version.json (no-store) teenoor WALLIE.APP_VERSION by laai, elke 5 min en wanneer die oortjie weer sigbaar word.
     Verskil dit: herlaai dadelik as geen sessie loop nie; anders 'n banier en herlaai eers NA die sessie.
     Raak nooit localStorage nie. Alle foute word ingesluk (vanlyn werk die app net soos altyd).
     Net op die lewendige gasheer en localhost; nooit in voorskou nie. */
  safe(() => {
    const host = String(location.hostname || "").toLowerCase();
    const onHost = host === "pamoja-academy.github.io" || host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host === "::1";
    if (!onHost || window.__VOORSKOU__?.aktief || !WALLIE.APP_VERSION) return;
    let newVersion = null;
    let reloading = false;
    let waitTimer = null;

    const sessionRunning = () => {
      try {
        const st = state.live?.status;
        if (st && st !== "off") return true;
        if (WALLIE.proctor?.active) return true;
        if (window.Praktiese?.active?.()) return true;
      } catch (e) {
        return true;
      }
      return false;
    };
    /* Ook nie terwyl 'n opname, toestemming of les oop is nie (dit sou ingetikte antwoorde verloor) */
    const dialogOpen = () => !!document.querySelector(".modal:not(.hidden), .les-viewer:not(.hidden)");

    const banner = (show) => {
      let el = document.getElementById("weergawe-banier");
      if (!show) {
        el?.remove();
        return;
      }
      if (el) return;
      el = document.createElement("div");
      el.id = "weergawe-banier";
      el.className = "weergawe-banier";
      el.setAttribute("role", "status");
      el.textContent = "Nuwe weergawe - herlaai na die sessie";
      document.body.appendChild(el);
    };

    const tryReload = () => {
      if (!newVersion || reloading) return;
      if (sessionRunning() || dialogOpen()) {
        if (sessionRunning()) banner(true);
        if (!waitTimer) waitTimer = setInterval(tryReload, 5000);
        return;
      }
      /* Lus-wag (sessionStorage, nie Wallie se localStorage nie): as die CDN nog 'n ou index.html gee terwyl
         version.json reeds nuut is, herlaai hoogstens 2 keer per weergawe per 10 min. */
      try {
        const g = JSON.parse(sessionStorage.getItem("wallie911_herlaai") || "null");
        const now = Date.now();
        const n = g && g.v === newVersion && now - g.at < 10 * 60 * 1000 ? g.n : 0;
        if (n >= 2) return;
        sessionStorage.setItem("wallie911_herlaai", JSON.stringify({ v: newVersion, n: n + 1, at: n ? g.at : now }));
      } catch (e) {
        /* geen sessionStorage: herlaai steeds */
      }
      reloading = true;
      if (waitTimer) clearInterval(waitTimer);
      try {
        location.reload();
      } catch (e) {
        reloading = false;
      }
    };

    const check = () => {
      if (reloading) return;
      try {
        fetch("version.json", { cache: "no-store" })
          .then((r) => (r && r.ok ? r.json() : null))
          .then((j) => {
            const v = j && typeof j.v === "string" ? j.v : null;
            if (!v || v === WALLIE.APP_VERSION) return;
            newVersion = v;
            tryReload();
          })
          .catch(() => {});
      } catch (e) {
        /* vanlyn of geen fetch: ignoreer */
      }
    };

    check();
    setInterval(check, 5 * 60 * 1000);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") check();
    });
  }, "weergawe");
})();
