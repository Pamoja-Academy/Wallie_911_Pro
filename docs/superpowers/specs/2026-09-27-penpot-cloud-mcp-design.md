# Design: Penpot Cloud + Cursor MCP (Figma-alternatief)

**Datum:** 2026-09-27  
**Produk-konteks:** Wallie_911_Pro (matric SOS cockpit)  
**Status:** Goedgekeur deur “gaan voort” — **implementering** (docs + Pa setup; wag MCP Connected)  
**Checkpoint:** `docs/CHECKPOINT-2026-09-27-penpot.md` @ `5f069b9`

## 1. Probleem

Figma MCP op **Starter + View** sitplek is uitgeput (~20 calls/maand). Agent kan nie meer `use_figma` / herhaalde design-calls doen nie. ’n oopbron / gratis pad word nodig waar **agent + Pa** skerms saam kan ontwerp (vereiste A).

## 2. Besluit (goedgekeur)

| Keuse | Waarde |
|--------|--------|
| Doel | Agent-gedrewe UI-design (Figma MCP-vervanger) |
| Platform | **Penpot Cloud** — https://design.penpot.app |
| Agent-brug | **Amptelike Penpot MCP** in Cursor |
| Hosting nou | **Nie** Docker / self-host (Ubuntu+Docker bestaan, maar nie nodig vir v1) |
| Eerste skerm | Wallie **Missie** (stadium-klok + SOS + matchday) |

Verwysings:
- [Penpot MCP help](https://help.penpot.app/mcp/)
- [Penpot MCP + Cursor (5 stappe)](https://penpot.app/blog/set-up-penpot-mcp-with-cursor-in-5-steps-and-no-code/)

## 3. Doel & nie-doel

### In omvang (v1)
1. Pa skep gratis Penpot-rekening.
2. Een team/projek + lêer: `Wallie_911_Pro — Design`.
3. Skakel Penpot MCP aan (Integrations → MCP key).
4. Voeg Penpot MCP by Cursor (`mcp.json` / Tools & MCPs) met die URL + token wat Penpot gee.
5. In die oop Penpot-lêer: laai MCP-plugin, hou **Connected** terwyl agent werk.
6. Agent herbou / verfyn **Missie**-skerm (header, stadium-klok, SOS-banner, matchday stats) volgens lewende HTML + opsioneel die ou Figma-capture as verwysing.
7. Kort Pa-checklist in `docs/` of `pa-briefing.html` (klik-pad, geen kode).

### Buite omvang (v1)
- Docker / self-host Penpot op Ubuntu
- Ollama as design-engine
- Figma sitplek-upgrade of migrasie van al Figma-frames
- Firecrawl/Scrapling as produksie-pyplyn (slegs opsionele navorsing)
- Alle Wallie-tabs (Sessie, Vakke, Pa, …) in een slag
- React/Next herskryf van die cockpit (`react-best-practices` nie van toepassing op v1)

## 4. Argitektuur

```
┌─────────────┐     MCP (HTTPS)      ┌──────────────────┐
│ Cursor Agent│ ←──────────────────► │ Penpot MCP       │
│ (prompts)   │                      │ (cloud of local) │
└─────────────┘                      └────────┬─────────┘
                                              │ plugin WS
                                              ▼
                                     ┌──────────────────┐
                                     │ Penpot file open │
                                     │ in browser       │
                                     │ (Missie frame)   │
                                     └──────────────────┘
```

- **Bron van waarheid vir die app bly** die static HTML op GitHub Pages.
- **Penpot** is die design/handoff-laag (visuele format, iterasie, agent-skryf).
- Geen outomatiese sync Penpot→kode in v1; handmatige “pas HTML by design” of latere plan.

## 5. Komponente & data

| Eenheid | Doel | Koppelvlak |
|---------|------|------------|
| Penpot Cloud account | Auth + lêers | Pa login |
| Design file | Frames vir Missie (+ later tabs) | Browser + MCP plugin Connected |
| Penpot MCP server | Agent tools om nodes te lees/skryf | Cursor MCP config + MCP key |
| Lewende app | Produksie UI | `https://pamoja-academy.github.io/Wallie_911_Pro/` |
| Tokens (informeel) | Bok-green `#007A4D`, deep `#061A0F`, gold `#C8A84B`, danger `#E85D4C`; display/UI fonts soos in `assets/css/app.css` | Handmatig in Penpot kleure/styles |

## 6. Pa setup-vloei (implementasie later)

1. Gaan na https://design.penpot.app → registreer / login.  
2. Nuwe lêer: `Wallie_911_Pro — Design`.  
3. Account → Integrations → MCP → enable → kopieer config / key.  
4. Cursor → Settings → Tools & MCPs → voeg Penpot MCP by (plak Penpot se snippet; moenie die key in git commit nie).  
5. In Penpot: Plugins → load MCP plugin → **Connect** → hou venster oop.  
6. In Cursor: “Lees die oop Penpot-lêer en bou ’n Missie-skerm …”  
7. Verifieer visueel in Penpot; slegs daarna oorweeg HTML-aanpassings.

## 7. Foutpad & risiko’s

| Risiko | Mitigasie |
|--------|-----------|
| MCP key lek in repo | `.gitignore` vir lokale mcp secrets; nooit commit tokens |
| Plugin nie Connected | Agent faal stil; checklist sê “Connected” eers |
| Penpot ≠ Figma pixel-perfekt | Aanvaar; HTML bly whereheid |
| Cloud afhanklikheid | Aanvaar vir v1; Docker later as opsie 2 |
| Kwota / rate limits op Penpot MCP | Onbekend — dokumenteer as ons raak; nie spekuleer |

## 8. Toetsplan (wanneer geïmplementeer)

1. Cursor lys Penpot MCP tools (enabled).  
2. Agent lees bladsy-struktuur van oop lêer (nie leeg-fout).  
3. Agent skep/verander een frame “Missie — Design Format”; Pa sien dit sonder refresh-verwarring.  
4. Geen secrets in `git status` / git history.  
5. Wallie Pages-app onveranderd tensy eksplisiete HTML-taak volg.

## 9. Sukseskriteria

- Pa kan sonder Figma-kwota ’n skerm in Penpot sien verander deur Cursor.  
- Een gedokumenteerde klik-pad bestaan.  
- Wallie se lewende kamp breek nie.

## 10. Implementasie-volgorde (ná spes-goedkeuring)

1. `writing-plans` → implementasieplan.  
2. Pa-checklist + HANDOVER-update.  
3. Penpot lêer + MCP koppel (Pa doen account; agent help Cursor-config).  
4. Missie-frame in Penpot.  
5. Opsioneel: klein HTML-polis as design dwing.

## 11. Verwante artefakte

- Checkpoint: `docs/CHECKPOINT-2026-09-27-penpot.md`  
- Ou Figma capture (verwysing slegs): https://www.figma.com/design/GYMSR2Y1A8fCDCRoMUYZGW  
- Cockpit spes: `docs/superpowers/specs/2026-09-27-wallie-911-pro-design.md`
