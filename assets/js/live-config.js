/* Pa-konsole backend (Supabase). Die publishable key is publiek per ontwerp: dit kan net
   die wallie_* funksies roep. Lees vereis Pa se wagwoord-token (bediener-kant). */
window.WALLIE = window.WALLIE || {};

WALLIE.LIVE = {
  url: "https://jxfmzxebekqzwnlurtxg.supabase.co",
  key: "sb_publishable_cGG0kXJuqsPFidtc4Klj2A_ajy7xq1C",

  async rpc(name, args) {
    const res = await fetch(`${this.url}/rest/v1/rpc/${name}`, {
      method: "POST",
      headers: { apikey: this.key, "Content-Type": "application/json" },
      body: JSON.stringify(args || {})
    });
    let json = null;
    try {
      json = await res.json();
    } catch {}
    if (!res.ok) {
      return { ok: false, error: (json && (json.message || json.error)) || `HTTP ${res.status}` };
    }
    return json || { ok: false, error: "leë antwoord" };
  }
};
