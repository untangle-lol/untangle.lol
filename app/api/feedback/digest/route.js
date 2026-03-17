import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

const FEEDBACK_DIR = "/data/feedback";
const RECIPIENTS = ["bartkleinreesink@gmail.com", "reggieduisterhof@gmail.com"];
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD;
const DIGEST_SECRET = process.env.DIGEST_SECRET;

export async function POST(req) {
  // Verify bearer token
  const auth = req.headers.get("authorization") || "";
  if (!DIGEST_SECRET || auth !== `Bearer ${DIGEST_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Read all JSON feedback files
    let files = [];
    try {
      files = fs
        .readdirSync(FEEDBACK_DIR)
        .filter((f) => f.endsWith(".json"))
        .sort();
    } catch {
      // Directory doesn't exist yet — no feedback
      return NextResponse.json({ ok: true, sent: false, reason: "no feedback dir" });
    }

    if (files.length === 0) {
      return NextResponse.json({ ok: true, sent: false, reason: "no feedback" });
    }

    // Parse all entries
    const entries = [];
    for (const file of files) {
      try {
        const raw = fs.readFileSync(path.join(FEEDBACK_DIR, file), "utf8");
        entries.push(JSON.parse(raw));
      } catch {
        // Skip malformed files
      }
    }

    if (entries.length === 0) {
      return NextResponse.json({ ok: true, sent: false, reason: "no valid entries" });
    }

    // Build plain-text body (Dutch)
    const now = new Date().toLocaleString("nl-NL", { timeZone: "Europe/Amsterdam" });
    const lines = [
      `Dagelijks feedbackoverzicht – untangle.lol`,
      `Gegenereerd op: ${now}`,
      `Aantal berichten: ${entries.length}`,
      ``,
    ];

    const attachments = [];

    entries.forEach((entry, i) => {
      const ts = new Date(entry.timestamp).toLocaleString("nl-NL", {
        timeZone: "Europe/Amsterdam",
      });
      lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      lines.push(`#${i + 1}  ${ts}`);
      lines.push(`Pagina: ${entry.page}`);
      lines.push(``);
      lines.push(entry.feedback);
      lines.push(``);

      if (entry.deviceInfo) {
        lines.push(`Apparaat:`);
        for (const [k, v] of Object.entries(entry.deviceInfo)) {
          lines.push(`  ${k}: ${v}`);
        }
        lines.push(``);
      }

      // Collect screenshot as attachment
      if (entry.screenshot?.startsWith("data:image/")) {
        const base64Data = entry.screenshot.replace(/^data:image\/\w+;base64,/, "");
        const isJpeg =
          entry.screenshot.includes("jpeg") || entry.screenshot.includes("jpg");
        const ext = isJpeg ? "jpg" : "png";
        attachments.push({
          filename: `screenshot-${i + 1}.${ext}`,
          content: base64Data,
          encoding: "base64",
          contentType: isJpeg ? "image/jpeg" : "image/png",
        });
        lines.push(`[Schermafbeelding bijgevoegd: screenshot-${i + 1}.${ext}]`);
        lines.push(``);
      }
    });

    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`Einde overzicht`);

    // Send email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: GMAIL_USER, pass: GMAIL_PASS },
    });

    await transporter.sendMail({
      from: `"untangle.lol feedback" <${GMAIL_USER}>`,
      to: RECIPIENTS.join(", "),
      subject: `Feedback digest – ${entries.length} bericht${entries.length !== 1 ? "en" : ""} – untangle.lol`,
      text: lines.join("\n"),
      attachments,
    });

    // Delete processed files
    for (const file of files) {
      try {
        fs.unlinkSync(path.join(FEEDBACK_DIR, file));
      } catch {
        // Best-effort deletion
      }
    }

    return NextResponse.json({ ok: true, sent: true, count: entries.length });
  } catch (err) {
    console.error("[feedback/digest] error:", err.message);
    return NextResponse.json({ error: "Digest failed" }, { status: 500 });
  }
}
