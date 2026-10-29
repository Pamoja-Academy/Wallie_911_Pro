// assets/js/pa-konsole/demo.js
(function () {
  'use strict';

  var PK = window.PK = window.PK || {};

  var T0 = Date.parse('2026-10-10T15:42:00+02:00');
  var loadTime = Date.now();
  var DAY = '2026-10-10';

  function now() { return T0 + (Date.now() - loadTime); }
  function hm(day, s) { return Date.parse(day + 'T' + s + ':00+02:00'); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function hmOf(ms) {
    var d = new Date(ms);
    var parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Johannesburg', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d);
    var h = '00', m = '00';
    for (var i = 0; i < parts.length; i++) {
      if (parts[i].type === 'hour') h = parts[i].value;
      if (parts[i].type === 'minute') m = parts[i].value;
    }
    return h + ':' + m;
  }

  var FULL = {
    wiskgelett: 'Wiskundige Geletterdheid',
    rtt: 'RTT (CAT)',
    afrikaans: 'Afrikaans',
    toerisme: 'Toerisme',
    engels: 'Engels',
    gasvryheid: 'Gasvryheid'
  };
  function subjName(key) {
    var n = (PK.SUBJ && PK.SUBJ[key] && PK.SUBJ[key].n) || FULL[key] || key;
    return n;
  }

  var state = 'on';

  // Seeded LCG for deterministic pseudo-random history
  function lcg(seed) {
    var s = seed >>> 0;
    return function () {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  var SUBJECTS = ['wiskgelett', 'rtt', 'afrikaans', 'toerisme', 'engels', 'gasvryheid'];

  function buildBlocks() {
    return [
      { subjectKey: 'wiskgelett', subject: FULL.wiskgelett, title: 'Opwarm — 5 sommen', start: '08:30', end: '09:00', minutes: 30, status: 'done', doneMin: 30, manual: false },
      { subjectKey: 'rtt', subject: FULL.rtt, title: 'Praktiese oefening: sigblad', start: '09:10', end: '10:30', minutes: 80, status: 'done', doneMin: 80, manual: false },
      { subjectKey: 'afrikaans', subject: FULL.afrikaans, title: 'Taalstrukture-boor', start: '10:45', end: '12:05', minutes: 80, status: 'partial', doneMin: 40, manual: false },
      { subjectKey: 'toerisme', subject: FULL.toerisme, title: 'Kaartwerk & valuta', start: '12:45', end: '13:55', minutes: 70, status: 'missed', doneMin: 0, manual: false },
      { subjectKey: 'rtt', subject: FULL.rtt, title: 'Teorie kortvrae', start: '14:00', end: '15:10', minutes: 70, status: 'done', doneMin: 65, manual: false },
      { subjectKey: 'wiskgelett', subject: FULL.wiskgelett, title: 'Finansies: rente & huurkoop', start: '15:20', end: '16:10', minutes: 50, status: 'busy', doneMin: 0, manual: false },
      { subjectKey: 'engels', subject: FULL.engels, title: 'Letterkunde-paragraaf', start: '16:15', end: '17:00', minutes: 45, status: 'planned', doneMin: 0, manual: false },
      { subjectKey: 'gasvryheid', subject: FULL.gasvryheid, title: 'Foutlog + môre se top-3', start: '17:05', end: '17:30', minutes: 25, status: 'planned', doneMin: 0, manual: false }
    ];
  }

  function buildSessions(nowMs) {
    var cur = {
      sessionId: 'demo-s6', subjectKey: 'wiskgelett', subject: FULL.wiskgelett,
      task: 'Finansies: rente & huurkoop', startedAt: hm(DAY, '15:21'), endedAt: null,
      lastSeen: nowMs, minutes: 0, outcome: null, warnings: 0, locks: 0, blockId: 'demo-b6'
    };
    cur.minutes = Math.max(0, Math.round((nowMs - cur.startedAt) / 60000));
    return [
      { sessionId: 'demo-s1', subjectKey: 'wiskgelett', subject: FULL.wiskgelett, task: 'Opwarm — 5 sommen', startedAt: hm(DAY, '08:32'), endedAt: hm(DAY, '09:01'), lastSeen: hm(DAY, '09:01'), minutes: 29, outcome: 'klaar', warnings: 0, locks: 0, blockId: 'demo-b1' },
      { sessionId: 'demo-s2', subjectKey: 'rtt', subject: FULL.rtt, task: 'Praktiese oefening: sigblad', startedAt: hm(DAY, '09:12'), endedAt: hm(DAY, '10:35'), lastSeen: hm(DAY, '10:35'), minutes: 83, outcome: 'klaar', warnings: 0, locks: 0, blockId: 'demo-b2' },
      { sessionId: 'demo-s3', subjectKey: 'afrikaans', subject: FULL.afrikaans, task: 'Taalstrukture-boor', startedAt: hm(DAY, '10:50'), endedAt: hm(DAY, '11:30'), lastSeen: hm(DAY, '11:30'), minutes: 40, outcome: 'gedeeltelik', warnings: 0, locks: 0, blockId: 'demo-b3' },
      { sessionId: 'demo-s4', subjectKey: 'rtt', subject: FULL.rtt, task: 'Teorie kortvrae', startedAt: hm(DAY, '14:03'), endedAt: hm(DAY, '15:08'), lastSeen: hm(DAY, '15:08'), minutes: 65, outcome: 'klaar', warnings: 0, locks: 0, blockId: 'demo-b5' },
      cur
    ];
  }

  function buildHistory(nowMs) {
    var rnd = lcg(7);
    var out = [];
    var todayBy = {};
    var sessions = buildSessions(nowMs);
    for (var i = 0; i < sessions.length; i++) {
      var s = sessions[i];
      todayBy[s.subjectKey] = (todayBy[s.subjectKey] || 0) + s.minutes;
    }
    for (var d = 13; d >= 0; d--) {
      var dayMs = hm(DAY, '12:00') - d * 86400000;
      var dayStr = new Date(dayMs).toLocaleDateString('en-CA', { timeZone: 'Africa/Johannesburg' });
      var by = {};
      if (d === 0) {
        by = todayBy;
      } else {
        for (var k = 0; k < SUBJECTS.length; k++) {
          var key = SUBJECTS[k];
          var r = rnd();
          var min = 0;
          if (r < 0.28) {
            min = 0;
          } else {
            min = Math.floor(rnd() * 96); // 0–95
          }
          if (d <= 4 && key === 'rtt') {
            min = 60 + Math.floor(rnd() * 71); // 60–130
          }
          if (min > 0) by[key] = min;
        }
      }
      out.push({ day: dayStr, bySubject: by });
    }
    return out;
  }

  function svgStill(i) {
    var hue = (i * 37) % 360;
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180">' +
      '<rect width="320" height="180" fill="hsl(' + hue + ',30%,18%)"/>' +
      '<rect x="30" y="110" width="260" height="12" rx="3" fill="hsl(' + hue + ',25%,35%)"/>' +
      '<rect x="120" y="60" width="80" height="50" rx="4" fill="hsl(' + hue + ',40%,55%)"/>' +
      '<rect x="126" y="66" width="68" height="34" rx="2" fill="hsl(' + hue + ',45%,80%)"/>' +
      '<rect x="60" y="92" width="40" height="18" rx="2" fill="hsl(' + ((hue + 40) % 360) + ',35%,60%)"/>' +
      '<circle cx="250" cy="95" r="12" fill="hsl(' + ((hue + 80) % 360) + ',40%,65%)"/>' +
      '<text x="160" y="160" font-family="monospace" font-size="14" fill="#ffffff" text-anchor="middle">VOORBEELD · GETEKEN</text>' +
      '</svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function buildStills(nowMs) {
    var out = [];
    var base = nowMs - 45000;
    for (var i = 0; i < 10; i++) {
      var at = base - i * 45000;
      out.push({ id: 'demo-still-' + i, sessionId: 'demo-s6', at: at, src: svgStill(i) });
    }
    return out;
  }

  function buildFeed(nowMs, blocks) {
    var feed = [];
    function push(kind, icon, title, body, at) { feed.push({ kind: kind, icon: icon, title: title, body: body, at: at }); }
    push('ok', '▶', 'Sessie begin: ' + subjName('wiskgelett'), 'Opwarm — 5 sommen', hm(DAY, '08:32'));
    push('ok', '■', 'Sessie klaar: ' + subjName('wiskgelett'), 'Opwarm — 5 sommen', hm(DAY, '09:01'));
    push('ok', '▶', 'Sessie begin: ' + subjName('rtt'), 'Praktiese oefening: sigblad', hm(DAY, '09:12'));
    push('info', '✎', 'Survey', 'Sigblad-formules gaan beter, VLOOKUP nog lastig', hm(DAY, '10:20'));
    push('ok', '■', 'Sessie klaar: ' + subjName('rtt'), 'Praktiese oefening: sigblad', hm(DAY, '10:35'));
    push('ok', '▶', 'Sessie begin: ' + subjName('afrikaans'), 'Taalstrukture-boor', hm(DAY, '10:50'));
    push('ok', '■', 'Sessie klaar: ' + subjName('afrikaans'), 'Taalstrukture-boor', hm(DAY, '11:30'));
    push('ok', '▶', 'Sessie begin: ' + subjName('rtt'), 'Teorie kortvrae', hm(DAY, '14:03'));
    push('ok', '■', 'Sessie klaar: ' + subjName('rtt'), 'Teorie kortvrae', hm(DAY, '15:08'));
    push('ok', '▶', 'Sessie begin: ' + subjName('wiskgelett'), 'Finansies: rente & huurkoop', hm(DAY, '15:21'));
    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i];
      if (b.status === 'missed') {
        push('lock', '✗', 'Blok gemis: ' + subjName(b.subjectKey), b.start + '–' + b.end + ' · geen sessie nie', hm(DAY, b.end));
      }
    }
    feed.sort(function (a, b) { return b.at - a.at; });
    return feed.slice(0, 60);
  }

  function buildBeats() {
    var out = [];
    var t = Date.now() - 29 * 15000;
    for (var i = 0; i < 30; i++) {
      out.push({ at: t + i * 15000, ok: i !== 17 });
    }
    return out;
  }

  function model(nowMs) {
    nowMs = (typeof nowMs === 'number') ? nowMs : now();
    var blocks = buildBlocks();
    var sessions = buildSessions(nowMs);
    var history = buildHistory(nowMs);
    var beats = buildBeats();

    var current = null;
    var lastSession = null;
    var device = { appVersion: '2026.10.09', lastSyncAt: nowMs - 20000, eventsReceived: 148, ageS: 20 };

    var curSess = sessions[sessions.length - 1];

    if (state === 'off') {
      sessions = sessions.slice(0, 4);
      blocks[5].status = 'planned';
      lastSession = { subject: FULL.rtt, subjectKey: 'rtt', endedAt: hm(DAY, '15:08'), lastSeen: hm(DAY, '15:08') };
    } else {
      var status = 'active', focused = true, visible = true, warnings = 0, locks = 0, lastSeen = nowMs, ageS = 4;
      if (state === 'warn') { status = 'warned'; focused = false; warnings = 1; }
      if (state === 'lock') { status = 'locked'; focused = false; visible = false; warnings = 3; locks = 1; }
      if (state === 'lost') { lastSeen = nowMs - (3 * 60 + 12) * 1000; ageS = 192; device = { appVersion: '2026.10.09', lastSyncAt: nowMs - 192000, eventsReceived: 148, ageS: 192 }; }
      curSess.warnings = warnings;
      curSess.locks = locks;
      curSess.lastSeen = lastSeen;
      current = {
        sessionId: curSess.sessionId,
        subjectKey: 'wiskgelett',
        subject: FULL.wiskgelett,
        task: 'Finansies: rente & huurkoop',
        status: status,
        startedAt: curSess.startedAt,
        lastSeen: lastSeen,
        leftMs: Math.max(0, hm(DAY, '16:10') - nowMs),
        plannedMin: 50,
        warnings: warnings,
        totalWarnings: warnings,
        locks: locks,
        block: { title: 'Finansies: rente & huurkoop', start: '15:20', end: '16:10', minutes: 50 },
        visible: visible,
        focused: focused,
        idle: false,
        visibleMs: Math.max(0, nowMs - curSess.startedAt),
        focusedMs: focused ? Math.max(0, nowMs - curSess.startedAt) : Math.max(0, nowMs - curSess.startedAt - 60000),
        hiddenMs: visible ? 0 : 120000,
        idleMs: 0
      };
      lastSession = { subject: FULL.wiskgelett, subjectKey: 'wiskgelett', endedAt: null, lastSeen: lastSeen };
    }

    if (state === 'lost') {
      for (var b = beats.length - 3; b < beats.length; b++) { if (b >= 0) beats[b].ok = false; }
    }

    var studiedMin = 0, warnings = 0, locks = 0, blocksDone = 0;
    for (var i = 0; i < sessions.length; i++) {
      studiedMin += sessions[i].minutes || 0;
      warnings += sessions[i].warnings || 0;
      locks += sessions[i].locks || 0;
    }
    for (var j = 0; j < blocks.length; j++) {
      if (blocks[j].status === 'done') blocksDone++;
    }

    return {
      mode: 'demo',
      legacy: false,
      now: nowMs,
      fetchedAt: Date.now(),
      day: DAY,
      today: DAY,
      isToday: true,
      current: current,
      lastSession: lastSession,
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
      history: history,
      historyLoading: false,
      feed: buildFeed(nowMs, blocks),
      stills: buildStills(nowMs),
      device: device,
      planReceived: true,
      beats: beats
    };
  }

  PK.demo = {
    get state() { return state; },
    setState: function (s) {
      if (s === 'on' || s === 'warn' || s === 'lock' || s === 'lost' || s === 'off') state = s;
    },
    model: model,
    now: now
  };
})();
