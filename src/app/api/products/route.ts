import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calculateFinalPrice } from "@/lib/price-calculator";
import { getSessionFromRequest } from "@/lib/auth";
import { logAudit, recordPriceHistory } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const source = searchParams.get("source"); // "PRECO_DO_DIA", "LOJA_FISICA", "all"
    const condition = searchParams.get("condition"); // "NOVO_LACRADO", "SEMINOVO", "all"
    const onlyNovo = searchParams.get("onlyNovo") === "true";
    const hideSeminovo = searchParams.get("hideSeminovo") === "true";
    const category = searchParams.get("category");
    const subcategory = searchParams.get("subcategory");
    const model = searchParams.get("model");
    const storage = searchParams.get("storage");
    const color = searchParams.get("color");
    const status = searchParams.get("status"); // "active", "inactive", "all"
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const search = searchParams.get("search");

    const where: any = {};

    // Source filtering
    if (source && source !== "all") {
      where.priceSource = source;
    }

    // Condition filtering
    if (onlyNovo) {
      where.condition = "NOVO_LACRADO";
    } else if (hideSeminovo) {
      where.condition = { not: "SEMINOVO" };
    } else if (condition && condition !== "all") {
      where.condition = condition;
    }

    // Category
    if (category && category !== "all") {
      where.OR = [
        { categoryId: category },
        { category: { slug: category } },
        { category: { name: category } },
      ];
    }

    // Subcategory
    if (subcategory && subcategory !== "all") {
      where.subcategoryId = subcategory;
    }

    // Model
    if (model && model !== "all") {
      where.model = { contains: model };
    }

    // Storage
    if (storage && storage !== "all") {
      where.storage = storage;
    }

    // Color
    if (color && color !== "all") {
      where.color = { contains: color };
    }

    // Status
    if (status === "active") {
      where.active = true;
    } else if (status === "inactive") {
      where.active = false;
    }

    // Price range (based on finalPrice)
    if (minPrice || maxPrice) {
      where.finalPrice = {};
      if (minPrice) where.finalPrice.gte = parseFloat(minPrice);
      if (maxPrice) where.finalPrice.lte = parseFloat(maxPrice);
    }

    // Fast search across fields (case-insensitive by nature in SQLite contains)
    if (search && search.trim() !== "") {
      const term = search.trim();
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { name: { contains: term } },
            { model: { contains: term } },
            { storage: { contains: term } },
            { color: { contains: term } },
            { category: { name: { contains: term } } },
          ],
        },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        subcategory: true,
        _count: {
          select: { priceHistory: true },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
    });

    return NextResponse.json({
      success: true,
      total: products.length,
      products,
    });
  } catch (error: any) {
    console.error("Erro ao listar produtos:", error);
    return NextResponse.json(
      { success: false, error: "Falha ao consultar produtos" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    const body = await req.json();

    const {
      name,
      categoryId,
      subcategoryId,
      model,
      storage,
      ram,
      color,
      condition,
      priceSource,
      originalPrice,
      customMargin,
      active,
    } = body;

    // Regras de Validação (Item 22)
    if (!name || name.trim() === "") {
      return NextResponse.json(
        { success: false, error: "O nome do produto é obrigatório." },
        { status: 400 }
      );
    }

    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: "A categoria é obrigatória." },
        { status: 400 }
      );
    }

    if (originalPrice === undefined || originalPrice === null || originalPrice === "") {
      return NextResponse.json(
        { success: false, error: "O preço original é obrigatório." },
        { status: 400 }
      );
    }

    const parsedPrice = parseFloat(originalPrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json(
        { success: false, error: "O preço original não pode ser negativo ou inválido." },
        { status: 400 }
      );
    }

    if (!condition || !["NOVO_LACRADO", "SEMINOVO"].includes(condition)) {
      return NextResponse.json(
        { success: false, error: "Condição inválida. Use NOVO_LACRADO ou SEMINOVO." },
        { status: 400 }
      );
    }

    if (!priceSource || !["PRECO_DO_DIA", "LOJA_FISICA"].includes(priceSource)) {
      return NextResponse.json(
        { success: false, error: "Fonte de preço inválida. Use PRECO_DO_DIA ou LOJA_FISICA." },
        { status: 400 }
      );
    }

    // Carregar categoria para checar se é iPhone
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Categoria especificada não existe." },
        { status: 400 }
      );
    }

    // Carregar configurações de margem e arredondamento
    const marginSetting = await prisma.setting.findUnique({ where: { key: "iphone_margin" } });
    const roundingSetting = await prisma.setting.findUnique({ where: { key: "rounding_mode" } });

    const calc = calculateFinalPrice(
      {
        categorySlug: category.slug,
        categoryName: category.name,
        condition,
        priceSource,
        originalPrice: parsedPrice,
        customMargin: customMargin ? parseFloat(customMargin) : 0,
      },
      {
        iphoneMargin: marginSetting ? parseFloat(marginSetting.value) : 200,
        roundingMode: (roundingSetting?.value as any) || "EXACT",
      }
    );

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        categoryId,
        subcategoryId: subcategoryId || null,
        model: model ? model.trim() : name.trim(),
        storage: storage || null,
        ram: ram || null,
        color: color || null,
        condition,
        priceSource,
        originalPrice: calc.originalPrice,
        margin: calc.margin,
        finalPrice: calc.finalPrice,
        active: active !== undefined ? Boolean(active) : true,
      },
      include: {
        category: true,
        subcategory: true,
      },
    });

    // Registrar no histórico de preços
    await recordPriceHistory({
      productId: product.id,
      oldPrice: calc.originalPrice,
      newPrice: calc.originalPrice,
      margin: calc.margin,
      finalPrice: calc.finalPrice,
      userResponsible: session?.name || "Administrador",
      reason: "Criação do produto",
    });

    // Registrar no AuditLog
    await logAudit({
      userId: session?.id,
      userName: session?.name,
      action: "CREATE",
      entity: "PRODUCT",
      details: {
        productId: product.id,
        name: product.name,
        originalPrice: calc.originalPrice,
        margin: calc.margin,
        finalPrice: calc.finalPrice,
      },
    });

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error: any) {
    console.error("Erro ao criar produto:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Falha ao criar produto" },
      { status: 500 }
    );
  }
}
