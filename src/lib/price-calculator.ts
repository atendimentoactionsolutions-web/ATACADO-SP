export interface PriceCalculationInput {
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
 * Central Price Calculator following iFindz business rules:
 *
 * 1. IF product is iPhone AND condition === "NOVO_LACRADO" AND priceSource === "PRECO_DO_DIA":
 *      margin = iphoneMargin (default R$ 200.00)
 * 2. In any other case (SEMINOVO, LOJA_FISICA, iPad, Mac, Watch, AirPods, etc.):
 *      margin = customMargin (default 0.00)
 * 3. Never compound margins:
 *      finalPrice = originalPrice + margin
 * 4. Apply optional rounding settings.
 */
export function calculateFinalPrice(
  input: PriceCalculationInput,
  settings: PriceCalculationSettings = {}
): PriceCalculationResult {
  const originalPrice = Number(input.originalPrice) || 0;
  const isIphone = isIphoneCategory(input.categorySlug, input.categoryName);
  const isNovoLacrado = input.condition === "NOVO_LACRADO";
  const isPrecoDoDia = input.priceSource === "PRECO_DO_DIA";

  const defaultIphoneMargin = settings.iphoneMargin !== undefined ? settings.iphoneMargin : 200.0;
  const roundingMode = settings.roundingMode || "EXACT";

  let margin = 0;
  let isIphoneEligibleForAutoMargin = false;

  if (isIphone && isNovoLacrado && isPrecoDoDia) {
    margin = defaultIphoneMargin;
    isIphoneEligibleForAutoMargin = true;
  } else {
    // Non-iPhone or SEMINOVO or LOJA_FISICA
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
