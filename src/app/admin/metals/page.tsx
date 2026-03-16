"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Search, Trash2, Pencil, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PriceDisplay } from "@/components/ui/PriceDisplay";
import { SearchBar } from "@/components/ui/SearchBar";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { STALE_PRICE_HOURS } from "@/constants";

interface Metal {
  _id: string;
  name: string;
  slug: string;
  variants: Array<{
    _id: string;
    name: string;
    purity: number;
    pricePerGram: number;
    unit: string;
    lastUpdated: string;
  }>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function isPriceStale(date: string | undefined): boolean {
  if (!date) return true;
  const hours = (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60);
  return hours > STALE_PRICE_HOURS;
}

export default function MetalsListPage() {
  const [metals, setMetals] = useState<Metal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Metal | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMetals = useCallback(async (retries = 3) => {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/metals?_t=${Date.now()}`, { cache: "no-store" });
        const data = await res.json();
        if (data.success) {
          setMetals(data.data);
          setIsLoading(false);
          return;
        }
      } catch {
        if (attempt === retries - 1) toast.error("Failed to load metals");
      }
      if (attempt < retries - 1) await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchMetals();
  }, [fetchMetals]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/metals/${deleteTarget._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Metal deleted successfully");
        setMetals((prev) => prev.filter((m) => m._id !== deleteTarget._id));
      } else {
        toast.error(data.error || "Failed to delete metal");
      }
    } catch {
      toast.error("Failed to delete metal");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const filteredMetals = metals.filter((metal) =>
    metal.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Metals" },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-charcoal-700">
            Metals
          </h1>
          <p className="text-sm text-charcoal-400 mt-1">
            Manage metals and their variant prices
          </p>
        </div>
        <Link href="/admin/metals/new">
          <Button variant="primary">
            <Plus size={18} />
            Add Metal
          </Button>
        </Link>
      </div>

      {/* Search */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search metals..."
      />

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <div className="p-5 space-y-4">
                <Skeleton className="h-6 w-24" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : filteredMetals.length === 0 ? (
        <EmptyState
          icon={Search}
          title={search ? "No metals found" : "No metals added yet"}
          description={
            search
              ? "Try a different search term"
              : "Add your first metal to get started with pricing"
          }
          action={
            !search ? (
              <Link href="/admin/metals/new">
                <Button variant="primary">
                  <Plus size={18} />
                  Add Metal
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {filteredMetals.map((metal) => (
            <motion.div key={metal._id} variants={staggerItem}>
              <MetalCard
                metal={metal}
                onDelete={() => setDeleteTarget(metal)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Metal"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This may affect products that use this metal.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

function MetalCard({
  metal,
  onDelete,
}: {
  metal: Metal;
  onDelete: () => void;
}) {
  return (
    <Card className="hover:shadow-card-hover transition-shadow duration-200">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-heading font-semibold text-charcoal-700">
              {metal.name}
            </h3>
            <p className="text-xs text-charcoal-400 mt-0.5">
              {metal.variants.length} variant{metal.variants.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Link href={`/admin/metals/${metal._id}/edit`}>
              <Button variant="ghost" size="icon" aria-label="Edit metal">
                <Pencil size={16} />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              aria-label="Delete metal"
              className="text-charcoal-400 hover:text-error"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>

        {/* Variants */}
        <div className="space-y-3">
          {metal.variants.map((variant) => {
            const stale = isPriceStale(variant.lastUpdated);
            return (
              <div
                key={variant._id}
                className={cn(
                  "rounded-lg border p-3",
                  stale
                    ? "border-warning/30 bg-warning/5"
                    : "border-charcoal-100 bg-charcoal-50/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-charcoal-600">
                        {variant.name}
                      </span>
                      {variant.purity > 0 && (
                        <Badge variant="gold" size="sm">
                          {variant.purity}%
                        </Badge>
                      )}
                      {stale && (
                        <AlertTriangle
                          size={14}
                          className="text-warning"
                          aria-label="Price is stale"
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-xs text-charcoal-400">
                      <Clock size={10} />
                      <span>
                        Updated{" "}
                        {variant.lastUpdated
                          ? formatDate(variant.lastUpdated)
                          : "Never"}
                      </span>
                    </div>
                  </div>
                  <PriceDisplay
                    amount={variant.pricePerGram}
                    size="sm"
                    suffix={`/${variant.unit}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
