import { describe, it, expect, beforeAll } from "vitest";
import crypto from "crypto";

describe("razorpay signature verify", () => {
  beforeAll(() => {
    process.env.RAZORPAY_KEY_SECRET = "test_secret_key";
    process.env.RAZORPAY_KEY_ID = "rzp_test_x";
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = "rzp_test_x";
    process.env.RAZORPAY_WEBHOOK_SECRET = "whsec_test";
  });

  it("accepts valid payment signature and rejects tampered ones", async () => {
    const {
      verifyPaymentSignature,
      verifyWebhookSignature,
      paymentAmountMatchesOrder,
      toPaise,
    } = await import("@/lib/razorpay");

    const orderId = "order_ABC";
    const paymentId = "pay_XYZ";
    const valid = crypto
      .createHmac("sha256", "test_secret_key")
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    expect(
      verifyPaymentSignature({
        orderId,
        paymentId,
        signature: valid,
      })
    ).toBe(true);

    expect(
      verifyPaymentSignature({
        orderId,
        paymentId,
        signature: "0".repeat(64),
      })
    ).toBe(false);

    const body = JSON.stringify({ event: "payment.captured" });
    const whSig = crypto
      .createHmac("sha256", "whsec_test")
      .update(body)
      .digest("hex");
    expect(verifyWebhookSignature(body, whSig)).toBe(true);
    expect(verifyWebhookSignature(body, "bad")).toBe(false);
    expect(verifyWebhookSignature(body, "")).toBe(false);

    expect(toPaise(1999.5)).toBe(199950);
    expect(paymentAmountMatchesOrder(50000, 500)).toBe(true);
    expect(paymentAmountMatchesOrder(49999, 500)).toBe(false);
  });
});
