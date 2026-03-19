import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import Metal from "@/models/Metal";
import Gemstone from "@/models/Gemstone";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { Badge } from "@/components/ui/Badge";
import { ProductDetailClient } from "@/components/website/ProductDetailClient";
import { ProductCard } from "@/components/website/ProductCard";
import { TrackProductView } from "@/components/website/TrackProductView";
import { RecentlyViewed } from "@/components/website/RecentlyViewed";
import { JsonLd } from "@/components/shared/JsonLd";
import { formatCurrency, capitalize } from "@/lib/utils";
import { productJsonLd, breadcrumbJsonLd, SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const maxDuration = 60;

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  try {
    const { slug } = await params;

    // generateMetadata is the FIRST function to run on cold starts,
    // so warm the DB connection here to benefit the page component.
    for (let attempt = 0; attempt < 3; attempt++) {
      await dbConnect();
      const product = await Product.findOne({ slug, isActive: true })
        .populate("category", "name slug")
        .lean();

      if (!product) {
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
          continue;
        }
        return { title: "Product Not Found" };
      }

    const categoryName =
      typeof product.category === "object" && product.category !== null
        ? (product.category as unknown as { name: string }).name
        : "";

    const description =
      product.metaDescription ||
      `Buy ${product.name} — Premium ${categoryName} from Evaan Jewels, Delhi. ${
        product.metalComposition?.[0]?.variantName || "Gold"
      } jewelry, BIS Hallmark certified. Price: ${formatCurrency(product.totalPrice)}. ${
        product.grossWeight > 0 ? `Weight: ${product.grossWeight}g.` : ""
      } Free shipping & easy exchange.`;

    const url = `${SITE_URL}/products/${slug}`;

    return {
      title: `${product.name} — ${categoryName} | Buy Online`,
      description,
      alternates: { canonical: url },
      keywords: [
        product.name.toLowerCase(),
        categoryName.toLowerCase(),
        `${categoryName.toLowerCase()} online`,
        `buy ${categoryName.toLowerCase()}`,
        product.metalComposition?.[0]?.variantName?.toLowerCase() || "gold",
        "evaan jewels",
        "hallmark jewelry",
        "BIS certified",
      ].filter(Boolean),
      openGraph: {
        title: `${product.name} | Evaan Jewels — Buy Online`,
        description,
        url,
        siteName: "Evaan Jewels",
        type: "website",
        images: product.images?.length
          ? product.images.map((img: string) => ({ url: img, alt: product.name }))
          : product.thumbnailImage
            ? [{ url: product.thumbnailImage, alt: product.name }]
            : [],
      },
      twitter: {
        card: "summary_large_image",
        title: `${product.name} | Evaan Jewels`,
        description,
        images: product.images?.length
          ? [product.images[0]]
          : product.thumbnailImage ? [product.thumbnailImage] : [],
      },
    };
    }
    // All retry attempts exhausted without finding the product
    return { title: "Product Not Found" };
  } catch {
    return { title: "Product" };
  }
}

