/* fout-RAG: die soektog agter die foutvanger.
   `node tests/fout-rag.test.js`

   Wat hier getoets word:
   1. elke inskrywing het 'n bron wat werklik bestaan (lêer + reël) — AGENTS.md §2.4;
   2. die nagespoorde data/fout-rag.json pas nog by sy bronne (`bou-fout-rag.js --kyk`);
   3. 'n woordelikse sein-treffer wen (die outomatiese pad);
   4. 'n simptoom in ANDER woorde gestel, kry steeds die regte antwoord (die mens-pad);
   5. onverwante teks gee `null`, nie 'n uitgedinkte antwoord nie;
   6. die vak-konteks help, maar sluit nooit uit nie;
   7. die soektog skryf NIKS (geen localStorage), gebruik geen netwerk in `soek`, is deterministies,
      en gooi nooit 'n fout nie — ook nie met rommel-invoer nie. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { spawnSync } = require("child_process");

const root = path.join(__dirname, "..");
const fails = [];
let passed = 0;
function assert(cond, msg) {
  if (cond) passed += 1;
  else fails.push(msg);
}

/* --- die korpus --- */
const korpusTeks = fs.readFileSync(path.join(root, "data", "fout-rag.json"), "utf8");
const korpus = JSON.parse(korpusTeks);

/* --- 1. elke bron bestaan --- */
korpus.inskrywings.forEach((e) => {
  const m = /^(.+):(\d+)$/.exec(e.bron || "");
  if (!m) {
    assert(false, `${e.id}: bron "${e.bron}" is nie "lêer:reël" nie`);
    return;
  }
  const volle = path.join(root, m[1]);
  if (!fs.existsSync(volle)) {
    assert(false, `${e.id}: bron-lêer bestaan nie: ${m[1]}`);
    return;
  }
  const reëls = fs.readFileSync(volle, "utf8").replace(/\r\n/g, "\n").split("\n").length;
  assert(Number(m[2]) >= 1 && Number(m[2]) <= reëls, `${e.id}: bron-reël ${m[2]} val buite ${m[1]} (${reëls} reëls)`);
  assert(Boolean(e.antwoord && e.antwoord.length >= 40), `${e.id}: antwoord te kort of leeg`);
  assert(
    Boolean((e.simptome && e.simptome.length) || (e.seine && e.seine.length)),
    `${e.id}: geen simptoom en geen sein nie`
  );
});
assert(korpus.inskrywings.length >= 20, `die korpus is te klein: ${korpus.inskrywings.length}`);

/* --- 1b. `bewys`: 'n antwoord wat sê wat die app DOEN, moet deur die kode gedek wees --- */
/* QC 28 Okt: die bron-kontrole hierbo keur 'n REËLNOMMER goed, nie 'n feit nie. So het
   `les-sessie-begin-nie` beweer 'n sessie mag sonder kamera begin (onwaar) met LL-21 as "bron" —
   'n les wat nie eens oor die kamera gaan nie. `bewys` hou die bewering teen die kode vas. */
let metBewys = 0;
korpus.inskrywings.forEach((e) => {
  if (!e.bewys) return;
  metBewys += 1;
  e.bewys.forEach((b) => {
    const volle = path.join(root, b.lêer);
    if (!fs.existsSync(volle)) {
      assert(false, `${e.id}: bewys-lêer bestaan nie: ${b.lêer}`);
      return;
    }
    const inhoud = fs.readFileSync(volle, "utf8").replace(/\r\n/g, "\n");
    assert(inhoud.indexOf(b.patroon) >= 0, `${e.id}: bewys ontbreek in ${b.lêer}: "${b.patroon}"`);
  });
});
assert(metBewys >= 2, `te min inskrywings met 'n kode-bewys: ${metBewys}`);

/* Die kamera-antwoord spesifiek: dit mag NOOIT weer sê 'n sessie begin sonder kamera nie. */
const kamera = korpus.inskrywings.find((e) => e.id === "les-sessie-begin-nie");
assert(Boolean(kamera), "les-sessie-begin-nie ontbreek");
if (kamera) {
  assert(
    /kamera nodig|vereis kamera|sonder dit begin dit nie/i.test(kamera.antwoord),
    "les-sessie-begin-nie moet sê die kamera is nodig (proctor.js gee {ok:false} sonder kamera)"
  );
  assert(
    !/mag sonder die kamera begin|druk weer 'Begin sessie'/i.test(kamera.antwoord),
    "les-sessie-begin-nie mag nie sê dat 'n sessie sonder kamera begin of dat hy weer moet druk nie"
  );
}
/* Die memo-antwoord mag nie die LL-01-kortpad leer nie. */
const memo = korpus.inskrywings.find((e) => e.id === "les-memo-hek");
if (memo) {
  assert(/60%|regtig die werk/i.test(memo.antwoord), "les-memo-hek moet die werk-voorwaarde noem, nie net 'Klaar' nie");
}
/* Geen antwoord mag self beweer dat Pa die melding gekry het nie. Net die skerm weet of dit
   werklik getou is (fout-vanger.js vra WALLIE.SYNC); 'n antwoord wat dit onvoorwaardelik belowe,
   is dieselfde sonde as die ou e-pos-belofte — en dit het boonop twee keer in die strokie gestaan
   (28 Okt). Die antwoord sê wat Wallie moet DOEN; die skerm sê wat Pa kry. */
