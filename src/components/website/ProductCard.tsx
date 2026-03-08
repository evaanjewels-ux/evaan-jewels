"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

interface ProductCardProps {
  product: {
    _id: string;
    name: string;
    slug: string;
    productCode: string;
    thumbnailImage: string;
    totalPrice: number;
    category?: { name: string; slug: string };
    gender: string;
    isNewArrival: boolean;
    isOutOfStock: boolean;
    isFeatured: boolean;
    hallmarkCertified?: boolean;
    metalComposition?: { variantName: string; weightInGrams: number }[];
  };
  className?: string;
  priority?: boolean;
}

export function ProductCard({ product, className, priority = false }: ProductCardProps) {
  const primaryMetal = product.metalComposition?.[0];

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover",
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-charcoal-50">
        <Image
          src={product.thumbnailImage}
          alt={`${product.name}${product.category ? ` — ${product.category.name}` : ""} | Evaan Jewels`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          priority={priority}
        />

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {product.isNewArrival && (
            <Badge variant="rose" size="sm">New</Badge>
          )}
          {product.isFeatured && (
            <Badge variant="gold" size="sm">Featured</Badge>
          )}
          {product.isOutOfStock && (
            <Badge variant="error" size="sm">Sold Out</Badge>
          )}
          {product.hallmarkCertified && (
            <Badge variant="success" size="sm">Hallmark</Badge>
          )}
        </div>

        {/* Quick View Hover Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-charcoal-900/0 opacity-0 transition-all duration-300 group-hover:bg-charcoal-900/20 group-hover:opacity-100">
          <div className="flex items-center gap-2 rounded-lg bg-white/90 px-4 py-2 text-xs font-medium text-charcoal-700 shadow-sm backdrop-blur-sm">
            <Eye className="h-3.5 w-3.5" />
            View Details
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {/* Category */}
        {product.category && (
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gold-600">
            {product.category.name}
          </p>
        )}

        {/* Name */}
        <h3 className="line-clamp-2 text-sm font-semibold text-charcoal-700 transition-colors group-hover:text-gold-700 sm:text-base">
          {product.name}
        </h3>

        {/* Metal Info */}
        {primaryMetal && (
          <p className="mt-1 text-xs text-charcoal-400">
            {primaryMetal.variantName} · {primaryMetal.weightInGrams}g
          </p>
        )}

        {/* Price */}
        <div className="mt-auto pt-3">
          <span className="font-mono text-base font-semibold text-gold-700 sm:text-lg">
            {formatCurrency(product.totalPrice)}
          </span>
        </div>

        {/* Product Code */}
        <p className="mt-1 font-mono text-[11px] text-charcoal-300">
          {product.productCode}
        </p>
      </div>
    </Link>
  );
}
