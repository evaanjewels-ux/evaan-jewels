import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/orders/:id — Get single order
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const { id } = await params;

    const order = await Order.findById(id).lean();
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error("GET /api/orders/:id error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

// PATCH /api/orders/:id — Update order status (admin)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Update order status
    if (body.status) {
      order.status = body.status;
      order.timeline.push({
        status: body.status,
        message:
          body.message || `Order status updated to ${body.status}`,
        timestamp: new Date(),
        updatedBy: body.adminId,
      });

      if (body.status === "cancelled" && body.cancelReason) {
        order.cancelReason = body.cancelReason;
      }
    }

    // Update tracking info
    if (body.trackingNumber) order.trackingNumber = body.trackingNumber;
    if (body.trackingUrl) order.trackingUrl = body.trackingUrl;
    if (body.notes) order.notes = body.notes;

    await order.save();

    return NextResponse.json({
      success: true,
      data: order,
      message: "Order updated successfully",
    });
  } catch (error) {
    console.error("PATCH /api/orders/:id error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update order" },
      { status: 500 }
    );
  }
}
