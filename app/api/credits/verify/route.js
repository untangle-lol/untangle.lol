import { NextResponse } from "next/server";
import Stripe from "stripe";
import { promises as fs } from "fs";
import path from "path";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

// Track already-claimed Stripe session IDs to prevent double-claiming.
const CLAIMED_FILE = path.join("/data", "claimed_sessions.json");

async function readClaimed() {
  try {
    const raw = await fs.readFile(CLAIMED_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeClaimed(obj) {
  await fs.mkdir(path.dirname(CLAIMED_FILE), { recursive: true });
  await fs.writeFile(CLAIMED_FILE, JSON.stringify(obj), "utf8");
}

// GET /api/credits/verify?ref=<clientRef>
// Searches recent Stripe checkout sessions for a paid one matching clientRef.
// Returns { credits: N } on success, { credits: 0 } if not found or already claimed.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ref = searchParams.get("ref");
  if (!ref) return NextResponse.json({ credits: 0 });

  try {
    // Search recent sessions — Stripe returns most recent first.
    // We search up to 100 sessions; a clientRef match will almost always be in the first page.
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
    });

    const match = sessions.data.find(
      (s) =>
        s.metadata?.clientRef === ref &&
        s.payment_status === "paid"
    );

    if (!match) {
      return NextResponse.json({ credits: 0 });
    }

    // Dedupe: if this session was already claimed, return 0.
    const claimed = await readClaimed();
    if (claimed[match.id]) {
      return NextResponse.json({ credits: 0 });
    }

    // Mark as claimed.
    claimed[match.id] = Date.now();
    await writeClaimed(claimed);

    const credits = parseInt(match.metadata?.credits ?? "0", 10);
    return NextResponse.json({ credits });
  } catch (err) {
    console.error("Credits verify error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
