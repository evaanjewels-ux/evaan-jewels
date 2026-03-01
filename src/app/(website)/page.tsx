import { Suspense } from "react";
import dbConnect from "@/lib/db";
import Category from "@/models/Category";
import Product from "@/models/Product";
import { HeroSection } from "@/components/website/HeroSection";
import { PriceTicker } from "@/components/website/PriceTicker";
import { CategoryGrid } from "@/components/website/CategoryGrid";
import { ProductGrid } from "@/components/website/ProductGrid";
import { TrustBadges } from "@/components/website/TrustBadges";
import { JsonLd } from "@/components/shared/JsonLd";
import { createMetadata, organizationJsonLd, localBusinessJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const metadata = createMetadata({
  title: "Premium Gold & Diamond Jewelry",
  description:
    "Discover exquisite gold, diamond, and precious gemstone jewelry at Evaan Jewels. BIS Hallmark certified. Crafted with precision, worn with pride.",
  path: "/",
  keywords: [
    "gold jewelry shop",
    "diamond jewelry",
    "hallmark gold",
    "BIS certified jewelry",
    "wedding jewelry",
    "bridal jewelry",
    "evaan jewels",
  ],
});

function SectionSkeleton() {
  return (
    <div className="py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 space-y-3">
          <div className="h-8 w-48 animate-pulse rounded bg-charcoal-100" />
          <div className="h-4 w-72 animate-pulse rounded bg-charcoal-100" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-xl bg-charcoal-100" />
          ))}
        </div>
      </div>
    </div>
  );
}

async function CategoriesSection() {
  let categories: unknown[] = [];
  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      await dbConnect();
      categories = await Category.find({ isActive: true })
        .sort({ order: 1 })
        .populate("productCount")
        .limit(8)
        .lean();
      break;
    } catch (err) {
      console.error(`CategoriesSection attempt ${attempt + 1} failed:`, err);
      if (attempt === 2) return null;
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  return <CategoryGrid categories={JSON.parse(JSON.stringify(categories))} />;
}

async function NewArrivalsSection() {
  let products: unknown[] = [];
  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      await dbConnect();
      products = await Product.find({ isActive: true, isNewArrival: true })
        .populate("category", "name slug")
        .sort({ createdAt: -1 })
        .limit(8)
        .lean();
      break;
    } catch (err) {
      console.error(`NewArrivalsSection attempt ${attempt + 1} failed:`, err);
      if (attempt === 2) return null;
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  return (
    <ProductGrid
      products={JSON.parse(JSON.stringify(products))}
      title="New Arrivals"
      subtitle="The latest additions to our collection"
      viewAllHref="/new-arrivals"
      viewAllLabel="View All New Arrivals"
      titleKey="section.newArrivals"
      subtitleKey="section.newArrivalsSubtitle"
      viewAllLabelKey="section.viewAllNew"
    />
  );
}

async function FeaturedSection() {
  let products: unknown[] = [];
  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      await dbConnect();
      products = await Product.find({ isActive: true, isFeatured: true })
        .populate("category", "name slug")
        .sort({ createdAt: -1 })
        .limit(8)
        .lean();
      break;
    } catch (err) {
      console.error(`FeaturedSection attempt ${attempt + 1} failed:`, err);
      if (attempt === 2) return null;
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  return (
    <ProductGrid
      products={JSON.parse(JSON.stringify(products))}
      title="Featured Collection"
      subtitle="Handpicked pieces from our finest selection"
      viewAllHref="/featured"
      viewAllLabel="View Featured"
      titleKey="section.featured"
      subtitleKey="section.featuredSubtitle"
      viewAllLabelKey="section.viewFeatured"
    />
  );
}

export default function HomePage() {
  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={localBusinessJsonLd()} />

      {/* Hero — renders immediately */}
      <HeroSection />

      {/* Live Price Ticker */}
      <Suspense fallback={<div className="h-14 animate-pulse bg-charcoal-50" />}>
        <PriceTicker />
      </Suspense>

      {/* Categories — streamed */}
      <Suspense fallback={<SectionSkeleton />}>
        <CategoriesSection />
      </Suspense>

      {/* New Arrivals — streamed */}
      <Suspense fallback={<SectionSkeleton />}>
        <NewArrivalsSection />
      </Suspense>

      {/* Trust Badges */}
      <TrustBadges />

      {/* Featured Products — streamed */}
      <Suspense fallback={<SectionSkeleton />}>
        <FeaturedSection />
      </Suspense>

      {/* About Section */}
      <section className="py-12 md:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-heading text-2xl font-bold text-charcoal-700 sm:text-3xl">
              About Evaan Jewels
            </h2>
            <p className="mt-4 text-charcoal-400 leading-relaxed">
              For over two decades, Evaan Jewels has been crafting exquisite
              jewelry that celebrates life&apos;s most precious moments. Every piece in
              our collection is BIS Hallmark certified, ensuring the highest standards
              of purity and craftsmanship.
            </p>
            <p className="mt-3 text-charcoal-400 leading-relaxed">
              From timeless gold bangles to stunning diamond rings, our master
              artisans blend traditional techniques with contemporary design to create
              jewelry that tells your unique story.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
