"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface PriceBreakdownProps {
  product: {
    metalComposition: {
      variantName: string;
      weightInGrams: number;
      pricePerGram: number;
      subtotal: number;
    }[];
    gemstoneComposition: {
      variantName: string;
      weightInCarats: number;
      quantity: number;
      pricePerCarat: number;
      subtotal: number;
    }[];
    metalTotal: number;
    gemstoneTotal: number;
    makingChargeAmount: number;
    wastageChargeAmount: number;
    otherCharges: { name: string; amount: number }[];
    otherChargesTotal: number;
    subtotal: number;
    gstPercentage: number;
    gstAmount: number;
    totalPrice: number;
  };
}

export function PriceBreakdown({ product }: PriceBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="rounded-xl border border-charcoal-100 bg-white">
      {/* Total Price */}
      <div className="flex items-center justify-between p-4 sm:p-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-charcoal-400">
            Total Price
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-gold-700 sm:text-3xl">
            {formatCurrency(product.totalPrice)}
          </p>
          <p className="mt-0.5 text-xs text-charcoal-400">
            Inclusive of {product.gstPercentage}% GST
          </p>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 rounded-lg border border-charcoal-200 px-3 py-2 text-xs font-medium text-charcoal-500 transition-colors hover:bg-charcoal-50"
        >
          {isExpanded ? "Hide" : "Show"} Breakdown
          {isExpanded ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Detailed Breakdown */}
      {isExpanded && (
        <div className="border-t border-charcoal-100 p-4 sm:p-5">
          <div className="space-y-4 text-sm">
            {/* Metal Composition */}
            {product.metalComposition.length > 0 && (
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-charcoal-400">
                  Metal Composition
                </h4>
                <div className="space-y-1.5">
                  {product.metalComposition.map((mc, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-charcoal-500">
                        {mc.variantName} — {mc.weightInGrams}g × {formatCurrency(mc.pricePerGram)}/g
                      </span>
                      <span className="font-mono font-medium text-charcoal-700">
                        {formatCurrency(mc.subtotal)}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between border-t border-dashed border-charcoal-100 pt-1.5">
                    <span className="font-medium text-charcoal-600">Metal Total</span>
                    <span className="font-mono font-semibold text-charcoal-700">
                      {formatCurrency(product.metalTotal)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Gemstone Composition */}
            {product.gemstoneComposition.length > 0 && (
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-charcoal-400">
                  Gemstone Composition
                </h4>
                <div className="space-y-1.5">
                  {product.gemstoneComposition.map((gc, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-charcoal-500">
                        {gc.variantName} — {gc.weightInCarats}ct × {gc.quantity} × {formatCurrency(gc.pricePerCarat)}/ct
                      </span>
                      <span className="font-mono font-medium text-charcoal-700">
                        {formatCurrency(gc.subtotal)}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between border-t border-dashed border-charcoal-100 pt-1.5">
                    <span className="font-medium text-charcoal-600">Gemstone Total</span>
                    <span className="font-mono font-semibold text-charcoal-700">
                      {formatCurrency(product.gemstoneTotal)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Charges */}
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-charcoal-400">
                Charges
              </h4>
              <div className="space-y-1.5">
                {product.makingChargeAmount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-charcoal-500">Making Charges</span>
                    <span className="font-mono font-medium text-charcoal-700">
                      {formatCurrency(product.makingChargeAmount)}
                    </span>
                  </div>
                )}
                {product.wastageChargeAmount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-charcoal-500">Wastage Charges</span>
                    <span className="font-mono font-medium text-charcoal-700">
                      {formatCurrency(product.wastageChargeAmount)}
                    </span>
                  </div>
                )}
                {product.otherCharges.map((oc, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-charcoal-500">{oc.name}</span>
                    <span className="font-mono font-medium text-charcoal-700">
                      {formatCurrency(oc.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="border-t border-charcoal-200 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-charcoal-500">Subtotal</span>
                <span className="font-mono font-medium text-charcoal-700">
                  {formatCurrency(product.subtotal)}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-charcoal-500">GST ({product.gstPercentage}%)</span>
                <span className="font-mono font-medium text-charcoal-700">
                  {formatCurrency(product.gstAmount)}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-charcoal-200 pt-3">
                <span className="text-base font-semibold text-charcoal-700">Total</span>
                <span className="font-mono text-lg font-bold text-gold-700">
                  {formatCurrency(product.totalPrice)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
