import { NextResponse } from "next/server";
import { getShare, createShare } from "../../lib/shares.js";

// GET /api/share?id=xxx
export async function GET(request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "missing id" }, { status: 400 });
  }
  const share = getShare(id);
  if (!share) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(share);
}

// POST /api/share  { steps, lang }
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const { steps, lang } = body ?? {};

  if (!steps || typeof steps !== "object") {
    return NextResponse.json({ error: "missing steps" }, { status: 400 });
  }
  if (!lang || typeof lang !== "string") {
    return NextResponse.json({ error: "missing lang" }, { status: 400 });
  }

  const id = createShare(steps, lang);
  return NextResponse.json({ id });
}
