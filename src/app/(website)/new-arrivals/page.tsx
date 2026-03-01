import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { ProductCard } from "@/components/website/ProductCard";
import { createMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

interface ProductCardData {
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
  metalComposition: { variantName: string; weightInGrams: number }[];
}

export const metadata = createMetadata({
  title: "New Arrivals",
  description:
    "Discover the latest additions to our jewelry collection — freshly crafted gold, diamond, and gemstone pieces at Evaan Jewels.",
  path: "/new-arrivals",
  keywords: ["new jewelry", "latest jewelry", "new gold designs", "new diamond jewelry"],
});

async function getNewArrivals(retries = 2): Promise<ProductCardData[]> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await dbConnect();
      const products = await Product.find({ isActive: true, isNewArrival: true })
        .populate("category", "name slug")
        .sort({ createdAt: -1 })
        .lean();
      return JSON.parse(JSON.stringify(products));
    } catch (err) {
      console.error(`getNewArrivals attempt ${attempt + 1} failed:`, err);
      if (attempt === retries) return [];
      // Small delay before retry
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  return [];
}

export default async function NewArrivalsPage() {
  const products = await getNewArrivals();

  return (
    <div className="py-8 md:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumb
          homeHref="/"
          items={[
            { label: "Home", href: "/" },
            { label: "New Arrivals" },
          ]}
        />
        <h1 className="mt-4 font-heading text-3xl font-bold text-charcoal-700 sm:text-4xl">
          New Arrivals
        </h1>
        <p className="mt-2 text-charcoal-400">
          The latest additions to our collection — {products.length}{" "}
          {products.length === 1 ? "piece" : "pieces"}
        </p>

        {products.length > 0 ? (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            )
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-lg text-charcoal-400">
              No new arrivals at the moment.
            </p>
            <p className="mt-1 text-sm text-charcoal-300">
              Check back soon for our latest pieces.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
