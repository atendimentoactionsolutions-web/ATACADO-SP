import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { logAudit, recordPriceHistory } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(req);
    const existing = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Produto original não encontrado" },
        { status: 404 }
      );
    }

    const duplicated = await prisma.product.create({
      data: {
        name: `${existing.name} (Cópia)`,
        categoryId: existing.categoryId,
        subcategoryId: existing.subcategoryId,
        model: existing.model,
        storage: existing.storage,
        ram: existing.ram,
        color: existing.color,
        condition: existing.condition,
        priceSource: existing.priceSource,
        originalPrice: existing.originalPrice,
        margin: existing.margin,
        finalPrice: existing.finalPrice,
        active: false, // Inicia inativo por segurança
      },
      include: {
        category: true,
        subcategory: true,
      },
    });

    await recordPriceHistory({
      productId: duplicated.id,
      oldPrice: duplicated.originalPrice,
      newPrice: duplicated.originalPrice,
      margin: duplicated.margin,
      finalPrice: duplicated.finalPrice,
      userResponsible: session?.name || "Administrador",
      reason: `Duplicado a partir de ${existing.name}`,
    });

    await logAudit({
      userId: session?.id,
      userName: session?.name,
      action: "DUPLICATE",
      entity: "PRODUCT",
      details: {
        originalId: existing.id,
        newId: duplicated.id,
        name: duplicated.name,
      },
    });

    return NextResponse.json({ success: true, product: duplicated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Erro ao duplicar produto" },
      { status: 500 }
    );
  }
}
