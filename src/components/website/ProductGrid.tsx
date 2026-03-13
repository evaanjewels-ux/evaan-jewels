"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "./ProductCard";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface Product {
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
  metalComposition?: { variantName: string; weightInGrams: number }[];
  videos?: { type: "upload" | "external"; url: string; thumbnailUrl?: string }[];
}

interface ProductGridProps {
  products: Product[];
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  /** Translation keys — when provided, resolved via useLanguage() */
  titleKey?: string;
  subtitleKey?: string;
  viewAllLabelKey?: string;
}

export function ProductGrid({
  products,
  title,
  subtitle,
  viewAllHref,
  viewAllLabel = "View All",
  titleKey,
  subtitleKey,
  viewAllLabelKey,
}: ProductGridProps) {
  const { t } = useLanguage();
  if (!products.length) return null;

  const displayTitle = titleKey ? t(titleKey) : title;
  const displaySubtitle = subtitleKey ? t(subtitleKey) : subtitle;
  const displayViewAllLabel = viewAllLabelKey ? t(viewAllLabelKey) : viewAllLabel;

  return (
    <section className="py-12 md:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-10 flex items-end justify-between md:mb-12">
          <div>
            <h2 className="font-heading text-2xl font-bold text-charcoal-700 sm:text-3xl">
              {displayTitle}
            </h2>
            {displaySubtitle && (
              <p className="mt-2 text-charcoal-400">{displaySubtitle}</p>
            )}
          </div>
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="hidden items-center gap-1 text-sm font-medium text-gold-600 transition-colors hover:text-gold-700 sm:flex"
            >
              {displayViewAllLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {/* Grid */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4"
        >
          {products.map((product, index) => (
            <motion.div key={product._id} variants={staggerItem}>
              <ProductCard product={product} priority={index < 4} />
            </motion.div>
          ))}
        </motion.div>

        {/* Mobile View All */}
        {viewAllHref && (
          <div className="mt-8 text-center sm:hidden">
            <Link
              href={viewAllHref}
              className="inline-flex items-center gap-2 text-sm font-medium text-gold-600 transition-colors hover:text-gold-700"
            >
              {displayViewAllLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
