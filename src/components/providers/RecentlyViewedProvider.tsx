"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

export interface RecentlyViewedItem {
  productId: string;
  name: string;
  slug: string;
  thumbnailImage: string;
  totalPrice: number;
  category?: string;
  viewedAt: number;
}

interface RecentlyViewedContextType {
  items: RecentlyViewedItem[];
  addViewed: (item: Omit<RecentlyViewedItem, "viewedAt">) => void;
  clearViewed: () => void;
}

const RecentlyViewedContext = createContext<RecentlyViewedContextType | null>(null);

const STORAGE_KEY = "evaan-jewels-recently-viewed";
const MAX_ITEMS = 12;

function loadRecentlyViewed(): RecentlyViewedItem[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Ignore
  }
  return [];
}

export function RecentlyViewedProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<RecentlyViewedItem[]>(loadRecentlyViewed);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore
    }
  }, [items]);

  const addViewed = useCallback(
    (item: Omit<RecentlyViewedItem, "viewedAt">) => {
      setItems((prev) => {
        const filtered = prev.filter((i) => i.productId !== item.productId);
        return [{ ...item, viewedAt: Date.now() }, ...filtered].slice(
          0,
          MAX_ITEMS
        );
      });
    },
    []
  );

  const clearViewed = useCallback(() => {
    setItems([]);
  }, []);

  return (
    <RecentlyViewedContext.Provider value={{ items, addViewed, clearViewed }}>
      {children}
    </RecentlyViewedContext.Provider>
  );
}

export function useRecentlyViewed() {
  const context = useContext(RecentlyViewedContext);
  if (!context) {
    throw new Error(
      "useRecentlyViewed must be used within a RecentlyViewedProvider"
    );
  }
  return context;
}
