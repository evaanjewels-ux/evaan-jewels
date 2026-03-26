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
    //    Match by (entity + variantName) using $elemMatch — variantName is stable
    //    even when variant ObjectIds go stale after re-saving a metal/gemstone.
    //    a) Products whose composition uses this variant directly
    //    b) Products whose chargeBasedOnVariant points to this variant
    //    c) Products whose displayGemstones contain this gemstone variant
    const compositionField =
      entityType === "metal" ? "metalComposition" : "gemstoneComposition";
    const entityField = entityType === "metal" ? "metal" : "gemstone";

    const compositionQuery = {
      [compositionField]: {
        $elemMatch: {
          [entityField]: entityId,
          $or: [
            { variantName: variantName },
            { variantId: variantId },
          ],
        },
      },
    };

    // Products that use this variant as their charge calculation base
    const chargeVariantQuery =
      entityType === "metal"
        ? {
            "chargeBasedOnVariant.metalId": entityId,
            $or: [
              { "chargeBasedOnVariant.variantName": variantName },
              { "chargeBasedOnVariant.variantId": variantId },
            ],
          }
        : null;

    // Products with displayGemstones referencing this gemstone variant
    const displayGemstonesQuery =
      entityType === "gemstone"
        ? {
            displayGemstones: {
              $elemMatch: {
                gemstone: entityId,
                $or: [
                  { variantName: variantName },
                  { variantId: variantId },
                ],
              },
            },
          }
        : null;

    // Combine all queries — avoid duplicates via $or
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orQueries: Record<string, any>[] = [compositionQuery];
    if (chargeVariantQuery) orQueries.push(chargeVariantQuery);
    if (displayGemstonesQuery) orQueries.push(displayGemstonesQuery);

    const productQuery = orQueries.length > 1
      ? { $or: orQueries }
      : compositionQuery;

    const products = await Product.find(productQuery);

    let syncedCount = 0;

    for (const product of products) {
      let changed = false;

      // Helper to match by variantName or fallback to variantId
      const matchesVariant = (name: string | undefined, id: string | undefined) =>
        (name && name === variantName) || (id && id === variantId);

      // Update the composition entry with the new price (match by variantName or variantId)
      if (entityType === "metal") {
        for (const comp of product.metalComposition) {
          if (
            comp.metal.toString() === entityId &&
            matchesVariant(comp.variantName, comp.variantId?.toString())
          ) {
            comp.pricePerGram = price;
            comp.subtotal = Math.round(comp.weightInGrams * price * 100) / 100;
            // Fix stale variantId to the current variant's _id
            if (comp.variantId.toString() !== variantId) {
              comp.variantId = variantId as unknown as import("mongoose").Types.ObjectId;
            }
            // Backfill variantName if missing
            if (!comp.variantName) {
              comp.variantName = variantName;
            }
            changed = true;
          }
        }
      } else {
        for (const comp of product.gemstoneComposition) {
          if (
            comp.gemstone.toString() === entityId &&
            matchesVariant(comp.variantName, comp.variantId?.toString())
          ) {
            comp.pricePerCarat = price;
            comp.subtotal =
              Math.round(
                comp.weightInCarats * comp.quantity * price * 100
              ) / 100;
            // Fix stale variantId
            if (comp.variantId.toString() !== variantId) {
              comp.variantId = variantId as unknown as import("mongoose").Types.ObjectId;
            }
            // Backfill variantName if missing
            if (!comp.variantName) {
              comp.variantName = variantName;
            }
            changed = true;
          }
        }
      }

      // Fix stale chargeBasedOnVariant.variantId (match by name or ID)
      if (
        entityType === "metal" &&
        product.chargeBasedOnVariant?.metalId === entityId &&
        matchesVariant(product.chargeBasedOnVariant?.variantName, product.chargeBasedOnVariant?.variantId)
      ) {
        const cbvRef = product.chargeBasedOnVariant!;
        if (cbvRef.variantId !== variantId) {
          cbvRef.variantId = variantId;
        }
        if (!cbvRef.variantName) {
          cbvRef.variantName = variantName;
        }
        changed = true;
      }

      // Update displayGemstones prices and fix stale variantIds
      if (entityType === "gemstone" && product.displayGemstones?.length) {
        for (const dg of product.displayGemstones) {
          if (
            dg.gemstone.toString() === entityId &&
            matchesVariant(dg.variantName, dg.variantId?.toString())
          ) {
            dg.pricePerCarat = price;
            if (dg.variantId.toString() !== variantId) {
              dg.variantId = variantId as unknown as import("mongoose").Types.ObjectId;
            }
            if (!dg.variantName) {
              dg.variantName = variantName;
            }
            changed = true;
          }
        }
      }

      // Build chargeBasedOnVariant with current pricePerGram for the pricing engine
      // Match by variantName for resilience against stale IDs
      const cbv = product.chargeBasedOnVariant?.variantId
        ? {
            metalId: product.chargeBasedOnVariant.metalId,
            variantId: product.chargeBasedOnVariant.variantId,
            variantName: product.chargeBasedOnVariant.variantName,
            // If this IS the charge variant being updated, use the new price
            pricePerGram:
              entityType === "metal" &&
              product.chargeBasedOnVariant.metalId === entityId &&
              matchesVariant(product.chargeBasedOnVariant.variantName, product.chargeBasedOnVariant.variantId)
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

      if (changed || priceResult.totalPrice !== product.totalPrice) {
        await product.save();
        syncedCount++;
      }
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
