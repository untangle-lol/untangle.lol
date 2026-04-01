import { NextResponse } from "next/server";
import { createMollieClient } from "@mollie/api-client";
import { promises as fs } from "fs";
import path from "path";

// Pending credits stored in the same file as Stripe webhook uses,
// so the existing /api/credits/claim endpoint works for both.
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

function getMollie() {
  const key = process.env.MOLLIE_API_KEY;
  if (!key) throw new Error("MOLLIE_API_KEY not configured");
  return createMollieClient({ apiKey: key });
}

// Mollie sends a POST with form body: id=<paymentId>
// We fetch the payment to verify status (no signature needed — verification is implicit).
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

    const { clientRef, credits } = payment.metadata ?? {};
    if (clientRef && credits) {
      const pending = await readPending();
      pending[clientRef] = (pending[clientRef] || 0) + parseInt(credits, 10);
      await writePending(pending);
    }
  } catch (err) {
    console.error("Mollie webhook error:", err.message);
    // Return 200 so Mollie doesn't keep retrying on config errors
  }

  return new Response("ok", { status: 200 });
}
