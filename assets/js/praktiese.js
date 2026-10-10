/* Praktiese modus (RTT/CAT) — logika. Skerms kom apart (vraebank-ui / Sonnet).
   Probleem: tydens RTT-praktiese werk moet Wallie na Word/Excel/Access/Notepad oorskakel, en die proctor
   het dit as wegkyk getel (waarskuwing → slot). Tydens ’n praktiese blok:
   - Tab weg / blur / minimiseer gee GEEN waarskuwing en GEEN slot nie; die waarskuwing-teller bly staan.
   - Die bestaande "visibility"- en "heartbeat"-gebeure loop ONVERANDERD na Pa (die tyd word eerlik gelog).
   - Elke afwesigheid word ook plaaslik gelog in wallie911_vraebank_v1 → prakties[].afwesig.
   - Die blok word gemerk via die bestaande taak-veld (#session-task = "Praktiese blok: RTT V1");
     geen nuwe veld of nuwe gebeur-soort nie. Loop ’n RTT-sessie reeds, kry die volgende hartklop/einde
     die merk (REMOTE.updateLive); begin die sessie ná die blok, gaan dit in die sessie-begin self.
   - Die blok eindig self ná 3 h 15 min (rede_einde "maks") of met end() ("klaar"); daarna gedra die
     proctor hom presies soos voorheen.
   - Oorleef ’n bladsy-herlaai (lees VraebankStore.activePractical()); as 3 h 15 min reeds verby is → "maks".
   - Net vir RTT: die vak is die aktiewe sessie se vak, anders die keuse in #session-subject (slug "rtt").

   API (window.Praktiese):
     canStart()       → true as ’n blok nou mag begin (RTT gekies/aktief en nog geen blok aktief nie)
     start()          → { ok: true, blok } of { ok: false, error }
     end()            → sluit die blok met "klaar"; gee die geslote blok terug (of null)
     active()         → true terwyl ’n blok loop (sluit self met "maks" as die tyd verby is)
     remainingMs()    → millisekondes oor in die blok (0 as nie aktief nie)
     onChange(fn)     → fn({ active, remainingMs, rede }) by begin/einde; gee ’n afmeld-funksie terug
     suppressWarn()   → (vir proctor.js) true as ’n wegkyk-waarskuwing nou NIE mag tel nie
     taskFor(slug)    → (vir app.js) MERK as ’n RTT-sessie tydens ’n blok begin, anders null
     MAX_MS, MERK, SUBJECT — konstantes */
(function () {
  const MAX_MS = (3 * 60 + 15) * 60 * 1000;
  const MERK = "Praktiese blok: RTT V1";
  const SUBJECT = "rtt";
  const BLUR_DELAY_MS = 1500;
  const listeners = [];
  let maxTimer = null;
  let blurTimer = null;

  const store = () => window.VraebankStore;
  const byId = (id) => (typeof document !== "undefined" && document.getElementById ? document.getElementById(id) : null);

  function currentSubject() {
    /* Tydens ’n sessie: die vak waarmee die sessie begin het (gestoorde live-staat), nie die keuselys nie */
    if (window.WALLIE?.proctor?.active) {
      try {
        const s = JSON.parse(localStorage.getItem("wallie911_v2_bok") || "null");
        if (s && s.live && s.live.subject) return s.live.subject;
      } catch {
        /* val terug op die keuselys */
      }
    }
    const sel = byId("session-subject");
    return sel ? sel.value : null;
  }

  function beginMs(rec) {
    return Date.parse(rec.begin);
  }

  function emit(rede) {
    const info = { active: Praktiese.active(), remainingMs: Praktiese.remainingMs(), rede: rede || null };
    listeners.slice().forEach((fn) => {
      try {
        fn(info);
      } catch {
        /* ’n UI-fout mag nooit die proctor breek nie */
      }
    });
  }

  function markTask() {
    const el = byId("session-task");
    if (el && el.value !== MERK) el.value = MERK;
    /* Loop ’n sessie reeds: die bestaande taak-veld in die volgende hartklop/einde (geen nuwe veld nie) */
    if (window.WALLIE?.proctor?.active) window.WALLIE.REMOTE?.updateLive?.({ task: MERK });
  }

  function schedule(rec) {
    clearTimeout(maxTimer);
    const left = Math.max(0, beginMs(rec) + MAX_MS - Date.now());
    maxTimer = setTimeout(() => Praktiese.active(), left + 50);
  }

  function close(rede, eindeIso) {
    clearTimeout(maxTimer);
    clearTimeout(blurTimer);
    maxTimer = null;
    blurTimer = null;
    const rec = store()?.practicalEnd(rede, eindeIso) || null;
    emit(rede);
    return rec;
  }

  function present() {
    return !document.hidden && document.hasFocus?.() !== false;
  }

  const Praktiese = {
    MAX_MS,
    MERK,
    SUBJECT,

    canStart() {
      if (!store()) return false;
      if (this.active()) return false;
      return currentSubject() === SUBJECT;
    },

    start() {
      if (!store()) return { ok: false, error: "Vraebank-stoor nie gelaai nie." };
      if (this.active()) return { ok: false, error: "Praktiese blok loop reeds." };
      if (currentSubject() !== SUBJECT) return { ok: false, error: "Praktiese blok is net vir RTT (CAT)." };
      const blok = store().practicalStart();
      markTask();
      schedule(blok);
      emit(null);
      return { ok: true, blok };
    },

    end() {
      if (!this.active()) return null;
      return close("klaar");
    },

    active() {
      const rec = store()?.activePractical();
      if (!rec) return false;
      const b = beginMs(rec);
      if (!Number.isFinite(b) || Date.now() - b >= MAX_MS) {
        close("maks", Number.isFinite(b) ? new Date(b + MAX_MS).toISOString() : undefined);
        return false;
      }
      return true;
    },

    remainingMs() {
      const rec = store()?.activePractical();
      if (!rec) return 0;
      return Math.max(0, beginMs(rec) + MAX_MS - Date.now());
    },

    onChange(fn) {
      if (typeof fn !== "function") return () => {};
      listeners.push(fn);
      return () => {
        const i = listeners.indexOf(fn);
        if (i >= 0) listeners.splice(i, 1);
      };
    },

    suppressWarn() {
      return this.active() && currentSubject() === SUBJECT;
    },

    taskFor(subjectSlug) {
      return subjectSlug === SUBJECT && this.active() ? MERK : null;
    }
  };

  /* Plaaslike afwesigheid-log: een uitstappie = een inskrywing (blur + visibilitychange saam) */
  function away() {
    if (Praktiese.active()) store().practicalAbsence("start");
  }
  function back() {
    clearTimeout(blurTimer);
    if (present() && Praktiese.active()) store().practicalAbsence("end");
  }
  if (typeof document !== "undefined" && document.addEventListener) {
    document.addEventListener("visibilitychange", () => (document.hidden ? away() : back()));
  }
  if (typeof window.addEventListener === "function") {
    window.addEventListener("blur", () => {
      clearTimeout(blurTimer);
      blurTimer = setTimeout(() => {
        if (!present()) away();
      }, BLUR_DELAY_MS);
    });
    window.addEventListener("focus", back);
  }

  /* Herlaai tydens ’n blok: hervat (of sluit met "maks" as die tyd verby is) */
  const rec = store()?.activePractical();
  if (rec && Praktiese.active()) {
    markTask();
    schedule(rec);
    if (present()) store().practicalAbsence("end");
  }

  window.Praktiese = Praktiese;
})();
