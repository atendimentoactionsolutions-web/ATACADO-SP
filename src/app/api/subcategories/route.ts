import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    const { categoryId, name, order } = await req.json();

    if (!categoryId || !name) {
      return NextResponse.json(
        { success: false, error: "Categoria e nome da subcategoria são obrigatórios." },
        { status: 400 }
      );
    }

    const slug = name
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-");

    const sub = await prisma.subcategory.create({
      data: {
        categoryId,
        name: name.trim(),
        slug,
        order: order ? parseInt(order) : 0,
        active: true,
      },
    });

    await logAudit({
      userId: session?.id,
      userName: session?.name,
      action: "CREATE",
      entity: "SUBCATEGORY",
      details: { subcategoryId: sub.id, name: sub.name },
    });

    return NextResponse.json({ success: true, subcategory: sub });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Erro ao criar subcategoria." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "ID obrigatório" }, { status: 400 });
    }

    await prisma.subcategory.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Subcategoria excluída." });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Erro ao excluir subcategoria." },
      { status: 500 }
    );
  }
}
