import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, verifySession } from "./lib/auth";

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const token = req.cookies.get(AUTH_COOKIE)?.value;

  if (verifySession(token)) {
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/overview", req.url));
    }
    return NextResponse.next();
  }
  if (pathname === "/") return NextResponse.next();

  const home = new URL("/", req.url);
  home.searchParams.set("next", pathname + search);
  return NextResponse.redirect(home);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|mjs|woff2?)$).*)",
  ],
};
