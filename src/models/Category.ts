import mongoose, { Schema, Model } from "mongoose";
import { ICategory } from "@/types";
import { slugify } from "@/lib/utils";

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    image: {
      type: String,
      required: [true, "Category image is required"],
    },
    description: {
      type: String,
      default: "",
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Auto-generate slug from name before validation
CategorySchema.pre("validate", function () {
  if (this.isModified("name") && this.name) {
    this.slug = slugify(this.name);
  }
});

// Virtual: product count
CategorySchema.virtual("productCount", {
  ref: "Product",
  localField: "_id",
  foreignField: "category",
  count: true,
});

// Indexes
// Note: slug already has `unique: true` in the schema definition above,
// which auto-creates an index. Only add the non-duplicate index here.
CategorySchema.index({ order: 1 });

const Category: Model<ICategory> =
  mongoose.models.Category ||
  mongoose.model<ICategory>("Category", CategorySchema);

export default Category;
