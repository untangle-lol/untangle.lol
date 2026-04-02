import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname, searchParams } = request.nextUrl;
  // Redirect legacy /?id=<n> share links to /id/<n> without forwarding query params
  if (pathname === "/") {
    const id = searchParams.get("id");
    if (id) {
      return NextResponse.redirect(new URL(`/id/${id}`, request.url), 301);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/",
};
