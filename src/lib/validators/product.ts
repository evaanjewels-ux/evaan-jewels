import { z } from "zod";

const perItemWastageSchema = z
  .object({
    type: z.enum(["fixed", "percentage"]),
    value: z.number().min(0),
  })
  .optional()
  .default({ type: "percentage", value: 0 });

const metalCompositionSchema = z.object({
  metal: z.string().min(1, "Metal ID is required"),
  variantId: z.string().min(1, "Variant ID is required"),
  variantName: z.string().min(1),
  weightInGrams: z.number().min(0, "Weight must be non-negative"),
  pricePerGram: z.number().min(0).optional().default(0),
  subtotal: z.number().optional().default(0),
  /** Per-metal wastage charges */
  wastageCharges: perItemWastageSchema,
});

const gemstoneCompositionSchema = z.object({
  gemstone: z.string().min(1, "Gemstone ID is required"),
  variantId: z.string().min(1, "Variant ID is required"),
  variantName: z.string().min(1),
  weightInCarats: z.number().min(0, "Weight must be non-negative"),
  quantity: z.number().int().min(1).default(1),
  pricePerCarat: z.number().min(0).optional().default(0),
  subtotal: z.number().optional().default(0),
  /** Per-gemstone wastage charges */
  wastageCharges: perItemWastageSchema,
});

const chargesSchema = z.object({
  type: z.enum(["fixed", "percentage"]),
  value: z.number().min(0),
});

const otherChargeSchema = z.object({
  name: z.string().min(1),
  amount: z.number().min(0),
});

// ─── Shared loose image schema (no URL validation — we trust stored R2 URLs) ──
const looseImageArraySchema = z.array(z.string().min(1)).max(8).optional();

const colorImageSchema = z.object({
  color: z.string().min(1),
  images: z.array(z.string()).default([]),
});

export const productCreateSchema = z.object({
  name: z.string().min(1, "Product name is required").max(200).trim(),
  productCode: z.string().min(1).optional(),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  gender: z.enum(["men", "women", "unisex", "kids"]).default("unisex"),

  metalComposition: z.array(metalCompositionSchema).optional().default([]),
  gemstoneComposition: z
    .array(gemstoneCompositionSchema)
    .optional()
    .default([]),

  makingCharges: chargesSchema.optional().default({ type: "fixed", value: 0 }),
  wastageCharges: chargesSchema
    .optional()
    .default({ type: "fixed", value: 0 }),
  gstPercentage: z.number().min(0).max(100).default(3),
  otherCharges: z.array(otherChargeSchema).optional().default([]),

  images: z.array(z.string().url()).min(1, "At least one product image is required").max(8),
  thumbnailImage: z.string().optional().default(""),

  colorImages: z.array(colorImageSchema).optional().default([]),

  isNewArrival: z.boolean().optional().default(false),
  isOutOfStock: z.boolean().optional().default(false),
  isFeatured: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),

  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),

  grossWeight: z.number().min(0).optional().default(0),
  netWeight: z.number().min(0).optional().default(0),
  size: z.string().optional(),
  sizes: z.array(z.string()).optional().default([]),
  colors: z.array(z.string()).optional().default([]),

  // Calculated price fields (recalculated server-side; passed through here so Zod doesn't strip them)
  metalTotal: z.number().min(0).optional().default(0),
  gemstoneTotal: z.number().min(0).optional().default(0),
  makingChargeAmount: z.number().min(0).optional().default(0),
  wastageChargeAmount: z.number().min(0).optional().default(0),
  otherChargesTotal: z.number().min(0).optional().default(0),
  subtotal: z.number().min(0).optional().default(0),
  gstAmount: z.number().min(0).optional().default(0),
  totalPrice: z.number().min(0).optional().default(0),
  lastPriceSync: z.date().optional(),
});

// For updates we relax image URL validation because stored R2 links may not
// pass the strict `z.string().url()` check (e.g. if R2_PUBLIC_URL was
// misconfigured when the image was uploaded).
export const productUpdateSchema = productCreateSchema
  .partial()
  .extend({ images: looseImageArraySchema });

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
