/* Vraebank-stoor — plaaslik, stuur NIKS na die bediener nie.
   Lees en skryf net localStorage-sleutel "wallie911_vraebank_v1":
     { v: 1,
       items:    { <id>: { pogings: [ { t: <ISO>, uitslag: "reg" | "gedeeltelik" | "fout" } ] } },
       prakties: [ { id, begin: <ISO>, einde: <ISO|null>, rede_einde: "klaar" | "maks" | null,
                     afwesig: [ { van: <ISO>, tot: <ISO|null> } ] } ] }
   - Korrupte/onbekende JSON of ’n ander v → begin skoon (raak geen ander sleutel nie).
   - localStorage-fout (kwota/privaat modus) breek nooit die app nie: ons hou dan ’n kopie in die geheue.
   - Geen punte of persentasies word hier bereken nie, en geen pa-*.html lees hierdie sleutel nie.

   API (window.VraebankStore):
     get()                       → die hele struktuur (kopie)
     saveAttempt(id, uitslag)    → stoor ’n self-nasien-poging; gee die poging terug (of null as ongeldig)
     attempts(id)                → lys pogings vir een item
     practicalStart()            → begin ’n praktiese blok (of gee die aktiewe een terug)
     practicalAbsence("start"|"end") → maak ’n afwesigheid oop / toe in die aktiewe blok
     practicalEnd(rede, eindeIso?)   → sluit die aktiewe blok ("klaar" | "maks")
     activePractical()           → die aktiewe blok of null */
(function () {
  const KEY = "wallie911_vraebank_v1";
  const UITSLAE = ["reg", "gedeeltelik", "fout"];
  let memory = null;
  /* Laaste skryf het misluk → die geheue-kopie is die waarheid tot ’n skryf weer slaag */
  let memOnly = false;

  function empty() {
    return { v: 1, items: {}, prakties: [] };
  }

  function valid(d) {
    return (
      d &&
      typeof d === "object" &&
      !Array.isArray(d) &&
      d.v === 1 &&
      d.items &&
      typeof d.items === "object" &&
      !Array.isArray(d.items) &&
      Array.isArray(d.prakties)
    );
  }

  function copy(d) {
    return JSON.parse(JSON.stringify(d));
  }

  function read() {
    if (memOnly && memory) return copy(memory);
    let raw = null;
    try {
      raw = localStorage.getItem(KEY);
    } catch {
      return memory ? copy(memory) : empty();
    }
    if (raw == null) return empty();
    try {
      const d = JSON.parse(raw);
      return valid(d) ? d : empty();
    } catch {
      return empty();
    }
  }

  function write(d) {
    memory = copy(d);
    try {
      localStorage.setItem(KEY, JSON.stringify(d));
      memOnly = false;
      return true;
    } catch {
      memOnly = true;
      return false;
    }
  }

  function iso(t) {
    return new Date(t == null ? Date.now() : t).toISOString();
  }

  function activeOf(d) {
    for (let i = d.prakties.length - 1; i >= 0; i--) {
      const p = d.prakties[i];
      if (p && !p.einde) return p;
    }
    return null;
  }

  window.VraebankStore = {
    KEY,

    get() {
      return read();
    },

    saveAttempt(id, uitslag) {
      if (!id || !UITSLAE.includes(uitslag)) return null;
      const d = read();
      const item = d.items[id] && Array.isArray(d.items[id].pogings) ? d.items[id] : { pogings: [] };
      const poging = { t: iso(), uitslag };
      item.pogings.push(poging);
      d.items[id] = item;
      write(d);
      return poging;
    },

    attempts(id) {
      const item = read().items[id];
      return item && Array.isArray(item.pogings) ? item.pogings : [];
    },

    practicalStart() {
      const d = read();
      const cur = activeOf(d);
      if (cur) return cur;
      const p = { id: "p_" + Date.now(), begin: iso(), einde: null, rede_einde: null, afwesig: [] };
      d.prakties.push(p);
      write(d);
      return p;
    },

    practicalAbsence(what) {
      const d = read();
      const cur = activeOf(d);
      if (!cur) return null;
      if (!Array.isArray(cur.afwesig)) cur.afwesig = [];
      const open = cur.afwesig.find((a) => a && !a.tot);
      if (what === "start") {
        if (open) return open;
        const a = { van: iso(), tot: null };
        cur.afwesig.push(a);
        write(d);
        return a;
      }
      if (what === "end") {
        if (!open) return null;
        open.tot = iso();
        write(d);
        return open;
      }
      return null;
    },

    practicalEnd(rede, eindeIso) {
      const d = read();
      const cur = activeOf(d);
      if (!cur) return null;
      const einde = eindeIso || iso();
      (cur.afwesig || []).forEach((a) => {
        if (a && !a.tot) a.tot = einde;
      });
      cur.einde = einde;
      cur.rede_einde = rede === "maks" ? "maks" : "klaar";
      write(d);
      return cur;
    },

    activePractical() {
      return activeOf(read());
    }
  };
})();
