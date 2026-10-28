-- 005: Pa mag wallie911.support LEES.
--
-- NOG NIE TOEGEPAS NIE. AGENTS.md §2.2 verbied 'n agent om 'n migrasie te loop; net Hanno pas dit toe.
-- Dit is NIE 'n blokker vir die foutvanger nie: elke melding gaan ook as 'n `probleem`-event deur
-- wallie_ingest_v2 (reeds 'n bekende soort), en dáárdie pad is wat Pa se konsole wys. Hierdie
-- migrasie maak net die ROU rekord in `support` leesbaar, vir 'n latere "alle meldings"-bladsy.
--
-- Agtergrond (28 Okt 2026, docs/SPEK-FOUTVANGER-2026-10-28.md §1 F2/F3): migrasie 003 gee
-- anon/authenticated SLEGS insert op wallie911.support. Daar is geen SELECT-beleid nie, dus kan
-- niemand — ook nie Pa nie — die meldings lees. Elke melding sedert 14 Okt lê daar ongelees.
--
-- Slegs byvoegend. Herloopbaar. Dit verander geen data nie en gee niemand skryfregte nie.

create schema if not exists wallie911;

-- Lees is net vir 'n aangemelde rol (`authenticated`), nooit vir `anon` nie: Wallie se app gebruik
-- die anon-sleutel en het geen rede om ander se meldings te lees nie.
drop policy if exists support_authenticated_select on wallie911.support;
create policy support_authenticated_select on wallie911.support
  for select to authenticated using (true);

grant select on wallie911.support to authenticated;

-- PostgREST moet die nuwe beleid in sy kas kry, anders bly 'n SELECT 'n 401/404.
notify pgrst, 'reload schema';

-- Nagaan ná die toepassing (verwag een ry per melding sedert 14 Okt):
--   select created_at, vak, skerm, left(gebeur, 80) as gebeur, app_version, status
--   from wallie911.support order by created_at desc limit 50;
