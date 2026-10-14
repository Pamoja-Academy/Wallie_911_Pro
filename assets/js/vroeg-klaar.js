/* Vroeg-klaar-kontrole (Wallie se kant): word 'n studieblok "klaar" gemerk sonder genoeg werk?
   Suiwer logika; geen skerm, geen stoor. Pa se kant (pa-konsole.html / pa-afstand.html) gebruik dieselfde reëls
   op die bestaande oorsig-data (blok.manual + done_min + minutes), sien PK.blockFlag.
     "geen_sessie" — nog nooit 'n sessie of poging vir hierdie blok begin nie            (kode GEEN POGING)
     "geen_minute" — daar was 'n sessie/poging, maar 0 minute gedoen (bv. 'n sessie van 0 min)  (kode GEEN POGING)
     "vroeg"       — minder as 60% van die beplande minute gedoen                          (kode VROEG KLAAR)
   Minute gedoen = die meeste van (sessie-minute, die minute_gebruik van VANDAG se pogings op blok.item, die minute van
   VANDAG se eksamenmodus-werk op blok.item). 'n Poging of eksamenmodus-werk tel ook as "daar was werk". Eksamenmodus-werk
   is wat Wallie al gedoen het maar nog nie met "Stoor my punte" as 'n poging gestoor het nie (Eksamenmodus.vandagWerk).
   Blok-soort "voor-eksamen" (laaste kyk, tas pak) kry nooit 'n waarskuwing nie.
   NIE geïmplementeer nie: "ledig > 50%" van 'n sessie. Wallie se toestel stoor nie ledige tyd per sessie nie,
   dus kan hierdie kontrole dit nie nagaan nie; net Pa se kant sien dit, vir die lewendige sessie. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.VroegKlaar = factory();
})(typeof window !== "undefined" ? window : globalThis, function () {
  const DREMPEL = 0.6;

  /* blok: { id, kind, minutes, soort?, item? }; sessies: lys van { block: { id }, actualMin };
     aktief: { blockId, startedAt } of null (sessie wat nou loop); nou: ms;
     pogings: VANDAG se VraebankStore.attempts(blok.item) — lys van { t, minute_gebruik? } (die aanroeper filter op vandag);
     eksamen: Eksamenmodus.vandagWerk(blok.item, nou) — { minute, werk } (werk=false of weggelaat → tel niks) */
  function kontroleer(blok, sessies, aktief, nou, pogings, eksamen) {
    if (!blok || !blok.id || blok.kind === "break") return null;
    if (blok.soort === "voor-eksamen") return null;
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
    let pogingMin = 0;
    let pogingN = 0;
    (pogings || []).forEach((p) => {
      if (p) {
        pogingN += 1;
        pogingMin += Number(p.minute_gebruik) || 0;
      }
    });
    if (eksamen && eksamen.werk) {
      pogingN += 1;
      pogingMin = Math.max(pogingMin, Number(eksamen.minute) || 0);
    }
    gedoen = Math.round(Math.max(gedoen, pogingMin));
    if (sessieN === 0 && pogingN === 0) return { soort: "geen_sessie", gedoen: 0, plan, kode: "GEEN POGING" };
    if (gedoen <= 0) return { soort: "geen_minute", gedoen: 0, plan, kode: "GEEN POGING" };
    if (gedoen < DREMPEL * plan) return { soort: "vroeg", gedoen, plan, kode: "VROEG KLAAR" };
    return null;
  }

  function teks(k) {
    if (!k) return "";
    if (k.soort === "geen_sessie") return "Seker? Dit is eksamenwerk. Jy het nog nie 'n sessie vir hierdie blok begin nie.";
    if (k.soort === "geen_minute") return "Seker? Dit is eksamenwerk. Jy het nog geen minute aan hierdie blok gewerk nie.";
    return "Seker? Dit is eksamenwerk. Jy het " + k.gedoen + " van " + k.plan + " min gewerk (minder as 60%).";
  }

  return { DREMPEL, kontroleer, teks };
});
