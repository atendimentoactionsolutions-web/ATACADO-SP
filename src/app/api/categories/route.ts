import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        subcategories: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: { products: true },
        },
      },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ success: true, categories });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Erro ao listar categorias" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    const body = await req.json();
    const { name, icon, order } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Nome da categoria é obrigatório." },
        { status: 400 }
      );
    }

    const slug = name
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-");

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug,
        icon: icon || "Tag",
        order: order ? parseInt(order) : 0,
        active: true,
      },
    });

    await logAudit({
      userId: session?.id,
      userName: session?.name,
      action: "CREATE",
      entity: "CATEGORY",
      details: { categoryId: category.id, name: category.name },
    });

    return NextResponse.json({ success: true, category });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Erro ao criar categoria. Verifique se o nome já existe." },
      { status: 500 }
    );
  }
}
