import Metal from "@/models/Metal";
import Gemstone from "@/models/Gemstone";
import { calculateProductPrice } from "@/lib/pricing";
import { roundToTen } from "@/lib/utils";
import type { IProduct, IMetalComposition, IGemstoneComposition } from "@/types";

type SelectedMetal = {
  metalId: string;
  variantId: string;
  weightInGrams: number;
};

type SelectedGem = {
  gemstoneId: string;
  variantId: string;
  weightInCarats: number;
  quantity: number;
};

/**
 * Server-side price for an order line. Never trusts client-sent prices —
 * looks up live metal/gem rates and recomputes via calculateProductPrice.
 */
export async function resolveLinePrice(
  product: IProduct,
  opts?: {
    selectedMetalVariants?: SelectedMetal[];
    selectedGemstone?: SelectedGem | null;
  }
): Promise<{
  unitPrice: number;
  metalComposition: IMetalComposition[];
  gemstoneComposition: IGemstoneComposition[];
  selectedMetalVariants?: {
    metalId: string;
    metalName: string;
    variantId: string;
    variantName: string;
    pricePerGram: number;
    weightInGrams: number;
  }[];
  selectedGemstone?: {
    gemstoneId: string;
    gemstoneName: string;
    variantId: string;
    variantName: string;
    weightInCarats: number;
    quantity: number;
    pricePerCarat: number;
  };
}> {
  let metalComposition = product.metalComposition as IMetalComposition[];
  let gemstoneComposition = product.gemstoneComposition as IGemstoneComposition[];
  let selectedMetalVariants:
    | {
        metalId: string;
        metalName: string;
        variantId: string;
        variantName: string;
        pricePerGram: number;
        weightInGrams: number;
      }[]
    | undefined;
  let selectedGemstone:
    | {
        gemstoneId: string;
        gemstoneName: string;
        variantId: string;
        variantName: string;
        weightInCarats: number;
        quantity: number;
        pricePerCarat: number;
      }
    | undefined;

  if (opts?.selectedMetalVariants?.length) {
    const metals = await Metal.find({
      _id: { $in: opts.selectedMetalVariants.map((m) => m.metalId) },
      isActive: true,
    }).lean();

    const rebuilt: IMetalComposition[] = [];
    selectedMetalVariants = [];

    for (const sel of opts.selectedMetalVariants) {
      const metal = metals.find((m) => String(m._id) === sel.metalId);
      const variant = metal?.variants.find((v) => String(v._id) === sel.variantId);
      if (!metal || !variant) {
        throw new Error("Invalid metal variant selection");
      }
      const weightInGrams =
        sel.weightInGrams > 0
          ? sel.weightInGrams
          : product.metalComposition.find((c) => {
              const mid =
                typeof c.metal === "object" && c.metal !== null && "_id" in c.metal
                  ? String((c.metal as { _id: unknown })._id)
                  : String(c.metal);
              return mid === sel.metalId;
            })?.weightInGrams ?? 0;

      rebuilt.push({
        metal: metal._id,
        variantId: variant._id,
        variantName: variant.name,
        weightInGrams,
        pricePerGram: variant.pricePerGram,
        subtotal: weightInGrams * variant.pricePerGram,
      });
      selectedMetalVariants.push({
        metalId: String(metal._id),
        metalName: metal.name,
        variantId: String(variant._id),
        variantName: variant.name,
        pricePerGram: variant.pricePerGram,
        weightInGrams,
      });
    }
    metalComposition = rebuilt;
  }

  if (opts?.selectedGemstone) {
    const gem = await Gemstone.findOne({
      _id: opts.selectedGemstone.gemstoneId,
      isActive: true,
    }).lean();
    const variant = gem?.variants.find(
      (v) => String(v._id) === opts.selectedGemstone!.variantId
    );
    if (!gem || !variant) {
      throw new Error("Invalid gemstone selection");
    }
    const weightInCarats = opts.selectedGemstone.weightInCarats;
    const quantity = opts.selectedGemstone.quantity || 1;
    gemstoneComposition = [
      {
        gemstone: gem._id,
        variantId: variant._id,
        variantName: variant.name,
        weightInCarats,
        quantity,
        pricePerCarat: variant.pricePerCarat,
        subtotal: weightInCarats * quantity * variant.pricePerCarat,
      },
    ];
    selectedGemstone = {
      gemstoneId: String(gem._id),
      gemstoneName: gem.name,
      variantId: String(variant._id),
      variantName: variant.name,
      weightInCarats,
      quantity,
      pricePerCarat: variant.pricePerCarat,
    };
  }

  const priced = calculateProductPrice({
    metalComposition,
    gemstoneComposition,
    makingCharges: product.makingCharges,
    wastageCharges: product.wastageCharges,
    gstPercentage: product.gstPercentage,
    otherCharges: product.otherCharges,
    chargeBasedOnVariant: product.chargeBasedOnVariant,
  });

  return {
    unitPrice: roundToTen(priced.totalPrice),
    metalComposition,
    gemstoneComposition,
    selectedMetalVariants,
    selectedGemstone,
  };
}

export function shippingForSubtotal(subtotal: number): number {
  return subtotal >= 50000 ? 0 : 500;
}
