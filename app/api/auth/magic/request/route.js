import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import fs from "fs";

const DATA_FILE = "/data/magic_tokens.json";
const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://untangle.lol";

// Rate limit: max 3 magic link requests per email per hour
const requestMap = new Map();
function rateLimitEmail(email) {
  const now = Date.now();
  const key = email.toLowerCase();
  const entry = requestMap.get(key);
  if (!entry || now - entry.windowStart > 60 * 60 * 1000) {
    requestMap.set(key, { windowStart: now, count: 1 });
    return true;
  }
  if (entry.count >= 3) return false;
  entry.count++;
  return true;
}

function loadTokens() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); } catch { return {}; }
}
function saveTokens(store) {
  // Prune expired tokens while saving
  const now = Date.now();
  const pruned = Object.fromEntries(
    Object.entries(store).filter(([, v]) => v.expiresAt > now)
  );
  fs.writeFileSync(DATA_FILE, JSON.stringify(pruned), "utf8");
}

function buildEmail(email, magicUrl) {
  const name = email.split("@")[0];
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Your untangle.lol login link</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:520px;" cellpadding="0" cellspacing="0">

        <!-- Logo -->
        <tr><td align="center" style="padding-bottom:28px;">
          <a href="${BASE_URL}" style="text-decoration:none;display:inline-flex;align-items:center;gap:8px;">
            <svg width="36" height="22" viewBox="0 0 52 32" fill="none" stroke="#b45309" stroke-width="2.5" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg">
              <path d="M26 16C24 10 19.5 7 14 7C7.5 7 4 11.5 4 16C4 20.5 7.5 25 14 25C19.5 25 24 22 26 16C28 10 32.5 7 38 7C44.5 7 48 11.5 48 16C48 20.5 44.5 25 38 25C32.5 25 28 22 26 16Z"/>
            </svg>
            <span style="font-size:20px;font-weight:800;letter-spacing:-0.03em;color:#1e293b;">untangle</span><span style="font-size:11px;font-weight:500;letter-spacing:0.1em;color:#94a3b8;text-transform:uppercase;margin-top:2px;">.lol</span>
          </a>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">

            <!-- Top accent bar -->
            <tr><td style="background:#b45309;border-radius:16px 16px 0 0;height:4px;font-size:0;">&nbsp;</td></tr>

            <!-- Body -->
            <tr><td style="padding:36px 40px 32px;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#b45309;">Log in to untangle.lol</p>
              <h1 style="margin:0 0 20px;font-size:24px;font-weight:700;color:#1e293b;letter-spacing:-0.02em;line-height:1.3;">Your magic link is ready</h1>
              <p style="margin:0 0 28px;font-size:15px;color:#64748b;line-height:1.6;">
                Click the button below to log in instantly — no password needed. The link expires in <strong style="color:#1e293b;">15 minutes</strong> and can only be used once.
              </p>

              <!-- CTA button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr><td style="border-radius:12px;background:#b45309;">
                  <a href="${magicUrl}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:-0.01em;border-radius:12px;">
                    Log in to untangle.lol →
                  </a>
                </td></tr>
              </table>

              <!-- Fallback URL -->
              <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">Or copy this link into your browser:</p>
              <p style="margin:0;font-size:12px;color:#64748b;word-break:break-all;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;font-family:monospace;">${magicUrl}</p>
            </td></tr>

            <!-- Footer inside card -->
            <tr><td style="padding:0 40px 28px;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
                If you didn't request this, you can safely ignore this email. Nobody can log in without clicking the link.
              </p>
            </td></tr>

          </table>
        </td></tr>

        <!-- Bottom footer -->
        <tr><td align="center" style="padding-top:24px;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">
            <a href="${BASE_URL}" style="color:#b45309;text-decoration:none;">untangle.lol</a> &nbsp;·&nbsp;
            <a href="${BASE_URL}/privacy" style="color:#94a3b8;text-decoration:none;">Privacy</a> &nbsp;·&nbsp;
            <a href="${BASE_URL}/terms" style="color:#94a3b8;text-decoration:none;">Terms</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }); }

  const email = (body?.email || "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "invalid email" }, { status: 400 });
  }

  if (!rateLimitEmail(email)) {
    return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const store = loadTokens();
  store[token] = { email, expiresAt, used: false };
  saveTokens(store);

  const magicUrl = `${BASE_URL}/api/auth/magic/verify?token=${token}`;

  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || "no-reply@untangle.lol";
  const senderName = process.env.BREVO_SENDER_NAME || "untangle.lol";

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email }],
        subject: "Your untangle.lol login link",
        htmlContent: buildEmail(email, magicUrl),
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("Brevo error:", err);
      return NextResponse.json({ error: "email_failed" }, { status: 502 });
    }
  } catch (e) {
    console.error("Brevo send error:", e.message);
    return NextResponse.json({ error: "email_failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
