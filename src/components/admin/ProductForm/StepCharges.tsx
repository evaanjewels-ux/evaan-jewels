"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, CircleDollarSign, Gem, Info } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { PriceDisplay } from "@/components/ui/PriceDisplay";
import { formatCurrency } from "@/lib/utils";
import { CHARGE_TYPES, DEFAULT_GST_PERCENTAGE } from "@/constants";
import type { CompositionData, MetalEntry, GemstoneEntry } from "./StepComposition";

export interface ChargesData {
  makingCharges: { type: "fixed" | "percentage" | "per_gram"; value: number };
  gstPercentage: number;
  otherCharges: Array<{ name: string; amount: number }>;
  /** Which variant's price to use as the base for making/wastage calculations */
  chargeBasedOnVariant?: {
    metalId: string;
    variantId: string;
    variantName: string;
  };
}

interface MetalApiData {
  _id: string;
  name: string;
  variants: Array<{
    _id: string;
    name: string;
    purity: number;
    pricePerGram: number;
    unit: string;
  }>;
}

interface StepChargesProps {
  data: ChargesData;
  onChange: (data: ChargesData) => void;
  /** Full composition data so we can render per-material wastage inputs */
  compositionData: CompositionData;
  onCompositionChange: (data: CompositionData) => void;
  onNext: () => void;
  onBack: () => void;
}

function resolveCharge(
  charges: { type: "fixed" | "percentage" | "per_gram"; value: number } | undefined,
  base: number,
  weightInUnits?: number
): number {
  if (!charges || !charges.value) return 0;
  if (charges.type === "percentage") return base * (charges.value / 100);
  if (charges.type === "per_gram") return charges.value * (weightInUnits ?? 0);
  return charges.value;
}

