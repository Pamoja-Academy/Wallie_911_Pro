/* Hard-proctor sessie-logika */
window.WALLIE = window.WALLIE || {};

WALLIE.proctor = {
  stream: null,
  tickId: null,
  visibilityHandler: null,
  blurHandler: null,
  focusHandler: null,
  blurTimer: null,
  endsAt: null,
  maxWarnings: 3,
  /* Kamera-toestemming en Windows-kamera-kennisgewings steel fokus net ná begin */
  startGraceMs: 8000,
  unlockGraceMs: 5000,
  /* Fokus moet so lank weg bly voor dit ’n waarskuwing is (kennisgewing-klik, ens.) */
  blurDelayMs: 1500,
  memoMaxMs: 15 * 60 * 1000,
  active: false,
  locked: false,
  pausedAt: null,
  graceUntil: 0,
  graceUntilFocus: false,
  away: false,
  warnings: 0,
  totalWarnings: 0,
  locks: 0,
  lockedMs: 0,
  memoFrame: null,
  memoSince: null,
  memoMs: 0,
  _cb: {},

  async start(opts) {
    if (this.active) return { ok: false, error: "Sessie loop al." };

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false
      });
    } catch (err) {
      return {
        ok: false,
        error:
          "Kamera geweier of nie beskikbaar nie. Hard-modus vereis kamera. Maak oop via http://localhost (nie file://) en laat kamera toe."
      };
    }

    this.begin(opts);
    return { ok: true, stream: this.stream };
  },

  /* Alles behalwe kamera — apart sodat toetse sonder getUserMedia kan loop */
  begin({ minutes, ...callbacks }) {
    this._cb = callbacks;
    this.active = true;
    this.locked = false;
    this.pausedAt = null;
    this.away = false;
    this.warnings = 0;
    this.totalWarnings = 0;
    this.locks = 0;
    this.lockedMs = 0;
    this.memoSince = null;
    this.memoMs = 0;
    this.endsAt = Date.now() + minutes * 60 * 1000;
    this.grace(this.startGraceMs);

    this.visibilityHandler = () => {
      if (document.hidden) {
        this.warn("Tab weg / geminimiseer");
      } else if (document.hasFocus?.() !== false) {
        this.away = false;
      }
    };
    this.blurHandler = () => {
      clearTimeout(this.blurTimer);
      this.blurTimer = setTimeout(() => {
        if (this.focusStillHere()) return;
        this.warn("Venster verloor fokus");
      }, this.blurDelayMs);
    };
    this.focusHandler = () => {
      clearTimeout(this.blurTimer);
      if (this.graceUntilFocus) {
        this.graceUntilFocus = false;
        this.graceUntil = Date.now() + 1000;
      }
      if (!document.hidden) this.away = false;
    };
    document.addEventListener("visibilitychange", this.visibilityHandler);
    window.addEventListener("blur", this.blurHandler);
    window.addEventListener("focus", this.focusHandler);

    this.tickId = setInterval(() => this.tick(), 250);
  },

  focusStillHere() {
    if (document.hidden) return false;
    if (document.hasFocus?.()) return true;
    /* Fokus in die memo-PDF-raam tel as “hier” — maar net in memo-modus */
    return Boolean(this.memoSince && this.memoFrame && document.activeElement === this.memoFrame);
  },

  timeLeft() {
    const now = this.pausedAt || Date.now();
    return Math.max(0, this.endsAt - now);
  },

  tick() {
    if (!this.active) return;
    if (this.memoSince && Date.now() - this.memoSince >= this.memoMaxMs) {
      this.setMemoMode(false);
      this._cb.onMemoTimeout?.();
    }
    const left = this.timeLeft();
    this._cb.onTick?.(left, this.warnings);
    if (!this.locked && left <= 0) {
      this.stop();
      this._cb.onEnd?.("tyd_klaar");
    }
  },

  grace(ms, { untilFocus = false } = {}) {
    this.graceUntil = Math.max(this.graceUntil, Date.now() + ms);
    if (untilFocus) this.graceUntilFocus = true;
  },

  warn(reason) {
    if (!this.active || this.locked) return;
    if (Date.now() < this.graceUntil) {
      this._cb.onIgnore?.(reason, "grasie");
      return;
    }
    /* Een uitstappie = een waarskuwing (tab-wissel vuur blur + visibilitychange) */
    if (this.away) return;
    this.away = true;
    this.warnings += 1;
    this.totalWarnings += 1;
    this._cb.onWarn?.(this.warnings, reason, this.totalWarnings);
    if (this.warnings >= this.maxWarnings) {
      this.lock();
      this._cb.onLock?.(this.warnings, reason);
    }
  },

  lock() {
    if (this.locked) return;
    this.locked = true;
    this.locks += 1;
    this.pausedAt = Date.now();
    this.setMemoMode(false);
  },

  unlock() {
    if (!this.locked) return;
    if (this.pausedAt) {
      const pausedFor = Date.now() - this.pausedAt;
      this.endsAt += pausedFor;
      this.lockedMs += pausedFor;
    }
    this.pausedAt = null;
    this.locked = false;
    this.warnings = 0;
    this.away = false;
    this.grace(this.unlockGraceMs);
  },

  setMemoMode(on, frame) {
    if (on) {
      if (frame) this.memoFrame = frame;
      if (!this.memoSince) this.memoSince = Date.now();
    } else if (this.memoSince) {
      this.memoMs += Date.now() - this.memoSince;
      this.memoSince = null;
    }
  },

  lockedTotalMs() {
    return this.lockedMs + (this.pausedAt ? Date.now() - this.pausedAt : 0);
  },

  memoMinutes() {
    const live = this.memoSince ? Date.now() - this.memoSince : 0;
    return Math.round((this.memoMs + live) / 60000);
  },

  stop() {
    this.setMemoMode(false);
    this.active = false;
    this.locked = false;
    this.pausedAt = null;
    if (this.tickId) clearInterval(this.tickId);
    this.tickId = null;
    clearTimeout(this.blurTimer);
    this.blurTimer = null;
    if (this.visibilityHandler) {
      document.removeEventListener("visibilitychange", this.visibilityHandler);
    }
    if (this.blurHandler) {
      window.removeEventListener("blur", this.blurHandler);
    }
    if (this.focusHandler) {
      window.removeEventListener("focus", this.focusHandler);
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
  }
};
