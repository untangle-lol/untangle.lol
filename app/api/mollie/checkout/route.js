import { NextResponse } from "next/server";
import { createMollieClient } from "@mollie/api-client";

const PRICE_PER_CREDIT = 0.25; // €0.25 per credit

const TIERS = {
  starter: { credits: 10, amount: "2.50"  },
  popular: { credits: 25, amount: "6.25"  },
  power:   { credits: 50, amount: "12.50" },
};

function customBundle(credits) {
  const c = Math.max(50, Math.floor(Number(credits)));
  return { credits: c, amount: (c * PRICE_PER_CREDIT).toFixed(2) };
}

function getMollie() {
  const key = process.env.MOLLIE_API_KEY;
  if (!key) throw new Error("MOLLIE_API_KEY not configured");
  return createMollieClient({ apiKey: key });
}

export async function POST(request) {
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
    const mollie = getMollie();
    const payment = await mollie.payments.create({
      amount:      { currency: "EUR", value: bundle.amount },
      description: `${bundle.credits} questions — untangle.lol`,
      redirectUrl: `${origin}/?topup=success&ref=${clientRef}`,
      webhookUrl:  `https://untangle.lol/api/mollie/webhook`,
      metadata:    { clientRef, credits: String(bundle.credits) },
    });

    return NextResponse.json({ url: payment._links.checkout?.href });
  } catch (err) {
    console.error("Mollie checkout error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
