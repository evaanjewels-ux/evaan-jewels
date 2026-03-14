import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import { productCreateSchema } from "@/lib/validators/product";
import { ITEMS_PER_PAGE } from "@/constants";
import { generateProductCode, slugify } from "@/lib/utils";
import { calculateProductPrice } from "@/lib/pricing";

async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name);
  let slug = base;
  let counter = 1;
  while (await Product.exists({ slug })) {
    slug = `${base}-${counter}`;
    counter++;
  }
  return slug;
}

export const dynamic = "force-dynamic";

// GET /api/products — List products with pagination, filters, search
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(
      searchParams.get("limit") || String(ITEMS_PER_PAGE),
      10
    );
    const sort = searchParams.get("sort") || "-createdAt";
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const gender = searchParams.get("gender") || "";
    const isActive = searchParams.get("isActive");
    const isNewArrival = searchParams.get("isNewArrival");
    const isOutOfStock = searchParams.get("isOutOfStock");
    const isFeatured = searchParams.get("isFeatured");

    // Build filter
    const filter: Record<string, unknown> = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { productCode: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (gender) {
      filter.gender = gender;
    }

    if (isActive !== null && isActive !== undefined && isActive !== "") {
      filter.isActive = isActive === "true";
    }

    if (isNewArrival === "true") filter.isNewArrival = true;
    if (isOutOfStock === "true") filter.isOutOfStock = true;
    if (isFeatured === "true") filter.isFeatured = true;

    const skip = (page - 1) * limit;
    const total = await Product.countDocuments(filter);

    const products = await Product.find(filter)
      .populate("category", "name slug")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json(
      {
        success: true,
        data: products,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST /api/products — Create a product
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const validatedData = productCreateSchema.parse(body);

    // Ensure productCode is always present (client may send it; generate one if missing)
    if (!validatedData.productCode) {
      const prefix = "AJ";
      (validatedData as Record<string, unknown>).productCode = generateProductCode(
        prefix,
        Date.now() % 100000
      );
    }

    // Ensure the slug is unique — append a numeric suffix if the base slug is already taken
    (validatedData as Record<string, unknown>).slug = await generateUniqueSlug(validatedData.name);

    // Always recalculate prices server-side — never trust client-sent values
    const prices = calculateProductPrice({
      metalComposition: (validatedData.metalComposition ?? []) as unknown as Parameters<typeof calculateProductPrice>[0]["metalComposition"],
      gemstoneComposition: (validatedData.gemstoneComposition ?? []) as unknown as Parameters<typeof calculateProductPrice>[0]["gemstoneComposition"],
      makingCharges: validatedData.makingCharges ?? { type: "fixed", value: 0 },
      wastageCharges: validatedData.wastageCharges ?? { type: "fixed", value: 0 },
      gstPercentage: validatedData.gstPercentage ?? 3,
      otherCharges: (validatedData.otherCharges ?? []) as Parameters<typeof calculateProductPrice>[0]["otherCharges"],
      chargeBasedOnVariant: validatedData.chargeBasedOnVariant as Parameters<typeof calculateProductPrice>[0]["chargeBasedOnVariant"],
    });

    const product = await Product.create({ ...validatedData, ...prices, lastPriceSync: new Date() });

    // Populate category for the response
    await product.populate("category", "name slug");

    return NextResponse.json(
      {
        success: true,
        data: product,
        message: "Product created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error },
        { status: 400 }
      );
    }
    console.error("POST /api/products error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create product" },
      { status: 500 }
    );
  }
}
