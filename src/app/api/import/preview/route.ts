import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calculateFinalPrice } from "@/lib/price-calculator";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let rawItems: any[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File;
      if (!file) {
        return NextResponse.json({ success: false, error: "Nenhum arquivo enviado." }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith(".json")) {
        const text = buffer.toString("utf-8");
        rawItems = JSON.parse(text);
      } else if (fileName.endsWith(".csv") || fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        rawItems = XLSX.utils.sheet_to_json(sheet);
      } else {
        return NextResponse.json(
          { success: false, error: "Formato não suportado. Use CSV, Excel (.xlsx/.xls) ou JSON." },
          { status: 400 }
        );
      }
    } else if (contentType.includes("application/json")) {
      const body = await req.json();
      rawItems = Array.isArray(body) ? body : body.items || [];
    }

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return NextResponse.json(
        { success: false, error: "Nenhum produto válido encontrado no arquivo." },
        { status: 400 }
      );
    }

    // Carregar categorias e configurações existentes
    const categories = await prisma.category.findMany();
    const marginSetting = await prisma.setting.findUnique({ where: { key: "iphone_margin" } });
    const roundingSetting = await prisma.setting.findUnique({ where: { key: "rounding_mode" } });

    const iphoneMargin = marginSetting ? parseFloat(marginSetting.value) : 200;
    const roundingMode = (roundingSetting?.value as any) || "EXACT";

    const previewList = rawItems.map((item, index) => {
      // Normalização de chaves flexíveis
      const getVal = (...keys: string[]) => {
        for (const k of keys) {
          if (item[k] !== undefined) return item[k];
          const found = Object.keys(item).find((key) => key.toLowerCase().trim() === k.toLowerCase());
          if (found && item[found] !== undefined) return item[found];
        }
        return undefined;
      };

      const name = String(getVal("name", "nome", "produto", "product", "descricao") || `Produto ${index + 1}`).trim();
      const rawCategory = String(getVal("category", "categoria", "tipo") || "").trim();
      const storage = String(getVal("storage", "capacidade", "memoria", "gb") || "").trim() || null;
      const color = String(getVal("color", "cor") || "").trim() || null;
      const rawCondition = String(getVal("condition", "condicao", "estado") || "NOVO_LACRADO").trim().toUpperCase();
      const rawSource = String(getVal("priceSource", "source", "fonte", "tipo_preco") || "PRECO_DO_DIA").trim().toUpperCase();

      const condition =
        rawCondition.includes("SEMI") || rawCondition.includes("USADO")
          ? "SEMINOVO"
          : "NOVO_LACRADO";

      const priceSource =
        rawSource.includes("FISIC") || rawSource.includes("LOJA")
          ? "LOJA_FISICA"
          : "PRECO_DO_DIA";

      // Parse price
      let rawPrice = getVal("originalPrice", "price", "preco", "preco_original", "custo", "valor");
      if (typeof rawPrice === "string") {
        rawPrice = rawPrice.replace(/[R$\s.]/g, "").replace(",", ".");
      }
      const originalPrice = parseFloat(rawPrice) || 0;

      // Dedução de categoria (se vazia, tenta deduzir do nome)
      let matchedCategory = categories.find(
        (c) =>
          c.name.toLowerCase() === rawCategory.toLowerCase() ||
          c.slug.toLowerCase() === rawCategory.toLowerCase()
      );

      if (!matchedCategory) {
        if (name.toLowerCase().includes("iphone")) {
          matchedCategory = categories.find((c) => c.slug === "iphone");
        } else if (name.toLowerCase().includes("ipad")) {
          matchedCategory = categories.find((c) => c.slug === "ipad");
        } else if (name.toLowerCase().includes("mac") || name.toLowerCase().includes("imac")) {
          matchedCategory = categories.find((c) => c.slug === "mac");
        } else if (name.toLowerCase().includes("watch")) {
          matchedCategory = categories.find((c) => c.slug === "apple-watch");
        } else if (name.toLowerCase().includes("airpod")) {
          matchedCategory = categories.find((c) => c.slug === "airpods");
        } else {
          matchedCategory = categories.find((c) => c.slug === "acessorios") || categories[0];
        }
      }

      // Regra de preço
      const calc = calculateFinalPrice(
        {
          categorySlug: matchedCategory?.slug,
          categoryName: matchedCategory?.name,
          condition,
          priceSource,
          originalPrice,
          customMargin: 0,
        },
        {
          iphoneMargin,
          roundingMode,
        }
      );

      // Regra de publicação:
      // Produtos seminovos e Loja Física são automaticamente excluídos da publicação do Preço do Dia!
      const publishedInCatalog = calc.isEligibleForPublicCatalog;
      const statusNotice =
        condition === "SEMINOVO"
          ? "Excluído da publicação do Preço do Dia (Seminovo)"
          : priceSource === "LOJA_FISICA"
          ? "Excluído da publicação do Preço do Dia (Loja Física)"
          : "Publicado no Preço do Dia";

      return {
        id: `temp-${index}`,
        name,
        categoryId: matchedCategory?.id || "",
        categoryName: matchedCategory?.name || rawCategory || "Outros",
        categorySlug: matchedCategory?.slug || "outros",
        storage,
        color,
        condition,
        priceSource,
        originalPrice: calc.originalPrice,
        margin: calc.margin,
        finalPrice: calc.finalPrice,
        publishedInCatalog,
        statusNotice,
        isValid: originalPrice >= 0 && Boolean(name),
      };
    });

    return NextResponse.json({
      success: true,
      total: previewList.length,
      eligibleForCatalogCount: previewList.filter((p) => p.publishedInCatalog).length,
      seminovosCount: previewList.filter((p) => p.condition === "SEMINOVO").length,
      preview: previewList,
    });
  } catch (error: any) {
    console.error("Erro no preview de importação:", error);
    return NextResponse.json(
      { success: false, error: "Falha ao processar arquivo: " + error.message },
      { status: 500 }
    );
  }
}
