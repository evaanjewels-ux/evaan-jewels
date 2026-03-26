"use client";

import { useState } from "react";
import { Phone, MessageCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

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
  const hasSizes = (product.sizes?.length ?? 0) > 0;
  const hasColors = (product.colors?.length ?? 0) > 0;

  const [selectedSize, setSelectedSize] = useState<string | null>(
    hasSizes && product.sizes!.length === 1 ? product.sizes![0] : null
  );
  const [selectedColor, setSelectedColor] = useState<string | null>(
    hasColors && product.colors!.length === 1 ? product.colors![0] : null
  );

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
        <a
          href={`https://wa.me/919654148574?text=${whatsappMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#25D366] text-white font-semibold px-6 py-3.5 text-sm shadow-sm transition-all duration-200 hover:bg-[#20bd5a] hover:shadow-md active:scale-[0.97]"
        >
          <MessageCircle className="h-4 w-4" />
          {product.isOutOfStock
            ? "Out of Stock"
            : `Enquire on WhatsApp — ${formatCurrency(product.totalPrice)}`}
        </a>

        <a
          href="tel:+919654148574"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-charcoal-200 px-6 py-3 text-sm font-medium text-charcoal-600 transition-colors hover:bg-charcoal-50"
        >
          <Phone className="h-4 w-4" />
          Call Us
        </a>
      </div>
    </div>
  );
}
