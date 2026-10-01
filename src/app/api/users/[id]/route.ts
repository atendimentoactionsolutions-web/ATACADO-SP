import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest, hashPassword } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, password, role, active } = body;

    const data: any = {};
    if (name) data.name = name.trim();
    if (email) data.email = email.toLowerCase().trim();
    if (role) data.role = role;
    if (active !== undefined) data.active = Boolean(active);
    if (password && password.trim() !== "") {
      data.passwordHash = await hashPassword(password);
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });

    await logAudit({
      userId: session.id,
      userName: session.name,
      action: "UPDATE",
      entity: "USER",
      details: { updatedUserId: params.id, email: updated.email },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Erro ao atualizar usuário" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
    }

    if (session.id === params.id) {
      return NextResponse.json(
        { success: false, error: "Não é permitido excluir o próprio usuário logado." },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id: params.id },
    });

    await logAudit({
      userId: session.id,
      userName: session.name,
      action: "DELETE",
      entity: "USER",
      details: { deletedUserId: params.id },
    });

    return NextResponse.json({ success: true, message: "Usuário removido." });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Erro ao remover usuário" }, { status: 500 });
  }
}
