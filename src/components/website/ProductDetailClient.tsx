"use client";

import { useState, useMemo, useCallback } from "react";
import { Phone, MessageCircle, Heart } from "lucide-react";
import { useWishlist } from "@/components/providers/WishlistProvider";
import { ProductGallery } from "./ProductGallery";
import { PriceBreakdown } from "./PriceBreakdown";
import { formatCurrency } from "@/lib/utils";
import type { IMetalComposition, IGemstoneComposition } from "@/types";
import { calculateProductPrice } from "@/lib/pricing";

/* ─── Metal variant info from the API ─── */
interface AvailableVariant {
  _id: string;
  name: string;
  purity: number;
  pricePerGram: number;
}

interface AvailableMetal {
  _id: string;
  name: string;
  variants: AvailableVariant[];
}

/* ─── Gemstone variant info from the API ─── */
interface AvailableGemstoneVariant {
  _id: string;
  name: string;
  pricePerCarat: number;
}

interface AvailableGemstone {
  _id: string;
  name: string;
  variants: AvailableGemstoneVariant[];
}

/* ─── Display gemstone option from the server ─── */
interface DisplayGemstoneOption {
  gemstone: string;
  variantId: string;
  variantName: string;
  weightInCarats: number;
  quantity: number;
  pricePerCarat: number;
}

/* ─── Product data passed from the server page ─── */
interface ProductData {
  _id: string;
  name: string;
  slug: string;
  productCode: string;
  description: string;
  gender: string;
  images: string[];
  thumbnailImage: string;
  colorImages: { color: string; images: string[] }[];
  totalPrice: number;
  isOutOfStock: boolean;
  isNewArrival: boolean;
  isFeatured: boolean;
  hallmarkCertified?: boolean;
  videos?: { type: "upload" | "external"; url: string; thumbnailUrl?: string }[];
  category?: { name: string; slug: string } | null;
  metalComposition: {
    metal: string | { _id: string; name: string };
    variantId: string;
    variantName: string;
    weightInGrams: number;
    pricePerGram: number;
    subtotal: number;
    wastageCharges?: { type: "fixed" | "percentage" | "per_gram"; value: number };
  }[];
  gemstoneComposition: {
    gemstone: string | { _id: string; name: string };
    variantId: string;
    variantName: string;
    weightInCarats: number;
    quantity: number;
    pricePerCarat: number;
    subtotal: number;
    wastageCharges?: { type: "fixed" | "percentage" | "per_gram"; value: number };
  }[];
  makingCharges: { type: "fixed" | "percentage" | "per_gram"; value: number };
  wastageCharges: { type: "fixed" | "percentage" | "per_gram"; value: number };
  gstPercentage: number;
  otherCharges: { name: string; amount: number }[];
  metalTotal: number;
  gemstoneTotal: number;
  makingChargeAmount: number;
  wastageChargeAmount: number;
  otherChargesTotal: number;
  subtotal: number;
  gstAmount: number;
  grossWeight: number;
  netWeight: number;
  sizes: string[];
  colors: string[];
  size?: string;
  chargeBasedOnVariant?: {
    metalId: string;
    variantId: string;
    variantName: string;
  };
}

interface ProductDetailClientProps {
  product: ProductData;
  availableMetals: AvailableMetal[];
  variantWeightMap: Record<string, number>;
  availableGemstones: AvailableGemstone[];
  displayGemstoneOptions: DisplayGemstoneOption[];
  chargeVariantPricePerGram?: number;
}

/* ─── Helper: resolve metal ref _id ─── */
function getMetalId(metalRef: string | { _id: string; name: string }): string {
  return typeof metalRef === "object" && metalRef !== null
    ? metalRef._id
    : metalRef;
}

