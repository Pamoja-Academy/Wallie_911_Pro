/* 002: wallie_ingest_plan + wallie_pa_overview teen die ECHTE SQL (PGlite). Aangeroep deur sql-migration.test.js */
const { addPaToken } = require("./sql-helpers");

async function overviewTests(db, { ok, eq, v2 }) {
  await addPaToken(db);
  /* Sessies van die vorige toetse (bv. "slegte getalle") mag nie as "lewendig" tel nie */
  await db.query("update wallie911.live set ended_at = coalesce(ended_at, now()), status = 'off' where ended_at is null");
  const ov = async (day, at) => (await db.query("select public.wallie_pa_overview($1, $2::date, $3::timestamptz) r", ["tok_test", day, at])).rows[0].r;
  const plan = async (p) => (await db.query("select public.wallie_ingest_plan($1::jsonb) r", [JSON.stringify(p)])).rows[0].r;
  const T = (iso) => Date.parse(iso);

  /* Toegang en validasie */
  const noTok = (await db.query("select public.wallie_pa_overview('verkeerd') r")).rows[0].r;
  ok(noTok.error === "auth", "overview vereis Pa-token");
  ok((await plan({ day: "geen-datum", blocks: [] })).error === "bad day", "plan weier slegte dag");
  ok((await plan({ day: "2026-10-05", blocks: "x" })).error === "bad blocks", "plan weier slegte blokke");

  /* Ma 5 Okt 2026 (SAST) en Di 6 Okt */
  const mon = [
    { id: "2026-10-05-warm", kind: "warm", subject: "Wisk. Gelett.", subject_slug: "wiskgelett", minutes: 40, title: "Opwarm", start: "08:00", end: "08:40" },
    { id: "2026-10-05-eng1", kind: "geel", subject: "Engels EAT", subject_slug: "engels", minutes: 45, title: "Engels 1", start: "09:00", end: "09:45" },
    { id: "2026-10-05-eng2", kind: "geel", subject: "Engels EAT", subject_slug: "engels", minutes: 45, title: "Engels 2", start: "10:00", end: "10:45" },
    { id: "2026-10-05-rtt", kind: "rooi", subject: "RTT (CAT)", subject_slug: "rtt", minutes: 60, title: "RTT", start: "11:00", end: "12:00" },
    { id: "2026-10-05-toer", kind: "geel", subject: "Toerisme", subject_slug: "toerisme", minutes: 25, title: "Toerisme", start: "13:00", end: "13:25" },
    { id: "2026-10-05-pouse", kind: "break", subject: "Pouse", subject_slug: "break", minutes: 30, title: "Pouse", start: "12:00", end: "12:30" },
    { id: "2026-10-05-slot", kind: "slot", subject: "Foutbank", subject_slug: "foutbank", minutes: 25, title: "Foutlog", start: "17:00", end: "17:25" }
  ];
  const tue = [{ id: "2026-10-06-rtt", kind: "rooi", subject: "RTT (CAT)", subject_slug: "rtt", minutes: 80, title: "RTT 2", start: null, end: null }];
  ok((await plan({ day: "2026-10-05", plan_hash: "h1", client_at: T("2026-10-05T05:00:00Z"), blocks: mon })).duplicate === false, "plan Ma gestoor");
  ok((await plan({ day: "2026-10-05", plan_hash: "h1", client_at: T("2026-10-05T05:00:01Z"), blocks: mon })).duplicate === true, "plan ontdubbel op hash");
  await plan({ day: "2026-10-06", plan_hash: "h2", client_at: T("2026-10-05T05:00:00Z"), blocks: tue });

  const endSess = (id, subj, slug, start, mins, block) =>
    v2({
      kind: "end", event_id: `end:${id}`, session_id: id, subject: subj, subject_slug: slug, status: "off", outcome: "tyd_klaar",
      started_at: T(start), ended_at: T(start) + mins * 60000, client_at: T(start) + mins * 60000, actual_ms: mins * 60000,
      planned_min: mins, block_id: block, device_id: "d_pa", app_version: "t"
    });
  /* Wiskunde: 40 min aan blok gekoppel (klaar). Engels 1: 20 min aan blok (gedeeltelik). Engels 2: niks (gemis).
     RTT: 50 min sessie SONDER blok (>= 75% van 60 -> klaar via vak-en-dag-poel). Toerisme: handmatig klaar gemerk. */
  await endSess("s_ovw", "Wisk. Gelett.", "wiskgelett", "2026-10-05T06:05:00Z", 40, "2026-10-05-warm");
  await endSess("s_ove1", "Engels EAT", "engels", "2026-10-05T07:05:00Z", 20, "2026-10-05-eng1");
  await endSess("s_ovr", "RTT (CAT)", "rtt", "2026-10-05T09:05:00Z", 50, null);
  await v2({ kind: "block", event_id: "block:2026-10-05-toer", block_id: "2026-10-05-toer", client_at: T("2026-10-05T11:30:00Z") });
  await v2({
    kind: "survey", event_id: "survey:ws_ov1", session_id: "s_ove1", subject: "Engels EAT", client_at: T("2026-10-05T07:26:00Z"),
    title: "SURVEY — Wallie ná sessie", body: "Vak: Engels EAT\nFokus: 2/5\nHelp: Ek was moeg, Pa.",
    data: { id: "ws_ov1", answers: { fokus: "2", help_more: "Ek was moeg, Pa." } }
  });
  await v2({ kind: "probleem", event_id: "probleem:bug_1", client_at: T("2026-10-05T08:00:00Z"), title: "PROBLEEM", body: "Kamera wil nie aan nie" });
  await db.query("insert into wallie911.stills (session_id, jpeg_b64, created_at) values ('s_ovlive', repeat('A', 200), $1)", ["2026-10-05T10:00:00Z"]);
  await v2({
    kind: "heartbeat", event_id: "hb:s_ovlive:1", session_id: "s_ovlive", subject: "Toerisme", task: "Wisselkoers", status: "warned",
    warnings: 1, total_warnings: 1, planned_min: 25, started_at: T("2026-10-05T10:50:00Z"), client_at: T("2026-10-05T11:03:00Z"),
    visible: true, focused: false, idle: false, visible_ms: 600000, focused_ms: 400000, hidden_ms: 0, idle_ms: 0, left_ms: 900000
  });
  await db.query("update wallie911.devices set last_sync_at = '2026-09-01T00:00:00Z' where device_id <> 'd_pa'");
  await db.query("update wallie911.devices set last_sync_at = $1 where device_id = 'd_pa'", ["2026-10-05T11:03:30Z"]);

  /* "Nou" = Ma 5 Okt 13:05 SAST (11:05Z): Engels 2 se tyd is verby; Toerisme loop */
  const o = await ov("2026-10-05", "2026-10-05T11:05:00Z");
  ok(o.ok && o.day === "2026-10-05" && o.week_start === "2026-10-05" && o.week_end === "2026-10-11", "week = Ma-So");
  eq(
    o.blocks.map((b) => [b.id, b.status]),
    [["2026-10-05-warm", "done"], ["2026-10-05-eng1", "partial"], ["2026-10-05-eng2", "missed"], ["2026-10-05-rtt", "done"], ["2026-10-05-toer", "done"]],
    "blokke: pouse/slot weggelaat; klaar/gedeeltelik/gemis korrek"
  );
  ok(o.blocks.find((b) => b.id === "2026-10-05-toer").manual === true, "handmatig-klaar gemerk");
  ok(o.blocks.find((b) => b.id === "2026-10-05-rtt").done_min === 50, "sessie sonder blok tel via vak en dag");
  const eng = o.today_by_subject.find((s) => s.subject === "Engels EAT");
  eq(
    { planned: eng.planned, done: eng.done, partial: eng.partial, missed: eng.missed, planned_min: eng.planned_min, done_min: eng.done_min },
    { planned: 2, done: 0, partial: 1, missed: 1, planned_min: 90, done_min: 20 },
    "Engels vandag: 2 gepland, 1 gedeeltelik, 1 gemis"
  );
  const rtt = o.week_by_subject.find((s) => s.subject === "RTT (CAT)");
  eq({ planned: rtt.planned, done: rtt.done, upcoming: rtt.upcoming, missed: rtt.missed }, { planned: 2, done: 1, upcoming: 1, missed: 0 }, "RTT week (Di nog nie verby)");
  const later = await ov("2026-10-06", "2026-10-07T10:00:00Z");
  eq(later.blocks.map((b) => [b.id, b.status]), [["2026-10-06-rtt", "missed"]], "tyd-lose blok gemis as dag verby is");

  ok(o.current?.session_id === "s_ovlive" && o.current.subject === "Toerisme", "lewendige sessie");
  ok(o.current.status === "warned" && o.current.visible === true && o.current.focused === false && o.current.idle === false, "lewendig: sigbaar/fokus/ledig");
  ok(o.current.age_s === 120, "lewendig: ouderdom van laaste sein");
  ok((await ov("2026-10-05", "2026-10-05T11:20:00Z")).current === null, "sessie sonder sein >10 min is nie meer lewendig nie");

  ok(o.sessions.length === 4 && o.sessions.some((s) => s.session_id === "s_ove1" && s.minutes === 20), "sessies van die dag met werklike minute");
  const sv = o.surveys.find((x) => x.session_id === "s_ove1");
  ok(sv && sv.body.includes("Help: Ek was moeg, Pa.") && sv.answers.help_more === "Ek was moeg, Pa.", "survey woordeliks");
  ok(new Date(sv.at).getTime() === T("2026-10-05T07:26:00Z"), "survey se datum/tyd is die toestel se tyd");
  ok(o.surveys.every((x, i, a) => i === 0 || new Date(a[i - 1].at) >= new Date(x.at)), "surveys: nuutste eerste");
  ok(o.problems.some((x) => x.body === "Kamera wil nie aan nie"), "probleme");
  ok(o.stills.some((x) => x.session_id === "s_ovlive"), "still-metadata");
  ok(o.device?.device_id === "d_pa" && new Date(o.device.last_sync_at).getTime() === T("2026-10-05T11:03:30Z"), "toestel se laaste sinkronisering");
  ok(o.events.some((e) => e.kind === "survey"), "gebeure van die dag");

  /* Ou weergawe se rye (v1: geen blok, geen actual_ms; ended_at = sinktyd) gee steeds sinvolle minute */
  await db.query("select public.wallie_ingest($1::jsonb)", [
    JSON.stringify({
      kind: "end", session_id: "s_v1", subject: "Engels EAT", status: "off", outcome: "handmatig", started_at: T("2026-09-28T06:00:00Z"),
      client_at: T("2026-09-28T06:30:00Z"), title: "SESSIE-VERSLAG (teruggevul)", data: { id: "s_v1", durationMin: 30, actualMin: 30 }
    })
  ]);
  const o2 = await ov("2026-09-28", "2026-10-05T11:05:00Z");
  ok(o2.sessions.find((s) => s.session_id === "s_v1")?.minutes === 30, "v1-ry: minute uit end-gebeurtenis, nie uit sinktyd nie");
}

module.exports = { overviewTests };
