/* Praktiese blok: skerms (knoppie, banier, eindboodskap). Gebruik net die Praktiese-API; geen logika hier nie. */
(function () {
  const P = window.Praktiese;
  if (!P) return;
  const $ = (s) => document.querySelector(s);
  const wrap = $("#praktiese-banner");
  const row = $("#praktiese-start-row");
  const btn = $("#praktiese-start");
  const fout = $("#praktiese-fout");
  if (!wrap || !row || !btn) return;
  let tyd = null;
  let timer = null;

  function hm(ms) {
    const min = Math.max(0, Math.ceil(ms / 60000));
    return Math.floor(min / 60) + ":" + String(min % 60).padStart(2, "0");
  }
  const hint = $("#wegkyk-hint");
  const HINT_ORIG = hint ? hint.textContent : "";
  const HINT_PRAKTIES = "Praktiese blok: oorskakel na Word, Excel, Access of Notepad tel nie as 'n waarskuwing nie. Die tyd tel steeds.";
  function refresh() {
    if (hint) hint.textContent = P.active() ? HINT_PRAKTIES : HINT_ORIG;
    row.hidden = !P.canStart();
    if (tyd) tyd.textContent = "Oor: " + hm(P.remainingMs()) + " (h:mm)";
  }
  function boodskap(rede) {
    const p = document.createElement("p");
    p.className = "praktiese-boodskap";
    p.id = "praktiese-boodskap";
    p.textContent =
      rede === "maks"
        ? "Die maksimum tyd van 3 h 15 min is verby. Praktiese blok klaar. Die gewone toesig geld weer."
        : "Praktiese blok klaar. Die gewone toesig geld weer.";
    wrap.replaceChildren(p);
  }
  function wys() {
    if (P.active()) {
      const div = document.createElement("div");
      div.className = "praktiese-banner";
      div.setAttribute("role", "status");
      const t = document.createElement("p");
      t.className = "pb-titel";
      t.textContent = "Praktiese blok aktief – RTT V1";
      tyd = document.createElement("p");
      tyd.className = "pb-tyd";
      tyd.id = "praktiese-tyd";
      const k = document.createElement("button");
      k.type = "button";
      k.className = "btn primary";
      k.id = "praktiese-klaar";
      k.textContent = "Klaar met prakties";
      k.addEventListener("click", () => {
        if (window.confirm("Is jy klaar met die praktiese blok?")) P.end();
      });
      div.append(t, tyd, k);
      wrap.replaceChildren(div);
      if (!timer) timer = setInterval(refresh, 15000);
    } else {
      tyd = null;
      if (timer) clearInterval(timer);
      timer = null;
    }
    refresh();
  }

  btn.addEventListener("click", () => {
    const r = P.start();
    const ok = !!(r && r.ok);
    fout.hidden = ok;
    if (!ok) fout.textContent = (r && r.error) || "Kon nie begin nie.";
  });
  P.onChange((i) => {
    if (i && !i.active && i.rede) boodskap(i.rede);
    else if (i && !i.active) wrap.replaceChildren();
    wys();
  });
  const sel = $("#session-subject");
  if (sel) sel.addEventListener("change", refresh);
  /* Sessie begin/eindig verander of die blok RTT is; goedkoop herkontrole na elke klik */
  document.addEventListener("click", () => setTimeout(refresh, 0));
  wys();
})();
