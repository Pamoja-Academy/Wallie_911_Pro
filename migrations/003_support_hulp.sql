-- 2026-10-14a: wallie911.support pas by die Hulp-paneel (hulp.js) se INSERT.
-- Slegs byvoegend. Herloopbaar. Reeds lewendig toegepas (Supabase-migrasie wallie911_support_hulp_columns).
create schema if not exists wallie911;
create table if not exists wallie911.support (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  category text,
  message text,
  app_version text,
  ua text,
  context jsonb,
  status text not null default 'new'
);
alter table wallie911.support add column if not exists vak text;
alter table wallie911.support add column if not exists gebeur text;
alter table wallie911.support add column if not exists skerm text;
alter table wallie911.support alter column status set default 'new';
alter table wallie911.support enable row level security;
grant usage on schema wallie911 to anon, authenticated;
grant insert on wallie911.support to anon, authenticated;
drop policy if exists support_anon_insert on wallie911.support;
create policy support_anon_insert on wallie911.support for insert to anon, authenticated with check (true);

create or replace function wallie911.support_fill() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.category is null then new.category := new.vak; end if;
  if new.message is null then new.message := new.gebeur; end if;
  if new.skerm is not null then new.context := coalesce(new.context, '{}'::jsonb) || jsonb_build_object('skerm', new.skerm); end if;
  return new;
end $$;
revoke all on function wallie911.support_fill() from public;
drop trigger if exists support_fill on wallie911.support;
create trigger support_fill before insert on wallie911.support for each row execute function wallie911.support_fill();

-- PostgREST moet die skema wys (Content-Profile: wallie911). Net op Supabase (rol authenticator bestaan).
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'authenticator') then
    execute $q$alter role authenticator set pgrst.db_schemas = 'public, graphql_public, wallie911'$q$;
    perform pg_notify('pgrst', 'reload config');
  end if;
end $$;