korpus.inskrywings.forEach((e) => {
  assert(
    !/Pa (kry|sien|het|is)[^.]*(melding|in kennis)/i.test(e.antwoord),
    `${e.id}: die antwoord belowe self dat Pa die melding kry — laat die skerm dit sê`
  );
});

/* Niks in die korpus mag vir Wallie sê om die werk buite die app te gaan haal nie (AGENTS §2.9, LL-17). */
korpus.inskrywings.forEach((e) => {
  if (e.id === "les-werk-in-die-app") return;
  assert(
    !/Pa gee jou die vraestel|vra vir Pa\b/i.test(e.antwoord),
    `${e.id}: die antwoord stuur Wallie uit die app uit (AGENTS §2.9, LL-17)`
  );
});

/* --- 2. die nagespoorde lêer pas nog by sy bronne --- */
const kyk = spawnSync("node", ["scripts/bou-fout-rag.js", "--kyk"], { cwd: root, encoding: "utf8" });
assert(kyk.status === 0, `bou-fout-rag.js --kyk faal: ${(kyk.stderr || kyk.stdout || "").trim()}`);

/* --- die module in 'n sandbox, sonder netwerk en met 'n localStorage wat elke skryf meld --- */
const skryf = [];
let fetchKeer = 0;
function maakSandbox() {
  const sb = {
    console,
    JSON,
    Math,
    Date,
    localStorage: {
      getItem: () => null,
      setItem: (k) => skryf.push(k),
      removeItem: (k) => skryf.push(k)
    },
    fetch: () => {
      fetchKeer += 1;
      return Promise.reject(new Error("vanlyn"));
    }
  };
  sb.window = sb;
  sb.globalThis = sb;
  vm.runInNewContext(fs.readFileSync(path.join(root, "assets/js/fout-rag.js"), "utf8"), sb, {
    filename: "assets/js/fout-rag.js"
  });
  return sb;
}

const sb = maakSandbox();
const RAG = sb.WALLIE && sb.WALLIE.FOUTRAG;
assert(Boolean(RAG), "WALLIE.FOUTRAG is nie gedefinieer nie");
if (!RAG) {
  console.error("fout-rag: FOUT\n - " + fails.join("\n - "));
  process.exit(1);
}

/* Sonder korpus (die fetch het misluk): stil `null`, nooit 'n fout nie. */
assert(RAG.gereed() === false, "sonder korpus moet gereed() vals wees");
assert(RAG.soek("die skerm is leeg") === null, "sonder korpus moet soek() null gee");

RAG._setKorpus(korpus);
assert(RAG.gereed() === true, "met die korpus moet gereed() waar wees");

/* --- 3. die outomatiese pad: die foutvanger se WERKLIKE navraag- en sein-vorm --- */
/* `fout-vanger.js` gee die navraag as "Name: boodskap" (JS) of "404 <pad>" (hulpbron), en die sein as
   `js|<boodskap, getalle #>|<lêer>` of `hulpbron|script|<pad>`. Hierdie agt gevalle is op 28 Okt teen
   die vanger se werklike uitset nagegaan: twee het eers die VERKEERDE antwoord gegee (die stoor-fout
   en die kamera-fout het die algemene skrip-antwoord gekry, want die sein noem ook die lêernaam).
   Hulle staan hier sodat dit nie weer kan wegsak nie. */
