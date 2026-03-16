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

interface Gemstone {
  _id: string;
  name: string;
  slug: string;
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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function isPriceStale(date: string | undefined): boolean {
  if (!date) return true;
  const hours = (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60);
  return hours > STALE_PRICE_HOURS;
}

export default function GemstonesListPage() {
  const [gemstones, setGemstones] = useState<Gemstone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Gemstone | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchGemstones = useCallback(async (retries = 3) => {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/gemstones?_t=${Date.now()}`, { cache: "no-store" });
        const data = await res.json();
        if (data.success) {
          setGemstones(data.data);
          setIsLoading(false);
          return;
        }
      } catch {
        if (attempt === retries - 1) toast.error("Failed to load gemstones");
      }
      if (attempt < retries - 1) await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchGemstones();
  }, [fetchGemstones]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/gemstones/${deleteTarget._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Gemstone deleted successfully");
        setGemstones((prev) =>
          prev.filter((g) => g._id !== deleteTarget._id)
        );
      } else {
        toast.error(data.error || "Failed to delete gemstone");
      }
    } catch {
      toast.error("Failed to delete gemstone");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const filteredGemstones = gemstones.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Gemstones" },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-charcoal-700">
            Gemstones
          </h1>
          <p className="text-sm text-charcoal-400 mt-1">
            Manage gemstones and their variant prices
          </p>
        </div>
        <Link href="/admin/gemstones/new">
          <Button variant="primary">
            <Plus size={18} />
            Add Gemstone
          </Button>
        </Link>
      </div>

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search gemstones..."
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <div className="p-5 space-y-4">
                <Skeleton className="h-6 w-24" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : filteredGemstones.length === 0 ? (
        <EmptyState
          icon={Search}
          title={search ? "No gemstones found" : "No gemstones added yet"}
          description={
            search
              ? "Try a different search term"
              : "Add your first gemstone to get started with pricing"
          }
          action={
            !search ? (
              <Link href="/admin/gemstones/new">
                <Button variant="primary">
                  <Plus size={18} />
                  Add Gemstone
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
          {filteredGemstones.map((gemstone) => (
            <motion.div key={gemstone._id} variants={staggerItem}>
              <GemstoneCard
                gemstone={gemstone}
                onDelete={() => setDeleteTarget(gemstone)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Gemstone"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This may affect products that use this gemstone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

function GemstoneCard({
  gemstone,
  onDelete,
}: {
  gemstone: Gemstone;
  onDelete: () => void;
}) {
  return (
    <Card className="hover:shadow-card-hover transition-shadow duration-200">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-heading font-semibold text-charcoal-700">
              {gemstone.name}
            </h3>
            <p className="text-xs text-charcoal-400 mt-0.5">
              {gemstone.variants.length} variant
              {gemstone.variants.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Link href={`/admin/gemstones/${gemstone._id}/edit`}>
              <Button variant="ghost" size="icon" aria-label="Edit gemstone">
                <Pencil size={16} />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              aria-label="Delete gemstone"
              className="text-charcoal-400 hover:text-error"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {gemstone.variants.map((variant) => {
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
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-charcoal-600">
                        {variant.name}
                      </span>
                      {stale && (
                        <AlertTriangle
                          size={14}
                          className="text-warning"
                          aria-label="Price is stale"
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
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
                    amount={variant.pricePerCarat}
                    size="sm"
                    suffix={`/${variant.unit}`}
                    className="ml-3 shrink-0"
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
