"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  CircleDollarSign,
  Gem,
  Clock,
  AlertTriangle,
  Check,
  X,
  Pencil,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { PriceDisplay } from "@/components/ui/PriceDisplay";
import { Tabs } from "@/components/ui/Tabs";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { PriceSyncModal } from "@/components/admin/PriceSyncModal";
import { cn } from "@/lib/utils";
import { formatDate, formatCurrency } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { STALE_PRICE_HOURS } from "@/constants";

interface MetalData {
  _id: string;
  name: string;
  variants: Array<{
    _id: string;
    name: string;
    purity: number;
    pricePerGram: number;
    unit: string;
    lastUpdated: string;
  }>;
  updatedAt: string;
}

interface GemstoneData {
  _id: string;
  name: string;
  variants: Array<{
    _id: string;
    name: string;
    cut?: string;
    clarity?: string;
    color?: string;
    pricePerCarat: number;
    unit: string;
    lastUpdated: string;
  }>;
  updatedAt: string;
}

interface PriceHistoryEntry {
  _id: string;
  entityType: "metal" | "gemstone";
  entityId: string;
  variantName: string;
  oldPrice: number;
  newPrice: number;
  createdAt: string;
}

function isPriceStale(date: string | undefined): boolean {
  if (!date) return true;
  const hours = (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60);
  return hours > STALE_PRICE_HOURS;
}

