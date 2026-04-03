import { NextResponse } from "next/server";
import { deductFpCredit } from "../../lib/fpCredits.js";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5";

// IP rate limiter — last line of defence against bots (max 10/IP/hour)
const rateLimitMap = new Map();
const RATE_LIMIT = 10;
const WINDOW_MS = 60 * 60 * 1000;

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    rateLimitMap.set(ip, { windowStart: now, count: 1 });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now - entry.windowStart > WINDOW_MS) rateLimitMap.delete(ip);
  }
}, WINDOW_MS);

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_DEFAULT_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "No default key configured" }, { status: 503 });
  }

  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later or add your own API key." },
      { status: 429 }
    );
  }

  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { messages, maxTokens = 1000, fp } = body ?? {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages required" }, { status: 400 });
  }

  // Server-side fingerprint credit check
  const result = deductFpCredit(fp);
  if (result.blocked) {
    return NextResponse.json(
      { error: "no_credits", creditsRemaining: 0 },
      { status: 402 }
    );
  }

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, messages }),
  });

  const data = await res.json();
  if (data.error) {
    return NextResponse.json({ error: "Upstream error" }, { status: 502 });
  }

  const text = (data.content || []).map((b) => b.text || "").join("");
  const usage = data.usage || {};

  return NextResponse.json({
    text,
    inputTokens: usage.input_tokens || 0,
    outputTokens: usage.output_tokens || 0,
    creditsRemaining: result.creditsRemaining,
  });
}
