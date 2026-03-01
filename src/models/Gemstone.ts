import mongoose, { Schema, Model } from "mongoose";
import { IGemstone, IGemstoneVariant } from "@/types";
import { slugify } from "@/lib/utils";

const GemstoneVariantSchema = new Schema<IGemstoneVariant>(
  {
    name: {
      type: String,
      required: [true, "Variant name is required"],
      trim: true,
    },
    cut: {
      type: String,
      trim: true,
    },
    clarity: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      trim: true,
    },
    pricePerCarat: {
      type: Number,
      required: [true, "Price per carat is required"],
      min: [0, "Price cannot be negative"],
    },
    unit: {
      type: String,
      enum: ["carat", "ratti", "cent"],
      default: "carat",
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const GemstoneSchema = new Schema<IGemstone>(
  {
    name: {
      type: String,
      required: [true, "Gemstone name is required"],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    variants: {
      type: [GemstoneVariantSchema],
      validate: {
        validator: function (v: IGemstoneVariant[]) {
          return v.length >= 1;
        },
        message: "At least one variant is required",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate slug from name
GemstoneSchema.pre("validate", function () {
  if (this.isModified("name") && this.name) {
    this.slug = slugify(this.name);
  }
});


const Gemstone: Model<IGemstone> =
  mongoose.models.Gemstone ||
  mongoose.model<IGemstone>("Gemstone", GemstoneSchema);

export default Gemstone;
