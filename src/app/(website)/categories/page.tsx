import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import dbConnect from "@/lib/db";
import Category from "@/models/Category";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { JsonLd } from "@/components/shared/JsonLd";
import { createMetadata, breadcrumbJsonLd, SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const metadata = createMetadata({
  title: "All Categories",
  description:
    "Browse our complete jewelry collection by category — gold rings, necklaces, bangles, earrings, diamonds, and more at Evaan Jewels.",
  path: "/categories",
  keywords: ["jewelry categories", "gold rings", "necklaces", "bangles", "earrings", "diamond jewelry"],
});

async function getCategories(retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await dbConnect();
      const categories = await Category.find({ isActive: true })
        .sort({ order: 1 })
        .populate("productCount")
        .lean();
      return JSON.parse(JSON.stringify(categories));
    } catch (err) {
      console.error(`getCategories attempt ${attempt + 1} failed:`, err);
      if (attempt === retries) return [];
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  return [];
}

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="py-8 md:py-12">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: SITE_URL },
          { name: "Categories", url: `${SITE_URL}/categories` },
        ])}
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "Categories" },
            ]}
          />
          <h1 className="mt-4 font-heading text-3xl font-bold text-charcoal-700 sm:text-4xl">
            Our Collections
          </h1>
          <p className="mt-2 max-w-lg text-charcoal-400">
            Explore our exquisite range of handcrafted jewelry, from timeless
            classics to contemporary designs.
          </p>
        </div>

        {/* Categories Grid */}
        {categories.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map(
              (category: {
                _id: string;
                name: string;
                slug: string;
                image: string;
                description?: string;
                productCount?: number;
              }) => (
                <Link
                  key={category._id}
                  href={`/categories/${category.slug}`}
                  className="group relative overflow-hidden rounded-xl bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
                >
                  <div className="relative aspect-4/3 overflow-hidden">
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-charcoal-900/60 via-charcoal-900/10 to-transparent" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h2 className="text-xl font-semibold text-white">
                      {category.name}
                    </h2>
                    {category.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-charcoal-200">
                        {category.description}
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      {category.productCount !== undefined && (
                        <span className="text-xs text-charcoal-300">
                          {category.productCount}{" "}
                          {category.productCount === 1 ? "Product" : "Products"}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs font-medium text-gold-400 transition-colors group-hover:text-gold-300">
                        Explore
                        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </Link>
              )
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-lg text-charcoal-400">
              No categories available yet.
            </p>
            <p className="mt-1 text-sm text-charcoal-300">
              Check back soon for our latest collections.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
