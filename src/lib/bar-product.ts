/** Detect gold/silver/platinum bar categories by name or slug. */
export function isBarCategory(
  nameOrSlug?: string | null,
  slug?: string | null
): boolean {
  const haystack = `${nameOrSlug || ""} ${slug || ""}`.toLowerCase();
  if (!haystack.trim()) return false;
  // Match "bar", "bars", "gold-bar", "silver-bars", "bullion bar", etc.
  return /\bbar\b|\bbars\b|bullion/.test(haystack);
}

/** Common bar weight presets (grams). */
export const BAR_WEIGHT_PRESETS = [1, 2, 5, 8, 10, 20, 31.1, 50, 100] as const;

/** Common bar shape options. */
export const BAR_SHAPE_OPTIONS = [
  "Rectangular Ingot",
  "Square Ingot",
  "Round",
  "Coin",
  "Custom",
] as const;

/**
 * Convert metal variant purity % (e.g. 99.9) to bullion fineness (e.g. 999).
 * Values already in fineness scale (>100) are returned as-is.
 */
export function purityToFineness(purity: number): number {
  if (!Number.isFinite(purity) || purity <= 0) return 999.9;
  if (purity > 100) return purity;
  // 99.9 → 999, 99.99 → 999.9
  const fineness = Math.round(purity * 10 * 10) / 10;
  return fineness;
}

export function formatBarWeightLabel(grams: number): string {
  if (!Number.isFinite(grams)) return "—";
  const rounded = Number(grams.toFixed(3));
  return `${rounded} g`;
}
