import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Permitir login sin validación
  if (pathname === "/admin/login") return NextResponse.next();

  // Solo proteger /admin/*
  if (!pathname.startsWith("/admin")) return NextResponse.next();

  // Validación liviana: solo existencia de cookie
  const token = req.cookies.get("admin_session")?.value;
  if (!token) {
    const url = new URL("/admin/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};