import { Resend } from "resend";
import { formatCurrency } from "@/lib/utils";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function fromAddress() {
  return (
    process.env.RESEND_FROM_EMAIL ||
    "Evaan Jewels <onboarding@resend.dev>"
  );
}

function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    "https://evaanjewels.com"
  ).replace(/\/$/, "");
}

function shopPhone() {
  return process.env.NEXT_PUBLIC_SHOP_PHONE || "9654148574";
}

type OrderEmailData = {
  orderNumber: string;
  customerName: string;
  email: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  items: { name: string; quantity: number; total: number }[];
  trackingNumber?: string;
  trackingUrl?: string;
  shippingAddress?: {
    addressLine1: string;
    city: string;
    state: string;
    pincode: string;
  };
};

function wrap(title: string, body: string) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/></head>
<body style="margin:0;padding:0;background:#f7f5f2;font-family:Georgia,serif;color:#2c2c2c">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f5f2;padding:32px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #ebe6df">
        <tr><td style="background:#1a1a1a;padding:24px 28px;text-align:center">
          <div style="font-size:22px;letter-spacing:0.08em;color:#c9a227;font-weight:700">EVAAN JEWELS</div>
        </td></tr>
        <tr><td style="padding:28px">
          <h1 style="margin:0 0 16px;font-size:20px;color:#1a1a1a">${title}</h1>
          ${body}
        </td></tr>
        <tr><td style="padding:16px 28px 28px;border-top:1px solid #ebe6df;font-size:12px;color:#888;text-align:center">
          Questions? WhatsApp <a href="https://wa.me/91${shopPhone()}" style="color:#c9a227">+91 ${shopPhone()}</a><br/>
          <a href="${siteUrl()}" style="color:#888">${siteUrl().replace(/^https?:\/\//, "")}</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function itemsTable(items: OrderEmailData["items"]) {
  const rows = items
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #f0ebe4">${i.name} × ${i.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #f0ebe4;text-align:right;font-family:monospace">${formatCurrency(i.total)}</td>
        </tr>`
    )
    .join("");
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;font-size:14px">${rows}</table>`;
}

async function sendMail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY missing — skipped:", params.subject);
    return { skipped: true as const };
  }
  if (!params.to?.includes("@")) {
    return { skipped: true as const };
  }

  try {
    const result = await resend.emails.send({
      from: fromAddress(),
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    if (result.error) {
      console.error("[email] Resend error:", result.error);
      return { ok: false as const, error: result.error };
    }
    return { ok: true as const, id: result.data?.id };
  } catch (err) {
    console.error("[email] send failed:", err);
    return { ok: false as const, error: err };
  }
}

export async function sendWelcomeEmail(params: {
  to: string;
  name: string;
}) {
  return sendMail({
    to: params.to,
    subject: "Welcome to Evaan Jewels",
    html: wrap(
      `Welcome, ${params.name}`,
      `<p style="margin:0 0 12px;line-height:1.6;font-size:15px">Your account is ready. Browse our collection and track orders anytime.</p>
       <p style="margin:20px 0"><a href="${siteUrl()}/account" style="display:inline-block;background:#c9a227;color:#1a1a1a;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;font-size:14px">Go to your account</a></p>`
    ),
  });
}

export async function sendOrderPlacedEmail(order: OrderEmailData) {
  const payLabel =
    order.paymentMethod === "cod"
      ? "Cash on Delivery"
      : order.paymentMethod === "razorpay"
        ? "Online (Razorpay)"
        : order.paymentMethod === "bank_transfer"
          ? "Bank Transfer"
          : order.paymentMethod;

  return sendMail({
    to: order.email,
    subject: `Order ${order.orderNumber} received — Evaan Jewels`,
    html: wrap(
      "Order received",
      `<p style="margin:0 0 12px;line-height:1.6;font-size:15px">Hi ${order.customerName}, we’ve received your order <strong>${order.orderNumber}</strong>.</p>
       ${itemsTable(order.items)}
       <p style="margin:8px 0;font-size:15px"><strong>Total:</strong> <span style="font-family:monospace;color:#a8881a">${formatCurrency(order.totalAmount)}</span></p>
       <p style="margin:8px 0;font-size:14px;color:#666">Payment: ${payLabel} · ${order.paymentStatus}</p>
       ${
         order.shippingAddress
           ? `<p style="margin:12px 0;font-size:13px;color:#666">Ship to: ${order.shippingAddress.addressLine1}, ${order.shippingAddress.city}, ${order.shippingAddress.state} — ${order.shippingAddress.pincode}</p>`
           : ""
       }
       <p style="margin:20px 0"><a href="${siteUrl()}/track-order?orderNumber=${encodeURIComponent(order.orderNumber)}" style="display:inline-block;background:#c9a227;color:#1a1a1a;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;font-size:14px">Track order</a></p>`
    ),
  });
}

export async function sendPaymentConfirmedEmail(order: OrderEmailData) {
  return sendMail({
    to: order.email,
    subject: `Payment confirmed — ${order.orderNumber}`,
    html: wrap(
      "Payment confirmed",
      `<p style="margin:0 0 12px;line-height:1.6;font-size:15px">Hi ${order.customerName}, payment for <strong>${order.orderNumber}</strong> was successful. Your order is confirmed.</p>
       <p style="margin:8px 0;font-size:15px"><strong>Amount paid:</strong> <span style="font-family:monospace;color:#a8881a">${formatCurrency(order.totalAmount)}</span></p>
       ${itemsTable(order.items)}
       <p style="margin:20px 0"><a href="${siteUrl()}/track-order?orderNumber=${encodeURIComponent(order.orderNumber)}" style="display:inline-block;background:#c9a227;color:#1a1a1a;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;font-size:14px">Track order</a></p>`
    ),
  });
}

export async function sendPaymentFailedEmail(order: OrderEmailData) {
  return sendMail({
    to: order.email,
    subject: `Payment unsuccessful — ${order.orderNumber}`,
    html: wrap(
      "Payment unsuccessful",
      `<p style="margin:0 0 12px;line-height:1.6;font-size:15px">Hi ${order.customerName}, we couldn’t complete payment for <strong>${order.orderNumber}</strong>.</p>
       <p style="margin:8px 0;font-size:14px;color:#666">You can retry from checkout or contact us on WhatsApp. Order total: ${formatCurrency(order.totalAmount)}.</p>
       <p style="margin:20px 0"><a href="${siteUrl()}/contact" style="display:inline-block;background:#c9a227;color:#1a1a1a;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;font-size:14px">Contact us</a></p>`
    ),
  });
}

export async function sendOrderStatusEmail(order: OrderEmailData) {
  const statusLabels: Record<string, string> = {
    pending: "Pending",
    confirmed: "Confirmed",
    processing: "Being prepared",
    cad_3d_print: "CAD & 3D Print",
    wax_treeing: "Wax Treeing",
    lost_wax_casting: "Lost-Wax Casting",
    filing_cleanup: "Filing & Clean-up",
    setting: "Stone Setting",
    polishing_finish: "Polishing & Finish",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };
  const label = statusLabels[order.status] || order.status;

  const trackingBlock =
    order.status === "shipped" && order.trackingNumber
      ? `<p style="margin:12px 0;font-size:14px">Tracking number: <strong>${order.trackingNumber}</strong></p>
         ${
           order.trackingUrl
             ? `<p style="margin:8px 0"><a href="${order.trackingUrl}" style="color:#c9a227">Track with carrier</a></p>`
             : ""
         }`
      : "";

  return sendMail({
    to: order.email,
    subject: `Order ${order.orderNumber} — ${label}`,
    html: wrap(
      `Order ${label.toLowerCase()}`,
      `<p style="margin:0 0 12px;line-height:1.6;font-size:15px">Hi ${order.customerName}, your order <strong>${order.orderNumber}</strong> is now <strong>${label}</strong>.</p>
       ${trackingBlock}
       <p style="margin:20px 0"><a href="${siteUrl()}/track-order?orderNumber=${encodeURIComponent(order.orderNumber)}" style="display:inline-block;background:#c9a227;color:#1a1a1a;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;font-size:14px">View order</a></p>`
    ),
  });
}

/** Map mongoose order doc → email payload */
export function orderToEmailData(order: {
  orderNumber: string;
  totalAmount: number;
  status: string;
  payment: { method: string; status: string };
  items: { productSnapshot: { name: string }; quantity: number; total: number }[];
  shippingAddress: {
    fullName: string;
    email?: string;
    addressLine1: string;
    city: string;
    state: string;
    pincode: string;
  };
  trackingNumber?: string;
  trackingUrl?: string;
}): OrderEmailData | null {
  const email = order.shippingAddress.email?.trim();
  if (!email) return null;

  return {
    orderNumber: order.orderNumber,
    customerName: order.shippingAddress.fullName,
    email,
    totalAmount: order.totalAmount,
    status: order.status,
    paymentMethod: order.payment.method,
    paymentStatus: order.payment.status,
    items: order.items.map((i) => ({
      name: i.productSnapshot.name,
      quantity: i.quantity,
      total: i.total,
    })),
    trackingNumber: order.trackingNumber,
    trackingUrl: order.trackingUrl,
    shippingAddress: {
      addressLine1: order.shippingAddress.addressLine1,
      city: order.shippingAddress.city,
      state: order.shippingAddress.state,
      pincode: order.shippingAddress.pincode,
    },
  };
}
