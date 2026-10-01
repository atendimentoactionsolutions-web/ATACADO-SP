export interface PriceCalculationInput {
  name?: string;
  model?: string;
  categorySlug?: string;
  categoryName?: string;
  condition: "NOVO_LACRADO" | "SEMINOVO" | string;
  priceSource: "PRECO_DO_DIA" | "LOJA_FISICA" | string;
  originalPrice: number;
  customMargin?: number;
}

export interface PriceCalculationSettings {
  iphoneMargin?: number;
  roundingMode?: "EXACT" | "ROUND_UP_10" | "ROUND_90" | "ROUND_99";
}

export interface PriceCalculationResult {
  originalPrice: number;
  margin: number;
  finalPrice: number;
  isIphoneEligibleForAutoMargin: boolean;
  isEligibleForPublicCatalog: boolean;
}

/**
 * Checks whether a category represents an iPhone.
 */
export function isIphoneCategory(categorySlug?: string, categoryName?: string): boolean {
  if (categorySlug && categorySlug.toLowerCase() === "iphone") return true;
  if (categoryName && categoryName.trim().toLowerCase().startsWith("iphone")) return true;
  return false;
}

/**
 * Retorna a margem de lucro cadastrada de acordo com a tabela oficial:
 * • Linha iPhone 18:                   R$ 500
 * • Demais iPhones (Novos/Lacrados):   R$ 300
 * • MacBook Air:                       R$ 400
 * • MacBook Pro:                       R$ 600
 * • MacBook Pro MAX:                   R$ 800
 * • iPad:                              R$ 180
 * • Apple Watch (Relógios):            R$ 200
 * • iMac:                              R$ 600
 * • AirPods:                           R$ 180
 * • Acessórios Gerais:                 R$ 80
 * • Smart Keyboard / Smart Folio:      R$ 200
 * • Apple Pencil:                      R$ 130
 * • AirTag (Unidade):                  R$ 50
 * • AirTag (Pack com 4):               R$ 150
 * • Magic Keyboard:                    R$ 150
 * • Magic Mouse:                       R$ 180
 * • Apple TV:                          R$ 250
 */
export function getProductProfitMargin(input: {
  name?: string;
  model?: string;
  categorySlug?: string;
}): number {
  const nameUpper = (input.name || "").toUpperCase();
  const modelUpper = (input.model || "").toUpperCase();
  const fullText = `${nameUpper} ${modelUpper}`.trim();
  const cat = (input.categorySlug || "").toLowerCase();

  // 1. Linha iPhone 18 (R$ 500)
  if (cat === "iphone" || fullText.includes("IPHONE")) {
    if (fullText.includes("18") || fullText.includes("IPHONE 18")) {
      return 500;
    }
    // Demais iPhones (Novos/Lacrados): R$ 300
    return 300;
  }

  // 2. MacBook Pro MAX (R$ 800)
  if ((cat === "mac" || fullText.includes("MACBOOK")) && fullText.includes("MAX")) {
    return 800;
  }

  // 3. MacBook Pro (R$ 600)
  if (fullText.includes("MACBOOK PRO")) {
    return 600;
  }

  // 4. MacBook Air (e MacBook Neo) (R$ 400)
  if (
    fullText.includes("MACBOOK AIR") ||
    fullText.includes("MACBOOK NEO") ||
    (cat === "mac" && fullText.includes("AIR"))
  ) {
    return 400;
  }

  // 5. iMac (R$ 600)
  if (fullText.includes("IMAC")) {
    return 600;
  }

  // Mac Studio Max (R$ 800)
  if (fullText.includes("MAC STUDIO")) {
    return 800;
  }

  // Mac Mini (R$ 400)
  if (fullText.includes("MAC MINI")) {
    return 400;
  }

  // 6. iPad (R$ 180)
  if (cat === "ipad" || fullText.includes("IPAD")) {
    return 180;
  }

  // 7. Apple Watch / Relógios (R$ 200)
  if (cat === "apple-watch" || fullText.includes("WATCH")) {
    return 200;
  }

  // 8. AirPods (R$ 180)
  if (cat === "airpods" || fullText.includes("AIRPODS")) {
    return 180;
  }

  // 9. Apple TV (R$ 250)
  if (fullText.includes("APPLE TV") || fullText.includes("TV 4K")) {
    return 250;
  }

  // 10. Smart Keyboard / Smart Folio (R$ 200)
  if (
    fullText.includes("SMART KEYBOARD") ||
    fullText.includes("SMART FOLIO") ||
    fullText.includes("KEYBOARD FOLIO")
  ) {
    return 200;
  }

  // 11. Magic Mouse (R$ 180)
  if (fullText.includes("MAGIC MOUSE") || fullText.includes("MOUSE")) {
    return 180;
  }

  // 12. Magic Keyboard (R$ 150)
  if (fullText.includes("MAGIC KEYBOARD")) {
    return 150;
  }

  // Magic Trackpad (R$ 150)
  if (fullText.includes("TRACKPAD")) {
    return 150;
  }

  // 13. Apple Pencil (R$ 130)
  if (fullText.includes("PENCIL")) {
    return 130;
  }

  // 14. AirTag (Pack com 4) (R$ 150)
  if (
    fullText.includes("AIRTAG") &&
    (fullText.includes("4 PACK") ||
      fullText.includes("PACK 4") ||
      fullText.includes("4-PACK") ||
      fullText.includes("4UN") ||
      fullText.includes("4 UN"))
  ) {
    return 150;
  }

  // 15. AirTag (Unidade) (R$ 50)
  if (fullText.includes("AIRTAG")) {
    return 50;
  }

  // 16. Acessórios Gerais (R$ 80)
  if (cat === "acessorios") {
    return 80;
  }

  return 200;
}

