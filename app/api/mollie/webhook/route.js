import { NextResponse } from "next/server";
import { createMollieClient } from "@mollie/api-client";
import { getDb } from "../../../lib/db.js";
import { addCredits } from "../../../lib/userCredits.js";

function getMollie() {
  const key = process.env.MOLLIE_API_KEY;
  if (!key) throw new Error("MOLLIE_API_KEY not configured");
  return createMollieClient({ apiKey: key });
}

export async function POST(request) {
  let paymentId;
  try {
    const body = await request.formData();
    paymentId = body.get("id");
  } catch {
    return new Response("ok", { status: 200 });
  }

  if (!paymentId) return new Response("ok", { status: 200 });

  try {
    const mollie = getMollie();
    const payment = await mollie.payments.get(paymentId);

    if (payment.status !== "paid") return new Response("ok", { status: 200 });

    const { clientRef, credits, email } = payment.metadata ?? {};
    if (clientRef && credits) {
      const n = parseInt(credits, 10);
      const db = getDb();
      if (email) {
        addCredits(email, n, "purchase", { provider: "mollie", clientRef });
      } else {
        db.prepare(
          `INSERT INTO pending_credits (client_ref, credits) VALUES (?, ?)
           ON CONFLICT(client_ref) DO UPDATE SET credits = credits + excluded.credits`
        ).run(clientRef, n);
      }
    }
  } catch (err) {
    console.error("Mollie webhook error:", err.message);
  }

  return new Response("ok", { status: 200 });
}
