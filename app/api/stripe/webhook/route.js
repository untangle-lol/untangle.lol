import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getDb } from "../../../lib/db.js";
import { addCredits } from "../../../lib/userCredits.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

export async function POST(request) {
  const sig = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  const rawBody = await request.text();

  if (webhookSecret && sig) {
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  } else {
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { clientRef, credits, email } = session.metadata ?? {};
    if (clientRef && credits) {
      const n = parseInt(credits, 10);
      const db = getDb();
      // If we know the user's email (logged-in checkout), credit them directly
      if (email) {
        addCredits(email, n, "purchase", { provider: "stripe", clientRef });
      } else {
        // Guest: store in pending so client can claim via polling
        db.prepare(
          `INSERT INTO pending_credits (client_ref, credits) VALUES (?, ?)
           ON CONFLICT(client_ref) DO UPDATE SET credits = credits + excluded.credits`
        ).run(clientRef, n);
      }
    }
  }

  return NextResponse.json({ received: true });
}
