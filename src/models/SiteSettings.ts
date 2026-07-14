import mongoose, { Schema, Model } from "mongoose";

export interface ISiteSettings {
  _id: mongoose.Types.ObjectId;
  key: string;
  heroImages: string[];
  heroImagesMobile: string[];
  updatedAt: Date;
  createdAt: Date;
}

const heroImagesMobileField = {
  type: [String] as const,
  default: [] as string[],
  validate: {
    validator: (v: string[]) => v.length <= 12,
    message: "Maximum 12 mobile hero images",
  },
};

const SiteSettingsSchema = new Schema<ISiteSettings>(
  {
    key: { type: String, required: true, unique: true, default: "site" },
    heroImages: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.length <= 12,
        message: "Maximum 12 hero images",
      },
    },
    heroImagesMobile: heroImagesMobileField,
  },
  { timestamps: true }
);

// Dev HMR can cache an older model without heroImagesMobile — reinject the path
function getModel(): Model<ISiteSettings> {
  const existing = mongoose.models.SiteSettings as
    | Model<ISiteSettings>
    | undefined;

  if (existing) {
    if (!existing.schema.path("heroImagesMobile")) {
      existing.schema.add({ heroImagesMobile: heroImagesMobileField });
    }
    return existing;
  }

  return mongoose.model<ISiteSettings>("SiteSettings", SiteSettingsSchema);
}

const SiteSettings = getModel();

export default SiteSettings;

export async function getHeroImages(): Promise<{
  desktop: string[];
  mobile: string[];
}> {
  const doc = await SiteSettings.findOne({ key: "site" }).lean();
  return {
    desktop: doc?.heroImages?.filter(Boolean) ?? [],
    mobile: doc?.heroImagesMobile?.filter(Boolean) ?? [],
  };
}
