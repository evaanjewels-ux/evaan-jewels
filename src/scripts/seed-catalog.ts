/**
 * Catalog Seed Script — Metals & Gemstones
 *
 * Seeds common metals and gemstones with realistic Indian market prices
 * as of March 2026 (prices in INR per gram / per carat).
 *
 * Usage:
 *   npm run seed:catalog
 *
 * Safe to re-run — existing records are skipped (upsert by name).
 */

import mongoose from "mongoose";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI is not defined in .env.local");
  process.exit(1);
}

// ── Slugify (inline to avoid ESM alias issues) ────────────────────────────────
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ── Inline schemas (avoids Next.js path alias issues in tsx scripts) ──────────

const metalVariantSchema = new mongoose.Schema(
  {
    name:          { type: String, required: true, trim: true },
    purity:        { type: Number, required: true },
    pricePerGram:  { type: Number, required: true, min: 0 },
    unit:          { type: String, enum: ["gram", "tola", "ounce"], default: "gram" },
    lastUpdated:   { type: Date, default: Date.now },
  },
  { _id: true }
);

const MetalModel =
  mongoose.models.Metal ||
  mongoose.model(
    "Metal",
    new mongoose.Schema(
      {
        name:     { type: String, required: true, unique: true, trim: true },
        slug:     { type: String, required: true, unique: true },
        variants: { type: [metalVariantSchema], validate: (v: unknown[]) => v.length >= 1 },
        isActive: { type: Boolean, default: true },
      },
      { timestamps: true }
    )
  );

const gemstoneVariantSchema = new mongoose.Schema(
  {
    name:          { type: String, required: true, trim: true },
    cut:           { type: String, trim: true },
    clarity:       { type: String, trim: true },
    color:         { type: String, trim: true },
    pricePerCarat: { type: Number, required: true, min: 0 },
    unit:          { type: String, enum: ["carat", "ratti", "cent"], default: "carat" },
    lastUpdated:   { type: Date, default: Date.now },
  },
  { _id: true }
);

const GemstoneModel =
  mongoose.models.Gemstone ||
  mongoose.model(
    "Gemstone",
    new mongoose.Schema(
      {
        name:     { type: String, required: true, unique: true, trim: true },
        slug:     { type: String, required: true, unique: true },
        variants: { type: [gemstoneVariantSchema], validate: (v: unknown[]) => v.length >= 1 },
        isActive: { type: Boolean, default: true },
      },
      { timestamps: true }
    )
  );

// ── Seed Data ─────────────────────────────────────────────────────────────────
// All metal prices are in INR per gram (MCX/IBJA rates, Mar 2026)
// All gemstone prices are in INR per carat (wholesale trade rates, Mar 2026)

const METALS = [
  {
    name: "Gold",
    variants: [
      { name: "24K (999.9 Pure)",   purity: 99.9,  pricePerGram: 9150, unit: "gram" },
      { name: "22K (916 Hallmark)", purity: 91.6,  pricePerGram: 8385, unit: "gram" },
      { name: "18K",                purity: 75.0,  pricePerGram: 6863, unit: "gram" },
      { name: "14K",                purity: 58.5,  pricePerGram: 5353, unit: "gram" },
      { name: "9K",                 purity: 37.5,  pricePerGram: 3431, unit: "gram" },
    ],
  },
  {
    name: "Silver",
    variants: [
      { name: "999 Fine Silver",     purity: 99.9,  pricePerGram: 112,  unit: "gram" },
      { name: "925 Sterling Silver", purity: 92.5,  pricePerGram: 104,  unit: "gram" },
      { name: "800 Silver",          purity: 80.0,  pricePerGram: 90,   unit: "gram" },
    ],
  },
  {
    name: "Platinum",
    variants: [
      { name: "950 Platinum",       purity: 95.0,  pricePerGram: 3350, unit: "gram" },
      { name: "900 Platinum",       purity: 90.0,  pricePerGram: 3180, unit: "gram" },
      { name: "850 Platinum",       purity: 85.0,  pricePerGram: 3010, unit: "gram" },
    ],
  },
  {
    name: "White Gold",
    variants: [
      { name: "18K White Gold",     purity: 75.0,  pricePerGram: 6920, unit: "gram" },
      { name: "14K White Gold",     purity: 58.5,  pricePerGram: 5400, unit: "gram" },
    ],
  },
  {
    name: "Rose Gold",
    variants: [
      { name: "18K Rose Gold",      purity: 75.0,  pricePerGram: 6830, unit: "gram" },
      { name: "14K Rose Gold",      purity: 58.5,  pricePerGram: 5330, unit: "gram" },
    ],
  },
];

