/* Remote Pa-sink — ntfy (foon-push + lewendige status). Video bly plaaslik. */
window.WALLIE = window.WALLIE || {};

WALLIE.REMOTE = {
  /* Verander hierdie topic as jy wil — Pa en Wallie moet dieselfde hê */
  ntfyServer: "https://ntfy.sh",
  ntfyTopic: "wallie911-pa-15sos-hanno",
  heartbeatMs: 20000,
  staleMs: 45000,
  _hbTimer: null,
  _lastPayload: null,

  consentKey: "wallie911_remote_consent_v1",

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

  async publish({ title, message, tags, priority, extras }) {
    if (!this.hasConsent()) return { ok: false, error: "geen_toestemming" };
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

  async sessionStart({ subjectSlug, minutes, task }) {
    this._lastPayload = {
      kind: "heartbeat",
      status: "active",
      subjectSlug,
      minutes,
      task: task || "",
      warnings: 0,
      startedAt: Date.now(),
      leftMs: minutes * 60 * 1000
    };
    await this.publish({
      title: "IN SESSIE — begin",
      message: `${this.subjectLabel(subjectSlug)} · ${minutes}m\nTaak: ${task || "—"}\nPa-dashboard: oop pa-afstand.html`,
      tags: ["rotating_light", "green_circle"],
      priority: 4
    });
    this.startHeartbeat();
  },

  async sessionWarn({ warnings, reason, subjectSlug, leftMs }) {
    if (this._lastPayload) {
      this._lastPayload.status = "warned";
      this._lastPayload.warnings = warnings;
      this._lastPayload.leftMs = leftMs;
      this._lastPayload.reason = reason;
    }
    await this.publish({
      title: `WAARSKUWING ${warnings}/3`,
      message: `${this.subjectLabel(subjectSlug)}\n${reason}`,
      tags: ["warning", "orange_circle"],
      priority: 4
    });
  },

  async sessionLock({ subjectSlug, reason }) {
    if (this._lastPayload) this._lastPayload.status = "locked";
    this.stopHeartbeat();
    await this.publish({
      title: "SLOT — Pa-PIN nodig",
      message: `${this.subjectLabel(subjectSlug)}\n${reason || "3 waarskuwings"}\nOntsluit by sy skootrekenaar (PIN 9110).`,
      tags: ["no_entry", "red_circle", "siren"],
      priority: 5
    });
  },

  async heartbeatTick(live) {
    this._lastPayload = {
      kind: "heartbeat",
      status: live.status,
      subjectSlug: live.subject,
      warnings: live.warnings || 0,
      startedAt: live.startedAt,
      leftMs: live.leftMs,
      at: Date.now()
    };
    /* Lae prioriteit — vervang nie sirene nie; Pa-dashboard lees hierdie */
    await this.publish({
      title: `HB ${live.status || "off"}`,
      message: JSON.stringify(this._lastPayload),
      tags: ["heartbeat"],
      priority: 2,
      extras: { "X-Wallie-Kind": "heartbeat" }
    });
  },

  startHeartbeat() {
    this.stopHeartbeat();
    this._hbTimer = setInterval(() => {
      if (!this._lastPayload || this._lastPayload.status === "off") return;
      this.heartbeatTick(this._lastPayload);
    }, this.heartbeatMs);
  },

  stopHeartbeat() {
    if (this._hbTimer) clearInterval(this._hbTimer);
    this._hbTimer = null;
  },

  updateLive(live) {
    if (!this._lastPayload) this._lastPayload = {};
    Object.assign(this._lastPayload, live, { kind: "heartbeat", at: Date.now() });
  },

  async sessionEnd(report) {
    this.stopHeartbeat();
    this._lastPayload = { kind: "heartbeat", status: "off", at: Date.now() };
    const lines = [
      `Vak: ${this.subjectLabel(report.subjectSlug)}`,
      `Duur: ${report.durationMin}m (beplan ${report.plannedMin}m)`,
      `Uitkoms: ${report.outcome}`,
      `Waarskuwings: ${report.warnings}`,
      report.task ? `Taak: ${report.task}` : null,
      report.surveySummary ? `\nSurvey:\n${report.surveySummary}` : null,
      `\nTyd: ${new Date().toLocaleString("af-ZA")}`
    ].filter(Boolean);
    await this.publish({
      title: "SESSIE-VERSLAG",
      message: lines.join("\n"),
      tags: ["clipboard", "white_check_mark"],
      priority: 3
    });
  },

  async pingOffline() {
    this.stopHeartbeat();
    await this.publish({
      title: "AF — geen aktiewe sessie",
      message: "Hartklop gestop / app toe of sessie klaar.",
      tags: ["black_circle"],
      priority: 2
    });
  }
};
