/* Pa-konsole v2 — ui.js · vertoon die genormaliseerde MODEL · geen punte/persentasies nie */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var TZ = 'Africa/Johannesburg';
  var LS_THEME = 'wallie911_pa_theme';
  var LS_RM = 'wallie911_pa_rm';

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
      return ch === '&' ? '&amp;' : ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : ch === '"' ? '&quot;' : '&#39;';
    });
  }
  function css(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }
  function fmtHM(ms) {
    if (ms == null || !isFinite(ms)) return '—';
    return new Date(ms).toLocaleTimeString('af-ZA', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
  }
  function fmtDM(ms) {
    return new Date(ms).toLocaleDateString('af-ZA', { timeZone: TZ, day: 'numeric', month: 'short' });
  }
  function fmtWDM(ms) {
    return new Date(ms).toLocaleDateString('af-ZA', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'short' });
  }
  function mmss(ms) {
    var s = Math.max(0, Math.round(ms / 1000));
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
    if (h > 0) return h + ':' + String(m).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
    return String(m).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
  }
  function ageText(ms) {
    var s = Math.max(0, Math.round(ms / 1000));
    if (s < 120) return s + ' s';
    return Math.round(s / 60) + ' min';
  }
  function dayMs(dayStr) { // SAST midnight as ms
    var p = dayStr.split('-');
    return Date.UTC(+p[0], +p[1] - 1, +p[2]) - 2 * 3600000;
  }
  function hmToMs(dayStr, hm) {
    if (!hm) return null;
    var p = hm.split(':');
    return dayMs(dayStr) + (+p[0]) * 3600000 + (+p[1]) * 60000;
  }
  function subjName(key, fallback) {
    var S = window.PK && PK.SUBJ;
    if (S && S[key] && S[key].n) return S[key].n;
    return fallback || key || 'Ander';
  }
  function subjVar(key) {
    var S = window.PK && PK.SUBJ;
    if (S && S[key] && S[key].c) return S[key].c;
    return '--s-' + key;
  }

  /* ---------- toestand ---------- */
  var model = null;
  var conn = null;
  var feedSeen = {};       // "kind|title|at" -> true
  var feedFirst = true;
  var stripKey = '';       // id-lys van strook
  var stillCache = {};     // id -> data-url of 'loading'
  var charts = {};
  var entered = false;
  var kpiVals = { min: null, done: null, sess: null, warn: null, locks: null };
  var lastBeatSeen = 0;
  var tickTimer = null;
  var filter = 'all';

  /* ---------- tema ---------- */
  var modes = ['auto', 'light', 'dark'];
  var modeLbl = { auto: 'Outo', light: 'Lig', dark: 'Donker' };
  var mode = 'auto';
  try { mode = localStorage.getItem(LS_THEME) || 'auto'; } catch (e) {}
  var qp = new URLSearchParams(location.search);
  if (qp.get('theme') && modes.indexOf(qp.get('theme')) >= 0) mode = qp.get('theme');
  if (modes.indexOf(mode) < 0) mode = 'auto';
  var dm = matchMedia('(prefers-color-scheme: dark)');
  function applyTheme() {
    var t = mode === 'auto' ? (dm.matches ? 'dark' : 'light') : mode;
    document.documentElement.dataset.theme = t;
    var b = $('themeBtn'); if (b) b.textContent = '◐ Tema: ' + modeLbl[mode];
    try { localStorage.setItem(LS_THEME, mode); } catch (e) {}
    drawCharts();
  }

  /* ---------- verminder beweging ---------- */
  var mq = matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = mq.matches;
  try {
    var savedRm = localStorage.getItem(LS_RM);
    if (savedRm === '1') reduced = true;
    if (savedRm === '0') reduced = false;
  } catch (e) {}
  function applyMotion() {
    document.body.classList.toggle('rm', reduced);
    var b = $('motionBtn'); if (b) b.setAttribute('aria-pressed', String(reduced));
    drawCharts(true);
  }

  /* ---------- grafieke ---------- */
  function chart(id) {
    if (!window.echarts) return null;
    var el = $(id);
    if (!el) return null;
    if (!charts[id]) charts[id] = echarts.init(el, null, { renderer: 'svg' });
    return charts[id];
  }
  function base() {
    return {
      animation: !reduced, animationDuration: 1100, animationEasing: 'cubicOut',
      aria: { enabled: true },
      textStyle: { fontFamily: 'DM Sans, system-ui, sans-serif', color: css('--muted') }
    };
  }
  function tt() {
    return { confine: true, backgroundColor: css('--panel-solid'), borderColor: css('--line2'), textStyle: { color: css('--text') } };
  }
  function setOpt(id, opt) {
    var c = chart(id);
    if (!c) return;
    try { c.setOption(opt, { notMerge: true }); } catch (e) {}
  }

  /* ---------- fokus-ring ---------- */
  function drawRing() {
    var el = $('ringChart'); if (!el) return;
    var cur = model && model.current;
    var sub = $('ring-sub');
    var data;
    if (cur) {
      var foc = (cur.focusedMs || 0) / 60000;
      var vis = Math.max(0, (cur.visibleMs || 0) - (cur.focusedMs || 0)) / 60000;
      var hid = (cur.hiddenMs || 0) / 60000;
      var idle = (cur.idleMs || 0) / 60000;
      data = [
        { name: 'Gefokus', value: foc, k: '--ok' },
        { name: 'Sigbaar, ander venster', value: vis, k: '--warn' },
        { name: 'Oortjie versteek', value: hid, k: '--lock' },
        { name: 'Ledig', value: idle, k: '--off' }
      ];
      if (sub) sub.textContent = 'Hierdie sessie · minute volgens die app se sigbaar/fokus/ledig-sein';
    } else {
      data = [{ name: 'Geen sessie', value: 1, k: '--off' }];
      if (sub) sub.textContent = 'Geen sessie nou nie';
    }
    var centre = cur ? Math.round(data[0].value) : 0;
    setOpt('ringChart', Object.assign(base(), {
      series: [{
        type: 'pie', radius: ['62%', '88%'], padAngle: cur ? 3 : 0,
        itemStyle: { borderRadius: 6 }, silent: true,
        label: {
          show: true, position: 'center',
          formatter: '{a|' + centre + '}\n{b|min gefokus}',
          rich: {
            a: { fontSize: 28, fontWeight: 800, color: css('--text') },
            b: { fontSize: 11, color: css('--muted') }
          }
        },
        emphasis: { scale: false, label: { show: true } },
        data: data.map(function (d) {
          return { name: d.name, value: +d.value.toFixed(2), itemStyle: { color: css(d.k) } };
        })
      }]
    }));
    var lg = $('ring-legend');
    if (lg) {
      if (!cur) {
        lg.innerHTML = '<div><i style="background:' + esc(css('--off')) + '"></i>Geen sessie nou nie<b>—</b></div>';
      } else {
        lg.innerHTML = data.map(function (d) {
          var v = d.value < 1 ? '<1' : Math.round(d.value);
          return '<div><i style="background:' + esc(css(d.k)) + '"></i>' + esc(d.name) + '<b>' + v + ' min</b></div>';
        }).join('');
      }
    }
  }

  /* ---------- gantt ---------- */
  var stCol = { done: '--ok', partial: '--warn', missed: '--lock', busy: '--s-rtt', planned: '--off' };
  var stLbl = { done: '✓ klaar', partial: '◐ gedeeltelik', missed: '✗ gemis', busy: '● besig', planned: '○ nog te kom' };

  function matchSessions() {
    // gee terug: per blok 'n lys sessies + ekstra-sessies
    var blocks = (model && model.blocks) || [];
    var sessions = (model && model.sessions) || [];
    var perBlock = blocks.map(function () { return []; });
    var extra = [];
    sessions.forEach(function (s) {
      var bi = -1;
      if (s.blockId) {
        for (var i = 0; i < blocks.length; i++) {
          if (blocks[i].id === s.blockId || (blocks[i].id != null && String(blocks[i].id) === String(s.blockId))) { bi = i; break; }
        }
      }
      if (bi < 0) {
        // tyd-ooreenkoms
        for (var j = 0; j < blocks.length; j++) {
          var b = blocks[j];
          var bs = hmToMs(model.day, b.start), be = hmToMs(model.day, b.end);
          if (bs == null || be == null) continue;
          var se = s.endedAt || s.lastSeen || s.startedAt;
          if (s.startedAt < be && se > bs) { bi = j; break; }
        }
      }
      if (bi >= 0) perBlock[bi].push(s); else extra.push(s);
    });
    return { perBlock: perBlock, extra: extra };
  }

  function drawGantt() {
    var el = $('ganttChart'); if (!el) return;
    var blocks = (model && model.blocks) || [];
    var note = $('plan-note');
    if (!model || !blocks.length) {
      setOpt('ganttChart', Object.assign(base(), {
        xAxis: { show: false }, yAxis: { show: false }, series: [],
        graphic: [{ type: 'text', left: 'center', top: 'middle', style: { text: 'Geen blokke vir hierdie dag nie', fill: css('--muted'), fontSize: 13 } }]
      }));
      if (note) note.textContent = model && !model.planReceived
        ? 'Wallie se toestel het nog nie hierdie dag se rooster gestuur nie.'
        : 'Geen blokke vir hierdie dag nie.';
      return;
    }
    if (note) note.textContent = 'Rame = gepland, soliede balke = werklike sessies · lyn = nou';

    var m = matchSessions();
    var rows = []; // {label, block|null, sess[]}
    blocks.forEach(function (b, i) {
      rows.push({ label: (b.start ? b.start + ' ' : '') + subjName(b.subjectKey, b.subject), block: b, sess: m.perBlock[i] });
    });
    m.extra.forEach(function (s) {
      rows.push({ label: 'Ekstra · ' + subjName(s.subjectKey, s.subject), block: null, sess: [s] });
    });

    var nowMs = PK.data.serverNow();
    var minT = Infinity, maxT = -Infinity;
    rows.forEach(function (r) {
      if (r.block) {
        var bs = hmToMs(model.day, r.block.start), be = hmToMs(model.day, r.block.end);
        if (bs != null) minT = Math.min(minT, bs);
        if (be != null) maxT = Math.max(maxT, be);
      }
      r.sess.forEach(function (s) {
        minT = Math.min(minT, s.startedAt);
        maxT = Math.max(maxT, s.endedAt || (model.isToday ? nowMs : s.lastSeen) || s.startedAt);
      });
    });
    if (!isFinite(minT)) { minT = dayMs(model.day) + 8 * 3600000; maxT = minT + 9 * 3600000; }
    minT = Math.floor(minT / 3600000) * 3600000;
    maxT = Math.ceil(maxT / 3600000) * 3600000;
    if (maxT <= minT) maxT = minT + 3600000;

    var planned = [], actual = [];
    rows.forEach(function (r, yi) {
      if (r.block) {
        var bs = hmToMs(model.day, r.block.start), be = hmToMs(model.day, r.block.end);
        if (bs != null && be != null) planned.push({ value: [yi, bs, be], b: r.block });
      }
      r.sess.forEach(function (s) {
        var en = s.endedAt || (model.isToday ? nowMs : s.lastSeen) || s.startedAt;
        actual.push({ value: [yi, s.startedAt, Math.max(en, s.startedAt + 60000)], b: r.block, s: s });
      });
    });

    var isNarrow = el.clientWidth < 560;
    var cats = rows.map(function (r) { return r.label; });
    var opt = Object.assign(base(), {
      grid: { left: isNarrow ? 92 : 140, right: 14, top: 24, bottom: 28 },
      tooltip: Object.assign(tt(), {
        trigger: 'item',
        formatter: function (p) {
          var d = p.data;
          var lab = p.seriesName === 'Gepland' ? 'Gepland' : 'Werklik';
          var mins = Math.round((d.value[2] - d.value[1]) / 60000);
          var head = d.b ? esc(subjName(d.b.subjectKey, d.b.subject)) + ' — ' + esc(d.b.title || '')
                         : esc(subjName(d.s.subjectKey, d.s.subject)) + ' — ' + esc(d.s.task || 'Ekstra sessie');
          var st = d.b ? (stLbl[d.b.status] || d.b.status) : '● sessie';
          return '<b>' + head + '</b><br/>' + lab + ': ' + fmtHM(d.value[1]) + '–' + fmtHM(d.value[2]) +
                 ' (' + mins + ' min)<br/>' + esc(st);
        }
      }),
      xAxis: {
        type: 'time', min: minT, max: maxT, splitNumber: isNarrow ? 4 : 9,
        axisLabel: { formatter: function (v) { return fmtHM(v); }, color: css('--muted') },
        splitLine: { show: true, lineStyle: { color: css('--line') } },
        axisLine: { lineStyle: { color: css('--line2') } }
      },
      yAxis: {
        type: 'category', data: cats, inverse: true,
        axisTick: { show: false }, axisLine: { show: false },
        axisLabel: { color: css('--text'), fontSize: isNarrow ? 10 : 12, width: isNarrow ? 86 : 132, overflow: 'truncate' }
      },
      series: [
        {
          name: 'Gepland', type: 'custom', encode: { x: [1, 2], y: 0 }, data: planned,
          renderItem: function (params, api) {
            var y = api.value(0);
            var a = api.coord([api.value(1), y]), z = api.coord([api.value(2), y]);
            var h = api.size([0, 1])[1] * 0.72;
            var b = planned[params.dataIndex].b;
            var col = css(stCol[b.status] || '--off');
            return {
              type: 'rect',
              shape: { x: a[0], y: a[1] - h / 2, width: Math.max(2, z[0] - a[0]), height: h, r: 6 },
              style: { fill: col + '22', stroke: col, lineWidth: 1.5, lineDash: b.status === 'planned' ? [4, 3] : null }
            };
          }
        },
        {
          name: 'Werklik', type: 'custom', encode: { x: [1, 2], y: 0 }, data: actual,
          renderItem: function (params, api) {
            var y = api.value(0);
            var a = api.coord([api.value(1), y]), z = api.coord([api.value(2), y]);
            var h = api.size([0, 1])[1] * 0.34;
            var d = actual[params.dataIndex];
            var col = d.b ? css(stCol[d.b.status] === '--off' ? '--ok' : stCol[d.b.status]) : css(subjVar(d.s.subjectKey));
            return {
              type: 'rect',
              shape: { x: a[0], y: a[1] - h / 2, width: Math.max(2, z[0] - a[0]), height: h, r: 4 },
              style: { fill: col }
            };
          },
          markLine: model.isToday ? {
            symbol: 'none', silent: true,
            label: { formatter: 'nou', color: css('--gold'), position: 'start' },
            lineStyle: { color: css('--gold'), width: 2, type: 'solid' },
            data: [{ xAxis: nowMs }]
          } : undefined
        }
      ]
    });
    setOpt('ganttChart', opt);
  }

  function renderAgenda() {
    var ul = $('agenda'); if (!ul) return;
    var blocks = (model && model.blocks) || [];
    if (!blocks.length) {
      ul.innerHTML = '<li><div>' + esc(model && !model.planReceived
        ? 'Wallie se toestel het nog nie hierdie dag se rooster gestuur nie.'
        : 'Geen blokke vir hierdie dag nie.') + '</div></li>';
    } else {
      ul.innerHTML = blocks.map(function (b) {
        var col = css(subjVar(b.subjectKey)) || css('--off');
        var st = stLbl[b.status] || b.status;
        var man = b.manual ? ' · self as klaar gemerk' : '';
        return '<li style="border-left-color:' + esc(col) + '">' +
          '<time>' + esc(b.start || '—') + '–' + esc(b.end || '—') + '</time>' +
          '<div>' + esc(b.title || subjName(b.subjectKey, b.subject)) +
          '<small>' + esc(subjName(b.subjectKey, b.subject)) + ' · ' + (b.doneMin || 0) + '/' + (b.minutes || 0) + ' min' + esc(man) + '</small></div>' +
          '<b>' + esc(st) + '</b></li>';
      }).join('');
    }
    var tbl = $('gantt-table');
    if (tbl) {
      if (!blocks.length) {
        tbl.innerHTML = '<tr><th>Blok</th><th>Gepland</th><th>Werklik</th><th>Status</th></tr><tr><td colspan="4">—</td></tr>';
      } else {
        var m = matchSessions();
        tbl.innerHTML = '<tr><th>Blok</th><th>Gepland</th><th>Werklik</th><th>Status</th></tr>' + blocks.map(function (b, i) {
          var acts = m.perBlock[i].map(function (s) {
            return fmtHM(s.startedAt) + '–' + (s.endedAt ? fmtHM(s.endedAt) : 'nou');
          }).join(', ') || '—';
          return '<tr><td>' + esc(subjName(b.subjectKey, b.subject)) + ' — ' + esc(b.title || '') + '</td>' +
            '<td>' + esc(b.start || '—') + '–' + esc(b.end || '—') + '</td>' +
            '<td>' + esc(acts) + '</td><td>' + esc(stLbl[b.status] || b.status) + '</td></tr>';
        }).join('');
      }
    }
  }

  /* ---------- hittekaart ---------- */
  function heatRows() {
    var hist = (model && model.history) || [];
    var keys = [];
    var seen = {};
    Object.keys(PK.SUBJ || {}).forEach(function (k) {
      if (k === 'ander') return;
      keys.push(k); seen[k] = true;
    });
    hist.forEach(function (h) {
      Object.keys(h.bySubject || {}).forEach(function (k) {
        if (!seen[k]) { seen[k] = true; keys.push(k); }
      });
    });
    return keys;
  }
  function drawHeat() {
    var el = $('heatChart'); if (!el) return;
    var hist = (model && model.history) || [];
    var keys = heatRows();
    var xl = hist.map(function (h) { return fmtDM(dayMs(h.day) + 12 * 3600000); });
    var yl = keys.map(function (k) { return subjName(k); });
    var data = [], maxV = 0;
    keys.forEach(function (k, yi) {
      hist.forEach(function (h, xi) {
        var v = Math.round((h.bySubject && h.bySubject[k]) || 0);
        if (v > maxV) maxV = v;
        data.push([xi, yi, v]);
      });
    });
    var isNarrow = el.clientWidth < 560;
    var vmax = Math.max(120, maxV);
    setOpt('heatChart', Object.assign(base(), {
      grid: { left: isNarrow ? 70 : 92, right: 10, top: 6, bottom: 56 },
      tooltip: Object.assign(tt(), {
        formatter: function (p) {
          return esc(yl[p.value[1]]) + ' · ' + esc(xl[p.value[0]]) + '<br/><b>' + p.value[2] + ' min</b>';
        }
      }),
      xAxis: {
        type: 'category', data: xl, splitArea: { show: false },
        axisLabel: { color: css('--muted'), fontSize: 10, interval: isNarrow ? 1 : 0, rotate: isNarrow ? 45 : 0 },
        axisLine: { show: false }, axisTick: { show: false }
      },
      yAxis: {
        type: 'category', data: yl,
        axisLabel: { color: css('--text'), fontSize: isNarrow ? 10 : 12 },
        axisLine: { show: false }, axisTick: { show: false }
      },
      visualMap: {
        min: 0, max: vmax, calculable: false, orient: 'horizontal', left: 'center', bottom: 0,
        itemHeight: isNarrow ? 120 : 180, itemWidth: 10,
        text: [vmax + ' min', '0'], textStyle: { color: css('--muted'), fontSize: 10 },
        inRange: { color: [css('--bg2'), '#1f6f46', '#3dcf7a', '#d4ad35'] }
      },
      series: [{
        type: 'heatmap', data: data,
        itemStyle: { borderColor: css('--panel-solid'), borderWidth: 3, borderRadius: 5 },
        emphasis: { itemStyle: { borderColor: css('--gold'), borderWidth: 2 } },
        animationDelay: function (i) { return reduced ? 0 : i * 6; }
      }]
    }));
    var tbl = $('heat-table');
    if (tbl) {
      var html = '<tr><th>Vak</th>' + xl.map(function (x) { return '<th>' + esc(x) + '</th>'; }).join('') + '</tr>';
      html += keys.map(function (k, yi) {
        return '<tr><td>' + esc(subjName(k)) + '</td>' + hist.map(function (h, xi) {
          var v = Math.round((h.bySubject && h.bySubject[k]) || 0);
          return '<td>' + v + '</td>';
        }).join('') + '</tr>';
      }).join('');
      tbl.innerHTML = html;
    }
  }

  /* ---------- week ---------- */
  function drawWeek() {
    var el = $('weekChart'); if (!el) return;
    var hist = (model && model.history) || [];
    var byDay = {};
    hist.forEach(function (h) { byDay[h.day] = h.bySubject || {}; });
    // ISO-week (Ma–So) wat model.day bevat
    var d0 = dayMs(model.day);
    var dow = (new Date(d0 + 12 * 3600000).getUTCDay() + 6) % 7; // Ma=0
    var mon = d0 - dow * 86400000;
    var days = [];
    for (var i = 0; i < 7; i++) {
      var d = new Date(mon + i * 86400000 + 12 * 3600000);
      var ds = d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
      days.push(ds);
    }
    var keys = heatRows();
    var WD = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Sa', 'So'];
    var t = $('week-title');
    if (t) t.textContent = 'Week ' + fmtDM(mon + 12 * 3600000) + ' – ' + fmtDM(mon + 6 * 86400000 + 12 * 3600000);
    setOpt('weekChart', Object.assign(base(), {
      grid: { left: 40, right: 10, top: 30, bottom: 26 },
      legend: { top: 0, type: 'scroll', textStyle: { color: css('--muted'), fontSize: 11 }, itemWidth: 10, itemHeight: 8 },
      tooltip: Object.assign(tt(), { trigger: 'axis' }),
      xAxis: {
        type: 'category', data: WD,
        axisLabel: { color: css('--muted') },
        axisLine: { lineStyle: { color: css('--line2') } }, axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: css('--muted'), formatter: '{value}' },
        splitLine: { lineStyle: { color: css('--line') } }
      },
      series: keys.map(function (k, i) {
        return {
          name: subjName(k), type: 'bar', stack: 't', barWidth: '52%',
          data: days.map(function (ds) { return Math.round((byDay[ds] && byDay[ds][k]) || 0); }),
          itemStyle: { color: css(subjVar(k)), borderRadius: i === keys.length - 1 ? [5, 5, 0, 0] : 0 },
          animationDelay: function (j) { return reduced ? 0 : j * 90 + i * 40; }
        };
      })
    }));
  }

  /* Teken net oor as die onderliggende data verander het (of force: tema/beweging/grootte), sodat
     elke 15 s-peiling nie al vier grafieke se animasies op 'n foon herspeel nie. */
  var chartSig = '', chartGen = 0;
  function drawCharts(force) {
    if (!window.echarts || !model) return;
    var c = model.current, mn = function (v) { return Math.round((v || 0) / 60000); };
    var sig = JSON.stringify([model.day, model.blocks, (model.sessions || []).map(function (x) { return [x.sessionId, x.startedAt, x.endedAt, x.minutes]; }),
      model.history, c ? [c.startedAt, mn(c.focusedMs), mn(c.visibleMs), mn(c.hiddenMs), mn(c.idleMs)] : null,
      model.isToday ? Math.floor(PK.data.serverNow() / 60000) : 0]);
    if (!force && sig === chartSig) return;
    chartSig = sig;
    /* Elke grafiek in sy eie taak: geen lang blokkering van die hoofdraad op stadige fone nie */
    var gen = ++chartGen;
    [drawRing, drawGantt, drawHeat, drawWeek].forEach(function (fn, i) {
      setTimeout(function () { if (gen === chartGen) { try { fn(); } catch (e) {} } }, i * 30);
    });
  }

  /* ---------- held ---------- */
  function heroState() {
    if (!model) return { s: 'off', text: 'LAAI…' };
    if (!model.isToday) return { s: 'off', text: 'Geskiedenis · ' + fmtWDM(dayMs(model.day) + 12 * 3600000) };
    var c = model.current;
    if (!c) return { s: 'off', text: 'AF — geen aktiewe sessie' };
    var now = PK.data.serverNow();
    if (now - c.lastSeen > 150000) return { s: 'lost', text: 'SEIN WEG' };
    if (c.status === 'locked') return { s: 'lock', text: 'SLOT — tyd gepouseer' };
    if (c.status === 'warned') return { s: 'warn', text: 'WAARSKUWING' };
    return { s: 'on', text: 'IN SESSIE' };
  }
  function chip(cls, txt) { return '<span class="chip ' + cls + '"><i></i>' + esc(txt) + '</span>'; }
  function renderHero() {
    if (!model) return;
    var st = heroState();
    var hero = $('hero');
    if (hero) hero.dataset.s = st.s;
    var stEl = $('status-text'); if (stEl) stEl.textContent = st.text;
    var c = model.current;
    var now = PK.data.serverNow();
    var chips = [];
    var what = $('what-text');

    if (model.isToday && c) {
      if (st.s === 'lost') {
        chips.push(chip('lock', 'Geen hartklop sedert ' + fmtHM(c.lastSeen)));
      } else {
        if (c.visible === true) chips.push(chip('ok', 'Oortjie sigbaar'));
        else if (c.visible === false) chips.push(chip('lock', 'Oortjie VERSTEEK'));
        if (c.focused === false) chips.push(chip('warn', 'Ander venster in fokus'));
        else if (c.focused === true) chips.push(chip('ok', 'Gefokus'));
        if (c.idle === true) chips.push(chip('warn', 'Ledig'));
        else if (c.idle === false) chips.push(chip('ok', 'Nie ledig'));
      }
      if (what) {
        var blk = c.block;
        var parts = [];
        if (blk && blk.start && blk.end) parts.push('blok ' + blk.start + '–' + blk.end);
        if (blk && blk.title) parts.push(blk.title);
        if (c.task && (!blk || c.task !== blk.title)) parts.push(c.task);
        var blkTxt = parts.length ? parts.join(' · ') : 'eie sessie';
        what.innerHTML = '<b>' + esc(subjName(c.subjectKey, c.subject)) + '</b> · <span class="muted">' + esc(blkTxt) + '</span>';
      }
    } else if (model.isToday && !c) {
      if (model.lastSession) {
        var end = model.lastSession.endedAt || model.lastSession.lastSeen;
        chips.push(chip('off', 'Laaste sessie ' + fmtHM(end) + ' klaar'));
      }
      var nxt = null;
      (model.blocks || []).forEach(function (b) {
        if (nxt || !b.start) return;
        var bs = hmToMs(model.day, b.start);
        if (bs != null && bs > now && (b.status === 'planned')) nxt = b;
      });
      if (nxt) chips.push(chip('off', 'Volgende blok ' + nxt.start + ' ' + subjName(nxt.subjectKey, nxt.subject)));
      if (what) what.innerHTML = '<span class="muted">Wallie is nie nou in ’n sessie nie.</span>';
    } else {
      if (what) what.innerHTML = '<span class="muted">' + esc(fmtWDM(dayMs(model.day) + 12 * 3600000)) + ' · geen lewendige data nie.</span>';
    }
    var ch = $('chips'); if (ch) ch.innerHTML = chips.join('');

    // tyders
    var tE = $('t-elapsed'), tL = $('t-left'), tS = $('t-seen');
    var bbF = $('bb-fill'), bbL = $('bb-label'), bbC = $('bb-counts');
    if (model.isToday && c) {
      var el = now - c.startedAt;
      if (tE) tE.textContent = mmss(el);
      if (c.status === 'locked') {
        if (tL) tL.textContent = c.leftMs != null ? mmss(c.leftMs) + ' ⏸' : '—';
      } else {
        if (tL) tL.textContent = c.leftMs != null ? mmss(Math.max(0, c.leftMs - Math.max(0, now - c.lastSeen))) : '—';
      }
      if (tS) tS.textContent = ageText(now - c.lastSeen);
      var planMin = (c.block && c.block.minutes) || c.plannedMin || 0;
      if (bbF) bbF.style.width = planMin > 0 ? Math.min(100, el / (planMin * 600)) + '%' : '0%';
      if (bbL) bbL.textContent = planMin > 0 ? Math.floor(el / 60000) + ' van ' + planMin + ' min' : 'Geen blok aan die gang';
      if (bbC) bbC.textContent = (c.warnings || 0) + ' waarskuwings · ' + (c.locks || 0) + ' slotte';
      if (c.lastSeen > lastBeatSeen) {
        lastBeatSeen = c.lastSeen;
        var h = $('heart');
        if (h && !reduced) { h.classList.remove('beat'); void h.offsetWidth; h.classList.add('beat'); }
      }
    } else {
      if (tE) tE.textContent = '—';
      if (tL) tL.textContent = '—';
      if (tS) tS.textContent = '—';
      if (bbF) bbF.style.width = '0%';
      if (bbL) bbL.textContent = 'Geen blok aan die gang';
      if (bbC) bbC.textContent = '—';
    }
  }

  /* ---------- KPI ---------- */
  function setKpi(id, key, to) {
    var el = $(id); if (!el) return;
    to = Math.round(to || 0);
    if (kpiVals[key] === to) return;
    var from = kpiVals[key] == null ? 0 : kpiVals[key];
    kpiVals[key] = to;
    if (reduced || !window.Motion || from === to) { el.textContent = to; return; }
    try {
      Motion.animate(from, to, { duration: 1.2, ease: [0.16, 1, 0.3, 1], onUpdate: function (v) { el.textContent = Math.round(v); } });
    } catch (e) { el.textContent = to; }
  }
  function renderKpis() {
    if (!model) return;
    var t = model.totals || {};
    setKpi('k-min', 'min', t.studiedMin);
    setKpi('k-done', 'done', t.blocksDone);
    setKpi('k-sess', 'sess', t.sessions);
    setKpi('k-warn', 'warn', t.warnings);
    setKpi('k-locks', 'locks', t.locks);
    var of = $('k-done-of'); if (of) of.textContent = 'van ' + (t.blocksTotal || 0);
  }

  /* ---------- eksamens ---------- */
  function examList() {
    var now = PK.data.serverNow();
    var ex = (PK.EXAMS || []).map(function (e) {
      var at = typeof e.at === 'number' ? e.at : Date.parse(e.at);
      return { e: e, at: at };
    }).filter(function (x) { return x.at > now; }).sort(function (a, b) { return a.at - b.at; });
    return ex;
  }
  function examMeta(e) {
    var key = e.s || (PK.subjectKey ? PK.subjectKey(e.n, e.slug || '') : 'ander');
    return { key: key, name: e.n || e.name || subjName(key), dur: e.dur || e.minutes || null };
  }
  function renderExams(first) {
    var up = examList();
    var nx = up[0];
    var nn = $('next-name');
    if (nx) {
      var meta = examMeta(nx.e);
      if (nn) nn.textContent = meta.name + ' · ' + fmtWDM(nx.at) + ' ' + fmtHM(nx.at);
      var s = Math.max(0, Math.floor((nx.at - PK.data.serverNow()) / 1000));
      var vals = [
        String(Math.floor(s / 86400)),
        String(Math.floor((s % 86400) / 3600)).padStart(2, '0'),
        String(Math.floor((s % 3600) / 60)).padStart(2, '0'),
        String(s % 60).padStart(2, '0')
      ];
      ['cd-d', 'cd-h', 'cd-m', 'cd-s'].forEach(function (id, i) {
        var el = $(id); if (!el) return;
        if (el.textContent !== vals[i]) {
          el.textContent = vals[i];
          if (!reduced) { el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick'); }
        }
      });
    } else if (nn) { nn.textContent = 'Geen vraestelle meer op die rooster nie'; }
    if (first) {
      var ul = $('exam-list');
      if (ul) {
        ul.innerHTML = up.map(function (x) {
          var meta = examMeta(x.e);
          var todayStr = new Date(PK.data.serverNow()).toLocaleDateString('en-CA', { timeZone: TZ });
          var exDay = new Date(x.at).toLocaleDateString('en-CA', { timeZone: TZ });
          var dd = Math.round((dayMs(exDay) - dayMs(todayStr)) / 86400000);
          var days = dd <= 0 ? 'vandag' : dd === 1 ? 'môre' : dd + ' dae';
          var dur = meta.dur ? ' · ' + (typeof meta.dur === 'number' ? meta.dur + ' min' : meta.dur) : '';
          return '<li><i style="background:var(' + esc(subjVar(meta.key)) + ')"></i><div>' + esc(meta.name) +
            '<small>' + esc(fmtWDM(x.at)) + ' · ' + esc(fmtHM(x.at)) + esc(dur) + '</small></div><b>' + esc(days) + '</b></li>';
        }).join('') || '<li><div>Geen vraestelle meer nie.</div></li>';
      }
    }
  }

  /* ---------- voer ---------- */
  function renderFeed() {
    var ul = $('feed'); if (!ul) return;
    var items = ((model && model.feed) || []).filter(function (x) {
      return filter === 'all' || x.kind === filter;
    }).slice(0, 20);
    if (!items.length) {
      ul.innerHTML = '<li><div><b>Nog niks op hierdie dag nie.</b></div></li>';
      feedFirst = false;
      return;
    }
    var seenNow = {};
    ul.innerHTML = items.map(function (x) {
      var key = x.kind + '|' + x.title + '|' + x.at;
      seenNow[key] = true;
      var isNew = !feedFirst && !feedSeen[key];
      return '<li class="' + (isNew ? 'new' : '') + '"><span class="ic ' + esc(x.kind) + '" aria-hidden="true">' + esc(x.icon) + '</span>' +
        '<div><b>' + esc(x.title) + '</b><p>' + esc(x.body || '') + '</p></div><time>' + esc(fmtHM(x.at)) + '</time></li>';
    }).join('');
    feedSeen = seenNow;
    feedFirst = false;
  }

  /* ---------- kamera-strook ---------- */
  function renderStrip() {
    var el = $('strip'); if (!el) return;
    var stills = (model && model.stills) || [];
    var key = stills.map(function (s) { return s.id; }).join(',');
    if (key === stripKey) return;
    stripKey = key;
    if (!stills.length) {
      el.innerHTML = '<p class="empty">Nog geen foto’s nie.</p>';
      return;
    }
    el.innerHTML = stills.map(function (s, i) {
      var src = s.src || stillCache[s.id];
      var img = src && src !== 'loading'
        ? '<img loading="lazy" src="' + esc(src) + '" alt="Kamera-foto om ' + esc(fmtHM(s.at)) + '"/>'
        : '<img loading="lazy" alt="Kamera-foto om ' + esc(fmtHM(s.at)) + '"/>';
      return '<button type="button" class="' + (i === 0 ? 'live' : '') + '" data-id="' + esc(s.id) + '" data-cap="' + esc(fmtHM(s.at)) + ' · kamera-foto">' +
        img + '<span>' + (i === 0 ? '● Nuutste · ' : '') + esc(fmtHM(s.at)) + '</span></button>';
    }).join('');
    // laai eerste 8 lui, een vir een
    var queue = stills.slice(0, 8).filter(function (s) { return !s.src && !stillCache[s.id]; });
    var gen = ++stripGen;
    (function next() {
      if (gen !== stripGen) return; /* dag verander: ou tou laat vaar */
      var s = queue.shift();
      if (!s) return;
      stillCache[s.id] = 'loading';
      PK.data.loadStill(s.id).then(function (url) {
        if (url) {
          stillCache[s.id] = url;
          var btn = thumbFor(el, s.id);
          if (btn) btn.src = url;
        } else { delete stillCache[s.id]; }
        next();
      });
    })();
  }
  var stripGen = 0, beatSig = '';
  function thumbFor(el, id) {
    var bs = el.querySelectorAll('button[data-id]');
    for (var i = 0; i < bs.length; i++) if (bs[i].getAttribute('data-id') === String(id)) return bs[i].querySelector('img');
    return null;
  }
  function wireStrip() {
    var el = $('strip'); if (!el) return;
    el.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var id = b.getAttribute('data-id');
      var cap = b.getAttribute('data-cap') || '';
      var dlg = $('lightbox'), img = $('lb-img'), cp = $('lb-cap');
      if (!dlg || !img) return;
      function show(src) {
        if (src) img.src = src; else img.src = 'data:,'; /* nooit die vorige foto met 'n nuwe onderskrif nie */
        img.alt = cap;
        if (cp) cp.textContent = cap;
        try { dlg.showModal(); } catch (err) {}
      }
      var cached = stillCache[id];
      if (cached && cached !== 'loading') { show(cached); return; }
      var s = ((model && model.stills) || []).filter(function (x) { return String(x.id) === String(id); })[0];
      if (s && s.src) { show(s.src); return; }
      show(null);
      PK.data.loadStill(isFinite(Number(id)) ? Number(id) : id).then(function (url) {
        if (url) {
          stillCache[id] = url;
          img.src = url;
          var thumb = thumbFor(el, id);
          if (thumb) thumb.src = url;
        }
      });
    });
  }

  /* ---------- stelsel ---------- */
  function renderSync() {
    if (!model) return;
    var now = PK.data.serverNow();
    var c = model.current;
    var lost = model.isToday && c && (now - c.lastSeen > 150000);
    var ht = $('health-text');
    if (ht) {
      if (conn && !conn.ok) { ht.textContent = 'Geen verbinding'; ht.style.color = css('--lock'); }
      else if (lost) { ht.textContent = 'Sein weg — geen hartklop'; ht.style.color = css('--lock'); }
      else { ht.textContent = 'Alles gesond'; ht.style.color = css('--ok'); }
    }
    // hartklop
    var beats = (model.beats || []).slice(-30);
    var bEl = $('beats');
    var bSig = beats.map(function (b) { return b.at + (b.ok ? '+' : '-'); }).join(',');
    if (bEl && bSig !== beatSig) {
      beatSig = bSig;
      bEl.innerHTML = beats.map(function (b, i) {
        return '<i class="' + (b.ok ? 'ok' : 'miss') + (i === beats.length - 1 ? ' fresh' : '') + '" title="' + (b.ok ? 'ontvang' : 'gemis') + '"></i>';
      }).join('');
    }
    var d = model.device;
    var ks = $('kv-sync');
    if (ks) ks.textContent = d && d.lastSyncAt ? ageText(now - d.lastSyncAt) + ' gelede' : '—';
    var kv = $('kv-ver'); if (kv) kv.textContent = d && d.appVersion ? d.appVersion : '—';
    var ke = $('kv-ev'); if (ke) ke.textContent = d && d.eventsReceived != null ? String(d.eventsReceived) : '—';
    var kp = $('kv-plan'); if (kp) kp.textContent = model.planReceived ? 'Ontvang' : 'Nog nie ontvang nie';
    var cn = $('conn'); if (cn) cn.textContent = conn ? (conn.text || '') : '';
  }
  function pollTick() {
    if (!conn || !conn.nextPollAt || !conn.intervalMs) return;
    var now = Date.now();
    var left = Math.max(0, Math.round((conn.nextPollAt - now) / 1000));
    var ps = $('poll-s'); if (ps) ps.textContent = left;
    var p = 1 - Math.max(0, Math.min(1, (conn.nextPollAt - now) / conn.intervalMs));
    var pe = $('poll'); if (pe) pe.style.setProperty('--p', p);
  }

  /* ---------- dag-titel ---------- */
  function renderDayTitle() {
    if (!model) return;
    var t = $('plan-title'); if (!t) return;
    if (model.isToday) t.textContent = 'Vandag — rooster teenoor werklikheid';
    else t.textContent = fmtWDM(dayMs(model.day) + 12 * 3600000) + ' — rooster teenoor werklikheid';
  }

  /* ---------- in-gly ---------- */
  function entrance() {
    if (entered || reduced || !window.Motion) return;
    entered = true;
    try {
      var M = window.Motion, ease = [0.16, 1, 0.3, 1];
      var cards = Array.prototype.slice.call(document.querySelectorAll('main > .card'));
      var vh = innerHeight;
      var first = cards.filter(function (c) { return c.getBoundingClientRect().top < vh; });
      /* Bo-aan: net 'n effense gly, geen deursigtigheid nie, sodat die status dadelik leesbaar is (LCP) */
      M.animate(first, { transform: ['translateY(10px)', 'translateY(0)'] }, { duration: 0.45, delay: M.stagger(0.05), ease: ease });
      cards.filter(function (c) { return first.indexOf(c) < 0; }).forEach(function (c) {
        M.inView(c, function () {
          M.animate(c, { opacity: [0, 1], transform: ['translateY(18px)', 'translateY(0)'] }, { duration: 0.5, ease: ease });
        }, { amount: 0.15 });
      });
    } catch (e) {}
  }

  /* ---------- model-render ---------- */
  function onModel(m) {
    model = m;
    if (window.PK) PK.ui = PK.ui || {}, PK.ui.lastModel = m;
    renderDayTitle();
    renderHero();
    /* Die res in 'n volgende taak: die status is eerste sigbaar en die hoofdraad blokkeer nie lank op 'n foon nie */
    var gen = ++modelGen;
    setTimeout(function () {
      if (gen !== modelGen) return;
      try { renderKpis(); renderFeed(); renderStrip(); renderSync(); renderAgenda(); } catch (e) {}
      setTimeout(function () {
        if (gen !== modelGen) return;
        try { renderExams(true); entrance(); } catch (e) {}
        drawCharts();
      }, 0);
    }, 0);
  }
  var modelGen = 0;
  function onConn(info) {
    conn = info;
    renderSync();
    pollTick();
  }
  function onAuthLost() {
    try { PK.data.stop(); } catch (e) {}
    showLogin('Sessie het verval — teken weer in.');
  }

  /* ---------- aansigte ---------- */
  function showLogin(msg) {
    var lv = $('login-view'), cv = $('console-view');
    if (cv) cv.hidden = true;
    if (lv) lv.hidden = false;
    if (msg) { var e = $('login-err'); if (e) e.textContent = msg; }
    stopTicker();
  }
  function showConsole() {
    var lv = $('login-view'), cv = $('console-view');
    if (lv) lv.hidden = true;
    if (cv) cv.hidden = false;
    startTicker();
  }

  /* ---------- 1 s-tikker ---------- */
  function tick() {
    if (document.hidden) return;
    renderHero();
    renderExams(false);
    pollTick();
    renderSync();
  }
  function startTicker() {
    stopTicker();
    tickTimer = setInterval(tick, 1000);
  }
  function stopTicker() {
    if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
  }

  /* ---------- vorms ---------- */
  function wireForms() {
    var lf = $('login-form');
    if (lf) lf.addEventListener('submit', function (e) {
      e.preventDefault();
      var err = $('login-err'); if (err) err.textContent = '';
      var pw = $('login-pass');
      var btn = lf.querySelector('button'); if (btn) { if (btn.disabled) return; btn.disabled = true; }
      PK.data.login(pw ? pw.value : '').then(function (r) {
        if (btn) btn.disabled = false;
        if (r && r.ok) { if (pw) pw.value = ''; showConsole(); PK.data.start({ onModel: onModel, onAuthLost: onAuthLost, onConn: onConn }); }
        else if (err) err.textContent = PK.data.errorText(r && r.error);
      });
    });
    var sc = $('show-claim');
    if (sc) sc.addEventListener('click', function () {
      var f = $('claim-form'); if (f) f.hidden = !f.hidden;
    });
    var cf = $('claim-form');
    if (cf) cf.addEventListener('submit', function (e) {
      e.preventDefault();
      var err = $('claim-err'); if (err) err.textContent = '';
      var p1 = $('claim-pass'), p2 = $('claim-pass2'), code = $('claim-code');
      if (p1 && p2 && p1.value !== p2.value) {
        if (err) err.textContent = 'Wagwoorde stem nie ooreen nie.';
        return;
      }
      var cbtn = cf.querySelector('button'); if (cbtn) { if (cbtn.disabled) return; cbtn.disabled = true; }
      PK.data.claim(code ? code.value : '', p1 ? p1.value : '').then(function (r) {
        if (cbtn) cbtn.disabled = false;
        if (r && r.ok) { cf.reset(); showConsole(); PK.data.start({ onModel: onModel, onAuthLost: onAuthLost, onConn: onConn }); }
        else if (err) err.textContent = PK.data.errorText(r && r.error);
      });
    });
    var lo = $('logout');
    if (lo) lo.addEventListener('click', function () {
      PK.data.logout();
      if (PK.data.stop) PK.data.stop();
      showLogin('');
    });
    var shc = $('show-change');
    if (shc) shc.addEventListener('click', function () {
      var f = $('change-form'); if (f) f.hidden = !f.hidden;
    });
    var chf = $('change-form');
    if (chf) chf.addEventListener('submit', function (e) {
      e.preventDefault();
      var err = $('change-err'); if (err) err.textContent = '';
      var np = $('new-pass');
      PK.data.changePassword(np ? np.value : '').then(function (r) {
        if (r && r.ok) { if (err) err.textContent = 'Gestoor.'; if (np) np.value = ''; }
        else if (err) err.textContent = PK.data.errorText(r && r.error);
      });
    });
  }

  /* ---------- dag-kieser ---------- */
  function wireDayPick() {
    var dp = $('day-pick'); if (!dp) return;
    var today = new Date().toLocaleDateString('en-CA', { timeZone: TZ });
    dp.value = today;
    dp.max = today;
    dp.addEventListener('change', function () {
      var v = dp.value;
      PK.data.setDay(!v || v === today ? null : v);
    });
  }

  /* ---------- demo ---------- */
  function wireDemo() {
    if (!window.PK || !PK.data || PK.data.mode !== 'demo') return;
    ['demo-badge', 'demo-note', 'demo-switch'].forEach(function (id) {
      var el = $(id); if (el) el.hidden = false;
    });
    var sb = $('state-btns');
    if (sb) sb.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (PK.data.setDemoState) PK.data.setDemoState(b.getAttribute('data-s'));
      Array.prototype.forEach.call(sb.querySelectorAll('button'), function (x) {
        x.setAttribute('aria-pressed', String(x === b));
      });
    });
  }

  /* ---------- filters ---------- */
  function wireFilters() {
    var f = $('filters'); if (!f) return;
    f.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      filter = b.getAttribute('data-f') || 'all';
      Array.prototype.forEach.call(f.querySelectorAll('button'), function (x) {
        x.setAttribute('aria-pressed', String(x === b));
      });
      renderFeed();
    });
  }

  /* ---------- begin ---------- */
  function boot() {
    applyMotion();
    applyTheme();
    var tb = $('themeBtn');
    if (tb) tb.addEventListener('click', function () {
      mode = modes[(modes.indexOf(mode) + 1) % 3];
      applyTheme();
    });
    if (dm.addEventListener) dm.addEventListener('change', function () { if (mode === 'auto') applyTheme(); });
    var mb = $('motionBtn');
    /* Net Pa se eie keuse word onthou; anders volg die bladsy die toestel se "verminder beweging" */
    if (mb) mb.addEventListener('click', function () {
      reduced = !reduced;
      try { localStorage.setItem(LS_RM, reduced ? '1' : '0'); } catch (e) {}
      applyMotion();
    });
    if (mq.addEventListener) mq.addEventListener('change', function () {
      try { if (localStorage.getItem(LS_RM) != null) return; } catch (e) {}
      reduced = mq.matches; applyMotion();
    });

    if (!window.echarts) {
      var ej = $('echarts-js');
      if (ej) ej.addEventListener('load', function () { drawCharts(true); });
    }
    wireForms();
    wireDayPick();
    wireDemo();
    wireFilters();
    wireStrip();

    var rz;
    addEventListener('resize', function () {
      clearTimeout(rz);
      rz = setTimeout(function () {
        Object.keys(charts).forEach(function (k) { try { charts[k].resize(); } catch (e) {} });
        drawCharts(true);
      }, 150);
    });
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) tick();
    });

    if (!window.PK || !PK.data) { showLogin('Kon nie laai nie — herlaai die bladsy.'); return; }
    if (PK.data.hasToken()) {
      showConsole();
      PK.data.start({ onModel: onModel, onAuthLost: onAuthLost, onConn: onConn });
    } else {
      showLogin('');
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
