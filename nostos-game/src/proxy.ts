import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Exclude static files, api routes, and public pages
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/showcase" ||
    pathname.includes(".") // static files like favicon
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get("nostos_session")?.value;
  let session = null;
  if (sessionCookie) {
    session = await decrypt(sessionCookie);
  }

  // Protect /play (Teams only)
  if (pathname.startsWith("/play")) {
    if (!session || session.role !== "team") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Protect /admin (Admins only)
  if (pathname.startsWith("/admin")) {
    if (!session || session.role !== "admin") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
