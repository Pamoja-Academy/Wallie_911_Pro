/* Remote Pa-sink:
   - Pa-konsole (Supabase via WALLIE.SYNC → WALLIE.LIVE): elke sessie-gebeurtenis gaan deur die vanlyn-tou
     met ’n vaste event_id; hartklop elke 60 s met tab-sigbaarheid, fokus en ledig-tyd; webcam-stills.
   - ntfy: net foon-push vir gebeure wat saak maak (ntfy.sh laat ~250 boodskappe/dag per IP toe,
     dus geen hartklop daar nie). */
window.WALLIE = window.WALLIE || {};

WALLIE.REMOTE = {
  /* Verander hierdie topic as jy wil — Pa en Wallie moet dieselfde hê */
  ntfyServer: "https://ntfy.sh",
  ntfyTopic: "wallie911-pa-15sos-hanno",
  heartbeatMs: 60000,
  /* Geen muis/sleutelbord so lank nie = "ledig" (kan papierwerk wees — dis net inligting vir Pa) */
  idleMs: 5 * 60 * 1000,
  _hbTimer: null,
  _idleTimer: null,
  _live: null,
  _presence: null,
  _listeners: null,

  /* v2: toestemming dek nou ook webcam-stills na Pa (v1 het gesê video bly plaaslik) */
  consentKey: "wallie911_remote_consent_v2",

  hasConsent() {
    try {
      return localStorage.getItem(this.consentKey) === "1";
    } catch {
      return false;
    }
  },

  setConsent(ok) {
    localStorage.setItem(this.consentKey, ok ? "1" : "0");
  },

  topicUrl() {
    return `${this.ntfyServer}/${this.ntfyTopic}`;
  },

  paListenUrl() {
    return `${this.ntfyServer}/${this.ntfyTopic}`;
  },

  async publish({ title, message, tags, priority, extras, skipConsent }) {
    if (!skipConsent && !this.hasConsent()) return { ok: false, error: "geen_toestemming" };
    /* Query-parameters, nie headers nie: “—” en “á” is nie geldige header-karakters nie en
       fetch gooi dan stilweg ’n fout (slot-alarms het so nooit Pa se foon bereik nie). */
    const params = new URLSearchParams({
      title: title || "Wallie_911_Pro",
      tags: (tags || []).join(","),
      priority: String(priority || 3)
    });
    if (extras) {
      Object.entries(extras).forEach(([k, v]) => params.set(k, String(v)));
    }
    try {
      const res = await fetch(`${this.topicUrl()}?${params}`, {
        method: "POST",
        body: message || ""
      });
      return { ok: res.ok, status: res.status };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },

  subjectLabel(slug) {
    return WALLIE.SUBJECTS?.find((s) => s.slug === slug)?.naam || slug || "—";
  },

  blockFields(block) {
    if (!block) return { block_id: null };
    return {
      block_id: block.id,
      block: { id: block.id, title: block.title, start: block.start, end: block.end, minutes: block.minutes, kind: block.kind }
    };
  },

  /* Momentopname van die lewendige sessie vir die Pa-konsole */
  liveFields() {
    const l = this._live || {};
    return {
      session_id: l.sessionId,
      subject: this.subjectLabel(l.subjectSlug),
      subject_slug: l.subjectSlug || null,
      task: l.task || "",
      status: l.status || "active",
      warnings: l.warnings || 0,
      total_warnings: l.totalWarnings || 0,
      locks: l.locks || 0,
      left_ms: l.leftMs == null ? null : Math.round(l.leftMs),
      planned_min: l.minutes || null,
      started_at: l.startedAt || Date.now(),
      ...this.blockFields(l.block)
    };
  },

  enqueue(eventId, payload) {
    /* Hartklop/sigbaarheid/ledig = deurlopende waarneming: net met toestemming (soos voorheen) */
    if (["heartbeat", "visibility", "idle", "active"].includes(payload?.kind) && !this.hasConsent()) return null;
    return WALLIE.SYNC?.enqueue(eventId, payload);
  },

  /* ---------- teenwoordigheid: sigbaarheid, fokus, ledig ---------- */

  presenceNow() {
    const p = this._presence;
    if (!p) return null;
    const now = Date.now();
    const dt = now - p.since;
    const out = { ...p };
    if (out.visible) {
      out.visibleMs += dt;
      if (out.focused) out.focusedMs += dt;
    } else {
      out.hiddenMs += dt;
    }
    if (out.idle) out.idleMs += now - out.idleSince;
    return out;
  },

  accrue() {
    const p = this.presenceNow();
    if (!p) return;
    Object.assign(this._presence, {
      visibleMs: p.visibleMs,
      focusedMs: p.focusedMs,
      hiddenMs: p.hiddenMs,
      since: Date.now()
    });
  },

  presenceFields() {
    const p = this.presenceNow();
    if (!p) return {};
    return {
      visible: p.visible,
      focused: p.focused,
      idle: p.idle,
      visible_ms: Math.round(p.visibleMs),
      focused_ms: Math.round(p.focusedMs),
      hidden_ms: Math.round(p.hiddenMs),
      idle_ms: Math.round(p.idleMs),
      last_input_at: p.lastInputAt
    };
  },

  startPresence() {
    this.stopPresence();
    const doc = typeof document !== "undefined" ? document : null;
    const now = Date.now();
    this._presence = {
      since: now,
      visible: doc ? !doc.hidden : true,
      focused: doc?.hasFocus ? doc.hasFocus() : true,
      lastInputAt: now,
      idle: false,
      idleSince: null,
      visibleMs: 0,
      focusedMs: 0,
      hiddenMs: 0,
      idleMs: 0,
      idleCount: 0,
      visibilityChanges: 0
    };
    let lastMove = 0;
    const onInput = (e) => {
      const p = this._presence;
      if (!p) return;
      const t = Date.now();
      if (e?.type === "pointermove" || e?.type === "mousemove") {
        if (t - lastMove < 2000) return;
        lastMove = t;
      }
      p.lastInputAt = t;
      if (p.idle) this.endIdle();
    };
    const onVis = () => this.presenceChange();
    let blurTimer = null;
    const onBlur = () => {
      clearTimeout(blurTimer);
      blurTimer = setTimeout(() => this.presenceChange(), 1500);
    };
    const onFocus = () => {
      clearTimeout(blurTimer);
      onInput();
      this.presenceChange();
    };
    const inputs = ["pointerdown", "pointermove", "keydown", "wheel", "touchstart", "scroll"];
    this._listeners = { onInput, onVis, onBlur, onFocus, inputs, clearBlur: () => clearTimeout(blurTimer) };
    if (doc) {
      doc.addEventListener("visibilitychange", onVis);
      inputs.forEach((t) => doc.addEventListener(t, onInput, { passive: true, capture: true }));
    }
    if (typeof window !== "undefined" && window.addEventListener) {
      window.addEventListener("blur", onBlur);
      window.addEventListener("focus", onFocus);
    }
    this._idleTimer = setInterval(() => this.checkIdle(), 15000);
  },

  stopPresence() {
    const l = this._listeners;
    if (l) {
      l.clearBlur();
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", l.onVis);
        l.inputs.forEach((t) => document.removeEventListener(t, l.onInput, { capture: true }));
      }
      if (typeof window !== "undefined" && window.removeEventListener) {
        window.removeEventListener("blur", l.onBlur);
        window.removeEventListener("focus", l.onFocus);
      }
    }
    this._listeners = null;
    if (this._idleTimer) clearInterval(this._idleTimer);
    this._idleTimer = null;
  },

  presenceChange() {
    const p = this._presence;
    if (!p || !this._live) return;
    const doc = typeof document !== "undefined" ? document : null;
    const visible = doc ? !doc.hidden : true;
    const focused = visible && (doc?.hasFocus ? doc.hasFocus() : true);
    if (visible === p.visible && focused === p.focused) return;
    this.accrue();
    p.visible = visible;
    p.focused = focused;
    p.visibilityChanges += 1;
    const sid = this._live.sessionId;
    this.enqueue(`vis:${sid}:${Date.now()}`, {
      kind: "visibility",
      ...this.liveFields(),
      ...this.presenceFields(),
      title: visible ? (focused ? "TERUG OP SKERM" : "SKERM SIGBAAR, ANDER VENSTER") : "TAB WEG / GEMINIMISEER",
      body: `${this.subjectLabel(this._live.subjectSlug)} · ${visible ? (focused ? "sigbaar + fokus" : "sigbaar, geen fokus") : "versteek"}`
    });
    this.heartbeatTick();
  },

  checkIdle() {
    const p = this._presence;
    if (!p || p.idle || !this._live) return;
    if (Date.now() - p.lastInputAt < this.idleMs) return;
    p.idle = true;
    p.idleSince = p.lastInputAt;
    p.idleCount += 1;
    const sid = this._live.sessionId;
    this.enqueue(`idle:${sid}:${p.idleSince}`, {
      kind: "idle",
      ...this.liveFields(),
      ...this.presenceFields(),
      idle_since: p.idleSince,
      title: "LEDIG — geen muis/sleutelbord",
      body: `${this.subjectLabel(this._live.subjectSlug)} · geen invoer sedert ${new Date(p.idleSince).toLocaleTimeString("af-ZA")} (kan papierwerk wees)`
    });
  },

  endIdle() {
    const p = this._presence;
    if (!p?.idle) return;
    const idleFor = Date.now() - p.idleSince;
    p.idleMs += idleFor;
    p.idle = false;
    const since = p.idleSince;
    p.idleSince = null;
    if (!this._live) return;
    this.enqueue(`active:${this._live.sessionId}:${since}`, {
      kind: "active",
      ...this.liveFields(),
      ...this.presenceFields(),
      idle_since: since,
      idle_for_ms: idleFor,
      title: "WEER AKTIEF",
      body: `${this.subjectLabel(this._live.subjectSlug)} · was ${Math.round(idleFor / 60000)} min ledig`
    });
  },

  /* ---------- sessie-gebeure ---------- */

  async sessionStart({ sessionId, subjectSlug, minutes, task, startedAt, block }) {
    this._live = {
      sessionId,
      subjectSlug,
      minutes,
      task: task || "",
      status: "active",
      warnings: 0,
      totalWarnings: 0,
      locks: 0,
      startedAt: startedAt || Date.now(),
      leftMs: minutes * 60 * 1000,
      block: block || null,
      hbSeq: 0
    };
    this.startPresence();
    const blokTxt = block ? ` · blok ${block.start && block.end ? `${block.start}–${block.end}` : block.title || block.id}` : "";
    const message = `${this.subjectLabel(subjectSlug)} · ${minutes}m${blokTxt}\nTaak: ${task || "—"}\nPa-konsole: pa-afstand.html`;
    this.enqueue(`start:${sessionId}`, {
      kind: "start",
      ...this.liveFields(),
      ...this.presenceFields(),
      client_at: this._live.startedAt,
      title: "IN SESSIE — begin",
      body: message
    });
    this.startHeartbeat();
    await this.publish({
      title: "IN SESSIE — begin",
      message,
      tags: ["rotating_light", "green_circle"],
      priority: 4
    });
  },

  async sessionWarn({ warnings, reason, subjectSlug, leftMs, totalWarnings }) {
    this.updateLive({ status: "warned", warnings, totalWarnings, leftMs });
    const message = `${this.subjectLabel(subjectSlug)}\n${reason}${totalWarnings > warnings ? `\nTotaal hierdie sessie: ${totalWarnings}` : ""}`;
    this.enqueue(`warn:${this._live?.sessionId}:${totalWarnings}`, {
      kind: "warn",
      ...this.liveFields(),
      ...this.presenceFields(),
      reason,
      title: `WAARSKUWING ${warnings}/3`,
      body: message
    });
    await this.publish({
      title: `WAARSKUWING ${warnings}/3`,
      message,
      tags: ["warning", "orange_circle"],
      priority: 4
    });
  },

  async sessionLock({ subjectSlug, reason, locks }) {
    this.updateLive({ status: "locked", locks });
    const message = `${this.subjectLabel(subjectSlug)}\n${reason || "3 waarskuwings"}\nTyd is gepouseer. Ontsluit by sy skootrekenaar (Pa-PIN).`;
    this.enqueue(`lock:${this._live?.sessionId}:${locks}`, {
      kind: "lock",
      ...this.liveFields(),
      ...this.presenceFields(),
      reason,
      title: "SLOT — Pa-PIN nodig",
      body: message
    });
    await this.publish({
      title: "SLOT — Pa-PIN nodig",
      message,
      tags: ["no_entry", "red_circle", "siren"],
      priority: 5
    });
  },

  async sessionUnlock({ subjectSlug, leftMs, locks }) {
    this.updateLive({ status: "active", warnings: 0, leftMs, locks });
    const message = `${this.subjectLabel(subjectSlug)}\nWaarskuwings terug na 0/3 · slot nr ${locks || 1} in hierdie sessie`;
    this.enqueue(`unlock:${this._live?.sessionId}:${locks}`, {
      kind: "unlock",
      ...this.liveFields(),
      ...this.presenceFields(),
      title: "ONTSLUIT — sessie gaan voort",
      body: message
    });
    await this.publish({
      title: "ONTSLUIT — sessie gaan voort",
      message,
      tags: ["unlock", "green_circle"],
      priority: 3
    });
  },

  memoEvent({ subjectSlug, open, fileName, minutes }) {
    this.enqueue(`memo:${this._live?.sessionId}:${open ? "oop" : "toe"}:${Date.now()}`, {
      kind: "memo",
      ...this.liveFields(),
      title: open ? "MEMO oop" : "MEMO toe",
      body: open
        ? `${this.subjectLabel(subjectSlug)}\nMemo in die app oop: ${fileName || "lêer"}`
        : `${this.subjectLabel(subjectSlug)}\nMemo toe · ${minutes || 0} min in memo in hierdie sessie`
    });
  },

  heartbeatTick() {
    if (!this._live?.sessionId) return;
    this.checkIdle();
    const seq = (this._live.hbSeq = (this._live.hbSeq || 0) + 1);
    this.enqueue(`hb:${this._live.sessionId}:${seq}`, {
      kind: "heartbeat",
      ...this.liveFields(),
      ...this.presenceFields(),
      seq
    });
    try {
      this.onHeartbeat?.(Date.now());
    } catch {}
  },

  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTick();
    this._hbTimer = setInterval(() => this.heartbeatTick(), this.heartbeatMs);
  },

  stopHeartbeat() {
    if (this._hbTimer) clearInterval(this._hbTimer);
    this._hbTimer = null;
  },

  updateLive(live) {
    if (!this._live) return;
    Object.entries(live).forEach(([k, v]) => {
      if (v !== undefined) this._live[k] = v;
    });
  },

  /* Webcam-still: net tydens ’n aktiewe sessie en met toestemming (bediener weier anders ook).
     Nie in die tou nie — ’n ou foto is waardeloos en te groot vir localStorage. */
  async sendStill(b64) {
    if (!this._live?.sessionId || !this.hasConsent() || !WALLIE.LIVE) return { ok: false };
    const res = await WALLIE.LIVE.rpc("wallie_still", { p_session_id: this._live.sessionId, p_jpeg_b64: b64 });
    if (!res?.ok && res?.error === "no active session") {
      /* Bediener het nog nie die hartklop nie (bv. tou het net weer aanlyn gekom) — stuur een en probeer weer */
      this.heartbeatTick();
      await WALLIE.SYNC?.flush();
      return WALLIE.LIVE.rpc("wallie_still", { p_session_id: this._live.sessionId, p_jpeg_b64: b64 });
    }
    return res;
  },

  fmtMin(ms) {
    return `${Math.round((ms || 0) / 60000)}m`;
  },

  /* report: { sessionId, subjectSlug, durationMin, actualMs, plannedMin, outcome, warnings, locks, memoMin,
               lockedMs, task, date, startedAt, endedAt, block } */
  async sessionEnd(report) {
    this.stopHeartbeat();
    const pres = this.presenceFields();
    this.stopPresence();
    const lines = [
      `Vak: ${this.subjectLabel(report.subjectSlug)}`,
      `Duur: ${report.durationMin}m werklik (beplan ${report.plannedMin}m)`,
      report.block
        ? `Blok: ${report.block.title || report.block.id}${report.block.start && report.block.end ? ` (${report.block.start}–${report.block.end})` : ""}`
        : null,
      `Uitkoms: ${report.outcome}`,
      `Waarskuwings: ${report.warnings}`,
      report.locks ? `Slotte: ${report.locks}` : null,
      report.memoMin ? `Memo-tyd: ${report.memoMin}m` : null,
      pres.visible_ms != null
        ? `Op skerm: ${this.fmtMin(pres.focused_ms)} gefokus · tab weg: ${this.fmtMin(pres.hidden_ms)} · ledig: ${this.fmtMin(pres.idle_ms)}`
        : null,
      report.task ? `Taak: ${report.task}` : null,
      `\nTyd: ${new Date(report.endedAt || Date.now()).toLocaleString("af-ZA")}`
    ].filter(Boolean);
    const message = lines.join("\n");
    this.updateLive({ status: "off", totalWarnings: report.warnings, locks: report.locks });
    const sessionId = report.sessionId || this._live?.sessionId;
    this.enqueue(`end:${sessionId}`, {
      kind: "end",
      ...this.liveFields(),
      ...pres,
      session_id: sessionId,
      subject: this.subjectLabel(report.subjectSlug),
      subject_slug: report.subjectSlug,
      status: "off",
      outcome: report.outcome,
      duration_min: report.durationMin,
      actual_ms: report.actualMs,
      locked_ms: report.lockedMs || 0,
      memo_min: report.memoMin || 0,
      planned_min: report.plannedMin,
      started_at: report.startedAt,
      ended_at: report.endedAt || Date.now(),
      client_at: report.endedAt || Date.now(),
      ...this.blockFields(report.block),
      title: "SESSIE-VERSLAG",
      body: message,
      data: { ...report, presence: pres }
    });
    this._live = null;
    this._presence = null;
    await this.publish({
      title: "SESSIE-VERSLAG",
      message,
      tags: ["clipboard", "white_check_mark"],
      priority: 3
    });
  },

  async wallieSurvey({ text, data }) {
    this.enqueue(`survey:${data?.id || Date.now()}`, {
      kind: "survey",
      session_id: data?.sessionId || null,
      subject: this.subjectLabel(data?.subjectSlug),
      subject_slug: data?.subjectSlug || null,
      client_at: data?.at || Date.now(),
      title: "SURVEY — Wallie ná sessie",
      body: text,
      data
    });
    await this.publish({
      title: "SURVEY — Wallie ná sessie",
      message: text,
      tags: ["memo", "speech_balloon"],
      priority: 3
    });
  },

  async paSurvey({ text, data }) {
    this.enqueue(`pa-survey:${data?.id || Date.now()}`, {
      kind: "pa-survey",
      session_id: data?.sessionId || null,
      client_at: data?.at || Date.now(),
      title: "PA-SURVEY",
      body: text,
      data
    });
    await this.publish({
      title: "PA-SURVEY",
      message: text,
      tags: ["eyes"],
      priority: 2,
      skipConsent: true
    });
  },

  async bugReport({ text, data, blocking }) {
    const title = blocking ? "PROBLEEM — blokkeer" : "PROBLEEM";
    this.enqueue(`probleem:${data?.id || Date.now()}`, {
      kind: "probleem",
      subject: data?.subjectSlug ? this.subjectLabel(data.subjectSlug) : null,
      client_at: data?.at || Date.now(),
      title,
      body: text,
      data
    });
    await this.publish({
      title,
      message: text,
      tags: ["bug"],
      priority: blocking ? 4 : 3,
      skipConsent: true
    });
  },

  blockDone(block, at) {
    if (!block?.id) return;
    this.enqueue(`block:${block.id}`, {
      kind: "block",
      ...this.blockFields(block),
      subject: this.subjectLabel(block.subjectSlug),
      subject_slug: block.subjectSlug,
      client_at: at || Date.now(),
      title: "BLOK KLAAR GEMERK",
      body: `${block.title || block.id} (${block.start || "?"}–${block.end || "?"})`,
      data: { blockId: block.id, done: true }
    });
  },

  /* Sessie kon nie begin nie (bv. kamera) — Pa moet weet hy het probeer */
  startFailed({ subjectSlug, minutes, error, block }) {
    const at = Date.now();
    this.enqueue(`probleem:start_${at}`, {
      kind: "probleem",
      subject: this.subjectLabel(subjectSlug),
      subject_slug: subjectSlug,
      planned_min: minutes,
      ...this.blockFields(block),
      client_at: at,
      title: "SESSIE KON NIE BEGIN NIE",
      body: `${this.subjectLabel(subjectSlug)} · ${minutes}m\n${error}`,
      data: { id: `start_${at}`, auto: true, error, subjectSlug, minutes }
    });
  },

  /* Vorige sessie is nooit klaargemaak nie (lid toe / blaaier gesluit). Stuur ’n eerlike einde
     met die tyd tot die laaste hartklop, sodat die gewerkte minute nie verlore gaan nie. */
  sessionInterrupted(live) {
    const sessionId = live?.sessionId;
    if (!sessionId) return null;
    const startedAt = live.startedAt || null;
    const endedAt = live.lastBeatAt || startedAt || Date.now();
    const actualMs = startedAt ? Math.max(0, endedAt - startedAt - (live.lockedMs || 0)) : 0;
    const begin = startedAt ? new Date(startedAt).toLocaleTimeString("af-ZA") : "?";
    const last = new Date(endedAt).toLocaleTimeString("af-ZA");
    this.enqueue(`end:${sessionId}`, {
      kind: "end",
      session_id: sessionId,
      subject: this.subjectLabel(live.subject),
      subject_slug: live.subject || null,
      task: live.task || "",
      status: "off",
      outcome: "onderbreek",
      warnings: live.warnings || 0,
      total_warnings: live.totalWarnings || live.warnings || 0,
      locks: live.locks || 0,
      planned_min: live.minutes || null,
      duration_min: Math.round(actualMs / 60000),
      actual_ms: actualMs,
      started_at: startedAt,
      ended_at: endedAt,
      client_at: endedAt,
      ...this.blockFields(live.block),
      title: "ONDERBREEK — sessie nie klaargemaak nie",
      body: `${this.subjectLabel(live.subject)} · begin ${begin} · laaste sein ${last} · waarskuwings ${live.warnings || 0}\nDie app of skootrekenaar is toe sonder “Eindig sessie”.`,
      data: { ...live, outcome: "onderbreek" }
    });
    return { sessionId, startedAt, endedAt, actualMs };
  },

  pingOffline() {
    this.stopHeartbeat();
    this.stopPresence();
    this._live = null;
    this._presence = null;
  },

  durableStatus() {
    return WALLIE.SYNC ? WALLIE.SYNC.statusText() : "Pa-konsole: sync.js ontbreek.";
  },

  startOutbox(state) {
    WALLIE.SYNC?.start(state);
  }
};
