"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import { useCart } from "@/components/providers/CartProvider";
import { formatCurrency, roundToTen } from "@/lib/utils";

export function CartDrawer() {
  const { items, isOpen, setCartOpen, removeItem, updateQuantity, subtotal, itemCount } =
    useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => setCartOpen(false)}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-charcoal-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-gold-600" />
                <h2 className="text-lg font-semibold text-charcoal-700">
                  Shopping Cart
                </h2>
                {itemCount > 0 && (
                  <span className="rounded-full bg-gold-100 px-2 py-0.5 text-xs font-medium text-gold-700">
                    {itemCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-charcoal-400 transition-colors hover:bg-charcoal-50 hover:text-charcoal-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <ShoppingBag className="h-16 w-16 text-charcoal-200" />
                  <p className="mt-4 text-lg font-medium text-charcoal-500">
                    Your cart is empty
                  </p>
                  <p className="mt-1 text-sm text-charcoal-400">
                    Browse our collection and add items to your cart.
                  </p>
                  <Link
                    href="/categories"
                    onClick={() => setCartOpen(false)}
                    className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gold-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gold-600"
                  >
                    Browse Collection
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <ul className="space-y-4">
                  {items.map((item) => (
                    <li
                      key={item.cartItemId}
                      className="flex gap-4 rounded-xl border border-charcoal-100 p-3"
                    >
                      <Link
                        href={`/products/${item.slug}`}
                        onClick={() => setCartOpen(false)}
                        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-charcoal-50"
                      >
                        <Image
                          src={item.thumbnailImage}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </Link>
                      <div className="flex flex-1 flex-col">
                        <Link
                          href={`/products/${item.slug}`}
                          onClick={() => setCartOpen(false)}
                          className="text-sm font-semibold text-charcoal-700 hover:text-gold-700 line-clamp-2"
                        >
                          {item.name}
                        </Link>
                        {item.category && (
                          <p className="text-xs text-charcoal-400">
                            {item.category}
                          </p>
                        )}                        {(item.selectedSize || item.selectedColor) && (
                          <div className="mt-0.5 flex flex-wrap gap-1.5">
                            {item.selectedSize && (
                              <span className="rounded-md bg-gold-50 border border-gold-200 px-1.5 py-0.5 text-xs text-gold-700 font-medium">
                                Size: {item.selectedSize}
                              </span>
                            )}
                            {item.selectedColor && (
                              <span className="rounded-md bg-gold-50 border border-gold-200 px-1.5 py-0.5 text-xs text-gold-700 font-medium">
                                Color: {item.selectedColor}
                              </span>
                            )}
                          </div>
                        )}
                        {item.selectedMetalVariants && item.selectedMetalVariants.length > 0 && (
                          <div className="mt-0.5 flex flex-wrap gap-1.5">
                            {item.selectedMetalVariants.map((mv, idx) => (
                              <span
                                key={idx}
                                className="rounded-md bg-charcoal-50 border border-charcoal-200 px-1.5 py-0.5 text-xs text-charcoal-600 font-medium"
                              >
                                {mv.variantName}
                              </span>
                            ))}
                          </div>
                        )}                        <p className="mt-1 font-mono text-sm font-semibold text-gold-700">
                          {formatCurrency(roundToTen(item.totalPrice))}
                        </p>
                        <div className="mt-auto flex items-center justify-between pt-2">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.cartItemId,
                                  item.quantity - 1
                                )
                              }
                              className="flex h-7 w-7 items-center justify-center rounded-md border border-charcoal-200 text-charcoal-500 transition-colors hover:bg-charcoal-50"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-8 text-center text-sm font-medium text-charcoal-700">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.cartItemId,
                                  item.quantity + 1
                                )
                              }
                              className="flex h-7 w-7 items-center justify-center rounded-md border border-charcoal-200 text-charcoal-500 transition-colors hover:bg-charcoal-50"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.cartItemId)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-charcoal-300 transition-colors hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-charcoal-100 px-6 py-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-charcoal-500">Subtotal</span>
                  <span className="font-mono font-semibold text-charcoal-700">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <p className="text-xs text-charcoal-400">
                  Shipping calculated at checkout. Free shipping above ₹50,000.
                </p>
                <Link
                  href="/checkout"
                  onClick={() => setCartOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-gold-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-gold-600 hover:shadow-md active:scale-[0.98]"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Proceed to Checkout
                </Link>
                <Link
                  href="/categories"
                  onClick={() => setCartOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-charcoal-200 px-6 py-2.5 text-sm font-medium text-charcoal-600 transition-colors hover:bg-charcoal-50"
                >
                  Continue Shopping
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
