/* Vroeg-klaar-kontrole (Wallie se kant): word 'n studieblok "klaar" gemerk sonder genoeg werk?
   Suiwer logika; geen skerm, geen stoor. Pa se kant (pa-konsole.html / pa-afstand.html) gebruik dieselfde reëls
   op die bestaande oorsig-data (blok.manual + done_min + minutes), sien PK.blockFlag.
     "geen_sessie" — nog nooit 'n sessie vir hierdie blok begin nie
     "vroeg"       — minder as 60% van die beplande minute gedoen
   (Ledig > 50% van 'n sessie: Wallie se toestel stoor nie ledige tyd per sessie nie, dus net aan Pa se kant,
    vir die lewendige sessie.) */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.VroegKlaar = factory();
})(typeof window !== "undefined" ? window : globalThis, function () {
  const DREMPEL = 0.6;

  /* blok: { id, kind, minutes }; sessies: lys van { block: { id }, actualMin };
     aktief: { blockId, startedAt } of null (sessie wat nou loop); nou: ms */
  function kontroleer(blok, sessies, aktief, nou) {
    if (!blok || !blok.id || blok.kind === "break") return null;
    const plan = Number(blok.minutes) || 0;
    if (!(plan > 0)) return null;
    let gedoen = 0;
    let sessieN = 0;
    (sessies || []).forEach((s) => {
      if (s && s.block && s.block.id === blok.id) {
        sessieN += 1;
        gedoen += Number(s.actualMin) || 0;
      }
    });
    if (aktief && aktief.blockId === blok.id) {
      sessieN += 1;
      gedoen += Math.max(0, ((nou || Date.now()) - (aktief.startedAt || nou || Date.now())) / 60000);
    }
    gedoen = Math.round(gedoen);
    if (sessieN === 0) return { soort: "geen_sessie", gedoen: 0, plan, kode: "GEEN POGING" };
    if (gedoen < DREMPEL * plan) return { soort: "vroeg", gedoen, plan, kode: "VROEG KLAAR" };
    return null;
  }

  function teks(k) {
    if (!k) return "";
    return k.soort === "geen_sessie"
      ? "Seker? Dit is eksamenwerk. Jy het nog nie 'n sessie vir hierdie blok begin nie."
      : "Seker? Dit is eksamenwerk. Jy het " + k.gedoen + " van " + k.plan + " min gewerk (minder as 60%).";
  }

  return { DREMPEL, kontroleer, teks };
});
