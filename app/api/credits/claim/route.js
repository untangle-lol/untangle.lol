import { NextResponse } from "next/server";
import { getDb } from "../../../lib/db.js";
import { addCredits } from "../../../lib/userCredits.js";
import { addFpCredits } from "../../../lib/fpCredits.js";
import { verifySession, getSessionToken } from "../../../../lib/session.js";

// GET /api/credits/claim?ref=<clientRef>
// Atomically claims pending credits. For auth users credits go server-side.
// For guests, returns the amount so the client can add to localStorage.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ref = searchParams.get("ref");
  if (!ref) return NextResponse.json({ credits: 0 });

  const db = getDb();
  const row = db.prepare(`SELECT credits FROM pending_credits WHERE client_ref = ?`).get(ref);
  const amount = row?.credits ?? 0;
  if (amount <= 0) return NextResponse.json({ credits: 0 });

  // Consume the pending entry
  db.prepare(`DELETE FROM pending_credits WHERE client_ref = ?`).run(ref);

  // Credit authenticated user server-side
  const token = getSessionToken(request);
  const session = token ? await verifySession(token) : null;
  if (session?.email) {
    const balance = addCredits(session.email, amount, "purchase", { clientRef: ref });
    return NextResponse.json({ credits: amount, balance });
  }

  // Guest: credit fingerprint if provided, return amount for client localStorage fallback
  const fp = searchParams.get("fp");
  if (fp) addFpCredits(fp, amount, { clientRef: ref });

  return NextResponse.json({ credits: amount });
}
