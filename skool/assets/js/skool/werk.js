/* Skool-eksamenapp — werklaag.
   Implementeer dieselfde koppelvlak as WALLIE.DBE (assets/js/dbe-vraestelle.js:503), maar uit
   config/werk/*.json in plaas van die DBE-matriekkatalogus. Die UI (lesson-ui.js) hoef dus niks te weet
   van die verskil nie: dit vra item(), skakels(), werkLabel(), punte() en vraagNommers(). */
(function (root) {
  "use strict";
  var SKOOL = (root.SKOOL = root.SKOOL || {});

  var katalogus = {};
  var alleItems = [];

  function laai(items) {
    katalogus = {};
    alleItems = [];
    (items || []).forEach(function (it) {
      if (!it || !it.id) return;
      katalogus[it.id] = it;
      alleItems.push(it);
    });
    return alleItems.length;
  }

  function item(id) {
    return katalogus[id] || null;
  }

  function alle() {
    return alleItems.slice();
  }

  function vraeVan(werk) {
    var it = werk ? item(werk.id) : null;
    return (it && Array.isArray(it.vrae) ? it.vrae : []).map(Number);
  }

  function vraagNommers(werk) {
    if (!werk) return [];
    var vrae = vraeVan(werk);
    if (werk.tipe === "vraestel") {
      return vrae.map(function (_, i) {
        return i + 1;
      });
    }
    if (Array.isArray(werk.nrs)) return werk.nrs.slice();
    return vrae.map(function (_, i) {
      return i + 1;
    });
  }

  function vraagLabel(nr, werk) {
    var vrae = vraeVan(werk);
    return (vrae.length ? "Vraag " : "V") + String(nr);
  }

  function vraagLabels(werk) {
    return vraagNommers(werk).map(function (n) {
      return vraagLabel(n, werk);
    });
  }

  function punte(werk, blok) {
    if (blok && Number.isFinite(blok.punte) && (!blok.werk || !werk || blok.werk.id === werk.id)) return blok.punte;
    var vrae = vraeVan(werk);
    if (!vrae.length) return werk && Number.isFinite(werk.punte) ? werk.punte : null;
    var nrs = vraagNommers(werk);
    var som = 0;
    for (var i = 0; i < nrs.length; i++) {
      var p = vrae[Number(nrs[i]) - 1];
      if (!Number.isFinite(p)) return null;
      som += p;
    }
    return som;
  }

  function vraagPunte(werk, nr) {
    var vrae = vraeVan(werk);
    var i = Number(nr);
    return Number.isInteger(i) && vrae[i - 1] != null ? vrae[i - 1] : null;
  }

  function werkLabel(werk) {
    if (!werk) return "";
    var it = item(werk.id);
    if (!it) return String(werk.id || "");
    if (werk.tipe === "vraestel") return it.titel + " · volledige vraestel";
    var labels = vraagLabels(werk);
    return labels.length ? it.titel + " · " + labels.join(", ") : it.titel;
  }

  function skakels(werk) {
    var it = werk ? item(werk.id) : null;
    if (!it || !it.vraestel) return null;
    return {
      vraestel: it.vraestel,
      data: it.data || null,
      antwoordeboek: it.antwoordeboek || null,
      bylae: it.bylae || null,
      memo: it.memo || null,
      datatipe: it.datatipe || null,
      titel: it.titel
    };
  }

  /* Die generiese plan reserveer sy werk al in die blok; daar is geen rotasie nodig nie. */
  function werkVirBlok(blok) {
    return blok && blok.werk ? blok.werk : null;
  }

  SKOOL.WERK = {
    laai: laai,
    alle: alle,
    item: item,
    vraagNommers: vraagNommers,
    vraagLabels: vraagLabels,
    vraagLabel: vraagLabel,
    punte: punte,
    vraagPunte: vraagPunte,
    werkLabel: werkLabel,
    skakels: skakels,
    werkVirBlok: werkVirBlok,
    setAktief: function () {}
  };
})(typeof window !== "undefined" ? window : this);
