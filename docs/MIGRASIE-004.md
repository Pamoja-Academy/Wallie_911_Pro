# Migrasie 004 — event-soort `v3_poging`

## Wat dit doen
`migrations/004_v3_poging.sql` voeg die soort `v3_poging` by die toegelate event-soorte van `public.wallie_ingest_v2`.
Dis die ENIGE verskil met die laaste definisie van die funksie (in `001_wallie_ingest_v2.sql`).

- Net 'n funksie-vervanging (`create or replace function`): geen tabel-DDL, geen insert/update/delete op `wallie911`-tabelle, geen bestaande rye word geraak.
- Herloopbaar (idempotent). Vereis dat 001 reeds toegepas is.
- 'n `v3_poging` word as een gewone ry in `wallie911.events` gestoor (`kind`, `title`, `body`, `data` jsonb, `client_event_id`, `client_at`, `device_id`), ontdubbel op `event_id`. Dit raak geen sessie, lewendige status of presence nie, en tel nie as blok, sessie, survey of probleem in Pa se oorsig nie (dit verskyn net in die dag-gebeurtestroom).
- `data` bevat net: `item_id`, `vak`, `punte_behaal`, `punte_totaal`, `woorde`, `minute_gebruik`, `tyd_min`, `memo_oopgemaak_na_min`. Geen konsep-teks nie.

## Hoe om dit toe te pas (Hanno)
1. Supabase-dashboard, projek, **SQL Editor**, nuwe navraag.
2. Plak die hele inhoud van `migrations/004_v3_poging.sql`.
3. Klik **Run**.

Tot dit toegepas is, weier die bediener `v3_poging` met `bad kind`; Wallie se toestel hou die poging "geparkeer" in die sync-tou (nie in haar aanwyser nie) en probeer elke 30 min weer. Niks gaan verlore nie en niks anders word opgehou nie. Sodra jy dit toepas, lewer dit vanself af.

## Hoe om te toets (sonder om data in te stel)
Kyk of die funksie-bron die nuwe soort bevat (lees-net):

```sql
select position('v3_poging' in pg_get_functiondef('public.wallie_ingest_v2(jsonb)'::regprocedure)) > 0 as het_v3_poging;
```
`true` = toegepas.

Of roep die funksie met 'n soort wat NIE bestaan nie en kyk wat die antwoord is (dit skryf niks nie, want dit word voor enige insert geweier):

```sql
select public.wallie_ingest_v2('{"kind":"nope","event_id":"toets:nie-bestaan"}'::jsonb);
-- verwag: {"ok": false, "error": "bad kind"}
```
STEL EGTER GEEN TOETSDATA IN NIE: moenie `v3_poging` self met 'n toets-`event_id` roep nie, want dit skryf 'n ry in `wallie911.events`.

## Hoe om terug te rol
Pas die vorige funksiedefinisie weer toe: die `create or replace function public.wallie_ingest_v2 ... end $$;`-blok uit `migrations/001_wallie_ingest_v2.sql` (plak dit in die SQL Editor en Run). Rye wat reeds as `v3_poging` gestoor is, bly staan (onskadelik); nuwe sal weer met `bad kind` geweier word en by Wallie "geparkeer" bly.
