/* Sinkronisering na Pa se konsole (Supabase), met ’n vanlyn-tou in localStorage.

   - Elke gebeurtenis kry ’n vaste event_id (bv. "end:s_1791…") sodat herstuur en terugvul nooit dubbel tel nie.
   - Stuur eers via wallie_ingest_v2 (migrations/001). Bestaan dit nog nie op die bediener nie (PGRST202 / 404),
     val terug na die bestaande wallie_ingest. Soorte wat die ou funksie nie ken nie, wag in die tou ("geparkeer")
     tot die migrasie toegepas is — hulle gaan nie verlore nie en hou nie ander gebeure terug nie.
   - Een slegte gebeurtenis blokkeer nooit die res nie (geen "head-of-line" meer nie); elke versoek het ’n tydlimiet.
   - Terugvul: alle historiese sessies, surveys en probleme in wallie911_v2_bok (ou en nuwe weergawes deel die sleutel)
     word by elke laai nagegaan en wat nog nie gestuur is nie, word in die tou gesit.
   - As sinkronisering langer as 10 min misluk, kry Pa ’n ntfy-waarskuwing. */
window.WALLIE = window.WALLIE || {};

WALLIE.APP_VERSION = "2026-10-09-sync1";

WALLIE.SYNC = {
  key: "wallie911_sync_v2",
  ledgerKey: "wallie911_synced_ids_v1",
  legacyOutboxKey: "wallie911_outbox_v1",
  deviceKey: "wallie911_device_id",
  lockKey: "wallie911_sync_lock",
  /* Die eerste Supabase-weergawe het op 8 Okt 2026 19:51 SAST live gegaan. Items van daarna kon reeds
     via wallie_ingest aangekom het; die ou funksie kan nie ontdubbel nie, dus wag hulle vir v2. */
  v1LiveSince: Date.parse("2026-10-08T17:51:00Z"),
  v1Kinds: ["start", "heartbeat", "warn", "lock", "unlock", "memo", "end", "survey", "pa-survey", "probleem", "offline"],
  alertAfterMs: 10 * 60 * 1000,
  redAfterMs: 60 * 1000,
  tickMs: 20000,
  requestTimeoutMs: 15000,
  v2RecheckMs: 30 * 60 * 1000,
  heartbeatStaleForV1Ms: 2 * 60 * 1000,
  maxHeartbeats: 1500,
  maxQueue: 6000,
  maxLedger: 8000,
  deadRetryMs: 6 * 60 * 60 * 1000,
  _timer: null,
  _flushing: null,
  _tabId: Math.random().toString(36).slice(2),
  onStatus: null,

  /* ---------- berging ---------- */

  empty() {
    return {
      queue: [],
      sentCount: 0,
      lastOkAt: null,
      lastAttemptAt: null,
      lastError: null,
      failingSince: null,
      alertFor: null,
      outageSince: null,
      serverV2: null,
      v2CheckedAt: 0,
      planServer: null,
      planCheckedAt: 0,
      plansSyncedFor: null,
      backfilledAt: null,
      legacyMigrated: false
    };
  },

  load() {
    try {
      return { ...this.empty(), ...JSON.parse(localStorage.getItem(this.key) || "{}") };
    } catch {
      return this.empty();
    }
  },

  save(box) {
    try {
      localStorage.setItem(this.key, JSON.stringify(box));
      return true;
    } catch {
      /* Kwota vol: gooi eers ou hartklop-items weg, dan probeer weer */
      box.queue = box.queue.filter((q) => q.kind !== "heartbeat").concat(
        box.queue.filter((q) => q.kind === "heartbeat").slice(-100)
      );
      try {
        localStorage.setItem(this.key, JSON.stringify(box));
        return true;
      } catch {
        return false;
      }
    }
  },

  update(mutator) {
    const box = this.load();
    mutator(box);
    this.save(box);
    return box;
  },

  ledger() {
    try {
      return JSON.parse(localStorage.getItem(this.ledgerKey) || "{}");
    } catch {
      return {};
    }
  },

  markSynced(ids) {
    if (!ids.length) return;
    const led = this.ledger();
    ids.forEach((id) => (led[id] = Date.now()));
    let keys = Object.keys(led);
    if (keys.length > this.maxLedger) {
      keys.sort((a, b) => led[a] - led[b]);
      keys.slice(0, keys.length - this.maxLedger).forEach((k) => delete led[k]);
    }
    try {
      localStorage.setItem(this.ledgerKey, JSON.stringify(led));
    } catch {}
  },

  deviceId() {
    try {
      let id = localStorage.getItem(this.deviceKey);
      if (!id) {
        id = "d_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        localStorage.setItem(this.deviceKey, id);
      }
      return id;
    } catch {
      return "d_onbekend";
    }
  },

  /* ---------- in die tou ---------- */

  /* payload: velde vir wallie_ingest (kind, session_id, title, body, data, …). opts.backfill / opts.entityAt vir terugvul. */
  enqueue(eventId, payload, opts = {}) {
    if (!eventId || !payload?.kind) return null;
    if (payload.kind !== "heartbeat" && this.ledger()[eventId]) return null;
    const now = Date.now();
    const item = {
      id: eventId,
      kind: payload.kind,
      payload: {
        ...payload,
        event_id: eventId,
        client_at: payload.client_at || now,
        device_id: this.deviceId(),
        app_version: WALLIE.APP_VERSION,
        backfill: Boolean(opts.backfill)
      },
      backfill: Boolean(opts.backfill),
      entityAt: opts.entityAt || now,
      createdAt: now,
      tries: 0,
      nextTryAt: 0
    };
    let added = false;
    this.update((box) => {
      if (box.queue.some((q) => q.id === eventId)) return;
      box.queue.push(item);
      added = true;
      this.trim(box);
    });
    if (added) {
      this.notify();
      if (!opts.noFlush) this.flush();
    }
    return added ? eventId : null;
  },

  trim(box) {
    const hb = box.queue.filter((q) => q.kind === "heartbeat");
    if (hb.length > this.maxHeartbeats) {
      const drop = new Set(hb.slice(0, hb.length - this.maxHeartbeats).map((q) => q.id));
      box.queue = box.queue.filter((q) => !drop.has(q.id));
    }
    if (box.queue.length > this.maxQueue) {
      /* Laaste uitweg — hou nie-hartklop-items so lank as moontlik */
      const rest = box.queue.filter((q) => q.kind === "heartbeat");
      const keep = box.queue.filter((q) => q.kind !== "heartbeat");
      box.queue = keep.concat(rest).slice(0, this.maxQueue);
    }
  },

  /* ---------- stuur ---------- */

  async rpc(name, args) {
    if (!WALLIE.LIVE) return { ok: false, transient: true, error: "live-config.js ontbreek" };
    return WALLIE.LIVE.rpc(name, args, { timeoutMs: this.requestTimeoutMs });
  },

  v1Payload(item) {
    const p = { ...item.payload };
    /* v1 stoor net title/body/data; sit event_id in data sodat die migrasie dit later kan herwin */
    const d = p.data;
    p.data = d && typeof d === "object" && !Array.isArray(d) ? { ...d, _event_id: item.id } : { value: d ?? null, _event_id: item.id };
    return p;
  },

  /* Gee terug: "sent" | "parked" | "dead" | "retry" */
  async sendItem(item, box) {
    const now = Date.now();
    /* Rooster (migrations/002): eie funksie; bestaan dit nog nie, wag dit geparkeer */
    if (item.kind === "plan") {
      if (box.planServer === false && now - (box.planCheckedAt || 0) < this.v2RecheckMs) {
        return { result: "parked", error: "wag vir bediener-opgradering (002)" };
      }
      const pr = await this.rpc("wallie_ingest_plan", { p: item.payload });
      box.planCheckedAt = now;
      if (pr.ok) {
        box.planServer = true;
        return { result: "sent" };
      }
      if (pr.missingFunction) {
        box.planServer = false;
        return { result: "parked", error: "wag vir bediener-opgradering (002)" };
      }
      return pr.transient ? { result: "retry", error: pr.error } : { result: "dead", error: pr.error };
    }
    const tryV2 = box.serverV2 !== false || now - (box.v2CheckedAt || 0) > this.v2RecheckMs;
    if (tryV2) {
      const res = await this.rpc("wallie_ingest_v2", { p: item.payload });
      if (res.ok) {
        box.serverV2 = true;
        box.v2CheckedAt = now;
        return { result: "sent" };
      }
      if (res.missingFunction) {
        box.serverV2 = false;
        box.v2CheckedAt = now;
      } else if (res.transient) {
        return { result: "retry", error: res.error };
      } else {
        return { result: "dead", error: res.error };
      }
    }
    /* Ou bediener (wallie_ingest) */
    if (!this.v1Kinds.includes(item.kind)) return { result: "parked", error: "wag vir bediener-opgradering (v2)" };
    if (item.backfill && item.entityAt >= this.v1LiveSince) {
      return { result: "parked", error: "wag vir v2 (ontdubbeling)" };
    }
    if (item.kind === "heartbeat" && now - item.payload.client_at > this.heartbeatStaleForV1Ms) {
      /* v1 sit last_seen = now(): ’n ou hartklop sou ’n klaar sessie lewendig laat lyk */
      return { result: "drop" };
    }
    const res = await this.rpc("wallie_ingest", { p: this.v1Payload(item) });
    if (res.ok) return { result: "sent" };
    if (res.error === "bad kind") return { result: "parked", error: "wag vir bediener-opgradering (v2)" };
    if (res.transient) return { result: "retry", error: res.error };
    return { result: "dead", error: res.error };
  },

  priority(q) {
    if (q.backfill) return 2;
    if (q.kind === "heartbeat") return 1;
    return 0;
  },

  holdLock() {
    try {
      const raw = JSON.parse(localStorage.getItem(this.lockKey) || "null");
      if (raw && raw.tab !== this._tabId && raw.until > Date.now()) return false;
      localStorage.setItem(this.lockKey, JSON.stringify({ tab: this._tabId, until: Date.now() + 45000 }));
      return true;
    } catch {
      return true;
    }
  },

  releaseLock() {
    try {
      const raw = JSON.parse(localStorage.getItem(this.lockKey) || "null");
      if (raw && raw.tab === this._tabId) localStorage.removeItem(this.lockKey);
    } catch {}
  },

  flush() {
    if (this._flushing) {
      this._again = true;
      return this._flushing;
    }
    this._flushing = this._flush().finally(() => {
      this._flushing = null;
      this.releaseLock();
      if (this._again) {
        this._again = false;
        this.flush();
      }
    });
    return this._flushing;
  },

  async _flush() {
    if (!this.holdLock()) return;
    const now = Date.now();
    /* Ou bediener: ou hartkloppe is waardeloos (en gevaarlik) — gooi hulle dadelik weg, ook tydens backoff */
    if (this.load().serverV2 === false) {
      this.update((b) => {
        b.queue = b.queue.filter((q) => q.kind !== "heartbeat" || now - q.payload.client_at <= this.heartbeatStaleForV1Ms);
      });
    }
    const box = this.load();
    const due = box.queue
      .filter((q) => (q.nextTryAt || 0) <= now)
      .sort((a, b) => this.priority(a) - this.priority(b) || a.payload.client_at - b.payload.client_at);
    if (!due.length) {
      this.checkAlert(box);
      return;
    }
    const sent = [];
    const outcome = {};
    for (const item of due) {
      box.lastAttemptAt = Date.now();
      let r;
      try {
        r = await this.sendItem(item, box);
      } catch (e) {
        r = { result: "retry", error: e.message || "onbekend" };
      }
      outcome[item.id] = r;
      if (r.result === "sent") {
        sent.push(item.id);
        box.sentCount = (box.sentCount || 0) + 1;
        box.lastOkAt = Date.now();
        box.lastError = null;
        box.failingSince = null;
      } else if (r.result === "retry") {
        box.lastError = r.error;
        if (!box.failingSince) box.failingSince = Date.now();
        /* Netwerk is af — moenie die res nou probeer nie, maar hulle bly in die tou */
        break;
      }
      try {
        localStorage.setItem(this.lockKey, JSON.stringify({ tab: this._tabId, until: Date.now() + 45000 }));
      } catch {}
    }
    /* Pas resultate toe op die nuutste tou (nuwe items kon intussen bygekom het) */
    const fresh = this.load();
    Object.assign(fresh, {
      sentCount: box.sentCount,
      lastOkAt: box.lastOkAt,
      lastAttemptAt: box.lastAttemptAt,
      lastError: box.lastError,
      failingSince: box.failingSince,
      serverV2: box.serverV2,
      v2CheckedAt: box.v2CheckedAt,
      planServer: box.planServer,
      planCheckedAt: box.planCheckedAt,
      alertFor: fresh.alertFor
    });
    fresh.queue = fresh.queue.filter((q) => {
      const r = outcome[q.id];
      if (!r) return true;
      if (r.result === "sent" || r.result === "drop") return false;
      q.tries = (q.tries || 0) + 1;
      q.lastError = r.error || null;
      if (r.result === "retry") {
        const base = Math.min(5 * 60 * 1000, 5000 * 2 ** Math.min(q.tries, 6));
        q.nextTryAt = Date.now() + Math.round(base * (0.8 + Math.random() * 0.4));
        q.state = "retry";
      } else if (r.result === "parked") {
        q.state = "parked";
        q.nextTryAt = Date.now() + this.v2RecheckMs;
      } else if (r.result === "dead") {
        q.state = "dead";
        q.nextTryAt = Date.now() + this.deadRetryMs;
      }
      return true;
    });
    this.save(fresh);
    this.markSynced(sent.filter((id) => !id.startsWith("hb:")));
    this.notify();
    this.checkAlert(fresh);
  },

  /* ---------- Pa-waarskuwing (ntfy) ---------- */

  /* > 10 min sonder sinkronisering: waarsku Pa (as ntfy bereikbaar is). As die toestel heeltemal vanlyn
     was en die waarskuwing nie kon uitgaan nie, kry Pa by herstel steeds ’n boodskap met die gaping. */
  async checkAlert(box) {
    if (this._alerting) return;
    this._alerting = true;
    try {
      const pending = this.sendable(box).length;
      const fmt = (ms) => new Date(ms).toLocaleTimeString("af-ZA", { hour: "2-digit", minute: "2-digit" });
      if (box.failingSince && pending && Date.now() - box.failingSince >= this.alertAfterMs) {
        if (box.outageSince !== box.failingSince) this.update((b) => (b.outageSince = box.failingSince));
        if (box.alertFor !== box.failingSince) {
          const mins = Math.round((Date.now() - box.failingSince) / 60000);
          const res = await WALLIE.REMOTE?.publish({
            title: "SINK-PROBLEEM — Pa-konsole kry niks",
            message: `Wallie se toestel kon vir ${mins} min (sedert ${fmt(box.failingSince)}) nie na die Pa-konsole stuur nie.\n${pending} gebeure wag in die tou (gaan nie verlore nie).\nLaaste fout: ${box.lastError || "onbekend"}`,
            tags: ["warning", "satellite"],
            priority: 4,
            skipConsent: true
          });
          if (res?.ok) this.update((b) => (b.alertFor = box.failingSince));
        }
      } else if (!box.failingSince && box.outageSince) {
        const end = box.lastOkAt || Date.now();
        const mins = Math.round((end - box.outageSince) / 60000);
        const res = await WALLIE.REMOTE?.publish({
          title: "SINK HERSTEL",
          message: `Wallie se toestel stuur weer na die Pa-konsole.\nGaping: ${mins} min sonder sinkronisering (${fmt(box.outageSince)}–${fmt(end)})${
            box.alertFor === box.outageSince ? "" : " — die toestel was heeltemal vanlyn, dus kon Pa nie vroeër gewaarsku word nie"
          }.\nWat gewag het, is nou opgelaai.`,
          tags: ["white_check_mark", "satellite"],
          priority: 3,
          skipConsent: true
        });
        if (res?.ok)
          this.update((b) => {
            b.outageSince = null;
            b.alertFor = null;
          });
      }
    } finally {
      this._alerting = false;
    }
  },

  /* ---------- status vir die aanwyser ---------- */

  sendable(box) {
    return box.queue.filter((q) => q.state !== "parked" && q.state !== "dead");
  },

  /* ---------- rooster → bediener (Pa-konsole: gepland / klaar / gemis) ---------- */

  hash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  },

  /* Stuur die rooster van twee weke terug tot ’n week vorentoe. Dieselfde rooster = dieselfde id (ontdubbel). */
  syncPlans(now = new Date()) {
    if (!WALLIE.buildDayPlan || !WALLIE.todayKey) return 0;
    let n = 0;
    for (let off = -14; off <= 7; off++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + off);
      const day = WALLIE.todayKey(d);
      let plan;
      try {
        plan = WALLIE.buildDayPlan(day);
      } catch {
        continue;
      }
      const blocks = (plan.blocks || []).map((b) => ({
        id: b.id,
        kind: b.kind,
        subject_slug: b.subjectSlug,
        subject: WALLIE.REMOTE?.subjectLabel(b.subjectSlug) || b.subjectSlug,
        minutes: b.minutes,
        start: b.start || null,
        end: b.end || null,
        title: b.title
      }));
      const hash = this.hash(JSON.stringify(blocks));
      if (this.enqueue(`plan:${day}:${hash}`, { kind: "plan", day, plan_hash: hash, blocks, title: `ROOSTER ${day}` }, { noFlush: true })) n += 1;
    }
    this.update((b) => (b.plansSyncedFor = WALLIE.todayKey(now)));
    return n;
  },

  status() {
    const box = this.load();
    const pending = this.sendable(box).length;
    /* Rooster-items (kind "plan") tel nie vir Wallie se aanwyser nie: dis agtergrond-inligting vir Pa */
    const parked = box.queue.filter((q) => q.state === "parked" && q.kind !== "plan").length;
    const dead = box.queue.filter((q) => q.state === "dead" && q.kind !== "plan").length;
    const failingFor = box.failingSince ? Date.now() - box.failingSince : 0;
    let level = "ok";
    if (pending) level = failingFor >= this.redAfterMs ? "bad" : "busy";
    return {
      level,
      pending,
      parked,
      dead,
      lastOkAt: box.lastOkAt,
      lastError: box.lastError,
      failingFor,
      sentCount: box.sentCount || 0,
      serverV2: box.serverV2
    };
  },

  fmtTime(ms) {
    return ms ? new Date(ms).toLocaleTimeString("af-ZA", { hour: "2-digit", minute: "2-digit" }) : "nog nooit";
  },

  label(st = this.status()) {
    if (st.level === "ok") return "Gesinkroniseer";
    if (st.level === "busy") return `Stuur… (${st.pending})`;
    return `Nie gesinkroniseer nie (${st.pending} wag)`;
  },

  statusText(st = this.status()) {
    const parts = [];
    if (st.level === "ok") parts.push(`Pa-konsole: gesinkroniseer · laaste suksesvolle stuur ${this.fmtTime(st.lastOkAt)}.`);
    else if (st.level === "busy") parts.push(`Pa-konsole: stuur nou ${st.pending} gebeure…`);
    else
      parts.push(
        `Pa-konsole: NIE gesinkroniseer nie — ${st.pending} gebeure wag (${st.lastError || "geen verbinding"}). Laaste sukses ${this.fmtTime(st.lastOkAt)}. Probeer outomaties weer; niks gaan verlore nie.`
      );
    if (st.parked) parts.push(`${st.parked} wag vir Pa se bediener-opgradering.`);
    if (st.dead) parts.push(`${st.dead} deur die bediener geweier (word later weer probeer).`);
    return parts.join(" ");
  },

  notify() {
    try {
      this.onStatus?.(this.status());
    } catch {}
  },

  /* ---------- ou uitboks + terugvul ---------- */

  legacyEventId(old) {
    const p = old.payload || {};
    const d = p.data || {};
    if (p.kind === "end" && (d.sessionId || p.session_id)) return `end:${d.sessionId || p.session_id}`;
    if (p.kind === "start" && p.session_id) return `start:${p.session_id}`;
    if (p.kind === "offline" && p.session_id) return `offline:${p.session_id}`;
    if ((p.kind === "survey" || p.kind === "pa-survey" || p.kind === "probleem") && d.id) return `${p.kind}:${d.id}`;
    return `legacy:${old.id}`;
  },

  migrateLegacyOutbox() {
    let old;
    try {
      old = JSON.parse(localStorage.getItem(this.legacyOutboxKey) || "null");
    } catch {
      old = null;
    }
    const items = old?.queue || [];
    items.forEach((o) => {
      const { client_at, kind } = o.payload || {};
      if (!kind || kind === "heartbeat") return;
      this.enqueue(this.legacyEventId(o), { ...o.payload, client_at: client_at || o.createdAt }, { noFlush: true, entityAt: o.createdAt });
    });
    if (old) {
      try {
        localStorage.setItem(this.legacyOutboxKey + "_migrated", JSON.stringify({ at: Date.now(), count: items.length }));
        localStorage.removeItem(this.legacyOutboxKey);
      } catch {}
    }
    return items.length;
  },

  sessionTimes(s) {
    const idTs = Number(String(s.id || "").replace(/^s_/, "")) || null;
    const durMs = (Number(s.actualMin ?? s.durationMin) || 0) * 60000;
    if (s.startedAt && s.endedAt) return { startedAt: s.startedAt, endedAt: s.endedAt };
    /* Voor 8 Okt is die id by die einde gemaak; daarna by die begin (nuwe sessies het "locks") */
    const idIsStart = "locks" in s || "memoMin" in s;
    if (!idTs) return { startedAt: null, endedAt: null };
    return idIsStart ? { startedAt: idTs, endedAt: idTs + durMs } : { startedAt: idTs - durMs, endedAt: idTs };
  },

  /* Skandeer wallie911_v2_bok en sit alles wat nog nie gestuur is nie in die tou. Idempotent. */
  backfill(state) {
    if (!state) return 0;
    const led = this.ledger();
    const queued = new Set(this.load().queue.map((q) => q.id));
    const label = (slug) => WALLIE.REMOTE?.subjectLabel(slug) || slug || "—";
    let n = 0;
    const add = (id, payload, entityAt) => {
      if (led[id] || queued.has(id)) return;
      if (this.enqueue(id, payload, { backfill: true, entityAt, noFlush: true })) n += 1;
    };

    (state.sessions || []).forEach((s) => {
      if (!s?.id) return;
      const t = this.sessionTimes(s);
      const block = s.block || null;
      add(
        `end:${s.id}`,
        {
          kind: "end",
          session_id: s.id,
          subject: label(s.subjectSlug),
          subject_slug: s.subjectSlug,
          task: s.task || "",
          status: "off",
          outcome: s.outcome || "onbekend",
          warnings: s.warnings || 0,
          total_warnings: s.warnings || 0,
          locks: s.locks || 0,
          planned_min: s.plannedMin || null,
          duration_min: s.actualMin ?? s.durationMin ?? null,
          started_at: t.startedAt,
          ended_at: t.endedAt,
          block_id: block?.id || null,
          client_at: t.endedAt || t.startedAt || Date.now(),
          title: "SESSIE-VERSLAG (teruggevul)",
          body: [
            `Vak: ${label(s.subjectSlug)}`,
            `Datum: ${s.date || "?"}${t.startedAt ? ` · begin ${new Date(t.startedAt).toLocaleTimeString("af-ZA")}` : ""}`,
            `Duur: ${s.actualMin ?? s.durationMin ?? "?"}m`,
            `Uitkoms: ${s.outcome || "?"}`,
            `Waarskuwings: ${s.warnings || 0}`,
            s.task ? `Taak: ${s.task}` : null,
            "(Uit die toestel se plaaslike log — kon nie destyds gestuur word nie.)"
          ]
            .filter(Boolean)
            .join("\n"),
          data: { ...s, backfill: true }
        },
        t.endedAt || t.startedAt
      );
    });

    (state.wallieSurveys || []).forEach((w) => {
      if (!w?.id) return;
      add(
        `survey:${w.id}`,
        {
          kind: "survey",
          session_id: w.sessionId || null,
          subject: label(w.subjectSlug),
          subject_slug: w.subjectSlug,
          client_at: w.at,
          title: "SURVEY — Wallie ná sessie (teruggevul)",
          body: WALLIE.SYNC.surveyText(w),
          data: { ...w, backfill: true }
        },
        w.at
      );
    });

    (state.paSurveys || []).forEach((p) => {
      if (!p?.id) return;
      add(
        `pa-survey:${p.id}`,
        {
          kind: "pa-survey",
          session_id: p.sessionId || null,
          client_at: p.at,
          title: "PA-SURVEY (teruggevul)",
          body: Object.entries(p.answers || {})
            .map(([k, v]) => `${k}: ${v}`)
            .join("\n"),
          data: { ...p, backfill: true }
        },
        p.at
      );
    });

    (state.bugReports || []).forEach((b) => {
      if (!b?.id) return;
      add(
        `probleem:${b.id}`,
        {
          kind: "probleem",
          subject: b.subjectSlug ? label(b.subjectSlug) : null,
          client_at: b.at,
          title: (b.severity === "blokkeer" ? "PROBLEEM — blokkeer" : "PROBLEEM") + " (teruggevul)",
          body: [`Tipe: ${b.tipe} · ${b.severity}`, b.detail, b.code ? `Kode: ${b.code}` : null].filter(Boolean).join("\n"),
          data: { ...b, backfill: true }
        },
        b.at
      );
    });

    Object.entries(state.completedBlocks || {}).forEach(([blockId, done]) => {
      if (!done) return;
      const at = typeof done === "number" ? done : Date.parse(blockId.slice(0, 10) + "T20:00:00") || Date.now();
      add(`block:${blockId}`, { kind: "block", block_id: blockId, client_at: at, title: "BLOK KLAAR (teruggevul)", data: { blockId, done: true, backfill: true } }, at);
    });

    this.update((box) => (box.backfilledAt = Date.now()));
    return n;
  },

  surveyText(w) {
    const a = w.answers || {};
    return [
      `Vak: ${WALLIE.REMOTE?.subjectLabel(w.subjectSlug) || w.subjectSlug || "—"}`,
      a.fokus != null ? `Fokus: ${a.fokus}/5` : null,
      a.metode ? `Metode: ${a.metode}` : null,
      a.blokkade ? `Blokkade: ${a.blokkade}` : null,
      a.eerlikheid ? `Eerlikheid: ${a.eerlikheid}` : null,
      a.help_more ? `Help: ${a.help_more}` : null,
      ...Object.entries(a)
        .filter(([k]) => !["fokus", "metode", "blokkade", "eerlikheid", "help_more"].includes(k))
        .map(([k, v]) => `${k}: ${v}`)
    ]
      .filter(Boolean)
      .join("\n");
  },

  /* ---------- begin ---------- */

  start(state) {
    try {
      if (!this.load().legacyMigrated) {
        this.migrateLegacyOutbox();
        this.update((b) => (b.legacyMigrated = true));
      }
    } catch {}
    try {
      this.backfill(state);
    } catch {}
    try {
      this.syncPlans();
    } catch {}
    this.notify();
    this.flush();
    if (this._timer) return;
    this._timer = setInterval(() => {
      /* Nuwe dag (toestel bly dae lank oop): stuur die nuwe week se rooster */
      try {
        if (WALLIE.todayKey && this.load().plansSyncedFor !== WALLIE.todayKey()) this.syncPlans();
      } catch {}
      this.flush();
      this.notify();
    }, this.tickMs);
    if (typeof window !== "undefined" && window.addEventListener) {
      window.addEventListener("online", () => {
        /* Weer aanlyn: probeer dadelik alles, ongeag backoff */
        this.update((b) => b.queue.forEach((q) => q.state === "retry" && (q.nextTryAt = 0)));
        this.flush();
      });
      window.addEventListener("storage", (e) => {
        if (e.key === this.key) this.notify();
      });
    }
  }
};
