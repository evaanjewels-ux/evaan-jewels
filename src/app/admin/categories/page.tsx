"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Trash2,
  Pencil,
  GripVertical,
  ImageIcon,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SearchBar } from "@/components/ui/SearchBar";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { staggerContainer, staggerItem } from "@/lib/animations";

interface Category {
  _id: string;
  name: string;
  slug: string;
  image: string;
  description?: string;
  order: number;
  isActive: boolean;
  productCount?: number;
  createdAt: string;
}

export default function CategoriesListPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCategories = useCallback(async (retries = 3) => {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/categories?_t=${Date.now()}`, { cache: "no-store" });
        const data = await res.json();
        if (data.success) {
          setCategories(data.data);
          setIsLoading(false);
          return;
        }
      } catch {
        if (attempt === retries - 1) toast.error("Failed to load categories");
      }
      if (attempt < retries - 1) await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    // Check if category has products
    if (deleteTarget.productCount && deleteTarget.productCount > 0) {
      toast.error(
        `Cannot delete "${deleteTarget.name}" — it has ${deleteTarget.productCount} product(s). Reassign products first.`
      );
      setDeleteTarget(null);
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/categories/${deleteTarget._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Category deleted successfully");
        setCategories((prev) =>
          prev.filter((c) => c._id !== deleteTarget._id)
        );
      } else {
        toast.error(data.error || "Failed to delete category");
      }
    } catch {
      toast.error("Failed to delete category");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Categories" },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-charcoal-700">
            Categories
          </h1>
          <p className="text-sm text-charcoal-400 mt-1">
            Manage product categories and their display order
          </p>
        </div>
        <Link href="/admin/categories/new">
          <Button variant="primary">
            <Plus size={18} />
            Add Category
          </Button>
        </Link>
      </div>

      {/* Search */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search categories..."
      />

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <div className="p-0">
                <Skeleton className="aspect-3/4 w-full rounded-t-xl" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : filteredCategories.length === 0 ? (
        <EmptyState
          icon={search ? Search : ImageIcon}
          title={search ? "No categories found" : "No categories yet"}
          description={
            search
              ? "Try a different search term"
              : "Create your first category to organize products"
          }
          action={
            !search ? (
              <Link href="/admin/categories/new">
                <Button variant="primary">
                  <Plus size={18} />
                  Add Category
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
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {filteredCategories.map((category) => (
            <motion.div key={category._id} variants={staggerItem}>
              <CategoryCard
                category={category}
                onDelete={() => setDeleteTarget(category)}
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
        title="Delete Category"
        description={
          deleteTarget?.productCount && deleteTarget.productCount > 0
            ? `"${deleteTarget?.name}" has ${deleteTarget?.productCount} product(s). You must reassign products before deleting this category.`
            : `Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`
        }
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

function CategoryCard({
  category,
  onDelete,
}: {
  category: Category;
  onDelete: () => void;
}) {
  return (
    <Card hover>
      <div className="group relative">
        {/* Image */}
        <div className="relative aspect-3/4 overflow-hidden rounded-t-xl bg-charcoal-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={category.image}
            alt={category.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-103"
          />

          {/* Status badge */}
          {!category.isActive && (
            <div className="absolute top-2 left-2">
              <Badge variant="warning" size="sm">
                Hidden
              </Badge>
            </div>
          )}

          {/* Order badge */}
          <div className="absolute top-2 right-2">
            <span className="flex items-center gap-1 rounded-full bg-charcoal-800/70 px-2 py-0.5 text-[10px] font-medium text-white">
              <GripVertical size={10} />
              #{category.order}
            </span>
          </div>

          {/* Hover overlay with actions */}
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-charcoal-900/0 opacity-0 group-hover:bg-charcoal-900/40 group-hover:opacity-100 transition-all duration-200">
            <Link href={`/admin/categories/${category._id}/edit`}>
              <Button variant="secondary" size="sm" className="bg-white/90 hover:bg-white">
                <Pencil size={14} />
                Edit
              </Button>
            </Link>
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
          <h3 className="font-semibold text-charcoal-700 truncate">
            {category.name}
          </h3>
          {category.description && (
            <p className="text-sm text-charcoal-400 mt-0.5 line-clamp-1">
              {category.description}
            </p>
          )}
          <div className="flex items-center gap-1 mt-2 text-xs text-charcoal-400">
            <Package size={12} />
            <span>
              {category.productCount ?? 0}{" "}
              {(category.productCount ?? 0) === 1 ? "product" : "products"}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