export function PricingDashboardContent() {
  const [metals, setMetals] = useState<MetalData[]>([]);
  const [gemstones, setGemstones] = useState<GemstoneData[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("metals");

  // Inline editing state
  const [editingVariant, setEditingVariant] = useState<{
    entityId: string;
    variantId: string;
    type: "metal" | "gemstone";
  } | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [isSavingPrice, setIsSavingPrice] = useState(false);

  // Sync modal state
  const [syncModal, setSyncModal] = useState<{
    entityType: "metal" | "gemstone";
    entityId: string;
    entityName: string;
    variantId: string;
    variantName: string;
    oldPrice: number;
    newPrice: number;
    unit: string;
  } | null>(null);

  const fetchData = useCallback(async (retries = 3) => {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        setIsLoading(true);
        const ts = Date.now();
        const [metalsRes, gemstonesRes, historyRes] = await Promise.all([
          fetch(`/api/metals?_t=${ts}`, { cache: "no-store" }),
          fetch(`/api/gemstones?_t=${ts}`, { cache: "no-store" }),
          fetch(`/api/pricing/history?_t=${ts}`, { cache: "no-store" }).catch(() => ({ json: async () => ({ data: [] }) })),
        ]);

        const [metalsData, gemstonesData, historyData] = await Promise.all([
          metalsRes.json(),
          gemstonesRes.json(),
          historyRes.json(),
        ]);

        setMetals(metalsData.data || []);
        setGemstones(gemstonesData.data || []);
        setPriceHistory(historyData.data || []);
        setIsLoading(false);
        return;
      } catch {
        if (attempt === retries - 1) toast.error("Failed to load pricing data");
      }
      if (attempt < retries - 1) await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const startEditing = (
    entityId: string,
    variantId: string,
    currentPrice: number,
    type: "metal" | "gemstone"
  ) => {
    setEditingVariant({ entityId, variantId, type });
    setEditPrice(currentPrice.toString());
  };

  const cancelEditing = () => {
    setEditingVariant(null);
    setEditPrice("");
  };

  const savePrice = async () => {
    if (!editingVariant) return;
    const newPrice = parseFloat(editPrice);
    if (isNaN(newPrice) || newPrice < 0) {
      toast.error("Please enter a valid price");
      return;
    }

    setIsSavingPrice(true);
    try {
      const endpoint =
        editingVariant.type === "metal"
          ? `/api/metals/${editingVariant.entityId}`
          : `/api/gemstones/${editingVariant.entityId}`;

      // Fetch the current entity to get variant details for the sync modal
      const entityRes = await fetch(endpoint);
      const entityData = await entityRes.json();

      if (!entityData.success) {
        throw new Error("Failed to fetch entity");
      }

      const entity = entityData.data;
      const priceField =
        editingVariant.type === "metal" ? "pricePerGram" : "pricePerCarat";

      const variant = entity.variants.find(
        (v: { _id: string }) => v._id === editingVariant.variantId
      );

      if (!variant) {
        toast.error("Variant not found");
        return;
      }

      const currentPrice = variant[priceField] as number;

      // If price hasn't changed, just cancel
      if (currentPrice === newPrice) {
        toast.info("Price unchanged");
        cancelEditing();
        return;
      }

      // Open the sync modal instead of directly saving
      setSyncModal({
        entityType: editingVariant.type,
        entityId: editingVariant.entityId,
        entityName: entity.name,
        variantId: editingVariant.variantId,
        variantName: variant.name,
        oldPrice: currentPrice,
        newPrice,
        unit: variant.unit || (editingVariant.type === "metal" ? "gram" : "carat"),
      });
    } catch {
      toast.error("Failed to prepare price update");
    } finally {
      setIsSavingPrice(false);
      cancelEditing();
    }
  };

  const tabs = [
    { id: "metals", label: "Metals", icon: CircleDollarSign },
    { id: "gemstones", label: "Gemstones", icon: Gem },
    { id: "history", label: "Price History", icon: Clock },
  ];

  // Count stale prices
  const staleMetalCount = metals.reduce(
    (count, metal) =>
      count +
      metal.variants.filter((v) => isPriceStale(v.lastUpdated)).length,
    0
  );
  const staleGemstoneCount = gemstones.reduce(
    (count, gem) =>
      count +
      gem.variants.filter((v) => isPriceStale(v.lastUpdated)).length,
    0
  );

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Pricing" },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-charcoal-700">
            Pricing Dashboard
          </h1>
          <p className="text-sm text-charcoal-400 mt-1">
            View and update all metal and gemstone prices
          </p>
        </div>
        <Button variant="outline" onClick={() => fetchData()}>
          <RefreshCw size={16} />
          Refresh
        </Button>
      </div>

      {/* Stale price alerts */}
      {(staleMetalCount > 0 || staleGemstoneCount > 0) && (
        <div className="flex items-center gap-2 rounded-lg bg-warning/10 border border-warning/20 text-warning px-4 py-3">
          <AlertTriangle size={18} className="shrink-0" />
          <p className="text-sm">
            {staleMetalCount + staleGemstoneCount} price
            {staleMetalCount + staleGemstoneCount !== 1 ? "s" : ""} not
            updated in {STALE_PRICE_HOURS}+ hours. Click the edit icon to
            update.
          </p>
        </div>
      )}

      {/* Tabs */}
      <Tabs
        tabs={tabs.map((t) => ({ id: t.id, label: t.label }))}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {isLoading ? (
        <PricingSkeleton />
      ) : (
        <>
          {/* Metals tab */}
          {activeTab === "metals" && (
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="space-y-4"
            >
              {metals.length === 0 ? (
                <Card>
                  <div className="p-8 text-center text-charcoal-400 text-sm">
                    No metals added yet. Add metals from the Metals page.
                  </div>
                </Card>
              ) : (
                metals.map((metal) => (
                  <motion.div key={metal._id} variants={staggerItem}>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CircleDollarSign
                            size={20}
                            className="text-gold-500"
                          />
                          {metal.name}
                        </CardTitle>
                      </CardHeader>
                      <div className="px-4 pb-4 md:px-6 md:pb-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {metal.variants.map((variant) => {
                            const stale = isPriceStale(variant.lastUpdated);
                            const isEditing =
                              editingVariant?.entityId === metal._id &&
                              editingVariant?.variantId === variant._id;

                            return (
                              <div
                                key={variant._id}
                                className={cn(
                                  "rounded-xl border p-4 transition-colors",
                                  stale
                                    ? "border-warning/30 bg-warning/5"
                                    : "border-charcoal-100 bg-white"
                                )}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-charcoal-700">
                                      {variant.name}
                                    </span>
                                    {variant.purity > 0 && (
                                      <Badge variant="gold" size="sm">
                                        {variant.purity}%
                                      </Badge>
                                    )}
                                  </div>
                                  {stale && (
                                    <Badge variant="warning" size="sm">
                                      Stale
                                    </Badge>
                                  )}
                                </div>

                                {isEditing ? (
                                  <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400 text-sm">
                                        ₹
                                      </span>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={editPrice}
                                        onChange={(e) =>
                                          setEditPrice(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") savePrice();
                                          if (e.key === "Escape")
                                            cancelEditing();
                                        }}
                                        autoFocus
                                        className="w-full h-9 pl-7 pr-3 rounded-lg border border-gold-500 bg-white text-sm font-mono text-charcoal-700 focus:outline-none focus:ring-2 focus:ring-gold-500"
                                      />
                                    </div>
                                    <button
                                      onClick={savePrice}
                                      disabled={isSavingPrice}
                                      className="flex items-center justify-center w-8 h-8 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors"
                                      aria-label="Save price"
                                    >
                                      <Check size={16} />
                                    </button>
                                    <button
                                      onClick={cancelEditing}
                                      className="flex items-center justify-center w-8 h-8 rounded-lg bg-charcoal-100 text-charcoal-500 hover:bg-charcoal-200 transition-colors"
                                      aria-label="Cancel editing"
                                    >
                                      <X size={16} />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between">
                                    <PriceDisplay
                                      amount={variant.pricePerGram}
                                      size="md"
                                      suffix={`/${variant.unit}`}
                                    />
                                    <button
                                      onClick={() =>
                                        startEditing(
                                          metal._id,
                                          variant._id,
                                          variant.pricePerGram,
                                          "metal"
                                        )
                                      }
                                      className="flex items-center justify-center w-8 h-8 rounded-lg text-charcoal-400 hover:bg-gold-50 hover:text-gold-600 transition-colors"
                                      aria-label="Edit price"
                                    >
                                      <Pencil size={14} />
                                    </button>
                                  </div>
                                )}

                                <p className="text-xs text-charcoal-400 mt-2 flex items-center gap-1">
                                  <Clock size={10} />
                                  {variant.lastUpdated
                                    ? formatDate(variant.lastUpdated)
                                    : "Never updated"}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {/* Gemstones tab */}
          {activeTab === "gemstones" && (
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="space-y-4"
            >
              {gemstones.length === 0 ? (
                <Card>
                  <div className="p-8 text-center text-charcoal-400 text-sm">
                    No gemstones added yet. Add gemstones from the Gemstones
                    page.
                  </div>
                </Card>
              ) : (
                gemstones.map((gemstone) => (
                  <motion.div key={gemstone._id} variants={staggerItem}>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Gem size={20} className="text-rose-500" />
                          {gemstone.name}
                        </CardTitle>
                      </CardHeader>
                      <div className="px-4 pb-4 md:px-6 md:pb-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {gemstone.variants.map((variant) => {
                            const stale = isPriceStale(variant.lastUpdated);
                            const isEditing =
                              editingVariant?.entityId === gemstone._id &&
                              editingVariant?.variantId === variant._id;

                            return (
                              <div
                                key={variant._id}
                                className={cn(
                                  "rounded-xl border p-4 transition-colors",
                                  stale
                                    ? "border-warning/30 bg-warning/5"
                                    : "border-charcoal-100 bg-white"
                                )}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-semibold text-charcoal-700">
                                    {variant.name}
                                  </span>
                                  {stale && (
                                    <Badge variant="warning" size="sm">
                                      Stale
                                    </Badge>
                                  )}
                                </div>

                                {/* Gemstone details */}
                                <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                                  {variant.cut && (
                                    <Badge variant="default" size="sm">
                                      {variant.cut}
                                    </Badge>
                                  )}
                                  {variant.clarity && (
                                    <Badge variant="info" size="sm">
                                      {variant.clarity}
                                    </Badge>
                                  )}
                                  {variant.color && (
                                    <Badge variant="rose" size="sm">
                                      {variant.color}
                                    </Badge>
                                  )}
                                </div>

                                {isEditing ? (
                                  <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400 text-sm">
                                        ₹
                                      </span>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={editPrice}
                                        onChange={(e) =>
                                          setEditPrice(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") savePrice();
                                          if (e.key === "Escape")
                                            cancelEditing();
                                        }}
                                        autoFocus
                                        className="w-full h-9 pl-7 pr-3 rounded-lg border border-gold-500 bg-white text-sm font-mono text-charcoal-700 focus:outline-none focus:ring-2 focus:ring-gold-500"
                                      />
                                    </div>
                                    <button
                                      onClick={savePrice}
                                      disabled={isSavingPrice}
                                      className="flex items-center justify-center w-8 h-8 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors"
                                      aria-label="Save price"
                                    >
                                      <Check size={16} />
                                    </button>
                                    <button
                                      onClick={cancelEditing}
                                      className="flex items-center justify-center w-8 h-8 rounded-lg bg-charcoal-100 text-charcoal-500 hover:bg-charcoal-200 transition-colors"
                                      aria-label="Cancel editing"
                                    >
                                      <X size={16} />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between">
                                    <PriceDisplay
                                      amount={variant.pricePerCarat}
                                      size="md"
                                      suffix={`/${variant.unit}`}
                                    />
                                    <button
                                      onClick={() =>
                                        startEditing(
                                          gemstone._id,
                                          variant._id,
                                          variant.pricePerCarat,
                                          "gemstone"
                                        )
                                      }
                                      className="flex items-center justify-center w-8 h-8 rounded-lg text-charcoal-400 hover:bg-gold-50 hover:text-gold-600 transition-colors"
                                      aria-label="Edit price"
                                    >
                                      <Pencil size={14} />
                                    </button>
                                  </div>
                                )}

                                <p className="text-xs text-charcoal-400 mt-2 flex items-center gap-1">
                                  <Clock size={10} />
                                  {variant.lastUpdated
                                    ? formatDate(variant.lastUpdated)
                                    : "Never updated"}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {/* Price History tab */}
          {activeTab === "history" && (
            <Card>
              <CardHeader>
                <CardTitle>Price History</CardTitle>
              </CardHeader>
              <div className="px-4 pb-4 md:px-6 md:pb-6">
                {priceHistory.length === 0 ? (
                  <div className="text-center py-8 text-charcoal-400 text-sm">
                    No price changes recorded yet. Update a price to see
                    history.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {priceHistory.map((entry) => (
                      <div
                        key={entry._id}
                        className="flex items-center justify-between py-3 border-b border-charcoal-50 last:border-0"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            {entry.entityType === "metal" ? (
                              <CircleDollarSign
                                size={16}
                                className="text-gold-500"
                              />
                            ) : (
                              <Gem size={16} className="text-rose-500" />
                            )}
                            <span className="text-sm font-medium text-charcoal-700">
                              {entry.variantName}
                            </span>
                            <Badge
                              variant={
                                entry.entityType === "metal"
                                  ? "gold"
                                  : "rose"
                              }
                              size="sm"
                            >
                              {entry.entityType}
                            </Badge>
                          </div>
                          <p className="text-xs text-charcoal-400 mt-1 flex items-center gap-1">
                            <Clock size={10} />
                            {formatDate(entry.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-charcoal-400 line-through font-mono">
                              {formatCurrency(entry.oldPrice)}
                            </span>
                            <span className="text-charcoal-600">→</span>
                            <span className="text-gold-600 font-mono font-medium">
                              {formatCurrency(entry.newPrice)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}
        </>
      )}

      {/* Price Sync Modal */}
      {syncModal && (
        <PriceSyncModal
          isOpen={!!syncModal}
          onClose={() => setSyncModal(null)}
          onSynced={() => {
            setSyncModal(null);
            fetchData();
          }}
          entityType={syncModal.entityType}
          entityId={syncModal.entityId}
          entityName={syncModal.entityName}
          variantId={syncModal.variantId}
          variantName={syncModal.variantName}
          oldPrice={syncModal.oldPrice}
          newPrice={syncModal.newPrice}
          unit={syncModal.unit}
        />
      )}
    </div>
  );
}

function PricingSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={i}>
          <div className="p-5 md:p-6 space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div
                  key={j}
                  className="rounded-xl border border-charcoal-100 p-4"
                >
                  <Skeleton className="h-4 w-20 mb-3" />
                  <Skeleton className="h-6 w-28 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
