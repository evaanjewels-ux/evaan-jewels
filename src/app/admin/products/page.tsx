"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Trash2,
  Pencil,
  Package,
  Eye,
  EyeOff,
  Star,
  Sparkles,
  LayoutGrid,
  List,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PriceDisplay } from "@/components/ui/PriceDisplay";
import { SearchBar } from "@/components/ui/SearchBar";
import { Select } from "@/components/ui/Select";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { GENDER_OPTIONS, ITEMS_PER_PAGE } from "@/constants";

interface ProductItem {
  _id: string;
  name: string;
  productCode: string;
  slug: string;
  category: { _id: string; name: string; slug: string } | null;
  gender: string;
  totalPrice: number;
  thumbnailImage: string;
  images: string[];
  isNewArrival: boolean;
  isOutOfStock: boolean;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
}

interface CategoryOption {
  _id: string;
  name: string;
}

export default function ProductsListPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [deleteTarget, setDeleteTarget] = useState<ProductItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch categories for filter
  useEffect(() => {
    let cancelled = false;

    const fetchCategories = async (retries = 3) => {
      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          const ts = Date.now();
          const r = await fetch(`/api/categories?_t=${ts}`, { cache: "no-store" });
          const d = await r.json();
          if (d.success && !cancelled) {
            setCategories(d.data || []);
            return;
          }
        } catch {
          // retry
        }
        if (attempt < retries - 1) {
          await new Promise((r) => setTimeout(r, 500));
        }
      }
    };

    fetchCategories();
    return () => { cancelled = true; };
  }, []);

  const fetchProducts = useCallback(async (retries = 3) => {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        setIsLoading(true);
        const params = new URLSearchParams({
          page: String(page),
          limit: String(ITEMS_PER_PAGE),
          sort: "-createdAt",
          _t: String(Date.now()),
        });
        if (search) params.set("search", search);
        if (filterCategory) params.set("category", filterCategory);
        if (filterGender) params.set("gender", filterGender);

        const res = await fetch(`/api/products?${params}`, { cache: "no-store" });
        const data = await res.json();
        if (data.success) {
          setProducts(data.data);
          setTotalPages(data.pagination.totalPages);
          setTotal(data.pagination.total);
          setIsLoading(false);
          return;
        }
      } catch {
        if (attempt === retries - 1) {
          toast.error("Failed to load products");
        }
      }
      if (attempt < retries - 1) {
        await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
      }
    }
    setIsLoading(false);
  }, [page, search, filterCategory, filterGender]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [search, filterCategory, filterGender]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    // Optimistic removal: immediately remove the item from UI
    const previousProducts = [...products];
    setProducts((prev) => prev.filter((p) => p._id !== deleteTarget._id));
    setTotal((prev) => Math.max(0, prev - 1));

    try {
      const res = await fetch(`/api/products/${deleteTarget._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Product deleted successfully");
      } else {
        // Revert on failure
        setProducts(previousProducts);
        setTotal((prev) => prev + 1);
        toast.error(data.error || "Failed to delete product");
      }
    } catch {
      // Revert on error
      setProducts(previousProducts);
      setTotal((prev) => prev + 1);
      toast.error("Failed to delete product");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const toggleStock = async (product: ProductItem) => {
    // Optimistic update: toggle immediately in UI
    const newStockStatus = !product.isOutOfStock;
    setProducts((prev) =>
      prev.map((p) =>
        p._id === product._id ? { ...p, isOutOfStock: newStockStatus } : p
      )
    );

    try {
      const res = await fetch(`/api/products/${product._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOutOfStock: newStockStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(
          product.isOutOfStock ? "Marked as in stock" : "Marked as out of stock"
        );
      } else {
        // Revert on failure
        setProducts((prev) =>
          prev.map((p) =>
            p._id === product._id ? { ...p, isOutOfStock: product.isOutOfStock } : p
          )
        );
        toast.error("Failed to update stock status");
      }
    } catch {
      // Revert on error
      setProducts((prev) =>
        prev.map((p) =>
          p._id === product._id ? { ...p, isOutOfStock: product.isOutOfStock } : p
        )
      );
      toast.error("Failed to update stock status");
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Products" },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-charcoal-700">
            Products
          </h1>
          <p className="text-sm text-charcoal-400 mt-1">
            {total} {total === 1 ? "product" : "products"} total
          </p>
        </div>
        <Link href="/admin/products/new">
          <Button variant="primary">
            <Plus size={18} />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search products..."
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            placeholder="All Categories"
            options={categories.map((c) => ({
              value: c._id,
              label: c.name,
            }))}
            className="w-40"
          />
          <Select
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
            placeholder="All Genders"
            options={[...GENDER_OPTIONS]}
            className="w-36"
          />
          <div className="hidden sm:flex border border-charcoal-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2.5 transition-colors",
                viewMode === "grid"
                  ? "bg-gold-500 text-white"
                  : "text-charcoal-400 hover:text-charcoal-600"
              )}
              aria-label="Grid view"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2.5 transition-colors",
                viewMode === "list"
                  ? "bg-gold-500 text-white"
                  : "text-charcoal-400 hover:text-charcoal-600"
              )}
              aria-label="List view"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <div className="p-0">
                <Skeleton className="aspect-square w-full rounded-t-xl" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-6 w-1/3" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={search || filterCategory || filterGender ? Search : Package}
          title={
            search || filterCategory || filterGender
              ? "No products match your filters"
              : "No products yet"
          }
          description={
            search || filterCategory || filterGender
              ? "Try adjusting your search or filters"
              : "Create your first product to get started"
          }
          action={
            !search && !filterCategory && !filterGender ? (
              <Link href="/admin/products/new">
                <Button variant="primary">
                  <Plus size={18} />
                  Add Product
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : viewMode === "grid" ? (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {products.map((product) => (
            <motion.div key={product._id} variants={staggerItem}>
              <ProductCard
                product={product}
                onDelete={() => setDeleteTarget(product)}
                onToggleStock={() => toggleStock(product)}
              />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-3"
        >
          {products.map((product) => (
            <motion.div key={product._id} variants={staggerItem}>
              <ProductListItem
                product={product}
                onDelete={() => setDeleteTarget(product)}
                onToggleStock={() => toggleStock(product)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <span className="text-sm text-charcoal-500">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

function ProductCard({
  product,
  onDelete,
  onToggleStock,
}: {
  product: ProductItem;
  onDelete: () => void;
  onToggleStock: () => void;
}) {
  const image = product.thumbnailImage || product.images?.[0];

  return (
    <Card hover>
      <div className="group relative">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden rounded-t-xl bg-charcoal-100">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-103"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Package size={40} className="text-charcoal-300" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.isNewArrival && (
              <Badge variant="rose" size="sm">
                <Sparkles size={10} />
                New
              </Badge>
            )}
            {product.isFeatured && (
              <Badge variant="gold" size="sm">
                <Star size={10} />
                Featured
              </Badge>
            )}
            {product.isOutOfStock && (
              <Badge variant="error" size="sm">
                Out of Stock
              </Badge>
            )}
            {!product.isActive && (
              <Badge variant="warning" size="sm">
                Hidden
              </Badge>
            )}
          </div>

          {/* Hover actions */}
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-charcoal-900/0 opacity-0 group-hover:bg-charcoal-900/40 group-hover:opacity-100 transition-all duration-200">
            <Link href={`/admin/products/${product._id}/edit`}>
              <Button
                variant="secondary"
                size="sm"
                className="bg-white/90 hover:bg-white"
              >
                <Pencil size={14} />
                Edit
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleStock}
              className="bg-white/90 hover:bg-white"
            >
              {product.isOutOfStock ? (
                <Eye size={14} />
              ) : (
                <EyeOff size={14} />
              )}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={onDelete}
              className="bg-white/90 hover:bg-white"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <p className="text-xs font-mono text-charcoal-400">
            {product.productCode}
          </p>
          <h3 className="font-semibold text-charcoal-700 mt-0.5 truncate">
            {product.name}
          </h3>
          <div className="flex items-center justify-between mt-2">
            <Badge variant="default" size="sm">
              {product.category?.name || "Uncategorized"}
            </Badge>
            <PriceDisplay amount={product.totalPrice} size="sm" />
          </div>
          {/* Mobile-visible actions (hover overlay is not accessible on touch) */}
          <div className="flex items-center gap-2 mt-3 sm:hidden">
            <Link href={`/admin/products/${product._id}/edit`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                <Pencil size={14} />
                Edit
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={onToggleStock}>
              {product.isOutOfStock ? <Eye size={14} /> : <EyeOff size={14} />}
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete} className="text-error">
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function ProductListItem({
  product,
  onDelete,
  onToggleStock,
}: {
  product: ProductItem;
  onDelete: () => void;
  onToggleStock: () => void;
}) {
  const image = product.thumbnailImage || product.images?.[0];

  return (
    <Card>
      <div className="flex items-center gap-4 p-4">
        {/* Thumbnail */}
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-charcoal-100">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Package size={20} className="text-charcoal-300" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-charcoal-700 truncate">
              {product.name}
            </h3>
            {product.isNewArrival && (
              <Badge variant="rose" size="sm">New</Badge>
            )}
            {!product.isActive && (
              <Badge variant="warning" size="sm">Hidden</Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs font-mono text-charcoal-400">
              {product.productCode}
            </span>
            <span className="text-xs text-charcoal-300">|</span>
            <span className="text-xs text-charcoal-400">
              {product.category?.name || "Uncategorized"}
            </span>
          </div>
        </div>

        {/* Price */}
        <PriceDisplay amount={product.totalPrice} />

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Link href={`/admin/products/${product._id}/edit`}>
            <Button variant="ghost" size="icon">
              <Pencil size={16} />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={onToggleStock}>
            {product.isOutOfStock ? <Eye size={16} /> : <EyeOff size={16} />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="text-charcoal-400 hover:text-error"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>
    </Card>
  );
}
