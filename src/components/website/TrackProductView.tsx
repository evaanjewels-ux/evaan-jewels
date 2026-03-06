"use client";

import { useEffect } from "react";
import { useRecentlyViewed } from "@/components/providers/RecentlyViewedProvider";

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.productId]);

  return null;
}
