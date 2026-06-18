"use client";

import { useEffect } from "react";
import { useRecentlyViewed } from "@/components/providers/RecentlyViewedProvider";
import { trackViewContent } from "@/lib/analytics";

interface TrackProductViewProps {
  product: {
    productId: string;
    name: string;
    slug: string;
    thumbnailImage: string;
    totalPrice: number;
    category?: string;
  };
}

export function TrackProductView({ product }: TrackProductViewProps) {
  const { addViewed } = useRecentlyViewed();

  useEffect(() => {
    addViewed(product);
    trackViewContent({
      productId: product.productId,
      name: product.name,
      price: product.totalPrice,
      category: product.category,
    });
    // Ensure product page starts at top after content loads (mobile category → product nav)
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.productId]);

  return null;
}
