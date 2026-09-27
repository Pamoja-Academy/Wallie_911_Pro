# Plan: Penpot Cloud + Cursor MCP (Wallie design)

**Spec:** `docs/superpowers/specs/2026-09-27-penpot-cloud-mcp-design.md`  
**Goal:** Pa kan sonder Figma-kwota via Cursor + Penpot skerms ontwerp.  
**Engineer note:** Pa is nie ’n developer — elke taak is klik-pad + docs; geen Docker.

## Files

| File | Role |
|------|------|
| `docs/PENPOT-SETUP.md` | Pa klik-checklist (Afrikaans) |
| `docs/penpot-mcp.json.example` | Cursor MCP snippet **sonder** secrets |
| `pa-briefing.html` | Kort skakel na Penpot-setup |
| `docs/HANDOVER.md` | Status: implementering / wag Pa MCP key |
| Spec status | Merk “implementing” |

## Tasks

### Task 1: Pa checklist + example MCP config
- Skryf `docs/PENPOT-SETUP.md` (stappe 1–7 soos spes §6)
- Skryf `docs/penpot-mcp.json.example` met placeholder URL
- Commit

### Task 2: Briefing + handover
- Skakel in `pa-briefing.html` + `docs/HANDOVER.md`
- Commit

### Task 3: Pa account + MCP key (mens)
- Pa: login https://design.penpot.app
- Pa: nuwe lêer `Wallie_911_Pro — Design`
- Pa: Integrations → MCP → enable → kopieer config
- Pa: plak in Cursor Settings → Tools & MCPs (of `%USERPROFILE%\.cursor\mcp.json`)
- Pa: in lêer → Plugins → MCP plugin → Connect
- **Done when:** Cursor wys Penpot MCP enabled; plugin sê Connected

### Task 4: Agent bou Missie-frame
- Met plugin Connected: agent lees Penpot file, skep Missie-skerm (stadium-klok)
- Verwys: lewende Pages + `assets/css/app.css` tokens
- **Done when:** Pa sien frame in Penpot browser

### Task 5: Smoke
- [ ] Geen MCP key in git
- [ ] Pages-app onveranderd tensy eksplisiete HTML-taak
- [ ] HANDOVER wys “Penpot MCP gekoppel” of “wag key”

## Stop / handoff
As Task 3 nie klaar is nie (geen key), stop ná Task 2 met duidelike Pa-aksies.