const GEMSTONES = [
  {
    name: "Diamond",
    variants: [
      {
        name: "Round Brilliant SI/GH",
        cut: "Round Brilliant",
        clarity: "SI1-SI2",
        color: "G-H",
        pricePerCarat: 72000,
        unit: "carat",
      },
      {
        name: "Round Brilliant VS/EF",
        cut: "Round Brilliant",
        clarity: "VS1-VS2",
        color: "E-F",
        pricePerCarat: 150000,
        unit: "carat",
      },
      {
        name: "Princess Cut SI/GH",
        cut: "Princess",
        clarity: "SI1-SI2",
        color: "G-H",
        pricePerCarat: 67000,
        unit: "carat",
      },
      {
        name: "Solitaire VS/DEF",
        cut: "Round Brilliant",
        clarity: "VS",
        color: "D-E-F",
        pricePerCarat: 260000,
        unit: "carat",
      },
      {
        name: "Small Diamond (Star/Single Cut)",
        cut: "Single Cut",
        clarity: "SI-I",
        color: "G-H-I",
        pricePerCarat: 18000,
        unit: "carat",
      },
      {
        name: "Micro Diamond (Melee)",
        cut: "Round",
        clarity: "SI-I",
        color: "G-H",
        pricePerCarat: 12000,
        unit: "carat",
      },
      {
        name: "Marquise Cut VS/GH",
        cut: "Marquise",
        clarity: "VS1-VS2",
        color: "G-H",
        pricePerCarat: 80000,
        unit: "carat",
      },
      {
        name: "Oval Cut VS/EF",
        cut: "Oval",
        clarity: "VS1-VS2",
        color: "E-F",
        pricePerCarat: 140000,
        unit: "carat",
      },
    ],
  },
  {
    name: "Ruby",
    variants: [
      {
        name: "Natural Ruby (Commercial)",
        cut: "Oval",
        clarity: "Included",
        color: "Pinkish Red",
        pricePerCarat: 12000,
        unit: "carat",
      },
      {
        name: "Natural Ruby (Premium)",
        cut: "Oval",
        clarity: "Eye Clean",
        color: "Deep Red",
        pricePerCarat: 45000,
        unit: "carat",
      },
      {
        name: "Synthetic Ruby",
        cut: "Round",
        clarity: "Loupe Clean",
        color: "Red",
        pricePerCarat: 800,
        unit: "carat",
      },
    ],
  },
  {
    name: "Emerald",
    variants: [
      {
        name: "Natural Emerald (Commercial)",
        cut: "Emerald",
        clarity: "Included",
        color: "Light Green",
        pricePerCarat: 8000,
        unit: "carat",
      },
      {
        name: "Natural Emerald (Premium)",
        cut: "Emerald",
        clarity: "Eye Clean",
        color: "Vivid Green",
        pricePerCarat: 22000,
        unit: "carat",
      },
      {
        name: "Synthetic Emerald",
        cut: "Round",
        clarity: "Loupe Clean",
        color: "Green",
        pricePerCarat: 1200,
        unit: "carat",
      },
    ],
  },
  {
    name: "Blue Sapphire",
    variants: [
      {
        name: "Natural Sapphire (Commercial)",
        cut: "Oval",
        clarity: "Included",
        color: "Blue",
        pricePerCarat: 10000,
        unit: "carat",
      },
      {
        name: "Natural Sapphire (Premium)",
        cut: "Oval",
        clarity: "Eye Clean",
        color: "Royal Blue",
        pricePerCarat: 32000,
        unit: "carat",
      },
      {
        name: "Synthetic Sapphire",
        cut: "Round",
        clarity: "Loupe Clean",
        color: "Blue",
        pricePerCarat: 900,
        unit: "carat",
      },
    ],
  },
  {
    name: "Pearl",
    variants: [
      {
        name: "Freshwater Pearl",
        cut: "Cabochon",
        clarity: "AA",
        color: "White",
        pricePerCarat: 450,
        unit: "carat",
      },
      {
        name: "South Sea Pearl",
        cut: "Cabochon",
        clarity: "AAA",
        color: "White/Gold",
        pricePerCarat: 2500,
        unit: "carat",
      },
    ],
  },
  {
    name: "Yellow Sapphire",
    variants: [
      {
        name: "Natural Yellow Sapphire",
        cut: "Oval",
        clarity: "Eye Clean",
        color: "Yellow",
        pricePerCarat: 8500,
        unit: "carat",
      },
      {
        name: "Synthetic Yellow Sapphire",
        cut: "Round",
        clarity: "Loupe Clean",
        color: "Yellow",
        pricePerCarat: 700,
        unit: "carat",
      },
    ],
  },
  {
    name: "Coral",
    variants: [
      {
        name: "Red Coral (Moonga)",
        cut: "Oval/Cabochon",
        clarity: "Commercial",
        color: "Red",
        pricePerCarat: 700,
        unit: "carat",
      },
      {
        name: "Italian Red Coral",
        cut: "Oval/Cabochon",
        clarity: "Premium",
        color: "Deep Red",
        pricePerCarat: 2000,
        unit: "carat",
      },
    ],
  },
  {
    name: "Amethyst",
    variants: [
      {
        name: "Natural Amethyst",
        cut: "Round",
        clarity: "Eye Clean",
        color: "Purple",
        pricePerCarat: 400,
        unit: "carat",
      },
    ],
  },
  {
    name: "Tanzanite",
    variants: [
      {
        name: "Tanzanite AA",
        cut: "Oval",
        clarity: "Eye Clean",
        color: "Violet-Blue",
        pricePerCarat: 5000,
        unit: "carat",
      },
      {
        name: "Tanzanite AAA",
        cut: "Oval",
        clarity: "Loupe Clean",
        color: "Deep Violet-Blue",
        pricePerCarat: 12000,
        unit: "carat",
      },
    ],
  },
  {
    name: "Opal",
    variants: [
      {
        name: "White Opal",
        cut: "Cabochon",
        clarity: "Translucent",
        color: "White/Multi",
        pricePerCarat: 800,
        unit: "carat",
      },
      {
        name: "Black Opal",
        cut: "Cabochon",
        clarity: "Transparent",
        color: "Black/Multi",
        pricePerCarat: 5500,
        unit: "carat",
      },
    ],
  },
  {
    name: "Garnet",
    variants: [
      {
        name: "Rhodolite Garnet",
        cut: "Round",
        clarity: "Eye Clean",
        color: "Purplish Red",
        pricePerCarat: 600,
        unit: "carat",
      },
      {
        name: "Hessonite (Gomed)",
        cut: "Oval/Cushion",
        clarity: "Eye Clean",
        color: "Honey Orange",
        pricePerCarat: 500,
        unit: "carat",
      },
    ],
  },
  {
    name: "Topaz",
    variants: [
      {
        name: "Blue Topaz (Swiss)",
        cut: "Oval",
        clarity: "Eye Clean",
        color: "Swiss Blue",
        pricePerCarat: 350,
        unit: "carat",
      },
      {
        name: "White Topaz",
        cut: "Round",
        clarity: "Loupe Clean",
        color: "Colorless",
        pricePerCarat: 150,
        unit: "carat",
      },
    ],
  },
  {
    name: "Cubic Zirconia (CZ)",
    variants: [
      {
        name: "CZ Colorless (AAA)",
        cut: "Round",
        clarity: "Loupe Clean",
        color: "Colorless",
        pricePerCarat: 50,
        unit: "carat",
      },
      {
        name: "CZ Colored",
        cut: "Round",
        clarity: "Loupe Clean",
        color: "Various",
        pricePerCarat: 60,
        unit: "carat",
      },
    ],
  },
  {
    name: "Peridot",
    variants: [
      {
        name: "Natural Peridot",
        cut: "Oval",
        clarity: "Eye Clean",
        color: "Olive Green",
        pricePerCarat: 350,
        unit: "carat",
      },
    ],
  },
  {
    name: "Turquoise",
    variants: [
      {
        name: "Natural Turquoise",
        cut: "Cabochon",
        clarity: "Opaque",
        color: "Blue-Green",
        pricePerCarat: 250,
        unit: "carat",
      },
    ],
  },
  {
    name: "Cat's Eye (Lehsunia)",
    variants: [
      {
        name: "Natural Cat\\'s Eye",
        cut: "Cabochon",
        clarity: "Good Chatoyancy",
        color: "Yellowish Green",
        pricePerCarat: 3000,
        unit: "carat",
      },
      {
        name: "Synthetic Cat\\'s Eye",
        cut: "Cabochon",
        clarity: "Chatoyant",
        color: "Green",
        pricePerCarat: 400,
        unit: "carat",
      },
    ],
  },
];

