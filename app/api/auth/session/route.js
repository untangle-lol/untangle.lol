import { NextResponse } from "next/server";
import { verifySession, getSessionToken } from "../../../../lib/session.js";

export async function GET(request) {
  const token = getSessionToken(request);
  if (!token) {
    return NextResponse.json({ user: null });
  }
  const payload = await verifySession(token);
  if (!payload) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({
    user: {
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    },
  });
}
