/* Skryfwerk (V3): skerms vir die Engels EAT V3- en Afrikaans HT V3-skryfvrae.
   Lees net window.VRAEBANK_V3, window.VRAEBANK_V3_RUBRIEKE en VraebankStore.saveAttempt/attempts.
   Alle teks via textContent (nooit innerHTML met item-teks nie). Geen persentasies, geen punte van die leerder:
   die rubriek wys die DBE se puntebande van die vraestel, nie sy telling nie. */
(function () {
  const ITEMS = window.VRAEBANK_V3;
  const RUBRIEKE = window.VRAEBANK_V3_RUBRIEKE || {};
  const root = document.querySelector("#skryfwerk-root");
  const section = document.querySelector("#view-skryfwerk");
  if (!Array.isArray(ITEMS) || !root || !section) return;
  const STORE = window.VraebankStore;

  const MERK = { reg: "✓", gedeeltelik: "½", fout: "✗" };
  const MERK_TEKS = { reg: "Laaste: goed", gedeeltelik: "Laaste: gedeeltelik", fout: "Laaste: moet oordoen" };

  /* Die twee vraestelle en hul afdelings, in die volgorde van die eksamen. */
  const GROEPE = [
    {
      vak: "engels",
      naam: "Engels EAT V3 · Do 15 Okt",
      afdelings: [
        ["A", "Afdeling A Essay"],
        ["B", "Afdeling B Longer transactional"],
        ["C", "Afdeling C Shorter transactional"]
      ]
    },
    {
      vak: "afrikaans",
      naam: "Afrikaans HT V3 · Di 20 Okt",
      afdelings: [
        ["A", "Afdeling A Opstel"],
        ["B", "Afdeling B Transaksionele tekste"]
      ]
    }
  ];

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function kortId(item) {
    return String(item.id).replace(/^(eng|afr)-v3-/, "");
  }

  function laaste(id) {
    try {
      const p = STORE ? STORE.attempts(id) : [];
      return p.length ? p[p.length - 1].uitslag : null;
    } catch (e) {
      return null;
    }
  }

  function opsomming(item) {
    return item.punte + " punte · " + item.woorde.min + "–" + item.woorde.max + " woorde · ±" + item.tyd_min + " min";
  }

  /* Woordtelling van die voorbeeldantwoord: presies dieselfde reël as tests/vraebank-v3.test.js. */
  function normaliseer(s) {
    return String(s)
      .replace(/[’‘ꞌ]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function woordtelling(item) {
    const wt = (item.toets || {}).woordtelling;
    if (!wt || !wt.van || !wt.tot) return null;
    const a = normaliseer(item.antwoord);
    const v = normaliseer(wt.van);
    const t = normaliseer(wt.tot);
    const i = a.indexOf(v);
    const j = a.lastIndexOf(t);
    if (i < 0 || j < 0 || j + t.length < i) return null;
    return a.slice(i, j + t.length).split(" ").filter(Boolean).length;
  }

  /* ---------- lysskerm ---------- */

  function lys() {
    const wrap = el("div", "sw-lys");
    wrap.append(el("h1", null, "Skryfwerk (V3)"));
    wrap.append(el("p", "hint", "Beplan, skryf onder die DBE-tyd, tel jou woorde, en kyk eers dan na die memo. Gee jouself punte soos die rubriek."));
    GROEPE.forEach((groep) => {
      const lede = ITEMS.filter((i) => i.vak === groep.vak);
      if (!lede.length) return;
      const pan = el("section", "panel sw-groep");
      pan.append(el("h2", null, groep.naam));
      groep.afdelings.forEach(([afdeling, naam]) => {
        const items = lede.filter((i) => i.afdeling === afdeling);
        if (!items.length) return;
        pan.append(el("h3", "sw-afdeling", naam));
        const ul = el("ul", "sw-items");
        items.forEach((item) => {
          const li = el("li");
          const b = el("button", "sw-item");
          b.type = "button";
          b.dataset.id = item.id;
          const kop = el("span", "sw-kop");
          kop.append(el("span", "sw-id", kortId(item)), el("span", "sw-teksoort", item.teksoort));
          const u = laaste(item.id);
          if (u) {
            const m = el("span", "sw-merk sw-" + u, MERK[u]);
            m.title = MERK_TEKS[u];
            m.setAttribute("aria-label", MERK_TEKS[u]);
            kop.append(m);
          }
          b.append(kop, el("span", "sw-opsomming", opsomming(item)));
          b.addEventListener("click", () => itemSkerm(item.id));
          li.append(b);
          ul.append(li);
        });
        pan.append(ul);
      });
      wrap.append(pan);
    });
    root.replaceChildren(wrap);
  }

  /* ---------- itemskerm ---------- */

  function lysBlok(titel, reels) {
    const d = el("div", "sw-blok");
    d.append(el("h3", null, titel));
    const ul = el("ul", "sw-punte");
    (reels || []).forEach((r) => ul.append(el("li", null, String(r))));
    d.append(ul);
    return d;
  }

  function formaatBlok(item) {
    const d = el("div", "sw-blok");
    d.append(el("h3", null, "Formaat-kontrolelys"));
    const ul = el("ul", "sw-kontrolelys");
    (item.formaat || []).forEach((reel, n) => {
      const li = el("li");
      const lab = el("label", "sw-kontrole");
      const boks = document.createElement("input");
      boks.type = "checkbox";
      /* Net om self af te merk terwyl jy kyk — niks hiervan word gestoor nie. */
      boks.id = "sw-kontrole-" + item.id + "-" + n;
      lab.append(boks, el("span", null, String(reel)));
      li.append(lab);
      ul.append(li);
    });
    d.append(ul);
    return d;
  }

  function rubriekBlok(item) {
    const r = RUBRIEKE[item.rubriek];
    const d = el("div", "sw-blok");
    d.append(el("h3", null, "Rubriek"));
    if (!r) {
      d.append(el("p", "hint", "Rubriek nie beskikbaar nie."));
      return d;
    }
    d.append(el("p", "sw-rubriek-naam", r.naam));
    (r.kriteria || []).forEach((k) => {
      const blok = el("div", "sw-kriterium");
      blok.append(el("h4", null, k.kriterium + " · " + k.punte));
      const ul = el("ul", "sw-bande");
      (k.bande || []).forEach((b) => {
        const li = el("li");
        li.append(el("span", "sw-band-vlak", b.vlak + " (" + b.punte + ")"), el("span", "sw-band-kern", " " + b.kern));
        ul.append(li);
      });
      blok.append(ul);
      d.append(blok);
    });
    return d;
  }

  function antwoordBlok(item) {
    const d = el("div", "sw-blok");
    d.append(el("h3", null, "Voorbeeldantwoord"));
    const n = woordtelling(item);
    if (n !== null) d.append(el("p", "sw-woordtelling", n + " woorde"));
    d.append(el("div", "sw-teks", String(item.antwoord)));
    return d;
  }

  function itemSkerm(id) {
    const idx = ITEMS.findIndex((i) => i.id === id);
    if (idx < 0) return lys();
    const item = ITEMS[idx];
    /* Eie klas vir die itemskerm: .sw-item is die lysknoppie se styl (rand, wyser, kompakte opvulling). */
    const wrap = el("div", "sw-detail");

    const nav = el("div", "btn-row sw-nav");
    const terug = el("button", "btn ghost sw-terug", "Terug na lys");
    terug.type = "button";
    terug.addEventListener("click", lys);
    const vor = el("button", "btn ghost sw-vorige", "Vorige");
    vor.type = "button";
    vor.disabled = idx === 0;
    vor.addEventListener("click", () => itemSkerm(ITEMS[idx - 1].id));
    const vol = el("button", "btn ghost sw-volgende", "Volgende");
    vol.type = "button";
    vol.disabled = idx === ITEMS.length - 1;
    vol.addEventListener("click", () => itemSkerm(ITEMS[idx + 1].id));
    nav.append(terug, vor, vol);

    const pan = el("section", "panel");
    pan.append(el("h2", "sw-titel", kortId(item) + " · " + item.teksoort + " · " + opsomming(item)));
    pan.append(el("div", "sw-vraag", String(item.vraag)));
    pan.append(lysBlok("Beplanning", item.beplanning));
    const b = item.bron || {};
    pan.append(el("p", "sw-bron", "Bron: " + b.verwysing + ", bl. " + b.bladsy + " (memo bl. " + b.memo_bladsy + ")"));

    /* Eksamenmodus: die memo word eers gebou (en wys) as die tyd om is, of die werk gedoen en "Ek is klaar" gedruk is. */
    const memoKnoppie = el("button", "btn primary sw-memo-knoppie", "Memo gesluit");
    memoKnoppie.type = "button";
    const memo = el("div", "sw-memo");
    const bouMemo = () => {
      const d = document.createDocumentFragment();
      d.append(formaatBlok(item), antwoordBlok(item), rubriekBlok(item));
      const verd = el("div", "sw-blok");
      verd.append(el("h3", null, "Verduideliking"));
      verd.append(el("div", "sw-teks", String(item.verduideliking)));
      d.append(verd);
      return d;
    };
    pan.append(memoKnoppie, memo);

    const selfnasien = el("div", "sw-nasien");
    selfnasien.append(el("h3", null, "Hoe het dit gegaan?"));
    const rij = el("div", "btn-row");
    const bevestig = el("p", "sw-gestoor", "");
    bevestig.setAttribute("role", "status");
    [["reg", "Goed"], ["gedeeltelik", "Gedeeltelik"], ["fout", "Moet oordoen"]].forEach(([w, t]) => {
      const k = el("button", "btn sw-" + w, t);
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
    if (window.Eksamenmodus) {
      window.Eksamenmodus.pasToe({ item, vak: item.vak, tipe: "skryf", voor: memoKnoppie, bouMemo, memoHouer: memo, selfnasien, store: STORE, kls: "sw" });
    }

    wrap.append(nav, pan);
    root.replaceChildren(wrap);
    window.scrollTo(0, 0);
  }

  /* Wys die lys elke keer as die skerm aktief word (nav-knoppie of #skryfwerk) */
  let was = section.classList.contains("active");
  new MutationObserver(() => {
    const nou = section.classList.contains("active");
    if (nou && !was) lys();
    was = nou;
  }).observe(section, { attributes: true, attributeFilter: ["class"] });
  lys();
  /* Vir die hooftaak-knoppie op die Missie-skerm (app.js) */
  window.SkryfwerkUI = { open: itemSkerm };
})();
