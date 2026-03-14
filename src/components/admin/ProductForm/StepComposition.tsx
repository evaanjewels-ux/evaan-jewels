"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, CircleDollarSign, Gem } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { PriceDisplay } from "@/components/ui/PriceDisplay";
import { formatCurrency } from "@/lib/utils";

export interface MetalEntry {
  metalId: string;
  metalName: string;
  variantId: string;
  variantName: string;
  weightInGrams: number;
  pricePerGram: number;
  /** Per-metal wastage charges */
  wastageCharges: { type: "fixed" | "percentage" | "per_gram"; value: number };
}

export interface GemstoneEntry {
  gemstoneId: string;
  gemstoneName: string;
  variantId: string;
  variantName: string;
  weightInCarats: number;
  quantity: number;
  pricePerCarat: number;
  /** Per-gemstone wastage charges */
  wastageCharges: { type: "fixed" | "percentage" | "per_gram"; value: number };
}

export interface DisplayVariantEntry {
  metal: string;       // metalId
  variants: { variantId: string; weightInGrams: number }[];
}

export interface DisplayGemstoneEntry {
  gemstone: string;    // gemstoneId
  variantId: string;
  variantName: string;
  weightInCarats: number;
  quantity: number;
  pricePerCarat: number;
}

export interface CompositionData {
  metals: MetalEntry[];
  gemstones: GemstoneEntry[];
  displayVariants: DisplayVariantEntry[];
  displayGemstones: DisplayGemstoneEntry[];
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

interface GemstoneApiData {
  _id: string;
  name: string;
  variants: Array<{
    _id: string;
    name: string;
    pricePerCarat: number;
    unit: string;
  }>;
}

interface StepCompositionProps {
  data: CompositionData;
  onChange: (data: CompositionData) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepComposition({
  data,
  onChange,
  onNext,
  onBack,
}: StepCompositionProps) {
  const [metals, setMetals] = useState<MetalApiData[]>([]);
  const [gemstones, setGemstones] = useState<GemstoneApiData[]>([]);

  // Raw string state for weight inputs to allow typing 0.007 etc.
  const [metalWeightRaw, setMetalWeightRaw] = useState<string[]>(() =>
    data.metals.map((m) => (m.weightInGrams > 0 ? String(m.weightInGrams) : ""))
  );
  const [gemstoneWeightRaw, setGemstoneWeightRaw] = useState<string[]>(() =>
    data.gemstones.map((g) => (g.weightInCarats > 0 ? String(g.weightInCarats) : ""))
  );
  const [dgWeightRaw, setDgWeightRaw] = useState<string[]>(() =>
    data.displayGemstones.map((dg) => (dg.weightInCarats > 0 ? String(dg.weightInCarats) : ""))
  );

  useEffect(() => {
    let cancelled = false;

    const fetchData = async (retries = 3) => {
      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          const ts = Date.now();
          const [metalsData, gemstonesData] = await Promise.all([
            fetch(`/api/metals?_t=${ts}`, { cache: "no-store" }).then((r) => r.json()),
            fetch(`/api/gemstones?_t=${ts}`, { cache: "no-store" }).then((r) => r.json()),
          ]);
          if (!cancelled) {
            if (metalsData.success) setMetals(metalsData.data || []);
            if (gemstonesData.success) setGemstones(gemstonesData.data || []);
          }
          // If we got data, we're done
          if (metalsData.success && gemstonesData.success) return;
        } catch {
          // Retry on failure
        }
        if (attempt < retries - 1) {
          await new Promise((r) => setTimeout(r, 600));
        }
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, []);

  // Metal handlers
  const addMetal = () => {
    setMetalWeightRaw((prev) => [...prev, ""]);
    onChange({
      ...data,
      metals: [
        ...data.metals,
        {
          metalId: "",
          metalName: "",
          variantId: "",
          variantName: "",
          weightInGrams: 0,
          pricePerGram: 0,
          wastageCharges: { type: "percentage", value: 0 },
        },
      ],
    });
  };

  const updateMetal = (index: number, updates: Partial<MetalEntry>) => {
    const updated = [...data.metals];
    updated[index] = { ...updated[index], ...updates };
    // Sync weight to displayVariants if it changed
    let newDV = data.displayVariants;
    if (updates.weightInGrams !== undefined && updated[index].metalId && updated[index].variantId) {
      const dvIdx = data.displayVariants.findIndex((dv) => dv.metal === updated[index].metalId);
      if (dvIdx >= 0) {
        const dvCopy = [...data.displayVariants];
        dvCopy[dvIdx] = {
          ...dvCopy[dvIdx],
          variants: dvCopy[dvIdx].variants.map((v) =>
            v.variantId === updated[index].variantId
              ? { ...v, weightInGrams: updates.weightInGrams! }
              : v
          ),
        };
        newDV = dvCopy;
      }
    }
    onChange({ ...data, metals: updated, displayVariants: newDV });
  };

  const removeMetal = (index: number) => {
    const removedMetalId = data.metals[index]?.metalId;
    setMetalWeightRaw((prev) => prev.filter((_, i) => i !== index));
    const newMetals = data.metals.filter((_, i) => i !== index);
    // Clean up displayVariants if no other metal entry uses this metalId
    const stillUsed = newMetals.some((m) => m.metalId === removedMetalId);
    const newDV = stillUsed
      ? data.displayVariants
      : data.displayVariants.filter((dv) => dv.metal !== removedMetalId);
    onChange({ ...data, metals: newMetals, displayVariants: newDV });
  };

  const onMetalSelect = (index: number, metalId: string) => {
    const metal = metals.find((m) => m._id === metalId);
    updateMetal(index, {
      metalId,
      metalName: metal?.name || "",
      variantId: "",
      variantName: "",
      pricePerGram: 0,
    });
    // Initialize displayVariants entry for this metal if not present
    if (metalId && !data.displayVariants.some((dv) => dv.metal === metalId)) {
      // Default: include all variants with weight 0 (admin sets later)
      onChange({
        ...data,
        metals: data.metals.map((m, i) =>
          i === index ? { ...m, metalId, metalName: metal?.name || "", variantId: "", variantName: "", pricePerGram: 0 } : m
        ),
        displayVariants: [
          ...data.displayVariants,
          { metal: metalId, variants: metal?.variants.map((v) => ({ variantId: v._id, weightInGrams: 0 })) || [] },
        ],
      });
    }
  };

  const onMetalVariantSelect = (index: number, variantId: string) => {
    const metal = metals.find((m) => m._id === data.metals[index].metalId);
    const variant = metal?.variants.find((v) => v._id === variantId);
    updateMetal(index, {
      variantId,
      variantName: variant?.name || "",
      pricePerGram: variant?.pricePerGram || 0,
    });
    // Auto-include the selected variant in displayVariants with composition weight
    const metalId = data.metals[index].metalId;
    if (metalId && variantId) {
      const dvIndex = data.displayVariants.findIndex((dv) => dv.metal === metalId);
      if (dvIndex >= 0) {
        const existing = data.displayVariants[dvIndex];
        if (!existing.variants.some((v) => v.variantId === variantId)) {
          const updated = [...data.displayVariants];
          updated[dvIndex] = {
            ...existing,
            variants: [...existing.variants, { variantId, weightInGrams: data.metals[index].weightInGrams }],
          };
          onChange({
            ...data,
            metals: data.metals.map((m, i) =>
              i === index ? { ...m, variantId, variantName: variant?.name || "", pricePerGram: variant?.pricePerGram || 0 } : m
            ),
            displayVariants: updated,
          });
        }
      }
    }
  };

  // Toggle a variant in displayVariants for a given metal
  const toggleDisplayVariant = (metalId: string, variantId: string) => {
    const dvIndex = data.displayVariants.findIndex((dv) => dv.metal === metalId);
    if (dvIndex < 0) return;
    const existing = data.displayVariants[dvIndex];
    // Don't allow unchecking the currently selected composition variant
    const compositionVariantIds = data.metals
      .filter((m) => m.metalId === metalId)
      .map((m) => m.variantId);
    const isPresent = existing.variants.some((v) => v.variantId === variantId);
    if (compositionVariantIds.includes(variantId) && isPresent) {
      return; // Can't uncheck the variant used in composition
    }
    const newVariants = isPresent
      ? existing.variants.filter((v) => v.variantId !== variantId)
      : [...existing.variants, { variantId, weightInGrams: 0 }];
    const updated = [...data.displayVariants];
    updated[dvIndex] = { ...existing, variants: newVariants };
    onChange({ ...data, displayVariants: updated });
  };

  // Update weight for a specific display variant
  const updateDisplayVariantWeight = (metalId: string, variantId: string, weight: number) => {
    const dvIndex = data.displayVariants.findIndex((dv) => dv.metal === metalId);
    if (dvIndex < 0) return;
    const existing = data.displayVariants[dvIndex];
    const newVariants = existing.variants.map((v) =>
      v.variantId === variantId ? { ...v, weightInGrams: weight } : v
    );
    const updated = [...data.displayVariants];
    updated[dvIndex] = { ...existing, variants: newVariants };
    onChange({ ...data, displayVariants: updated });
  };

  // Gemstone handlers
  const addGemstone = () => {
    setGemstoneWeightRaw((prev) => [...prev, ""]);
    onChange({
      ...data,
      gemstones: [
        ...data.gemstones,
        {
          gemstoneId: "",
          gemstoneName: "",
          variantId: "",
          variantName: "",
          weightInCarats: 0,
          quantity: 1,
          pricePerCarat: 0,
          wastageCharges: { type: "percentage", value: 0 },
        },
      ],
    });
  };

  const updateGemstone = (index: number, updates: Partial<GemstoneEntry>) => {
    const updated = [...data.gemstones];
    updated[index] = { ...updated[index], ...updates };
    onChange({ ...data, gemstones: updated });
  };

  const removeGemstone = (index: number) => {
    setGemstoneWeightRaw((prev) => prev.filter((_, i) => i !== index));
    onChange({
      ...data,
      gemstones: data.gemstones.filter((_, i) => i !== index),
    });
  };

  const onGemstoneSelect = (index: number, gemstoneId: string) => {
    const gemstone = gemstones.find((g) => g._id === gemstoneId);
    updateGemstone(index, {
      gemstoneId,
      gemstoneName: gemstone?.name || "",
      variantId: "",
      variantName: "",
      pricePerCarat: 0,
    });
  };

  const onGemstoneVariantSelect = (index: number, variantId: string) => {
    const gemstone = gemstones.find(
      (g) => g._id === data.gemstones[index].gemstoneId
    );
    const variant = gemstone?.variants.find((v) => v._id === variantId);
    updateGemstone(index, {
      variantId,
      variantName: variant?.name || "",
      pricePerCarat: variant?.pricePerCarat || 0,
    });
  };

  // Display Gemstone handlers
  const addDisplayGemstone = () => {
    onChange({
      ...data,
      displayGemstones: [
        ...data.displayGemstones,
        { gemstone: "", variantId: "", variantName: "", weightInCarats: 0, quantity: 1, pricePerCarat: 0 },
      ],
    });
  };

  const updateDisplayGemstone = (index: number, updates: Partial<DisplayGemstoneEntry>) => {
    const updated = [...data.displayGemstones];
    updated[index] = { ...updated[index], ...updates };
    onChange({ ...data, displayGemstones: updated });
  };

  const removeDisplayGemstone = (index: number) => {
    onChange({
      ...data,
      displayGemstones: data.displayGemstones.filter((_, i) => i !== index),
    });
  };

  const onDisplayGemstoneSelect = (index: number, gemstoneId: string) => {
    const gemstone = gemstones.find((g) => g._id === gemstoneId);
    updateDisplayGemstone(index, {
      gemstone: gemstoneId,
      variantId: "",
      variantName: "",
      pricePerCarat: 0,
    });
    // If only one variant, auto-select it
    if (gemstone && gemstone.variants.length === 1) {
      const v = gemstone.variants[0];
      updateDisplayGemstone(index, {
        gemstone: gemstoneId,
        variantId: v._id,
        variantName: v.name,
        pricePerCarat: v.pricePerCarat,
      });
    }
  };

  const onDisplayGemstoneVariantSelect = (index: number, variantId: string) => {
    const gemstone = gemstones.find(
      (g) => g._id === data.displayGemstones[index].gemstone
    );
    const variant = gemstone?.variants.find((v) => v._id === variantId);
    updateDisplayGemstone(index, {
      variantId,
      variantName: variant?.name || "",
      pricePerCarat: variant?.pricePerCarat || 0,
    });
  };

  // Calculate totals
  const metalTotal = data.metals.reduce(
    (sum, m) => sum + m.weightInGrams * m.pricePerGram,
    0
  );
  const gemstoneTotal = data.gemstones.reduce(
    (sum, g) => sum + g.weightInCarats * g.quantity * g.pricePerCarat,
    0
  );

  return (
    <div className="space-y-6">
      {/* Metal Composition */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CircleDollarSign size={20} className="text-gold-500" />
            Metal Composition
          </CardTitle>
          <Button type="button" variant="secondary" size="sm" onClick={addMetal}>
            <Plus size={16} />
            Add Metal
          </Button>
        </CardHeader>
        <div className="px-4 pb-4 md:px-6 md:pb-6 space-y-4">
          {data.metals.length === 0 ? (
            <p className="text-sm text-charcoal-400 text-center py-4">
              No metals added. Click &quot;Add Metal&quot; to add one.
            </p>
          ) : (
            data.metals.map((entry, index) => {
              const selectedMetal = metals.find(
                (m) => m._id === entry.metalId
              );
              const subtotal = entry.weightInGrams * entry.pricePerGram;

              return (
                <div
                  key={index}
                  className="rounded-xl border border-charcoal-100 bg-charcoal-50/30 p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-charcoal-500">
                      Metal {index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMetal(index)}
                      className="text-charcoal-400 hover:text-error h-8 w-8 min-w-0"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Select
                      label="Metal"
                      value={entry.metalId}
                      onChange={(e) => onMetalSelect(index, e.target.value)}
                      options={metals.map((m) => ({
                        value: m._id,
                        label: m.name,
                      }))}
                      placeholder="Select metal"
                    />

                    <Select
                      label="Variant"
                      value={entry.variantId}
                      onChange={(e) =>
                        onMetalVariantSelect(index, e.target.value)
                      }
                      options={
                        selectedMetal?.variants.map((v) => ({
                          value: v._id,
                          label: `${v.name} (${v.purity}%)`,
                        })) || []
                      }
                      placeholder="Select variant"
                    />

                    <Input
                      label="Weight (grams)"
                      type="number"
                      step="0.001"
                      value={metalWeightRaw[index] ?? ""}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setMetalWeightRaw((prev) => {
                          const a = [...prev];
                          a[index] = raw;
                          return a;
                        });
                        const num = parseFloat(raw);
                        if (!isNaN(num)) {
                          updateMetal(index, { weightInGrams: num });
                        }
                      }}
                    />

                    <div>
                      <label className="block text-sm font-medium text-charcoal-600 mb-1.5">
                        Subtotal
                      </label>
                      <div className="flex items-center h-11 px-3 rounded-lg bg-charcoal-100/50 border border-charcoal-100">
                        <span className="text-sm font-mono text-gold-700">
                          {formatCurrency(subtotal)}
                        </span>
                        <span className="text-xs text-charcoal-400 ml-auto">
                          @ {formatCurrency(entry.pricePerGram)}/g
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Display Variants — choose which variants customers see + set weights */}
                  {selectedMetal && selectedMetal.variants.length > 1 && entry.variantId && (
                    <div className="mt-3 pt-3 border-t border-charcoal-100">
                      <p className="text-xs font-medium text-charcoal-500 mb-2">
                        Show these variants on product page (set weight for each):
                      </p>
                      <div className="space-y-2">
                        {selectedMetal.variants.map((v) => {
                          const dvEntry = data.displayVariants.find(
                            (dv) => dv.metal === entry.metalId
                          );
                          const dvVariant = dvEntry?.variants.find((dv) => dv.variantId === v._id);
                          const isChecked = !!dvVariant;
                          const isCompositionVariant = data.metals.some(
                            (m) => m.metalId === entry.metalId && m.variantId === v._id
                          );
                          return (
                            <div key={v._id} className="flex items-center gap-3">
                              <label
                                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium cursor-pointer transition-all min-w-[140px] ${
                                  isChecked
                                    ? "border-gold-400 bg-gold-50 text-gold-700"
                                    : "border-charcoal-200 bg-white text-charcoal-500 hover:border-charcoal-300"
                                } ${isCompositionVariant ? "opacity-90" : ""}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  disabled={isCompositionVariant && isChecked}
                                  onChange={() =>
                                    toggleDisplayVariant(entry.metalId, v._id)
                                  }
                                  className="sr-only"
                                />
                                <span
                                  className={`flex h-3.5 w-3.5 items-center justify-center rounded border ${
                                    isChecked
                                      ? "border-gold-500 bg-gold-500 text-white"
                                      : "border-charcoal-300"
                                  }`}
                                >
                                  {isChecked && (
                                    <svg
                                      className="h-2.5 w-2.5"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                      strokeWidth={3}
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  )}
                                </span>
                                {v.name} ({v.purity}%)
                              </label>
                              {isChecked && (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    step="0.001"
                                    min="0"
                                    placeholder="Weight (g)"
                                    value={
                                      isCompositionVariant
                                        ? entry.weightInGrams || ""
                                        : dvVariant?.weightInGrams || ""
                                    }
                                    disabled={isCompositionVariant}
                                    onChange={(e) => {
                                      const num = parseFloat(e.target.value);
                                      if (!isNaN(num)) {
                                        updateDisplayVariantWeight(entry.metalId, v._id, num);
                                      }
                                    }}
                                    className={`w-28 h-8 px-2 rounded-lg border text-xs ${
                                      isCompositionVariant
                                        ? "border-charcoal-100 bg-charcoal-50 text-charcoal-400"
                                        : "border-charcoal-200 bg-white text-charcoal-700"
                                    }`}
                                  />
                                  <span className="text-[10px] text-charcoal-400">g</span>
                                  {isCompositionVariant && (
                                    <span className="text-[10px] text-charcoal-400 italic">
                                      (from composition)
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {data.metals.some(
                        (m) => m.metalId === entry.metalId && m.variantId
                      ) && (
                        <p className="text-[10px] text-charcoal-400 mt-1">
                          The variant used in composition is always included. Its weight is set above.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {metalTotal > 0 && (
            <div className="flex items-center justify-end pt-2 border-t border-charcoal-100">
              <span className="text-sm text-charcoal-500 mr-3">
                Metal Total:
              </span>
              <PriceDisplay amount={metalTotal} />
            </div>
          )}
        </div>
      </Card>

      {/* Gemstone Composition */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gem size={20} className="text-gold-500" />
            Gemstone Composition
          </CardTitle>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={addGemstone}
          >
            <Plus size={16} />
            Add Gemstone
          </Button>
        </CardHeader>
        <div className="px-4 pb-4 md:px-6 md:pb-6 space-y-4">
          {data.gemstones.length === 0 ? (
            <p className="text-sm text-charcoal-400 text-center py-4">
              No gemstones added. Click &quot;Add Gemstone&quot; to add one.
            </p>
          ) : (
            data.gemstones.map((entry, index) => {
              const selectedGemstone = gemstones.find(
                (g) => g._id === entry.gemstoneId
              );
              const subtotal =
                entry.weightInCarats * entry.quantity * entry.pricePerCarat;

              return (
                <div
                  key={index}
                  className="rounded-xl border border-charcoal-100 bg-charcoal-50/30 p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-charcoal-500">
                      Gemstone {index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeGemstone(index)}
                      className="text-charcoal-400 hover:text-error h-8 w-8 min-w-0"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <Select
                      label="Gemstone"
                      value={entry.gemstoneId}
                      onChange={(e) =>
                        onGemstoneSelect(index, e.target.value)
                      }
                      options={gemstones.map((g) => ({
                        value: g._id,
                        label: g.name,
                      }))}
                      placeholder="Select gemstone"
                    />

                    <Select
                      label="Variant"
                      value={entry.variantId}
                      onChange={(e) =>
                        onGemstoneVariantSelect(index, e.target.value)
                      }
                      options={
                        selectedGemstone?.variants.map((v) => ({
                          value: v._id,
                          label: v.name,
                        })) || []
                      }
                      placeholder="Select variant"
                    />

                    <Input
                      label="Weight (carats)"
                      type="number"
                      step="0.001"
                      min="0"
                      value={gemstoneWeightRaw[index] ?? ""}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setGemstoneWeightRaw((prev) => {
                          const a = [...prev];
                          a[index] = raw;
                          return a;
                        });
                        const num = parseFloat(raw);
                        if (!isNaN(num)) {
                          updateGemstone(index, { weightInCarats: num });
                        }
                      }}
                    />

                    <Input
                      label="Quantity"
                      type="number"
                      step="1"
                      min="1"
                      value={entry.quantity || ""}
                      onChange={(e) =>
                        updateGemstone(index, {
                          quantity: parseInt(e.target.value, 10) || 1,
                        })
                      }
                    />

                    <div>
                      <label className="block text-sm font-medium text-charcoal-600 mb-1.5">
                        Subtotal
                      </label>
                      <div className="flex items-center h-11 px-3 rounded-lg bg-charcoal-100/50 border border-charcoal-100">
                        <span className="text-sm font-mono text-gold-700">
                          {formatCurrency(subtotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {gemstoneTotal > 0 && (
            <div className="flex items-center justify-end pt-2 border-t border-charcoal-100">
              <span className="text-sm text-charcoal-500 mr-3">
                Gemstone Total:
              </span>
              <PriceDisplay amount={gemstoneTotal} />
            </div>
          )}
        </div>
      </Card>

      {/* Display Gemstone Options — alternative gemstones customers can choose */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gem size={20} className="text-gold-500" />
            Gemstone Options for Customers
          </CardTitle>
          <Button type="button" variant="secondary" size="sm" onClick={addDisplayGemstone}>
            <Plus size={16} />
            Add Option
          </Button>
        </CardHeader>
        <div className="px-4 pb-4 md:px-6 md:pb-6 space-y-4">
          <p className="text-xs text-charcoal-400">
            Add alternative gemstone options that customers can choose from on the product page.
            The price will be recalculated based on their selection.
          </p>
          {data.displayGemstones.length === 0 ? (
            <p className="text-sm text-charcoal-400 text-center py-4">
              No alternative gemstones. Customers will only see the default gemstone from composition above.
            </p>
          ) : (
            data.displayGemstones.map((entry, index) => {
              const selectedGemstone = gemstones.find((g) => g._id === entry.gemstone);
              const subtotal = entry.weightInCarats * entry.quantity * entry.pricePerCarat;

              return (
                <div
                  key={index}
                  className="rounded-xl border border-charcoal-100 bg-charcoal-50/30 p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-charcoal-500">
                      Option {index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDisplayGemstone(index)}
                      className="text-charcoal-400 hover:text-error h-8 w-8 min-w-0"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <Select
                      label="Gemstone"
                      value={entry.gemstone}
                      onChange={(e) => onDisplayGemstoneSelect(index, e.target.value)}
                      options={gemstones.map((g) => ({
                        value: g._id,
                        label: g.name,
                      }))}
                      placeholder="Select gemstone"
                    />

                    <Select
                      label="Variant"
                      value={entry.variantId}
                      onChange={(e) => onDisplayGemstoneVariantSelect(index, e.target.value)}
                      options={
                        selectedGemstone?.variants.map((v) => ({
                          value: v._id,
                          label: v.name,
                        })) || []
                      }
                      placeholder="Select variant"
                    />

                    <Input
                      label="Weight (carats)"
                      type="number"
                      step="0.001"
                      min="0"
                      value={dgWeightRaw[index] ?? ""}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setDgWeightRaw((prev) => {
                          const a = [...prev];
                          a[index] = raw;
                          return a;
                        });
                        const num = parseFloat(raw);
                        if (!isNaN(num)) {
                          updateDisplayGemstone(index, { weightInCarats: num });
                        }
                      }}
                    />

                    <Input
                      label="Quantity"
                      type="number"
                      step="1"
                      min="1"
                      value={entry.quantity || ""}
                      onChange={(e) =>
                        updateDisplayGemstone(index, {
                          quantity: parseInt(e.target.value, 10) || 1,
                        })
                      }
                    />

                    <div>
                      <label className="block text-sm font-medium text-charcoal-600 mb-1.5">
                        Subtotal
                      </label>
                      <div className="flex items-center h-11 px-3 rounded-lg bg-charcoal-100/50 border border-charcoal-100">
                        <span className="text-sm font-mono text-gold-700">
                          {formatCurrency(subtotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Running total */}
      {(metalTotal > 0 || gemstoneTotal > 0) && (
        <Card>
          <div className="p-5 md:p-6 flex items-center justify-between">
            <span className="font-semibold text-charcoal-700">
              Running Total (Materials)
            </span>
            <PriceDisplay amount={metalTotal + gemstoneTotal} size="lg" />
          </div>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button type="button" variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button type="button" variant="primary" onClick={onNext}>
          Continue to Charges
        </Button>
      </div>
    </div>
  );
}
