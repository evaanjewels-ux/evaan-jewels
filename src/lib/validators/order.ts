import { z } from "zod";

const shippingAddressSchema = z.object({
  fullName: z.string().min(2, "Name is required").max(100).trim(),
  phone: z
    .string()
    .min(10, "Valid phone number is required")
    .max(15)
    .trim(),
  email: z.string().email().optional().or(z.literal("")),
  addressLine1: z.string().min(5, "Address is required").max(200).trim(),
  addressLine2: z.string().max(200).optional().default(""),
  city: z.string().min(2, "City is required").max(100).trim(),
  state: z.string().min(2, "State is required").max(100).trim(),
  pincode: z
    .string()
    .min(6, "Valid pincode is required")
    .max(6, "Valid pincode is required")
    .trim(),
  landmark: z.string().max(200).optional().default(""),
});

const orderItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().min(1).default(1),
});

export const orderCreateSchema = z.object({
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
  shippingAddress: shippingAddressSchema,
  paymentMethod: z.enum(["upi", "bank_transfer", "cod"]),
  customerNotes: z.string().max(500).optional().default(""),
});

export const orderStatusUpdateSchema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ]),
  message: z.string().max(500).optional().default(""),
  trackingNumber: z.string().max(100).optional(),
  trackingUrl: z.string().url().optional().or(z.literal("")),
  cancelReason: z.string().max(500).optional(),
});

export const paymentStatusUpdateSchema = z.object({
  status: z.enum(["pending", "received", "verified", "failed", "refunded"]),
  transactionId: z.string().max(100).optional(),
  notes: z.string().max(500).optional().default(""),
});

export type OrderCreateInput = z.infer<typeof orderCreateSchema>;
export type OrderStatusUpdateInput = z.infer<typeof orderStatusUpdateSchema>;
export type PaymentStatusUpdateInput = z.infer<
  typeof paymentStatusUpdateSchema
>;
