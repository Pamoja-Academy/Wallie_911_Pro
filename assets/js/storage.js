/* Plaaslike berging via localStorage */
window.WALLIE = window.WALLIE || {};

WALLIE.storage = {
  KEY: "wallie911_v2_bok",

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return this.defaults();
      return { ...this.defaults(), ...JSON.parse(raw) };
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

  save(state) {
    localStorage.setItem(this.KEY, JSON.stringify(state));
  },

  update(mutator) {
    const state = this.load();
    mutator(state);
    this.save(state);
    return state;
  }
};
