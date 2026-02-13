import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Ambil token dari cookie (namanya biasanya 'token' atau next-auth.session-token)
  // Di project ini kita akan set cookie dengan nama 'token' saat login
  const token = request.cookies.get("token")?.value;
  
  const { pathname } = request.nextUrl;

  // 1. Route Proteksi: /dashboard dan turunannya wajib login
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  // 2. Route Tamu: /login gak boleh diakses kalau udah login
  if (pathname.startsWith("/login")) {
    if (token) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
  ],
};
