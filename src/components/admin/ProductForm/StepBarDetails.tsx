"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import {
  BAR_SHAPE_OPTIONS,
  BAR_WEIGHT_PRESETS,
  formatBarWeightLabel,
  purityToFineness,
} from "@/lib/bar-product";
import type { MetalEntry } from "./StepComposition";

export interface BarWeightOptionData {
  weightGrams: number;
  sku: string;
  dimension: string;
  netWeight: number;
  isDefault: boolean;
  isOutOfStock: boolean;
}

export interface BarSpecsData {
  shape: string;
  purity: number;
  countryOfOrigin: string;
  importer: string;
  mintBrand: string;
  weightOptions: BarWeightOptionData[];
  /** Selected metal for composition / pricing */
  metalId: string;
  metalName: string;
  variantId: string;
  variantName: string;
  pricePerGram: number;
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

interface StepBarDetailsProps {
  data: BarSpecsData;
  onChange: (data: BarSpecsData) => void;
  onNext: () => void;
  onBack: () => void;
}

function emptyWeight(grams = 1, isDefault = false): BarWeightOptionData {
  return {
    weightGrams: grams,
    sku: "",
    dimension: "",
    netWeight: grams,
    isDefault,
    isOutOfStock: false,
  };
}

export function getDefaultBarSpecs(): BarSpecsData {
  return {
    shape: "Rectangular Ingot",
    purity: 999.9,
    countryOfOrigin: "India",
    importer: "NA",
    mintBrand: "",
    weightOptions: [emptyWeight(1, true)],
    metalId: "",
    metalName: "",
    variantId: "",
    variantName: "",
    pricePerGram: 0,
  };
}

/** Build jewelry-style metal composition from bar form state (default weight). */
export function barSpecsToMetalComposition(data: BarSpecsData): MetalEntry[] {
  if (!data.metalId || !data.variantId) return [];
  const defaultOpt =
    data.weightOptions.find((w) => w.isDefault) || data.weightOptions[0];
  const weight = defaultOpt?.weightGrams || 0;
  return [
    {
      metalId: data.metalId,
      metalName: data.metalName,
      variantId: data.variantId,
      variantName: data.variantName,
      weightInGrams: weight,
      pricePerGram: data.pricePerGram,
      wastageCharges: { type: "percentage", value: 0 },
    },
  ];
}

export function StepBarDetails({
  data,
  onChange,
  onNext,
  onBack,
}: StepBarDetailsProps) {
  const [metals, setMetals] = useState<MetalApiData[]>([]);
  const [error, setError] = useState("");
  const [customWeight, setCustomWeight] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/metals?_t=${Date.now()}`, {
          cache: "no-store",
        });
        const d = await res.json();
        if (d.success && !cancelled) setMetals(d.data || []);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedMetal = useMemo(
    () => metals.find((m) => m._id === data.metalId),
    [metals, data.metalId]
  );

  const variantOptions = (selectedMetal?.variants || []).map((v) => ({
    value: v._id,
    label: `${v.name} (${v.purity}%) — ${formatCurrency(v.pricePerGram)}/g`,
  }));

  const usedWeights = new Set(data.weightOptions.map((w) => w.weightGrams));

  const update = (patch: Partial<BarSpecsData>) => {
    onChange({ ...data, ...patch });
  };

  const setMetal = (metalId: string) => {
    const metal = metals.find((m) => m._id === metalId);
    if (!metal) {
      update({
        metalId: "",
        metalName: "",
        variantId: "",
        variantName: "",
        pricePerGram: 0,
      });
      return;
    }
    const first = metal.variants[0];
    update({
      metalId: metal._id,
      metalName: metal.name,
      variantId: first?._id || "",
      variantName: first?.name || "",
      pricePerGram: first?.pricePerGram || 0,
      purity: first ? purityToFineness(first.purity) : data.purity,
    });
  };

  const setVariant = (variantId: string) => {
    const variant = selectedMetal?.variants.find((v) => v._id === variantId);
    if (!variant) return;
    update({
      variantId: variant._id,
      variantName: variant.name,
      pricePerGram: variant.pricePerGram,
      purity: purityToFineness(variant.purity),
    });
  };

  const addPresetWeight = (grams: number) => {
    if (usedWeights.has(grams)) return;
    const next = [...data.weightOptions, emptyWeight(grams, false)];
    next.sort((a, b) => a.weightGrams - b.weightGrams);
    update({ weightOptions: next });
  };

  const addCustomWeight = () => {
    const grams = parseFloat(customWeight);
    if (!Number.isFinite(grams) || grams <= 0) {
      setError("Enter a valid weight in grams");
      return;
    }
    if (usedWeights.has(grams)) {
      setError("That weight is already added");
      return;
    }
    setError("");
    const next = [...data.weightOptions, emptyWeight(grams, false)];
    next.sort((a, b) => a.weightGrams - b.weightGrams);
    update({ weightOptions: next });
    setCustomWeight("");
  };

  const updateWeight = (index: number, patch: Partial<BarWeightOptionData>) => {
    const next = data.weightOptions.map((w, i) => {
      if (i !== index) return w;
      const merged = { ...w, ...patch };
      if (patch.weightGrams !== undefined && patch.netWeight === undefined) {
        merged.netWeight = patch.weightGrams;
      }
      return merged;
    });
    update({ weightOptions: next });
  };

  const setDefaultWeight = (index: number) => {
    update({
      weightOptions: data.weightOptions.map((w, i) => ({
        ...w,
        isDefault: i === index,
      })),
    });
  };

  const removeWeight = (index: number) => {
    if (data.weightOptions.length <= 1) {
      setError("At least one weight option is required");
      return;
    }
    const next = data.weightOptions.filter((_, i) => i !== index);
    if (!next.some((w) => w.isDefault) && next[0]) {
      next[0] = { ...next[0], isDefault: true };
    }
    update({ weightOptions: next });
  };

  const handleContinue = () => {
    if (!data.metalId || !data.variantId) {
      setError("Select a metal and purity variant");
      return;
    }
    if (!data.shape.trim()) {
      setError("Shape is required");
      return;
    }
    if (!data.purity || data.purity <= 0) {
      setError("Enter purity (e.g. 999.9)");
      return;
    }
    if (data.weightOptions.length === 0) {
      setError("Add at least one weight option");
      return;
    }
    if (data.weightOptions.some((w) => !w.weightGrams || w.weightGrams <= 0)) {
      setError("All weight options need a valid weight");
      return;
    }
    // Ensure one default
    if (!data.weightOptions.some((w) => w.isDefault)) {
      update({
        weightOptions: data.weightOptions.map((w, i) => ({
          ...w,
          isDefault: i === 0,
        })),
      });
    }
    setError("");
    onNext();
  };

  const defaultWeight =
    data.weightOptions.find((w) => w.isDefault)?.weightGrams ||
    data.weightOptions[0]?.weightGrams ||
    0;
  const metalValue = defaultWeight * (data.pricePerGram || 0);

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-5 md:p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-charcoal-700">
              Metal &amp; Purity
            </h2>
            <p className="text-sm text-charcoal-400 mt-1">
              Choose the metal used for this bar. Price updates live with rate ×
              default weight.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Metal"
              value={data.metalId}
              onChange={(e) => setMetal(e.target.value)}
              options={metals.map((m) => ({ value: m._id, label: m.name }))}
              placeholder="Select metal (Gold, Silver…)"
            />
            <Select
              label="Purity / Variant"
              value={data.variantId}
              onChange={(e) => setVariant(e.target.value)}
              options={variantOptions}
              placeholder={
                data.metalId ? "Select purity" : "Select metal first"
              }
              disabled={!data.metalId}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Purity (fineness)"
              type="number"
              step="0.1"
              min="1"
              value={data.purity || ""}
              onChange={(e) =>
                update({ purity: parseFloat(e.target.value) || 0 })
              }
              helperText="Shown on product page as e.g. 999.9"
            />
            <div className="rounded-lg bg-charcoal-50 border border-charcoal-100 p-3 flex flex-col justify-center">
              <p className="text-xs text-charcoal-400">Metal value (default weight)</p>
              <p className="text-lg font-semibold text-charcoal-700 mt-0.5">
                {formatCurrency(metalValue)}
              </p>
              <p className="text-xs text-charcoal-400 mt-0.5">
                {formatBarWeightLabel(defaultWeight)} ×{" "}
                {formatCurrency(data.pricePerGram)}/g
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-5 md:p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-charcoal-700">
              Bar Specifications
            </h2>
            <p className="text-sm text-charcoal-400 mt-1">
              Details shown in the product info grid (shape, origin, importer).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal-600 mb-1.5">
                Shape
              </label>
              <Select
                value={
                  BAR_SHAPE_OPTIONS.includes(
                    data.shape as (typeof BAR_SHAPE_OPTIONS)[number]
                  )
                    ? data.shape
                    : "Custom"
                }
                onChange={(e) => {
                  if (e.target.value === "Custom") {
                    update({ shape: data.shape === "Custom" ? "" : data.shape });
                  } else {
                    update({ shape: e.target.value });
                  }
                }}
                options={[
                  ...BAR_SHAPE_OPTIONS.map((s) => ({ value: s, label: s })),
                ]}
              />
              {(data.shape === "Custom" ||
                !BAR_SHAPE_OPTIONS.includes(
                  data.shape as (typeof BAR_SHAPE_OPTIONS)[number]
                )) && (
                <Input
                  className="mt-2"
                  placeholder="Custom shape"
                  value={
                    BAR_SHAPE_OPTIONS.includes(
                      data.shape as (typeof BAR_SHAPE_OPTIONS)[number]
                    )
                      ? ""
                      : data.shape
                  }
                  onChange={(e) => update({ shape: e.target.value })}
                />
              )}
            </div>
            <Input
              label="Mint / Brand"
              placeholder="e.g. MMTC-PAMP, Perth Mint"
              value={data.mintBrand}
              onChange={(e) => update({ mintBrand: e.target.value })}
            />
            <Input
              label="Country of Origin"
              placeholder="India"
              value={data.countryOfOrigin}
              onChange={(e) => update({ countryOfOrigin: e.target.value })}
            />
            <Input
              label="Importer"
              placeholder="NA"
              value={data.importer}
              onChange={(e) => update({ importer: e.target.value })}
            />
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-5 md:p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-charcoal-700">
              Weight Options (g)
            </h2>
            <p className="text-sm text-charcoal-400 mt-1">
              Customers pick a weight on the product page. Each option can have
              its own SKU and dimensions. Star one as the default listing weight.
            </p>
          </div>

          <div>
            <p className="text-xs text-charcoal-400 mb-2">Quick add</p>
            <div className="flex flex-wrap gap-1.5">
              {BAR_WEIGHT_PRESETS.map((g) => {
                const added = usedWeights.has(g);
                return (
                  <button
                    key={g}
                    type="button"
                    disabled={added}
                    onClick={() => addPresetWeight(g)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                      added
                        ? "border-gold-400 bg-gold-50 text-gold-700 cursor-default"
                        : "border-charcoal-200 bg-white text-charcoal-600 hover:border-gold-400 hover:bg-gold-50"
                    }`}
                  >
                    {added ? "✓ " : "+ "}
                    {formatBarWeightLabel(g)}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2 mt-3 max-w-xs">
              <Input
                placeholder="Custom g (e.g. 7.5)"
                type="number"
                step="0.1"
                min="0.001"
                value={customWeight}
                onChange={(e) => setCustomWeight(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomWeight();
                  }
                }}
              />
              <Button type="button" variant="secondary" size="sm" onClick={addCustomWeight}>
                <Plus size={16} />
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {data.weightOptions.map((opt, index) => (
              <div
                key={`${opt.weightGrams}-${index}`}
                className={`rounded-xl border p-4 space-y-3 ${
                  opt.isDefault
                    ? "border-gold-300 bg-gold-50/40"
                    : "border-charcoal-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-charcoal-700">
                    {formatBarWeightLabel(opt.weightGrams)}
                    {opt.isDefault && (
                      <span className="ml-2 text-xs font-medium text-gold-700">
                        Default
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title="Set as default"
                      onClick={() => setDefaultWeight(index)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        opt.isDefault
                          ? "text-gold-600"
                          : "text-charcoal-300 hover:text-gold-500"
                      }`}
                    >
                      <Star
                        size={16}
                        fill={opt.isDefault ? "currentColor" : "none"}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeWeight(index)}
                      className="p-1.5 rounded-lg text-charcoal-300 hover:text-error"
                      aria-label="Remove weight"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <Input
                    label="Weight (g)"
                    type="number"
                    step="0.1"
                    min="0.001"
                    value={opt.weightGrams || ""}
                    onChange={(e) =>
                      updateWeight(index, {
                        weightGrams: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                  <Input
                    label="SKU"
                    placeholder="e.g. AUYyRIG1.0703"
                    value={opt.sku}
                    onChange={(e) =>
                      updateWeight(index, { sku: e.target.value })
                    }
                  />
                  <Input
                    label="Dimension"
                    placeholder="e.g. 8.9 x 14.7 mm"
                    value={opt.dimension}
                    onChange={(e) =>
                      updateWeight(index, { dimension: e.target.value })
                    }
                  />
                  <Input
                    label="Net Weight (g)"
                    type="number"
                    step="0.1"
                    min="0"
                    value={opt.netWeight || ""}
                    onChange={(e) =>
                      updateWeight(index, {
                        netWeight: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <label className="inline-flex items-center gap-2 text-sm text-charcoal-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={opt.isOutOfStock}
                    onChange={(e) =>
                      updateWeight(index, { isOutOfStock: e.target.checked })
                    }
                    className="rounded border-charcoal-300 text-gold-600 focus:ring-gold-500"
                  />
                  Out of stock for this weight
                </label>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {error && (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-between">
        <Button type="button" variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button type="button" variant="primary" onClick={handleContinue}>
          Continue to Charges
        </Button>
      </div>
    </div>
  );
}
