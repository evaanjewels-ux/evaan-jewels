import { z } from "zod";

const shippingAddressSchema = z.object({
  fullName: z.string().min(2, "Name is required").max(100).trim(),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number")
    .trim(),
  email: z.string().email("Email is required for order receipts").trim(),
  addressLine1: z.string().min(5, "Address is required").max(200).trim(),
  addressLine2: z.string().max(200).optional().default(""),
  city: z.string().min(2, "City is required").max(100).trim(),
  state: z.string().min(2, "State is required").max(100).trim(),
  pincode: z
    .string()
    .regex(/^\d{6}$/, "Valid 6-digit pincode is required")
    .trim(),
  landmark: z.string().max(200).optional().default(""),
});

const orderItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().min(1).max(20).default(1),
  // customPrice intentionally omitted — server always recomputes price
  selectedSize: z.string().max(50).optional(),
  selectedColor: z.string().max(50).optional(),
  selectedMetalVariants: z
    .array(
      z.object({
        metalId: z.string(),
        metalName: z.string().optional(),
        variantId: z.string(),
        variantName: z.string().optional(),
        pricePerGram: z.number().optional(), // ignored server-side
        weightInGrams: z.number().positive(),
      })
    )
    .optional(),
  selectedGemstone: z
    .object({
      gemstoneId: z.string(),
      gemstoneName: z.string().optional(),
      variantId: z.string(),
      variantName: z.string().optional(),
      weightInCarats: z.number().positive(),
      quantity: z.number().int().positive(),
      pricePerCarat: z.number().optional(), // ignored server-side
    })
    .optional(),
});

export const orderCreateSchema = z.object({
  items: z.array(orderItemSchema).min(1, "At least one item is required").max(50),
  shippingAddress: shippingAddressSchema,
  paymentMethod: z.enum(["razorpay", "bank_transfer"]),
  customerNotes: z.string().max(500).optional().default(""),
  /** UTR / reference for bank transfer (optional at place-order) */
  transactionId: z.string().max(100).optional().default(""),
  paymentNotes: z.string().max(500).optional().default(""),
});

export const paymentProofSchema = z.object({
  orderNumber: z.string().min(5).max(30).trim(),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number")
    .trim(),
  transactionId: z.string().max(100).optional().default(""),
  paymentNotes: z.string().max(500).optional().default(""),
});

export const orderStatusUpdateSchema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "processing",
    "cad_3d_print",
    "wax_treeing",
    "lost_wax_casting",
    "filing_cleanup",
    "setting",
    "polishing_finish",
    "shipped",
    "delivered",
    "cancelled",
  ]),
  message: z.string().max(500).optional().default(""),
  trackingNumber: z.string().max(100).optional(),
  trackingUrl: z.string().url().optional().or(z.literal("")),
  cancelReason: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
});

export const paymentStatusUpdateSchema = z.object({
  status: z.enum(["pending", "received", "verified", "failed", "refunded"]),
  transactionId: z.string().max(100).optional(),
  notes: z.string().max(500).optional().default(""),
});

export const razorpayVerifySchema = z.object({
  orderId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export type OrderCreateInput = z.infer<typeof orderCreateSchema>;
export type OrderStatusUpdateInput = z.infer<typeof orderStatusUpdateSchema>;
export type PaymentStatusUpdateInput = z.infer<
  typeof paymentStatusUpdateSchema
>;
export type RazorpayVerifyInput = z.infer<typeof razorpayVerifySchema>;
export type PaymentProofInput = z.infer<typeof paymentProofSchema>;
