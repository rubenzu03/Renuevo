import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, verifySession } from "./lib/auth";

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const token = req.cookies.get(AUTH_COOKIE)?.value;

  if (verifySession(token)) {
    return pathname === "/login"
      ? NextResponse.redirect(new URL("/", req.url))
      : NextResponse.next();
  }
  if (pathname === "/login") return NextResponse.next();

  const login = new URL("/login", req.url);
  login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|mjs|woff2?)$).*)",
  ],
};