/**
 * Checks if a product is eligible for publication in the public "Preço do Dia" catalog.
 * Strict rules:
 * - priceSource MUST be "PRECO_DO_DIA"
 * - condition MUST be "NOVO_LACRADO"
 * - active MUST be true (when checking active status)
 */
export function isEligibleForCatalog(product: {
  priceSource: string;
  condition: string;
  active?: boolean;
}): boolean {
  const isSourceOk = product.priceSource === "PRECO_DO_DIA";
  const isConditionOk = product.condition === "NOVO_LACRADO";
  const isActiveOk = product.active !== undefined ? product.active : true;
  return isSourceOk && isConditionOk && isActiveOk;
}

/**
 * Applies configured rounding rule to a price.
 */
export function applyRounding(value: number, mode: string = "EXACT"): number {
  if (!value || isNaN(value)) return 0;

  switch (mode) {
    case "ROUND_UP_10":
      return Math.ceil(value / 10) * 10;
    case "ROUND_90": {
      const tens = Math.floor(value / 100) * 100;
      return tens + 90 >= value ? tens + 90 : tens + 190;
    }
    case "ROUND_99": {
      const hundreds = Math.floor(value / 100) * 100;
      return hundreds + 99 >= value ? hundreds + 99 : hundreds + 199;
    }
    case "EXACT":
    default:
      return Math.round(value * 100) / 100;
  }
}

/**
 * Central Price Calculator following ATACADO SP official margin rules.
 */
export function calculateFinalPrice(
  input: PriceCalculationInput,
  settings: PriceCalculationSettings = {}
): PriceCalculationResult {
  const originalPrice = Number(input.originalPrice) || 0;
  const isIphone = isIphoneCategory(input.categorySlug, input.categoryName);
  const isNovoLacrado = input.condition === "NOVO_LACRADO";
  const isPrecoDoDia = input.priceSource === "PRECO_DO_DIA";
  const roundingMode = settings.roundingMode || "EXACT";

  let margin = 0;
  let isIphoneEligibleForAutoMargin = false;

  if (isNovoLacrado && isPrecoDoDia) {
    if (input.customMargin !== undefined && input.customMargin !== null && input.customMargin > 0) {
      margin = Number(input.customMargin);
    } else {
      margin = getProductProfitMargin({
        name: input.name,
        model: input.model,
        categorySlug: input.categorySlug,
      });
    }
    if (isIphone) {
      isIphoneEligibleForAutoMargin = true;
    }
  } else {
    // SEMINOVO or LOJA_FISICA
    margin = Number(input.customMargin) || 0;
  }

  // Formula is strictly: originalPrice + margin (never compounded)
  const rawFinalPrice = Math.max(0, originalPrice + margin);
  const finalPrice = applyRounding(rawFinalPrice, roundingMode);

  const isEligibleForPublicCatalog = isEligibleForCatalog({
    priceSource: input.priceSource,
    condition: input.condition,
    active: true,
  });

  return {
    originalPrice,
    margin,
    finalPrice,
    isIphoneEligibleForAutoMargin,
    isEligibleForPublicCatalog,
  };
}

/**
 * Format currency in Brazilian Real (BRL).
 */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}
