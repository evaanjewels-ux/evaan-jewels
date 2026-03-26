import mongoose, { Schema, Model } from "mongoose";
import { IProduct } from "@/types";
import { slugify } from "@/lib/utils";

const MetalCompositionSchema = new Schema(
  {
    metal: {
      type: Schema.Types.ObjectId,
      ref: "Metal",
      required: true,
    },
    variantId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    variantName: {
      type: String,
      required: true,
    },
    weightInGrams: {
      type: Number,
      required: true,
      min: [0, "Weight cannot be negative"],
    },
    pricePerGram: {
      type: Number,
      default: 0,
    },
    subtotal: {
      type: Number,
      default: 0,
    },
    /** Per-metal wastage — applied to this metal's subtotal */
    wastageCharges: {
      type: {
        type: String,
        enum: ["fixed", "percentage", "per_gram"],
        default: "percentage",
      },
      value: { type: Number, default: 0, min: 0 },
      _id: false,
    },
  },
  { _id: false }
);

const GemstoneCompositionSchema = new Schema(
  {
    gemstone: {
      type: Schema.Types.ObjectId,
      ref: "Gemstone",
      required: true,
    },
    variantId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    variantName: {
      type: String,
      required: true,
    },
    weightInCarats: {
      type: Number,
      required: true,
      min: [0, "Weight cannot be negative"],
    },
    quantity: {
      type: Number,
      default: 1,
      min: [1, "Quantity must be at least 1"],
    },
    pricePerCarat: {
      type: Number,
      default: 0,
    },
    subtotal: {
      type: Number,
      default: 0,
    },
    /** Per-gemstone wastage — applied to this gemstone's subtotal */
    wastageCharges: {
      type: {
        type: String,
        enum: ["fixed", "percentage", "per_gram"],
        default: "percentage",
      },
      value: { type: Number, default: 0, min: 0 },
      _id: false,
    },
  },
  { _id: false }
);

const ChargesSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["fixed", "percentage", "per_gram"],
      default: "fixed",
    },
    value: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const OtherChargeSchema = new Schema(
  {
    name: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const ColorImageSchema = new Schema(
  {
    color: { type: String, required: true },
    images: { type: [String], default: [] },
  },
  { _id: false }
);

const ProductVideoSchema = new Schema(
  {
    type: { type: String, enum: ["upload", "external"], required: true },
    url: { type: String, required: true },
    thumbnailUrl: { type: String, default: "" },
  },
  { _id: false }
);

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    productCode: {
      type: String,
      required: [true, "Product code is required"],
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    gender: {
      type: String,
      enum: ["men", "women", "unisex", "kids"],
      default: "unisex",
    },

    // Composition
    metalComposition: [MetalCompositionSchema],
    gemstoneComposition: [GemstoneCompositionSchema],

    // Charges
    makingCharges: { type: ChargesSchema, default: { type: "fixed", value: 0 } },
    wastageCharges: {
      type: ChargesSchema,
      default: { type: "fixed", value: 0 },
    },
    gstPercentage: { type: Number, default: 3 },
    otherCharges: [OtherChargeSchema],

    // Calculated prices
    metalTotal: { type: Number, default: 0 },
    gemstoneTotal: { type: Number, default: 0 },
    makingChargeAmount: { type: Number, default: 0 },
    wastageChargeAmount: { type: Number, default: 0 },
    otherChargesTotal: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    totalPrice: { type: Number, default: 0 },

    // Images
    images: {
      type: [String],
      validate: {
        validator: function (v: string[]) {
          return v.length <= 8;
        },
        message: "Maximum 8 images allowed",
      },
    },
    thumbnailImage: { type: String, default: "" },

    // Color-specific images
    colorImages: { type: [ColorImageSchema], default: [] },

    // Videos
    videos: {
      type: [ProductVideoSchema],
      default: [],
      validate: {
        validator: function (v: unknown[]) {
          return v.length <= 3;
        },
        message: "Maximum 3 videos allowed",
      },
    },

    // Flags
    isNewArrival: { type: Boolean, default: false },
    isOutOfStock: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    // Charge variant selection — which variant's price to use for making/wastage
    chargeBasedOnVariant: {
      metalId: { type: String },
      variantId: { type: String },
      variantName: { type: String },
      _id: false,
    },

    // Which metal variants to show on the product page for variant-switching
    // Each entry maps a metal to the variants (with per-variant weight) the admin wants to display
    displayVariants: {
      type: [
        {
          metal: { type: Schema.Types.ObjectId, ref: "Metal", required: true },
          variants: [
            {
              variantId: { type: Schema.Types.ObjectId, required: true },
              weightInGrams: { type: Number, required: true, min: 0 },
              _id: false,
            },
          ],
          _id: false,
        },
      ],
      default: [],
    },

    // Which gemstone options to show on the product page for gemstone-switching
    displayGemstones: {
      type: [
        {
          gemstone: { type: Schema.Types.ObjectId, ref: "Gemstone", required: true },
          variantId: { type: Schema.Types.ObjectId, required: true },
          variantName: { type: String, required: true },
          weightInCarats: { type: Number, required: true, min: 0 },
          quantity: { type: Number, default: 1, min: 1 },
          pricePerCarat: { type: Number, default: 0 },
          _id: false,
        },
      ],
      default: [],
    },

    // Hallmark
    hallmarkCertified: { type: Boolean, default: false },

    // SEO
    metaTitle: { type: String },
    metaDescription: { type: String },

    // Other
    grossWeight: { type: Number, default: 0 },
    netWeight: { type: Number, default: 0 },
    size: { type: String },
    sizes: { type: [String], default: [] },
    colors: { type: [String], default: [] },
    lastPriceSync: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Auto-generate slug from name
ProductSchema.pre("validate", function () {
  if (this.isModified("name") && this.name) {
    this.slug = slugify(this.name);
  }
});

// Indexes
ProductSchema.index({ category: 1 });
ProductSchema.index({ gender: 1 });
ProductSchema.index({ isActive: 1, isNewArrival: -1, createdAt: -1 });
ProductSchema.index({
  "metalComposition.metal": 1,
  "metalComposition.variantName": 1,
});
ProductSchema.index({
  "gemstoneComposition.gemstone": 1,
  "gemstoneComposition.variantName": 1,
});
ProductSchema.index({
  "chargeBasedOnVariant.metalId": 1,
  "chargeBasedOnVariant.variantName": 1,
});
ProductSchema.index({
  "displayGemstones.gemstone": 1,
  "displayGemstones.variantName": 1,
});
ProductSchema.index({ totalPrice: 1 });
ProductSchema.index({ isFeatured: 1 });

const Product: Model<IProduct> =
  mongoose.models.Product ||
  mongoose.model<IProduct>("Product", ProductSchema);

export default Product;
