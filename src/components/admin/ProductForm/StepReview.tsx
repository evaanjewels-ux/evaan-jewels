"use client";

import { Pencil, Video } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PriceDisplay } from "@/components/ui/PriceDisplay";
import { formatCurrency } from "@/lib/utils";
import type { ProductFormData } from "./index";
import type { MetalEntry, GemstoneEntry } from "./StepComposition";

interface PriceBreakdown {
  metalTotal: number;
  gemstoneTotal: number;
  makingChargeAmount: number;
  wastageChargeAmount: number;
  otherChargesTotal: number;
  subtotal: number;
  gstAmount: number;
  totalPrice: number;
}

interface StepReviewProps {
  formData: ProductFormData;
  categories: Array<{ _id: string; name: string }>;
  prices: PriceBreakdown;
  onBack: () => void;
  onGoTo: (step: number) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  mode: "create" | "edit";
}

export function StepReview({
  formData,
  categories,
  prices,
  onBack,
  onGoTo,
  onSubmit,
  isSubmitting,
  mode,
}: StepReviewProps) {
  const categoryName =
    categories.find((c) => c._id === formData.basic.category)?.name || "—";

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <div className="p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-charcoal-700">
              Basic Information
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onGoTo(0)}
            >
              <Pencil size={14} />
              Edit
            </Button>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            <ReviewField label="Product Name" value={formData.basic.name} />
            <ReviewField label="Category" value={categoryName} />
            <ReviewField
              label="Gender"
              value={formData.basic.gender.charAt(0).toUpperCase() + formData.basic.gender.slice(1)}
            />
            <ReviewField
              label="Description"
              value={
                formData.basic.description.length > 100
                  ? formData.basic.description.slice(0, 100) + "..."
                  : formData.basic.description
              }
              full
            />
          </dl>
        </div>
      </Card>

      {/* Price Breakdown */}
      <Card>
        <div className="p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-charcoal-700">
              Price Breakdown
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onGoTo(1)}
            >
              <Pencil size={14} />
              Edit
            </Button>
          </div>

          <div className="space-y-3">
            {/* Metal Composition */}
            {formData.composition.metals.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-charcoal-500 mb-2">
                  Metal Composition
                </h3>
                {formData.composition.metals.map((m: MetalEntry, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm py-1.5"
                  >
                    <span className="text-charcoal-600">
                      {m.metalName} {m.variantName} — {m.weightInGrams}g @{" "}
                      {formatCurrency(m.pricePerGram)}/g
                    </span>
                    <span className="font-mono text-charcoal-700">
                      {formatCurrency(m.weightInGrams * m.pricePerGram)}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between text-sm font-medium border-t border-charcoal-100 pt-1.5 mt-1">
                  <span className="text-charcoal-600">Metal Total</span>
                  <span className="font-mono text-charcoal-700">
                    {formatCurrency(prices.metalTotal)}
                  </span>
                </div>
              </div>
            )}

            {/* Gemstone Composition */}
            {formData.composition.gemstones.length > 0 && (
              <div className="pt-2">
                <h3 className="text-sm font-medium text-charcoal-500 mb-2">
                  Gemstone Composition
                </h3>
                {formData.composition.gemstones.map((g: GemstoneEntry, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm py-1.5"
                  >
                    <span className="text-charcoal-600">
                      {g.gemstoneName} {g.variantName} — {g.weightInCarats}ct
                      {g.quantity > 1 ? ` x${g.quantity}` : ""} @{" "}
                      {formatCurrency(g.pricePerCarat)}/ct
                    </span>
                    <span className="font-mono text-charcoal-700">
                      {formatCurrency(
                        g.weightInCarats * g.quantity * g.pricePerCarat
                      )}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between text-sm font-medium border-t border-charcoal-100 pt-1.5 mt-1">
                  <span className="text-charcoal-600">Gemstone Total</span>
                  <span className="font-mono text-charcoal-700">
                    {formatCurrency(prices.gemstoneTotal)}
                  </span>
                </div>
              </div>
            )}

            {/* Charges */}
            <div className="pt-2 border-t border-charcoal-100">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-medium text-charcoal-500">
                  Charges
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onGoTo(2)}
                >
                  <Pencil size={12} />
                </Button>
              </div>
              {prices.makingChargeAmount > 0 && (
                <div className="flex items-center justify-between text-sm py-1">
                  <span className="text-charcoal-600">
                    Making Charges (
                    {formData.charges.makingCharges.type === "percentage"
                      ? `${formData.charges.makingCharges.value}%`
                      : "fixed"}
                    )
                    {formData.charges.chargeBasedOnVariant && (
                      <span className="text-xs text-gold-600 ml-1">
                        @ {formData.charges.chargeBasedOnVariant.variantName} rate
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-charcoal-700">
                    {formatCurrency(prices.makingChargeAmount)}
                  </span>
                </div>
              )}
              {prices.wastageChargeAmount > 0 && (
                <div className="flex items-center justify-between text-sm py-1">
                  <span className="text-charcoal-600">
                    Wastage Charges (per-material)
                    {formData.charges.chargeBasedOnVariant && (
                      <span className="text-xs text-gold-600 ml-1">
                        @ {formData.charges.chargeBasedOnVariant.variantName} rate
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-charcoal-700">
                    {formatCurrency(prices.wastageChargeAmount)}
                  </span>
                </div>
              )}
              {formData.charges.otherCharges.map((c: { name: string; amount: number }, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm py-1"
                >
                  <span className="text-charcoal-600">{c.name}</span>
                  <span className="font-mono text-charcoal-700">
                    {formatCurrency(c.amount)}
                  </span>
                </div>
              ))}
            </div>

            {/* Subtotal, GST, Total */}
            <div className="border-t-2 border-charcoal-200 pt-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-charcoal-600">Subtotal</span>
                <span className="font-mono text-charcoal-700">
                  {formatCurrency(prices.subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-charcoal-600">
                  GST ({formData.charges.gstPercentage}%)
                </span>
                <span className="font-mono text-charcoal-700">
                  {formatCurrency(prices.gstAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-charcoal-200">
                <span className="text-lg font-bold text-charcoal-800">
                  Total Price
                </span>
                <PriceDisplay amount={prices.totalPrice} size="lg" />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Images & Flags */}
      <Card>
        <div className="p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-charcoal-700">
              Images & Flags
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onGoTo(3)}
            >
              <Pencil size={14} />
              Edit
            </Button>
          </div>

          {formData.images.images.length > 0 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-4">
              {formData.images.images.map((url: string, i: number) => (
                <div
                  key={url}
                  className="aspect-square overflow-hidden rounded-lg border border-charcoal-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Product ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {formData.images.videos.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-1.5 text-xs text-charcoal-500 mb-2">
                <Video size={14} />
                {formData.images.videos.length} video(s) attached
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {formData.images.isNewArrival && (
              <Badge variant="rose" size="sm">
                New Arrival
              </Badge>
            )}
            {formData.images.isFeatured && (
              <Badge variant="gold" size="sm">
                Featured
              </Badge>
            )}
            {formData.images.isOutOfStock && (
              <Badge variant="error" size="sm">
                Out of Stock
              </Badge>
            )}
            {formData.images.hallmarkCertified && (
              <Badge variant="success" size="sm">
                BIS Hallmark
              </Badge>
            )}
            {formData.images.isActive ? (
              <Badge variant="success" size="sm">
                Active
              </Badge>
            ) : (
              <Badge variant="warning" size="sm">
                Inactive
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button type="button" variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={onSubmit}
          isLoading={isSubmitting}
        >
          {mode === "edit" ? "Update Product" : "Create Product"}
        </Button>
      </div>
    </div>
  );
}

function ReviewField({
  label,
  value,
  full,
}: {
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <dt className="text-xs text-charcoal-400">{label}</dt>
      <dd className="text-sm text-charcoal-700 mt-0.5">{value}</dd>
    </div>
  );
}
