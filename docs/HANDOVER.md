# HANDOVER — Wallie_911_Pro (27 Sep 2026)

**Fresh chat:** oop eers `docs/CHECKPOINT-FRESH-CHAT.md` (tip `da8b045`), dan hierdie lêer.

## Produkt
Afrikaanse matric SOS-cockpit vir Wallie (#15 Springbok narratief). Hard-proctor + Pa afstand via ntfy.

## Kontakte
- Wallie e-pos: `wallievanzyl356@gmail.com`
- Wallie WhatsApp: `068 376 8239` (+27 68 376 8239)
- Pa (Hanno): `hannovz@gmail.com`

## KEEP pad
`C:\Users\User\Projects\Wallie_911_Pro` · GitHub `Pamoja-Academy/Wallie_911_Pro` · branch `master`

## Live (WERK — toets 27 Sep)
- **App (geen Node):** https://pamoja-academy.github.io/Wallie_911_Pro/
- **Pa briefing + gameplan + aftelling:** https://pamoja-academy.github.io/Wallie_911_Pro/pa-briefing.html
- **Pa afstand:** https://pamoja-academy.github.io/Wallie_911_Pro/pa-afstand.html
- **Zip release:** https://github.com/Pamoja-Academy/Wallie_911_Pro/releases/download/wallie-laptop-v1/Wallie_911_Pro-VIR-SY-LAPTOP.zip
- ntfy topic (Pa foon): `wallie911-pa-15sos-hanno`
- **Openingswedstryd / Matriek eindeksamen:** 12 Okt 2026 09:00 (stadium-klok op Missie + briefing)

## Wat Wallie nou moet doen
Hy het Node NIET. Hy het ’n **stukkende/verkortte GitHub-URL** oopgemaak → “Not Found”.
**Moenie zip/Node eers probeer nie.** Stuur net:

> Oop hierdie EXACTE skakel in Chrome/Edge (kopieer heeltemal):  
> https://pamoja-academy.github.io/Wallie_911_Pro/  
> Merk waarneming-kassie → Missie → Begin. PIN 9110.

## Tegnies
- Static HTML/JS; `localStorage` key `wallie911_v2_bok`
- Remote: `assets/js/remote.js` → ntfy heartbeats + reports (video bly plaaslik)
- `START-HIER.bat` sonder Node → oop Pages HTTPS (commit `1d9c6d3`)
- Supabase gratis-limiet vol — nie gebruik; ntfy pad

## Pa TODO
1. ntfy app → subscribe `wallie911-pa-15sos-hanno`
2. Bookmark pa-afstand.html
3. WhatsApp Wallie die Pages-skakel (nie verkortte github.com zip-pad)

## Moenie
- OneDrive as Wallie-pad (hy het nie)
- file:// index.html as primêr (kamera swak)
- Justice4Me/BICS Supabase vir Wallie data

## Design-tool (Penpot — in progress 27 Sep)
- Figma MCP Starter+View kwota vol → **Penpot Cloud + Cursor MCP**
- Checkpoint: `docs/CHECKPOINT-2026-09-27-penpot.md`
- Spes: `docs/superpowers/specs/2026-09-27-penpot-cloud-mcp-design.md`
- Plan: `docs/superpowers/plans/2026-09-27-penpot-cloud-mcp.md`
- **Pa doen nou (BLOKKEERDER):** Login by https://design.penpot.app → dan `docs/PENPOT-SETUP.md` (MCP key → Cursor → plugin Connected). Penpot is nog NIE in `%USERPROFILE%\.cursor\mcp.json` nie.
- Example config (geen secrets): `docs/penpot-mcp.json.example`
- Ná Connected: nuwe chat → “bou Missie-skerm in oop Penpot-lêer”
