/* Plaaslike berging via localStorage */
window.WALLIE = window.WALLIE || {};

WALLIE.storage = {
  KEY: "wallie911_v2_bok",

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return this.defaults();
      const d = this.defaults();
      const s = { ...d, ...JSON.parse(raw) };
      /* Ou weergawes kon null/ontbrekende lyste hê — die terugvul en UI verwag lyste */
      ["sessions", "wallieSurveys", "paSurveys", "bugReports", "faults", "papers", "blocks"].forEach((k) => {
        if (!Array.isArray(s[k])) s[k] = d[k];
      });
      ["completedBlocks", "checklist"].forEach((k) => {
        if (!s[k] || typeof s[k] !== "object") s[k] = d[k];
      });
      if (!s.live || typeof s.live !== "object") s.live = d.live;
      return s;
    } catch {
      return this.defaults();
    }
  },

  defaults() {
    return {
      pin: WALLIE.DEFAULT_PIN,
      planDate: null,
      blocks: [],
      completedBlocks: {},
      checklist: {},
      faults: [],
      papers: [],
      sessions: [],
      wallieSurveys: [],
      paSurveys: [],
      bugReports: [],
      pendingSurveySessionId: null,
      live: { status: "off", subject: null, warnings: 0, startedAt: null }
    };
  },

  /* Mag nooit gooi nie: ’n QuotaExceededError in persist() het finishSession() gestop vóór die
     sessie-verslag na Pa kon gaan. Gee false terug as stoor misluk. */
  save(state) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      this.lastError = e?.name || "stoor het misluk";
      return false;
    }
  },

  update(mutator) {
    const state = this.load();
    mutator(state);
    this.save(state);
    return state;
  }
};
