import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "ifindz_apple_secret_key_production_2026_super_secure"
);

// Rotas públicas que não exigem login
const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/apple-logo.png",
  "/favicon.ico",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Permitir arquivos estáticos do Next.js, autenticação e assets públicos
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path)) ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Verificar token de sessão (login obrigatório para tudo)
  const token = req.cookies.get("ifindz_session")?.value;

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("from", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  try {
    await jwtVerify(token, JWT_SECRET);
    return NextResponse.next();
  } catch (err) {
    const loginUrl = new URL("/login", req.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("from", pathname);
    }
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete("ifindz_session");
    return res;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files:
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
