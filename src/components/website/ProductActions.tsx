"use client";

import { useState } from "react";
import { ShoppingCart, Phone, MessageCircle } from "lucide-react";
import { useCart } from "@/components/providers/CartProvider";
import type { ICartItem } from "@/types";

interface ProductActionsProps {
  product: {
    _id: string;
    name: string;
    slug: string;
    productCode: string;
    thumbnailImage: string;
    totalPrice: number;
    category?: { name: string } | null;
    metalComposition?: { variantName: string; weightInGrams: number }[];
    isOutOfStock?: boolean;
    sizes?: string[];
    colors?: string[];
  };
  whatsappMessage: string;
}

export function ProductActions({ product, whatsappMessage }: ProductActionsProps) {
  const { addItem } = useCart();

  const hasSizes = (product.sizes?.length ?? 0) > 0;
  const hasColors = (product.colors?.length ?? 0) > 0;

  const [selectedSize, setSelectedSize] = useState<string | null>(
    // Auto-select if only one option
    hasSizes && product.sizes!.length === 1 ? product.sizes![0] : null
  );
  const [selectedColor, setSelectedColor] = useState<string | null>(
    hasColors && product.colors!.length === 1 ? product.colors![0] : null
  );

  const missingSelection =
    (hasSizes && !selectedSize) || (hasColors && !selectedColor);

  const handleAdd = () => {
    if (product.isOutOfStock || missingSelection) return;

    const cartItemId = `${product._id}|${selectedSize ?? ""}|${selectedColor ?? ""}`;
    const item: ICartItem = {
      cartItemId,
      productId: product._id,
      name: product.name,
      slug: product.slug,
      productCode: product.productCode,
      thumbnailImage: product.thumbnailImage,
      totalPrice: product.totalPrice,
      quantity: 1,
      category: product.category?.name,
      metalComposition: product.metalComposition,
      selectedSize: selectedSize ?? undefined,
      selectedColor: selectedColor ?? undefined,
    };

    addItem(item);
  };

  return (
    <div className="mt-6 flex flex-col gap-4">
      {/* Size Selector */}
      {hasSizes && (
        <div>
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
            {product.sizes!.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setSelectedSize(size === selectedSize ? null : size)}
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
        <div>
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
            {product.colors!.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color === selectedColor ? null : color)}
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

      {/* CTA Buttons */}
      <div className="flex flex-col gap-3 mt-2">
        {product.isOutOfStock ? (
          <button
            disabled
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-charcoal-200 text-charcoal-400 cursor-not-allowed font-medium px-6 py-3.5 text-sm"
          >
            Out of Stock
          </button>
        ) : (
          <button
            onClick={handleAdd}
            disabled={missingSelection}
            title={
              missingSelection
                ? `Please select ${!selectedSize && hasSizes ? "a size" : "a color"} first`
                : "Add to cart"
            }
            className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold px-6 py-3.5 text-sm transition-all duration-200 ${
              missingSelection
                ? "bg-charcoal-200 text-charcoal-400 cursor-not-allowed"
                : "bg-gold-500 text-white shadow-sm hover:bg-gold-600 hover:shadow-md active:scale-[0.97]"
            }`}
          >
            <ShoppingCart className="h-4 w-4" />
            {missingSelection
              ? `Select ${!selectedSize && hasSizes ? "Size" : "Color"} First`
              : "Add to Cart"}
          </button>
        )}

        <div className="flex gap-3">
          <a
            href={`https://wa.me/919654148574?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-charcoal-200 px-6 py-3 text-sm font-medium text-charcoal-600 transition-colors hover:bg-charcoal-50"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
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
  );
}
