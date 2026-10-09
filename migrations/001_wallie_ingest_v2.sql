-- 001_wallie_ingest_v2.sql
-- Databasisverandering (benodig Hanno se OK). NIE outomaties toegepas nie.
--
-- Wat dit doen:
--   * public.wallie_ingest_v2(p jsonb): soos wallie_ingest, maar
--       - ontdubbel op p.event_id (herstuur / terugvul tel nooit dubbel nie)
--       - gebruik die toestel se tyd (client_at / started_at / ended_at), nie net now() nie,
--         sodat teruggevulde sessies op die regte dag en tyd verskyn
--       - ken nuwe soorte: idle, active, visibility, block
--       - stoor elke 60 s-hartklop (sigbaar / fokus / ledig) in wallie911.presence
--       - hou die toestel se laaste sinkronisering by in wallie911.devices (vir Pa se konsole)
--   * Bestaande rye kry 'n client_event_id (uit data._event_id of afgelei), sodat gebeure wat
--     reeds via die ou wallie_ingest aangekom het, nie weer ingevoeg word nie.
--
-- Die app werk met OF sonder hierdie migrasie: as wallie_ingest_v2 nie bestaan nie, val dit terug
-- na wallie_ingest en hou die nuwe soorte in die tou tot hierdie migrasie toegepas is.
-- Herloopbaar (idempotent).

begin;

-- ---------- helpers ----------

create or replace function wallie911.ms_ts(v text) returns timestamptz
language sql immutable set search_path = '' as $$
  select case when v ~ '^\d{10,16}(\.\d+)?$' then to_timestamp(v::numeric / 1000.0) end
$$;

create or replace function wallie911.safe_int(v text) returns int
language sql immutable set search_path = '' as $$
  select case when v ~ '^-?\d{1,9}(\.\d+)?$' then round(v::numeric)::int end
$$;

create or replace function wallie911.safe_big(v text) returns bigint
language sql immutable set search_path = '' as $$
  select case when v ~ '^-?\d{1,15}(\.\d+)?$' then round(v::numeric)::bigint end
$$;

revoke all on function wallie911.ms_ts(text) from public, anon, authenticated;
revoke all on function wallie911.safe_int(text) from public, anon, authenticated;
revoke all on function wallie911.safe_big(text) from public, anon, authenticated;

-- ---------- skema-uitbreidings ----------

alter table wallie911.events add column if not exists client_event_id text;
alter table wallie911.events add column if not exists device_id text;
alter table wallie911.events add column if not exists backfill boolean not null default false;
alter table wallie911.events add column if not exists subject text;
alter table wallie911.events add column if not exists block_id text;

alter table wallie911.live add column if not exists subject_slug text;
alter table wallie911.live add column if not exists block_id text;
alter table wallie911.live add column if not exists block jsonb;
alter table wallie911.live add column if not exists actual_ms bigint;
alter table wallie911.live add column if not exists visible boolean;
alter table wallie911.live add column if not exists focused boolean;
alter table wallie911.live add column if not exists idle boolean;
alter table wallie911.live add column if not exists visible_ms bigint;
alter table wallie911.live add column if not exists focused_ms bigint;
alter table wallie911.live add column if not exists hidden_ms bigint;
alter table wallie911.live add column if not exists idle_ms bigint;
alter table wallie911.live add column if not exists device_id text;

create table if not exists wallie911.presence (
  event_id text primary key,
  session_id text not null,
  client_at timestamptz not null,
  status text,
  visible boolean,
  focused boolean,
  idle boolean,
  visible_ms bigint,
  focused_ms bigint,
  hidden_ms bigint,
  idle_ms bigint,
  left_ms bigint,
  received_at timestamptz not null default now()
);
create index if not exists presence_session_idx on wallie911.presence (session_id, client_at);
alter table wallie911.presence enable row level security;

create table if not exists wallie911.devices (
  device_id text primary key,
  app_version text,
  first_seen timestamptz not null default now(),
  last_sync_at timestamptz not null default now(),
  last_client_at timestamptz,
  events_received bigint not null default 0
);
alter table wallie911.devices enable row level security;

