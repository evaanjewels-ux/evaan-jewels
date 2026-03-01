"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { useLanguage } from "@/components/providers/LanguageProvider";

// Hindi translations for common jewelry category names
const CATEGORY_HINDI_MAP: Record<string, string> = {
  // Singular & plural forms
  "Necklace": "हार",
  "Necklaces": "हार",
  "Ring": "अंगूठी",
  "Rings": "अंगूठियाँ",
  "Bangle": "चूड़ी",
  "Bangles": "चूड़ियाँ",
  "Earring": "झुमका",
  "Earrings": "झुमके",
  "Bracelet": "कंगन",
  "Bracelets": "कंगन",
  "Pendant": "पेंडेंट",
  "Pendants": "पेंडेंट",
  "Chain": "चेन",
  "Chains": "चेन",
  "Anklet": "पायल",
  "Anklets": "पायल",
  "Nose Pin": "नाक की पिन",
  "Nose Pins": "नाक की पिन",
  "Mangalsutra": "मंगलसूत्र",
  "Kada": "कड़ा",
  "Kadas": "कड़ा",
  "Maang Tikka": "मांग टीका",
  "Jhumka": "झुमका",
  "Jhumkas": "झुमके",
  "Gold Coin": "सोने का सिक्का",
  "Gold Coins": "सोने के सिक्के",
  "Choker": "चोकर",
  "Chokers": "चोकर",
  "Hoop": "हूप",
  "Hoops": "हूप",
  "Stud": "स्टड",
  "Studs": "स्टड",
  "Locket": "लॉकेट",
  "Lockets": "लॉकेट",
  "Haar": "हार",
  "Payal": "पायल",
  "Tikka": "टीका",
  "Wedding Collection": "विवाह संग्रह",
  "Bridal Collection": "दुल्हन संग्रह",
  "Temple Jewelry": "मंदिर आभूषण",
  "Antique": "प्राचीन",
  "Diamond": "हीरा",
  "Diamond Jewelry": "हीरे के आभूषण",
  "Gold Jewelry": "सोने के आभूषण",
  "Silver": "चाँदी",
  "Silver Jewelry": "चाँदी के आभूषण",
};

interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
  image: string;
  description?: string;
  productCount?: number;
}

interface CategoryGridProps {
  categories: CategoryItem[];
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  const { language, t } = useLanguage();
  if (!categories.length) return null;

  const getCategoryDisplayName = (name: string) => {
    if (language === "hi") {
      return CATEGORY_HINDI_MAP[name] ?? name;
    }
    return name;
  };

  return (
    <section className="py-12 md:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-10 text-center md:mb-12">
          <h2 className="font-heading text-2xl font-bold text-charcoal-700 sm:text-3xl">
            {t("section.categories")}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-charcoal-400">
            {t("section.categoriesSubtitle")}
          </p>
        </div>

        {/* Grid */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4"
        >
          {categories.map((category, index) => (
            <motion.div key={category._id} variants={staggerItem}>
              <Link
                href={`/categories/${category.slug}`}
                className="group relative block overflow-hidden rounded-xl bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
              >
                {/* Image */}
                <div className="relative aspect-3/4 overflow-hidden bg-charcoal-100">
                  <Image
                    src={category.image}
                    alt={`${category.name} — Jewelry Collection | Evaan Jewels`}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    priority={index < 4}
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-linear-to-t from-charcoal-900/70 via-transparent to-transparent" />
                </div>

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-base font-semibold text-white sm:text-lg">
                    {getCategoryDisplayName(category.name)}
                  </h3>
                  {category.productCount !== undefined && (
                    <p className="mt-0.5 text-xs text-charcoal-300">
                      {category.productCount} {category.productCount === 1 ? (language === "hi" ? "उत्पाद" : "Product") : (language === "hi" ? "उत्पाद" : "Products")}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-1 text-xs font-medium text-gold-400 transition-colors group-hover:text-gold-300">
                    {language === "hi" ? "देखें" : "Explore"}
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* View All */}
        <div className="mt-10 text-center">
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 text-sm font-medium text-gold-600 transition-colors hover:text-gold-700"
          >
            {t("section.viewAll")} {language === "hi" ? "श्रेणियाँ" : "Categories"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
