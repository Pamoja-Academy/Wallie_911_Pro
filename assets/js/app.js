/* Wallie_911_Pro — UI */
(function () {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];

  let state = WALLIE.storage.load();
  let locked = false;
  let sessionMeta = null;

  function persist() {
    WALLIE.storage.save(state);
  }

  function ensurePlan() {
    const today = WALLIE.todayKey();
    if (state.planDate !== today || !state.blocks?.length) {
      const plan = WALLIE.buildDayPlan(today);
      state.planDate = plan.date;
      state.blocks = plan.blocks;
      persist();
    }
  }

  function subjectBySlug(slug) {
    return WALLIE.SUBJECTS.find((s) => s.slug === slug);
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

  function renderCountdown() {
    const d = WALLIE.daysUntilExam();
    $("#days-left").textContent = d < 0 ? 0 : d;
  }

  function renderMissie() {
    ensurePlan();
    const studyBlocks = state.blocks.filter((b) => b.kind !== "break");
    const done = studyBlocks.filter((b) => state.completedBlocks[b.id]).length;
    const mins = studyBlocks.reduce((s, b) => s + b.minutes, 0);
    const doneMins = studyBlocks
      .filter((b) => state.completedBlocks[b.id])
      .reduce((s, b) => s + b.minutes, 0);

    $("#day-stats").innerHTML = `
      <div class="stat"><b>${mins}m</b><span>Beplan vandag</span></div>
      <div class="stat"><b>${done}/${studyBlocks.length}</b><span>Blokke klaar</span></div>
      <div class="stat"><b>${doneMins}m</b><span>Voltooi onder plan</span></div>
      <div class="stat"><b>${state.faults.filter((f) => !f.resolved).length}</b><span>Oop foute</span></div>
    `;

    $("#block-list").innerHTML = state.blocks
      .map((b) => {
        const doneCls = state.completedBlocks[b.id] ? "done" : "";
        const breakCls = b.kind === "break" ? "break" : "";
        const time =
          b.start && b.end
            ? `<span class="block-time">${b.start} – ${b.end}</span>`
            : "";
        const actions =
          b.kind === "break"
            ? `<button type="button" class="btn small ghost mark-done" data-id="${b.id}">Was daar ✓</button>`
            : `<div class="btn-row" style="margin:0">
            <button type="button" class="btn small primary start-block" data-slug="${b.subjectSlug}" data-min="${b.minutes}" data-title="${encodeURIComponent(b.title)}">Begin</button>
            <button type="button" class="btn small ghost mark-done" data-id="${b.id}">✓</button>
          </div>`;
        return `
        <li class="block-item ${doneCls} ${breakCls}" data-id="${b.id}">
          <span class="kind ${b.kind}">${b.kind}</span>
          <div>
            ${time}
            <h3>${b.title}</h3>
            <p>${b.minutes} min · ${b.detail}</p>
          </div>
          ${actions}
        </li>`;
      })
      .join("");
  }

  function renderVakke() {
    $("#subject-grid").innerHTML = WALLIE.SUBJECTS.map((s) => {
      const crit = s.prelim < 50 ? "crit" : "";
      const checks = s.lowHanging
        .map((item, i) => {
          const key = `${s.slug}:${i}`;
          const on = state.checklist[key] ? "checked" : "";
          return `<li><input type="checkbox" data-check="${key}" ${on} /><span>${item}</span></li>`;
        })
        .join("");
      return `
        <article class="subject-card">
          <header>
            <h3>${s.naam}</h3>
            <span class="badge ${crit}">Prelim ${s.prelim}% → ${s.teiken}%</span>
          </header>
          <p class="meta">Jaar ${s.jaar}% · ${s.fokus}</p>
          <ul class="checklist">${checks}</ul>
        </article>`;
    }).join("");
  }

  function renderFaults() {
    const list = [...state.faults].sort((a, b) => (a.resolved ? 1 : 0) - (b.resolved ? 1 : 0));
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
    $("#paper-list").innerHTML = state.papers.length
      ? state.papers
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
    const todays = state.sessions.filter((s) => s.date === today);
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

  function setCameraStatus(text, cls) {
    const el = $("#camera-status");
    el.textContent = text;
    el.className = "camera-overlay " + (cls || "");
  }

  async function startSessionFromUI(opts = {}) {
    if (locked) {
      alert("Sessie is gesluit. Pa moet eers ontsluit.");
      return;
    }
    const subjectSlug = opts.subjectSlug || $("#session-subject").value;
    const minutes = Number(opts.minutes || $("#session-minutes").value) || 45;
    const task = opts.task || $("#session-task").value;

    $("#session-subject").value = subjectSlug;
    $("#session-minutes").value = minutes;
    if (opts.task) $("#session-task").value = opts.task;

    const video = $("#camera");
    const result = await WALLIE.proctor.start({
      minutes,
      onTick: (left, warnings) => {
        $("#timer-display").textContent = formatMs(left);
        $("#warn-display").textContent = `Waarskuwings: ${warnings} / 3`;
        $("#warn-display").classList.toggle("hot", warnings > 0);
        state.live = {
          status: warnings > 0 ? "warned" : "active",
          subject: subjectSlug,
          warnings,
          startedAt: sessionMeta?.startedAt || Date.now()
        };
        persist();
        updateLiveDot();
      },
      onWarn: (n, reason) => {
        logEvent(`Waarskuwing ${n}: ${reason}`);
        setCameraStatus(`Waarskuwing ${n}/3 — ${reason}`, "warn");
      },
      onLock: () => {
        locked = true;
        state.live.status = "locked";
        persist();
        $("#lock-box").classList.remove("hidden");
        setCameraStatus("GESLUIT — Pa-PIN nodig", "lock");
        logEvent("Sessie gesluit ná 3 waarskuwings");
        updateLiveDot();
      },
      onEnd: (reason) => finishSession(reason)
    });

    if (!result.ok) {
      alert(result.error);
      setCameraStatus("Kamera af", "");
      return;
    }

    video.srcObject = result.stream;
    sessionMeta = {
      subjectSlug,
      minutes,
      task,
      warnings: 0,
      startedAt: Date.now(),
      date: WALLIE.todayKey()
    };
    state.live = {
      status: "active",
      subject: subjectSlug,
      warnings: 0,
      startedAt: sessionMeta.startedAt
    };
    persist();
    $("#start-session").disabled = true;
    $("#end-session").disabled = false;
    setCameraStatus("LEWENDIG — hard-proctor", "live");
    logEvent(`Sessie begin: ${subjectBySlug(subjectSlug)?.naam || subjectSlug} (${minutes}m)`);
    updateLiveDot();
    showView("sessie");
  }

  function finishSession(outcome) {
    const warnings = state.live?.warnings || 0;
    const elapsedMin = sessionMeta
      ? Math.max(1, Math.round((Date.now() - sessionMeta.startedAt) / 60000))
      : 0;

    let newSession = null;
    if (sessionMeta) {
      newSession = {
        id: "s_" + Date.now(),
        date: sessionMeta.date,
        subjectSlug: sessionMeta.subjectSlug,
        task: sessionMeta.task,
        durationMin: Math.min(elapsedMin, sessionMeta.minutes),
        warnings,
        outcome
      };
      state.sessions.unshift(newSession);
      state.pendingSurveySessionId = newSession.id;
    }

    WALLIE.proctor.stop();
    $("#camera").srcObject = null;
    $("#start-session").disabled = false;
    $("#end-session").disabled = true;
    state.live = { status: "off", subject: null, warnings: 0, startedAt: null };
    sessionMeta = null;
    persist();
    setCameraStatus("Kamera af", "");
    logEvent(`Sessie klaar (${outcome})`);
    updateLiveDot();
    renderPa();
    if (newSession) openWallieSurvey(newSession);
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
    const list = state.sessions.filter((s) => s.date === today);
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
    const syn = WALLIE.synthesizeDay(state, today);
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

    const wallie = (state.wallieSurveys || []).filter((s) => s.date === today);
    const pa = (state.paSurveys || []).filter((s) => s.date === today);
    const raw = [
      ...wallie.map(
        (w) =>
          `<li><strong>Wallie</strong> ${subjectBySlug(w.subjectSlug)?.naam}: fokus ${w.answers.fokus}/5 · metode ${w.answers.metode} · blokkade ${w.answers.blokkade} · eerlikheid ${w.answers.eerlikheid}${w.answers.help_more ? ` · “${w.answers.help_more}”` : ""}</li>`
      ),
      ...pa.map(
        (p) =>
          `<li><strong>Pa</strong>: teenwoordig ${p.answers.teenwoordig} · produksie ${p.answers.produksie} · vertroue ${p.answers.vertroue} · roep ${p.answers.verandering}${p.answers.nota ? ` · ${p.answers.nota}` : ""}</li>`
      )
    ];
    $("#verbeter-raw").innerHTML = raw.length ? raw.join("") : "<li>Nog geen surveys vandag nie.</li>";

    const bugs = (state.bugReports || []).filter((b) => b.date === today);
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
    const bugs = (state.bugReports || []).filter((b) => b.date === today);
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
        task: decodeURIComponent(start.dataset.title || "")
      });
    }
    const done = e.target.closest(".mark-done");
    if (done) {
      state.completedBlocks[done.dataset.id] = true;
      persist();
      renderMissie();
    }
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
      $("#lock-box").classList.add("hidden");
      $("#unlock-pin").value = "";
      state.live.status = "active";
      persist();
      setCameraStatus("Ontsluit — gaan voort", "live");
      logEvent("Pa het sessie ontsluit");
      updateLiveDot();
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
    state.wallieSurveys = state.wallieSurveys || [];
    state.wallieSurveys.unshift({
      id: "ws_" + Date.now(),
      sessionId: form.dataset.sessionId,
      subjectSlug: form.dataset.subjectSlug,
      date: WALLIE.todayKey(),
      at: Date.now(),
      answers: result.answers
    });
    state.pendingSurveySessionId = null;
    persist();
    $("#wallie-survey-modal").classList.add("hidden");
    logEvent("Wallie-survey gestoor");
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
    state.paSurveys = state.paSurveys || [];
    state.paSurveys.unshift({
      id: "ps_" + Date.now(),
      sessionId,
      date: WALLIE.todayKey(),
      at: Date.now(),
      answers: result.answers
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
    state.bugReports = state.bugReports || [];
    state.bugReports.unshift({
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
    });
    persist();
    $("#bug-detail").value = "";
    $("#bug-code").value = "";
    document.querySelectorAll('input[name="bugTipe"]').forEach((r) => (r.checked = false));
    renderBugs();
    alert("Dankie — probleem gestoor. Pa kan dit onder Verbeter sien.");
  });

  $("#bug-refresh")?.addEventListener("click", () => renderBugs());

  /* Hash routing */
  function fromHash() {
    const name = (location.hash || "#missie").slice(1);
    if ($(`#view-${name}`)) showView(name);
  }
  window.addEventListener("hashchange", fromHash);

  fillSubjectSelects();
  renderCountdown();
  ensurePlan();
  fromHash();
  if (!location.hash) showView("missie");
})();
