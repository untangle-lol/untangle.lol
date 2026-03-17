// ─── Config & Helpers ─────────────────────────────────────────────────────────

export const ALTRUISM_BONUS_CREDITS = 3;
export const FREE_CREDITS = 3;

// Umami custom event helper — safe no-op if script hasn't loaded yet
export const utrack = (event, data) => { try { window.umami?.track(event, data); } catch {} };

// ─── API Config ───────────────────────────────────────────────────────────────
export const ANTHROPIC_URL  = "https://api.anthropic.com/v1/messages";
export const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
export const MODEL_ANTHROPIC  = "claude-sonnet-4-6";
export const MODEL_OPENROUTER = "anthropic/claude-sonnet-4-6";
export const PRICE = { input: 3.00, output: 15.00 };

export function calcCost(inp, out) { return (inp / 1e6) * PRICE.input + (out / 1e6) * PRICE.output; }
export function fmtCost(usd) { return usd < 0.001 ? "<$0.001" : "$" + usd.toFixed(4); }

// ─── LocalStorage wrapper ─────────────────────────────────────────────────────
export const ls = {
  get: (k)    => { try { return localStorage.getItem(k); }    catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); }        catch {} },
  del: (k)    => { try { localStorage.removeItem(k); }        catch {} },
};

// ─── Storage Keys ─────────────────────────────────────────────────────────────
export const KEYS = {
  theme:           "untangle_theme",
  session:         "untangle_session",
  apiKey:          "untangle_apikey",
  recents:         "untangle_recents",
  guestHist:       "untangle_guest_hist",
  usage:           "untangle_usage",
  credits:         "untangle_credits",
  creditsTs:       "untangle_credits_ts",
  altruismBonusTs: "untangle_altruism_bonus_ts",
  clientRef:       "untangle_client_ref",
  view:            "untangle_view",
};

export function eKey(email) { return "untangle_hist_" + email.toLowerCase().replace(/[^a-z0-9]/g, "_"); }

// ─── API Key helpers ──────────────────────────────────────────────────────────
export function keyProvider(key) { return key?.startsWith("sk-or-") ? "openrouter" : "anthropic"; }

export function getCredential() {
  const key = ls.get(KEYS.apiKey);
  return { key, valid: !!key, provider: key ? keyProvider(key) : null };
}

export function buildHeaders(key) {
  const provider = keyProvider(key);
  if (provider === "openrouter") {
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

// Generate a random client reference ID for Stripe fulfillment
export function genClientRef() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, "0")).join("");
}
