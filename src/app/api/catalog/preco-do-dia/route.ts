import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/catalog/preco-do-dia
 * Public API for official catalog
 * STRICT BUSINESS RULE:
 * ONLY returns products where:
 *   - priceSource === "PRECO_DO_DIA"
 *   - condition === "NOVO_LACRADO"
 *   - active === true
 * NEVER returns SEMINOVO or LOJA_FISICA products!
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get("category");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "category";

    // Base query adhering to strict business rules
    const where: any = {
      priceSource: "PRECO_DO_DIA",
      condition: "NOVO_LACRADO",
      active: true,
    };

    if (categorySlug && categorySlug !== "all") {
      where.category = {
        slug: categorySlug,
      };
    }

    if (search && search.trim() !== "") {
      const term = search.trim();
      where.OR = [
        { name: { contains: term } },
        { model: { contains: term } },
        { storage: { contains: term } },
        { color: { contains: term } },
      ];
    }

    let orderBy: any = [{ category: { order: "asc" } }, { finalPrice: "asc" }];
    if (sort === "price-asc") {
      orderBy = [{ finalPrice: "asc" }];
    } else if (sort === "price-desc") {
      orderBy = [{ finalPrice: "desc" }];
    } else if (sort === "name") {
      orderBy = [{ name: "asc" }];
    }

    let products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
          },
        },
        subcategory: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy,
    });

    // Se o banco estiver vazio (ex: deploy novo no Render), dispara auto-sync com Mundo Apple
    if (products.length === 0 && (!categorySlug || categorySlug === "all") && (!search || search.trim() === "")) {
      try {
        const { syncMundoAppleLive } = await import("@/lib/mundo-apple-sync");
        await syncMundoAppleLive("Auto Sync Inicial");
        products = await prisma.product.findMany({
          where,
          include: {
            category: { select: { id: true, name: true, slug: true, icon: true } },
            subcategory: { select: { id: true, name: true, slug: true } },
          },
          orderBy,
        });
      } catch (e) {
        console.error("Auto sync on empty catalog error:", e);
      }
    }

    const categories = await prisma.category.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
      },
    });

    // Get last updated date of prices in catalog
    const lastProduct = await prisma.product.findFirst({
      where: {
        priceSource: "PRECO_DO_DIA",
        condition: "NOVO_LACRADO",
        active: true,
      },
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    });

    return NextResponse.json({
      success: true,
      total: products.length,
      lastUpdated: lastProduct?.updatedAt || new Date(),
      categories,
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category.name,
        categorySlug: p.category.slug,
        subcategory: p.subcategory?.name || null,
        model: p.model,
        storage: p.storage,
        ram: p.ram,
        color: p.color,
        condition: p.condition,
        conditionLabel: "Novo Lacrado",
        price: p.finalPrice,
        priceSource: p.priceSource,
        active: p.active,
        updatedAt: p.updatedAt,
      })),
    });
  } catch (error: any) {
    console.error("Erro na API do catálogo:", error);
    return NextResponse.json(
      { success: false, error: "Falha ao carregar catálogo público" },
      { status: 500 }
    );
  }
}
