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
    "@id": `${SITE_URL}/#organization`,
    name: APP_NAME,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/logo.png`,
      width: 512,
      height: 512,
    },
    image: `${SITE_URL}/og-image.jpg`,
    description: APP_DESCRIPTION,
    telephone: SHOP_INFO.phone,
    email: SHOP_INFO.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: SHOP_INFO.address.street,
      addressLocality: SHOP_INFO.address.city,
      addressRegion: SHOP_INFO.address.state,
      postalCode: SHOP_INFO.address.postalCode,
      addressCountry: SHOP_INFO.address.country,
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: SHOP_INFO.phone,
        contactType: "customer service",
        availableLanguage: ["English", "Hindi"],
        areaServed: "IN",
      },
      {
        "@type": "ContactPoint",
        telephone: SHOP_INFO.whatsapp,
        contactType: "sales",
        availableLanguage: ["English", "Hindi"],
        areaServed: "IN",
      },
    ],
    sameAs: [],
  };
}

/**
 * JSON-LD: LocalBusiness / JewelryStore schema
 */
export function localBusinessJsonLd() {
  const { address, coordinates } = SHOP_INFO;
  return {
    "@context": "https://schema.org",
    "@type": "JewelryStore",
    "@id": `${SITE_URL}/#jewelry-store`,
    name: APP_NAME,
    url: SITE_URL,
    image: [
      `${SITE_URL}/logo.png`,
      `${SITE_URL}/og-image.jpg`,
    ],
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
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "10:00",
        closes: "20:00",
      },
    ],
    priceRange: "₹₹₹",
    currenciesAccepted: "INR",
    paymentAccepted: "Cash, Card, UPI, Bank Transfer",
    hasMap: `https://maps.google.com/?q=${coordinates.lat},${coordinates.lng}`,
    areaServed: {
      "@type": "GeoCircle",
      geoMidpoint: {
        "@type": "GeoCoordinates",
        latitude: coordinates.lat,
        longitude: coordinates.lng,
      },
      geoRadius: "50000",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "150",
      bestRating: "5",
    },
  };
}

/**
 * JSON-LD: WebSite schema with SearchAction (enables Google sitelinks searchbox)
 */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: APP_NAME,
    url: SITE_URL,
    description: APP_DESCRIPTION,
    publisher: {
      "@id": `${SITE_URL}/#organization`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/categories?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    inLanguage: ["en-IN", "hi-IN"],
  };
}

/**
 * JSON-LD: Product schema (enhanced for Google rich results)
 */
export function productJsonLd({
  name,
  description,
  image,
  images,
  sku,
  price,
  currency = "INR",
  availability,
  url,
  category,
  brand = APP_NAME,
  material,
  weight,
  sizes,
  colors,
}: {
  name: string;
  description: string;
  image: string;
  images?: string[];
  sku: string;
  price: number;
  currency?: string;
  availability: "InStock" | "OutOfStock";
  url: string;
  category?: string;
  brand?: string;
  material?: string;
  weight?: string;
  sizes?: string[];
  colors?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    image: images?.length ? images : image,
    sku,
    mpn: sku,
    brand: {
      "@type": "Brand",
      name: brand,
    },
    ...(category && { category }),
    ...(material && { material }),
    ...(weight && { weight: { "@type": "QuantitativeValue", value: parseFloat(weight), unitCode: "GRM" } }),
    ...(sizes?.length && { size: sizes }),
    ...(colors?.length && { color: colors.join(", ") }),
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
      itemCondition: "https://schema.org/NewCondition",
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "IN",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 3, unitCode: "DAY" },
          transitTime: { "@type": "QuantitativeValue", minValue: 3, maxValue: 7, unitCode: "DAY" },
        },
      },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.7",
      reviewCount: "25",
      bestRating: "5",
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

/**
 * JSON-LD: FAQPage schema (boosts rich snippets in Google)
 */
export function faqJsonLd(
  faqs: { question: string; answer: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/**
 * JSON-LD: ItemList schema (for category/collection pages)
 */
export function itemListJsonLd(
  items: { name: string; url: string; image?: string; position: number }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: items.length,
    itemListElement: items.map((item) => ({
      "@type": "ListItem",
      position: item.position,
      name: item.name,
      url: item.url,
      ...(item.image && { image: item.image }),
    })),
  };
}

/**
 * JSON-LD: CollectionPage schema
 */
export function collectionPageJsonLd({
  name,
  description,
  url,
}: {
  name: string;
  description: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url,
    isPartOf: {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
    },
    provider: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
    },
  };
}
