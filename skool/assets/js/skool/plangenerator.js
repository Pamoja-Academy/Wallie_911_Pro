/* Skool-eksamenapp — plangenerator (die hart).
   Invoer: rooster + vakkeuses + werkitems + reëls (+ die "gesien"-register).
   Uitvoer: dieselfde blokstruktuur as WALLIE.buildDayPlan (sien KONTRAKTE.md §1), sodat die hele UI
   onveranderd bly.

   Pure en deterministies (R-toets): geen klok, geen toeval, geen DOM, geen netwerk, geen berging.
   Dieselfde invoer gee altyd dieselfde blokke. Om "watter vraestelle is al gebruik" deterministies te
   maak, herspeel die generator die dae vanaf `begin` tot `datum` en gee net `datum` se blokke terug. */
(function (root) {
  "use strict";
  var SKOOL = (root.SKOOL = root.SKOOL || {});
  var DAG = 86400000;

  function naDag(s) {
    return Math.round(Date.parse(s + "T00:00:00Z") / DAG);
  }
  function vanDag(n) {
    return new Date(n * DAG).toISOString().slice(0, 10);
  }
  function weekdag(s) {
    return new Date(naDag(s) * DAG).getUTCDay();
  }
  function isNaweek(s) {
    var d = weekdag(s);
    return d === 0 || d === 6;
  }
  function min(hm) {
    var p = String(hm).split(":");
    return Number(p[0]) * 60 + Number(p[1]);
  }
  function hm(m) {
    m = Math.max(0, Math.min(1439, Math.round(m)));
    return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
  }
  function lys(x) {
    return Array.isArray(x) ? x : [];
  }

  function reelsVan(rou) {
    var r = (rou && rou.reëls) || (rou && rou.reels) || rou || {};
    /* Sonder die kern-reëls sou die generator stil 'n leë plan gee; gebruik dan die verstekke. */
    if (!r.minBlokMinute || !r.vensters) {
      r = Object.assign(
        {
          minPerPunt: 1.2, minBlokMinute: 20, maksBlokMinute: 100, maksVraestelMinute: 180,
          maksMinutePerDag: 300, rusNaMinute: 90, rusMinute: 15, middagete: ["12:30", "13:15"],
          aandEinde: "21:00", eksamenBufferMinute: 60, nuweWerkNaEksamen: false, nooitGesieneVraestel: true,
          vensters: { week: [["15:30", "18:00"], ["19:00", "21:00"]], naweek: [["08:00", "12:00"], ["14:00", "17:30"], ["19:00", "21:00"]] }
        },
        r
      );
    }
    return r;
  }

  /* ---------- die horison ---------- */

  function eersteDag(rooster) {
    var eerste = null;
    lys(rooster).forEach(function (e) {
      if (!eerste || e.datum < eerste) eerste = e.datum;
    });
    if (!eerste) return null;
    return vanDag(naDag(eerste) - 21);
  }

  function genereer(invoer) {
    var cfg = invoer || {};
    var datum = cfg.datum;
    var rooster = lys(cfg.rooster && cfg.rooster.eksamens ? cfg.rooster.eksamens : cfg.rooster);
    var werk = lys(cfg.werk).filter(function (w) {
      return w && w.graad == null ? true : Number(w.graad) === Number((cfg.skool && cfg.skool.graad) || (w && w.graad));
    });
    var reels = reelsVan(cfg.reëls || cfg.reels || {});
    var vakkeuses = lys(cfg.vakkeuses);
    var skool = cfg.skool || {};
    var waarskuwings = [];
    var leeg = { date: datum, blocks: [], totalMinutes: 0, waarskuwings: waarskuwings };

    if (!datum || !/^\d{4}-\d{2}-\d{2}$/.test(datum) || rooster.length === 0) return leeg;

    var vakke = bouVakke(vakkeuses, rooster, werk, lys(cfg.vakke), waarskuwings);
    if (!vakke.length) return leeg;

    /* Net die leerder se eie vraestelle: 'n vak wat nie gekies is nie, se eksamen is nie syne nie.
       Twee vraestelle in dieselfde sessie kan nie albei geskryf word nie — hou die eerste. */
    var gekies = {};
    vakke.forEach(function (v) {
      gekies[v.slug] = true;
    });
    if (vakkeuses.length) {
      rooster = rooster.filter(function (e) {
        return gekies[e.vak];
      });
    }
    var sessies = {};
    rooster = rooster.filter(function (e) {
      var k = e.datum + "|" + e.tyd;
      if (sessies[k]) {
        waarskuwings.push("rooster: " + e.vak + " " + e.vraestel + " val in dieselfde sessie as " + sessies[k] + " — die eerste een geld");
        return false;
      }
      sessies[k] = e.vak + " " + e.vraestel;
      return true;
    });
    if (rooster.length === 0) return leeg;

    var begin = cfg.begin || eersteDag(rooster);
    if (!begin || datum < begin) return leeg;

    var einde = rooster.reduce(function (a, e) {
      return e.datum > a ? e.datum : a;
    }, "");
    if (datum > einde) {
      return {
        date: datum,
        blocks: [
          {
            id: datum + "-klaar",
            kind: "slot",
            subjectSlug: "foutbank",
            minutes: 0,
            title: "Klaar — al die vraestelle is geskryf",
            detail: "Rus. Jy het die eksamentydperk deurgekom."
          }
        ],
        totalMinutes: 0,
        waarskuwings: waarskuwings
      };
    }

    var toestand = {
      werk: werk,
      reels: reels,
      vakke: vakke,
      rooster: rooster,
      skooltye: (cfg.skool && cfg.skool.skooltye) || null,
      gesien: {},
      gebruik: {},
      vordering: {},
      laas: {},
      nadat: {},
      vandag: {},
      afgehandel: {},
      waarskuwings: waarskuwings
    };
    lys(cfg.gesien).forEach(function (id) {
      toestand.gesien[String(id)] = true;
    });

    var vandag = null;
    /* Die register groei binne-in die dagplanne (elke blok merk sy item dadelik), want anders kon
       dieselfde vraestel twee keer in een dag se blokke beland. */
    for (var d = begin; d <= datum; d = vanDag(naDag(d) + 1)) {
      var plan = dagPlan(d, toestand);
      if (d === datum) vandag = plan;
    }
    vandag.waarskuwings = waarskuwings;
    return vandag;
  }

  /* ---------- vakke ---------- */

  function bouVakke(vakkeuses, rooster, werk, katalogus, waarskuwings) {
    var perSlug = {};
    vakkeuses.forEach(function (v, i) {
      if (!v || !v.slug) return;
      perSlug[v.slug] = {
        slug: String(v.slug),
        naam: String(v.naam || v.slug),
        teiken: Number.isFinite(Number(v.teiken)) ? Number(v.teiken) : 60,
        zone: v.zone || null,
        orde: i
      };
    });
    /* Geen keuses nie: gebruik elke vak in die rooster (die app is dan nog bruikbaar). */
    if (!Object.keys(perSlug).length) {
      var nameUitKatalogus = {};
      lys(katalogus).forEach(function (v) {
        nameUitKatalogus[v.slug] = v;
      });
      rooster.forEach(function (e) {
        if (perSlug[e.vak]) return;
        var k = nameUitKatalogus[e.vak];
        perSlug[e.vak] = { slug: e.vak, naam: (k && k.naam) || e.vak, teiken: (k && k.teiken) || 60, zone: (k && k.zone) || null, orde: Object.keys(perSlug).length };
      });
      waarskuwings.push("leerder: geen vakkeuses nie — die rooster se vakke word gebruik");
    }
    var vakke = Object.keys(perSlug).map(function (k) {
      return perSlug[k];
    });
    vakke.forEach(function (v) {
      v.hetWerk = werk.some(function (w) {
        return w.vak === v.slug;
      });
      if (!v.hetWerk) waarskuwings.push("werk: geen werkitems vir " + v.naam + " — die vak kry geen studieblokke nie");
    });
    return vakke;
  }

  function eksamenVir(toestand, vak, vanafDag) {
    var beste = null;
    toestand.rooster.forEach(function (e) {
      if (e.vak !== vak) return;
      if (e.datum < vanafDag) return;
      if (!beste || e.datum < beste.datum || (e.datum === beste.datum && e.tyd < beste.tyd)) beste = e;
    });
    return beste;
  }

  function daeTot(toestand, vak, dag) {
    var e = eksamenVir(toestand, vak, dag);
    /* Vandag se vraestel is al geskryf: die volgende een is die prioriteit, nie vandag s'n nie. */
    if (e && e.datum === dag && toestand.nadat[vak]) e = eksamenVir(toestand, vak, vanDag(naDag(dag) + 1));
    return e ? naDag(e.datum) - naDag(dag) : Infinity;
  }

  /* ---------- 'n studiedag ---------- */

  function dagPlan(dag, toestand) {
    toestand.vandag = {};
    toestand.afgehandel = {};
    toestand.nadat = {};
    var vandag = toestand.rooster.filter(function (e) {
      return e.datum === dag;
    });
    if (vandag.length) return eksamendag(dag, toestand, vandag);
    return studiedag(dag, toestand);
  }

  function venstersVir(dag, toestand) {
    var reels = toestand.reels;
    var soort = isNaweek(dag) ? "naweek" : "week";
    var pare = lys(reels.vensters && reels.vensters[soort]);
    var skooltyd = toestand.skooltye && toestand.skooltye[soort];
    var aandEinde = min(reels.aandEinde || "21:00");
    var uit = [];
    pare.forEach(function (p) {
      var van = min(p[0]);
      var tot = Math.min(min(p[1]), aandEinde);
      if (skooltyd && !isNaweek(dag)) {
        /* Geen studie onder skooltyd nie. */
        if (van < min(skooltyd.tot) && tot > min(skooltyd.van)) van = Math.max(van, min(skooltyd.tot));
      }
      if (tot - van >= reels.minBlokMinute) uit.push([van, tot]);
    });
    /* Middagete: knip die vensters oop om dit. */
    var lunch = lys(reels.middagete).map(min);
    if (lunch.length === 2 && lunch[1] > lunch[0]) {
      var gesny = [];
      uit.forEach(function (p) {
        if (p[1] <= lunch[0] || p[0] >= lunch[1]) {
          gesny.push(p);
          return;
        }
        if (p[0] < lunch[0]) gesny.push([p[0], lunch[0]]);
        if (p[1] > lunch[1]) gesny.push([lunch[1], p[1]]);
      });
      uit = gesny;
    }
    return uit;
  }

  function studiedag(dag, toestand) {
    var reels = toestand.reels;
    var blokke = [];
    var teller = 0;
    var aaneen = 0;
    var laasteVak = null;
    var moreEksamen = eksamenOp(toestand, vanDag(naDag(dag) + 1));
    var vensters = venstersVir(dag, toestand);
    var studie = 0;
    var maksDag = reels.maksMinutePerDag || 9999;

    vensters.forEach(function (v, vi) {
      if (studie >= maksDag) return;
      var wyser = v[0];
      while (wyser + reels.minBlokMinute <= v[1] && studie + reels.minBlokMinute <= maksDag) {
        var beskikbaar = Math.min(v[1] - wyser, maksDag - studie);
        /* Redding-pakket: die twee dae voor 'n vraestel is dit diagnose → leer uit die memo →
           doen oor. Nie 'n volle vraestel eerste nie; 'n vraestel alleen leer 'n mens niks as die
           werk nog nie verstaan word nie. */
        var ladder = reddingLadder(dag, toestand, beskikbaar, wyser, teller);
        if (ladder) {
          ladder.forEach(function (b) {
            blokke.push(b);
            wyser += b.minutes;
            studie += b.minutes;
            teller += 1;
          });
          aaneen = 0;
          laasteVak = ladder[0].subjectSlug;
          continue;
        }
        var keuse = kiesVakEnWerk(dag, toestand, laasteVak, beskikbaar);
        if (!keuse) break;
        var blok = maakWerkBlok(dag, toestand, keuse, wyser, teller++);
        blokke.push(blok);
        wyser += blok.minutes;
        aaneen += blok.minutes;
        studie += blok.minutes;
        laasteVak = keuse.vak.slug;
        /* Ná elke stuk werk: merk en leer met die memo oop. Sonder hierdie stap is 'n vraestel net
           'n toets — die leerder sien nooit hoe die punt verdien word nie (die antwoord op
           "hoe verstaan hy die werk?"). */
        var merkMinute = 0;
        if (blok.soort !== "les" && blok.minutes >= 30 && reels.merkNaWerk !== false) {
          merkMinute = Math.max(15, Math.min(45, Math.round(blok.minutes * (reels.modus === "redding" ? 0.45 : 0.3))));
        }
        if (merkMinute && wyser + merkMinute <= v[1] && studie + merkMinute <= maksDag) {
          blokke.push(merkBlok(dag, keuse, wyser, merkMinute, teller++));
          wyser += merkMinute;
          studie += merkMinute;
          aaneen = 0;
        }
        if (aaneen >= reels.rusNaMinute && wyser + reels.rusMinute + reels.minBlokMinute <= v[1]) {
          blokke.push(pouseBlok(dag, teller++, wyser, reels.rusMinute, "Pouse — water, beweeg."));
          wyser += reels.rusMinute;
          aaneen = 0;
        }
      }
    });

    /* Die dag se werk is klaar. Die laaste kyk (as daar môre 'n eksamen is) en die foutlog-slot sluit
       by die laaste blok aan, sodat 'n mens nie 'n leë gaat van vyf uur in die aand kry nie. */
    var aandEinde = min(reels.aandEinde || "21:00");
    var laasteEinde = blokke.reduce(function (m, b) {
      return b.end && min(b.end) > m ? min(b.end) : m;
    }, 0);
    /* Die laaste kyk vir môre se vraestel hoort in die aand, nie om 12:00 nie. As die dag se werk
       tot in die aand loop, sluit dit by die werk aan. */
    if (laasteEinde && moreEksamen) {
      var kykVan = Math.max(laasteEinde + 15, Math.min(19 * 60 + 30, aandEinde - 45));
      if (kykVan + 20 <= aandEinde) {
        blokke.push({
          id: dag + "-voor-eksamen",
          kind: "warm",
          subjectSlug: moreEksamen.vak,
          minutes: 20,
          start: hm(kykVan),
          end: hm(kykVan + 20),
          soort: "voor-eksamen",
          title: naamVan(toestand, moreEksamen.vak) + " " + moreEksamen.vraestel + " — laaste kyk (geen nuwe werk)",
          detail: "Net jou eie notas en die formaat. GEEN nuwe werk die aand voor 'n eksamen nie."
        });
        laasteEinde = kykVan + 20;
      }
    }
    if (laasteEinde && laasteEinde + 25 <= aandEinde) {
      blokke.push({
        id: dag + "-slot",
        kind: "slot",
        subjectSlug: "foutbank",
        minutes: 20,
        start: hm(laasteEinde + 5),
        end: hm(laasteEinde + 25),
        soort: "les",
        title: "Foutlog + môre se top-3",
        detail: "Skryf die drie goed wat jy vandag verkeerd gedoen het. Môre begin jy daar."
      });
    }

    return {
      date: dag,
      blocks: blokke.sort(opTyd),
      totalMinutes: blokke.reduce(function (s, b) {
        return s + (b.kind === "break" ? 0 : b.minutes);
      }, 0),
      waarskuwings: toestand.waarskuwings
    };
  }

  function opTyd(a, b) {
    var ta = a.start ? min(a.start) : 9999;
    var tb = b.start ? min(b.start) : 9999;
    return ta - tb;
  }

  function eksamenOp(toestand, dag) {
    var lysUit = toestand.rooster.filter(function (e) {
      return e.datum === dag;
    });
    return lysUit.length ? lysUit[0] : null;
  }

  function naamVan(toestand, slug) {
    var v = toestand.vakke.filter(function (x) {
      return x.slug === slug;
    })[0];
    return (v && v.naam) || slug;
  }

  /* ---------- werkkeuse ---------- */

  function kiesVakEnWerk(dag, toestand, laasteVak, beskikbaar) {
    var kandidate = toestand.vakke
      .filter(function (v) {
        return v.hetWerk;
      })
      .map(function (v) {
        return { vak: v, dae: daeTot(toestand, v.slug, dag), orde: v.orde };
      })
      .filter(function (k) {
        /* 'n Vak waarvoor die leerder vandag al geskryf het, is klaar vir vandag. */
        return k.dae !== Infinity && k.dae >= 0 && !toestand.afgehandel[k.vak.slug];
      })
      .sort(function (a, b) {
        return a.dae - b.dae || a.orde - b.orde;
      });
    if (!kandidate.length) return null;

    /* Vermy dieselfde vak twee keer ná mekaar as daar 'n ander vak binne 7 dae is. */
    var herrangskik = kandidate.slice();
    if (laasteVak && herrangskik.length > 1) {
      var eerste = herrangskik[0];
      if (eerste.vak.slug === laasteVak) {
        var ander = herrangskik.filter(function (k) {
          return k.vak.slug !== laasteVak && k.dae <= eerste.dae + 7;
        });
        if (ander.length) herrangskik = ander.concat(herrangskik.filter(function (k) { return ander.indexOf(k) < 0; }));
      }
    }

    /* Volgorde = die volgende vraestel eerste. Vir elke vak: nuwe werk; as daar niks nuuts oor is nie,
       mag 'n vak met 'n eksamen binne 7 dae 'n hersiening (herdoen) kry. 'n Ver vak met net-gesiene
       vraestelle word oorgeslaan, sodat die tyd na die volgende vraestel gaan. */
    for (var i = 0; i < herrangskik.length; i++) {
      var k = herrangskik[i];
      var keuse = kiesWerk(k.vak, toestand, beskikbaar, true, dag);
      if (keuse) return { vak: k.vak, item: keuse.item, plan: keuse.plan, herdoen: false };
      if (k.dae <= 7 && toestand.reels.nooitGesieneVraestel !== false) {
        var her = kiesWerk(k.vak, toestand, beskikbaar, false, dag);
        if (her) return { vak: k.vak, item: her.item, plan: her.plan, herdoen: true };
      }
    }
    return null;
  }

  function kiesWerk(vak, toestand, beskikbaar, nuutWerk, dag) {
    var reels = toestand.reels;
    var vanVak = toestand.werk.filter(function (w) {
      return w.vak === vak.slug;
    });

    if (nuutWerk) {
      var nuut = vanVak.filter(function (w) {
        return !toestand.gesien[w.id] && !toestand.gebruik[w.id];
      });
      var beste = bestePassing(nuut, reels, beskikbaar, toestand.vordering, false);
      if (beste) merkGebruik(toestand, beste, dag);
      return beste;
    }

    var herdoen = vanVak
      .filter(function (w) {
        if (!(toestand.gesien[w.id] || toestand.gebruik[w.id])) return false;
        if (toestand.vandag[w.id] || w.id === toestand.laasteItem) return false;
        /* Dieselfde vraestel nie twee dae ná mekaar nie. */
        return daeSedert(toestand.laas[w.id], dag) >= 2;
      })
      /* Minste kere eerste: die oudste vraestel kom eerste terug. */
      .sort(function (a, b) {
        return (toestand.gebruik[a.id] || 0) - (toestand.gebruik[b.id] || 0);
      });
    var her = bestePassing(herdoen, reels, beskikbaar, null, true);
    if (her) merkGebruik(toestand, her, dag);
    return her;
  }

  function daeSedert(vorige, dag) {
    if (!vorige) return 999;
    return Math.abs(naDag(dag) - naDag(vorige));
  }

  /* 'n Deel van 'n vraestel bly beskikbaar tot al die vrae gedoen is; eers dan is dit "gesien". */
  function merkGebruik(toestand, keuse, dag) {
    var id = keuse.item.id;
    toestand.laasteItem = id;
    toestand.vandag[id] = true;
    toestand.laas[id] = dag;
    if (keuse.plan.klaar) {
      toestand.gebruik[id] = (toestand.gebruik[id] || 0) + 1;
      delete toestand.vordering[id];
    } else {
      toestand.vordering[id] = keuse.plan.nrs[keuse.plan.nrs.length - 1];
    }
  }

  function bestePassing(kandidate, reels, beskikbaar, vordering, isHerdoen) {
    if (!kandidate.length) return null;
    var vol = [];
    var deel = [];
    kandidate.forEach(function (item) {
      var vanaf = vordering && !isHerdoen ? vordering[item.id] || 0 : 0;
      var plan = beplanWerk(item, beskikbaar, reels, vanaf);
      if (!plan) return;
      if (plan.tipe === "vraestel") vol.push({ item: item, plan: plan });
      else deel.push({ item: item, plan: plan });
    });
    var kies = vol[0] || deel.sort(function (a, b) {
      return b.plan.punte - a.plan.punte;
    })[0];
    if (!kies) return null;
    return { item: kies.item, plan: kies.plan, herdoen: !!isHerdoen };
  }

  /* Hoeveel van die vraestel pas in die beskikbare tyd? 'n Volle vraestel mag tot
     maksVraestelMinute duur (eksamenlengte); 'n deel van 'n vraestel bly onder maksBlokMinute.
     `vanaf` = hoeveel vrae al gedoen is (die volgende blok gaan voort waar die vorige een opgehou het). */
  function beplanWerk(item, beskikbaar, reels, vanaf) {
    vanaf = vanaf || 0;
    var minimum = reels.minBlokMinute;
    var maksVol = Math.min(reels.maksVraestelMinute || 180, beskikbaar);
    var maksDeel = Math.min(reels.maksBlokMinute, beskikbaar);
    if (maksVol < minimum) return null;

    var vrae = (item.vrae || []).map(Number);
    if (!vrae.length) {
      var d = item.tydMin || Math.round(item.punte * reels.minPerPunt);
      if (d > maksVol) return null;
      return { tipe: "vraestel", nrs: null, punte: item.punte, duur: Math.max(minimum, d), klaar: true };
    }
    if (vanaf >= vrae.length) return null;
    var totaal = vrae.reduce(function (s, p) {
      return s + p;
    }, 0);
    var volDuur = item.tydMin || Math.round(totaal * reels.minPerPunt);
    if (vanaf === 0 && volDuur <= maksVol) {
      return { tipe: "vraestel", nrs: null, punte: totaal, duur: Math.max(minimum, volDuur), klaar: true };
    }
    if (maksDeel < minimum) return null;
    var som = 0;
    var nrs = [];
    for (var i = vanaf; i < vrae.length; i++) {
      var volgende = som + vrae[i];
      if (Math.round(volgende * reels.minPerPunt) > maksDeel) break;
      som += vrae[i];
      nrs.push(i + 1);
    }
    if (!nrs.length) return null;
    return {
      tipe: "vrae",
      nrs: nrs,
      punte: som,
      duur: Math.max(minimum, Math.min(maksDeel, Math.round(som * reels.minPerPunt))),
      klaar: nrs[nrs.length - 1] === vrae.length
    };
  }

  function maakWerkBlok(dag, toestand, keuse, wyser, teller) {
    var item = keuse.item;
    var plan = keuse.plan;
    var vak = keuse.vak;
    var nrs = plan.nrs && plan.nrs.length ? " · Vraag " + plan.nrs.join(", ") : "";
    return {
      id: dag + "-" + vak.slug + "-" + (teller + 1),
      kind: vak.zone || zoneVolgensUrgentie(daeTot(toestand, vak.slug, dag)),
      subjectSlug: vak.slug,
      minutes: plan.duur,
      start: hm(wyser),
      end: hm(wyser + plan.duur),
      /* Die werk is 'n PDF in 'n ander oortjie: dit is "skrif", nie 'n in-app "toets" nie.
         So kry die blok geen oortjie-slot nie (LL-20) en die sessie weet dat die werk buite is. */
      soort: keuse.herdoen ? "herdoen" : item.vraestel ? "skrif" : "toets",
      punte: plan.punte,
      title: item.titel + " (" + plan.punte + " punte, " + plan.duur + " min)" + (keuse.herdoen ? " — herdoen" : ""),
      detail:
        (keuse.herdoen ? "Jy het hierdie werk al gesien: doen dit weer sonder die memo, dan merk." : "Getimed. Memo eers ná die tyd.") +
        nrs +
        (item.bron && item.bron.verwysing ? " · " + item.bron.verwysing : ""),
      werk: plan.nrs ? { tipe: "vrae", id: item.id, nrs: plan.nrs } : { tipe: "vraestel", id: item.id }
    };
  }

  function zoneVolgensUrgentie(dae) {
    if (dae <= 3) return "rooi";
    if (dae <= 7) return "geel";
    return "groen";
  }

  /* Drie blokke op dieselfde vrae: diagnose (memo toe) → leer uit die memo (oop) → doen oor.
     Dit werk net in "redding"-modus en net vir 'n vak met 'n vraestel binne 2 dae. */
  function reddingLadder(dag, toestand, beskikbaar, wyser, teller, opsies) {
    var reels = toestand.reels;
    if (reels.modus !== "redding") return null;
    var maksDae = opsies && opsies.ver ? opsies.ver : 2;
    var kandid = toestand.vakke
      .filter(function (v) { return v.hetWerk && !toestand.afgehandel[v.slug]; })
      .map(function (v) { return { vak: v, dae: daeTot(toestand, v.slug, dag) }; })
      .filter(function (k) { return k.dae >= 0 && k.dae <= maksDae; })
      .sort(function (a, b) { return a.dae - b.dae || a.vak.orde - b.vak.orde; });
    for (var i = 0; i < kandid.length; i++) {
      var vak = kandid[i].vak;
      /* Watter vraestel skryf hy volgende? Voorkeur vir dieselfde nommer (V2 na V1), anders enige. */
      var volgendeEksamen = eksamenVir(toestand, vak.slug, dag) || {};
      /* Vandag se vraestel is al geskryf: die volgende een is die teiken (V2, nie die V1 wat pas klaar is). */
      if (volgendeEksamen.datum === dag && toestand.nadat[vak.slug]) {
        volgendeEksamen = eksamenVir(toestand, vak.slug, vanDag(naDag(dag) + 1)) || volgendeEksamen;
      }
      var nommer = String(volgendeEksamen.vraestel || "").match(/V\d/);
      function pas(w) {
        return !nommer || new RegExp("\\b" + nommer[0] + "\\b").test(w.titel || "");
      }
      var ongebruik = toestand.werk.filter(function (w) {
        return w.vak === vak.slug && !toestand.gebruik[w.id] && !toestand.gesien[w.id];
      });
      var nuutItem = ongebruik.filter(pas)[0] || ongebruik[0];
      var herhaling = false;
      var item = nuutItem;
      if (!item) {
        /* Alles al gesien: 'n redding gebruik dieselfde vraestel weer (voorbeeld -> doen -> merk).
           Dit is juis wat 'n kind nodig het wat die werk nog nie verstaan nie. */
        var gesienLys = toestand.werk.filter(function (w) {
          return w.vak === vak.slug && !toestand.vandag[w.id] && daeSedert(toestand.laas[w.id], dag) >= 1;
        });
        item = (gesienLys.filter(pas)[0]
          ? gesienLys.filter(pas)
          : gesienLys
        ).sort(function (a, b) {
          return (toestand.gebruik[a.id] || 0) - (toestand.gebruik[b.id] || 0);
        })[0];
        herhaling = true;
      }
      if (!item || !item.vrae || !item.vrae.length) continue;
      var vanaf = herhaling ? 0 : toestand.vordering[item.id] || 0;
      if (vanaf >= item.vrae.length) continue;
      var nrs = [];
      var punte = 0;
      for (var j = vanaf; j < item.vrae.length && nrs.length < 3; j++) {
        nrs.push(j + 1);
        punte += item.vrae[j];
      }
      var d1 = Math.max(20, Math.min(40, Math.round(punte * reels.minPerPunt)));
      var d2 = d1;
      var d3 = Math.max(15, Math.round(d1 * 0.6));
      if (d1 + d2 + d3 > beskikbaar) continue;
      var werk = { tipe: "vrae", id: item.id, nrs: nrs.slice() };
      var klaar = nrs[nrs.length - 1] === item.vrae.length;
      toestand.laas[item.id] = dag;
      toestand.vandag[item.id] = true;
      if (herhaling) {
        toestand.gebruik[item.id] = (toestand.gebruik[item.id] || 0) + 1;
      } else {
        toestand.vordering[item.id] = nrs[nrs.length - 1];
        if (klaar) {
          toestand.gebruik[item.id] = (toestand.gebruik[item.id] || 0) + 1;
          delete toestand.vordering[item.id];
        }
      }
      var wie = "vrae " + nrs[0] + (nrs.length > 1 ? "–" + nrs[nrs.length - 1] : "");
      var t = teller;
      /* Eers die voorbeeld (die memo verduidelik die werk), dan doen hy dit self, dan merk hy.
         'n Kind wat die werk nog nie verstaan nie, kry nie eerste 'n vraestel nie. */
      return [
        {
          id: dag + "-redding-" + (t + 1),
          kind: "geel",
          subjectSlug: vak.slug,
          minutes: d1,
          start: hm(wyser),
          end: hm(wyser + d1),
          soort: "les",
          title: "Voorbeeld: " + item.titel + " — " + wie + " (memo oop)",
          detail: "Lees die memo se antwoord as 'n uitgewerkte voorbeeld. Skryf elke stap en waar die punt verdien word neer; dit is die werk wat jy moet ken.",
          werk: werk
        },
        {
          id: dag + "-redding-" + (t + 2),
          kind: vak.zone || "rooi",
          subjectSlug: vak.slug,
          minutes: d2,
          start: hm(wyser + d1),
          end: hm(wyser + d1 + d2),
          soort: "toets",
          punte: punte,
          title: "Doen dit self: " + item.titel + " — " + wie + " (memo toe)",
          detail: "Dieselfde vrae, nou sonder die memo. Skryf dieselfde stappe neer; dit is jou crash course.",
          werk: werk
        },
        {
          id: dag + "-redding-" + (t + 3),
          kind: "geel",
          subjectSlug: vak.slug,
          minutes: d3,
          start: hm(wyser + d1 + d2),
          end: hm(wyser + d1 + d2 + d3),
          soort: "merk",
          title: "Merk en vergelyk: " + item.titel + " — " + wie,
          detail: "Memo oop. Vergelyk jou stappe met die memo; skryf die verskil en die rede neer. Wat jy nie kon doen nie, is jou teorie vir vandag.",
          werk: werk
        }
      ];
    }
    return null;
  }

  function merkBlok(dag, keuse, wyser, minute, teller) {
    var vak = keuse.vak;
    return {
      id: dag + "-merk-" + (teller + 1),
      kind: vak.zone || "geel",
      subjectSlug: vak.slug,
      minutes: minute,
      start: hm(wyser),
      end: hm(wyser + minute),
      soort: "merk",
      title: "Merk en leer — " + keuse.item.titel,
      detail:
        "Memo oop. Merk elke antwoord teen die memo, skryf die rede vir elke verlore punt neer en doen daardie vrae dadelik oor.",
      werk: keuse.plan.nrs
        ? { tipe: "vrae", id: keuse.item.id, nrs: keuse.plan.nrs.slice() }
        : { tipe: "vraestel", id: keuse.item.id }
    };
  }

  function pouseBlok(dag, teller, wyser, minute, titel) {
    return {
      id: dag + "-pouse-" + (teller + 1),
      kind: "break",
      subjectSlug: "break",
      minutes: minute,
      start: hm(wyser),
      end: hm(wyser + minute),
      soort: "pouse",
      title: titel || "Pouse",
      detail: ""
    };
  }

  /* ---------- 'n eksamendag ---------- */

  function eksamendag(dag, toestand, eksamens) {
    var reels = toestand.reels;
    var blokke = [];
    var teller = 0;
    /* Die dag begin 75 min voor die eksamen se buffer (en nooit voor 06:45 nie), sodat 'n 14:00-vraestel
       nie 'n plan van 06:45 af gee nie. */
    var eersteTyd = min(eksamens[0].tyd);
    var wyser = Math.max(6 * 60 + 45, eersteTyd - reels.eksamenBufferMinute - 75);
    var oggendMinute = Math.max(0, Math.min(45, eersteTyd - reels.eksamenBufferMinute - wyser));

    blokke.push(pouseBlok(dag, teller++, wyser, oggendMinute, "Opstaan, ontbyt, dokumente"));
    wyser += oggendMinute;

    eksamens.forEach(function (e) {
      var begin = min(e.tyd);
      var einde = begin + Number(e.duur);
      var aandEinde = min(reels.aandEinde || "21:00");
      if (einde > aandEinde) {
        toestand.waarskuwings.push("rooster: " + e.vak + " " + e.vraestel + " eindig om " + hm(einde) + ", ná aandEinde (" + reels.aandEinde + ")");
        einde = Math.max(begin + 30, aandEinde);
      }
      /* Geen nuwe werk voor 'n eksamen nie: net 'n laaste kyk na eie notas. */
      var kykVan = wyser;
      var kykTot = begin - reels.eksamenBufferMinute;
      if (kykTot - kykVan >= 10) {
        blokke.push({
          id: dag + "-voor-" + (teller + 1),
          kind: "warm",
          subjectSlug: e.vak,
          minutes: kykTot - kykVan,
          start: hm(kykVan),
          end: hm(kykTot),
          soort: "voor-eksamen",
          title: naamVan(toestand, e.vak) + " " + e.vraestel + " — laaste kyk (geen nuwe werk)",
          detail: "Formaat, jou eie notas, die tydkaart. GEEN nuwe vraestel nie."
        });
      }
      blokke.push({
        id: dag + "-eksamen-" + (teller + 1),
        kind: "break",
        subjectSlug: "break",
        minutes: einde - begin,
        start: e.tyd,
        end: hm(einde),
        soort: "pouse",
        title: (naamVan(toestand, e.vak) + " " + e.vraestel + " — EKSAMEN (skool) " + e.tyd + "–" + hm(einde)).toUpperCase(),
        detail: (e.punte ? e.punte + " punte · " : "") + e.duur + " min. Sterkte!"
      });
      wyser = einde + 45;
      if (wyser < einde + 60) wyser = einde + 60;
      blokke.push(pouseBlok(dag, teller++, einde, Math.min(60, wyser - einde), "Rus en eet ná die eksamen"));
    });

    /* Terugskou: wat het gekom, wat doen jy anders. Geen nuwe werk. */
    var terugVan = wyser;
    if (terugVan + 20 <= min(reels.aandEinde)) {
      blokke.push({
        id: dag + "-terugskou",
        kind: "geel",
        subjectSlug: eksamens[eksamens.length - 1].vak,
        minutes: 20,
        start: hm(terugVan),
        end: hm(terugVan + 20),
        soort: "les",
        title: "Skryf neer wat gekom het (5 minute) + 3 lesse",
        detail: "Watter vrae was moeilik? Wat doen jy volgende keer anders? Dit help met die volgende vraestel."
      });
      wyser = terugVan + 20;
    }

    /* Ná die eksamen: net hersiening van gesiene werk, of niks (reëls.nuweWerkNaEksamen). */
    eksamens.forEach(function (e) {
      /* Net "klaar" as daar nie later nog 'n vraestel vir die vak is nie. Anders is die vak se
         volgende vraestel (bv. V2 twee dae later) nog 'n prioriteit. */
      toestand.nadat[e.vak] = true;
      if (!eksamenVir(toestand, e.vak, vanDag(naDag(dag) + 1))) toestand.afgehandel[e.vak] = true;
      /* Nie die hele vak vir die dag blokkeer nie: die volgende vraestel (bv. V2) is nog 'n
         prioriteit. Die redding kies die minste-gebruikte vraestel, dus nie die een wat hy pas
         geskryf het as daar 'n ander een is nie. */
    });
    if (reels.nuweWerkNaEksamen !== true) {
      /* 'n Merker, nie 'n 8-uur-pouse nie: die ou plan het ook 'n nul-lengte "klaar"-blok. */
      blokke.push(pouseBlok(dag, teller++, wyser, 0, "Klaar vir vandag. Skerms af teen " + reels.aandEinde + "."));
    } else {
      var maksDag = reels.maksMinutePerDag || 9999;
      var studies = 0;
      var v2 = venstersVir(dag, toestand).filter(function (p) {
        return p[0] >= wyser;
      });
      v2.forEach(function (p) {
        if (studies >= maksDag) return;
        var w = p[0];
        while (w + reels.minBlokMinute <= p[1] && studies + reels.minBlokMinute <= maksDag) {
          var ladder2 = reddingLadder(dag, toestand, Math.min(p[1] - w, maksDag - studies), w, teller, { ver: 4 });
          if (!ladder2) break;
          /* Eksamendag: net EEN ligte blok ná die eksamen — die voorbeeld met die memo oop.
             Die volle siklus (voorbeeld -> self doen -> merk) begin môre; vandag was al 2½ uur se
             eksamen. Geen volle vraestel "herdoen" op dieselfde dag nie. */
          var lig = ladder2.slice(0, 1);
          lig.forEach(function (b) {
            blokke.push(b);
            w += b.minutes;
            studies += b.minutes;
            teller += 1;
          });
          break;
        }
      });
      /* Die dag mag nie in die middel van die middag doodloop nie: 'n kort foutlog in die aand. */
      var laatste = blokke.reduce(function (m, b) { return Math.max(m, min(b.end)); }, 0);
      var aand = min(reels.aandEinde || "21:00");
      if (laatste < 19 * 60 + 30 && laatste + 20 <= aand) {
        var foutVan = Math.max(19 * 60 + 30, laatste + 60);
        if (foutVan + 20 <= aand) {
          blokke.push({
            id: dag + "-foutlog",
            kind: "slot",
            subjectSlug: "foutbank",
            minutes: 20,
            start: hm(foutVan),
            end: hm(foutVan + 20),
            soort: "les",
            title: "Foutlog + môre se top-3",
            detail: "Skryf jou drie grootste foute van vandag neer. Môre begin jy daar — nie by bladsy een nie."
          });
        }
      }
    }

    return {
      date: dag,
      blocks: blokke.sort(opTyd),
      totalMinutes: blokke.reduce(function (s, b) {
        return s + (b.kind === "break" ? 0 : b.minutes);
      }, 0),
      waarskuwings: toestand.waarskuwings
    };
  }

  SKOOL.PLAN = { genereer: genereer, beplanWerk: beplanWerk, zoneVolgensUrgentie: zoneVolgensUrgentie };
})(typeof window !== "undefined" ? window : this);
