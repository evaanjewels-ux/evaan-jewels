import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import Metal from "@/models/Metal";
import Gemstone from "@/models/Gemstone";
import PriceHistory from "@/models/PriceHistory";
import { calculateProductPrice } from "@/lib/pricing";

export const dynamic = "force-dynamic";

/**
 * POST /api/pricing/sync
 * Update a metal/gemstone variant price and batch-recalculate all affected products.
 *
 * Body:
 *   entityType: "metal" | "gemstone"
 *   entityId: ObjectId
 *   variantId: ObjectId
 *   newPrice: number
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { entityType, entityId, variantId, newPrice } = body;

    if (!entityType || !entityId || !variantId || newPrice === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: entityType, entityId, variantId, newPrice" },
        { status: 400 }
      );
    }

    if (!["metal", "gemstone"].includes(entityType)) {
      return NextResponse.json(
        { success: false, error: "entityType must be 'metal' or 'gemstone'" },
        { status: 400 }
      );
    }

    const price = parseFloat(newPrice);
    if (isNaN(price) || price < 0) {
      return NextResponse.json(
        { success: false, error: "newPrice must be a non-negative number" },
        { status: 400 }
      );
    }

    // 1. Get entity and current variant price
    let oldPrice = 0;
    let variantName = "";
    let entityName = "";
    let unit = "";

    if (entityType === "metal") {
      const metal = await Metal.findById(entityId);
      if (!metal) {
        return NextResponse.json(
          { success: false, error: "Metal not found" },
          { status: 404 }
        );
      }
      entityName = metal.name;

      const variant = metal.variants.find(
        (v) => v._id?.toString() === variantId
      );
      if (!variant) {
        return NextResponse.json(
          { success: false, error: "Variant not found" },
          { status: 404 }
        );
      }

      oldPrice = variant.pricePerGram;
      variantName = variant.name;
      unit = variant.unit || "gram";

      // Update the variant price
      variant.pricePerGram = price;
      variant.lastUpdated = new Date();
      await metal.save();
    } else {
      const gemstone = await Gemstone.findById(entityId);
      if (!gemstone) {
        return NextResponse.json(
          { success: false, error: "Gemstone not found" },
          { status: 404 }
        );
      }
      entityName = gemstone.name;

      const variant = gemstone.variants.find(
        (v) => v._id?.toString() === variantId
      );
      if (!variant) {
        return NextResponse.json(
          { success: false, error: "Variant not found" },
          { status: 404 }
        );
      }

      oldPrice = variant.pricePerCarat;
      variantName = variant.name;
      unit = variant.unit || "carat";

      // Update the variant price
      variant.pricePerCarat = price;
      variant.lastUpdated = new Date();
      await gemstone.save();
    }

    // 2. Find and update all affected products
    //    a) Products whose composition uses this variant directly
    //    b) Products whose chargeBasedOnVariant points to this variant
    //       (their making/wastage charges depend on this variant's price)
    const compositionField =
      entityType === "metal" ? "metalComposition" : "gemstoneComposition";
    const entityField = entityType === "metal" ? "metal" : "gemstone";

    const compositionQuery = {
      [`${compositionField}.${entityField}`]: entityId,
      [`${compositionField}.variantId`]: variantId,
    };

    // Products that use this variant as their charge calculation base
    const chargeVariantQuery =
      entityType === "metal"
        ? {
            "chargeBasedOnVariant.variantId": variantId,
          }
        : null;

    // Combine both queries — avoid duplicates via $or
    const productQuery = chargeVariantQuery
      ? { $or: [compositionQuery, chargeVariantQuery] }
      : compositionQuery;

    const products = await Product.find(productQuery);

    let syncedCount = 0;

    for (const product of products) {
      // Update the composition entry with the new price (if this variant is in composition)
      if (entityType === "metal") {
        for (const comp of product.metalComposition) {
          if (
            comp.metal.toString() === entityId &&
            comp.variantId.toString() === variantId
          ) {
            comp.pricePerGram = price;
            comp.subtotal = Math.round(comp.weightInGrams * price * 100) / 100;
          }
        }
      } else {
        for (const comp of product.gemstoneComposition) {
          if (
            comp.gemstone.toString() === entityId &&
            comp.variantId.toString() === variantId
          ) {
            comp.pricePerCarat = price;
            comp.subtotal =
              Math.round(
                comp.weightInCarats * comp.quantity * price * 100
              ) / 100;
          }
        }
      }

      // Build chargeBasedOnVariant with current pricePerGram for the pricing engine
      const cbv = product.chargeBasedOnVariant?.variantId
        ? {
            metalId: product.chargeBasedOnVariant.metalId,
            variantId: product.chargeBasedOnVariant.variantId,
            variantName: product.chargeBasedOnVariant.variantName,
            // If this IS the charge variant being updated, use the new price
            pricePerGram:
              product.chargeBasedOnVariant.variantId === variantId
                ? price
                : undefined,
          }
        : undefined;

      // Recalculate all prices
      const priceResult = calculateProductPrice({
        metalComposition: product.metalComposition,
        gemstoneComposition: product.gemstoneComposition,
        makingCharges: product.makingCharges,
        wastageCharges: product.wastageCharges,
        gstPercentage: product.gstPercentage,
        otherCharges: product.otherCharges || [],
        chargeBasedOnVariant: cbv,
      });

      product.metalTotal = priceResult.metalTotal;
      product.gemstoneTotal = priceResult.gemstoneTotal;
      product.makingChargeAmount = priceResult.makingChargeAmount;
      product.wastageChargeAmount = priceResult.wastageChargeAmount;
      product.otherChargesTotal = priceResult.otherChargesTotal;
      product.subtotal = priceResult.subtotal;
      product.gstAmount = priceResult.gstAmount;
      product.totalPrice = priceResult.totalPrice;
      product.lastPriceSync = new Date();

      await product.save();
      syncedCount++;
    }

    // 3. Log to PriceHistory
    await PriceHistory.create({
      entityType,
      entityId,
      entityName: `${entityName}`,
      variantName: `${entityName} ${variantName}`,
      oldPrice,
      newPrice: price,
      unit,
      affectedProducts: syncedCount,
    });

    return NextResponse.json({
      success: true,
      data: {
        entityType,
        entityName,
        variantName,
        oldPrice,
        newPrice: price,
        syncedProducts: syncedCount,
      },
      message: `Price updated and ${syncedCount} product${syncedCount !== 1 ? "s" : ""} synced successfully`,
    });
  } catch (error) {
    console.error("POST /api/pricing/sync error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to sync prices" },
      { status: 500 }
    );
  }
}
