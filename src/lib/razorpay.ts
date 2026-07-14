import crypto from "crypto";
import Razorpay from "razorpay";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

export function getRazorpayClient() {
  return new Razorpay({
    key_id: requireEnv("RAZORPAY_KEY_ID"),
    key_secret: requireEnv("RAZORPAY_KEY_SECRET"),
  });
}

export function getRazorpayKeyId(): string {
  // Public key id — same as RAZORPAY_KEY_ID; allow either env name
  return (
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
    process.env.RAZORPAY_KEY_ID ||
    (() => {
      throw new Error("RAZORPAY_KEY_ID is not configured");
    })()
  );
}

/** Amount in INR rupees → paise (Razorpay expects integer paise). */
export function toPaise(amountInr: number): number {
  return Math.round(amountInr * 100);
}

function safeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function verifyPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const body = `${params.orderId}|${params.paymentId}`;
  const expected = crypto
    .createHmac("sha256", requireEnv("RAZORPAY_KEY_SECRET"))
    .update(body)
    .digest("hex");
  return safeEqualHex(expected, params.signature);
}

export function verifyWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const expected = crypto
    .createHmac("sha256", requireEnv("RAZORPAY_WEBHOOK_SECRET"))
    .update(rawBody)
    .digest("hex");
  return safeEqualHex(expected, signature);
}

export async function createRazorpayOrder(params: {
  amountInr: number;
  receipt: string;
  notes?: Record<string, string>;
}) {
  const razorpay = getRazorpayClient();
  return razorpay.orders.create({
    amount: toPaise(params.amountInr),
    currency: "INR",
    receipt: params.receipt.slice(0, 40),
    notes: params.notes,
    payment_capture: true,
  });
}
