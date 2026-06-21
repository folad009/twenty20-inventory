import type { NextRequest } from "next/server";
import type { NextResponse } from "next/server";

type CookieList = { name: string }[];

export function hasAuthSessionCookie(cookies: CookieList): boolean {
  return cookies.some((cookie) => cookie.name.includes("authjs.session-token"));
}

export function clearAuthSessionCookiesFromRequest(
  request: NextRequest,
  response: NextResponse,
) {
  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.includes("authjs.session-token")) {
      response.cookies.delete(cookie.name);
    }
  }
}
