import { NextResponse } from "next/server";
import fs from "fs";
import { signSession, sessionCookieHeader } from "../../../../../lib/session.js";

const DATA_FILE = "/data/magic_tokens.json";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://untangle.lol";

function loadTokens() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); } catch { return {}; }
}
function saveTokens(store) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(store), "utf8");
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) return NextResponse.redirect(`${BASE_URL}/?auth_error=1`);

  const store = loadTokens();
  const entry = store[token];

  if (!entry || entry.used || Date.now() > entry.expiresAt) {
    return NextResponse.redirect(`${BASE_URL}/?auth_error=1`);
  }

  // Mark as used immediately (single-use)
  store[token].used = true;
  saveTokens(store);

  const email = entry.email;
  const name = email.split("@")[0];

  const payload = {
    email,
    name,
    picture: null,
    iat: Math.floor(Date.now() / 1000),
  };

  const sessionToken = await signSession(payload);
  const cookieHeader = sessionCookieHeader(sessionToken);

  const response = NextResponse.redirect(`${BASE_URL}/?signed_in=1`);
  response.headers.set("Set-Cookie", cookieHeader);
  return response;
}
