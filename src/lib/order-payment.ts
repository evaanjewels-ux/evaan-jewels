import type { IOrder } from "@/models/Order";

/** Mark payment captured and confirm pending orders. Idempotent. */
export function applyPaymentCaptured(
  order: IOrder,
  params: {
    paymentId: string;
    razorpayOrderId?: string;
    method?: "razorpay";
    note?: string;
  }
): boolean {
  if (
    order.payment.status === "verified" &&
    order.payment.transactionId === params.paymentId
  ) {
    return false; // already applied
  }

  order.payment.method = params.method ?? "razorpay";
  order.payment.status = "verified";
  order.payment.transactionId = params.paymentId;
  order.payment.paidAt = new Date();
  if (params.razorpayOrderId) {
    order.payment.razorpayOrderId = params.razorpayOrderId;
  }
  order.payment.razorpayPaymentId = params.paymentId;

  if (order.status === "pending") {
    order.status = "confirmed";
    order.timeline.push({
      status: "confirmed",
      message: params.note ?? "Payment verified via Razorpay. Order confirmed.",
      timestamp: new Date(),
    });
  } else {
    order.timeline.push({
      status: order.status,
      message:
        params.note ??
        `Payment verified (Razorpay payment ${params.paymentId})`,
      timestamp: new Date(),
    });
  }

  return true;
}

export function applyPaymentFailed(
  order: IOrder,
  note?: string
): void {
  if (order.payment.status === "verified") return;
  order.payment.status = "failed";
  order.timeline.push({
    status: order.status,
    message: note ?? "Razorpay payment failed or was cancelled.",
    timestamp: new Date(),
  });
}
