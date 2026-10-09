/* Toets supabase/wallie911_live.sql + migrations/*.sql in ’n plaaslike Postgres (PGlite, WASM).
   Raak nooit die lewendige databasis nie. `node tests/sql-migration.test.js` */
const fs = require("fs");
const path = require("path");
const assert = require("assert/strict");

const root = path.join(__dirname, "..");

/* PGlite het nie pgcrypto nie; die ingest-funksies gebruik dit nie. Stompe net vir Pa se wagwoord-funksies. */
const PRELUDE = `
create role anon nologin; create role authenticated nologin;
create schema extensions;
create function extensions.digest(t text, alg text) returns bytea language sql as $$ select decode(md5(t), 'hex') $$;
create function extensions.gen_random_bytes(n int) returns bytea language sql as $$ select decode(md5(random()::text), 'hex') $$;
create function extensions.gen_salt(t text, n int default 0) returns text language sql as $$ select 'salt' $$;
create function extensions.crypt(p text, s text) returns text language sql as $$ select md5(p) $$;
`;

function baseSql() {
  return fs
    .readFileSync(path.join(root, "supabase/wallie911_live.sql"), "utf8")
    .replace(/create extension if not exists pgcrypto[^;]*;/i, "");
}

async function main() {
  const { PGlite } = await import("@electric-sql/pglite");
  const db = new PGlite();
  await db.exec(PRELUDE);
  await db.exec(baseSql());

  const v1 = async (p) => (await db.query("select public.wallie_ingest($1::jsonb) r", [JSON.stringify(p)])).rows[0].r;
  const v2 = async (p) => (await db.query("select public.wallie_ingest_v2($1::jsonb) r", [JSON.stringify(p)])).rows[0].r;
  const rows = async (sql, args) => (await db.query(sql, args)).rows;

  let passed = 0;
  const ok = (cond, msg) => {
    assert.ok(cond, msg);
    passed += 1;
  };

  /* Bestaande gedrag van wallie_ingest waarop die kliënt-terugval staatmaak */
  ok((await v1({ kind: "idle" })).error === "bad kind", "v1 weier nuwe soort met 'bad kind'");
  ok((await v1({ kind: "end", session_id: "s_old", data: { sessionId: "s_old", _event_id: "end:s_old" }, client_at: 1791500000000 })).ok, "v1 end ok");
  ok((await v1({ kind: "survey", data: { id: "ws_1", _event_id: "survey:ws_1" }, client_at: 1791500000000 })).ok, "v1 survey ok");
  ok((await v1({ kind: "probleem", data: { id: "bug_9" } })).ok, "v1 probleem sonder _event_id ok");

  /* Migrasie (twee keer: moet herloopbaar wees) */
  const files = fs.readdirSync(path.join(root, "migrations")).filter((f) => f.endsWith(".sql")).sort();
  for (const f of files) {
    const sql = fs.readFileSync(path.join(root, "migrations", f), "utf8");
    await db.exec(sql);
    await db.exec(sql);
  }
  const ids = (await rows("select client_event_id from wallie911.events order by id")).map((r) => r.client_event_id);
  ok(ids.join(",") === "end:s_old,survey:ws_1,probleem:bug_9", `bestaande rye kry event_id (${ids})`);

  /* v2 ontdubbel teen wat reeds via v1 gekom het */
  const dupEnd = await v2({ kind: "end", event_id: "end:s_old", session_id: "s_old", client_at: 1791500000000 });
  ok(dupEnd.ok && dupEnd.duplicate === true, "v2 herken v1-ry as duplikaat");
  ok((await rows("select count(*)::int n from wallie911.events where kind='end'"))[0].n === 1, "geen dubbel-end");

  /* Teruggevulde sessie: regte begin/einde-tyd, nie now() nie */
  const started = Date.parse("2026-09-28T07:30:00Z");
  const ended = Date.parse("2026-09-28T08:15:00Z");
  const r = await v2({
    kind: "end",
    event_id: "end:s_bf",
    session_id: "s_bf",
    subject: "RTT",
    status: "off",
    outcome: "tyd_klaar",
    duration_min: 45,
    planned_min: 45,
    started_at: started,
    ended_at: ended,
    client_at: ended,
    backfill: true,
    device_id: "d_test",
    app_version: "t",
    title: "SESSIE-VERSLAG (teruggevul)",
    data: { id: "s_bf" }
  });
  ok(r.ok && r.duplicate === false, "v2 terugvul ok");
  const live = (await rows("select started_at, ended_at, status, actual_ms from wallie911.live where session_id='s_bf'"))[0];
  ok(new Date(live.started_at).getTime() === started, "started_at = toestel se tyd");
  ok(new Date(live.ended_at).getTime() === ended, "ended_at = toestel se tyd");
  ok(live.status === "off" && Number(live.actual_ms) === 45 * 60000, "status off + actual_ms");
  const ev = (await rows("select backfill, client_at from wallie911.events where client_event_id='end:s_bf'"))[0];
  ok(ev.backfill === true && new Date(ev.client_at).getTime() === ended, "event backfill-vlag + client_at");

  /* Nuwe soorte + hartklop-ontdubbeling + ’n ou hartklop laat nie ’n klaar sessie herleef nie */
  const now = Date.now();
  ok((await v2({ kind: "start", event_id: "start:s_live", session_id: "s_live", started_at: now - 120000, client_at: now - 120000, status: "active" })).ok, "start");
  const hb = {
    kind: "heartbeat",
    event_id: "hb:s_live:1",
    session_id: "s_live",
    client_at: now - 60000,
    status: "active",
    visible: true,
    focused: false,
    idle: false,
    visible_ms: 60000,
    focused_ms: 50000,
    hidden_ms: 0,
    idle_ms: 0
  };
  ok((await v2(hb)).duplicate === false, "hartklop gestoor");
  ok((await v2(hb)).duplicate === true, "hartklop ontdubbel");
  ok((await rows("select count(*)::int n from wallie911.presence"))[0].n === 1, "presence 1 ry");
  ok((await rows("select count(*)::int n from wallie911.events where kind='heartbeat'"))[0].n === 0, "hartklop nie in events nie");
  for (const k of ["idle", "active", "visibility"]) {
    ok((await v2({ kind: k, event_id: `${k}:s_live:1`, session_id: "s_live", client_at: now - 30000 })).ok, `soort ${k}`);
  }
  ok((await v2({ kind: "block", event_id: "block:2026-10-09-x", block_id: "2026-10-09-x", client_at: now })).ok, "soort block");
  await v2({ kind: "end", event_id: "end:s_live", session_id: "s_live", status: "off", outcome: "handmatig", ended_at: now - 10000, client_at: now - 10000, actual_ms: 110000 });
  await v2({ ...hb, event_id: "hb:s_live:0", client_at: now - 90000, status: "active" });
  const l2 = (await rows("select status, ended_at from wallie911.live where session_id='s_live'"))[0];
  ok(l2.status === "off" && l2.ended_at, "ou hartklop ná einde laat sessie nie herleef nie");

  ok((await v2({ kind: "start" })).error === "no event_id", "event_id verpligtend");
  ok((await v2({ kind: "nope", event_id: "x:1" })).error === "bad kind", "onbekende soort");
  ok(
    (await v2({ kind: "warn", event_id: "warn:s:1", session_id: "s_w", warnings: "abc", planned_min: "22.5", client_at: "garbage" })).ok,
    "slegte getalle breek nie die funksie nie"
  );

  const dev = (await rows("select events_received::int n from wallie911.devices where device_id='d_test'"))[0];
  ok(dev && dev.n >= 1, "toestel se laaste sinkronisering bygehou");

  /* Regte: anon mag net die funksie roep */
  const g = (
    await rows(
      "select has_function_privilege('anon', 'public.wallie_ingest_v2(jsonb)', 'execute') e, has_schema_privilege('anon', 'wallie911', 'usage') s"
    )
  )[0];
  ok(g.e === true && g.s === false, "anon: execute op v2, geen toegang tot skema nie");

  console.log(JSON.stringify({ passed, fails: 0 }));
}

main().catch((e) => {
  console.error("SQL-TOETS MISLUK:", e.message);
  process.exit(1);
});
