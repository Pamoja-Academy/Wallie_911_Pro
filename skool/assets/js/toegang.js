/* Toegang (21 Okt 2026, Hanno: "sit dadelik 'n login en password"). MOET ná preview-guard.js en VOOR enige ander
   skrip in index.html laai.

   Wat dit doen: 'n toestel sonder geldige aanmelding kry net 'n aanmeld-skerm. 'n Versteekte <plaintext> laat die res
   van index.html as gewone teks lees: geen ander skrip (sinkronisasie, kamera, rooster) loop ooit nie en geen styl laai
   nie, dus stuur 'n vreemde toestel niks na die bediener nie. Die bladsy laai verder normaal klaar.
   Ná 'n korrekte gebruikersnaam en wagwoord onthou die toestel dit (sleutel wallie911_toegang_v1) en herlaai.

   EERLIK: dit is 'n publieke statiese webwerf; hierdie slot keer toevallige besoekers, nie 'n vasberade aanvaller
   nie (die kode is leesbaar). Die wagwoord self staan NIE hier nie: net 'n PBKDF2-SHA256-hash (150 000 iterasies,
   ewekansige sout). Pa se data word apart deur die bediener beskerm (wallie_pa_login). Die wagwoord is by Hanno:
   C:\Users\nHunter\Documents\die leerder\app-wagwoord.txt (buite die repo). */
(function () {
  "use strict";
  /* Generiese skool-modus (?skool=1 + config/gebundel.js): geen leerder-wagwoord nie (ADR-007).
     Die wagwoord hier onder is die ou leerder se toegang; 'n skool se toestel word deur die skool
     opgestel en die app stuur in elk geval niks (ADR-005). */
  if (window.SKOOL_CONFIG && /(^|[?&])skool=1(&|$)/.test(window.location.search || "")) return;

  var KEY = "wallie911_toegang_v1";
  var GEBRUIKER = "wallie";
  var SALT = "1ea9384ce9f15ff6bc7c12406c72203d";
  var ITER = 150000;
  var HASH = "5aaa9eb40f971b81fc62a6a5f3da67d5c952a8f8c775d08127596d08455fc819";

  try {
    var d = JSON.parse(window.localStorage.getItem(KEY) || "null");
    if (d && d.v === 1 && d.h === HASH) return;
  } catch (e) {
    /* geen stoor: wys die aanmelding */
  }

  /* Nie aangemeld nie: die res van die bladsy word teks (geen skripte, geen style nie) */
  window.__WALLIE_GESLUIT__ = true;
  document.write('<plaintext id="toegang-res" hidden style="display:none">');

  function hex(buf) {
    return Array.prototype.map.call(new Uint8Array(buf), function (b) {
      return ("0" + b.toString(16)).slice(-2);
    }).join("");
  }
  function bytes(h) {
    var out = new Uint8Array(h.length / 2);
    for (var i = 0; i < out.length; i++) out[i] = parseInt(h.substr(i * 2, 2), 16);
    return out;
  }
  function pbkdf2(wagwoord) {
    var enc = new TextEncoder();
    return crypto.subtle
      .importKey("raw", enc.encode(wagwoord), "PBKDF2", false, ["deriveBits"])
      .then(function (k) {
        return crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: bytes(SALT), iterations: ITER }, k, 256);
      })
      .then(hex);
  }

  function teken() {
    var body = document.body;
    if (!body) {
      body = document.createElement("body");
      document.documentElement.appendChild(body);
    }
    body.setAttribute("style", "margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0b1f17;color:#e3efe7;font-family:system-ui,Segoe UI,Arial,sans-serif;padding:16px;box-sizing:border-box");
    body.innerHTML =
      '<form id="toegang-vorm" style="width:100%;max-width:360px;background:#123526;border:1px solid #2c6b4c;border-radius:14px;padding:22px;display:grid;gap:12px">' +
      '<h1 style="margin:0;font-size:1.35rem">Eksamenplan</h1>' +
      '<p style="margin:0;color:#a9c7b6;font-size:.95rem">Teken in om te begin.</p>' +
      '<label for="toegang-gebruiker" style="font-size:.9rem">Gebruiker</label>' +
      '<input id="toegang-gebruiker" autocomplete="username" autocapitalize="none" required style="padding:12px;border-radius:10px;border:1px solid #2c6b4c;background:#0b1f17;color:#e3efe7;font-size:1rem">' +
      '<label for="toegang-wagwoord" style="font-size:.9rem">Wagwoord</label>' +
      '<input id="toegang-wagwoord" type="password" autocomplete="current-password" required style="padding:12px;border-radius:10px;border:1px solid #2c6b4c;background:#0b1f17;color:#e3efe7;font-size:1rem">' +
      '<button type="submit" style="padding:12px;border-radius:10px;border:0;background:#d4b45a;color:#10241a;font-weight:700;font-size:1rem;cursor:pointer">Teken in</button>' +
      '<p id="toegang-fout" role="alert" style="margin:0;min-height:1.2em;color:#ff8a80;font-size:.9rem"></p>' +
      "</form>";
    var vorm = document.getElementById("toegang-vorm");
    vorm.addEventListener("submit", function (e) {
      e.preventDefault();
      var fout = document.getElementById("toegang-fout");
      var g = String(document.getElementById("toegang-gebruiker").value || "").trim().toLowerCase();
      var w = String(document.getElementById("toegang-wagwoord").value || "");
      if (!window.crypto || !crypto.subtle) {
        fout.textContent = "Hierdie blaaier kan nie veilig aanmeld nie. Gebruik Chrome of Edge.";
        return;
      }
      fout.textContent = "Kontroleer…";
      pbkdf2(w).then(
        function (h) {
          if (g === GEBRUIKER && h === HASH) {
            try {
              window.localStorage.setItem(KEY, JSON.stringify({ v: 1, h: HASH, at: Date.now() }));
            } catch (err) {
              fout.textContent = "Kon nie onthou nie (privaat modus?). Probeer 'n gewone venster.";
              return;
            }
            window.location.reload();
          } else {
            fout.textContent = "Verkeerde gebruiker of wagwoord.";
          }
        },
        function () {
          fout.textContent = "Kon nie aanmeld nie. Probeer weer.";
        }
      );
    });
  }

  document.addEventListener("DOMContentLoaded", teken);
})();
