/* Oefenvrae (RTT V1): skerms. Lees net window.VRAEBANK_RTT_V1 en VraebankStore.saveAttempt/attempts. Alle teks via textContent. */
(function () {
  const ITEMS = window.VRAEBANK_RTT_V1;
  const root = document.querySelector("#oefenvrae-root");
  const section = document.querySelector("#view-oefenvrae");
  if (!Array.isArray(ITEMS) || !root || !section) return;
  const STORE = window.VraebankStore;
  const GROEPE = [
    ["sigblad", "Sigblad"],
    ["woordverwerking", "Woordverwerking"],
    ["databasis", "Databasis"],
    ["html", "HTML"],
    ["algemeen", "Algemeen"]
  ];
  const MERK = { reg: "✓", gedeeltelik: "½", fout: "✗" };
  const MERK_TEKS = { reg: "Laaste: reg", gedeeltelik: "Laaste: gedeeltelik", fout: "Laaste: fout" };

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function kortId(item) {
    return String(item.id).replace(/^rtt-v1-/, "");
  }
  function opening(item) {
    const reel = String(item.vraag).split("\n").find((r) => r.trim()) || "";
    return reel.length > 90 ? reel.slice(0, 87).trimEnd() + "…" : reel;
  }
  function laaste(id) {
    try {
      const p = STORE ? STORE.attempts(id) : [];
      return p.length ? p[p.length - 1].uitslag : null;
    } catch (e) {
      return null;
    }
  }
  function punteTeks(n) {
    return "(" + n + (n === 1 ? " punt)" : " punte)");
  }

  function lys() {
    const wrap = el("div", "ov-lys");
    wrap.append(el("h1", null, "Oefenvrae (RTT V1)"));
    wrap.append(el("p", "hint", "Kies ’n vraag, doen dit in Excel, Word of Access (of op papier), en kyk dan na die memo."));
    GROEPE.forEach(([sleutel, naam]) => {
      const lede = ITEMS.filter((i) => i.onderwerp === sleutel);
      if (!lede.length) return;
      const pan = el("section", "panel ov-groep");
      pan.append(el("h2", null, naam));
      const ul = el("ul", "ov-items");
      lede.forEach((item) => {
        const li = el("li");
        const b = el("button", "ov-item");
        b.type = "button";
        b.dataset.id = item.id;
        const kop = el("span", "ov-kop");
        kop.append(el("span", "ov-id", kortId(item)), el("span", "ov-vlak", "Vlak " + item.vlak));
        const u = laaste(item.id);
        if (u) {
          const m = el("span", "ov-merk ov-" + u, MERK[u]);
          m.title = MERK_TEKS[u];
          m.setAttribute("aria-label", MERK_TEKS[u]);
          kop.append(m);
        }
        b.append(kop, el("span", "ov-open", opening(item)));
        b.addEventListener("click", () => itemSkerm(item.id));
        li.append(b);
        ul.append(li);
      });
      pan.append(ul);
      wrap.append(pan);
    });
    root.replaceChildren(wrap);
  }

  function blok(titel, teks, mono) {
    const d = el("div", "oe-blok");
    d.append(el("h3", null, titel));
    d.append(el(mono ? "pre" : "div", mono ? "oe-kode" : "oe-teks", teks));
    return d;
  }

  function itemSkerm(id) {
    const idx = ITEMS.findIndex((i) => i.id === id);
    if (idx < 0) return lys();
    const item = ITEMS[idx];
    const wrap = el("div", "oe-item");
    const nav = el("div", "btn-row oe-nav");
    const terug = el("button", "btn ghost oe-terug", "Terug na lys");
    terug.type = "button";
    terug.addEventListener("click", lys);
    const vor = el("button", "btn ghost oe-vorige", "Vorige");
    vor.type = "button";
    vor.disabled = idx === 0;
    vor.addEventListener("click", () => itemSkerm(ITEMS[idx - 1].id));
    const vol = el("button", "btn ghost oe-volgende", "Volgende");
    vol.type = "button";
    vol.disabled = idx === ITEMS.length - 1;
    vol.addEventListener("click", () => itemSkerm(ITEMS[idx + 1].id));
    nav.append(terug, vor, vol);

    const pan = el("section", "panel");
    pan.append(el("h2", "oe-titel", kortId(item) + " · Vlak " + item.vlak + " " + punteTeks(item.punte)));
    pan.append(el("div", "oe-vraag", String(item.vraag)));
    pan.append(el("p", "hint oe-opdrag", "Doen dit in Excel/Word/Access of op papier, en kyk dan na die memo."));
    const b = item.bron || {};
    pan.append(el("p", "oe-bron", "Bron: " + b.verwysing + ", bl. " + b.bladsy + " (memo bl. " + b.memo_bladsy + ")"));

    const memoKnoppie = el("button", "btn primary oe-memo-knoppie", "Wys memo");
    memoKnoppie.type = "button";
    memoKnoppie.setAttribute("aria-expanded", "false");
    const memo = el("div", "oe-memo");
    memo.hidden = true;
    const mono = item.tipe === "formule" || item.tipe === "kode";
    memo.append(blok("Antwoord", String(item.antwoord), mono));
    const rig = el("div", "oe-blok");
    rig.append(el("h3", null, "Nasienriglyn"));
    const ul = el("ul", "oe-rig");
    (item.nasienriglyn || []).forEach((r) => ul.append(el("li", null, r.kriterium + " – " + r.punte)));
    rig.append(ul);
    memo.append(rig);
    memo.append(blok("Verduideliking", String(item.verduideliking), false));
    memoKnoppie.addEventListener("click", () => {
      memo.hidden = !memo.hidden;
      memoKnoppie.textContent = memo.hidden ? "Wys memo" : "Steek memo weg";
      memoKnoppie.setAttribute("aria-expanded", String(!memo.hidden));
    });
    pan.append(memoKnoppie, memo);

    const selfnasien = el("div", "oe-nasien");
    selfnasien.append(el("h3", null, "Hoe het dit gegaan?"));
    const rij = el("div", "btn-row");
    const bevestig = el("p", "oe-gestoor", "");
    bevestig.setAttribute("role", "status");
    [["reg", "Reg"], ["gedeeltelik", "Gedeeltelik"], ["fout", "Fout"]].forEach(([w, t]) => {
      const k = el("button", "btn oe-" + w, t);
      k.type = "button";
      k.dataset.uitslag = w;
      k.addEventListener("click", () => {
        const r = STORE && STORE.saveAttempt(item.id, w);
        bevestig.textContent = r ? "Gestoor." : "Kon nie stoor nie.";
      });
      rij.append(k);
    });
    selfnasien.append(rij, bevestig);
    pan.append(selfnasien);

    wrap.append(nav, pan);
    root.replaceChildren(wrap);
    window.scrollTo(0, 0);
  }

  /* Wys die lys elke keer as die skerm aktief word (nav-knoppie of #oefenvrae) */
  let was = section.classList.contains("active");
  new MutationObserver(() => {
    const nou = section.classList.contains("active");
    if (nou && !was) lys();
    was = nou;
  }).observe(section, { attributes: true, attributeFilter: ["class"] });
  lys();
})();
