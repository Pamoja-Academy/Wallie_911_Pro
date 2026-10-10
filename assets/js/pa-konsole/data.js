// assets/js/pa-konsole/data.js
(function () {
  'use strict';

  var PK = window.PK = window.PK || {};
  var TOKEN_KEY = 'wallie911_pa_token';
  var HIST_KEY = 'wallie911_pa_hist_v1';

  var demoMode = false;
  try {
    demoMode = !!(window.__VOORSKOU__ && window.__VOORSKOU__.aktief) ||
      /[?&]demo=1\b/.test(String(window.location && window.location.search || ''));
  } catch (e) { demoMode = true; }

  function sastDay(ms) {
    try {
      return new Date(ms).toLocaleDateString('en-CA', { timeZone: 'Africa/Johannesburg' });
    } catch (e) {
      var d = new Date(ms);
      return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
    }
  }
  function hmToMs(day, hm) {
    if (!day || !hm) return null;
    var t = Date.parse(day + 'T' + hm + ':00+02:00');
    return isNaN(t) ? null : t;
  }
  function num(v, dflt) {
    var n = Number(v);
    return (typeof n === 'number' && isFinite(n)) ? n : (dflt || 0);
  }
  /* Bediener-tye kom as ISO-stringe; getalle word as ms aanvaar */
  function ts(v, dflt) {
    if (v == null || v === '') return dflt;
    if (typeof v === 'number') return isFinite(v) ? v : dflt;
    var t = Date.parse(v);
    return isNaN(t) ? dflt : t;
  }
  function numOrNull(v) {
    var n = Number(v);
    return (typeof n === 'number' && isFinite(n)) ? n : null;
  }
  function subjKeyOf(subject, slug) {
    try {
      if (PK.subjectKey) return PK.subjectKey(subject || '', slug || '');
    } catch (e) { /* ignore */ }
    return 'ander';
  }
  function subjName(key, fallback) {
    if (fallback) return fallback;
    try {
      if (PK.SUBJ && PK.SUBJ[key] && PK.SUBJ[key].n) return PK.SUBJ[key].n;
    } catch (e) { /* ignore */ }
    return key || 'Onbekend';
  }

  // ---------- heartbeat ring buffer ----------
  var beats = [];
  function pushBeat(ok) {
    beats.push({ at: Date.now(), ok: !!ok });
    if (beats.length > 40) beats.splice(0, beats.length - 40);
  }

  // ---------- history cache ----------
  function loadHistCache() {
    try {
      var raw = window.localStorage.getItem(HIST_KEY);
      if (!raw) return {};
      var obj = JSON.parse(raw);
      return (obj && typeof obj === 'object') ? obj : {};
    } catch (e) { return {}; }
  }
  function saveHistCache(cache) {
    try {
      var cutoff = sastDay(Date.now() - 21 * 86400000);
      var out = {};
      for (var k in cache) {
        if (Object.prototype.hasOwnProperty.call(cache, k) && k >= cutoff) out[k] = cache[k];
      }
      window.localStorage.setItem(HIST_KEY, JSON.stringify(out));
    } catch (e) { /* ignore */ }
  }

  function sessionMinutes(s) {
    try {
      if (s == null) return 0;
      if (s.minutes != null && isFinite(Number(s.minutes))) {
        return Math.max(0, Math.min(480, Math.round(Number(s.minutes))));
      }
      if (s.actual_ms != null && isFinite(Number(s.actual_ms))) {
        return Math.max(0, Math.min(480, Math.round(Number(s.actual_ms) / 60000)));
      }
      var start = ts(s.started_at, NaN);
      if (!isFinite(start)) return 0;
      var end = ts(s.ended_at, ts(s.last_seen, start));
      var mins = Math.round((Math.min(end, start + 480 * 60000) - start) / 60000);
      return Math.max(0, Math.min(480, mins));
    } catch (e) { return 0; }
  }

  function historyFromSessions(day, sessions) {
    var by = {};
    if (!Array.isArray(sessions)) return by;
    for (var i = 0; i < sessions.length; i++) {
      var s = sessions[i] || {};
      var key = subjKeyOf(s.subject, s.subject_slug);
      var mins = sessionMinutes(s);
      if (mins > 0) by[key] = (by[key] || 0) + mins;
    }
    return by;
  }

  // ---------- normalisation ----------
  function normBlock(b) {
    b = b || {};
    var key = subjKeyOf(b.subject, b.subject_slug);
    return {
      subjectKey: key,
      subject: subjName(key, b.subject),
      title: String(b.title || ''),
      start: b.start || null,
      end: b.end || null,
      minutes: num(b.minutes, 0),
      status: (b.status === 'done' || b.status === 'partial' || b.status === 'missed' || b.status === 'planned') ? b.status : 'planned',
      doneMin: num(b.done_min, 0),
      manual: !!b.manual,
      _id: b.id != null ? b.id : null
    };
  }

  function normSession(s) {
    s = s || {};
    var key = subjKeyOf(s.subject, s.subject_slug);
    return {
      sessionId: s.session_id != null ? s.session_id : (s.id != null ? s.id : null),
      subjectKey: key,
      subject: subjName(key, s.subject),
      task: String(s.task || ''),
      startedAt: ts(s.started_at, 0),
      endedAt: ts(s.ended_at, null),
      lastSeen: ts(s.last_seen, ts(s.started_at, 0)),
      minutes: sessionMinutes(s),
      outcome: s.outcome != null ? String(s.outcome) : null,
      warnings: num(s.warnings, 0),
      locks: num(s.locks, 0),
      blockId: s.block_id != null ? s.block_id : null
    };
  }

  function normCurrent(c) {
    if (!c) return null;
    var key = subjKeyOf(c.subject, c.subject_slug);
    var block = null;
    if (c.block) {
      block = {
        title: String(c.block.title || ''),
        start: c.block.start || null,
        end: c.block.end || null,
        minutes: num(c.block.minutes, 0)
      };
    }
    var status = (c.status === 'warned' || c.status === 'locked') ? c.status : 'active';
    return {
      sessionId: c.session_id != null ? c.session_id : null,
      subjectKey: key,
      subject: subjName(key, c.subject),
      task: String(c.task || ''),
      status: status,
      startedAt: ts(c.started_at, 0),
      lastSeen: ts(c.last_seen, ts(c.started_at, 0)),
      leftMs: numOrNull(c.left_ms),
      plannedMin: numOrNull(c.planned_min),
      warnings: num(c.warnings, 0),
      totalWarnings: num(c.total_warnings, num(c.warnings, 0)),
      locks: num(c.locks, 0),
      block: block,
      visible: (c.visible === true || c.visible === false) ? c.visible : null,
      focused: (c.focused === true || c.focused === false) ? c.focused : null,
      idle: (c.idle === true || c.idle === false) ? c.idle : null,
      visibleMs: num(c.visible_ms, 0),
      focusedMs: num(c.focused_ms, 0),
      hiddenMs: num(c.hidden_ms, 0),
      idleMs: num(c.idle_ms, 0)
    };
  }

  var EVENT_MAP = {
    start: { kind: 'ok', icon: '▶' },
    end: { kind: 'ok', icon: '■' },
    warn: { kind: 'warn', icon: '◐' },
    lock: { kind: 'lock', icon: '✗' },
    unlock: { kind: 'info', icon: '↺' },
    memo: { kind: 'info', icon: '✎' },
    survey: { kind: 'info', icon: '✎' },
    'pa-survey': { kind: 'info', icon: '✎' },
    probleem: { kind: 'lock', icon: '!' },
    offline: { kind: 'warn', icon: '⇅' }
  };

  function buildFeed(events, blocks, day) {
    var feed = [];
    if (Array.isArray(events)) {
      for (var i = 0; i < events.length; i++) {
        var e = events[i] || {};
        var map = EVENT_MAP[e.kind] || { kind: 'info', icon: '•' };
        var title = String(e.title || '');
        if (!title) {
          if (e.kind === 'start') title = 'Sessie begin: ' + subjName(subjKeyOf(e.subject, e.subject_slug), e.subject);
          else if (e.kind === 'end') title = 'Sessie klaar: ' + subjName(subjKeyOf(e.subject, e.subject_slug), e.subject);
          else if (e.kind === 'survey' || e.kind === 'pa-survey') title = 'Survey';
          else if (e.kind === 'probleem') title = 'Probleem gerapporteer';
          else title = String(e.kind || 'Gebeurtenis');
        }
        feed.push({
          kind: map.kind,
          icon: map.icon,
          title: title,
          body: e.body != null ? String(e.body) : '',
          at: ts(e.created_at, 0)
        });
      }
    }
    if (Array.isArray(blocks)) {
      for (var j = 0; j < blocks.length; j++) {
        var b = blocks[j];
        if (b && b.status === 'missed' && b.end) {
          feed.push({
            kind: 'lock',
            icon: '✗',
            title: 'Blok gemis: ' + subjName(b.subjectKey, b.subject),
            body: (b.start || '?') + '–' + (b.end || '?') + ' · geen sessie nie',
            at: hmToMs(day, b.end) || 0
          });
        }
      }
    }
    feed.sort(function (a, b) { return b.at - a.at; });
    return feed.slice(0, 60);
  }

  function computeBusy(blocks, current, nowMs, day) {
    if (!Array.isArray(blocks)) return;
    var curBlockTitle = current && current.block ? current.block.title : null;
    var curBlockStart = current && current.block ? current.block.start : null;
    var curBlockEnd = current && current.block ? current.block.end : null;
    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i];
      if (!b) continue;
      if (b.status === 'done' || b.status === 'partial' || b.status === 'missed') continue;
      var busy = false;
      if (current) {
        if (curBlockTitle && b.title === curBlockTitle && b.start === curBlockStart && b.end === curBlockEnd) {
          busy = true;
        } else if (b.start && b.end) {
          var s = hmToMs(day, b.start);
          var e = hmToMs(day, b.end);
          if (s != null && e != null && nowMs >= s && nowMs <= e) busy = true;
        }
      }
      b.status = busy ? 'busy' : 'planned';
    }
  }

  var LOST_MS = 10 * 60 * 1000;
  function pickOpen(sessions, nowMs) {
    var best = null;
    for (var i = 0; i < sessions.length; i++) {
      var s = sessions[i] || {};
      if (s.ended_at != null) continue;
      if (nowMs - ts(s.last_seen, 0) > LOST_MS) continue;
      if (!best || ts(s.last_seen, 0) > ts(best.last_seen, 0)) best = s;
    }
    return best;
  }

  function buildModel(raw, opts) {
    opts = opts || {};
    raw = raw || {};
    var nowMs = ts(raw.now, Date.now());
    var day = raw.day || sastDay(nowMs);
    var today = raw.today || sastDay(Date.now());
    var blocks = Array.isArray(raw.blocks) ? raw.blocks.map(normBlock) : [];
    var sessions = Array.isArray(raw.sessions) ? raw.sessions.map(normSession) : [];
    var rawCur = raw.current;
    if (rawCur === undefined && Array.isArray(raw.sessions)) rawCur = pickOpen(raw.sessions, nowMs);
    var current = normCurrent(rawCur);
    /* Oop sessie sonder sein vir 10 min = onderbreek (lid toe / krag af): nie meer "nou" nie (soos die ou konsole) */
    if (current && current.lastSeen && nowMs - current.lastSeen > LOST_MS) current = null;
    if (day !== (raw.today || sastDay(Date.now()))) current = null;

    computeBusy(blocks, current, nowMs, day);

    var lastSession = null;
    var best = -1;
    for (var i = 0; i < sessions.length; i++) {
      var s = sessions[i];
      var t = (s.endedAt != null) ? s.endedAt : s.lastSeen;
      if (t >= best) { best = t; lastSession = s; }
    }
    var lastSessionOut = lastSession ? {
      subject: lastSession.subject,
      subjectKey: lastSession.subjectKey,
      endedAt: lastSession.endedAt,
      lastSeen: lastSession.lastSeen
    } : null;

    var studiedMin = 0, warnings = 0, locks = 0, blocksDone = 0;
    for (var k = 0; k < sessions.length; k++) {
      studiedMin += sessions[k].minutes || 0;
      warnings += sessions[k].warnings || 0;
      locks += sessions[k].locks || 0;
    }
    for (var j = 0; j < blocks.length; j++) {
      if (blocks[j].status === 'done') blocksDone++;
    }

    var stills = [];
    if (Array.isArray(raw.stills)) {
      for (var m = 0; m < raw.stills.length; m++) {
        var st = raw.stills[m] || {};
        stills.push({
          id: st.id != null ? st.id : null,
          sessionId: st.session_id != null ? st.session_id : null,
          at: ts(st.created_at, 0)
        });
      }
    }

    var device = null;
    if (raw.device) {
      device = {
        appVersion: String(raw.device.app_version || ''),
        lastSyncAt: ts(raw.device.last_sync_at, 0),
        eventsReceived: num(raw.device.events_received, 0),
        ageS: num(raw.device.age_s, 0)
      };
    }

    return {
      mode: demoMode ? 'demo' : 'live',
      legacy: !!opts.legacy,
      now: nowMs,
      fetchedAt: Date.now(),
      day: day,
      today: today,
      isToday: day === today,
      current: current,
      lastSession: lastSessionOut,
      blocks: blocks,
      sessions: sessions,
      totals: {
        studiedMin: studiedMin,
        blocksDone: blocksDone,
        blocksTotal: blocks.length,
        sessions: sessions.length,
        warnings: warnings,
        locks: locks
      },
      history: opts.history || [],
      historyLoading: !!opts.historyLoading,
      feed: buildFeed(raw.events, blocks, day),
      stills: stills,
      device: device,
      planReceived: !!raw.plan_received,
      beats: beats.slice()
    };
  }

  // ---------- live polling engine ----------
  var handlers = null;
  var timer = null;
  var inFlight = false;
  var stopped = true;
  var legacy = false;
  var viewDay = null; // null = today
  var lastModel = null;
  var backoffUntil = 0;
  var histCache = loadHistCache();
  var histLoading = false;
  var histStarted = false;
  var stillCache = new Map();

  function token() {
    try { return window.localStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; }
  }
  function setToken(t) {
    try {
      if (t) window.localStorage.setItem(TOKEN_KEY, t);
      else window.localStorage.removeItem(TOKEN_KEY);
    } catch (e) { /* ignore */ }
  }

  function conn(info) {
    try { if (handlers && handlers.onConn) handlers.onConn(info); } catch (e) { /* ignore */ }
  }
  function emit(model) {
    lastModel = model;
    try { if (handlers && handlers.onModel) handlers.onModel(model); } catch (e) { /* ignore */ }
  }
  function authLost() {
    setToken('');
    stopped = true;
    stopTimers();
    try { if (handlers && handlers.onAuthLost) handlers.onAuthLost(); } catch (e) { /* ignore */ }
  }

  function stopTimers() {
    if (timer) { clearTimeout(timer); timer = null; }
  }

  function schedule(ms) {
    stopTimers();
    if (stopped) return;
    var delay = Math.max(1000, ms);
    timer = setTimeout(function () { tick(); }, delay);
    conn({ ok: true, text: 'Reg', nextPollAt: Date.now() + delay, intervalMs: delay });
  }

  function pollInterval() {
    if (legacy) return 60000;
    if (viewDay !== null) return 60000;
    if (lastModel && lastModel.current) return 15000;
    return 60000;
  }

  function rpc(name, args) {
    if (demoMode) return Promise.resolve({ ok: false, error: 'voorskou', transient: false }); /* voorskou: NOOIT netwerk nie */
    try {
      if (!window.WALLIE || !WALLIE.LIVE || typeof WALLIE.LIVE.rpc !== 'function') {
        return Promise.resolve({ ok: false, error: 'no rpc', transient: true });
      }
      return WALLIE.LIVE.rpc(name, args).then(function (r) { return r || { ok: false, error: 'empty', transient: true }; }, function () {
        return { ok: false, error: 'rpc failed', transient: true };
      });
    } catch (e) {
      return Promise.resolve({ ok: false, error: 'rpc exception', transient: true });
    }
  }

  function handleAuth(res) {
    if (res && res.ok === false && String(res.error || '').toLowerCase() === 'auth') {
      pushBeat(false);
      authLost();
      return true;
    }
    return false;
  }

  var pending = false;
  var legacyCheckedAt = 0;
  function tick() {
    if (stopped) return;
    if (inFlight) { pending = true; return; }
    if (legacy && Date.now() - legacyCheckedAt > 5 * 60 * 1000) legacy = false; /* kyk elke 5 min of 002 intussen ontplooi is */
    if (document.hidden) { stopTimers(); return; } /* onVis begin weer sodra die oortjie sigbaar is */
    var nowMs = Date.now();
    if (nowMs < backoffUntil) { schedule(backoffUntil - nowMs); return; }
    inFlight = true;

    var isToday = (viewDay === null);
    var useLight = !legacy && isToday && lastModel && lastModel.current;

    var reqDay = viewDay;
    var call = useLight
      ? rpc('wallie_pa_live', { p_token: token(), p_day: null })
      : legacy
        ? rpc('wallie_pa_live', { p_token: token(), p_day: reqDay })
        : rpc('wallie_pa_overview', { p_token: token(), p_day: reqDay });

    call.then(function (res) {
      inFlight = false;
      if (stopped) return;
      if (pending || reqDay !== viewDay) { pending = false; tick(); return; }
      if (handleAuth(res)) return;
      if (!res || res.ok === false) {
        pushBeat(false);
        if (res && res.missingFunction && !legacy) {
          legacy = true;
          legacyCheckedAt = Date.now();
          tick();
          return;
        }
        backoffUntil = Date.now() + 30000;
        conn({ ok: false, text: 'Geen verbinding — probeer weer', nextPollAt: backoffUntil, intervalMs: 30000 });
        schedule(30000);
        return;
      }
      pushBeat(true);
      backoffUntil = 0;

      if (useLight) {
        mergeLight(res);
      } else {
        var model = buildModel(res, { legacy: legacy, history: buildHistoryArray(res), historyLoading: histLoading });
        emit(model);
        if (!histStarted) {
          histStarted = true;
          startHistoryBackfill(res);
        }
      }
      schedule(pollInterval());
    }, function () {
      inFlight = false;
      if (stopped) return;
      pushBeat(false);
      backoffUntil = Date.now() + 30000;
      conn({ ok: false, text: 'Geen verbinding — probeer weer', nextPollAt: backoffUntil, intervalMs: 30000 });
      schedule(30000);
    });
  }

  function mergeLight(res) {
    if (!lastModel) { tick(); return; }
    try {
      var liveSessions = Array.isArray(res.sessions) ? res.sessions : [];
      var open = pickOpen(liveSessions, ts(res.now, Date.now()));
      if (open) {
        var cur = normCurrent({
          session_id: open.session_id,
          subject: open.subject,
          subject_slug: open.subject_slug,
          task: open.task,
          status: open.status,
          started_at: open.started_at,
          last_seen: open.last_seen,
          left_ms: open.left_ms,
          planned_min: open.planned_min,
          warnings: open.warnings,
          total_warnings: open.total_warnings,
          locks: open.locks,
          visible: open.visible,
          focused: open.focused,
          idle: open.idle,
          block: lastModel.current && lastModel.current.block ? lastModel.current.block : null,
          visible_ms: lastModel.current ? lastModel.current.visibleMs : 0,
          focused_ms: lastModel.current ? lastModel.current.focusedMs : 0,
          hidden_ms: lastModel.current ? lastModel.current.hiddenMs : 0,
          idle_ms: lastModel.current ? lastModel.current.idleMs : 0
        });
        /* blokke se "besig" en die sessie-lys bly van die laaste oorsig; net die held word vars gehou */
        lastModel.current = cur;
      } else {
        lastModel.current = null;
      }
      /* "besig"-blok volg die vars status (blokke wat die bediener as klaar/gemis gemerk het bly so) */
      for (var bi = 0; bi < (lastModel.blocks || []).length; bi++) if (lastModel.blocks[bi].status === 'busy') lastModel.blocks[bi].status = 'planned';
      computeBusy(lastModel.blocks, lastModel.current, ts(res.now, Date.now()), lastModel.day);
      if (Array.isArray(res.events) && res.events.length) {
        lastModel.feed = buildFeed(res.events, lastModel.blocks, lastModel.day);
      }
      lastModel.now = ts(res.now, Date.now());
      lastModel.fetchedAt = Date.now();
      lastModel.beats = beats.slice();
      emit(lastModel);
    } catch (e) { /* ignore */ }
  }

  var lastTodayBy = {};
  function buildHistoryArray(overviewRes) {
    var out = [];
    var todayStr = sastDay(Date.now());
    var todayBy = {};
    if (overviewRes && Array.isArray(overviewRes.sessions) && (overviewRes.day || todayStr) === todayStr) {
      todayBy = historyFromSessions(todayStr, overviewRes.sessions);
      lastTodayBy = todayBy;
    } else {
      todayBy = lastTodayBy;
    }
    for (var d = 13; d >= 0; d--) {
      var dayStr = sastDay(Date.now() - d * 86400000);
      var by = {};
      if (d === 0) {
        by = todayBy;
      } else if (histCache[dayStr]) {
        by = histCache[dayStr];
      }
      out.push({ day: dayStr, bySubject: by });
    }
    return out;
  }

  function startHistoryBackfill(overviewRes) {
    if (histLoading) return;
    var missing = [];
    var todayStr = sastDay(Date.now());
    for (var d = 13; d >= 1; d--) {
      var dayStr = sastDay(Date.now() - d * 86400000);
      if (dayStr === todayStr) continue;
      if (!histCache[dayStr]) missing.push(dayStr);
    }
    if (missing.length === 0) return;
    histLoading = true;

    function next(idx) {
      if (stopped || idx >= missing.length) {
        histLoading = false;
        saveHistCache(histCache);
        if (lastModel) {
          lastModel.history = buildHistoryArray(null);
          lastModel.historyLoading = false;
          emit(lastModel);
        }
        return;
      }
      var day = missing[idx];
      rpc('wallie_pa_live', { p_token: token(), p_day: day }).then(function (res) {
        if (handleAuth(res)) { histLoading = false; return; }
        if (res && res.ok !== false) {
          histCache[day] = historyFromSessions(day, res.sessions);
        }
        setTimeout(function () { next(idx + 1); }, 400);
      }, function () {
        setTimeout(function () { next(idx + 1); }, 400);
      });
    }
    next(0);
  }

  function onVis() {
    try {
      if (!document.hidden && !stopped) {
        tick();
      }
    } catch (e) { /* ignore */ }
  }

  // ---------- public API ----------
  var data = {
    mode: demoMode ? 'demo' : 'live',

    hasToken: function () {
      if (demoMode) return true;
      return !!token();
    },

    login: function (password) {
      if (demoMode) return Promise.resolve({ ok: false, error: 'Voorskou: nie beskikbaar nie' });
      return rpc('wallie_pa_login', { p_password: password }).then(function (res) {
        if (res && res.ok && res.token) {
          setToken(res.token);
          return { ok: true };
        }
        return { ok: false, error: (res && res.error) || 'onbekend' };
      });
    },

    claim: function (code, password) {
      if (demoMode) return Promise.resolve({ ok: false, error: 'Voorskou: nie beskikbaar nie' });
      return rpc('wallie_pa_claim', { p_code: code, p_password: password }).then(function (res) {
        if (res && res.ok && res.token) {
          setToken(res.token);
          return { ok: true };
        }
        return { ok: false, error: (res && res.error) || 'onbekend' };
      });
    },

    logout: function () {
      var t = token();
      setToken('');
      stillCache.clear(); beats.length = 0; lastTodayBy = {}; lastModel = null;
      stopTimers();
      stopped = true;
      if (!demoMode && t) {
        try { rpc('wallie_pa_logout', { p_token: t }); } catch (e) { /* ignore */ }
      }
    },

    changePassword: function (newPass) {
      if (demoMode) return Promise.resolve({ ok: false, error: 'Voorskou: nie beskikbaar nie' });
      return rpc('wallie_pa_change_password', { p_token: token(), p_new: newPass }).then(function (res) {
        if (res && res.ok) return { ok: true };
        return { ok: false, error: (res && res.error) || 'onbekend' };
      });
    },

    errorText: function (code) {
      switch (String(code || '')) {
        case 'bad password': return 'Verkeerde wagwoord.';
        case 'not set': return 'Nog geen wagwoord nie — gebruik die eenmalige kode.';
        case 'too many tries': return 'Te veel pogings. Wag 15 minute.';
        case 'bad code': return 'Kode verkeerd.';
        case 'already set': return 'Wagwoord is reeds gestel — teken bo in.';
        case 'password too short': return 'Wagwoord moet minstens 8 karakters hê.';
        default: return 'Fout: ' + String(code || 'onbekend').slice(0, 80);
      }
    },

    start: function (h) {
      handlers = h || {};
      stopped = false;
      if (demoMode) {
        try {
          var m = PK.demo.model();
          m.beats = beats.slice();
          emit(m);
          conn({ ok: true, text: 'Voorskou — voorbeelddata', nextPollAt: Date.now() + 15000, intervalMs: 15000 });
        } catch (e) { /* ignore */ }
        stopTimers();
        timer = setInterval(function () {
          try {
            if (document.hidden) return;
            var m2 = PK.demo.model();
            m2.beats = beats.slice();
            emit(m2);
            conn({ ok: true, text: 'Voorskou — voorbeelddata', nextPollAt: Date.now() + 15000, intervalMs: 15000 });
          } catch (e) { /* ignore */ }
        }, 15000);
        return;
      }
      /* Skoon begin ná (her)aanmelding: geen ou model, geskiedenis of legacy-vlag van 'n vorige sessie nie */
      lastModel = null; histStarted = false; legacy = false; pending = false; backoffUntil = 0;
      document.addEventListener('visibilitychange', onVis);
      tick();
    },

    stop: function () {
      stopped = true;
      stopTimers();
      try { document.removeEventListener('visibilitychange', onVis); } catch (e) { /* ignore */ }
    },

    setDay: function (dayOrNull) {
      viewDay = dayOrNull || null;
      if (demoMode) {
        try {
          var m = PK.demo.model();
          m.beats = beats.slice();
          emit(m);
        } catch (e) { /* ignore */ }
        return;
      }
      tick();
    },

    refreshNow: function () {
      if (demoMode) {
        try {
          var m = PK.demo.model();
          m.beats = beats.slice();
          emit(m);
        } catch (e) { /* ignore */ }
        return;
      }
      tick();
    },

    loadStill: function (id) {
      if (demoMode) {
        try {
          var m = PK.demo.model();
          for (var i = 0; i < m.stills.length; i++) {
            if (m.stills[i].id === id) return Promise.resolve(m.stills[i].src || null);
          }
        } catch (e) { /* ignore */ }
        return Promise.resolve(null);
      }
      if (stillCache.has(id)) return Promise.resolve(stillCache.get(id));
      return rpc('wallie_pa_still', { p_token: token(), p_id: id }).then(function (res) {
        if (res && res.ok && typeof res.jpeg_b64 === 'string' && /^[A-Za-z0-9+/=\s]+$/.test(res.jpeg_b64)) {
          var url = 'data:image/jpeg;base64,' + res.jpeg_b64;
          stillCache.set(id, url);
          return url;
        }
        return null;
      }, function () { return null; });
    },

    serverNow: function () {
      if (lastModel) return lastModel.now + (Date.now() - lastModel.fetchedAt);
      return Date.now();
    },

    setDemoState: function (s) {
      try { if (PK.demo && PK.demo.setState) PK.demo.setState(s); } catch (e) { /* ignore */ }
      if (demoMode) {
        try {
          var m = PK.demo.model();
          m.beats = beats.slice();
          emit(m);
        } catch (e) { /* ignore */ }
      }
    }
  };

  PK.data = data;
})();
