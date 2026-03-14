import { NextResponse } from "next/server";
import Stripe from "stripe";
import { promises as fs } from "fs";
import path from "path";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

// Pending credits are stored in a JSON file on the volume so they survive restarts.
// Key: clientRef  →  Value: credits to award
const DATA_FILE = path.join("/data", "pending_credits.json");

async function readPending() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writePending(obj) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(obj), "utf8");
}

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
    // No webhook secret configured — accept without verification (dev/test mode)
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { clientRef, credits } = session.metadata ?? {};
    if (clientRef && credits) {
      const pending = await readPending();
      pending[clientRef] = (pending[clientRef] || 0) + parseInt(credits, 10);
      await writePending(pending);
    }
  }

  return NextResponse.json({ received: true });
}
