// Minimal JWT-like signed session cookie using Web Crypto (no npm deps)
// Format: base64url(header).base64url(payload).base64url(sig)

const COOKIE_NAME = "untangle_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function b64url(buf) {
  return Buffer.from(buf).toString("base64url");
}
function fromB64url(str) {
  return Buffer.from(str, "base64url");
}

async function getKey() {
  const secret = process.env.SESSION_SECRET || "dev-secret-change-me";
  const enc = new TextEncoder().encode(secret);
  return crypto.subtle.importKey("raw", enc, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function signSession(payload) {
  const key = await getKey();
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64url(JSON.stringify(payload));
  const data = new TextEncoder().encode(`${header}.${body}`);
  const sig = await crypto.subtle.sign("HMAC", key, data);
  return `${header}.${body}.${b64url(new Uint8Array(sig))}`;
}

export async function verifySession(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, sigB64] = parts;
    const key = await getKey();
    const data = new TextEncoder().encode(`${header}.${body}`);
    const sig = fromB64url(sigB64);
    const valid = await crypto.subtle.verify("HMAC", key, sig, data);
    if (!valid) return null;
    return JSON.parse(fromB64url(body).toString("utf8"));
  } catch {
    return null;
  }
}

export function sessionCookieHeader(token) {
  return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}; Path=/`;
}

export function clearCookieHeader() {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/`;
}

export function getSessionToken(request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  return match ? match[1] : null;
}

export { COOKIE_NAME };