const seinGevalle = [
  {
    navraag: "TypeError: WALLIE.lessonUI.renderSessionWerk is not a function",
    sein: "js|typeerror: wallie.lessonui.rendersessionwerk is not a function|assets/js/lesson-ui.js",
    wag: "sein-typeerror"
  },
  {
    navraag: "404 assets/js/vraebank-v3.js",
    sein: "hulpbron|script|assets/js/vraebank-v3.js",
    wag: "sein-skrip-laai-nie"
  },
  {
    navraag: "404 data/rag-dekking.json",
    sein: "hulpbron|script|data/rag-dekking.json",
    /* spesifiek klop die vangnet */
    wag: "sein-rag-dekking"
  },
  {
    navraag: "QuotaExceededError: Failed to execute 'setItem' on 'Storage'",
    sein: "js|quotaexceedederror: failed to execute setitem on storage|assets/js/storage.js",
    wag: "sein-stoor-vol"
  },
  {
    navraag: "TypeError: Failed to fetch",
    sein: "js|typeerror: failed to fetch|assets/js/sync.js",
    wag: "sein-netwerk"
  },
  {
    navraag: "NotAllowedError: Permission denied by system",
    sein: "js|notallowederror: permission denied by system|assets/js/proctor.js",
    wag: "les-sessie-begin-nie"
  },
  {
    navraag: "404 assets/css/app.css",
    sein: "hulpbron|link|assets/css/app.css",
    wag: "sein-skrip-laai-nie"
  },
  {
    navraag: "403 https://www.education.gov.za/LinkClick.aspx?fileticket=abc",
    sein: "js|# linkclick|assets/js/dbe-vraestelle.js",
    wag: "sein-dbe-skakel"
  }
];
seinGevalle.forEach((g) => {
  const r = RAG.soek(g.navraag, { sein: g.sein });
  assert(Boolean(r), `sein "${g.sein.slice(0, 40)}…" gee geen treffer nie`);
  if (r) {
    assert(r.id === g.wag, `"${g.navraag.slice(0, 44)}" gee ${r.id} (${r.punt}), verwag ${g.wag}`);
    assert(r.punt >= 0.8, `'n sein-treffer moet ≥ 0.8 wees, is ${r.punt} (${r.id})`);
    assert(Boolean(r.bron && /:\d+$/.test(r.bron)), `${r.id}: die treffer gee geen bron terug nie`);
  }
});
/* 'n vangnet-inskrywing mag nooit 'n spesifieke inskrywing klop nie */
const vangnet = korpus.inskrywings.filter((e) => e.sein_algemeen);
assert(vangnet.length >= 1, "daar moet minstens een vangnet-inskrywing wees (sein_algemeen)");
/* 'n sein mag nie so los wees dat dit in enige ander inskrywing se sein voorkom nie */
korpus.inskrywings.forEach((e) => {
  (e.seine || []).forEach((s) => {
    assert(s.length >= 5, `${e.id}: sein "${s}" is te los (minder as 5 karakters)`);
    assert(s === s.toLowerCase(), `${e.id}: sein "${s}" moet kleinletters wees`);
  });
});

/* --- 4. die mens-pad: die simptoom in Wallie se eie woorde, nie die FAQ se woorde nie --- */
const woordGevalle = [
  { vraag: "my excel lêer wil nie oopgaan nie en vra 'n wagwoord", vak: "rtt", wag: ["faq-rtt-wagwoord", "faq-rtt-maak-oop"] },
  { vraag: "waar kry ek die puntebande vir die opstel", vak: "engels", wag: ["faq-rubriek"] },
  { vraag: "die app het my gesluit terwyl ek die memo lees", vak: "rtt", wag: ["les-oortjie-slot", "faq-rtt-slot"] },
  { vraag: "kan ek werk as daar nie internet is nie", vak: "algemeen", wag: ["faq-sonder-net"] },
  { vraag: "hierdie is dieselfde vraestel wat ek al gedoen het", vak: "wiskgelett", wag: ["les-selfde-vraestel"] },
  { vraag: "mag ek 'n sakrekenaar gebruik", vak: "toerisme", wag: ["faq-sakrekenaar"] },
  { vraag: "my opstel stoor nie in die app nie", vak: "afrikaans", wag: ["faq-skryf-stoor", "faq-sonder-net"] },
  { vraag: "die blok sê pa moet vir my die vraestel gee", vak: "gasvryheid", wag: ["les-werk-in-die-app"] },
  /* 28 Okt: hierdie drie het eers NIKS gegee nie. "reageer" staan nêrens in die korpus nie, en 'n
     onbekende woord het die hele navraag oorheers. Die model se onbekend-gewig is reggestel én die
     gewone Afrikaanse variante staan nou by die simptome. Hulle bly hier staan. */
  { vraag: "Die memo-knoppie reageer nie.", vak: "engels", wag: ["les-memo-hek"] },
  { vraag: "die app reageer glad nie meer nie", vak: "rtt", wag: ["sein-typeerror", "sein-skrip-laai-nie"] },
  { vraag: "niks gebeur as ek op die knoppie druk nie", vak: "rtt", wag: ["sein-typeerror", "sein-skrip-laai-nie", "les-memo-hek"] }
];
woordGevalle.forEach((g) => {
  const r = RAG.soek(g.vraag, { vak: g.vak });
  assert(Boolean(r), `"${g.vraag}" gee geen treffer nie (drempel ${RAG.MIN_PUNT})`);
  if (r) {
    assert(
      g.wag.indexOf(r.id) >= 0,
      `"${g.vraag}" gee ${r.id} (${r.punt}), verwag een van ${g.wag.join(" / ")}`
    );
  }
});

