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
  wastageCharges: { type: "fixed" | "percentage"; value: number };
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
  wastageCharges: { type: "fixed" | "percentage"; value: number };
}

export interface CompositionData {
  metals: MetalEntry[];
  gemstones: GemstoneEntry[];
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
    onChange({ ...data, metals: updated });
  };

  const removeMetal = (index: number) => {
    setMetalWeightRaw((prev) => prev.filter((_, i) => i !== index));
    onChange({ ...data, metals: data.metals.filter((_, i) => i !== index) });
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
  };

  const onMetalVariantSelect = (index: number, variantId: string) => {
    const metal = metals.find((m) => m._id === data.metals[index].metalId);
    const variant = metal?.variants.find((v) => v._id === variantId);
    updateMetal(index, {
      variantId,
      variantName: variant?.name || "",
      pricePerGram: variant?.pricePerGram || 0,
    });
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
