import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPassword, signSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "E-mail e senha são obrigatórios" },
        { status: 400 }
      );
    }

    const identifier = (email || "").toLowerCase().trim();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { name: { equals: identifier } },
        ],
      },
    });

    if (!user || !user.active) {
      return NextResponse.json(
        { success: false, error: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const token = await signSessionToken(sessionUser);

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: "LOGIN",
      entity: "USER",
      details: { email: user.email },
      ip: req.headers.get("x-forwarded-for") || undefined,
    });

    const response = NextResponse.json({
      success: true,
      user: sessionUser,
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error("Erro no login:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
