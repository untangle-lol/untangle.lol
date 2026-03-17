import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

// 10 credits for €2.50
const BUNDLE = { credits: 10, amount: 250, currency: "eur" };

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // clientRef is a random ID the browser generates & stores in localStorage
  // so we can match the webhook fulfillment back to the right browser session
  const { clientRef } = body ?? {};
  if (!clientRef || typeof clientRef !== "string" || clientRef.length < 8) {
    return NextResponse.json({ error: "clientRef required" }, { status: 400 });
  }

  const origin = request.headers.get("origin") || "https://untangle.lol";

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "ideal", "bancontact"],
      line_items: [
        {
          price_data: {
            currency: BUNDLE.currency,
            unit_amount: BUNDLE.amount,
            product_data: {
              name: `${BUNDLE.credits} credits — untangle.lol`,
              description: "Use credits to generate AI goal plans",
            },
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/?topup=success&ref=${clientRef}`,
      cancel_url: `${origin}/?topup=cancel`,
      metadata: { clientRef, credits: String(BUNDLE.credits) },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
