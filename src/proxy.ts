import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import {
  clearAuthSessionCookiesFromRequest,
  hasAuthSessionCookie,
} from "@/lib/auth-cookies";

const publicPaths = ["/login", "/api/auth"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/login" || pathname.startsWith("/login/")) {
    const session = await auth();
    if (session?.user) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (hasAuthSessionCookie(request.cookies.getAll())) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("cleared", "1");
      const callbackUrl = request.nextUrl.searchParams.get("callbackUrl");
      if (callbackUrl) {
        loginUrl.searchParams.set("callbackUrl", callbackUrl);
      }
      const response = NextResponse.redirect(loginUrl);
      clearAuthSessionCookiesFromRequest(request, response);
      return response;
    }

    return NextResponse.next();
  }

  const isPublic = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (isPublic) {
    return NextResponse.next();
  }

  const session = await auth();
  if (!session?.user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    const response = NextResponse.redirect(loginUrl);
    clearAuthSessionCookiesFromRequest(request, response);
    return response;
  }

  if (pathname.startsWith("/settings") && session.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