/* --- 5. onverwante teks: liewer stilbly as iets uitdink --- */
/* Die tweede helfte van hierdie lys kom uit die onafhanklike QC (28 Okt). Elkeen het 'n VERKEERDE
   antwoord bo die ou drempel van 0.17 gekry — "die app werk nie" het RTT se Word/Excel-stoorraad
   gekry, "help" 'n diagnose uit die duim, "waar is die vraestel" die memo-wenk (wat hom na LL-01 se
   kortpad stuur). Die drempel is 0.30, "waar/wanneer/wie" is stopwoorde, en 'n verkeerde vak straf
   nou. Hulle bly hier staan sodat dit nie terugsak nie. */
const rommel = [
  "zzzz qqqq xxxx",
  "wat is die hoofstad van mongolië",
  "lorem ipsum dolor sit amet consectetur",
  "",
  "die app werk nie",
  "help",
  "waar is die vraestel",
  "waar is my eksamen",
  "my punte is weg",
  "kan ek more skryf",
  "wat moet ek nou doen"
];
rommel.forEach((t) => {
  const r = RAG.soek(t);
  assert(r === null, `"${t}" moes null gee, het ${r && r.id} (${r && r.punt})`);
});

/* --- 6. die vak help, maar sluit nie uit nie --- */
const sonderVak = RAG.soek("die dbe skakel na die vraestel laai nie");
const metVak = RAG.soek("die dbe skakel na die vraestel laai nie", { vak: "rtt" });
assert(Boolean(sonderVak), "sonder vak moes die dbe-skakel-vraag steeds 'n treffer gee");
assert(Boolean(metVak), "met vak moes die dbe-skakel-vraag 'n treffer gee");
if (sonderVak && metVak) {
  assert(metVak.punt >= sonderVak.punt, `die vak-bonus moet nie die punt verlaag nie (${metVak.punt} < ${sonderVak.punt})`);
}
/* 'n vak wat niks met die vraag te doen het nie, mag die regte antwoord nie wegneem nie */
const vreemdeVak = RAG.soek("waar kry ek die rubriek", { vak: "rtt" });
assert(Boolean(vreemdeVak), "'n vreemde vak mag die treffer nie heeltemal wegneem nie");

/* --- 7. deterministies, stil, sonder netwerk en sonder foute --- */
const a = RAG.soek("die skerm het gesluit terwyl ek die memo lees", { vak: "rtt" });
const b = RAG.soek("die skerm het gesluit terwyl ek die memo lees", { vak: "rtt" });
assert(JSON.stringify(a) === JSON.stringify(b), "dieselfde navraag moet dieselfde antwoord gee");

const voorFetch = fetchKeer;
RAG.soek("enigiets", { vak: "rtt" });
assert(fetchKeer === voorFetch, "soek() mag nie die netwerk gebruik nie");
assert(skryf.length === 0, `fout-rag het na localStorage geskryf: ${skryf.join(", ")}`);

/* rommel-invoer mag nooit gooi nie */
const rommelInvoer = [undefined, null, 0, {}, [], NaN, { toString() { throw new Error("stuk"); } }];
rommelInvoer.forEach((v) => {
  let gegooi = false;
  try {
    RAG.soek(v, { vak: v, sein: v });
  } catch (e) {
    gegooi = true;
  }
  assert(!gegooi, `soek() het gegooi met invoer ${String(v && v.toString ? "objek" : v)}`);
});

/* 'n stukkende korpus mag nie gooi nie */
[null, {}, { inskrywings: [] }, { inskrywings: [{ id: "x" }] }].forEach((k) => {
  let gegooi = false;
  try {
    RAG._setKorpus(k);
    RAG.soek("die skerm is leeg");
  } catch (e) {
    gegooi = true;
  }
  assert(!gegooi, `'n stukkende korpus het laat gooi: ${JSON.stringify(k)}`);
});

/* die laai-pad probeer hoogstens twee keer (geen lus nie) */
const sb2 = maakSandbox();
const voor = fetchKeer;
for (let i = 0; i < 5; i += 1) sb2.WALLIE.FOUTRAG.laai();
assert(fetchKeer - voor <= 1, `laai() moet ná die eerste mislukking ophou, het ${fetchKeer - voor} keer meer probeer`);

if (fails.length) {
  console.error("fout-rag: FOUT\n - " + fails.join("\n - "));
  process.exit(1);
}
console.log(`fout-rag: ok (${passed} kontroles, ${korpus.inskrywings.length} inskrywings)`);
