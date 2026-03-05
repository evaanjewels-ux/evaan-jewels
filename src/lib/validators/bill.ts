import { z } from "zod";

const customerSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional().default(""),
});

const discountSchema = z.object({
  type: z.enum(["fixed", "percentage"]),
  value: z.number().min(0),
  amount: z.number().min(0),
});

// Schema for a single item in a multi-item bill
const billItemSchema = z.object({
  product: z.string().min(1, "Product ID required"),
  quantity: z.number().int().min(1).default(1),
  selectedSize: z.string().optional(),
  selectedColor: z.string().optional(),
});

export const billCreateSchema = z
  .object({
    // Single product (legacy / backward-compat)
    product: z.string().optional(),
    // Multiple items (new multi-product flow)
    items: z.array(billItemSchema).optional(),
    customer: customerSchema,
    // Link to existing customer record
    customerRef: z.string().optional(),
    discount: discountSchema.optional(),
    finalAmount: z.number().min(0),
    amountPaid: z.number().min(0).default(0),
    paymentMode: z.enum(["cash", "card", "upi", "bank_transfer"]).default("cash"),
    notes: z.string().optional().default(""),
  })
  .refine((d) => d.product || (d.items && d.items.length > 0), {
    message: "Either product or at least one item is required",
  })
  .refine((d) => d.amountPaid <= d.finalAmount, {
    message: "Amount paid cannot exceed the final amount",
  });

export type BillCreateInput = z.infer<typeof billCreateSchema>;
export type BillItemInput = z.infer<typeof billItemSchema>;
