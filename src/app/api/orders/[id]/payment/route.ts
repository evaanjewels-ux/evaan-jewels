import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import { paymentStatusUpdateSchema } from "@/lib/validators/order";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/orders/:id/payment — Update payment status (admin)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const validated = paymentStatusUpdateSchema.parse(body);

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

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

    // Auto-confirm order when payment is verified
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
      message: `Payment status updated to ${validated.status}${validated.transactionId ? ` (Txn: ${validated.transactionId})` : ""}`,
      timestamp: new Date(),
    });

    await order.save();

    return NextResponse.json({
      success: true,
      data: order,
      message: "Payment status updated successfully",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error },
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
