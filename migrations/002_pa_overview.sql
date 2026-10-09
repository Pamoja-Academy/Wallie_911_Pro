-- 002_pa_overview.sql
-- Databasisverandering (benodig Hanno se OK). NIE outomaties toegepas nie. Vereis 001_wallie_ingest_v2.sql eers.
--
-- Wat dit doen (Pa-konsole, alles bediener-kant):
--   * wallie911.plan: Wallie se toestel stuur sy rooster (blokke per dag) via wallie_ingest_plan.
--   * public.wallie_ingest_plan(p jsonb): skryf-net, soos wallie_ingest_v2 (anon-sleutel, gee net ok/fout).
--   * public.wallie_pa_overview(p_token, p_day, p_at): lees, vereis Pa se wagwoord-token. Gee in een oproep:
--       - current:   lewendige sessie (besig? vak, sedert wanneer, sigbaar/gefokus/ledig, laaste sein)
--       - today/week: rooster teenoor werklikheid per vak en per blok: gepland / klaar / gedeeltelik / gemis
--       - sessions:  sessies van die gekose dag
--       - surveys:   ALLE survey-terugvoer woordeliks met datum en tyd (nuutste eerste)
--       - problems:  probleem-rapporte
--       - stills:    kamera-foto's (metadata; die beeld self via wallie_pa_still)
--       - device:    toestel se laaste suksesvolle sinkronisering
--       - events:    gebeure van die gekose dag
--   "Klaar" = blok het >= 75% van sy beplande minute (via sessies wat aan die blok gekoppel is, of sessies van
--   dieselfde vak en dag sonder blok), of Wallie het dit self as klaar gemerk. "Gemis" = tyd verby (of dag verby
--   as die blok geen tyd het nie) en niks gedoen nie.
--   p_at is net vir toetse (nagemaakte "nou"); die app stuur dit nooit.
-- Herloopbaar (idempotent).

begin;

do $$
begin
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'wallie911' and table_name = 'live' and column_name = 'block_id') then
    raise exception 'Pas eers migrations/001_wallie_ingest_v2.sql toe';
  end if;
end $$;

create table if not exists wallie911.plan (
  day date primary key,
  blocks jsonb not null,
  plan_hash text,
  client_at timestamptz not null,
  received_at timestamptz not null default now()
);
alter table wallie911.plan enable row level security;

