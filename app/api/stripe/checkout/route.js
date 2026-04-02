import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

const PRICE_PER_CREDIT = 25; // €0.25 per credit in cents

const TIERS = {
  starter: { credits: 10, amount: 250,  currency: "eur" },
  popular: { credits: 25, amount: 500,  currency: "eur" },
  power:   { credits: 50, amount: 1000, currency: "eur" },
};

function customBundle(credits) {
  const c = Math.max(50, Math.floor(Number(credits)));
  return { credits: c, amount: c * PRICE_PER_CREDIT, currency: "eur" };
}

const STRIPE_ENABLED = false; // disabled — set to true to re-enable

export async function POST(request) {
  if (!STRIPE_ENABLED) {
    return NextResponse.json({ error: "Stripe payments are currently disabled" }, { status: 503 });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { clientRef, tier = "popular", customCredits } = body ?? {};
  if (!clientRef || typeof clientRef !== "string" || clientRef.length < 8) {
    return NextResponse.json({ error: "clientRef required" }, { status: 400 });
  }

  const bundle = tier === "custom" ? customBundle(customCredits) : (TIERS[tier] ?? TIERS.popular);
  const origin = request.headers.get("origin") || "https://untangle.lol";

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "ideal", "bancontact"],
      line_items: [
        {
          price_data: {
            currency: bundle.currency,
            unit_amount: bundle.amount,
            product_data: {
              name: `${bundle.credits} questions — untangle.lol`,
              description: "Use questions to generate AI goal plans",
            },
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/?topup=success&ref=${clientRef}&provider=stripe&tier=${tier}&credits=${bundle.credits}`,
      cancel_url:  `${origin}/payment`,
      metadata: { clientRef, credits: String(bundle.credits) },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
