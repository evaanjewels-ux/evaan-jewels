import mongoose, { Schema, Model } from "mongoose";

// ─── Order Status Flow ───────────────────────────────
// pending → confirmed → processing → shipped → delivered
// pending → cancelled (at any stage before delivered)

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
  method: "upi" | "bank_transfer" | "cod";
  transactionId?: string;
  status: "pending" | "received" | "verified" | "failed" | "refunded";
  paidAt?: Date;
  amount: number;
  notes?: string;
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
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  payment: IPaymentInfo;
  subtotal: number;
  shippingCharge: number;
  discount: number;
  totalAmount: number;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  cancelReason?: string;
  timeline: IOrderTimeline[];
  trackingNumber?: string;
  trackingUrl?: string;
  notes?: string;
  customerNotes?: string;
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
      enum: ["upi", "bank_transfer", "cod"],
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
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    cancelReason: { type: String, default: "" },
    timeline: { type: [OrderTimelineSchema], default: [] },
    trackingNumber: { type: String, default: "" },
    trackingUrl: { type: String, default: "" },
    notes: { type: String, default: "" },
    customerNotes: { type: String, default: "" },
  },
  { timestamps: true }
);

// Indexes
OrderSchema.index({ orderNumber: 1 }, { unique: true });
OrderSchema.index({ "shippingAddress.phone": 1 });
OrderSchema.index({ "shippingAddress.email": 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ "payment.status": 1 });

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
