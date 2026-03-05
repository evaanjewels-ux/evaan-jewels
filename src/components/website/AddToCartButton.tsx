"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "@/components/providers/CartProvider";
import type { ICartItem } from "@/types";

interface AddToCartButtonProps {
  product: {
    _id: string;
    name: string;
    slug: string;
    productCode: string;
    thumbnailImage: string;
    totalPrice: number;
    category?: { name: string } | null;
    metalComposition?: { variantName: string; weightInGrams: number }[];
    isOutOfStock?: boolean;
  };
  variant?: "primary" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AddToCartButton({
  product,
  variant = "primary",
  size = "md",
  className = "",
}: AddToCartButtonProps) {
  const { addItem } = useCart();

  const handleAdd = () => {
    if (product.isOutOfStock) return;

    const item: ICartItem = {
      cartItemId: `${product._id}||`,
      productId: product._id,
      name: product.name,
      slug: product.slug,
      productCode: product.productCode,
      thumbnailImage: product.thumbnailImage,
      totalPrice: product.totalPrice,
      quantity: 1,
      category:
        typeof product.category === "object" && product.category !== null
          ? product.category.name
          : undefined,
      metalComposition: product.metalComposition,
    };

    addItem(item);
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-5 py-2.5 text-sm gap-2",
    lg: "px-6 py-3.5 text-sm gap-2",
  };

  const variantClasses = {
    primary:
      "bg-gold-500 text-white shadow-sm hover:bg-gold-600 hover:shadow-md active:scale-[0.97]",
    outline:
      "border border-gold-500 text-gold-600 hover:bg-gold-50 active:scale-[0.97]",
  };

  if (product.isOutOfStock) {
    return (
      <button
        disabled
        className={`inline-flex items-center justify-center rounded-lg bg-charcoal-200 text-charcoal-400 cursor-not-allowed font-medium ${sizeClasses[size]} ${className}`}
      >
        Out of Stock
      </button>
    );
  }

  return (
    <button
      onClick={handleAdd}
      className={`inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      <ShoppingCart className="h-4 w-4" />
      Add to Cart
    </button>
  );
}
