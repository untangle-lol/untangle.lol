/**
 * Cloudflare Worker — untangle.lol magic-link mailer
 *
 * Routes:
 *   POST /api/send-magic-link   { email }  → sends email, returns { ok: true }
 *   GET  /api/verify            ?token=    → redirects to https://untangle.lol/?verified=<email>
 *
 * Secrets (set via `wrangler secret put`):
 *   RESEND_API_KEY   — from resend.com
 *   HMAC_SECRET      — any random string, used to sign tokens
 */

const SITE = "https://untangle.lol";
const FROM = "noreply@untangle.lol";
const TOKEN_TTL = 60 * 30; // 30 minutes

// ── HMAC helpers ─────────────────────────────────────────────────────────────

async function hmacSign(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function hmacVerify(secret, message, signature) {
  const expected = await hmacSign(secret, message);
  // Constant-time compare
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}

function makeToken(email, exp) {
  return `${encodeURIComponent(email)}|${exp}`;
}

// ── Email ─────────────────────────────────────────────────────────────────────

async function sendEmail(resendKey, to, magicUrl) {
  const body = {
    from: FROM,
    to: [to],
    subject: "Your untangle.lol magic link 🪢",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <div style="text-align:center;margin-bottom:24px">
          <div style="font-size:40px">🪢</div>
          <h1 style="font-size:24px;font-weight:800;margin:8px 0 4px">untangle.lol</h1>
        </div>
        <p style="color:#334155;font-size:15px;line-height:1.6">Click the button below to sign in. The link expires in 30 minutes.</p>
        <div style="text-align:center;margin:28px 0">
          <a href="${magicUrl}" style="background:#facc15;color:#0f172a;font-weight:700;font-size:15px;padding:14px 28px;border-radius:10px;text-decoration:none;display:inline-block">Sign in to untangle.lol →</a>
        </div>
        <p style="color:#94a3b8;font-size:12px;text-align:center">If you didn't request this, you can safely ignore it.</p>
      </div>
    `,
  };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error ${res.status}: ${err}`);
  }
}

// ── CORS headers ──────────────────────────────────────────────────────────────

function cors(origin) {
  const allowed = ["https://untangle.lol", "https://www.untangle.lol"];
  const o = allowed.includes(origin) ? origin : allowed[0];
  return {
    "Access-Control-Allow-Origin": o,
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

// ── Main handler ──────────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const headers = cors(origin);

    // Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    // POST /api/send-magic-link
    if (request.method === "POST" && url.pathname === "/api/send-magic-link") {
      let email;
      try {
        ({ email } = await request.json());
      } catch {
        return Response.json({ error: "Invalid JSON" }, { status: 400, headers });
      }

      if (!email || !email.includes("@")) {
        return Response.json({ error: "Invalid email" }, { status: 400, headers });
      }

      const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL;
      const payload = makeToken(email.toLowerCase().trim(), exp);
      const sig = await hmacSign(env.HMAC_SECRET, payload);
      const token = `${btoa(payload).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")}.${sig}`;
      const magicUrl = `${SITE}/api/verify?token=${encodeURIComponent(token)}`;

      try {
        await sendEmail(env.RESEND_API_KEY, email, magicUrl);
        return Response.json({ ok: true }, { headers });
      } catch (e) {
        console.error(e);
        return Response.json({ error: "Failed to send email" }, { status: 500, headers });
      }
    }

    // GET /api/verify?token=
    if (request.method === "GET" && url.pathname === "/api/verify") {
      const token = url.searchParams.get("token");
      if (!token) return Response.redirect(`${SITE}/?error=invalid_token`, 302);

      try {
        const [encodedPayload, sig] = token.split(".");
        if (!encodedPayload || !sig) throw new Error("malformed");

        const payload = atob(encodedPayload.replace(/-/g, "+").replace(/_/g, "/"));
        const valid = await hmacVerify(env.HMAC_SECRET, payload, sig);
        if (!valid) throw new Error("invalid signature");

        const [encodedEmail, expStr] = payload.split("|");
        const exp = parseInt(expStr, 10);
        if (Date.now() / 1000 > exp) throw new Error("expired");

        const email = decodeURIComponent(encodedEmail);
        return Response.redirect(`${SITE}/?verified=${encodeURIComponent(email)}`, 302);
      } catch (e) {
        return Response.redirect(`${SITE}/?error=invalid_token`, 302);
      }
    }

    return new Response("Not found", { status: 404 });
  },
};