async function getProductData(slug: string, retries = 3) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await dbConnect();

      // Ping on cold starts to ensure the connection is truly live.
      // Skip on first attempt if we just connected (dbConnect already validates).
      if (attempt > 0) {
        const { connection } = await import("mongoose");
        if (connection.readyState === 1) {
          try {
            await connection.db?.admin().ping();
          } catch {
            console.warn(`[getProductData] ping failed on attempt ${attempt + 1}, reconnecting…`);
            connection.close().catch(() => {});
            const dbConnect = (await import("@/lib/db")).default;
            await dbConnect();
          }
        }
      }

      const product = await Product.findOne({ slug, isActive: true })
        .populate("category", "name slug")
        .lean();

      // On cold starts, findOne() can return null even for valid slugs because
      // the connection pool isn't fully warmed.  Retry a few times before
      // concluding the product genuinely doesn't exist.
      if (!product) {
        if (attempt < retries) {
          console.warn(`[getProductData] product "${slug}" returned null on attempt ${attempt + 1}, retrying…`);
          await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
          continue;
        }
        return null;
      }

      // Get related products from same category
      const relatedProducts = await Product.find({
        category: product.category,
        isActive: true,
        _id: { $ne: product._id },
      })
        .populate("category", "name slug")
        .sort({ createdAt: -1 })
        .limit(4)
        .lean();

      // Fetch metals used in this product so the client can offer variant-switching
      const metalIds = [
        ...new Set(
          (product.metalComposition || []).map(
            (mc: { metal: unknown }) => String(mc.metal)
          )
        ),
      ];
      const metals =
        metalIds.length > 0
          ? await Metal.find({ _id: { $in: metalIds }, isActive: true })
              .select("name variants")
              .lean()
          : [];

      // Filter metal variants based on displayVariants (admin-selected variants to show)
      const displayVariants = (product.displayVariants as { metal: unknown; variants: { variantId: unknown; weightInGrams: number }[] }[]) || [];
      const filteredMetals = metals.map((m) => {
        const dvEntry = displayVariants.find(
          (dv) => String(dv.metal) === String(m._id)
        );
        if (dvEntry && dvEntry.variants.length > 0) {
          const allowedIds = new Set(dvEntry.variants.map((v) => String(v.variantId)));
          return {
            ...m,
            variants: m.variants.filter((v: { _id: unknown }) =>
              allowedIds.has(String(v._id))
            ),
          };
        }
        return m;
      });

      // Build variant weight map (variantId -> weightInGrams) for the client.
      // Start with the original composition weights as defaults, then overlay
      // admin-specified weights from displayVariants (skip 0 weights).
      const variantWeightMap: Record<string, number> = {};
      for (const mc of (product.metalComposition || []) as { variantId: unknown; weightInGrams: number }[]) {
        if (mc.weightInGrams > 0) {
          variantWeightMap[String(mc.variantId)] = mc.weightInGrams;
        }
      }
      for (const dv of displayVariants) {
        for (const v of dv.variants) {
          if (v.weightInGrams > 0) {
            variantWeightMap[String(v.variantId)] = v.weightInGrams;
          }
        }
      }

      // Also resolve chargeBasedOnVariant pricePerGram from the FULL metal data
      // (not filtered) so the client doesn't lose it when the charge variant
      // isn't in displayVariants.
      let chargeVariantPricePerGram: number | undefined;
      const cbv = product.chargeBasedOnVariant as { metalId?: unknown; variantId?: unknown } | undefined;
      if (cbv?.metalId) {
        const fullMetal = metals.find((m) => String(m._id) === String(cbv.metalId));
        if (fullMetal) {
          const fullVariant = fullMetal.variants.find(
            (v: { _id: unknown }) => String(v._id) === String(cbv.variantId)
          );
          chargeVariantPricePerGram = fullVariant?.pricePerGram;
        }
      }

      // Fetch gemstones used in displayGemstones for gemstone-switching
      const displayGemstones = (product.displayGemstones as { gemstone: unknown; variantId: unknown; variantName: string; weightInCarats: number; quantity: number; pricePerCarat: number }[]) || [];
      const gemstoneIds = [
        ...new Set([
          ...(product.gemstoneComposition || []).map((gc: { gemstone: unknown }) => String(gc.gemstone)),
          ...displayGemstones.map((dg) => String(dg.gemstone)),
        ]),
      ];
      const gemstoneData =
        gemstoneIds.length > 0
          ? await Gemstone.find({ _id: { $in: gemstoneIds }, isActive: true })
              .select("name variants")
              .lean()
          : [];

      return {
        product: JSON.parse(JSON.stringify(product)),
        relatedProducts: JSON.parse(JSON.stringify(relatedProducts)),
        availableMetals: JSON.parse(JSON.stringify(filteredMetals)),
        variantWeightMap: JSON.parse(JSON.stringify(variantWeightMap)),
        availableGemstones: JSON.parse(JSON.stringify(gemstoneData)),
        displayGemstones: JSON.parse(JSON.stringify(displayGemstones)),
        chargeVariantPricePerGram,
      };
    } catch (err) {
      console.error(`getProductData attempt ${attempt + 1} failed:`, err);
      if (attempt === retries) return null;
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
  }
  return null;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const data = await getProductData(slug);

  if (!data) notFound();

  const { product, relatedProducts, availableMetals, variantWeightMap, availableGemstones, displayGemstones, chargeVariantPricePerGram } = data;
  const category = product.category as { name: string; slug: string } | null;

  const whatsappMessage = encodeURIComponent(
    `Hi Evaan Jewels, I'm interested in ${product.name} (${product.productCode}). Could you provide more details?`
  );

  return (
    <div className="py-8 md:py-12">
      <JsonLd
        data={productJsonLd({
          name: product.name,
          description: product.description || `${product.name} by Evaan Jewels`,
          image: product.thumbnailImage || `${SITE_URL}/og-image.jpg`,
          images: product.images?.length ? product.images : undefined,
          sku: product.productCode,
          price: product.totalPrice,
          availability: product.isOutOfStock ? "OutOfStock" : "InStock",
          url: `${SITE_URL}/products/${product.slug}`,
          category: category?.name,
          material: product.metalComposition?.[0]?.variantName,
          weight: product.grossWeight > 0 ? String(product.grossWeight) : undefined,
          sizes: product.sizes?.length ? product.sizes : undefined,
          colors: product.colors?.length ? product.colors : undefined,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: SITE_URL },
          ...(category
            ? [
                { name: "Categories", url: `${SITE_URL}/categories` },
                { name: category.name, url: `${SITE_URL}/categories/${category.slug}` },
              ]
            : []),
          { name: product.name, url: `${SITE_URL}/products/${product.slug}` },
        ])}
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <Breadcrumb
          homeHref="/"
          items={[
            { label: "Home", href: "/" },
            ...(category
              ? [
                  { label: "Categories", href: "/categories" },
                  {
                    label: category.name,
                    href: `/categories/${category.slug}`,
                  },
                ]
              : []),
            { label: product.name },
          ]}
        />

        {/* Badges */}
        <div className="mt-6 flex flex-wrap gap-2">
          {product.isNewArrival && (
            <Badge variant="rose">New Arrival</Badge>
          )}
          {product.isFeatured && (
            <Badge variant="gold">Featured</Badge>
          )}
          {product.isOutOfStock && (
            <Badge variant="error">Out of Stock</Badge>
          )}
          {product.hallmarkCertified && (
            <Badge variant="success">BIS Hallmark</Badge>
          )}
        </div>

        {/* Category & Code */}
        {category && (
          <Link
            href={`/categories/${category.slug}`}
            className="mt-3 inline-block text-xs font-medium uppercase tracking-wider text-gold-600 hover:text-gold-700"
          >
            {category.name}
          </Link>
        )}

        {/* Name */}
        <h1 className="mt-2 font-heading text-2xl font-bold text-charcoal-700 sm:text-3xl lg:text-4xl">
          {product.name}
        </h1>

        {/* Product Code */}
        <p className="mt-1 font-mono text-xs text-charcoal-400">
          {product.productCode}
        </p>

        {/* Product Section — Gallery + Actions + Price (client component) */}
        <div className="mt-6">
          <ProductDetailClient
            product={{
              _id: product._id,
              name: product.name,
              slug: product.slug,
              productCode: product.productCode,
              description: product.description,
              gender: product.gender,
              images: product.images || [],
              thumbnailImage: product.thumbnailImage,
              colorImages: product.colorImages || [],
              totalPrice: product.totalPrice,
              isOutOfStock: product.isOutOfStock,
              isNewArrival: product.isNewArrival,
              isFeatured: product.isFeatured,
              hallmarkCertified: product.hallmarkCertified,
              videos: product.videos || [],
              category: category ? { name: category.name, slug: category.slug } : null,
              metalComposition: product.metalComposition || [],
              gemstoneComposition: product.gemstoneComposition || [],
              makingCharges: product.makingCharges,
              wastageCharges: product.wastageCharges,
              gstPercentage: product.gstPercentage,
              otherCharges: product.otherCharges || [],
              metalTotal: product.metalTotal,
              gemstoneTotal: product.gemstoneTotal,
              makingChargeAmount: product.makingChargeAmount,
              wastageChargeAmount: product.wastageChargeAmount,
              otherChargesTotal: product.otherChargesTotal,
              subtotal: product.subtotal,
              gstAmount: product.gstAmount,
              grossWeight: product.grossWeight,
              netWeight: product.netWeight,
              sizes: product.sizes || [],
              colors: product.colors || [],
              size: product.size,
              chargeBasedOnVariant: product.chargeBasedOnVariant || undefined,
            }}
            availableMetals={availableMetals}
            variantWeightMap={variantWeightMap || {}}
            availableGemstones={availableGemstones || []}
            displayGemstoneOptions={displayGemstones || []}
            chargeVariantPricePerGram={chargeVariantPricePerGram}
            whatsappMessage={whatsappMessage}
          />
        </div>

        {/* Details Grid */}
        <div className="mt-8 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 lg:grid-cols-4">
          {product.gender && (
            <div className="rounded-lg bg-charcoal-50 p-3">
              <p className="text-xs text-charcoal-400">Gender</p>
              <p className="mt-0.5 font-medium text-charcoal-700">
                {capitalize(product.gender)}
              </p>
            </div>
          )}
          {/* Gross/Net weight shown dynamically in ProductDetailClient */}
          {product.size && (
            <div className="rounded-lg bg-charcoal-50 p-3">
              <p className="text-xs text-charcoal-400">Size</p>
              <p className="mt-0.5 font-medium text-charcoal-700">
                {product.size}
              </p>
            </div>
          )}
        </div>

        {/* Description */}
        {product.description && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-charcoal-600">
              Description
            </h3>
            <div className="mt-2 max-w-prose text-sm leading-relaxed text-charcoal-400">
              {(() => {
                const lines = product.description.split('\n');
                const groups: { type: 'text' | 'bullet' | 'numbered'; lines: string[] }[] = [];
                lines.forEach((line: string) => {
                  const trimmed = line.trim();
                  // Bullet: lines starting with -, ->, •, * (with or without trailing space)
                  if (/^(->|[-•*])\s*/.test(trimmed) && trimmed.replace(/^(->|[-•*])\s*/, '').length > 0) {
                    const content = trimmed.replace(/^(->|[-•*])\s*/, '');
                    const last = groups[groups.length - 1];
                    if (last?.type === 'bullet') {
                      last.lines.push(content);
                    } else {
                      groups.push({ type: 'bullet', lines: [content] });
                    }
                  // Numbered list: lines starting with 1. or 1) etc.
                  } else if (/^\d+[.):]\s*/.test(trimmed) && trimmed.replace(/^\d+[.):]\s*/, '').length > 0) {
                    const content = trimmed.replace(/^\d+[.):]\s*/, '');
                    const last = groups[groups.length - 1];
                    if (last?.type === 'numbered') {
                      last.lines.push(content);
                    } else {
                      groups.push({ type: 'numbered', lines: [content] });
                    }
                  } else if (trimmed) {
                    const last = groups[groups.length - 1];
                    if (last?.type === 'text') {
                      last.lines.push(trimmed);
                    } else {
                      groups.push({ type: 'text', lines: [trimmed] });
                    }
                  }
                });
                return groups.map((group, i) =>
                  group.type === 'bullet' ? (
                    <ul key={i} className="list-disc list-inside space-y-1 mt-2">
                      {group.lines.map((item, j) => (
                        <li key={j}>{item}</li>
                      ))}
                    </ul>
                  ) : group.type === 'numbered' ? (
                    <ol key={i} className="list-decimal list-inside space-y-1 mt-2">
                      {group.lines.map((item, j) => (
                        <li key={j}>{item}</li>
                      ))}
                    </ol>
                  ) : (
                    <p key={i} className={i > 0 ? 'mt-2' : ''}>
                      {group.lines.join(' ')}
                    </p>
                  )
                );
              })()}
            </div>
          </div>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 border-t border-charcoal-100 pt-12">
            <h2 className="mb-6 font-heading text-2xl font-bold text-charcoal-700">
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
              {relatedProducts.map(
                (rp: {
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
                }) => <ProductCard key={rp._id} product={rp} />
              )}
            </div>
          </section>
        )}

        {/* Recently Viewed */}
        <RecentlyViewed excludeProductId={product._id} />

        {/* Track this product view */}
        <TrackProductView
          product={{
            productId: product._id,
            name: product.name,
            slug: product.slug,
            thumbnailImage: product.thumbnailImage,
            totalPrice: product.totalPrice,
            category: category?.name,
          }}
        />
      </div>
    </div>
  );
}