export function ProductDetailClient({
  product,
  availableMetals,
  variantWeightMap,
  availableGemstones,
  displayGemstoneOptions,
  chargeVariantPricePerGram,
}: ProductDetailClientProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();

  // ─── Selection state ─────────────────────────
  const hasSizes = (product.sizes?.length ?? 0) > 0;
  const hasColors = (product.colors?.length ?? 0) > 0;

  const [selectedSize, setSelectedSize] = useState<string | null>(
    hasSizes && product.sizes.length === 1 ? product.sizes[0] : null
  );
  const [selectedColor, setSelectedColor] = useState<string | null>(
    hasColors && product.colors.length === 1 ? product.colors[0] : null
  );

  // ─── Metal variant selection state ──────────────
  // For each metal in the composition, track the selected variant
  // Default: the variant already used in the product's composition
  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, { variantId: string; variantName: string; pricePerGram: number; weightInGrams: number }>
  >(() => {
    const initial: Record<string, { variantId: string; variantName: string; pricePerGram: number; weightInGrams: number }> = {};
    product.metalComposition.forEach((mc) => {
      const metalId = getMetalId(mc.metal);
      initial[metalId] = {
        variantId: mc.variantId,
        variantName: mc.variantName,
        pricePerGram: mc.pricePerGram,
        weightInGrams: mc.weightInGrams,
      };
    });
    return initial;
  });

  // ─── Gemstone selection state ──────────────
  // null means use the default gemstoneComposition
  const hasGemstoneOptions = displayGemstoneOptions.length > 0;
  const [selectedGemstone, setSelectedGemstone] = useState<DisplayGemstoneOption | null>(null);

  // ─── Compute metals that have switchable variants ──────
  const switchableMetals = useMemo(() => {
    return product.metalComposition
      .map((mc) => {
        const metalId = getMetalId(mc.metal);
        const metalData = availableMetals.find((m) => m._id === metalId);
        if (!metalData || metalData.variants.length <= 1) return null;
        return {
          metalId,
          metalName: metalData.name,
          variants: metalData.variants,
          weightInGrams: mc.weightInGrams,
        };
      })
      .filter(Boolean) as {
      metalId: string;
      metalName: string;
      variants: AvailableVariant[];
      weightInGrams: number;
    }[];
  }, [product.metalComposition, availableMetals]);

  const hasVariantSwitcher = switchableMetals.length > 0;

  // ─── Price recalculation ────────────────────────
  const calculatedPrices = useMemo(() => {
    // Build updated metalComposition with selected variant prices and weights
    const updatedMetal: IMetalComposition[] = product.metalComposition.map((mc) => {
      const metalId = getMetalId(mc.metal);
      const sel = selectedVariants[metalId];
      const pricePerGram = sel ? sel.pricePerGram : mc.pricePerGram;
      // Guard: if selected weight is 0 (invalid), fall back to composition weight
      const weightInGrams = (sel && sel.weightInGrams > 0) ? sel.weightInGrams : mc.weightInGrams;
      return {
        metal: metalId as unknown as import("mongoose").Types.ObjectId,
        variantId: (sel?.variantId || mc.variantId) as unknown as import("mongoose").Types.ObjectId,
        variantName: sel?.variantName || mc.variantName,
        weightInGrams,
        pricePerGram,
        subtotal: weightInGrams * pricePerGram,
        wastageCharges: mc.wastageCharges,
      };
    });

    // Use selected gemstone or default composition
    const gemComp: IGemstoneComposition[] = selectedGemstone
      ? [{
          gemstone: selectedGemstone.gemstone as unknown as import("mongoose").Types.ObjectId,
          variantId: selectedGemstone.variantId as unknown as import("mongoose").Types.ObjectId,
          variantName: selectedGemstone.variantName,
          weightInCarats: selectedGemstone.weightInCarats,
          quantity: selectedGemstone.quantity,
          pricePerCarat: selectedGemstone.pricePerCarat,
          subtotal: selectedGemstone.weightInCarats * selectedGemstone.quantity * selectedGemstone.pricePerCarat,
          wastageCharges: product.gemstoneComposition[0]?.wastageCharges,
        }]
      : product.gemstoneComposition.map((gc) => ({
          gemstone: (typeof gc.gemstone === "object" ? gc.gemstone._id : gc.gemstone) as unknown as import("mongoose").Types.ObjectId,
          variantId: gc.variantId as unknown as import("mongoose").Types.ObjectId,
          variantName: gc.variantName,
          weightInCarats: gc.weightInCarats,
          quantity: gc.quantity,
          pricePerCarat: gc.pricePerCarat,
          subtotal: gc.weightInCarats * gc.quantity * gc.pricePerCarat,
          wastageCharges: gc.wastageCharges,
        }));

    return calculateProductPrice({
      metalComposition: updatedMetal,
      gemstoneComposition: gemComp,
      makingCharges: product.makingCharges,
      wastageCharges: product.wastageCharges,
      gstPercentage: product.gstPercentage,
      otherCharges: product.otherCharges,
      chargeBasedOnVariant: product.chargeBasedOnVariant
        ? {
            ...product.chargeBasedOnVariant,
            pricePerGram: (() => {
              // Look up across ALL variants in available metals (not just displayed ones)
              const m = availableMetals.find(
                (am) => am._id === product.chargeBasedOnVariant!.metalId
              );
              const fromFiltered = m?.variants.find(
                (v) => v._id === product.chargeBasedOnVariant!.variantId
              )?.pricePerGram;
              // If the charge-based variant isn't in the filtered list,
              // try to find its price from the currently selected variant
              // of the same metal, or fall back to the server-provided price.
              if (fromFiltered !== undefined) return fromFiltered;
              if (chargeVariantPricePerGram !== undefined) return chargeVariantPricePerGram;
              const sel = selectedVariants[product.chargeBasedOnVariant!.metalId];
              return sel?.pricePerGram ?? product.metalComposition.find(
                (mc) => getMetalId(mc.metal) === product.chargeBasedOnVariant!.metalId
              )?.pricePerGram;
            })(),
          }
        : undefined,
    });
  }, [product, selectedVariants, selectedGemstone, availableMetals, chargeVariantPricePerGram]);

  // ─── Dynamic metal composition for display ─────
  const displayMetalComposition = useMemo(() => {
    return product.metalComposition.map((mc) => {
      const metalId = getMetalId(mc.metal);
      const sel = selectedVariants[metalId];
      const pricePerGram = sel ? sel.pricePerGram : mc.pricePerGram;
      // Guard: if selected weight is 0, fall back to composition weight
      const weightInGrams = (sel && sel.weightInGrams > 0) ? sel.weightInGrams : mc.weightInGrams;
      return {
        variantName: sel?.variantName || mc.variantName,
        weightInGrams,
        pricePerGram,
        subtotal: weightInGrams * pricePerGram,
      };
    });
  }, [product.metalComposition, selectedVariants]);

  // ─── Dynamic gemstone composition for display ─────
  const displayGemstoneComposition = useMemo(() => {
    if (selectedGemstone) {
      return [{
        variantName: selectedGemstone.variantName,
        weightInCarats: selectedGemstone.weightInCarats,
        quantity: selectedGemstone.quantity,
        pricePerCarat: selectedGemstone.pricePerCarat,
        subtotal: selectedGemstone.weightInCarats * selectedGemstone.quantity * selectedGemstone.pricePerCarat,
      }];
    }
    return product.gemstoneComposition.map((gc) => ({
      variantName: gc.variantName,
      weightInCarats: gc.weightInCarats,
      quantity: gc.quantity,
      pricePerCarat: gc.pricePerCarat,
      subtotal: gc.weightInCarats * gc.quantity * gc.pricePerCarat,
    }));
  }, [product.gemstoneComposition, selectedGemstone]);

  // ─── Gallery images (filtered by color) ─────────
  const galleryImages = useMemo(() => {
    const filterValid = (urls: string[]) => urls.filter((u) => u && u.trim().length > 0);

    if (selectedColor && product.colorImages?.length > 0) {
      const colorEntry = product.colorImages.find(
        (ci) => ci.color === selectedColor
      );
      if (colorEntry) {
        const valid = filterValid(colorEntry.images);
        if (valid.length > 0) return valid;
      }
    }
    // Fallback to general images, filtering out empty strings
    const validImages = filterValid(product.images || []);
    return validImages.length > 0
      ? validImages
      : [product.thumbnailImage].filter(Boolean);
  }, [selectedColor, product.colorImages, product.images, product.thumbnailImage]);

  // ─── Variant change handler ─────────────────────
  const handleVariantChange = useCallback(
    (metalId: string, variant: AvailableVariant) => {
      // Get weight for this variant from the weight map, fall back to composition weight.
      // Use || instead of ?? so that a 0 weight in the map falls through to the
      // composition weight (a weight of 0g is never valid for jewelry).
      const mc = product.metalComposition.find((c) => getMetalId(c.metal) === metalId);
      const mapWeight = variantWeightMap[variant._id];
      const weight = (mapWeight && mapWeight > 0) ? mapWeight : (mc?.weightInGrams || 0);
      setSelectedVariants((prev) => ({
        ...prev,
        [metalId]: {
          variantId: variant._id,
          variantName: variant.name,
          pricePerGram: variant.pricePerGram,
          weightInGrams: weight,
        },
      }));
    },
    [variantWeightMap, product.metalComposition]
  );

  // ─── Gemstone change handler ─────────────────────
  const handleGemstoneChange = useCallback(
    (option: DisplayGemstoneOption | null) => {
      if (!option) {
        setSelectedGemstone(null);
        return;
      }
      // Look up latest pricePerCarat from availableGemstones
      const gemData = availableGemstones.find((g) => g._id === option.gemstone);
      const varData = gemData?.variants.find((v) => v._id === option.variantId);
      setSelectedGemstone({
        ...option,
        pricePerCarat: varData?.pricePerCarat ?? option.pricePerCarat,
      });
    },
    [availableGemstones]
  );

  // ─── Dynamic WhatsApp enquiry message ────────────────────
  const dynamicWhatsappMessage = useMemo(() => {
    const lines: string[] = [
      `Hi Evaan Jewels! I'm interested in:`,
      `Product: ${product.name} (${product.productCode})`,
    ];

    // Metal variants selected
    displayMetalComposition.forEach((mc) => {
      const metalRef = product.metalComposition.find(
        (c) => c.variantName === mc.variantName || c.variantId === mc.variantName
      );
      const metalName =
        metalRef && typeof metalRef.metal === "object"
          ? (metalRef.metal as { _id: string; name: string }).name
          : availableMetals.find((m) =>
              product.metalComposition.some(
                (c) => getMetalId(c.metal) === m._id && c.variantName === mc.variantName
              )
            )?.name || "Metal";
      lines.push(`${metalName}: ${mc.variantName} — ${mc.weightInGrams}g`);
    });

    // Gemstone selected
    if (selectedGemstone) {
      const gemData = availableGemstones.find((g) => g._id === selectedGemstone.gemstone);
      const gemLabel = gemData?.name
        ? `${gemData.name}${gemData.name !== selectedGemstone.variantName ? ` (${selectedGemstone.variantName})` : ""}`
        : selectedGemstone.variantName;
      lines.push(`Gemstone: ${gemLabel} — ${selectedGemstone.weightInCarats}ct × ${selectedGemstone.quantity}`);
    } else if (displayGemstoneComposition.length > 0 && displayGemstoneComposition[0].variantName) {
      lines.push(`Gemstone: ${displayGemstoneComposition[0].variantName} — ${displayGemstoneComposition[0].weightInCarats}ct`);
    }

    if (selectedSize) lines.push(`Size: ${selectedSize}`);
    if (selectedColor) lines.push(`Color: ${selectedColor}`);

    lines.push(`Price: ${formatCurrency(calculatedPrices.totalPrice)}`);
    lines.push(`\nPlease share more details. Thank you!`);

    return encodeURIComponent(lines.join("\n"));
  }, [
    product.name,
    product.productCode,
    product.metalComposition,
    displayMetalComposition,
    displayGemstoneComposition,
    selectedGemstone,
    availableMetals,
    availableGemstones,
    selectedSize,
    selectedColor,
    calculatedPrices.totalPrice,
  ]);

  // ─── Wishlist ─────────────────────────────────────
  const wishlistItem = {
    productId: product._id,
    name: product.name,
    slug: product.slug,
    thumbnailImage: product.thumbnailImage,
    totalPrice: product.totalPrice,
    category: product.category?.name,
  };

  const inWishlist = isInWishlist(product._id);

  return (
    <>
    <div className="grid min-w-0 gap-8 lg:grid-cols-2 lg:gap-12 pb-[calc(7.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
      {/* Gallery */}
      <div className="min-w-0">
        <ProductGallery
          images={galleryImages}
          productName={product.name}
          videos={product.videos}
        />
      </div>

      {/* Details */}
      <div className="flex min-w-0 flex-col">
        {/* Price */}
        <div className="mt-4">
          <PriceBreakdown
            product={{
              metalComposition: displayMetalComposition,
              gemstoneComposition: displayGemstoneComposition,
              metalTotal: calculatedPrices.metalTotal,
              gemstoneTotal: calculatedPrices.gemstoneTotal,
              makingChargeAmount: calculatedPrices.makingChargeAmount,
              wastageChargeAmount: calculatedPrices.wastageChargeAmount,
              otherCharges: product.otherCharges,
              otherChargesTotal: calculatedPrices.otherChargesTotal,
              subtotal: calculatedPrices.subtotal,
              gstPercentage: product.gstPercentage,
              gstAmount: calculatedPrices.gstAmount,
              totalPrice: calculatedPrices.totalPrice,
            }}
          />
        </div>

        {/* Metal Variant Switcher */}
        {hasVariantSwitcher && (
          <div className="mt-6 space-y-4">
            <h3 className="text-sm font-semibold text-charcoal-600">
              Metal Variant
            </h3>
            {switchableMetals.map(({ metalId, metalName, variants }) => {
              const selected = selectedVariants[metalId];
              return (
                <div key={metalId}>
                  <p className="text-xs text-charcoal-400 mb-2">
                    {metalName}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {variants.map((v) => {
                      const isActive = selected?.variantId === v._id;
                      return (
                        <button
                          key={v._id}
                          type="button"
                          onClick={() => handleVariantChange(metalId, v)}
                          className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition-all duration-150 ${
                            isActive
                              ? "border-gold-500 bg-gold-500 text-white shadow-sm"
                              : "border-charcoal-200 bg-white text-charcoal-700 hover:border-gold-400 hover:bg-gold-50"
                          }`}
                        >
                          <span>{v.name}</span>
                          <span className="ml-1.5 text-xs opacity-70">
                            ({v.purity}%)
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Gemstone Switcher */}
        {hasGemstoneOptions && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-charcoal-600 mb-2">
              Gemstone
            </h3>
            <div className="flex flex-wrap gap-2">
              {/* Default gemstone option */}
              {product.gemstoneComposition.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleGemstoneChange(null)}
                  className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition-all duration-150 ${
                    selectedGemstone === null
                      ? "border-gold-500 bg-gold-500 text-white shadow-sm"
                      : "border-charcoal-200 bg-white text-charcoal-700 hover:border-gold-400 hover:bg-gold-50"
                  }`}
                >
                  {product.gemstoneComposition[0].variantName}
                  <span className="ml-1.5 text-xs opacity-70">
                    ({product.gemstoneComposition[0].weightInCarats}ct)
                  </span>
                </button>
              )}
              {/* Alternative gemstone options */}
              {displayGemstoneOptions.map((option, idx) => {
                const gemData = availableGemstones.find((g) => g._id === option.gemstone);
                const isActive = selectedGemstone?.variantId === option.variantId && selectedGemstone?.gemstone === option.gemstone;
                return (
                  <button
                    key={`${option.gemstone}-${option.variantId}-${idx}`}
                    type="button"
                    onClick={() => handleGemstoneChange(option)}
                    className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? "border-gold-500 bg-gold-500 text-white shadow-sm"
                        : "border-charcoal-200 bg-white text-charcoal-700 hover:border-gold-400 hover:bg-gold-50"
                    }`}
                  >
                    {gemData?.name || option.variantName}
                    {gemData?.name && gemData.name !== option.variantName && (
                      <span className="ml-1 text-xs opacity-70">({option.variantName})</span>
                    )}
                    <span className="ml-1.5 text-xs opacity-70">
                      ({option.weightInCarats}ct)
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Size Selector */}
        {hasSizes && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-semibold text-charcoal-600">Size</h3>
              {selectedSize ? (
                <span className="text-xs font-medium text-gold-600 bg-gold-50 border border-gold-200 rounded-full px-2 py-0.5">
                  {selectedSize}
                </span>
              ) : (
                <span className="text-xs text-rose-500">— please select</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() =>
                    setSelectedSize(size === selectedSize ? null : size)
                  }
                  className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition-all duration-150 ${
                    selectedSize === size
                      ? "border-gold-500 bg-gold-500 text-white shadow-sm"
                      : "border-charcoal-200 bg-white text-charcoal-700 hover:border-gold-400 hover:bg-gold-50"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Color Selector */}
        {hasColors && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-semibold text-charcoal-600">Color</h3>
              {selectedColor ? (
                <span className="text-xs font-medium text-gold-600 bg-gold-50 border border-gold-200 rounded-full px-2 py-0.5">
                  {selectedColor}
                </span>
              ) : (
                <span className="text-xs text-rose-500">— please select</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {product.colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() =>
                    setSelectedColor(color === selectedColor ? null : color)
                  }
                  className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition-all duration-150 ${
                    selectedColor === color
                      ? "border-gold-500 bg-gold-500 text-white shadow-sm"
                      : "border-charcoal-200 bg-white text-charcoal-700 hover:border-gold-400 hover:bg-gold-50"
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CTA Buttons — hidden on mobile (shown in sticky bar instead) */}
        <div className="mt-6 hidden md:flex flex-col gap-3">
          {/* Primary: WhatsApp enquiry with dynamic message containing selected variants */}
          <a
            href={`https://wa.me/919654148574?text=${dynamicWhatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#25D366] text-white font-semibold px-6 py-3.5 text-sm shadow-sm transition-all duration-200 hover:bg-[#20bd5a] hover:shadow-md active:scale-[0.97]"
          >
            <MessageCircle className="h-4 w-4" />
            Enquire on WhatsApp — {product.isOutOfStock ? "Out of Stock" : formatCurrency(calculatedPrices.totalPrice)}
          </a>

          <div className="flex gap-3">
            <button
              onClick={() => toggleWishlist(wishlistItem)}
              className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                inWishlist
                  ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                  : "border-charcoal-200 text-charcoal-600 hover:bg-charcoal-50"
              }`}
              title={inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
            >
              <Heart
                className={`h-4 w-4 ${inWishlist ? "fill-current" : ""}`}
              />
            </button>
            <a
              href="tel:+919654148574"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-charcoal-200 px-6 py-3 text-sm font-medium text-charcoal-600 transition-colors hover:bg-charcoal-50"
            >
              <Phone className="h-4 w-4" />
              Call Us
            </a>
          </div>
        </div>
      </div>
    </div>

    {/* ── Sticky Mobile CTA Bar — sits above MobileBottomNav (≤58px + safe area) ── */}
    <div className="fixed left-0 right-0 z-40 md:hidden bottom-[calc(58px+env(safe-area-inset-bottom,0px))]">
      {/* Backdrop blur frosted glass bar */}
      <div className="bg-white/90 backdrop-blur-md border-t border-gold-100 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] px-4 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          {/* WhatsApp */}
          <a
            href={`https://wa.me/919654148574?text=${dynamicWhatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] text-white font-semibold px-4 py-3.5 text-sm shadow-sm active:scale-[0.97] transition-transform"
          >
            <MessageCircle className="h-4 w-4 shrink-0" />
            <span className="truncate">WhatsApp Enquiry</span>
          </a>
          {/* Call Us */}
          <a
            href="tel:+919654148574"
            className="flex items-center justify-center gap-2 rounded-xl border border-charcoal-200 bg-white px-4 py-3.5 text-sm font-semibold text-charcoal-700 shadow-sm active:scale-[0.97] transition-transform"
          >
            <Phone className="h-4 w-4 shrink-0" />
            <span>Call Us</span>
          </a>
        </div>
      </div>
    </div>
    </>
  );
}
