import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    const where: any = {};
    if (productId) {
      where.productId = productId;
    }

    const history = await prisma.priceHistory.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            condition: true,
            priceSource: true,
            category: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ success: true, history });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Erro ao consultar histórico" },
      { status: 500 }
    );
  }
}
