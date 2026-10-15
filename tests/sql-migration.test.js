/* Toets supabase/wallie911_live.sql + migrations/*.sql in ’n plaaslike Postgres (PGlite, WASM).
   Raak nooit die lewendige databasis nie. `node tests/sql-migration.test.js` */
const fs = require("fs");
const path = require("path");
const assert = require("assert/strict");

const { newDb, migrationFiles, root } = require("./sql-helpers");
const { overviewTests } = require("./sql-overview");

async function main() {
  const db = await newDb({ migrations: false });

  const v1 = async (p) => (await db.query("select public.wallie_ingest($1::jsonb) r", [JSON.stringify(p)])).rows[0].r;
  const v2 = async (p) => (await db.query("select public.wallie_ingest_v2($1::jsonb) r", [JSON.stringify(p)])).rows[0].r;
  const rows = async (sql, args) => (await db.query(sql, args)).rows;

  let passed = 0;
  const ok = (cond, msg) => {
    assert.ok(cond, msg);
    passed += 1;
  };
  const eq = (a, b, msg) => {
    assert.deepEqual(a, b, msg);
    passed += 1;
  };

  /* Bestaande gedrag van wallie_ingest waarop die kliënt-terugval staatmaak */
  ok((await v1({ kind: "idle" })).error === "bad kind", "v1 weier nuwe soort met 'bad kind'");
  ok((await v1({ kind: "end", session_id: "s_old", data: { sessionId: "s_old", _event_id: "end:s_old" }, client_at: 1791500000000 })).ok, "v1 end ok");
  ok((await v1({ kind: "survey", data: { id: "ws_1", _event_id: "survey:ws_1" }, client_at: 1791500000000 })).ok, "v1 survey ok");
  ok((await v1({ kind: "probleem", data: { id: "bug_9" } })).ok, "v1 probleem sonder _event_id ok");

  /* Migrasie (twee keer: moet herloopbaar wees) */
  for (const f of migrationFiles()) {
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
      "select has_function_privilege('anon', 'public.wallie_ingest_v2(jsonb)', 'execute') e, has_table_privilege('anon', 'wallie911.events', 'select') or has_table_privilege('anon', 'wallie911.events', 'insert') s, has_table_privilege('anon', 'wallie911.support', 'select') ss"
    )
  )[0];
  /* Sedert 003 het anon USAGE op wallie911 (soos lewendig) — net vir INSERT in support; geen tabel-lees of events-skryf nie. */
  ok(g.e === true && g.s === false && g.ss === false, "anon: execute op v2, geen lees/skryf op events, geen lees op support nie");

  await overviewTests(db, { ok, eq, v2 });

  /* ---------- 004: v3_poging (S3) ---------- */
  {
    const { newDb: nuweDb } = require("./sql-helpers");
    const lees = (f) => fs.readFileSync(path.join(root, "migrations", f), "utf8");
    const alle = migrationFiles();
    ok(alle.includes("004_v3_poging.sql"), "004_v3_poging.sql bestaan");
    const tot003 = alle.filter((f) => f < "004");
    eq(tot003, ["001_wallie_ingest_v2.sql", "002_pa_overview.sql", "003_support_hulp.sql"], "001..003 is die toestand voor 004");
    const funksieBron = async (d, naam) => (await d.query("select pg_get_functiondef(p.oid) d from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = $1", [naam])).rows[0].d;

    const poging = {
      item_id: "eng-v3-B1", vak: "engels", punte_behaal: 40, punte_totaal: 50, woorde: 270,
      minute_gebruik: 71, tyd_min: 80, memo_oopgemaak_na_min: 79
    };
    const ev = (id, extra) => ({
      kind: "v3_poging", event_id: id, client_at: 1791455400000, device_id: "d_v3",
      title: "EKSAMENPOGING eng-v3-B1", body: "eng-v3-B1 · 40/50 punte", data: poging, ...extra
    });

    /* (a) net 001..003: weier met 'bad kind' */
    const oud = await nuweDb({ migrations: false });
    for (const f of tot003) await oud.exec(lees(f));
    const oudV2 = async (p) => (await oud.query("select public.wallie_ingest_v2($1::jsonb) r", [JSON.stringify(p)])).rows[0].r;
    const oudV1 = async (p) => (await oud.query("select public.wallie_ingest($1::jsonb) r", [JSON.stringify(p)])).rows[0].r;
    eq(await oudV2(ev("v3_poging:eng-v3-B1:1791455400000")), { ok: false, error: "bad kind" }, "voor 004: v2 weier v3_poging met 'bad kind'");
    ok((await oud.query("select count(*)::int n from wallie911.events where kind = 'v3_poging'")).rows[0].n === 0, "voor 004: niks gestoor nie");
    const v1Bron = await funksieBron(oud, "wallie_ingest");
    const v2BronVoor = await funksieBron(oud, "wallie_ingest_v2");
    const oudEvents = (await oud.query("select count(*)::int n from wallie911.events")).rows[0].n;

    /* (b) ná 004: aanvaar, data met presies die 8 velde */
    const sql004 = lees("004_v3_poging.sql");
    await oud.exec(sql004);
    await oud.exec(sql004); /* idempotent */
    const r1 = await oudV2(ev("v3_poging:eng-v3-B1:1791455400000"));
    eq(r1, { ok: true, duplicate: false }, "ná 004: v2 aanvaar v3_poging");
    const ry = (await oud.query("select kind, title, body, data, client_event_id, device_id, session_id from wallie911.events where kind = 'v3_poging'")).rows;
    eq(ry.length, 1, "ná 004: een v3_poging-ry");
    eq(Object.keys(ry[0].data).sort(), ["item_id", "memo_oopgemaak_na_min", "minute_gebruik", "punte_behaal", "punte_totaal", "tyd_min", "vak", "woorde"], "data het presies die 8 velde");
    eq(ry[0].data, poging, "data-waardes onveranderd (jsonb)");
    eq([ry[0].title, ry[0].body, ry[0].client_event_id, ry[0].device_id, ry[0].session_id], ["EKSAMENPOGING eng-v3-B1", "eng-v3-B1 · 40/50 punte", "v3_poging:eng-v3-B1:1791455400000", "d_v3", null], "title, body en client_event_id behou");
    /* geen sessie-/lewendig-/presence-effek nie */
    eq((await oud.query("select count(*)::int n from wallie911.live")).rows[0].n, 0, "v3_poging maak geen lewendige sessie nie");
    eq((await oud.query("select count(*)::int n from wallie911.presence")).rows[0].n, 0, "v3_poging skryf geen presence nie");

    /* (c) herhaling met dieselfde event_id */
    eq(await oudV2(ev("v3_poging:eng-v3-B1:1791455400000")), { ok: true, duplicate: true }, "herhaling gee duplicate: true");
    eq((await oud.query("select count(*)::int n from wallie911.events where kind = 'v3_poging'")).rows[0].n, 1, "herhaling gee nie 'n tweede ry nie");
    eq(await oudV2(ev("v3_poging:eng-v3-B1:1791455500000")), { ok: true, duplicate: false }, "'n ander poging (ander tyd) is 'n nuwe ry");

    /* (d) alle ou soorte werk steeds */
    for (const k of ["start", "heartbeat", "warn", "lock", "unlock", "memo", "end", "survey", "pa-survey", "probleem", "offline", "idle", "active", "visibility", "block"]) {
      const r = await oudV2({ kind: k, event_id: `${k}:s_004:1`, session_id: "s_004", client_at: 1791455400000, subject: "Engels EAT", block_id: "b_004" });
      ok(r.ok === true, `ná 004: ou soort ${k} werk steeds`);
    }
    eq((await oudV2({ kind: "nope", event_id: "x:1" })).error, "bad kind", "ná 004: onbekende soort word steeds geweier");
    eq((await oudV2({ kind: "v3_poging" })).error, "no event_id", "ná 004: v3_poging sonder event_id word geweier");

    /* (e) die ou v1-funksie is onveranderd en ken v3_poging steeds nie */
    eq(await funksieBron(oud, "wallie_ingest"), v1Bron, "wallie_ingest (v1) se bron onveranderd deur 004");
    eq((await oudV1({ kind: "v3_poging" })).error, "bad kind", "v1 weier v3_poging steeds");
    ok(v2BronVoor !== (await funksieBron(oud, "wallie_ingest_v2")), "net v2 se bron het verander");
    ok(!v2BronVoor.includes("v3_poging") && (await funksieBron(oud, "wallie_ingest_v2")).includes("v3_poging"), "v2-bron: v3_poging net ná 004");

    /* 004 raak geen bestaande rye nie: net die twee v3_poging-rye + ou-soort-rye van hierdie toets bygekom */
    ok(oudEvents === 0, "voor 004 was die gebeure-tabel leeg (niks om te raak nie)");
    /* regte bly: anon mag die funksie roep */
    ok((await oud.query("select has_function_privilege('anon', 'public.wallie_ingest_v2(jsonb)', 'execute') e")).rows[0].e === true, "anon kan v2 steeds roep");

    /* 004 sit net die funksie vervang: geen DDL op tabelle, geen DML op wallie911 nie (bron-kontrole) */
    const kaal = sql004.split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
    const fnEind = kaal.indexOf("end " + "$$;") + 7;
    const buite = kaal.slice(0, kaal.indexOf("create or replace function")) + kaal.slice(fnEind);
    ok(!/\b(create|alter|drop)\s+table\b/i.test(kaal), "004: geen tabel-DDL");
    ok(!/^\s*(insert\s+into|update|delete\s+from)\b/im.test(buite), "004: geen insert/update/delete buite die funksie nie");
  }
  /* wallie911.support: kolomme == skema-fiksture, en die Hulp-paneel se presiese liggaam word aanvaar */
  {
    const fx = JSON.parse(fs.readFileSync(path.join(root, "tests/fixtures/support-schema.json"), "utf8"));
    const cols = (await rows("select column_name from information_schema.columns where table_schema='wallie911' and table_name='support' order by ordinal_position")).map((r) => r.column_name);
    eq([...cols].sort(), [...fx.columns].sort(), `support-kolomme pas by fiksture (${cols})`);
    ok(fx.client_writes.every((c) => cols.includes(c)), "elke kliënt-sleutel bestaan as kolom");
    const body = { vak: "rtt", gebeur: "toets", skerm: "Sessie", category: "rtt", message: "toets", context: { skerm: "Sessie", bron: "hulp" }, app_version: "x", ua: "y" };
    eq(Object.keys(body).sort(), [...fx.client_writes].sort(), "toetsliggaam == client_writes");
    await db.exec("set role anon");
    await db.query("insert into wallie911.support (vak, gebeur, skerm) values ('engels','net drie','Engels EAT')");
    await db.exec("reset role");
    const r = (await rows("select category, message, status, context->>'skerm' s from wallie911.support where gebeur='net drie'"))[0];
    eq(r, { category: "engels", message: "net drie", status: "new", s: "Engels EAT" }, "ou 3-veld-liggaam: sneller vul category/message, status=new");
  }

  console.log(JSON.stringify({ passed, fails: 0 }));
}

main().catch((e) => {
  console.error("SQL-TOETS MISLUK:", e.message);
  process.exit(1);
});
