import { NextResponse } from "next/server";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
// Cheapest Claude model — used for the default public key
const MODEL = "claude-haiku-4-5";

// Simple in-memory rate limiter: max 10 requests per IP per hour
const rateLimitMap = new Map();
const RATE_LIMIT = 10;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

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

// Periodically prune stale entries to avoid memory growth
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now - entry.windowStart > WINDOW_MS) rateLimitMap.delete(ip);
  }
}, WINDOW_MS);

// Verify reCAPTCHA v2 token server-side
async function verifyRecaptcha(token) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return true; // skip if not configured
  const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`,
  });
  const data = await res.json();
  return data.success === true;
}

// Detect if the goal is altruistic (helping other human beings)
async function detectAltruism(goalText, apiKey) {
  const prompt = `You are a classification assistant. Decide if the following goal is primarily about helping, supporting, or benefiting OTHER people (not just the person themselves). Examples: volunteering, caregiving, teaching others, charity work, supporting a loved one, community projects. Reply with JSON only: {"altruistic": true} or {"altruistic": false}. Goal: "${goalText}"`;
  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 20,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await res.json();
    const text = (data.content || []).map((b) => b.text || "").join("").trim();
    const parsed = JSON.parse(text.replace(/```json\s?|```/g, "").trim());
    return parsed.altruistic === true;
  } catch {
    return false;
  }
}

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_DEFAULT_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "No default key configured" },
      { status: 503 }
    );
  }

  // Rate limiting by IP
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later or add your own API key." },
      { status: 429 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { messages, maxTokens = 1000, recaptchaToken, lang } = body ?? {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages required" }, { status: 400 });
  }

  // Verify reCAPTCHA if secret is configured
  if (process.env.RECAPTCHA_SECRET_KEY) {
    if (!recaptchaToken) {
      return NextResponse.json({ error: "reCAPTCHA required" }, { status: 400 });
    }
    const ok = await verifyRecaptcha(recaptchaToken);
    if (!ok) {
      return NextResponse.json({ error: "reCAPTCHA verification failed" }, { status: 403 });
    }
  }

  // Extract the raw goal text from the prompt for altruism detection
  const userMessage = messages.find((m) => m.role === "user")?.content || "";
  const goalMatch = userMessage.match(/Goal:\s*"([^"]+)"/);
  const goalText = goalMatch ? goalMatch[1] : userMessage.slice(0, 200);

  // Run main AI call and altruism detection in parallel
  const [mainResult, isAltruistic] = await Promise.all([
    (async () => {
      const res = await fetch(ANTHROPIC_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: maxTokens,
          messages,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const text = (data.content || []).map((b) => b.text || "").join("");
      const usage = data.usage || {};
      return {
        text,
        inputTokens: usage.input_tokens || 0,
        outputTokens: usage.output_tokens || 0,
      };
    })(),
    detectAltruism(goalText, apiKey),
  ]).catch((err) => {
    throw err;
  });

  try {
    return NextResponse.json({
      text: mainResult.text,
      inputTokens: mainResult.inputTokens,
      outputTokens: mainResult.outputTokens,
      isAltruistic,
    });
  } catch (err) {
    return NextResponse.json({ error: "Upstream error" }, { status: 502 });
  }
}
