import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import { productUpdateSchema } from "@/lib/validators/product";
import { calculateProductPrice } from "@/lib/pricing";

export const dynamic = "force-dynamic";

// GET /api/products/[id] — Get single product
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const product = await Product.findById(id)
      .populate("category", "name slug")
      .populate("metalComposition.metal", "name")
      .populate("gemstoneComposition.gemstone", "name")
      .lean();

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error("GET /api/products/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] — Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const validatedData = productUpdateSchema.parse(body);

    // Always recalculate prices server-side when composition or charges are updated
    const hasCompositionData =
      validatedData.metalComposition !== undefined ||
      validatedData.gemstoneComposition !== undefined ||
      validatedData.makingCharges !== undefined ||
      validatedData.wastageCharges !== undefined ||
      validatedData.gstPercentage !== undefined ||
      validatedData.otherCharges !== undefined;

    if (hasCompositionData) {
      // Fetch existing product to fill in any missing parts not included in the update
      const existing = await Product.findById(id).lean();
      if (!existing) {
        return NextResponse.json(
          { success: false, error: "Product not found" },
          { status: 404 }
        );
      }

      const prices = calculateProductPrice({
        metalComposition: (validatedData.metalComposition ?? existing.metalComposition) as unknown as Parameters<typeof calculateProductPrice>[0]["metalComposition"],
        gemstoneComposition: (validatedData.gemstoneComposition ?? existing.gemstoneComposition) as unknown as Parameters<typeof calculateProductPrice>[0]["gemstoneComposition"],
        makingCharges: validatedData.makingCharges ?? existing.makingCharges,
        wastageCharges: validatedData.wastageCharges ?? existing.wastageCharges,
        gstPercentage: validatedData.gstPercentage ?? existing.gstPercentage,
        otherCharges: (validatedData.otherCharges ?? existing.otherCharges) as Parameters<typeof calculateProductPrice>[0]["otherCharges"],
        chargeBasedOnVariant: (validatedData.chargeBasedOnVariant ?? (existing as Record<string, unknown>).chargeBasedOnVariant) as Parameters<typeof calculateProductPrice>[0]["chargeBasedOnVariant"],
      });

      Object.assign(validatedData, prices, { lastPriceSync: new Date() });
    }

    const product = await Product.findByIdAndUpdate(id, validatedData, {
      new: true,
      runValidators: true,
    })
      .populate("category", "name slug")
      .lean();

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: product,
      message: "Product updated successfully",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      const zodError = error as unknown as { issues: unknown[] };
      console.error("PUT /api/products/[id] ZodError issues:", JSON.stringify(zodError.issues, null, 2));
      return NextResponse.json(
        { success: false, error: "Validation failed", details: zodError.issues },
        { status: 400 }
      );
    }
    // Mongoose validation error
    if (error instanceof Error && error.name === "ValidationError") {
      console.error("PUT /api/products/[id] Mongoose ValidationError:", error.message);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    console.error("PUT /api/products/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] — Delete product
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/products/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
