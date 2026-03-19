import { Metadata } from "next";
import { notFound } from "next/navigation";
import dbConnect from "@/lib/db";
import Category from "@/models/Category";
import Product from "@/models/Product";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { ProductCard } from "@/components/website/ProductCard";
import { CategoryFilters } from "./CategoryFilters";
import { JsonLd } from "@/components/shared/JsonLd";
import { breadcrumbJsonLd, collectionPageJsonLd, itemListJsonLd, SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const maxDuration = 60;

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    gender?: string;
    sort?: string;
    page?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    await dbConnect();
    const category = await Category.findOne({ slug, isActive: true }).lean();

    if (!category) {
      return { title: "Category Not Found" };
    }

    const description =
      category.description ||
      `Explore our ${category.name} collection — premium handcrafted jewelry at Evaan Jewels.`;

    return {
      title: `${category.name} — Handcrafted Gold & Diamond Jewelry`,
      description,
      keywords: [
        category.name.toLowerCase(),
        `${category.name.toLowerCase()} jewelry`,
        `buy ${category.name.toLowerCase()} online`,
        `gold ${category.name.toLowerCase()}`,
        `diamond ${category.name.toLowerCase()}`,
        "hallmark jewelry",
        "evaan jewels",
      ],
      alternates: {
        canonical: `${SITE_URL}/categories/${slug}`,
      },
      openGraph: {
        title: `${category.name} | Evaan Jewels`,
        description,
        url: `${SITE_URL}/categories/${slug}`,
        siteName: "Evaan Jewels",
        ...(category.image && {
          images: [{ url: category.image, alt: category.name }],
        }),
      },
      twitter: {
        card: "summary_large_image",
        title: `${category.name} | Evaan Jewels`,
        description,
      },
    };
  } catch {
    return { title: "Category" };
  }
}

async function getCategoryData(
  slug: string,
  filters: {
    gender?: string;
    sort?: string;
    page?: string;
    minPrice?: string;
    maxPrice?: string;
  },
  retries = 4
) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await dbConnect();

      if (attempt > 0) {
        const { connection } = await import("mongoose");
        await connection.db?.admin().ping();
      }

      const category = await Category.findOne({ slug, isActive: true }).lean();
      if (!category) return null;

  const filter: Record<string, unknown> = {
    category: category._id,
    isActive: true,
  };

  if (filters.gender) filter.gender = filters.gender;
  if (filters.minPrice || filters.maxPrice) {
    filter.totalPrice = {};
    if (filters.minPrice)
      (filter.totalPrice as Record<string, number>).$gte = Number(filters.minPrice);
    if (filters.maxPrice)
      (filter.totalPrice as Record<string, number>).$lte = Number(filters.maxPrice);
  }

  let sortQuery = "-createdAt";
  if (filters.sort === "price-asc") sortQuery = "totalPrice";
  else if (filters.sort === "price-desc") sortQuery = "-totalPrice";
  else if (filters.sort === "newest") sortQuery = "-createdAt";

  const page = Math.max(1, Number(filters.page) || 1);
  const limit = 12;
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("category", "name slug")
      .sort(sortQuery)
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  return {
    category: JSON.parse(JSON.stringify(category)),
    products: JSON.parse(JSON.stringify(products)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
    } catch (err) {
      console.error(`getCategoryData attempt ${attempt + 1} failed:`, err);
      if (attempt === retries) return null;
      await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
    }
  }
  return null;
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug } = await params;
  const filters = await searchParams;
  const data = await getCategoryData(slug, filters);

  if (!data) notFound();

  const { category, products, pagination } = data;

  return (
    <div className="py-8 md:py-12">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: SITE_URL },
          { name: "Categories", url: `${SITE_URL}/categories` },
          { name: category.name, url: `${SITE_URL}/categories/${category.slug}` },
        ])}
      />
      <JsonLd
        data={collectionPageJsonLd({
          name: category.name,
          description:
            category.description ||
            `Explore our ${category.name} collection at Evaan Jewels.`,
          url: `${SITE_URL}/categories/${category.slug}`,
        })}
      />
      {products.length > 0 && (
        <JsonLd
          data={itemListJsonLd(
            products.map(
              (
                product: { name: string; slug: string; thumbnailImage: string },
                i: number
              ) => ({
                name: product.name,
                url: `${SITE_URL}/products/${product.slug}`,
                image: product.thumbnailImage,
                position: i + 1,
              })
            )
          )}
        />
      )}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Breadcrumb
            homeHref="/"
            items={[
              { label: "Home", href: "/" },
              { label: "Categories", href: "/categories" },
              { label: category.name },
            ]}
          />
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h1 className="font-heading text-3xl font-bold text-charcoal-700 sm:text-4xl">
                {category.name}
              </h1>
              {category.description && (
                <p className="mt-2 max-w-lg text-charcoal-400">
                  {category.description}
                </p>
              )}
              <p className="mt-1 text-sm text-charcoal-300">
                {pagination.total}{" "}
                {pagination.total === 1 ? "product" : "products"}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <CategoryFilters />

        {/* Products Grid */}
        {products.length > 0 ? (
          <>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
              {products.map(
                (product: {
                  _id: string;
                  name: string;
                  slug: string;
                  productCode: string;
                  thumbnailImage: string;
                  totalPrice: number;
                  category: { name: string; slug: string };
                  gender: string;
                  isNewArrival: boolean;
                  isOutOfStock: boolean;
                  isFeatured: boolean;
                  metalComposition: {
                    variantName: string;
                    weightInGrams: number;
                  }[];
                }) => (
                  <ProductCard key={product._id} product={product} />
                )
              )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
                  (pageNum) => (
                    <a
                      key={pageNum}
                      href={`?page=${pageNum}${
                        filters.gender ? `&gender=${filters.gender}` : ""
                      }${filters.sort ? `&sort=${filters.sort}` : ""}${
                        filters.minPrice ? `&minPrice=${filters.minPrice}` : ""
                      }${filters.maxPrice ? `&maxPrice=${filters.maxPrice}` : ""}`}
                      className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                        pageNum === pagination.page
                          ? "bg-gold-500 text-white"
                          : "border border-charcoal-200 text-charcoal-500 hover:bg-charcoal-50"
                      }`}
                    >
                      {pageNum}
                    </a>
                  )
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-lg text-charcoal-400">
              No products found in this category.
            </p>
            <p className="mt-1 text-sm text-charcoal-300">
              Try adjusting your filters or check back soon.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
