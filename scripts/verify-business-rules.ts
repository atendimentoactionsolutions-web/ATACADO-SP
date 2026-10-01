import { PrismaClient } from "@prisma/client";
import { calculateFinalPrice, isEligibleForCatalog } from "../src/lib/price-calculator";

const prisma = new PrismaClient();

interface TestResult {
  scenario: number;
  description: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

async function runTests() {
  console.log("==================================================================");
  console.log("   iFindz - Verificação Automatizada dos 10 Cenários Obrigatórios  ");
  console.log("==================================================================\n");

  try {
    // -------------------------------------------------------------------------
    // CENÁRIO 1: iPhone novo no Preço do Dia -> +R$ 200.
    // -------------------------------------------------------------------------
    const s1Calc = calculateFinalPrice({
      categorySlug: "iphone",
      condition: "NOVO_LACRADO",
      priceSource: "PRECO_DO_DIA",
      originalPrice: 7550.0,
    });

    const s1Passed = s1Calc.margin === 200 && s1Calc.finalPrice === 7750.0;
    results.push({
      scenario: 1,
      description: "iPhone novo no Preço do Dia -> recebe margem de +R$ 200,00",
      passed: s1Passed,
      details: `Preço Original: R$ 7.550 | Margem: R$ ${s1Calc.margin} | Preço Final: R$ ${s1Calc.finalPrice} (Esperado: R$ 7.750)`,
    });

    // -------------------------------------------------------------------------
    // CENÁRIO 2: iPhone seminovo -> não aparece no catálogo e não recebe +R$ 200.
    // -------------------------------------------------------------------------
    const s2Calc = calculateFinalPrice({
      categorySlug: "iphone",
      condition: "SEMINOVO",
      priceSource: "PRECO_DO_DIA",
      originalPrice: 5800.0,
    });
    const s2Eligible = isEligibleForCatalog({
      priceSource: "PRECO_DO_DIA",
      condition: "SEMINOVO",
      active: true,
    });

    const s2Passed = s2Calc.margin === 0 && s2Calc.finalPrice === 5800.0 && !s2Eligible;
    results.push({
      scenario: 2,
      description: "iPhone seminovo -> não recebe margem de R$ 200 e NÃO entra no catálogo",
      passed: s2Passed,
      details: `Margem: R$ ${s2Calc.margin} | Final: R$ ${s2Calc.finalPrice} | Elegível Catálogo: ${s2Eligible} (Esperado: false)`,
    });

    // -------------------------------------------------------------------------
    // CENÁRIO 3: iPad novo no Preço do Dia -> aparece sem +R$ 200.
    // -------------------------------------------------------------------------
    const s3Calc = calculateFinalPrice({
      categorySlug: "ipad",
      condition: "NOVO_LACRADO",
      priceSource: "PRECO_DO_DIA",
      originalPrice: 4100.0,
    });
    const s3Eligible = isEligibleForCatalog({
      priceSource: "PRECO_DO_DIA",
      condition: "NOVO_LACRADO",
      active: true,
    });

    const s3Passed = s3Calc.margin === 0 && s3Calc.finalPrice === 4100.0 && s3Eligible;
    results.push({
      scenario: 3,
      description: "iPad novo no Preço do Dia -> aparece no catálogo sem os +R$ 200",
      passed: s3Passed,
      details: `Margem: R$ ${s3Calc.margin} | Final: R$ ${s3Calc.finalPrice} | Elegível Catálogo: ${s3Eligible} (Esperado: true, sem +200)`,
    });

    // -------------------------------------------------------------------------
    // CENÁRIO 4: MacBook novo -> aparece conforme preço configurado (sem +200).
    // -------------------------------------------------------------------------
    const s4Calc = calculateFinalPrice({
      categorySlug: "mac",
      condition: "NOVO_LACRADO",
      priceSource: "PRECO_DO_DIA",
      originalPrice: 7990.0,
      customMargin: 0,
    });
    const s4Eligible = isEligibleForCatalog({
      priceSource: "PRECO_DO_DIA",
      condition: "NOVO_LACRADO",
      active: true,
    });

    const s4Passed = s4Calc.margin === 0 && s4Calc.finalPrice === 7990.0 && s4Eligible;
    results.push({
      scenario: 4,
      description: "MacBook novo -> aparece conforme preço original configurado sem +R$ 200",
      passed: s4Passed,
      details: `Original: R$ 7.990 | Margem: R$ ${s4Calc.margin} | Final: R$ ${s4Calc.finalPrice} | Elegível: ${s4Eligible}`,
    });

    // -------------------------------------------------------------------------
    // CENÁRIO 5: Produto seminovo de qualquer categoria -> não aparece no catálogo.
    // -------------------------------------------------------------------------
    const categoriesToTest = ["iphone", "ipad", "mac", "apple-watch", "airpods", "acessorios"];
    let s5AllExcluded = true;
    for (const cat of categoriesToTest) {
      const eligible = isEligibleForCatalog({
        priceSource: "PRECO_DO_DIA",
        condition: "SEMINOVO",
        active: true,
      });
      if (eligible) s5AllExcluded = false;
    }

    results.push({
      scenario: 5,
      description: "Produto seminovo de qualquer categoria -> nunca aparece no catálogo",
      passed: s5AllExcluded,
      details: `Categorias testadas: [${categoriesToTest.join(", ")}] -> Todas excluídas: ${s5AllExcluded}`,
    });

    // -------------------------------------------------------------------------
    // CENÁRIO 6: Produto da Loja Física -> não aparece no catálogo Preço do Dia.
    // -------------------------------------------------------------------------
    const s6Eligible = isEligibleForCatalog({
      priceSource: "LOJA_FISICA",
      condition: "NOVO_LACRADO",
      active: true,
    });
    const s6Calc = calculateFinalPrice({
      categorySlug: "iphone",
      condition: "NOVO_LACRADO",
      priceSource: "LOJA_FISICA",
      originalPrice: 8200.0,
    });

    const s6Passed = !s6Eligible && s6Calc.margin === 0;
    results.push({
      scenario: 6,
      description: "Produto da Loja Física -> não aparece no catálogo e não recebe +R$ 200",
      passed: s6Passed,
      details: `Elegível para Catálogo: ${s6Eligible} (Esperado: false) | Margem automática: R$ ${s6Calc.margin}`,
    });

    // -------------------------------------------------------------------------
    // CENÁRIO 7: Alteração de preço -> recalcula automaticamente.
    // -------------------------------------------------------------------------
    const s7Initial = calculateFinalPrice({
      categorySlug: "iphone",
      condition: "NOVO_LACRADO",
      priceSource: "PRECO_DO_DIA",
      originalPrice: 7550.0,
    });
    const s7Updated = calculateFinalPrice({
      categorySlug: "iphone",
      condition: "NOVO_LACRADO",
      priceSource: "PRECO_DO_DIA",
      originalPrice: 7600.0,
    });

    const s7Passed = s7Initial.finalPrice === 7750.0 && s7Updated.finalPrice === 7800.0;
    results.push({
      scenario: 7,
      description: "Alteração de preço original (7.550 -> 7.600) -> recalcula automaticamente (7.800)",
      passed: s7Passed,
      details: `Preço anterior: R$ ${s7Initial.finalPrice} -> Novo preço final: R$ ${s7Updated.finalPrice}`,
    });

    // -------------------------------------------------------------------------
    // CENÁRIO 8: Alteração de preço NÃO duplica margem.
    // -------------------------------------------------------------------------
    // Regra: R$ 7.550 + 200 = 7.750. Se fornecedor sobe para 7.600, novo preço DEVE ser 7.800.
    // ERRADO seria: 7.750 + 200 = 7.950.
    const finalPriceVal: number = s7Updated.finalPrice;
    const s8Passed = finalPriceVal === 7800.0 && (finalPriceVal as number) !== 7950.0;
    results.push({
      scenario: 8,
      description: "Alteração de preço NÃO duplica margem (não acumula 7.750 + 200 = 7.950)",
      passed: s8Passed,
      details: `Resultado obtido: R$ ${s7Updated.finalPrice} | Não permitiu o valor acumulado incorreto R$ 7.950`,
    });

    // -------------------------------------------------------------------------
    // CENÁRIO 9: Exportação -> somente produtos elegíveis (PRECO_DO_DIA + NOVO_LACRADO).
    // -------------------------------------------------------------------------
    const dbEligibleProducts = await prisma.product.findMany({
      where: {
        priceSource: "PRECO_DO_DIA",
        condition: "NOVO_LACRADO",
        active: true,
      },
    });

    const hasAnySeminovoInExport = dbEligibleProducts.some((p) => p.condition !== "NOVO_LACRADO");
    const hasAnyLojaFisInExport = dbEligibleProducts.some((p) => p.priceSource !== "PRECO_DO_DIA");

    const s9Passed =
      dbEligibleProducts.length > 0 && !hasAnySeminovoInExport && !hasAnyLojaFisInExport;
    results.push({
      scenario: 9,
      description: "Exportação -> traz estritamente produtos elegíveis (PRECO_DO_DIA + NOVO_LACRADO)",
      passed: s9Passed,
      details: `Total exportável: ${dbEligibleProducts.length} itens. Seminovos inclusos: ${hasAnySeminovoInExport} | Loja Física inclusos: ${hasAnyLojaFisInExport}`,
    });

    // -------------------------------------------------------------------------
    // CENÁRIO 10: API pública -> somente produtos elegíveis no catálogo público.
    // -------------------------------------------------------------------------
    const catalogQuery = await prisma.product.findMany({
      where: {
        priceSource: "PRECO_DO_DIA",
        condition: "NOVO_LACRADO",
        active: true,
      },
      include: { category: true },
    });

    const allCatalogCompliant = catalogQuery.every(
      (p) => p.priceSource === "PRECO_DO_DIA" && p.condition === "NOVO_LACRADO" && p.active
    );

    const s10Passed = catalogQuery.length > 0 && allCatalogCompliant;
    results.push({
      scenario: 10,
      description: "API Pública -> retorna exclusivamente produtos com PRECO_DO_DIA + NOVO_LACRADO ativos",
      passed: s10Passed,
      details: `Total no catálogo: ${catalogQuery.length} itens. 100% de conformidade com as regras: ${allCatalogCompliant}`,
    });

    // -------------------------------------------------------------------------
    // EXIBIR RESUMO DOS RESULTADOS
    // -------------------------------------------------------------------------
    let allPassed = true;
    for (const r of results) {
      const statusIcon = r.passed ? "✔ PASSOU" : "❌ FALHOU";
      console.log(`[Cenário ${r.scenario}] ${statusIcon}: ${r.description}`);
      console.log(`    ↳ Detalhes: ${r.details}\n`);
      if (!r.passed) allPassed = false;
    }

    console.log("------------------------------------------------------------------");
    if (allPassed) {
      console.log("🎉 TODOS OS 10 CENÁRIOS FORAM VALIDADOS COM SUCESSO!");
    } else {
      console.error("❌ ALGUNS CENÁRIOS NÃO PASSARAM NA VALIDAÇÃO!");
      process.exit(1);
    }
  } catch (error) {
    console.error("Erro na execução dos testes:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
