import { IMetalComposition, IGemstoneComposition, ICharges, IOtherCharge } from "@/types";

interface PriceCalculationInput {
  metalComposition: IMetalComposition[];
  gemstoneComposition: IGemstoneComposition[];
  makingCharges: ICharges;
  /**
   * @deprecated Use per-composition `wastageCharges` instead.
   * Kept for backward-compatibility — used only when no composition has wastageCharges set.
   */
  wastageCharges?: ICharges;
  gstPercentage: number;
  otherCharges: IOtherCharge[];
  /**
   * When set, making charges & per-metal wastage use this variant's price-per-gram
   * as the base instead of each composition row's own pricePerGram.
   * Common in the jewelry industry where 18K items' charges are calculated at 24K rates.
   */
  chargeBasedOnVariant?: {
    metalId: string;
    variantId: string;
    variantName: string;
    pricePerGram?: number;
  };
}

interface PriceCalculationResult {
  metalTotal: number;
  gemstoneTotal: number;
  makingChargeAmount: number;
  wastageChargeAmount: number;
  otherChargesTotal: number;
  subtotal: number;
  gstAmount: number;
  totalPrice: number;
}

/**
 * Calculate all product prices from composition and charges.
 * Wastage is now applied per-component (each metal/gemstone row carries its own
 * wastageCharges applied against that component's subtotal).
 * Falls back to the legacy global `wastageCharges` × metalTotal when no
 * per-component charges are present (backward compat).
 *
 * When `chargeBasedOnVariant` is set, making charges and per-metal wastage use
 * a single variant's pricePerGram as the base. This models the common jewelry
 * industry practice of charging making/wastage at 24K rate even for 18K products.
 */
export function calculateProductPrice(
  input: PriceCalculationInput
): PriceCalculationResult {
  // Determine the "charge base" price-per-gram override (if any).
  // When chargeBasedOnVariant is set, we look up that variant's pricePerGram
  // from the composition; if the variant itself is not in the composition we fall
  // back to chargeBasedOnVariant.pricePerGram passed in by the caller.
  let chargePricePerGram: number | undefined;
  if (input.chargeBasedOnVariant) {
    // Match by variantId first, fall back to variantName if IDs are stale
    const match = input.metalComposition.find(
      (c) =>
        String(c.variantId) === String(input.chargeBasedOnVariant!.variantId) ||
        (c.variantName && c.variantName === input.chargeBasedOnVariant!.variantName)
    );
    chargePricePerGram =
      match?.pricePerGram ?? input.chargeBasedOnVariant.pricePerGram;
  }

  // 1. Calculate metal total & per-metal wastage
  let metalWastageTotal = 0;
  let chargeBaseMetalTotal = 0; // metalTotal re-computed at the charge variant rate
  let totalMetalWeight = 0; // total metal weight in grams (for per_gram charges)
  const metalTotal = input.metalComposition.reduce((sum, comp) => {
    const subtotal = comp.weightInGrams * comp.pricePerGram;
    totalMetalWeight += comp.weightInGrams;

    // For wastage, use charge-variant price if set, else real price
    const wastageBase =
      chargePricePerGram !== undefined
        ? comp.weightInGrams * chargePricePerGram
        : subtotal;
    metalWastageTotal += resolveCharge(comp.wastageCharges, wastageBase, comp.weightInGrams);

    // Track the charge-variant metal total for making charge calculation
    chargeBaseMetalTotal +=
      chargePricePerGram !== undefined
        ? comp.weightInGrams * chargePricePerGram
        : subtotal;

    return sum + subtotal;
  }, 0);

  // 2. Calculate gemstone total & per-gemstone wastage
  let gemstoneWastageTotal = 0;
  const gemstoneTotal = input.gemstoneComposition.reduce((sum, comp) => {
    const subtotal = comp.weightInCarats * comp.quantity * comp.pricePerCarat;
    gemstoneWastageTotal += resolveCharge(comp.wastageCharges, subtotal, comp.weightInCarats * comp.quantity);
    return sum + subtotal;
  }, 0);

  // 3. Making charges — based on charge-variant metal total
  const makingChargeAmount = resolveCharge(
    input.makingCharges,
    chargeBaseMetalTotal,
    totalMetalWeight
  );

  // 4. Wastage — per-component if present, otherwise fall back to legacy global
  const hasPerComponentWastage =
    input.metalComposition.some((c) => c.wastageCharges && c.wastageCharges.value > 0) ||
    input.gemstoneComposition.some((c) => c.wastageCharges && c.wastageCharges.value > 0);

  const wastageChargeAmount = hasPerComponentWastage
    ? metalWastageTotal + gemstoneWastageTotal
    : resolveCharge(input.wastageCharges, chargeBaseMetalTotal, totalMetalWeight);

  // 5. Other charges total
  const otherChargesTotal = input.otherCharges.reduce(
    (sum, charge) => sum + charge.amount,
    0
  );

  // 6. Subtotal (before GST)
  const subtotal =
    metalTotal +
    gemstoneTotal +
    makingChargeAmount +
    wastageChargeAmount +
    otherChargesTotal;

  // 7. GST
  const gstAmount = subtotal * (input.gstPercentage / 100);

  // 8. Total price
  const totalPrice = subtotal + gstAmount;

  return {
    metalTotal: round(metalTotal),
    gemstoneTotal: round(gemstoneTotal),
    makingChargeAmount: round(makingChargeAmount),
    wastageChargeAmount: round(wastageChargeAmount),
    otherChargesTotal: round(otherChargesTotal),
    subtotal: round(subtotal),
    gstAmount: round(gstAmount),
    totalPrice: roundToTen(totalPrice),
  };
}

/**
 * Resolve a charge (fixed, percentage, or per_gram) against a base amount.
 * Returns 0 when charges are undefined or value is 0.
 * @param weightInUnits - weight in grams (metals) or carats (gemstones), used for per_gram type
 */
function resolveCharge(
  charges: ICharges | undefined | null,
  baseAmount: number,
  weightInUnits?: number
): number {
  if (!charges || charges.value === 0) return 0;
  if (charges.type === "percentage") {
    return baseAmount * (charges.value / 100);
  }
  if (charges.type === "per_gram") {
    return charges.value * (weightInUnits ?? 0);
  }
  return charges.value;
}

/**
 * Round to 2 decimal places
 */
function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Round DOWN (floor) to the nearest 10 — used for the final displayed price.
 * e.g. 63,887.3 → 63,880
 */
function roundToTen(value: number): number {
  return Math.floor(value / 10) * 10;
}

/**
 * Calculate individual metal composition subtotals
 */
export function calculateMetalSubtotals(
  composition: IMetalComposition[]
): IMetalComposition[] {
  return composition.map((comp) => ({
    ...comp,
    subtotal: round(comp.weightInGrams * comp.pricePerGram),
  }));
}

/**
 * Calculate individual gemstone composition subtotals
 */
export function calculateGemstoneSubtotals(
  composition: IGemstoneComposition[]
): IGemstoneComposition[] {
  return composition.map((comp) => ({
    ...comp,
    subtotal: round(comp.weightInCarats * comp.quantity * comp.pricePerCarat),
  }));
}
