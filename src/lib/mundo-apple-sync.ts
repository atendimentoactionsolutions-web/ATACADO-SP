import prisma from "./prisma";
import { calculateFinalPrice } from "./price-calculator";
import { recordPriceHistory, logAudit } from "./audit";

const MUNDO_APPLE_URL = "https://mundo-apple-buscador.onrender.com";
const USERNAME = "admin";
const PASSWORD = "fornecedor2026!";

export interface SyncMundoAppleResult {
  success: boolean;
  totalRawProducts: number;
  uniqueAppleModels: number;
  createdCount: number;
  updatedCount: number;
  unchangedCount: number;
  date: string;
  source: string;
  dollarRate?: number;
  dollarVariation?: number;
}

/**
 * Conecta exclusivamente ao site Mundo Apple Buscador (https://mundo-apple-buscador.onrender.com)
 * com as credenciais fornecidas pelo usuário:
 * USUARIO: admin
 * SENHA: fornecedor2026!
 *
 * Puxa todos os preços do dia oficiais, aplica a regra de +R$ 200 em iPhones Novos/Lacrados
 * e sincroniza no Preço do Dia!
 */
export async function syncMundoAppleLive(userResponsible = "Sincronização Mundo Apple"): Promise<SyncMundoAppleResult> {
  // 1. Autenticar no site Mundo Apple
  const loginRes = await fetch(`${MUNDO_APPLE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: USERNAME,
      password: PASSWORD,
    }),
  });

  if (!loginRes.ok) {
    throw new Error(`Falha ao autenticar no Mundo Apple Buscador (HTTP ${loginRes.status})`);
  }

  const cookieHeader = loginRes.headers.get("set-cookie");
  const cookie = cookieHeader ? cookieHeader.split(";")[0] : "";
  const loginData = await loginRes.json();

  if (!loginData.success) {
    throw new Error(loginData.error || "Erro de login no Mundo Apple Buscador");
  }

  // 2. Puxar produtos do dia ao vivo
  const productsRes = await fetch(`${MUNDO_APPLE_URL}/api/products`, {
    headers: {
      Cookie: cookie,
    },
  });

  if (!productsRes.ok) {
    throw new Error(`Falha ao obter produtos do Mundo Apple (HTTP ${productsRes.status})`);
  }

  const catalogPayload = await productsRes.json();
  const rawList: any[] = Array.isArray(catalogPayload.data)
    ? catalogPayload.data
    : Array.isArray(catalogPayload)
    ? catalogPayload
    : [];

  if (rawList.length === 0) {
    throw new Error("Nenhum produto retornado pelo Mundo Apple Buscador.");
  }

  const latestDate = catalogPayload.latestDate || "Hoje";
  const dollarRate = catalogPayload.dollarRate;
  const dollarVariation = catalogPayload.dollarVariation;

  // 3. Carregar categorias existentes no iFindz
  const categories = await prisma.category.findMany();
  const getCatId = (slug: string) => categories.find((c) => c.slug === slug)?.id || categories[0]?.id;

  const marginSetting = await prisma.setting.findUnique({ where: { key: "iphone_margin" } });
  const roundingSetting = await prisma.setting.findUnique({ where: { key: "rounding_mode" } });
  const iphoneMargin = marginSetting ? parseFloat(marginSetting.value) : 200;
  const roundingMode = (roundingSetting?.value as any) || "EXACT";

  // 4. Filtrar produtos Apple e selecionar o MENOR PREÇO para cada modelo
  const grouped = new Map<string, any>();

  for (const p of rawList) {
    if (!p.name || !p.price || p.price <= 0) continue;
    const name = String(p.name).toUpperCase().trim();

    // Filtros de exclusão (apenas produtos genuínos Apple)
    if (
      name.includes("AS IS") ||
      name.includes("ASIS") ||
      name.includes("SAMSUNG") ||
      name.includes("XIAOMI") ||
      name.includes("MOTOROLA") ||
      name.includes("REALME") ||
      name.includes("POCO") ||
      name.includes("REDMI")
    ) {
      continue;
    }

    const isIphone = name.includes("IPHONE") || name.includes("IPH ") || p.category === "IPH";
    const isIpad = name.includes("IPAD") || p.category === "IPAD" || p.category === "IPD";
    const isMac = name.includes("MACBOOK") || name.includes("IMAC") || name.includes("MAC MINI") || p.category === "MCB";
    const isWatch = name.includes("WATCH") || p.category === "RLG";
    const isAirpods = name.includes("AIRPOD") || p.category === "PODS";
    const isAcessorio = p.category === "ACSS" || name.includes("CABO") || name.includes("CARREGADOR") || name.includes("MAGSAFE");

    if (!isIphone && !isIpad && !isMac && !isWatch && !isAirpods && !isAcessorio) {
      continue;
    }

    const isSemi = p.category === "SEMI" || name.includes("SEMI") || name.includes("USADO") || name.includes("VITRINE");
    const condition = isSemi ? "SEMINOVO" : "NOVO_LACRADO";
    const storage = (p.storage || "").trim();
    const color = (p.color || "").trim();
    const cleanName = p.name.trim();

    // RAM existe EXCLUSIVAMENTE para Mac/MacBooks. NUNCA extrair RAM para iPhones!
    let ram = "";
    if (isMac) {
      ram = (p.region || p.ram || "").trim().toUpperCase();
      if (!ram || !ram.includes("GB")) {
        const match = cleanName.match(/\b(8GB|16GB|18GB|24GB|32GB|36GB|48GB|64GB|96GB|128GB)\b/i);
        if (match && match[1].toUpperCase() !== storage.toUpperCase()) {
          ram = match[1].toUpperCase();
        } else {
          ram = "";
        }
      }
    }

    const key = `${cleanName.toLowerCase()}__${storage.toLowerCase()}__${ram.toLowerCase()}__${color.toLowerCase()}__${condition}`;

    let categorySlug = "outros";
    if (isIphone) categorySlug = "iphone";
    else if (isIpad) categorySlug = "ipad";
    else if (isMac) categorySlug = "mac";
    else if (isWatch) categorySlug = "apple-watch";
    else if (isAirpods) categorySlug = "airpods";
    else if (isAcessorio) categorySlug = "acessorios";

    if (!grouped.has(key)) {
      grouped.set(key, {
        name: cleanName,
        model: cleanName,
        storage: storage || null,
        ram: ram || null,
        color: color || null,
        condition,
        categorySlug,
        lowestPrice: p.price,
        supplierName: p.supplier?.name || "Mundo Apple",
        offersCount: 1,
      });
    } else {
      const existing = grouped.get(key)!;
      existing.offersCount++;
      if (p.price < existing.lowestPrice) {
        existing.lowestPrice = p.price;
        existing.supplierName = p.supplier?.name || "Mundo Apple";
      }
    }
  }

  let createdCount = 0;
  let updatedCount = 0;
  let unchangedCount = 0;

  // 5. Inserir ou atualizar na base iFindz como PRECO_DO_DIA
  for (const item of Array.from(grouped.values())) {
    const categoryId = getCatId(item.categorySlug);

    // Aplica regra de preço: +R$ 200 em iPhones novos no Preço do Dia
    const calc = calculateFinalPrice(
      {
        categorySlug: item.categorySlug,
        condition: item.condition,
        priceSource: "PRECO_DO_DIA",
        originalPrice: item.lowestPrice,
        customMargin: 0,
      },
      { iphoneMargin, roundingMode }
    );

    const existing = await prisma.product.findFirst({
      where: {
        priceSource: "PRECO_DO_DIA",
        condition: item.condition,
        name: item.name,
        storage: item.storage,
        ram: item.ram,
        color: item.color,
      },
    });

    if (existing) {
      const priceChanged = existing.originalPrice !== calc.originalPrice;

      if (priceChanged || !existing.ram && item.ram) {
        await prisma.product.update({
          where: { id: existing.id },
          data: {
            ram: item.ram || existing.ram,
            originalPrice: calc.originalPrice,
            margin: calc.margin,
            finalPrice: calc.finalPrice,
            active: true,
          },
        });

        await recordPriceHistory({
          productId: existing.id,
          oldPrice: existing.originalPrice,
          newPrice: calc.originalPrice,
          margin: calc.margin,
          finalPrice: calc.finalPrice,
          userResponsible,
          reason: `Mundo Apple Buscador (${item.supplierName})`,
        });

        updatedCount++;
      } else {
        unchangedCount++;
      }
    } else {
      const created = await prisma.product.create({
        data: {
          name: item.name,
          categoryId,
          model: item.model,
          storage: item.storage,
          ram: item.ram,
          color: item.color,
          condition: item.condition,
          priceSource: "PRECO_DO_DIA",
          originalPrice: calc.originalPrice,
          margin: calc.margin,
          finalPrice: calc.finalPrice,
          active: true,
        },
      });

      await recordPriceHistory({
        productId: created.id,
        oldPrice: calc.originalPrice,
        newPrice: calc.originalPrice,
        margin: calc.margin,
        finalPrice: calc.finalPrice,
        userResponsible,
        reason: `Mundo Apple Buscador (${item.supplierName})`,
      });

      createdCount++;
    }
  }

  await logAudit({
    userName: userResponsible,
    action: "SYNC_MUNDO_APPLE",
    entity: "PRODUCT",
    details: {
      totalRawProducts: rawList.length,
      uniqueAppleModels: grouped.size,
      createdCount,
      updatedCount,
      unchangedCount,
      date: latestDate,
    },
  });

  return {
    success: true,
    totalRawProducts: rawList.length,
    uniqueAppleModels: grouped.size,
    createdCount,
    updatedCount,
    unchangedCount,
    date: latestDate,
    source: "https://mundo-apple-buscador.onrender.com",
    dollarRate,
    dollarVariation,
  };
}
