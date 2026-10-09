/* Nagemaakte Supabase + ntfy vir die Playwright-toetse.
   - Elke versoek na *.supabase.co of ntfy.sh word hier beantwoord; niks gaan na die internet nie.
   - Alle ander eksterne gashere (bv. Google Fonts) word afgekap, sodat ’n toets nooit stilletjies
     iets lewendigs kan raak nie (`external` hou rekord as iets dit probeer).
   - mode "v1": soos die lewendige bediener vandag (wallie_ingest bestaan, wallie_ingest_v2 nie).
     mode "v2": ná migrations/001. mode "offline": netwerk af (ook ntfy).
     mode "full": soos "v2", maar die ECHTE migrasies (001 + 002) loop in ’n plaaslike Postgres (PGlite): ingest, rooster,
       Pa se oorsig en foto's gaan deur die werklike SQL. "Nou" op die bediener = nowFn() (die blaaier se nagemaakte klok).
     mode "down": Supabase gee 503, maar ntfy werk (Pa kan gewaarsku word). */
const { newDb, addPaToken } = require("../sql-helpers");

const SUPABASE = "https://jxfmzxebekqzwnlurtxg.supabase.co";
const isV2 = (mode) => mode === "v2" || mode === "full";

const V1_KINDS = ["start", "heartbeat", "warn", "lock", "unlock", "memo", "end", "survey", "pa-survey", "probleem", "offline"];

class MockBackend {
  constructor({ mode = "v1" } = {}) {
    this.mode = mode;
    this.calls = [];
    this.ntfy = [];
    this.external = [];
    this.stills = [];
    /* Klein in-geheue "databasis" sodat die Pa-konsole realistiese data kry */
    this.live = new Map();
    this.events = [];
    this.seen = new Set();
    /* Die blaaier loop op ’n nagemaakte klok; die "bediener" moet dieselfde tyd gebruik */
    this.nowFn = () => Date.now();
    this.plans = [];
    this.pg = null;
  }

  /* Net vir mode "full": skep die plaaslike databasis met die werklike skema + migrasies */
  async init() {
    if (this.mode === "full" && !this.pg) {
      this.pg = await newDb();
      await addPaToken(this.pg, "tok_test");
    }
    return this;
  }

  async sql(text, args = []) {
    return (await this.pg.query(text, args)).rows;
  }

  iso() {
    return new Date(this.nowFn()).toISOString();
  }

  ingest(name, p) {
    const k = p.kind;
    if (name === "wallie_ingest" && !V1_KINDS.includes(k)) return { ok: false, error: "bad kind" };
    if (name === "wallie_ingest_v2") {
      if (!p.event_id) return { ok: false, error: "no event_id" };
      if (this.seen.has(p.event_id)) return { ok: true, duplicate: true };
      this.seen.add(p.event_id);
    }
    const nowIso = new Date(this.nowFn()).toISOString();
    const ts = (ms) => (ms ? new Date(Number(ms)).toISOString() : null);
    if (p.session_id && ["start", "heartbeat", "warn", "lock", "unlock", "memo", "end", "idle", "active", "visibility"].includes(k)) {
      const cur = this.live.get(p.session_id) || {
        session_id: p.session_id,
        started_at: ts(p.started_at) || nowIso,
        ended_at: null,
        outcome: null
      };
      Object.assign(cur, {
        subject: p.subject ?? cur.subject,
        task: p.task ?? cur.task,
        status: cur.ended_at ? cur.status : p.status || "active",
        warnings: p.warnings ?? cur.warnings ?? 0,
        total_warnings: Math.max(cur.total_warnings || 0, p.total_warnings || 0),
        locks: Math.max(cur.locks || 0, p.locks || 0),
        left_ms: p.left_ms ?? cur.left_ms,
        planned_min: p.planned_min ?? cur.planned_min,
        last_seen: name === "wallie_ingest_v2" ? ts(p.client_at) : nowIso
      });
      if (k === "end") Object.assign(cur, { status: "off", ended_at: name === "wallie_ingest_v2" ? ts(p.ended_at || p.client_at) : nowIso, outcome: p.outcome });
      this.live.set(p.session_id, cur);
    }
    if (k !== "heartbeat") {
      this.events.push({
        id: this.events.length + 1,
        session_id: p.session_id || null,
        kind: k,
        title: p.title,
        body: p.body,
        created_at: name === "wallie_ingest_v2" ? ts(p.client_at) : nowIso
      });
    }
    return { ok: true, duplicate: false };
  }

  async attach(context) {
    await context.route(/^https?:\/\/(?!localhost)/, async (route) => {
      const req = route.request();
      const url = req.url();
      if (url.startsWith(`${SUPABASE}/rest/v1/rpc/`)) return this.handleRpc(route);
      if (url.startsWith("https://ntfy.sh/")) {
        const u = new URL(url);
        this.ntfy.push({ title: u.searchParams.get("title"), priority: u.searchParams.get("priority"), body: req.postData() || "" });
        if (this.mode === "offline") return route.abort("internetdisconnected");
        return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
      }
      this.external.push(url);
      return route.abort("blockedbyclient");
    });
  }

