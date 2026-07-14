import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { applyPaymentCaptured, applyPaymentFailed } from "@/lib/order-payment";
import {
  orderToEmailData,
  sendPaymentConfirmedEmail,
  sendPaymentFailedEmail,
} from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature") || "";

    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json(
        { success: false, error: "Invalid webhook signature" },
        { status: 400 }
      );
    }

    const event = JSON.parse(rawBody) as {
      event: string;
      payload: {
        payment?: {
          entity: {
            id: string;
            order_id: string;
            status: string;
            amount: number;
          };
        };
        order?: {
          entity: {
            id: string;
            receipt: string;
            status: string;
          };
        };
      };
    };

    await dbConnect();

    const paymentEntity = event.payload.payment?.entity;
    const orderEntity = event.payload.order?.entity;

    const razorpayOrderId =
      paymentEntity?.order_id || orderEntity?.id || "";

    if (!razorpayOrderId) {
      return NextResponse.json({ success: true, ignored: true });
    }

    const order = await Order.findOne({
      "payment.razorpayOrderId": razorpayOrderId,
    });

    if (!order) {
      return NextResponse.json({ success: true, ignored: true });
    }

    if (
      event.event === "payment.captured" ||
      event.event === "order.paid"
    ) {
      if (paymentEntity?.id) {
        const changed = applyPaymentCaptured(order, {
          paymentId: paymentEntity.id,
          razorpayOrderId,
          note: `Payment captured via Razorpay webhook (${event.event}).`,
        });
        if (changed && !order.emailsSent?.paymentConfirmed) {
          const emailData = orderToEmailData(order);
          if (emailData) {
            await sendPaymentConfirmedEmail(emailData);
            order.emailsSent = {
              ...order.emailsSent,
              paymentConfirmed: true,
            };
          }
        }
        await order.save();
      }
    } else if (event.event === "payment.failed") {
      applyPaymentFailed(
        order,
        `Payment failed via Razorpay webhook (${paymentEntity?.id || "unknown"}).`
      );
      if (!order.emailsSent?.paymentFailed) {
        const emailData = orderToEmailData(order);
        if (emailData) {
          await sendPaymentFailedEmail(emailData);
          order.emailsSent = {
            ...order.emailsSent,
            paymentFailed: true,
          };
        }
      }
      await order.save();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Razorpay webhook error:", error);
    return NextResponse.json(
      { success: false, error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
