import { NextResponse } from "next/server";
import { verifySession, getSessionToken } from "../../../../lib/session.js";
import { addCredits, initCredits } from "../../../lib/userCredits.js";

async function getSession(request) {
  const token = getSessionToken(request);
  return token ? await verifySession(token) : null;
}

export async function GET(request) {
  const session = await getSession(request);
  if (!session?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const balance = initCredits(session.email);
  return NextResponse.json({ balance });
}

// POST /api/me/credits  { delta: N, reason: "altruism" | "purchase" }
export async function POST(request) {
  const session = await getSession(request);
  if (!session?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }); }
  const { delta, reason = "altruism" } = body ?? {};
  if (!Number.isInteger(delta) || delta <= 0 || delta > 100) {
    return NextResponse.json({ error: "invalid delta" }, { status: 400 });
  }
  const ALLOWED = ["altruism"];
  if (!ALLOWED.includes(reason)) return NextResponse.json({ error: "invalid reason" }, { status: 400 });
  const balance = addCredits(session.email, delta, reason);
  return NextResponse.json({ balance });
}
