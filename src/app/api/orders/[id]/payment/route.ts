import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import { paymentStatusUpdateSchema } from "@/lib/validators/order";
import { auth } from "@/lib/auth";
import { orderToEmailData, sendPaymentConfirmedEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (
      !session?.user?.id ||
      session.user.accountType === "customer" ||
      session.user.role === "customer"
    ) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const validated = paymentStatusUpdateSchema.parse({
      status: body.status || body.paymentStatus,
      transactionId: body.transactionId,
      notes: body.notes || body.note || "",
    });

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    const wasVerified = order.payment.status === "verified";

    order.payment.status = validated.status;
    if (validated.transactionId) {
      order.payment.transactionId = validated.transactionId;
    }
    if (validated.notes) {
      order.payment.notes = validated.notes;
    }

    if (validated.status === "verified" || validated.status === "received") {
      order.payment.paidAt = new Date();
    }

    if (validated.status === "verified" && order.status === "pending") {
      order.status = "confirmed";
      order.timeline.push({
        status: "confirmed",
        message: "Payment verified. Order confirmed.",
        timestamp: new Date(),
      });
    }

    order.timeline.push({
      status: order.status,
      message: `Payment status updated to ${validated.status}${
        validated.transactionId ? ` (Txn: ${validated.transactionId})` : ""
      }`,
      timestamp: new Date(),
    });

    if (
      validated.status === "verified" &&
      !wasVerified &&
      !order.emailsSent?.paymentConfirmed
    ) {
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
      data: order,
      message: "Payment status updated successfully",
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
    console.error("PATCH /api/orders/:id/payment error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update payment status" },
      { status: 500 }
    );
  }
}
