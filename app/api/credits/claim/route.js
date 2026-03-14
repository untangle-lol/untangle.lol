import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

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

// GET /api/credits/claim?ref=<clientRef>
// Returns { credits: N } and removes the entry so it can only be claimed once.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ref = searchParams.get("ref");
  if (!ref) return NextResponse.json({ credits: 0 });

  const pending = await readPending();
  const amount = pending[ref] || 0;
  if (amount > 0) {
    delete pending[ref];
    await writePending(pending);
  }
  return NextResponse.json({ credits: amount });
}
