import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calculateFinalPrice } from "@/lib/price-calculator";
import { getSessionFromRequest } from "@/lib/auth";
import { logAudit, recordPriceHistory } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        subcategory: true,
        priceHistory: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Produto não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Erro ao buscar produto." },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(req);
    const existing = await prisma.product.findUnique({
      where: { id: params.id },
      include: { category: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Produto não encontrado." },
        { status: 404 }
      );
    }

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
      reason,
    } = body;

    // Validações
    if (name !== undefined && name.trim() === "") {
      return NextResponse.json(
        { success: false, error: "O nome não pode ser vazio." },
        { status: 400 }
      );
    }

    let parsedOriginalPrice = existing.originalPrice;
    if (originalPrice !== undefined) {
      parsedOriginalPrice = parseFloat(originalPrice);
      if (isNaN(parsedOriginalPrice) || parsedOriginalPrice < 0) {
        return NextResponse.json(
          { success: false, error: "O preço original não pode ser negativo ou vazio." },
          { status: 400 }
        );
      }
    }

    const targetCategoryId = categoryId || existing.categoryId;
    const targetCondition = condition || existing.condition;
    const targetPriceSource = priceSource || existing.priceSource;

    const category = await prisma.category.findUnique({
      where: { id: targetCategoryId },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Categoria inválida." },
        { status: 400 }
      );
    }

    const marginSetting = await prisma.setting.findUnique({ where: { key: "iphone_margin" } });
    const roundingSetting = await prisma.setting.findUnique({ where: { key: "rounding_mode" } });

    // RECALCULO AUTOMÁTICO SEM ACUMULAR MARGEM
    // Formula: preco_final = preco_original + margem
    const calc = calculateFinalPrice(
      {
        categorySlug: category.slug,
        categoryName: category.name,
        condition: targetCondition,
        priceSource: targetPriceSource,
        originalPrice: parsedOriginalPrice,
        customMargin: customMargin !== undefined ? parseFloat(customMargin) : existing.margin,
      },
      {
        iphoneMargin: marginSetting ? parseFloat(marginSetting.value) : 200,
        roundingMode: (roundingSetting?.value as any) || "EXACT",
      }
    );

    const priceHasChanged =
      existing.originalPrice !== calc.originalPrice ||
      existing.finalPrice !== calc.finalPrice ||
      existing.margin !== calc.margin;

    const updatedProduct = await prisma.product.update({
      where: { id: params.id },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        categoryId: targetCategoryId,
        subcategoryId: subcategoryId !== undefined ? (subcategoryId || null) : existing.subcategoryId,
        model: model !== undefined ? model.trim() : existing.model,
        storage: storage !== undefined ? storage : existing.storage,
        ram: ram !== undefined ? ram : existing.ram,
        color: color !== undefined ? color : existing.color,
        condition: targetCondition,
        priceSource: targetPriceSource,
        originalPrice: calc.originalPrice,
        margin: calc.margin,
        finalPrice: calc.finalPrice,
        active: active !== undefined ? Boolean(active) : existing.active,
      },
      include: {
        category: true,
        subcategory: true,
      },
    });

    // Se houve alteração de preço, registrar no histórico
    if (priceHasChanged) {
      await recordPriceHistory({
        productId: updatedProduct.id,
        oldPrice: existing.originalPrice,
        newPrice: calc.originalPrice,
        margin: calc.margin,
        finalPrice: calc.finalPrice,
        userResponsible: session?.name || "Administrador",
        reason: reason || "Atualização de preço do produto",
      });
    }

    // Auditoria
    await logAudit({
      userId: session?.id,
      userName: session?.name,
      action: "UPDATE",
      entity: "PRODUCT",
      details: {
        productId: updatedProduct.id,
        name: updatedProduct.name,
        priceChanged: priceHasChanged,
        oldPrice: existing.originalPrice,
        newPrice: calc.originalPrice,
        margin: calc.margin,
        finalPrice: calc.finalPrice,
      },
    });

    return NextResponse.json({
      success: true,
      product: updatedProduct,
      priceRecalculated: priceHasChanged,
    });
  } catch (error: any) {
    console.error("Erro ao atualizar produto:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Falha ao atualizar produto" },
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
    const existing = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Produto não encontrado." },
        { status: 404 }
      );
    }

    await prisma.product.delete({
      where: { id: params.id },
    });

    await logAudit({
      userId: session?.id,
      userName: session?.name,
      action: "DELETE",
      entity: "PRODUCT",
      details: {
        productId: existing.id,
        name: existing.name,
      },
    });

    return NextResponse.json({ success: true, message: "Produto removido com sucesso." });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Falha ao excluir produto." },
      { status: 500 }
    );
  }
}
