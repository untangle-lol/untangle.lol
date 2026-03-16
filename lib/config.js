// ─── API Config ──────────────────────────────────────────────────────────────
export const ANTHROPIC_URL  = "https://api.anthropic.com/v1/messages";
export const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
export const MODEL_ANTHROPIC   = "claude-sonnet-4-6";
export const MODEL_OPENROUTER  = "anthropic/claude-sonnet-4-6";
export const PRICE = { input: 3.00, output: 15.00 };

export const ALTRUISM_BONUS_CREDITS = 10;
export const FREE_CREDITS = 10;

// ─── Cost helpers ────────────────────────────────────────────────────────────
export function calcCost(inp,out){ return (inp/1e6)*PRICE.input + (out/1e6)*PRICE.output; }
export function fmtCost(usd){ return usd<0.001?"<$0.001":"$"+usd.toFixed(4); }

// ─── Umami analytics ─────────────────────────────────────────────────────────
export const utrack=(event,data)=>{try{window.umami?.track(event,data);}catch{}};

// ─── LocalStorage helpers ────────────────────────────────────────────────────
export const ls = {
  get: (k)    => { try { return localStorage.getItem(k); }    catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); }        catch {} },
  del: (k)    => { try { localStorage.removeItem(k); }        catch {} },
};

export const KEYS = {
  theme:    "untangle_theme",
  session:  "untangle_session",
  apiKey:   "untangle_apikey",
  recents:  "untangle_recents",
  guestHist:"untangle_guest_hist",
  usage:    "untangle_usage",
  credits:  "untangle_credits",
  creditsTs: "untangle_credits_ts",
  altruismBonusTs: "untangle_altruism_bonus_ts",
  clientRef:"untangle_client_ref",
};

export function eKey(email) { return "untangle_hist_" + email.toLowerCase().replace(/[^a-z0-9]/g,"_"); }

// ─── API key helpers ─────────────────────────────────────────────────────────
export function keyProvider(key){ return key?.startsWith("sk-or-")?"openrouter":"anthropic"; }
export function getCredential() {
  const key = ls.get(KEYS.apiKey);
  return { key, valid: !!key, provider: key?keyProvider(key):null };
}
export function buildHeaders(key) {
  const provider = keyProvider(key);
  if(provider==="openrouter"){
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`,
      "HTTP-Referer": "https://untangle.lol",
      "X-Title": "untangle.lol",
    };
  }
  return {
    "Content-Type": "application/json",
    "anthropic-version": "2023-06-01",
    "anthropic-dangerous-direct-browser-access": "true",
    "x-api-key": key,
  };
}

// ─── Client reference for Stripe ─────────────────────────────────────────────
export function genClientRef() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b=>b.toString(16).padStart(2,"0")).join("");
}

// ─── Date/time utilities ─────────────────────────────────────────────────────
export function tz(){try{return Intl.DateTimeFormat().resolvedOptions().timeZone}catch{return"UTC"}}
export function fmtDate(iso,z,lc){try{return new Date(iso).toLocaleString(lc||undefined,{timeZone:z,day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return new Date(iso).toLocaleString()}}
export function tAgo(iso,lc){const d=Date.now()-new Date(iso).getTime(),m=Math.floor(d/60000),h=Math.floor(d/3600000),dy=Math.floor(d/86400000);if(lc==="nl"){if(m<60)return m+" min geleden";if(h<24)return h+" uur geleden";return dy===1?"gisteren":dy+" dagen geleden";}if(lc==="ar"){if(m<60)return "منذ "+m+" دقيقة";if(h<24)return "منذ "+h+" ساعة";return dy===1?"أمس":"منذ "+dy+" أيام";}if(m<60)return m+"m ago";if(h<24)return h+"h ago";return dy===1?"yesterday":dy+"d ago";}
