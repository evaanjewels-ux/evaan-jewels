"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { useWishlist } from "@/components/providers/WishlistProvider";
import { formatCurrency, roundToTen } from "@/lib/utils";
import { Breadcrumb } from "@/components/shared/Breadcrumb";

export function WishlistClient() {
  const { items, removeFromWishlist } = useWishlist();

  return (
    <div className="py-8 md:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumb
          homeHref="/"
          items={[
            { label: "Home", href: "/" },
            { label: "Wishlist" },
          ]}
        />

        <div className="mt-6 flex items-center gap-3">
          <Heart className="h-6 w-6 text-rose-500 fill-rose-500" />
          <h1 className="font-heading text-2xl font-bold text-charcoal-700 sm:text-3xl">
            My Wishlist
          </h1>
          {items.length > 0 && (
            <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-700">
              {items.length} item{items.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {items.length === 0 ? (
          <div className="mt-16 flex flex-col items-center justify-center text-center">
            <Heart className="h-20 w-20 text-charcoal-200" />
            <p className="mt-4 text-lg font-medium text-charcoal-500">
              Your wishlist is empty
            </p>
            <p className="mt-1 text-sm text-charcoal-400">
              Browse our collection and save items you love.
            </p>
            <Link
              href="/categories"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gold-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gold-600"
            >
              <ShoppingBag className="h-4 w-4" />
              Browse Collection
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <div
                key={item.productId}
                className="group relative flex flex-col overflow-hidden rounded-xl bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
              >
                <Link
                  href={`/products/${item.slug}`}
                  className="relative aspect-square overflow-hidden bg-charcoal-50"
                >
                  <Image
                    src={item.thumbnailImage}
                    alt={item.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </Link>

                {/* Remove button */}
                <button
                  onClick={() => removeFromWishlist(item.productId)}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-rose-500 shadow-sm backdrop-blur-sm transition-colors hover:bg-rose-50"
                  title="Remove from wishlist"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                <div className="flex flex-1 flex-col p-3 sm:p-4">
                  <Link
                    href={`/products/${item.slug}`}
                    className="text-sm font-medium text-charcoal-700 line-clamp-2 hover:text-gold-700"
                  >
                    {item.name}
                  </Link>
                  {item.category && (
                    <p className="mt-0.5 text-xs text-charcoal-400">
                      {item.category}
                    </p>
                  )}
                  <p className="mt-2 font-mono text-sm font-semibold text-gold-700">
                    {formatCurrency(roundToTen(item.totalPrice))}
                  </p>
                  <Link
                    href={`/products/${item.slug}`}
                    className="mt-3 inline-flex items-center justify-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-gold-600"
                  >
                    View Product
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
