import mongoose, { Schema, Model } from "mongoose";
import { IBill } from "@/types";

const CustomerSchema = new Schema(
  {
    name: { type: String, required: [true, "Customer name is required"] },
    phone: { type: String, required: [true, "Phone number is required"] },
    email: { type: String },
    address: { type: String },
  },
  { _id: false }
);

const DiscountSchema = new Schema(
  {
    type: { type: String, enum: ["fixed", "percentage"] },
    value: { type: Number, min: 0 },
    amount: { type: Number, min: 0 },
  },
  { _id: false }
);

// Sub-document for each item in a multi-item bill
const BillItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product" },
    quantity: { type: Number, default: 1, min: 1 },
    selectedSize: { type: String },
    selectedColor: { type: String },
    productSnapshot: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const BillSchema = new Schema<IBill>(
  {
    billNumber: {
      type: String,
      required: [true, "Bill number is required"],
      unique: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
    },
    customer: {
      type: CustomerSchema,
      required: true,
    },
    customerRef: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
    },
    productSnapshot: {
      type: Schema.Types.Mixed,
    },
    // Array of items for multi-product bills
    items: {
      type: [BillItemSchema],
      default: [],
    },
    discount: DiscountSchema,
    finalAmount: {
      type: Number,
      required: [true, "Final amount is required"],
      min: 0,
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentMode: {
      type: String,
      enum: ["cash", "card", "upi", "bank_transfer"],
      default: "cash",
    },
    notes: { type: String },
    generatedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes
BillSchema.index({ billNumber: 1 }, { unique: true });
BillSchema.index({ "customer.phone": 1 });
BillSchema.index({ createdAt: -1 });

const Bill: Model<IBill> =
  mongoose.models.Bill || mongoose.model<IBill>("Bill", BillSchema);

export default Bill;
