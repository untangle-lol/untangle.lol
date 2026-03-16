import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

// Public endpoint — exposes all balance transactions (income overview).
// Supports optional query params:
//   ?limit=25          number of results (1–100, default 25)
//   ?starting_after=   cursor for pagination (last id from previous page)
export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") ?? "25", 10) || 25)
  );
  const starting_after = searchParams.get("starting_after") || undefined;

  try {
    const txns = await stripe.balanceTransactions.list({
      limit,
      ...(starting_after ? { starting_after } : {}),
    });

    const data = txns.data.map((t) => ({
      id: t.id,
      created: t.created,
      type: t.type,
      description: t.description,
      amount: t.amount,
      net: t.net,
      fee: t.fee,
      currency: t.currency,
      status: t.status,
    }));

    return NextResponse.json({
      data,
      has_more: txns.has_more,
      next_cursor: txns.data.at(-1)?.id ?? null,
    });
  } catch (err) {
    console.error("Stripe balance_transactions error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