// ── Runner ────────────────────────────────────────────────────────────────────

async function seedCatalog() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI as string);
  console.log("Connected.\n");

  // ── Metals
  console.log("━━━ Seeding Metals ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  let metalsCreated = 0;
  let metalsSkipped = 0;

  for (const metal of METALS) {
    const slug = slugify(metal.name);
    const existing = await MetalModel.findOne({ name: metal.name });

    if (existing) {
      console.log(`  ↷  Skipped  (already exists): ${metal.name}`);
      metalsSkipped++;
      continue;
    }

    await MetalModel.create({
      name: metal.name,
      slug,
      variants: metal.variants.map((v) => ({ ...v, lastUpdated: new Date() })),
      isActive: true,
    });

    console.log(`  ✓  Created: ${metal.name} (${metal.variants.length} variants)`);
    metal.variants.forEach((v) =>
      console.log(`        • ${v.name.padEnd(28)} ₹${v.pricePerGram.toLocaleString("en-IN")}/gram  [${v.purity}% purity]`)
    );
    metalsCreated++;
  }

  // ── Gemstones
  console.log("\n━━━ Seeding Gemstones ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  let stonesCreated = 0;
  let stonesSkipped = 0;

  for (const stone of GEMSTONES) {
    const slug = slugify(stone.name);
    const existing = await GemstoneModel.findOne({ name: stone.name });

    if (existing) {
      console.log(`  ↷  Skipped  (already exists): ${stone.name}`);
      stonesSkipped++;
      continue;
    }

    await GemstoneModel.create({
      name: stone.name,
      slug,
      variants: stone.variants.map((v) => ({ ...v, lastUpdated: new Date() })),
      isActive: true,
    });

    console.log(`  ✓  Created: ${stone.name} (${stone.variants.length} variants)`);
    stone.variants.forEach((v) =>
      console.log(`        • ${v.name.padEnd(38)} ₹${v.pricePerCarat.toLocaleString("en-IN")}/carat`)
    );
    stonesCreated++;
  }

  // ── Summary
  console.log("\n━━━ Summary ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Metals   — created: ${metalsCreated}, skipped: ${metalsSkipped}`);
  console.log(`  Gemstones— created: ${stonesCreated}, skipped: ${stonesSkipped}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log("Done. Remember to update prices regularly from MCX/IBJA rates.");

  await mongoose.disconnect();
}

seedCatalog().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
