import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getDb } from "../../../lib/db.js";
import { addCredits } from "../../../lib/userCredits.js";
import { addFpCredits } from "../../../lib/fpCredits.js";
import { verifySession, getSessionToken } from "../../../../lib/session.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

// GET /api/credits/verify?ref=<clientRef>
// Searches recent Stripe checkout sessions for a paid one matching clientRef.
// For auth users credits are applied server-side and balance is returned.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ref = searchParams.get("ref");
  if (!ref) return NextResponse.json({ credits: 0 });

  try {
    const sessions = await stripe.checkout.sessions.list({ limit: 100 });
    const match = sessions.data.find(
      (s) => s.metadata?.clientRef === ref && s.payment_status === "paid"
    );
    if (!match) return NextResponse.json({ credits: 0 });

    const db = getDb();
    // Deduplicate
    const already = db.prepare(`SELECT session_id FROM claimed_sessions WHERE session_id = ?`).get(match.id);
    if (already) return NextResponse.json({ credits: 0 });

    db.prepare(
      `INSERT INTO claimed_sessions (session_id) VALUES (?)`
    ).run(match.id);

    const credits = parseInt(match.metadata?.credits ?? "0", 10);

    // Auth user → credit server-side
    const token = getSessionToken(request);
    const session = token ? await verifySession(token) : null;
    if (session?.email) {
      const balance = addCredits(session.email, credits, "purchase", {
        provider: "stripe",
        sessionId: match.id,
        clientRef: ref,
      });
      return NextResponse.json({ credits, balance });
    }

    // Guest → credit fingerprint if provided, return amount for localStorage fallback
    const fp = searchParams.get("fp");
    if (fp) addFpCredits(fp, credits, { provider: "stripe", clientRef: ref });

    return NextResponse.json({ credits });
  } catch (err) {
    console.error("Credits verify error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
