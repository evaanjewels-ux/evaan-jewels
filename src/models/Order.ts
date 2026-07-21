import mongoose, { Schema, Model } from "mongoose";

// ─── Order Status Flow ───────────────────────────────
// pending → confirmed → processing → CAD → wax → casting → filing → setting → polishing → shipped → delivered
// → cancelled (at any stage before delivered)

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
  productSnapshot: {
    name: string;
    productCode: string;
    slug: string;
    thumbnailImage: string;
    totalPrice: number;
    metalComposition?: { variantName: string; weightInGrams: number }[];
    category?: string;
    selectedSize?: string;
    selectedColor?: string;
    selectedMetalVariants?: {
      metalId: string;
      metalName: string;
      variantId: string;
      variantName: string;
      pricePerGram: number;
      weightInGrams: number;
    }[];
    selectedGemstone?: {
      gemstoneId: string;
      gemstoneName: string;
      variantId: string;
      variantName: string;
      weightInCarats: number;
      quantity: number;
      pricePerCarat: number;
    };
  };
  price: number;
  total: number;
}

export interface IShippingAddress {
  fullName: string;
  phone: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export interface IPaymentInfo {
  method: "razorpay" | "cod" | "upi" | "bank_transfer";
  transactionId?: string;
  status: "pending" | "received" | "verified" | "failed" | "refunded";
  paidAt?: Date;
  amount: number;
  notes?: string;
  proofUrl?: string;
  proofUploadedAt?: Date;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
}

export interface IOrderTimeline {
  status: string;
  message: string;
  timestamp: Date;
  updatedBy?: mongoose.Types.ObjectId;
}

export interface IOrder {
  _id: mongoose.Types.ObjectId;
  orderNumber: string;
  user?: mongoose.Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  payment: IPaymentInfo;
  subtotal: number;
  shippingCharge: number;
  discount: number;
  totalAmount: number;
  status:
    | "pending"
    | "confirmed"
    | "processing"
    | "cad_3d_print"
    | "wax_treeing"
    | "lost_wax_casting"
    | "filing_cleanup"
    | "setting"
    | "polishing_finish"
    | "shipped"
    | "delivered"
    | "cancelled";
  cancelReason?: string;
  timeline: IOrderTimeline[];
  trackingNumber?: string;
  trackingUrl?: string;
  notes?: string;
  customerNotes?: string;
  emailsSent?: {
    placed?: boolean;
    paymentConfirmed?: boolean;
    paymentFailed?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schemas ─────────────────────────────────────────

const OrderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    productSnapshot: { type: Schema.Types.Mixed, required: true },
    price: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const ShippingAddressSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: "" },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, trim: true, default: "" },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    landmark: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const PaymentInfoSchema = new Schema(
  {
    method: {
      type: String,
      enum: ["razorpay", "cod", "upi", "bank_transfer"],
      required: true,
    },
    transactionId: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "received", "verified", "failed", "refunded"],
      default: "pending",
    },
    paidAt: { type: Date },
    amount: { type: Number, required: true, min: 0 },
    notes: { type: String, default: "" },
    proofUrl: { type: String, default: "" },
    proofUploadedAt: { type: Date },
    razorpayOrderId: { type: String, default: "", index: true },
    razorpayPaymentId: { type: String, default: "" },
    razorpaySignature: { type: String, default: "" },
  },
  { _id: false }
);

const OrderTimelineSchema = new Schema(
  {
    status: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    updatedBy: { type: Schema.Types.ObjectId, ref: "Admin" },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: {
        validator: (v: IOrderItem[]) => v.length > 0,
        message: "At least one item is required",
      },
    },
    shippingAddress: {
      type: ShippingAddressSchema,
      required: true,
    },
    payment: {
      type: PaymentInfoSchema,
      required: true,
    },
    subtotal: { type: Number, required: true, min: 0 },
    shippingCharge: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: [
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
      ],
      default: "pending",
    },
    cancelReason: { type: String, default: "" },
    timeline: { type: [OrderTimelineSchema], default: [] },
    trackingNumber: { type: String, default: "" },
    trackingUrl: { type: String, default: "" },
    notes: { type: String, default: "" },
    customerNotes: { type: String, default: "" },
    emailsSent: {
      placed: { type: Boolean, default: false },
      paymentConfirmed: { type: Boolean, default: false },
      paymentFailed: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

// Indexes (orderNumber unique is set on the field)
OrderSchema.index({ "shippingAddress.phone": 1 });
OrderSchema.index({ "shippingAddress.email": 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ "payment.status": 1 });
OrderSchema.index({ user: 1 });

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
