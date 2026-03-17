import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

const FEEDBACK_DIR = "/data/feedback";

export async function POST(req) {
  try {
    const { feedback, deviceInfo, screenshot, page } = await req.json();

    if (!feedback?.trim()) {
      return NextResponse.json({ error: "Empty feedback" }, { status: 400 });
    }

    // Ensure storage directory exists
    fs.mkdirSync(FEEDBACK_DIR, { recursive: true });

    const timestamp = new Date().toISOString();
    const random = Math.random().toString(36).slice(2, 8);
    const filename = `${timestamp.replace(/[:.]/g, "-")}-${random}.json`;
    const filepath = path.join(FEEDBACK_DIR, filename);

    const entry = {
      timestamp,
      feedback: feedback.trim(),
      page: page || "unknown",
      deviceInfo: deviceInfo || null,
      screenshot: screenshot?.startsWith("data:image/") ? screenshot : null,
    };

    fs.writeFileSync(filepath, JSON.stringify(entry, null, 2), "utf8");

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[feedback] save error:", err.message);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