create or replace function public.wallie_ingest_plan(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  d date;
  h text := left(p->>'plan_hash', 64);
  at timestamptz := least(coalesce(wallie911.ms_ts(p->>'client_at'), now()), now() + interval '5 minutes');
  cur wallie911.plan;
begin
  if length(p::text) > 20000 then return jsonb_build_object('ok', false, 'error', 'too big'); end if;
  if coalesce(p->>'day', '') !~ '^\d{4}-\d{2}-\d{2}$' then return jsonb_build_object('ok', false, 'error', 'bad day'); end if;
  d := (p->>'day')::date;
  if d < (now() - interval '400 days')::date or d > (now() + interval '400 days')::date then
    return jsonb_build_object('ok', false, 'error', 'bad day');
  end if;
  if jsonb_typeof(p->'blocks') <> 'array' or jsonb_array_length(p->'blocks') > 40 then
    return jsonb_build_object('ok', false, 'error', 'bad blocks');
  end if;
  select * into cur from wallie911.plan where day = d;
  if found and cur.plan_hash is not distinct from h then
    return jsonb_build_object('ok', true, 'duplicate', true);
  end if;
  insert into wallie911.plan as pl (day, blocks, plan_hash, client_at) values (d, p->'blocks', h, at)
  on conflict (day) do update set blocks = excluded.blocks, plan_hash = excluded.plan_hash,
    client_at = excluded.client_at, received_at = now()
  where pl.client_at <= excluded.client_at;
  return jsonb_build_object('ok', true, 'duplicate', false);
end $$;

create or replace function public.wallie_pa_overview(p_token text, p_day date default null, p_at timestamptz default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  nowt timestamptz := coalesce(p_at, now());
  tz constant text := 'Africa/Johannesburg';
  today date := (nowt at time zone tz)::date;
  d date := coalesce(p_day, today);
  w0 date := date_trunc('week', d::timestamp)::date;   -- Maandag
  w1 date := date_trunc('week', d::timestamp)::date + 6;
  res jsonb;
begin
  if not wallie911.pa_ok(p_token) then return jsonb_build_object('ok', false, 'error', 'auth'); end if;

  with
  sess as (
    select l.*, (l.started_at at time zone tz)::date as sday,
      coalesce(
        l.actual_ms,
        (select wallie911.safe_big(coalesce(e.data->>'actualMin', e.data->>'durationMin')) * 60000
           from wallie911.events e where e.kind = 'end' and e.session_id = l.session_id order by e.id limit 1),
        least(extract(epoch from (coalesce(l.ended_at, l.last_seen) - l.started_at)) * 1000, 8 * 3600000)
      )::bigint as ms
    from wallie911.live l
    where (l.started_at at time zone tz)::date between w0 and w1
  ),
  blocks as (
    select p.day, o.ord, o.b->>'id' as id, o.b->>'subject' as subject, o.b->>'subject_slug' as slug,
           o.b->>'title' as title, o.b->>'kind' as kind, coalesce(wallie911.safe_int(o.b->>'minutes'), 0) as minutes,
           nullif(o.b->>'start', '') as st, nullif(o.b->>'end', '') as en
    from wallie911.plan p
    cross join lateral jsonb_array_elements(p.blocks) with ordinality as o(b, ord)
    where p.day between w0 and w1 and coalesce(o.b->>'kind', '') not in ('break', 'slot')
  ),
  direct as (
    select b.id, coalesce(sum(s.ms), 0) / 60000.0 as m
    from blocks b left join sess s on s.block_id = b.id group by b.id
  ),
  pool as (
    select s.sday, s.subject, sum(s.ms) / 60000.0 as m
    from sess s where s.block_id is null or s.block_id not in (select id from blocks) group by 1, 2
  ),
  need as (
    select b.*, dr.m as direct_m,
      greatest(0, b.minutes - dr.m) as need_m,
      coalesce(sum(greatest(0, b.minutes - dr.m)) over (
        partition by b.day, b.subject order by b.ord rows between unbounded preceding and 1 preceding), 0) as need_before,
      coalesce(pl.m, 0) as pool_m
    from blocks b join direct dr on dr.id = b.id
    left join pool pl on pl.sday = b.day and pl.subject = b.subject
  ),
  graded as (
    select n.*,
      n.direct_m + least(n.need_m, greatest(0, n.pool_m - n.need_before)) as done_m,
      exists (select 1 from wallie911.events e where e.kind = 'block' and e.block_id = n.id) as manual,
      case when n.en is not null then ((n.day::text || ' ' || n.en)::timestamp at time zone tz) < nowt
           else n.day < today end as over
    from need n
  ),
  fin as (
    select g.*,
      case when g.manual or g.done_m >= 0.75 * g.minutes then 'done'
           when g.done_m > 0 then 'partial'
           when g.over then 'missed'
           else 'planned' end as status
    from graded g
  ),
  subj_today as (
    select subject, count(*) planned, count(*) filter (where status = 'done') done,
           count(*) filter (where status = 'partial') partial, count(*) filter (where status = 'missed') missed,
           count(*) filter (where status = 'planned') upcoming, sum(minutes) planned_min,
           round(sum(least(done_m, minutes)))::int done_min
    from fin where day = d group by subject
  ),
  subj_week as (
    select subject, count(*) planned, count(*) filter (where status = 'done') done,
           count(*) filter (where status = 'partial') partial, count(*) filter (where status = 'missed') missed,
           count(*) filter (where status = 'planned') upcoming, sum(minutes) planned_min,
           round(sum(least(done_m, minutes)))::int done_min
    from fin group by subject
  ),
  per_day as (
    select day, count(*) planned, count(*) filter (where status = 'done') done,
           count(*) filter (where status = 'partial') partial, count(*) filter (where status = 'missed') missed
    from fin group by day
  ),
  week_sessions as (
    select subject, round(sum(ms) / 60000.0)::int minutes, count(*) n from sess group by subject
  )
  select jsonb_build_object(
    'ok', true,
    'now', nowt,
    'day', d,
    'today', today,
    'week_start', w0,
    'week_end', w1,
    'current', (
      select jsonb_build_object('session_id', l.session_id, 'subject', l.subject, 'subject_slug', l.subject_slug,
        'task', l.task, 'status', l.status, 'started_at', l.started_at, 'last_seen', l.last_seen,
        'age_s', greatest(0, round(extract(epoch from (nowt - l.last_seen)))::int), 'left_ms', l.left_ms, 'planned_min', l.planned_min,
        'warnings', l.warnings, 'total_warnings', l.total_warnings, 'locks', l.locks, 'block', l.block,
        'visible', l.visible, 'focused', l.focused, 'idle', l.idle,
        'visible_ms', l.visible_ms, 'focused_ms', l.focused_ms, 'hidden_ms', l.hidden_ms, 'idle_ms', l.idle_ms)
      from wallie911.live l
      where l.ended_at is null and l.last_seen > nowt - interval '10 minutes'
      order by l.last_seen desc limit 1),
    'plan_received', exists (select 1 from blocks where day = d),
    'blocks', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'subject', subject, 'subject_slug', slug,
        'title', title, 'kind', kind, 'start', st, 'end', en, 'minutes', minutes, 'status', status,
        'done_min', round(done_m)::int, 'manual', manual) order by ord) from fin where day = d), '[]'::jsonb),
    'today_by_subject', coalesce((select jsonb_agg(to_jsonb(t) order by t.subject) from subj_today t), '[]'::jsonb),
    'week_by_subject', coalesce((select jsonb_agg(to_jsonb(w) || jsonb_build_object(
        'session_min', coalesce(ws.minutes, 0), 'sessions', coalesce(ws.n, 0)) order by w.subject)
      from subj_week w left join week_sessions ws on ws.subject = w.subject), '[]'::jsonb),
    'week_days', coalesce((select jsonb_agg(to_jsonb(x) order by x.day) from per_day x), '[]'::jsonb),
    'sessions', coalesce((select jsonb_agg(jsonb_build_object('session_id', s.session_id, 'subject', s.subject,
        'task', s.task, 'status', s.status, 'started_at', s.started_at, 'ended_at', s.ended_at, 'last_seen', s.last_seen,
        'outcome', s.outcome, 'minutes', round(s.ms / 60000.0)::int, 'planned_min', s.planned_min,
        'warnings', s.total_warnings, 'locks', s.locks, 'block_id', s.block_id) order by s.started_at desc)
      from sess s where s.sday = d), '[]'::jsonb),
    'surveys', coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'kind', e.kind, 'session_id', e.session_id,
        'subject', e.subject, 'at', coalesce(e.client_at, e.created_at), 'backfill', e.backfill, 'title', e.title,
        'body', e.body, 'answers', e.data->'answers') order by coalesce(e.client_at, e.created_at) desc)
      from (select * from wallie911.events where kind in ('survey', 'pa-survey')
            order by coalesce(client_at, created_at) desc limit 300) e), '[]'::jsonb),
    'problems', coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'at', coalesce(e.client_at, e.created_at),
        'title', e.title, 'body', e.body) order by coalesce(e.client_at, e.created_at) desc)
      from (select * from wallie911.events where kind = 'probleem'
            order by coalesce(client_at, created_at) desc limit 100) e), '[]'::jsonb),
    'stills', coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'session_id', s.session_id,
        'created_at', s.created_at) order by s.created_at desc)
      from (select id, session_id, created_at from wallie911.stills order by created_at desc limit 40) s), '[]'::jsonb),
    'device', (select to_jsonb(dv) || jsonb_build_object('age_s', round(extract(epoch from (nowt - dv.last_sync_at)))::int)
               from wallie911.devices dv order by dv.last_sync_at desc limit 1),
    'events', coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'session_id', e.session_id, 'kind', e.kind,
        'title', e.title, 'body', e.body, 'created_at', coalesce(e.client_at, e.created_at)) order by coalesce(e.client_at, e.created_at) desc)
      from (select * from wallie911.events
            where (coalesce(client_at, created_at) at time zone tz)::date = d
            order by coalesce(client_at, created_at) desc limit 300) e), '[]'::jsonb)
  ) into res;
  return res;
end $$;

revoke all on function public.wallie_ingest_plan(jsonb) from public;
revoke all on function public.wallie_pa_overview(text, date, timestamptz) from public;
grant execute on function public.wallie_ingest_plan(jsonb) to anon, authenticated;
grant execute on function public.wallie_pa_overview(text, date, timestamptz) to anon, authenticated;

commit;

notify pgrst, 'reload schema';
