import { Metadata } from "next";
import { APP_NAME, APP_DESCRIPTION } from "@/constants";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://evaanjewels.com";

export const SHOP_INFO = {
  name: APP_NAME,
  description: APP_DESCRIPTION,
  phone: "+919654148574",
  whatsapp: "+919654148574",
  email: "info@evaanjewels.com",
  address: {
    street: "2nd Floor, B-169, Mohan Garden, Uttam Nagar, Rama Park Road",
    locality: "Uttam Nagar",
    city: "Delhi",
    state: "Delhi",
    postalCode: "110059",
    country: "IN",
  },
  hours: "Mon-Sat 10:00 AM - 8:00 PM",
  gstin: "07BEFPG0156P2ZC",
  coordinates: {
    lat: 28.6219,
    lng: 77.0350,
  },
};

/**
 * Create a shared base metadata with OG and Twitter cards
 */
export function createMetadata({
  title,
  description,
  path = "",
  images,
  keywords,
  noIndex = false,
}: {
  title: string;
  description: string;
  path?: string;
  images?: { url: string; width?: number; height?: number; alt?: string }[];
  keywords?: string[];
  noIndex?: boolean;
}): Metadata {
  const url = `${SITE_URL}${path}`;
  const defaultImage = {
    url: `${SITE_URL}/og-image.jpg`,
    width: 1200,
    height: 630,
    alt: `${APP_NAME} — Premium Gold & Diamond Jewelry`,
  };

  const ogImages = images?.length ? images : [defaultImage];

  return {
    title,
    description,
    keywords: keywords ?? [
      "jewelry",
      "gold jewelry",
      "diamond jewelry",
      "evaan jewels",
      "hallmark gold",
      "BIS certified",
    ],
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: APP_NAME,
      locale: "en_IN",
      type: "website",
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImages.map((img) => img.url),
    },
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  };
}

/**
 * JSON-LD: Organization schema
 */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: APP_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: APP_DESCRIPTION,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: SHOP_INFO.phone,
      contactType: "customer service",
      availableLanguage: ["English", "Hindi"],
    },
    sameAs: [],
  };
}

/**
 * JSON-LD: LocalBusiness schema
 */
export function localBusinessJsonLd() {
  const { address, coordinates } = SHOP_INFO;
  return {
    "@context": "https://schema.org",
    "@type": "JewelryStore",
    name: APP_NAME,
    url: SITE_URL,
    image: `${SITE_URL}/og-image.jpg`,
    description: APP_DESCRIPTION,
    telephone: SHOP_INFO.phone,
    email: SHOP_INFO.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: address.street,
      addressLocality: address.city,
      addressRegion: address.state,
      postalCode: address.postalCode,
      addressCountry: address.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: coordinates.lat,
      longitude: coordinates.lng,
    },
    openingHours: "Mo-Sa 10:00-20:00",
    priceRange: "₹₹₹",
    currenciesAccepted: "INR",
    paymentAccepted: "Cash, Card, UPI, Bank Transfer",
  };
}

/**
 * JSON-LD: Product schema
 */
export function productJsonLd({
  name,
  description,
  image,
  sku,
  price,
  currency = "INR",
  availability,
  url,
  category,
  brand = APP_NAME,
}: {
  name: string;
  description: string;
  image: string;
  sku: string;
  price: number;
  currency?: string;
  availability: "InStock" | "OutOfStock";
  url: string;
  category?: string;
  brand?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    image,
    sku,
    brand: {
      "@type": "Brand",
      name: brand,
    },
    ...(category && { category }),
    offers: {
      "@type": "Offer",
      priceCurrency: currency,
      price: price.toFixed(2),
      availability: `https://schema.org/${availability}`,
      url,
      seller: {
        "@type": "Organization",
        name: APP_NAME,
      },
    },
  };
}

/**
 * JSON-LD: BreadcrumbList schema
 */
export function breadcrumbJsonLd(
  items: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
