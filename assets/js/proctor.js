/* Hard-proctor sessie-logika */
window.WALLIE = window.WALLIE || {};

WALLIE.proctor = {
  stream: null,
  timerId: null,
  tickId: null,
  visibilityHandler: null,
  blurHandler: null,
  endsAt: null,
  maxWarnings: 3,
  active: false,

  async start({ minutes, onTick, onWarn, onLock, onEnd }) {
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

    this.active = true;
    this.endsAt = Date.now() + minutes * 60 * 1000;
    let warnings = 0;

    const warn = (reason) => {
      if (!this.active) return;
      warnings += 1;
      onWarn?.(warnings, reason);
      if (warnings >= this.maxWarnings) {
        this.lock();
        onLock?.(warnings, reason);
      }
    };

    this.visibilityHandler = () => {
      if (document.hidden) warn("Tab weg / geminimiseer");
    };
    this.blurHandler = () => warn("Venster verloor fokus");
    document.addEventListener("visibilitychange", this.visibilityHandler);
    window.addEventListener("blur", this.blurHandler);

    this.tickId = setInterval(() => {
      const left = Math.max(0, this.endsAt - Date.now());
      onTick?.(left, warnings);
      if (left <= 0) {
        this.stop();
        onEnd?.("tyd_klaar");
      }
    }, 250);

    return { ok: true, stream: this.stream };
  },

  lock() {
    /* UI hanteer lock; proctor bly “active” tot Pa of end */
  },

  stop() {
    this.active = false;
    if (this.tickId) clearInterval(this.tickId);
    this.tickId = null;
    if (this.visibilityHandler) {
      document.removeEventListener("visibilitychange", this.visibilityHandler);
    }
    if (this.blurHandler) {
      window.removeEventListener("blur", this.blurHandler);
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
  }
};
