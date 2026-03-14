import { NextResponse } from "next/server";
import { signSession, sessionCookieHeader } from "../../../../lib/session.js";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://untangle.lol";

  if (error || !code) {
    return NextResponse.redirect(`${baseUrl}/?auth_error=1`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenRes.json();
    if (tokens.error) {
      console.error("Token exchange error:", tokens.error);
      return NextResponse.redirect(`${baseUrl}/?auth_error=1`);
    }

    // Fetch Google profile
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await profileRes.json();

    if (!profile.email) {
      return NextResponse.redirect(`${baseUrl}/?auth_error=1`);
    }

    // Sign session
    const payload = {
      email: profile.email,
      name: profile.name || profile.email.split("@")[0],
      picture: profile.picture || null,
      iat: Math.floor(Date.now() / 1000),
    };

    const token = await signSession(payload);
    const cookieHeader = sessionCookieHeader(token);

    const response = NextResponse.redirect(`${baseUrl}/?signed_in=1`);
    response.headers.set("Set-Cookie", cookieHeader);
    return response;

  } catch (err) {
    console.error("Google callback error:", err);
    return NextResponse.redirect(`${baseUrl}/?auth_error=1`);
  }
}
