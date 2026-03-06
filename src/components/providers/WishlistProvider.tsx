"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { toast } from "sonner";

interface WishlistItem {
  productId: string;
  name: string;
  slug: string;
  thumbnailImage: string;
  totalPrice: number;
  category?: string;
}

interface WishlistContextType {
  items: WishlistItem[];
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (productId: string) => void;
  clearWishlist: () => void;
  itemCount: number;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

const WISHLIST_STORAGE_KEY = "evaan-jewels-wishlist";

function loadWishlist(): WishlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Ignore
  }
  return [];
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>(loadWishlist);

  // Persist to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage errors
    }
  }, [items]);

  const isInWishlist = useCallback(
    (productId: string) => items.some((i) => i.productId === productId),
    [items]
  );

  const toggleWishlist = useCallback(
    (item: WishlistItem) => {
      setItems((prev) => {
        const exists = prev.some((i) => i.productId === item.productId);
        if (exists) {
          toast.info(`${item.name} removed from wishlist`);
          return prev.filter((i) => i.productId !== item.productId);
        }
        toast.success(`${item.name} added to wishlist`);
        return [...prev, item];
      });
    },
    []
  );

  const removeFromWishlist = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
    toast.info("Removed from wishlist");
  }, []);

  const clearWishlist = useCallback(() => {
    setItems([]);
  }, []);

  return (
    <WishlistContext.Provider
      value={{
        items,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist,
        itemCount: items.length,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
