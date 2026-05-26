// ─── Helpers ─────────────────────────────────────────────────────────────────

function gtag(...args: unknown[]) {
  if (typeof window === "undefined" || !window.gtag) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window.gtag as any)(...args);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fbq(...args: unknown[]) {
  if (typeof window === "undefined") return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  if (typeof w.fbq === "function") w.fbq(...args);
}

// ─── Track Product Page View ──────────────────────────────────────────────────

export function trackViewContent(product: {
  productId: string;
  name: string;
  price: number;
  category?: string;
}): void {
  gtag("event", "view_item", {
    currency: "INR",
    value: product.price,
    items: [
      {
        item_id: product.productId,
        item_name: product.name,
        item_category: product.category || "jewelry",
        price: product.price,
      },
    ],
  });
  fbq("track", "ViewContent", {
    content_ids: [product.productId],
    content_name: product.name,
    content_category: product.category || "jewelry",
    content_type: "product",
    value: product.price,
    currency: "INR",
  });
}

// ─── Track Enquiry / Contact (WhatsApp or Call) ───────────────────────────────

export function trackContact(data: {
  type: "whatsapp" | "call";
  productId?: string;
  productName?: string;
  productPrice?: number;
}): void {
  gtag("event", "contact", {
    event_category: "engagement",
    event_label: data.type === "whatsapp" ? "WhatsApp Enquiry" : "Phone Call",
    value: data.productPrice ?? 0,
    currency: "INR",
    items: data.productId
      ? [
          {
            item_id: data.productId,
            item_name: data.productName || "Product",
            item_category: "jewelry",
          },
        ]
      : [],
  });
  // Meta Pixel — Contact fires for both types; Lead fires for WhatsApp (stronger purchase intent)
  fbq("track", "Contact");
  if (data.type === "whatsapp") {
    fbq("track", "Lead", {
      content_name: data.productName,
      currency: "INR",
      value: data.productPrice ?? 0,
    });
  }
}

// ─── Track Wishlist Toggle ────────────────────────────────────────────────────

export function trackAddToWishlist(product: {
  productId: string;
  name: string;
  price: number;
  category?: string;
}): void {
  gtag("event", "add_to_wishlist", {
    currency: "INR",
    value: product.price,
    items: [
      {
        item_id: product.productId,
        item_name: product.name,
        item_category: product.category || "jewelry",
        price: product.price,
      },
    ],
  });
  fbq("track", "AddToWishlist", {
    content_ids: [product.productId],
    content_name: product.name,
    content_category: product.category || "jewelry",
    value: product.price,
    currency: "INR",
  });
}

// ─── Meta Pixel — View Content ────────────────────────────────────────────────

export function trackMetaViewContent(product: {
  productId: string;
  name: string;
  price: number;
  category?: string;
}): void {
  fbq("track", "ViewContent", {
    content_ids: [product.productId],
    content_name: product.name,
    content_category: product.category || "jewelry",
    content_type: "product",
    value: product.price,
    currency: "INR",
  });
}

// ─── Meta Pixel — Initiate Checkout ──────────────────────────────────────────

export function trackMetaInitiateCheckout(data: {
  value: number;
  numItems?: number;
}): void {
  fbq("track", "InitiateCheckout", {
    value: data.value,
    currency: "INR",
    num_items: data.numItems ?? 1,
  });
}

// ─── Meta Pixel — Contact / Enquiry ──────────────────────────────────────────

export function trackMetaContact(): void {
  fbq("track", "Contact");
}

// ─── Meta Pixel — Purchase ────────────────────────────────────────────────────

export function trackMetaPurchase(data: {
  orderId: string;
  value: number;
  numItems?: number;
}): void {
  fbq("track", "Purchase", {
    value: data.value,
    currency: "INR",
    num_items: data.numItems ?? 1,
    order_id: data.orderId,
  });
}

