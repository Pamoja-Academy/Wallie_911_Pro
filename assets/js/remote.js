/* Remote Pa-sink:
   - Pa-konsole (Supabase via WALLIE.LIVE): hartklop elke 15s, sessie-gebeure, webcam-stills.
     Duursaam — Pa sien vandag se sessies ure later nog.
   - ntfy: net foon-push vir gebeure wat saak maak (ntfy.sh laat ~250 boodskappe/dag per IP toe,
     dus geen hartklop meer daar nie). */
window.WALLIE = window.WALLIE || {};

WALLIE.REMOTE = {
  /* Verander hierdie topic as jy wil — Pa en Wallie moet dieselfde hê */
  ntfyServer: "https://ntfy.sh",
  ntfyTopic: "wallie911-pa-15sos-hanno",
  heartbeatMs: 15000,
  staleMs: 45000,
  outboxKey: "wallie911_outbox_v1",
  outboxMax: 300,
  _flushing: false,
  _flushTimer: null,
  _hbTimer: null,
  _live: null,
  onDurableStatus: null,

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
    const headers = {
      Title: title || "Wallie_911_Pro",
      Tags: (tags || []).join(","),
      Priority: String(priority || 3),
      "Content-Type": "text/plain; charset=utf-8"
    };
    if (extras) {
      Object.entries(extras).forEach(([k, v]) => {
        headers[k] = String(v);
      });
    }
    try {
      const res = await fetch(this.topicUrl(), {
        method: "POST",
        headers,
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

  /* Momentopname van die lewendige sessie vir die Pa-konsole */
  liveFields() {
    const l = this._live || {};
    return {
      session_id: l.sessionId,
      subject: this.subjectLabel(l.subjectSlug),
      task: l.task || "",
      status: l.status || "active",
      warnings: l.warnings || 0,
      total_warnings: l.totalWarnings || 0,
      locks: l.locks || 0,
      left_ms: l.leftMs == null ? null : Math.round(l.leftMs),
      planned_min: l.minutes || null,
      started_at: l.startedAt || Date.now()
    };
  },

  async sessionStart({ sessionId, subjectSlug, minutes, task, startedAt }) {
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
      leftMs: minutes * 60 * 1000
    };
    const message = `${this.subjectLabel(subjectSlug)} · ${minutes}m\nTaak: ${task || "—"}\nPa-konsole: pa-afstand.html`;
    this.durable({ kind: "start", title: "IN SESSIE — begin", text: message });
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
    this.durable({ kind: "warn", title: `WAARSKUWING ${warnings}/3`, text: message });
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
    this.durable({ kind: "lock", title: "SLOT — Pa-PIN nodig", text: message });
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
    this.durable({ kind: "unlock", title: "ONTSLUIT — sessie gaan voort", text: message });
    await this.publish({
      title: "ONTSLUIT — sessie gaan voort",
      message,
      tags: ["unlock", "green_circle"],
      priority: 3
    });
  },

  memoEvent({ subjectSlug, open, fileName, minutes }) {
    this.durable({
      kind: "memo",
      title: open ? "MEMO oop" : "MEMO toe",
      text: open
        ? `${this.subjectLabel(subjectSlug)}\nMemo in die app oop: ${fileName || "lêer"}`
        : `${this.subjectLabel(subjectSlug)}\nMemo toe · ${minutes || 0} min in memo in hierdie sessie`
    });
  },

  async heartbeatTick() {
    if (!this._live?.sessionId || !this.hasConsent() || !WALLIE.LIVE) return;
    try {
      await WALLIE.LIVE.rpc("wallie_ingest", { p: { kind: "heartbeat", ...this.liveFields() } });
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

  /* Webcam-still: net tydens ’n aktiewe sessie (bediener weier anders ook) */
  async sendStill(b64) {
    if (!this._live?.sessionId || !this.hasConsent() || !WALLIE.LIVE) return { ok: false };
    try {
      return await WALLIE.LIVE.rpc("wallie_still", { p_session_id: this._live.sessionId, p_jpeg_b64: b64 });
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },

  async sessionEnd(report) {
    this.stopHeartbeat();
    const lines = [
      `Vak: ${this.subjectLabel(report.subjectSlug)}`,
      `Duur: ${report.durationMin}m (beplan ${report.plannedMin}m)`,
      `Uitkoms: ${report.outcome}`,
      `Waarskuwings: ${report.warnings}`,
      report.locks ? `Slotte: ${report.locks}` : null,
      report.memoMin ? `Memo-tyd: ${report.memoMin}m` : null,
      report.task ? `Taak: ${report.task}` : null,
      report.surveySummary ? `\nSurvey:\n${report.surveySummary}` : null,
      `\nTyd: ${new Date().toLocaleString("af-ZA")}`
    ].filter(Boolean);
    const message = lines.join("\n");
    this.updateLive({ status: "off", totalWarnings: report.warnings, locks: report.locks });
    this.durable({
      kind: "end",
      title: "SESSIE-VERSLAG",
      text: message,
      data: report,
      extra: { outcome: report.outcome }
    });
    this._live = null;
    await this.publish({
      title: "SESSIE-VERSLAG",
      message,
      tags: ["clipboard", "white_check_mark"],
      priority: 3
    });
  },

  async wallieSurvey({ text, data }) {
    this.durable({ kind: "survey", title: "SURVEY — Wallie ná sessie", text, data });
    await this.publish({
      title: "SURVEY — Wallie ná sessie",
      message: text,
      tags: ["memo", "speech_balloon"],
      priority: 3
    });
  },

  async paSurvey({ text, data }) {
    this.durable({ kind: "pa-survey", title: "PA-SURVEY", text, data });
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
    this.durable({ kind: "probleem", title, text, data });
    await this.publish({
      title,
      message: text,
      tags: ["bug"],
      priority: blocking ? 4 : 3,
      skipConsent: true
    });
  },

  pingOffline() {
    this.stopHeartbeat();
    this._live = null;
  },

  /* ---------- Duursame uitboks → Pa-konsole ---------- */

  outboxLoad() {
    const empty = { queue: [], sentCount: 0, lastSentAt: null, lastError: null };
    try {
      return { ...empty, ...JSON.parse(localStorage.getItem(this.outboxKey) || "{}") };
    } catch {
      return empty;
    }
  },

  outboxSave(box) {
    try {
      localStorage.setItem(this.outboxKey, JSON.stringify(box));
    } catch {}
  },

  outboxUpdate(mutator) {
    const box = this.outboxLoad();
    mutator(box);
    this.outboxSave(box);
    return box;
  },

  /* Net vir egte gebeure — moet nooit sessies of surveys versin nie */
  durable({ kind, title, text, data, extra }) {
    const live = ["start", "warn", "lock", "unlock", "memo", "end"].includes(kind) ? this.liveFields() : {};
    const item = {
      id: `${kind}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      payload: {
        ...live,
        ...(extra || {}),
        kind,
        title,
        body: text || "",
        data: data || null,
        client_at: Date.now()
      },
      createdAt: Date.now(),
      tries: 0,
      nextTryAt: 0
    };
    this.outboxUpdate((box) => {
      box.queue.push(item);
      if (box.queue.length > this.outboxMax) box.queue = box.queue.slice(-this.outboxMax);
    });
    this.notifyDurable();
    this.flushOutbox();
    return item.id;
  },

  async sendDurable(item) {
    if (!WALLIE.LIVE) return { ok: false, error: "live-config.js ontbreek" };
    try {
      const res = await WALLIE.LIVE.rpc("wallie_ingest", { p: item.payload });
      if (res && res.ok) return { ok: true };
      return { ok: false, permanent: res?.error === "bad kind" || res?.error === "too big", error: res?.error || "onbekend" };
    } catch (e) {
      return { ok: false, error: e.message || "netwerk" };
    }
  },

  async flushOutbox() {
    if (this._flushing) return;
    this._flushing = true;
    try {
      const due = this.outboxLoad().queue.filter((q) => (q.nextTryAt || 0) <= Date.now());
      for (const item of due) {
        const res = await this.sendDurable(item);
        this.outboxUpdate((box) => {
          const q = box.queue.find((x) => x.id === item.id);
          if (res.ok || res.permanent) {
            box.queue = box.queue.filter((x) => x.id !== item.id);
            if (res.ok) {
              box.sentCount = (box.sentCount || 0) + 1;
              box.lastSentAt = Date.now();
              box.lastError = null;
            } else {
              box.lastError = res.error;
            }
          } else if (q) {
            q.tries = (q.tries || 0) + 1;
            q.nextTryAt = Date.now() + Math.min(5 * 60 * 1000, 15000 * 2 ** Math.min(q.tries, 5));
            box.lastError = res.error;
          }
        });
        this.notifyDurable();
        if (!res.ok && !res.permanent) break;
      }
    } finally {
      this._flushing = false;
    }
  },

  startOutbox() {
    if (this._flushTimer) return;
    this.flushOutbox();
    this._flushTimer = setInterval(() => this.flushOutbox(), 30000);
    if (typeof window !== "undefined" && window.addEventListener) {
      window.addEventListener("online", () => this.flushOutbox());
    }
  },

  durableStatus() {
    const box = this.outboxLoad();
    const waiting = box.queue.length;
    const last = box.lastSentAt ? new Date(box.lastSentAt).toLocaleTimeString("af-ZA") : null;
    if (!waiting) {
      return box.sentCount
        ? `Pa-konsole: alles gestoor (${box.sentCount} gebeure · laaste ${last}).`
        : "Pa-konsole: niks om te stuur nie (net egte sessies, surveys en probleme word gestuur).";
    }
    return `Pa-konsole: ${waiting} wag om te stuur (${box.lastError || "nog nie probeer nie"}). Probeer outomaties weer — niks gaan verlore nie.`;
  },

  notifyDurable() {
    try {
      this.onDurableStatus?.(this.durableStatus());
    } catch {}
  }
};
