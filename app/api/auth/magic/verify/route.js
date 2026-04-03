import { NextResponse } from "next/server";
import { signSession, sessionCookieHeader } from "../../../../../lib/session.js";
import { getUser } from "../../../../lib/userStore.js";
import { getDb } from "../../../../lib/db.js";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://untangle.lol";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) return NextResponse.redirect(`${BASE_URL}/?auth_error=1`);

  const db = getDb();
  const entry = db.prepare(
    `SELECT email, expires_at, used FROM magic_tokens WHERE token = ?`
  ).get(token);

  if (!entry || entry.used || Math.floor(Date.now() / 1000) > entry.expires_at) {
    return NextResponse.redirect(`${BASE_URL}/?auth_error=1`);
  }

  // Mark as used immediately (single-use)
  db.prepare(`UPDATE magic_tokens SET used = 1 WHERE token = ?`).run(token);

  const email = entry.email;

  // Merge with stored profile (inherits name/avatar from Google login if same email)
  const stored = getUser(email);

  const payload = {
    email,
    name: stored?.name || email.split("@")[0],
    picture: stored?.picture || null,
    iat: Math.floor(Date.now() / 1000),
  };

  const sessionToken = await signSession(payload);
  const cookieHeader = sessionCookieHeader(sessionToken);

  const response = NextResponse.redirect(`${BASE_URL}/?signed_in=1`);
  response.headers.set("Set-Cookie", cookieHeader);
  return response;
}
