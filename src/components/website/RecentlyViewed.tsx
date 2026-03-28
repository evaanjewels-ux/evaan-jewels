"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRecentlyViewed } from "@/components/providers/RecentlyViewedProvider";
import { formatCurrency, roundToTen } from "@/lib/utils";

interface RecentlyViewedProps {
  /** Exclude this product from the list (the currently viewed product) */
  excludeProductId?: string;
}

export function RecentlyViewed({ excludeProductId }: RecentlyViewedProps) {
  const { items } = useRecentlyViewed();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const filtered = excludeProductId
    ? items.filter((i) => i.productId !== excludeProductId)
    : items;

  if (filtered.length === 0) return null;

  return (
    <section className="mt-16 border-t border-charcoal-100 pt-12">
      <h2 className="mb-6 font-heading text-2xl font-bold text-charcoal-700">
        Recently Viewed
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-charcoal-200">
        {filtered.map((item) => (
          <Link
            key={item.productId}
            href={`/products/${item.slug}`}
            className="group flex w-40 shrink-0 flex-col overflow-hidden rounded-xl bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover sm:w-48"
          >
            <div className="relative aspect-square overflow-hidden bg-charcoal-50">
              <Image
                src={item.thumbnailImage}
                alt={item.name}
                fill
                sizes="192px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="p-3">
              <p className="text-sm font-medium text-charcoal-700 line-clamp-1">
                {item.name}
              </p>
              {item.category && (
                <p className="text-xs text-charcoal-400">{item.category}</p>
              )}
              <p className="mt-1 font-mono text-sm font-semibold text-gold-700">
                {formatCurrency(roundToTen(item.totalPrice))}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