-- Bestaande rye: herwin of lei event_id af (dieselfde formaat as sync.js)
update wallie911.events e set client_event_id = coalesce(
    e.data->>'_event_id',
    case
      when e.kind = 'end' and coalesce(e.data->>'sessionId', e.session_id) is not null
        then 'end:' || coalesce(e.data->>'sessionId', e.session_id)
      when e.kind = 'start' and e.session_id is not null then 'start:' || e.session_id
      when e.kind in ('survey', 'pa-survey', 'probleem') and e.data->>'id' is not null
        then e.kind || ':' || (e.data->>'id')
    end)
where e.client_event_id is null;

-- Duplikate (as daar is) behou net die eerste ry se id
with d as (
  select id, row_number() over (partition by client_event_id order by id) rn
  from wallie911.events where client_event_id is not null
)
update wallie911.events e set client_event_id = null from d where d.id = e.id and d.rn > 1;

create unique index if not exists events_client_event_uidx
  on wallie911.events (client_event_id) where client_event_id is not null;
create index if not exists events_session_idx on wallie911.events (session_id, created_at);

-- ---------- die nuwe ingest ----------

create or replace function public.wallie_ingest_v2(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  k text := p->>'kind';
  eid text := left(p->>'event_id', 160);
  sid text := left(p->>'session_id', 64);
  dev text := left(p->>'device_id', 64);
  at timestamptz := least(coalesce(wallie911.ms_ts(p->>'client_at'), now()), now() + interval '5 minutes');
  started timestamptz := wallie911.ms_ts(p->>'started_at');
  ended timestamptz := wallie911.ms_ts(p->>'ended_at');
  dup boolean := false;
begin
  if k is null or k not in ('start','heartbeat','warn','lock','unlock','memo','end','survey','pa-survey',
                            'probleem','offline','idle','active','visibility','block') then
    return jsonb_build_object('ok', false, 'error', 'bad kind');
  end if;
  if eid is null or length(eid) < 3 then
    return jsonb_build_object('ok', false, 'error', 'no event_id');
  end if;
  if length(p::text) > 20000 then
    return jsonb_build_object('ok', false, 'error', 'too big');
  end if;

  if dev is not null then
    insert into wallie911.devices as d (device_id, app_version, last_client_at, events_received)
    values (dev, left(p->>'app_version', 40), at, 1)
    on conflict (device_id) do update set
      app_version = coalesce(excluded.app_version, d.app_version),
      last_sync_at = now(),
      last_client_at = greatest(d.last_client_at, excluded.last_client_at),
      events_received = d.events_received + 1;
  end if;

  if k = 'heartbeat' then
    if sid is null then return jsonb_build_object('ok', false, 'error', 'no session'); end if;
    insert into wallie911.presence (event_id, session_id, client_at, status, visible, focused, idle,
                                    visible_ms, focused_ms, hidden_ms, idle_ms, left_ms)
    values (eid, sid, at, left(p->>'status', 20), (p->>'visible')::boolean, (p->>'focused')::boolean,
            (p->>'idle')::boolean, wallie911.safe_big(p->>'visible_ms'), wallie911.safe_big(p->>'focused_ms'),
            wallie911.safe_big(p->>'hidden_ms'), wallie911.safe_big(p->>'idle_ms'), wallie911.safe_big(p->>'left_ms'))
    on conflict (event_id) do nothing;
    dup := not found;
  else
    if exists (select 1 from wallie911.events where client_event_id = eid) then
      return jsonb_build_object('ok', true, 'duplicate', true);
    end if;
  end if;

  -- Lewendige sessie-ry (ook vir teruggevulde sessies)
  if sid is not null and k in ('start','heartbeat','warn','lock','unlock','memo','end','idle','active','visibility') then
    insert into wallie911.live as l (session_id, subject, subject_slug, task, status, warnings, total_warnings, locks,
                                     left_ms, planned_min, started_at, last_seen, block_id, block, device_id)
    values (sid, left(p->>'subject', 80), left(p->>'subject_slug', 40), left(p->>'task', 300),
            coalesce(left(p->>'status', 20), 'active'),
            coalesce(wallie911.safe_int(p->>'warnings'), 0), coalesce(wallie911.safe_int(p->>'total_warnings'), 0),
            coalesce(wallie911.safe_int(p->>'locks'), 0), wallie911.safe_big(p->>'left_ms'),
            wallie911.safe_int(p->>'planned_min'), coalesce(started, at), least(at, now()),
            left(p->>'block_id', 80), p->'block', dev)
    on conflict (session_id) do update set
      subject = coalesce(excluded.subject, l.subject),
      subject_slug = coalesce(excluded.subject_slug, l.subject_slug),
      task = coalesce(excluded.task, l.task),
      -- 'n ou (herstuurde) hartklop mag nie 'n nuwer status oorskryf of 'n klaar sessie laat herleef nie
      status = case when l.ended_at is not null then l.status
                    when excluded.last_seen >= l.last_seen then excluded.status else l.status end,
      warnings = case when excluded.last_seen >= l.last_seen then excluded.warnings else l.warnings end,
      total_warnings = greatest(l.total_warnings, excluded.total_warnings),
      locks = greatest(l.locks, excluded.locks),
      left_ms = case when excluded.last_seen >= l.last_seen then coalesce(excluded.left_ms, l.left_ms) else l.left_ms end,
      planned_min = coalesce(excluded.planned_min, l.planned_min),
      started_at = least(l.started_at, excluded.started_at),
      last_seen = greatest(l.last_seen, excluded.last_seen),
      block_id = coalesce(excluded.block_id, l.block_id),
      block = coalesce(excluded.block, l.block),
      device_id = coalesce(excluded.device_id, l.device_id);

    update wallie911.live set
      visible = coalesce((p->>'visible')::boolean, visible),
      focused = coalesce((p->>'focused')::boolean, focused),
      idle = coalesce((p->>'idle')::boolean, idle),
      visible_ms = greatest(visible_ms, wallie911.safe_big(p->>'visible_ms')),
      focused_ms = greatest(focused_ms, wallie911.safe_big(p->>'focused_ms')),
      hidden_ms = greatest(hidden_ms, wallie911.safe_big(p->>'hidden_ms')),
      idle_ms = greatest(idle_ms, wallie911.safe_big(p->>'idle_ms'))
    where session_id = sid and (p ? 'visible_ms');

    if k = 'end' then
      update wallie911.live set
        status = 'off',
        ended_at = coalesce(ended, at),
        outcome = left(p->>'outcome', 40),
        actual_ms = coalesce(wallie911.safe_big(p->>'actual_ms'), wallie911.safe_big(p->>'duration_min') * 60000)
      where session_id = sid;
    end if;
  end if;

  if k = 'offline' then
    update wallie911.live set status = 'off', ended_at = coalesce(ended_at, at), outcome = coalesce(outcome, 'onderbreek')
    where ended_at is null and session_id = sid;
  end if;

  if k <> 'heartbeat' then
    insert into wallie911.events (session_id, kind, title, body, data, client_at, client_event_id, device_id,
                                  backfill, subject, block_id)
    values (sid, k, left(p->>'title', 120), left(p->>'body', 4000), p->'data', at, eid, dev,
            coalesce((p->>'backfill')::boolean, false), left(p->>'subject', 80), left(p->>'block_id', 80))
    on conflict (client_event_id) where client_event_id is not null do nothing;
    dup := not found;
  end if;

  return jsonb_build_object('ok', true, 'duplicate', dup);
end $$;

revoke all on function public.wallie_ingest_v2(jsonb) from public;
grant execute on function public.wallie_ingest_v2(jsonb) to anon, authenticated;

commit;

-- PostgREST moet die nuwe funksie sien
notify pgrst, 'reload schema';
