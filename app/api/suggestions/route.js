import { NextResponse } from "next/server";
import { getDb } from "../../lib/db.js";

const VALID_LANGS = new Set(["en","nl","de","fr","es","ar","zh","hi","pt","bn","ru","id","ja","sw","tr"]);
const GET_SAMPLE  = 30;
const MAX_LEN     = 120;

async function isAltruistic(text) {
  const key = process.env.ANTHROPIC_DEFAULT_KEY;
  if (!key) return false;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 10,
        messages: [{
          role: "user",
          content: `Is this a genuine altruistic goal (primarily about helping others, volunteering, caregiving, or benefiting a community)? Not spam, not self-serving, not nonsense. Reply only "yes" or "no".\n\nGoal: "${text}"`,
        }],
      }),
    });
    const data = await res.json();
    const answer = (data.content?.[0]?.text || "").trim().toLowerCase();
    return answer.startsWith("yes");
  } catch {
    return false;
  }
}

// GET /api/suggestions?lang=en  — returns up to GET_SAMPLE random suggestions
export async function GET(request) {
  const lang = new URL(request.url).searchParams.get("lang");
  if (!lang || !VALID_LANGS.has(lang)) {
    return NextResponse.json({ error: "invalid lang" }, { status: 400 });
  }
  const db = getDb();
  const rows = db.prepare(
    `SELECT text FROM suggestions WHERE lang = ? ORDER BY RANDOM() LIMIT ?`
  ).all(lang, GET_SAMPLE);
  return NextResponse.json({ suggestions: rows.map(r => r.text) });
}

// POST /api/suggestions  { lang, text }  — save a user-submitted suggestion
export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }); }

  const { lang, text } = body ?? {};
  if (!lang || !VALID_LANGS.has(lang)) return NextResponse.json({ error: "invalid lang" }, { status: 400 });
  if (!text || typeof text !== "string") return NextResponse.json({ error: "missing text" }, { status: 400 });

  const clean = text.trim().slice(0, MAX_LEN);
  if (clean.length < 3) return NextResponse.json({ error: "too short" }, { status: 400 });

  const ok = await isAltruistic(clean);
  if (!ok) return NextResponse.json({ ok: true }); // silently discard non-altruistic/spam

  const db = getDb();
  db.prepare(`INSERT OR IGNORE INTO suggestions (lang, text) VALUES (?, ?)`).run(lang, clean);
  return NextResponse.json({ ok: true });
}

// DELETE /api/suggestions  { lang, text }
export async function DELETE(request) {
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }); }

  const { lang, text } = body ?? {};
  if (!lang || !VALID_LANGS.has(lang)) return NextResponse.json({ error: "invalid lang" }, { status: 400 });
  if (!text || typeof text !== "string") return NextResponse.json({ error: "missing text" }, { status: 400 });

  const db = getDb();
  db.prepare(`DELETE FROM suggestions WHERE lang = ? AND lower(text) = lower(?)`).run(lang, text.trim());
  return NextResponse.json({ ok: true });
}
