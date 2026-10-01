import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const totalProducts = await prisma.product.count();
    const totalNovos = await prisma.product.count({
      where: { condition: "NOVO_LACRADO" },
    });
    const totalSeminovos = await prisma.product.count({
      where: { condition: "SEMINOVO" },
    });

    const iphoneCategory = await prisma.category.findUnique({
      where: { slug: "iphone" },
    });

    const totalIphones = iphoneCategory
      ? await prisma.product.count({ where: { categoryId: iphoneCategory.id } })
      : 0;

    const totalCategories = await prisma.category.count();

    // REGRA CRÍTICA: Produtos publicados no Preço do Dia
    // Apenas ativos, novos/lacrados e com fonte PRECO_DO_DIA
    const publishedPrecoDoDia = await prisma.product.count({
      where: {
        priceSource: "PRECO_DO_DIA",
        condition: "NOVO_LACRADO",
        active: true,
      },
    });

    // Total Loja Física
    const totalLojaFisica = await prisma.product.count({
      where: { priceSource: "LOJA_FISICA" },
    });

    // Última atualização
    const lastUpdatedProduct = await prisma.product.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    });

    // Produtos alterados recentemente (com categoria e histórico)
    const recentlyModified = await prisma.product.findMany({
      take: 8,
      orderBy: { updatedAt: "desc" },
      include: {
        category: true,
        priceHistory: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    // Estatísticas por categoria
    const categoriesWithCount = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalProducts,
        totalNovos,
        totalSeminovos,
        totalIphones,
        totalCategories,
        publishedPrecoDoDia,
        totalLojaFisica,
        lastPriceUpdate: lastUpdatedProduct?.updatedAt || new Date(),
      },
      recentlyModified,
      categoriesBreakdown: categoriesWithCount.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        count: c._count.products,
      })),
    });
  } catch (error: any) {
    console.error("Erro no dashboard:", error);
    return NextResponse.json(
      { success: false, error: "Falha ao carregar dados do dashboard" },
      { status: 500 }
    );
  }
}
