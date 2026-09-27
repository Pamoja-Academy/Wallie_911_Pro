# Penpot + Cursor — Pa klik-lys (geen kode)

Vervang Figma MCP (kwota vol). Doel: agent kan skerms in **Penpot Cloud** verander terwyl jy kyk.

Amptelike gids: https://penpot.app/blog/set-up-penpot-mcp-with-cursor-in-5-steps-and-no-code/  
Help: https://help.penpot.app/mcp/

---

## Stap 1 — Rekening
1. Gaan na https://design.penpot.app  
2. Registreer of login (gratis).

## Stap 2 — Lêer
1. Skep ’n nuwe design-lêer.  
2. Noem dit: `Wallie_911_Pro — Design`.  
3. Los die lêer **oop** in die browser.

## Stap 3 — MCP aanskakel
1. Jou account / settings → **Integrations** → **MCP**.  
2. Enable MCP.  
3. Genereer / kopieer die **MCP key** of die klaar Cursor-config snippet.  
4. **Moenie** die key in WhatsApp, e-pos na ander, of git sit nie.

## Stap 4 — Cursor
1. Cursor → **Settings** → **Tools & MCPs** → **Add Custom MCP** (of redigeer `%USERPROFILE%\.cursor\mcp.json`).  
2. Plak die snippet wat Penpot gee.  
   - Voorbeeld-vorm (jou URL/token verskil): sien `docs/penpot-mcp.json.example`.  
3. Stoor. Maak seker die Penpot-server wys **Enabled / Connected** in Cursor.  
4. Herbegin Cursor Agent-chat as dit nie verskyn nie.

## Stap 5 — Plugin in Penpot (belangrik)
1. In die oop `Wallie_911_Pro — Design` lêer: **Plugins**.  
2. Laai die Penpot MCP-plugin (soos Penpot se MCP-docs sê — dikwels “Load from URL” / Integrations).  
3. Klik **Connect** tot dit **Connected** wys.  
4. **Los daai plugin-venster oop** terwyl die agent in Cursor werk.

## Stap 6 — Toets met agent
In ’n nuwe Cursor-chat (hierdie repo), sê:

> Penpot MCP is gekoppel. Lees die oop lêer en bou ’n Missie-skerm met stadium-klok tot 12 Okt 2026, SOS #15, bok-green/gold soos Wallie_911_Pro.

Jy moet die frame in die Penpot-browser sien verander.

## Stap 7 — Klaar-merk
- [ ] Penpot lêer bestaan  
- [ ] Cursor MCP Penpot enabled  
- [ ] Plugin Connected  
- [ ] Een Missie-frame gebou  

As iets faal: plugin eers “Connected” maak, dan eers weer die agent vra. Figma kan jy ignoreer tot kwota hernu.

## Verwysings in hierdie repo
- Spes: `docs/superpowers/specs/2026-09-27-penpot-cloud-mcp-design.md`  
- Plan: `docs/superpowers/plans/2026-09-27-penpot-cloud-mcp.md`  
- Lewende app (bron van waarheid): https://pamoja-academy.github.io/Wallie_911_Pro/
