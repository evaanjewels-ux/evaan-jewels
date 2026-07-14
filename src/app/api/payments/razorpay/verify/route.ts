import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import { razorpayVerifySchema } from "@/lib/validators/order";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { applyPaymentCaptured } from "@/lib/order-payment";
import { orderToEmailData, sendPaymentConfirmedEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const validated = razorpayVerifySchema.parse(body);

    const order = await Order.findById(validated.orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (
      order.payment.razorpayOrderId &&
      order.payment.razorpayOrderId !== validated.razorpayOrderId
    ) {
      return NextResponse.json(
        { success: false, error: "Razorpay order mismatch" },
        { status: 400 }
      );
    }

    const valid = verifyPaymentSignature({
      orderId: validated.razorpayOrderId,
      paymentId: validated.razorpayPaymentId,
      signature: validated.razorpaySignature,
    });

    if (!valid) {
      return NextResponse.json(
        { success: false, error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    order.payment.razorpaySignature = validated.razorpaySignature;
    const changed = applyPaymentCaptured(order, {
      paymentId: validated.razorpayPaymentId,
      razorpayOrderId: validated.razorpayOrderId,
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

    return NextResponse.json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        status: order.status,
        paymentStatus: order.payment.status,
        _id: order._id,
      },
      message: "Payment verified successfully",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.flatten(),
        },
        { status: 400 }
      );
    }
    console.error("POST /api/payments/razorpay/verify error:", error);
    return NextResponse.json(
      { success: false, error: "Payment verification failed" },
      { status: 500 }
    );
  }
}
