/* Vinnige Toerisme-MCQ (Afdeling A-patroon): 20 vrae uit Wallie se notas + SARS/DBE.
   Lees window.TOERISME_MCQ_VINNIG. Skryf net wallie911_toer_mcq_v1 (pogings). Geen Supabase-skryf. */
(function () {
  const BANK = window.TOERISME_MCQ_VINNIG;
  const KEY = "wallie911_toer_mcq_v1";
  if (!Array.isArray(BANK) || !BANK.length) return;

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function laai() {
    try {
      const r = JSON.parse(localStorage.getItem(KEY) || "null");
      if (r && r.v === 1 && Array.isArray(r.antwoorde)) return r;
    } catch (_) {}
    return { v: 1, antwoorde: [], begin: null, klaar: null };
  }

  function stoor(st) {
    try {
      localStorage.setItem(KEY, JSON.stringify(st));
    } catch (_) {}
  }

  function letters(i) {
    return String.fromCharCode(65 + i);
  }

  function telling(st) {
    let reg = 0;
    st.antwoorde.forEach((a) => {
      const q = BANK.find((x) => x.id === a.id);
      if (q && a.keuse === q.reg) reg += 1;
    });
    return { reg, totaal: BANK.length };
  }

  function render(houer, blok) {
    if (!houer || !blok || blok.mcq !== "toer-vinnig") return false;
    let st = laai();
    if (!st.begin) {
      st.begin = Date.now();
      stoor(st);
    }
    const i = st.antwoorde.length;
    houer.hidden = false;
    houer.replaceChildren();

    const wrap = el("div", "toer-mcq");
    const head = el("div", "panel-head");
    head.append(el("h2", null, "20 vinnige Toerisme-MCQs"));
    head.append(el("span", "hint", "Doeane · UTC · kaartwerk · minister · een klik = antwoord"));
    wrap.append(head);
    wrap.append(el("p", "werk-blok-titel", blok.title || "Toerisme MCQ"));

    if (i >= BANK.length) {
      const t = telling(st);
      if (!st.klaar) {
        st.klaar = Date.now();
        stoor(st);
      }
      wrap.append(el("p", "toer-mcq-telling", "Klaar: " + t.reg + " / " + t.totaal + " reg"));
      const lys = el("ol", "toer-mcq-hersien");
      BANK.forEach((q, n) => {
        const a = st.antwoorde[n];
        const li = el("li", a && a.keuse === q.reg ? "reg" : "fout");
        li.append(el("strong", null, q.vraag));
        const jou = a && a.keuse != null ? letters(a.keuse) + ". " + q.opsies[a.keuse] : "(geen)";
        li.append(el("div", "hint", "Jy: " + jou));
        li.append(el("div", null, "Reg: " + letters(q.reg) + ". " + q.opsies[q.reg]));
        li.append(el("div", "hint", q.verduideliking));
        lys.append(li);
      });
      wrap.append(lys);
      const weer = el("button", "btn ghost", "Begin weer (toe-boek)");
      weer.type = "button";
      weer.addEventListener("click", () => {
        stoor({ v: 1, antwoorde: [], begin: Date.now(), klaar: null });
        render(houer, blok);
      });
      wrap.append(weer);
      houer.append(wrap);
      return true;
    }

    const q = BANK[i];
    wrap.append(el("p", "hint", "Vraag " + (i + 1) + " / " + BANK.length + " · " + (q.tema || "")));
    wrap.append(el("p", "toer-mcq-vraag", q.vraag));
    const lys = el("div", "toer-mcq-opsies");
    q.opsies.forEach((teks, k) => {
      const b = el("button", "btn toer-mcq-opsie", letters(k) + ". " + teks);
      b.type = "button";
      b.addEventListener("click", () => {
        const reg = k === q.reg;
        Array.from(lys.querySelectorAll("button")).forEach((x) => {
          x.disabled = true;
        });
        b.classList.add(reg ? "reg" : "fout");
        const regBtn = lys.children[q.reg];
        if (regBtn) regBtn.classList.add("reg");
        const fb = el("div", "toer-mcq-terugvoer " + (reg ? "reg" : "fout"));
        fb.append(el("strong", null, reg ? "Reg" : "Fout"));
        fb.append(el("p", null, q.verduideliking));
        fb.append(el("p", "hint", "Bron: " + (q.bron && q.bron.verwysing ? q.bron.verwysing : "")));
        wrap.append(fb);
        const vol = el("button", "btn primary", i + 1 >= BANK.length ? "Sien telling" : "Volgende vraag");
        vol.type = "button";
        vol.addEventListener("click", () => {
          st.antwoorde.push({ id: q.id, keuse: k, t: Date.now() });
          stoor(st);
          render(houer, blok);
        });
        wrap.append(vol);
      });
      lys.append(b);
    });
    wrap.append(lys);
    houer.append(wrap);
    return true;
  }

  window.WALLIE = window.WALLIE || {};
  window.WALLIE.toerismeMcq = {
    bank: BANK,
    render: render,
    key: KEY
  };
})();
