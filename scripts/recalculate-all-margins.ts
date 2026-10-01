import { PrismaClient } from "@prisma/client";
import { getProductProfitMargin, calculateFinalPrice } from "../src/lib/price-calculator";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando recalculo de margens com base na nova tabela oficial...");
  const products = await prisma.product.findMany({
    include: { category: true },
  });

  console.log(`Total de produtos a recalcular: ${products.length}`);
  let updated = 0;

  for (const p of products) {
    const margin = getProductProfitMargin({
      name: p.name,
      model: p.model,
      categorySlug: p.category?.slug,
    });

    const finalPrice = Math.round((p.originalPrice + margin) * 100) / 100;

    await prisma.product.update({
      where: { id: p.id },
      data: {
        margin,
        finalPrice,
      },
    });
    updated++;
  }

  console.log(`✓ ${updated} produtos atualizados com sucesso com as novas margens!`);
}

main()
  .catch((e) => {
    console.error("Erro no recálculo:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
