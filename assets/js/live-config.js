/* Pa-konsole backend (Supabase). Die publishable key is publiek per ontwerp: dit kan net
   die wallie_* funksies roep. Lees vereis Pa se wagwoord-token (bediener-kant). */
window.WALLIE = window.WALLIE || {};

WALLIE.LIVE = {
  url: "https://jxfmzxebekqzwnlurtxg.supabase.co",
  key: "sb_publishable_cGG0kXJuqsPFidtc4Klj2A_ajy7xq1C",

  /* Gee altyd ’n objek terug, gooi nooit nie. By mislukking:
     { ok:false, error, status, transient, missingFunction }
     - transient: netwerk, tydlimiet, 5xx, 401/403/408/429 → probeer later weer
     - missingFunction: die RPC bestaan nog nie op die bediener nie (PGRST202 / 404)
     Sonder tydlimiet kon ’n hangende versoek die hele uitboks vir altyd blokkeer. */
  async rpc(name, args, { timeoutMs = 15000, keepalive = false } = {}) {
    const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : null;
    let res;
    try {
      res = await fetch(`${this.url}/rest/v1/rpc/${name}`, {
        method: "POST",
        headers: { apikey: this.key, "Content-Type": "application/json" },
        body: JSON.stringify(args || {}),
        signal: ctrl?.signal,
        keepalive
      });
    } catch (e) {
      return {
        ok: false,
        transient: true,
        status: 0,
        error: e?.name === "AbortError" ? "tydlimiet" : `netwerk: ${e?.message || "onbekend"}`
      };
    } finally {
      if (timer) clearTimeout(timer);
    }
    let json = null;
    try {
      json = await res.json();
    } catch {}
    if (!res.ok) {
      const code = json && json.code;
      return {
        ok: false,
        status: res.status,
        code,
        missingFunction: code === "PGRST202" || res.status === 404,
        /* 401/403 = sleutel/regte-probleem wat alles raak: hou in die tou en waarsku Pa, moenie weggooi nie */
        transient: res.status >= 500 || [0, 401, 403, 408, 429].includes(res.status),
        error: (json && (json.message || json.error)) || `HTTP ${res.status}`
      };
    }
    return json || { ok: false, transient: true, error: "leë antwoord" };
  }
};
