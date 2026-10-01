import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { logAudit, recordPriceHistory } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    const { items } = await req.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Nenhum item selecionado para salvar." },
        { status: 400 }
      );
    }

    let createdCount = 0;
    const errors: any[] = [];

    for (const item of items) {
      try {
        if (!item.name || !item.categoryId || item.originalPrice === undefined) {
          continue;
        }

        const product = await prisma.product.create({
          data: {
            name: item.name.trim(),
            categoryId: item.categoryId,
            model: item.model || item.name.trim(),
            storage: item.storage || null,
            color: item.color || null,
            condition: item.condition || "NOVO_LACRADO",
            priceSource: item.priceSource || "PRECO_DO_DIA",
            originalPrice: parseFloat(item.originalPrice) || 0,
            margin: parseFloat(item.margin) || 0,
            finalPrice: parseFloat(item.finalPrice) || 0,
            active: true,
          },
        });

        await recordPriceHistory({
          productId: product.id,
          oldPrice: product.originalPrice,
          newPrice: product.originalPrice,
          margin: product.margin,
          finalPrice: product.finalPrice,
          userResponsible: session?.name || "Importação",
          reason: "Importação de produtos",
        });

        createdCount++;
      } catch (err: any) {
        errors.push({ item: item.name, error: err.message });
      }
    }

    await logAudit({
      userId: session?.id,
      userName: session?.name,
      action: "IMPORT",
      entity: "PRODUCT",
      details: { totalReceived: items.length, createdCount, errorsCount: errors.length },
    });

    return NextResponse.json({
      success: true,
      createdCount,
      errorsCount: errors.length,
      errors: errors.slice(0, 5),
    });
  } catch (error: any) {
    console.error("Erro ao efetivar importação:", error);
    return NextResponse.json(
      { success: false, error: "Falha ao gravar produtos importados." },
      { status: 500 }
    );
  }
}