  async handleRpc(route) {
    const req = route.request();
    const name = req.url().split("/rpc/")[1];
    let body = null;
    try {
      body = req.postDataJSON();
    } catch {}
    this.calls.push({ name, body, at: Date.now(), mode: this.mode });
    const cors = { "access-control-allow-origin": "*" };
    if (this.mode === "offline") return route.abort("internetdisconnected");
    if (this.mode === "down") {
      return route.fulfill({ status: 503, headers: cors, contentType: "application/json", body: '{"message":"Service Unavailable"}' });
    }
    const json = (status, obj) => route.fulfill({ status, headers: cors, contentType: "application/json", body: JSON.stringify(obj) });

    if (this.pg) {
      const fn = {
        wallie_ingest: ["p"],
        wallie_ingest_v2: ["p"],
        wallie_ingest_plan: ["p"],
        wallie_pa_live: ["p_token", "p_day"],
        wallie_pa_overview: ["p_token", "p_day"],
        wallie_pa_still: ["p_token", "p_id"]
      }[name];
      if (fn) {
        let r;
        if (name === "wallie_pa_overview") {
          r = await this.sql("select public.wallie_pa_overview($1, $2::date, $3::timestamptz) r", [body.p_token, body.p_day ?? null, this.iso()]);
        } else if (name === "wallie_pa_live") {
          r = await this.sql("select public.wallie_pa_live($1, $2::date) r", [body.p_token, body.p_day ?? null]);
        } else if (name === "wallie_pa_still") {
          r = await this.sql("select public.wallie_pa_still($1, $2::bigint) r", [body.p_token, body.p_id]);
        } else {
          r = await this.sql(`select public.${name}($1::jsonb) r`, [JSON.stringify(body.p)]);
          if (name === "wallie_ingest_v2" && body.p.device_id) {
            await this.sql("update wallie911.devices set last_sync_at = $2::timestamptz where device_id = $1", [body.p.device_id, this.iso()]);
          }
        }
        return json(200, r[0].r);
      }
      if (name === "wallie_still") {
        this.stills.push(body);
        /* Die werklike funksie eis 'n lewendige sessie in bediener-tyd; hier plaas ons die foto direk met die nagemaakte tyd */
        await this.sql("insert into wallie911.stills (session_id, jpeg_b64, created_at) values ($1, $2, $3::timestamptz)", [
          body.p_session_id,
          body.p_jpeg_b64,
          this.iso()
        ]);
        return json(200, { ok: true });
      }
    }
    if (name === "wallie_ingest_plan" && isV2(this.mode)) {
      this.plans.push(body.p);
      return json(200, { ok: true, duplicate: false });
    }
    if (name === "wallie_ingest_v2" && !isV2(this.mode)) {
      return json(404, {
        code: "PGRST202",
        message: "Could not find the function public.wallie_ingest_v2(p) in the schema cache"
      });
    }
    if (name === "wallie_ingest" || name === "wallie_ingest_v2") return json(200, this.ingest(name, body.p));
    if (name === "wallie_still") {
      this.stills.push(body);
      return json(200, { ok: true });
    }
    if (name === "wallie_pa_login") {
      return json(200, body.p_password === "toets-wagwoord" ? { ok: true, token: "tok_test" } : { ok: false, error: "bad password" });
    }
    if (name === "wallie_pa_logout") return json(200, { ok: true });
    if (name === "wallie_pa_live") {
      if (body.p_token !== "tok_test") return json(200, { ok: false, error: "auth" });
      return json(200, {
        ok: true,
        now: new Date(this.nowFn()).toISOString(),
        day: body.p_day || new Date(this.nowFn() + 2 * 3600000).toISOString().slice(0, 10),
        sessions: [...this.live.values()].sort((a, b) => (a.started_at < b.started_at ? 1 : -1)),
        events: [...this.events].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)),
        still: null
      });
    }
    return json(404, { code: "PGRST202", message: `unknown ${name}` });
  }

  /* Hulpies vir bewerings */
  ingests() {
    return this.calls.filter((c) => c.name === "wallie_ingest" || c.name === "wallie_ingest_v2");
  }

  delivered() {
    /* Net versoeke wat die bediener werklik aanvaar het (nie vanlyn / 404 / bad kind nie) */
    return this.ingests().filter((c) => !["offline", "down"].includes(c.mode) && !(c.name === "wallie_ingest_v2" && !isV2(c.mode)) && (c.name !== "wallie_ingest" || V1_KINDS.includes(c.body.p.kind)));
  }

  deliveredIds() {
    return this.delivered().map((c) => c.body.p.event_id);
  }

  byKind(kind) {
    return this.delivered().filter((c) => c.body.p.kind === kind);
  }
}

module.exports = { MockBackend, SUPABASE };