export function StepCharges({
  data,
  onChange,
  compositionData,
  onCompositionChange,
  onNext,
  onBack,
}: StepChargesProps) {
  const [metals, setMetals] = useState<MetalApiData[]>([]);

  useEffect(() => {
    let cancelled = false;
    const fetchMetals = async () => {
      try {
        const res = await fetch(`/api/metals?_t=${Date.now()}`, { cache: "no-store" });
        const d = await res.json();
        if (d.success && !cancelled) setMetals(d.data || []);
      } catch { /* ignore */ }
    };
    fetchMetals();
    return () => { cancelled = true; };
  }, []);

  // Find the charge variant's pricePerGram for display
  const chargeVariantPrice = (() => {
    if (!data.chargeBasedOnVariant) return undefined;
    const metal = metals.find((m) => m._id === data.chargeBasedOnVariant!.metalId);
    const variant = metal?.variants.find((v) => v._id === data.chargeBasedOnVariant!.variantId);
    return variant?.pricePerGram;
  })();

  const metalTotal = compositionData.metals.reduce(
    (s, m) => s + m.weightInGrams * m.pricePerGram,
    0
  );

  const totalMetalWeight = compositionData.metals.reduce(
    (s, m) => s + m.weightInGrams,
    0
  );

  // chargeBaseMetalTotal — same logic as pricing.ts
  const chargeBaseMetalTotal = data.chargeBasedOnVariant && chargeVariantPrice !== undefined
    ? compositionData.metals.reduce((s, m) => s + m.weightInGrams * chargeVariantPrice, 0)
    : metalTotal;

  const makingAmount = resolveCharge(data.makingCharges, chargeBaseMetalTotal, totalMetalWeight);

  // Per-material wastage totals
  const metalWastageTotal = compositionData.metals.reduce((s, m) => {
    const subtotal = data.chargeBasedOnVariant && chargeVariantPrice !== undefined
      ? m.weightInGrams * chargeVariantPrice
      : m.weightInGrams * m.pricePerGram;
    return s + resolveCharge(m.wastageCharges, subtotal, m.weightInGrams);
  }, 0);
  const gemstoneWastageTotal = compositionData.gemstones.reduce((s, g) => {
    const subtotal = g.weightInCarats * g.quantity * g.pricePerCarat;
    return s + resolveCharge(g.wastageCharges, subtotal, g.weightInCarats * g.quantity);
  }, 0);
  const totalWastage = metalWastageTotal + gemstoneWastageTotal;

  const otherTotal = data.otherCharges.reduce((s, c) => s + c.amount, 0);

  // Handlers for per-metal wastage
  const updateMetalWastage = (
    index: number,
    field: "type" | "value",
    val: string | number
  ) => {
    const updatedMetals = compositionData.metals.map((m, i) => {
      if (i !== index) return m;
      return {
        ...m,
        wastageCharges: {
          ...m.wastageCharges,
          [field]: val,
        },
      } as MetalEntry;
    });
    onCompositionChange({ ...compositionData, metals: updatedMetals });
  };

  // Handlers for per-gemstone wastage
  const updateGemstoneWastage = (
    index: number,
    field: "type" | "value",
    val: string | number
  ) => {
    const updatedGemstones = compositionData.gemstones.map((g, i) => {
      if (i !== index) return g;
      return {
        ...g,
        wastageCharges: {
          ...g.wastageCharges,
          [field]: val,
        },
      } as GemstoneEntry;
    });
    onCompositionChange({ ...compositionData, gemstones: updatedGemstones });
  };

  const addOtherCharge = () => {
    onChange({
      ...data,
      otherCharges: [...data.otherCharges, { name: "", amount: 0 }],
    });
  };

  const updateOtherCharge = (
    index: number,
    updates: Partial<{ name: string; amount: number }>
  ) => {
    const updated = [...data.otherCharges];
    updated[index] = { ...updated[index], ...updates };
    onChange({ ...data, otherCharges: updated });
  };

  const removeOtherCharge = (index: number) => {
    onChange({
      ...data,
      otherCharges: data.otherCharges.filter((_, i) => i !== index),
    });
  };

  // Collect the distinct metal IDs that are in the composition
  const compositionMetalIds = new Set(
    compositionData.metals.map((m) => m.metalId).filter(Boolean)
  );

  // Only show variants of metals present in the composition
  const filteredMetals = metals.filter((m) => compositionMetalIds.has(m._id));

  // Auto-clear chargeBasedOnVariant if its metal was removed from composition
  useEffect(() => {
    if (
      data.chargeBasedOnVariant &&
      !compositionMetalIds.has(data.chargeBasedOnVariant.metalId)
    ) {
      onChange({ ...data, chargeBasedOnVariant: undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compositionData.metals]);

  const noComposition =
    compositionData.metals.length === 0 &&
    compositionData.gemstones.length === 0;

  return (
    <div className="space-y-6">
      {/* Charge Based On Variant Selector — before Making Charges */}
      {compositionData.metals.length > 0 && (
        <Card>
          <div className="p-5 md:p-6 space-y-4">
            <div className="flex items-start gap-2">
              <Info size={18} className="text-gold-500 mt-0.5 shrink-0" />
              <div>
                <h2 className="text-lg font-semibold text-charcoal-700">
                  Charge Calculation Variant
                </h2>
                <p className="text-xs text-charcoal-400 mt-0.5">
                  In the jewelry industry, making and wastage charges are often
                  calculated at a higher purity rate (e.g., 24K) even if the product
                  uses a lower variant (e.g., 18K). Select the variant whose rate
                  should be used for making &amp; wastage charge calculations.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Base Variant for Charges"
                value={
                  data.chargeBasedOnVariant
                    ? `${data.chargeBasedOnVariant.metalId}|${data.chargeBasedOnVariant.variantId}`
                    : ""
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) {
                    onChange({ ...data, chargeBasedOnVariant: undefined });
                    return;
                  }
                  const [metalId, variantId] = val.split("|");
                  const metal = metals.find((m) => m._id === metalId);
                  const variant = metal?.variants.find((v) => v._id === variantId);
                  if (metal && variant) {
                    onChange({
                      ...data,
                      chargeBasedOnVariant: {
                        metalId,
                        variantId,
                        variantName: `${metal.name} — ${variant.name}`,
                      },
                    });
                  }
                }}
                options={[
                  { value: "", label: "Use each metal's own rate (default)" },
                  ...filteredMetals.flatMap((m) =>
                    m.variants.map((v) => ({
                      value: `${m._id}|${v._id}`,
                      label: `${m.name} — ${v.name} (${v.purity}%) @ ${formatCurrency(v.pricePerGram)}/g`,
                    }))
                  ),
                ]}
              />
              {data.chargeBasedOnVariant && chargeVariantPrice !== undefined && (
                <div>
                  <label className="block text-sm font-medium text-charcoal-600 mb-1.5">
                    Charge Base Metal Total
                  </label>
                  <div className="flex items-center h-11 px-3 rounded-lg bg-gold-50 border border-gold-200">
                    <span className="text-sm font-mono text-gold-700">
                      {formatCurrency(chargeBaseMetalTotal)}
                    </span>
                    <span className="text-xs text-charcoal-400 ml-auto">
                      (actual: {formatCurrency(metalTotal)})
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Making Charges */}
      <Card>
        <div className="p-5 md:p-6 space-y-5">
          <h2 className="text-lg font-semibold text-charcoal-700">
            Making Charges
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Charge Type"
              value={data.makingCharges.type}
              onChange={(e) =>
                onChange({
                  ...data,
                  makingCharges: {
                    ...data.makingCharges,
                    type: e.target.value as "fixed" | "percentage" | "per_gram",
                  },
                })
              }
              options={[...CHARGE_TYPES]}
            />
            <Input
              label={
                data.makingCharges.type === "percentage"
                  ? "Percentage (%)"
                  : data.makingCharges.type === "per_gram"
                  ? "Rate per Gram (₹/g)"
                  : "Amount (₹)"
              }
              type="number"
              step="0.01"
              min="0"
              value={data.makingCharges.value || ""}
              onChange={(e) =>
                onChange({
                  ...data,
                  makingCharges: {
                    ...data.makingCharges,
                    value: parseFloat(e.target.value) || 0,
                  },
                })
              }
              helperText={
                data.makingCharges.type === "per_gram" && totalMetalWeight > 0
                  ? `${data.makingCharges.value || 0} ₹/g × ${totalMetalWeight}g = ${formatCurrency((data.makingCharges.value || 0) * totalMetalWeight)}`
                  : undefined
              }
            />
            <div>
              <label className="block text-sm font-medium text-charcoal-600 mb-1.5">
                Resolved Amount
              </label>
              <div className="flex items-center h-11 px-3 rounded-lg bg-charcoal-100/50 border border-charcoal-100">
                <span className="text-sm font-mono text-gold-700">
                  {formatCurrency(makingAmount)}
                </span>
              </div>
            </div>
          </div>
          <p className="text-xs text-charcoal-400">
            {data.makingCharges.type === "per_gram"
              ? `Making charges are calculated as rate per gram × total metal weight (${totalMetalWeight}g)`
              : `Making charges are calculated against the total metal value${data.chargeBasedOnVariant
                ? ` (at ${data.chargeBasedOnVariant.variantName} rate)`
                : ""}.`}
          </p>
        </div>
      </Card>

      {/* Per-Material Wastage Charges */}
      <Card>
        <div className="p-5 md:p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-charcoal-700">
                Wastage Charges
              </h2>
              <p className="text-xs text-charcoal-400 mt-0.5">
                Set wastage independently for each metal and gemstone.
              </p>
            </div>
            {totalWastage > 0 && (
              <div className="text-right">
                <p className="text-xs text-charcoal-400 mb-0.5">Total Wastage</p>
                <span className="text-sm font-semibold font-mono text-gold-700">
                  ₹ {formatCurrency(totalWastage)}
                </span>
              </div>
            )}
          </div>

          {noComposition ? (
            <p className="text-sm text-charcoal-400 text-center py-4">
              No materials added. Go back to Step&nbsp;2 to add metals or
              gemstones first.
            </p>
          ) : (
            <>
              {/* Metal wastage rows */}
              {compositionData.metals.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-charcoal-600">
                    <CircleDollarSign size={15} className="text-gold-500" />
                    Metals
                  </div>
                  {compositionData.metals.map((m, index) => {
                    const subtotal = data.chargeBasedOnVariant && chargeVariantPrice !== undefined
                      ? m.weightInGrams * chargeVariantPrice
                      : m.weightInGrams * m.pricePerGram;
                    const actualSubtotal = m.weightInGrams * m.pricePerGram;
                    const wastageAmt = resolveCharge(m.wastageCharges, subtotal, m.weightInGrams);
                    const label =
                      m.metalName && m.variantName
                        ? `${m.metalName} — ${m.variantName}`
                        : `Metal ${index + 1}`;
                    return (
                      <div
                        key={index}
                        className="grid grid-cols-1 sm:grid-cols-4 gap-4 rounded-xl border border-charcoal-100 bg-charcoal-50/30 p-4"
                      >
                        {/* Label */}
                        <div className="sm:col-span-1 flex flex-col justify-center">
                          <p className="text-sm font-medium text-charcoal-700 truncate">
                            {label}
                          </p>
                          <p className="text-xs text-charcoal-400">
                            Subtotal: ₹ {formatCurrency(subtotal)}
                            {data.chargeBasedOnVariant && chargeVariantPrice !== undefined && subtotal !== actualSubtotal && (
                              <span className="text-charcoal-300 ml-1">
                                (actual: ₹ {formatCurrency(actualSubtotal)})
                              </span>
                            )}
                          </p>
                        </div>
                        {/* Type */}
                        <Select
                          label="Wastage Type"
                          value={m.wastageCharges?.type ?? "percentage"}
                          onChange={(e) =>
                            updateMetalWastage(index, "type", e.target.value)
                          }
                          options={[...CHARGE_TYPES]}
                        />
                        {/* Value */}
                        <Input
                          label={
                            (m.wastageCharges?.type ?? "percentage") ===
                            "percentage"
                              ? "Wastage (%)"
                              : (m.wastageCharges?.type ?? "percentage") ===
                                "per_gram"
                              ? "Wastage (₹/g)"
                              : "Wastage (₹)"
                          }
                          type="number"
                          step="0.01"
                          min="0"
                          value={m.wastageCharges?.value || ""}
                          onChange={(e) =>
                            updateMetalWastage(
                              index,
                              "value",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          helperText={
                            (m.wastageCharges?.type ?? "percentage") === "per_gram" && m.weightInGrams > 0
                              ? `${m.wastageCharges?.value || 0} ₹/g × ${m.weightInGrams}g`
                              : undefined
                          }
                        />
                        {/* Resolved */}
                        <div>
                          <label className="block text-sm font-medium text-charcoal-600 mb-1.5">
                            Resolved
                          </label>
                          <div className="flex items-center h-11 px-3 rounded-lg bg-charcoal-100/50 border border-charcoal-100">
                            <span className="text-sm font-mono text-gold-700">
                              {formatCurrency(wastageAmt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Gemstone wastage rows */}
              {compositionData.gemstones.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-charcoal-600">
                    <Gem size={15} className="text-gold-500" />
                    Gemstones
                  </div>
                  {compositionData.gemstones.map((g, index) => {
                    const subtotal =
                      g.weightInCarats * g.quantity * g.pricePerCarat;
                    const wastageAmt = resolveCharge(g.wastageCharges, subtotal, g.weightInCarats * g.quantity);
                    const label =
                      g.gemstoneName && g.variantName
                        ? `${g.gemstoneName} — ${g.variantName}`
                        : `Gemstone ${index + 1}`;
                    return (
                      <div
                        key={index}
                        className="grid grid-cols-1 sm:grid-cols-4 gap-4 rounded-xl border border-charcoal-100 bg-charcoal-50/30 p-4"
                      >
                        {/* Label */}
                        <div className="sm:col-span-1 flex flex-col justify-center">
                          <p className="text-sm font-medium text-charcoal-700 truncate">
                            {label}
                          </p>
                          <p className="text-xs text-charcoal-400">
                            Subtotal: ₹ {formatCurrency(subtotal)}
                          </p>
                        </div>
                        {/* Type */}
                        <Select
                          label="Wastage Type"
                          value={g.wastageCharges?.type ?? "percentage"}
                          onChange={(e) =>
                            updateGemstoneWastage(index, "type", e.target.value)
                          }
                          options={[...CHARGE_TYPES]}
                        />
                        {/* Value */}
                        <Input
                          label={
                            (g.wastageCharges?.type ?? "percentage") ===
                            "percentage"
                              ? "Wastage (%)"
                              : (g.wastageCharges?.type ?? "percentage") ===
                                "per_gram"
                              ? "Wastage (₹/ct)"
                              : "Wastage (₹)"
                          }
                          type="number"
                          step="0.01"
                          min="0"
                          value={g.wastageCharges?.value || ""}
                          onChange={(e) =>
                            updateGemstoneWastage(
                              index,
                              "value",
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                        {/* Resolved */}
                        <div>
                          <label className="block text-sm font-medium text-charcoal-600 mb-1.5">
                            Resolved
                          </label>
                          <div className="flex items-center h-11 px-3 rounded-lg bg-charcoal-100/50 border border-charcoal-100">
                            <span className="text-sm font-mono text-gold-700">
                              {formatCurrency(wastageAmt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      {/* GST */}
      <Card>
        <div className="p-5 md:p-6">
          <h2 className="text-lg font-semibold text-charcoal-700 mb-4">GST</h2>
          <div className="max-w-xs">
            <Input
              label="GST Percentage (%)"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={data.gstPercentage}
              onChange={(e) =>
                onChange({
                  ...data,
                  gstPercentage:
                    parseFloat(e.target.value) || DEFAULT_GST_PERCENTAGE,
                })
              }
              helperText={`Default: ${DEFAULT_GST_PERCENTAGE}%`}
            />
          </div>
        </div>
      </Card>

      {/* Other Charges */}
      <Card>
        <CardHeader>
          <CardTitle>Other Charges</CardTitle>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={addOtherCharge}
          >
            <Plus size={16} />
            Add Charge
          </Button>
        </CardHeader>
        <div className="px-4 pb-4 md:px-6 md:pb-6 space-y-3">
          {data.otherCharges.length === 0 ? (
            <p className="text-sm text-charcoal-400 text-center py-4">
              No additional charges. Click &quot;Add Charge&quot; for
              certification fees, hallmark charges, etc.
            </p>
          ) : (
            data.otherCharges.map((charge, index) => (
              <div key={index} className="flex items-end gap-3">
                <div className="flex-1">
                  <Input
                    label="Charge Name"
                    placeholder="e.g., Certification Fee"
                    value={charge.name}
                    onChange={(e) =>
                      updateOtherCharge(index, { name: e.target.value })
                    }
                  />
                </div>
                <div className="w-36">
                  <Input
                    label="Amount (₹)"
                    type="number"
                    step="0.01"
                    min="0"
                    value={charge.amount || ""}
                    onChange={(e) =>
                      updateOtherCharge(index, {
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeOtherCharge(index)}
                  className="text-charcoal-400 hover:text-error h-11 w-11 min-w-0 mb-0"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))
          )}

          {otherTotal > 0 && (
            <div className="flex items-center justify-end pt-2 border-t border-charcoal-100">
              <span className="text-sm text-charcoal-500 mr-3">
                Other Charges Total:
              </span>
              <PriceDisplay amount={otherTotal} />
            </div>
          )}
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button type="button" variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button type="button" variant="primary" onClick={onNext}>
          Continue to Images
        </Button>
      </div>
    </div>
  );
}
