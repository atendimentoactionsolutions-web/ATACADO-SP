import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import * as XLSX from "xlsx";
import { formatBRL } from "@/lib/price-calculator";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const format = (searchParams.get("format") || "csv").toLowerCase();

    // STRICT BUSINESS RULE:
    // Exportar Preço do Dia deve exportar SOMENTE produtos:
    // priceSource === "PRECO_DO_DIA" E condition === "NOVO_LACRADO" E active === true
    const products = await prisma.product.findMany({
      where: {
        priceSource: "PRECO_DO_DIA",
        condition: "NOVO_LACRADO",
        active: true,
      },
      include: {
        category: true,
        subcategory: true,
      },
      orderBy: [{ category: { order: "asc" } }, { finalPrice: "asc" }],
    });

    const exportRows = products.map((p) => ({
      ID: p.id,
      Categoria: p.category.name,
      Subcategoria: p.subcategory?.name || "",
      Produto: p.name,
      Modelo: p.model,
      Capacidade: p.storage || "",
      RAM: p.ram || "",
      Cor: p.color || "",
      Condicao: "Novo / Lacrado",
      Fonte: "Preço do Dia",
      "Preco Original (R$)": p.originalPrice,
      "Margem Aplicada (R$)": p.margin,
      "Preco Final (R$)": p.finalPrice,
      "Preco Final Formatado": formatBRL(p.finalPrice),
      "Ultima Atualizacao": p.updatedAt.toISOString(),
    }));

    const dateStr = new Date().toISOString().split("T")[0];

    if (format === "json") {
      return new NextResponse(JSON.stringify(exportRows, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="ifindz_preco_do_dia_${dateStr}.json"`,
        },
      });
    }

    // Build worksheet for Excel or CSV
    const worksheet = XLSX.utils.json_to_sheet(exportRows);

    if (format === "xlsx" || format === "excel") {
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Preço do Dia");
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="ifindz_preco_do_dia_${dateStr}.xlsx"`,
        },
      });
    }

    // Default: CSV
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="ifindz_preco_do_dia_${dateStr}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("Erro na exportação:", error);
    return NextResponse.json(
      { success: false, error: "Falha ao gerar arquivo de exportação." },
      { status: 500 }
    );
  }
}
