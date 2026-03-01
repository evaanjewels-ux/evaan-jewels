import { Types } from "mongoose";

// ─── Admin ───────────────────────────────────────────

export interface IAdmin {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: "super_admin" | "admin";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Category ────────────────────────────────────────

export interface ICategory {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  image: string;
  description?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Metal ───────────────────────────────────────────

export interface IMetalVariant {
  _id: Types.ObjectId;
  name: string;
  purity: number;
  pricePerGram: number;
  unit: "gram" | "tola" | "ounce";
  lastUpdated: Date;
}

export interface IMetal {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  variants: IMetalVariant[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Gemstone ────────────────────────────────────────

export interface IGemstoneVariant {
  _id: Types.ObjectId;
  name: string;
  cut?: string;
  clarity?: string;
  color?: string;
  pricePerCarat: number;
  unit: "carat" | "ratti" | "cent";
  lastUpdated: Date;
}

export interface IGemstone {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  variants: IGemstoneVariant[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Product ─────────────────────────────────────────

export interface IMetalComposition {
  metal: Types.ObjectId;
  variantId: Types.ObjectId;
  variantName: string;
  weightInGrams: number;
  pricePerGram: number;
  subtotal: number;
  /** Per-metal wastage — applied to this metal's subtotal */
  wastageCharges?: ICharges;
}

export interface IGemstoneComposition {
  gemstone: Types.ObjectId;
  variantId: Types.ObjectId;
  variantName: string;
  weightInCarats: number;
  quantity: number;
  pricePerCarat: number;
  subtotal: number;
  /** Per-gemstone wastage — applied to this gemstone's subtotal */
  wastageCharges?: ICharges;
}

export interface ICharges {
  type: "fixed" | "percentage";
  value: number;
}

// Intentional forward-declaration so ICharges is available above
// when used in composition interfaces below.

export interface IOtherCharge {
  name: string;
  amount: number;
}

export interface IProduct {
  _id: Types.ObjectId;
  name: string;
  productCode: string;
  slug: string;
  description: string;
  category: Types.ObjectId;
  gender: "men" | "women" | "unisex" | "kids";

  metalComposition: IMetalComposition[];
  gemstoneComposition: IGemstoneComposition[];

  makingCharges: ICharges;
  wastageCharges: ICharges;
  gstPercentage: number;
  otherCharges: IOtherCharge[];

  metalTotal: number;
  gemstoneTotal: number;
  makingChargeAmount: number;
  wastageChargeAmount: number;
  otherChargesTotal: number;
  subtotal: number;
  gstAmount: number;
  totalPrice: number;

  images: string[];
  thumbnailImage: string;

  isNewArrival: boolean;
  isOutOfStock: boolean;
  isFeatured: boolean;
  isActive: boolean;

  metaTitle?: string;
  metaDescription?: string;

  grossWeight: number;
  netWeight: number;
  size?: string;
  lastPriceSync: Date;

  createdAt: Date;
  updatedAt: Date;
}

// ─── Customer Record (standalone) ────────────────────

export interface IPaymentHistory {
  _id?: Types.ObjectId;
  bill?: Types.ObjectId;
  billNumber?: string;
  billAmount: number;
  amountPaid: number;
  debtAdded: number;
  debtBefore: number;
  debtAfter: number;
  note?: string;
  date: Date;
}

export interface ICustomerRecord {
  _id: Types.ObjectId;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalDebt: number;
  totalPurchases: number;
  totalPaid: number;
  billCount: number;
  paymentHistory: IPaymentHistory[];
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Bill ────────────────────────────────────────────

export interface ICustomer {
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

export interface IDiscount {
  type: "fixed" | "percentage";
  value: number;
  amount: number;
}

export interface IBillItem {
  product?: Types.ObjectId;
  quantity: number;
  productSnapshot: Record<string, unknown>;
}

export interface IBill {
  _id: Types.ObjectId;
  billNumber: string;
  product: Types.ObjectId;
  customer: ICustomer;
  customerRef?: Types.ObjectId;
  productSnapshot: Record<string, unknown>;
  items?: IBillItem[];
  discount?: IDiscount;
  finalAmount: number;
  amountPaid: number;
  paymentMode: "cash" | "card" | "upi" | "bank_transfer";
  notes?: string;
  generatedBy: Types.ObjectId;
  createdAt: Date;
}

// ─── Price History ───────────────────────────────────

export interface IPriceHistory {
  _id: Types.ObjectId;
  entityType: "metal" | "gemstone";
  entityId: Types.ObjectId;
  entityName: string;
  variantName: string;
  oldPrice: number;
  newPrice: number;
  unit: string;
  affectedProducts: number;
  changedBy: Types.ObjectId;
  createdAt: Date;
}

// ─── Counter ─────────────────────────────────────────

export interface ICounter {
  _id: Types.ObjectId;
  name: string;
  prefix: string;
  year: number;
  seq: number;
}

// ─── Cart (client-side) ──────────────────────────────

export interface ICartItem {
  productId: string;
  name: string;
  slug: string;
  productCode: string;
  thumbnailImage: string;
  totalPrice: number;
  quantity: number;
  category?: string;
  metalComposition?: { variantName: string; weightInGrams: number }[];
}

// ─── API Response Types ──────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
