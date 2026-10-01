import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed do banco de dados iFindz...");

  // 1. Limpar dados anteriores de forma ordenada
  await prisma.priceHistory.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.product.deleteMany();
  await prisma.subcategory.deleteMany();
  await prisma.category.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.user.deleteMany();

  // 2. Criar Usuários Administradores
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.create({
    data: {
      name: "Administrador ATACADO SP",
      email: "admin@atacadosp.com.br",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      active: true,
    },
  });
  console.log("✓ Administrador criado:", admin.email);

  const jaciaraPasswordHash = await bcrypt.hash("jaciara", 10);
  const jaciara = await prisma.user.create({
    data: {
      name: "jaciara",
      email: "jaciara@atacadosp.com.br",
      passwordHash: jaciaraPasswordHash,
      role: "ADMIN",
      active: true,
    },
  });
  console.log("✓ Usuário criado:", jaciara.name);

  // 3. Configurações Globais
  const defaultSettings = [
    { key: "iphone_margin", value: "200", description: "Margem automática para iPhones Novos no Preço do Dia (R$)" },
    { key: "rounding_mode", value: "EXACT", description: "Modo de arredondamento de preços: EXACT, ROUND_UP_10, ROUND_90, ROUND_99" },
    { key: "store_name", value: "iFindz", description: "Nome comercial da loja" },
    { key: "whatsapp_number", value: "5511999999999", description: "WhatsApp oficial para pedidos" },
    { key: "catalog_notice", value: "Preços atualizados diariamente. Produtos 100% originais Apple lacrados com 1 ano de garantia.", description: "Aviso de rodapé do catálogo" },
  ];

  for (const s of defaultSettings) {
    await prisma.setting.create({ data: s });
  }
  console.log("✓ Configurações padrão salvas.");

  // 4. Categorias e Subcategorias Apple
  const catData = [
    {
      name: "iPhone",
      slug: "iphone",
      icon: "Smartphone",
      order: 1,
      subcategories: [
        "iPhone 18 Pro Max",
        "iPhone 18 Pro",
        "iPhone 18",
        "iPhone 17 Pro Max",
        "iPhone 17 Pro",
        "iPhone 17 Air",
        "iPhone 17",
        "iPhone 16 Pro Max",
        "iPhone 16 Pro",
        "iPhone 16",
        "Outros modelos",
      ],
    },
    {
      name: "iPad",
      slug: "ipad",
      icon: "Tablet",
      order: 2,
      subcategories: ["iPad Pro", "iPad Air", "iPad 11", "iPad Mini", "Outros modelos"],
    },
    {
      name: "Mac",
      slug: "mac",
      icon: "Laptop",
      order: 3,
      subcategories: ["MacBook Air", "MacBook Pro", "iMac", "Mac Mini", "Mac Studio", "Outros"],
    },
    {
      name: "Apple Watch",
      slug: "apple-watch",
      icon: "Watch",
      order: 4,
      subcategories: ["Apple Watch Ultra", "Apple Watch Series", "Apple Watch SE"],
    },
    {
      name: "AirPods",
      slug: "airpods",
      icon: "Headphones",
      order: 5,
      subcategories: ["AirPods Pro", "AirPods 4", "AirPods Max", "Outros"],
    },
    {
      name: "Acessórios",
      slug: "acessorios",
      icon: "Cable",
      order: 6,
      subcategories: ["Cabos", "Carregadores", "Capas", "MagSafe", "Outros acessórios Apple"],
    },
  ];

  const createdCategories: Record<string, { id: string; subcats: Record<string, string> }> = {};

  for (const c of catData) {
    const createdCat = await prisma.category.create({
      data: {
        name: c.name,
        slug: c.slug,
        icon: c.icon,
        order: c.order,
        active: true,
      },
    });

    createdCategories[c.slug] = { id: createdCat.id, subcats: {} };

    for (let i = 0; i < c.subcategories.length; i++) {
      const subName = c.subcategories[i];
      const subSlug = subName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const sub = await prisma.subcategory.create({
        data: {
          categoryId: createdCat.id,
          name: subName,
          slug: subSlug,
          order: i + 1,
          active: true,
        },
      });
      createdCategories[c.slug].subcats[subName] = sub.id;
    }
  }
  console.log("✓ Categorias e subcategorias criadas.");

  // 5. Sincronizar catálogo oficial ao vivo com Mundo Apple
  console.log("Iniciando sincronização ao vivo com Mundo Apple...");
  try {
    const { syncMundoAppleLive } = await import("../src/lib/mundo-apple-sync");
    const syncRes = await syncMundoAppleLive("Seed Inicial Mundo Apple");
    console.log(`✓ Sincronização concluída com sucesso! ${syncRes.totalRawProducts} produtos sincronizados.`);
  } catch (err) {
    console.error("Aviso: Sincronização ao vivo no seed falhou:", err);
  }

  console.log("Seed concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error("Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
