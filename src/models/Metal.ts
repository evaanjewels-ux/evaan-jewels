import mongoose, { Schema, Model } from "mongoose";
import { IMetal, IMetalVariant } from "@/types";
import { slugify } from "@/lib/utils";

const MetalVariantSchema = new Schema<IMetalVariant>(
  {
    name: {
      type: String,
      required: [true, "Variant name is required"],
      trim: true,
    },
    purity: {
      type: Number,
      required: [true, "Purity is required"],
    },
    pricePerGram: {
      type: Number,
      required: [true, "Price per gram is required"],
      min: [0, "Price cannot be negative"],
    },
    unit: {
      type: String,
      enum: ["gram", "tola", "ounce"],
      default: "gram",
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const MetalSchema = new Schema<IMetal>(
  {
    name: {
      type: String,
      required: [true, "Metal name is required"],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    variants: {
      type: [MetalVariantSchema],
      validate: {
        validator: function (v: IMetalVariant[]) {
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
MetalSchema.pre("validate", function () {
  if (this.isModified("name") && this.name) {
    this.slug = slugify(this.name);
  }
});


const Metal: Model<IMetal> =
  mongoose.models.Metal || mongoose.model<IMetal>("Metal", MetalSchema);

export default Metal;
