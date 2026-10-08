-- Wallie_911 live console: durable events, live presence, webcam stills, Pa login.
-- Tables live in schema wallie911 (NOT exposed by the REST API). The browser only
-- reaches them through the SECURITY DEFINER wallie_* functions in public.
-- Re-runnable on a fresh Supabase project: paste into SQL editor.

create extension if not exists pgcrypto with schema extensions;

create schema if not exists wallie911;
revoke all on schema wallie911 from public, anon, authenticated;

create table if not exists wallie911.live (
  session_id text primary key,
  subject text,
  task text,
  status text not null default 'active',
  warnings int not null default 0,
  total_warnings int not null default 0,
  locks int not null default 0,
  left_ms bigint,
  planned_min int,
  started_at timestamptz,
  last_seen timestamptz not null default now(),
  ended_at timestamptz,
  outcome text
);

create table if not exists wallie911.events (
  id bigserial primary key,
  session_id text,
  kind text not null,
  title text,
  body text,
  data jsonb,
  client_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists events_created_idx on wallie911.events (created_at desc);

create table if not exists wallie911.stills (
  id bigserial primary key,
  session_id text not null,
  jpeg_b64 text not null,
  created_at timestamptz not null default now()
);
create index if not exists stills_session_idx on wallie911.stills (session_id, created_at desc);

create table if not exists wallie911.pa_auth (
  id int primary key default 1 check (id = 1),
  pass_hash text,
  claim_hash text,
  updated_at timestamptz not null default now()
);

create table if not exists wallie911.pa_tokens (
  token_hash text primary key,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists wallie911.login_fail (
  at timestamptz not null default now()
);

alter table wallie911.live enable row level security;
alter table wallie911.events enable row level security;
alter table wallie911.stills enable row level security;
alter table wallie911.pa_auth enable row level security;
alter table wallie911.pa_tokens enable row level security;
alter table wallie911.login_fail enable row level security;

-- ---------- helpers (not callable from the API) ----------

create or replace function wallie911.today_sast() returns date
language sql stable as $$ select (now() at time zone 'Africa/Johannesburg')::date $$;

create or replace function wallie911.pa_ok(p_token text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from wallie911.pa_tokens
    where token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex')
      and expires_at > now()
  )
$$;

create or replace function wallie911.new_token() returns text
language plpgsql security definer set search_path = '' as $$
declare t text := encode(extensions.gen_random_bytes(32), 'hex');
begin
  delete from wallie911.pa_tokens where expires_at < now();
  insert into wallie911.pa_tokens (token_hash, expires_at)
  values (encode(extensions.digest(t, 'sha256'), 'hex'), now() + interval '30 days');
  return t;
end $$;

revoke all on all functions in schema wallie911 from public, anon, authenticated;

-- ---------- Wallie device: write-only ----------

create or replace function public.wallie_ingest(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  k text := p->>'kind';
  sid text := left(p->>'session_id', 64);
begin
  if k is null or k not in ('start','heartbeat','warn','lock','unlock','memo','end','survey','pa-survey','probleem','offline') then
    return jsonb_build_object('ok', false, 'error', 'bad kind');
  end if;
  if length(p::text) > 20000 then
    return jsonb_build_object('ok', false, 'error', 'too big');
  end if;

  if sid is not null and k in ('start','heartbeat','warn','lock','unlock','memo','end') then
    insert into wallie911.live as l (session_id, subject, task, status, warnings, total_warnings, locks,
                                     left_ms, planned_min, started_at, last_seen)
    values (sid, left(p->>'subject', 80), left(p->>'task', 300), coalesce(p->>'status', 'active'),
            coalesce((p->>'warnings')::int, 0), coalesce((p->>'total_warnings')::int, 0),
            coalesce((p->>'locks')::int, 0), (p->>'left_ms')::bigint, (p->>'planned_min')::int,
            coalesce(to_timestamp((p->>'started_at')::bigint / 1000.0), now()), now())
    on conflict (session_id) do update set
      subject = coalesce(excluded.subject, l.subject),
      task = coalesce(excluded.task, l.task),
      status = case when l.ended_at is not null then l.status else excluded.status end,
      warnings = excluded.warnings,
      total_warnings = greatest(l.total_warnings, excluded.total_warnings),
      locks = greatest(l.locks, excluded.locks),
      left_ms = coalesce(excluded.left_ms, l.left_ms),
      planned_min = coalesce(excluded.planned_min, l.planned_min),
      last_seen = now();
    if k = 'end' then
      update wallie911.live set status = 'off', ended_at = now(), outcome = left(p->>'outcome', 40)
      where session_id = sid;
    end if;
  end if;

  if k = 'offline' then
    update wallie911.live set status = 'off', ended_at = coalesce(ended_at, now()), outcome = coalesce(outcome, 'onderbreek')
    where ended_at is null
      and (session_id = sid or (sid is null and last_seen < now() - interval '2 minutes'));
  end if;

  if k <> 'heartbeat' then
    insert into wallie911.events (session_id, kind, title, body, data, client_at)
    values (sid, k, left(p->>'title', 120), left(p->>'body', 4000), p->'data',
            to_timestamp(nullif(p->>'client_at', '')::bigint / 1000.0));
  end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.wallie_still(p_session_id text, p_jpeg_b64 text) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if length(coalesce(p_jpeg_b64, '')) < 100 or length(p_jpeg_b64) > 300000 then
    return jsonb_build_object('ok', false, 'error', 'bad size');
  end if;
  -- Net tydens ’n lewendige sessie
  if not exists (
    select 1 from wallie911.live
    where session_id = p_session_id and ended_at is null and last_seen > now() - interval '2 minutes'
  ) then
    return jsonb_build_object('ok', false, 'error', 'no active session');
  end if;
  insert into wallie911.stills (session_id, jpeg_b64) values (p_session_id, p_jpeg_b64);
  delete from wallie911.stills where created_at < now() - interval '3 days';
  return jsonb_build_object('ok', true);
end $$;

-- ---------- Pa: password + tokens ----------

create or replace function public.wallie_pa_claim(p_code text, p_password text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare a wallie911.pa_auth;
begin
  select * into a from wallie911.pa_auth where id = 1;
  if a.pass_hash is not null then
    return jsonb_build_object('ok', false, 'error', 'already set');
  end if;
  if (select count(*) from wallie911.login_fail where at > now() - interval '15 minutes') >= 10 then
    return jsonb_build_object('ok', false, 'error', 'too many tries');
  end if;
  if a.claim_hash is null or extensions.crypt(coalesce(p_code, ''), a.claim_hash) <> a.claim_hash then
    insert into wallie911.login_fail default values;
    return jsonb_build_object('ok', false, 'error', 'bad code');
  end if;
  if length(coalesce(p_password, '')) < 8 then
    return jsonb_build_object('ok', false, 'error', 'password too short');
  end if;
  update wallie911.pa_auth
  set pass_hash = extensions.crypt(p_password, extensions.gen_salt('bf', 10)), claim_hash = null, updated_at = now()
  where id = 1;
  return jsonb_build_object('ok', true, 'token', wallie911.new_token());
end $$;

create or replace function public.wallie_pa_login(p_password text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare h text;
begin
  if (select count(*) from wallie911.login_fail where at > now() - interval '15 minutes') >= 10 then
    return jsonb_build_object('ok', false, 'error', 'too many tries');
  end if;
  select pass_hash into h from wallie911.pa_auth where id = 1;
  if h is null then
    return jsonb_build_object('ok', false, 'error', 'not set');
  end if;
  if extensions.crypt(coalesce(p_password, ''), h) <> h then
    insert into wallie911.login_fail default values;
    delete from wallie911.login_fail where at < now() - interval '1 day';
    return jsonb_build_object('ok', false, 'error', 'bad password');
  end if;
  return jsonb_build_object('ok', true, 'token', wallie911.new_token());
end $$;

create or replace function public.wallie_pa_logout(p_token text) returns jsonb
language sql security definer set search_path = '' as $$
  delete from wallie911.pa_tokens
  where token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex');
  select jsonb_build_object('ok', true);
$$;

create or replace function public.wallie_pa_change_password(p_token text, p_new text) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if not wallie911.pa_ok(p_token) then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  if length(coalesce(p_new, '')) < 8 then
    return jsonb_build_object('ok', false, 'error', 'password too short');
  end if;
  update wallie911.pa_auth set pass_hash = extensions.crypt(p_new, extensions.gen_salt('bf', 10)), updated_at = now()
  where id = 1;
  -- Alle ander toestelle uitlog
  delete from wallie911.pa_tokens
  where token_hash <> encode(extensions.digest(p_token, 'sha256'), 'hex');
  return jsonb_build_object('ok', true);
end $$;

-- ---------- Pa: read (token-gated) ----------

create or replace function public.wallie_pa_live(p_token text, p_day date default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare d date := coalesce(p_day, wallie911.today_sast());
begin
  if not wallie911.pa_ok(p_token) then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  return jsonb_build_object(
    'ok', true,
    'now', now(),
    'day', d,
    'sessions', coalesce((
      select jsonb_agg(to_jsonb(l) order by l.started_at desc)
      from wallie911.live l
      where (l.started_at at time zone 'Africa/Johannesburg')::date = d
         or (p_day is null and l.ended_at is null and l.last_seen > now() - interval '12 hours')
    ), '[]'::jsonb),
    'events', coalesce((
      select jsonb_agg(jsonb_build_object('id', e.id, 'session_id', e.session_id, 'kind', e.kind, 'title', e.title,
                                          'body', e.body, 'created_at', e.created_at) order by e.created_at desc)
      from (select * from wallie911.events
            where (created_at at time zone 'Africa/Johannesburg')::date = d
            order by created_at desc limit 300) e
    ), '[]'::jsonb),
    'still', (
      select jsonb_build_object('id', s.id, 'session_id', s.session_id, 'created_at', s.created_at)
      from wallie911.stills s
      join wallie911.live l on l.session_id = s.session_id
      where l.ended_at is null
      order by s.created_at desc limit 1
    )
  );
end $$;

create or replace function public.wallie_pa_still(p_token text, p_id bigint) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if not wallie911.pa_ok(p_token) then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  return coalesce((
    select jsonb_build_object('ok', true, 'id', id, 'created_at', created_at, 'jpeg_b64', jpeg_b64)
    from wallie911.stills where id = p_id
  ), jsonb_build_object('ok', false, 'error', 'not found'));
end $$;

revoke all on function public.wallie_ingest(jsonb) from public;
revoke all on function public.wallie_still(text, text) from public;
revoke all on function public.wallie_pa_claim(text, text) from public;
revoke all on function public.wallie_pa_login(text) from public;
revoke all on function public.wallie_pa_logout(text) from public;
revoke all on function public.wallie_pa_change_password(text, text) from public;
revoke all on function public.wallie_pa_live(text, date) from public;
revoke all on function public.wallie_pa_still(text, bigint) from public;

grant execute on function public.wallie_ingest(jsonb) to anon, authenticated;
grant execute on function public.wallie_still(text, text) to anon, authenticated;
grant execute on function public.wallie_pa_claim(text, text) to anon, authenticated;
grant execute on function public.wallie_pa_login(text) to anon, authenticated;
grant execute on function public.wallie_pa_logout(text) to anon, authenticated;
grant execute on function public.wallie_pa_change_password(text, text) to anon, authenticated;
grant execute on function public.wallie_pa_live(text, date) to anon, authenticated;
grant execute on function public.wallie_pa_still(text, bigint) to anon, authenticated;

insert into wallie911.pa_auth (id) values (1) on conflict (id) do nothing;
-- Eenmalige eis-kode (nie in die repo nie):
--   update wallie911.pa_auth set claim_hash = extensions.crypt('<KODE>', extensions.gen_salt('bf', 10)) where id = 1;
