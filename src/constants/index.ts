export const APP_NAME = "Evaan Jewels";
export const APP_DESCRIPTION =
  "Premium Gold & Diamond Jewelry — Crafted with Precision, Worn with Pride";

export const DEFAULT_GST_PERCENTAGE = 3;
export const MAX_PRODUCT_IMAGES = 8;

export const GENDER_OPTIONS = [
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
  { value: "unisex", label: "Unisex" },
  { value: "kids", label: "Kids" },
] as const;

export const PAYMENT_MODES = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "upi", label: "UPI" },
  { value: "bank_transfer", label: "Bank Transfer" },
] as const;

export const METAL_UNITS = [
  { value: "gram", label: "Gram" },
  { value: "tola", label: "Tola" },
  { value: "ounce", label: "Ounce" },
] as const;

export const GEMSTONE_UNITS = [
  { value: "carat", label: "Carat" },
  { value: "ratti", label: "Ratti" },
  { value: "cent", label: "Cent" },
] as const;

export const CHARGE_TYPES = [
  { value: "fixed", label: "Fixed (₹)" },
  { value: "percentage", label: "Percentage (%)" },
  { value: "per_gram", label: "Per Gram (₹/g)" },
] as const;

export const ITEMS_PER_PAGE = 12;

export const STALE_PRICE_HOURS = 24;
