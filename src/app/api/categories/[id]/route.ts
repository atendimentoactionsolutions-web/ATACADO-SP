import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(req);
    const body = await req.json();
    const { name, icon, order, active } = body;

    const data: any = {};
    if (name !== undefined) {
      data.name = name.trim();
      data.slug = name
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-");
    }
    if (icon !== undefined) data.icon = icon;
    if (order !== undefined) data.order = parseInt(order);
    if (active !== undefined) data.active = Boolean(active);

    const category = await prisma.category.update({
      where: { id: params.id },
      data,
    });

    await logAudit({
      userId: session?.id,
      userName: session?.name,
      action: "UPDATE",
      entity: "CATEGORY",
      details: { categoryId: category.id, name: category.name },
    });

    return NextResponse.json({ success: true, category });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Erro ao atualizar categoria." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(req);
    const count = await prisma.product.count({
      where: { categoryId: params.id },
    });

    if (count > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Não é possível excluir. Existem ${count} produtos vinculados a esta categoria.`,
        },
        { status: 400 }
      );
    }

    await prisma.subcategory.deleteMany({
      where: { categoryId: params.id },
    });

    await prisma.category.delete({
      where: { id: params.id },
    });

    await logAudit({
      userId: session?.id,
      userName: session?.name,
      action: "DELETE",
      entity: "CATEGORY",
      details: { categoryId: params.id },
    });

    return NextResponse.json({ success: true, message: "Categoria removida com sucesso." });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Erro ao excluir categoria." },
      { status: 500 }
    );
  }
}
