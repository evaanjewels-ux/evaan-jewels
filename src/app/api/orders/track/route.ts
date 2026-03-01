import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";

export const dynamic = "force-dynamic";

// GET /api/orders/track?orderNumber=xxx&phone=xxx — Public order tracking
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get("orderNumber")?.trim();
    const phone = searchParams.get("phone")?.trim();

    if (!orderNumber || !phone) {
      return NextResponse.json(
        { success: false, error: "Order number and phone are required" },
        { status: 400 }
      );
    }

    const order = await Order.findOne({
      orderNumber: orderNumber.toUpperCase(),
      "shippingAddress.phone": phone,
    }).lean();

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: "No order found with this order number and phone combination",
        },
        { status: 404 }
      );
    }

    // Return safe public data (no admin notes)
    return NextResponse.json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        status: order.status,
        items: order.items.map((item) => ({
          name: item.productSnapshot.name,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
          thumbnailImage: item.productSnapshot.thumbnailImage,
          slug: item.productSnapshot.slug,
        })),
        shippingAddress: order.shippingAddress,
        payment: {
          method: order.payment.method,
          status: order.payment.status,
          amount: order.payment.amount,
        },
        subtotal: order.subtotal,
        shippingCharge: order.shippingCharge,
        totalAmount: order.totalAmount,
        trackingNumber: order.trackingNumber,
        trackingUrl: order.trackingUrl,
        timeline: order.timeline.map((t) => ({
          status: t.status,
          message: t.message,
          timestamp: t.timestamp,
        })),
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error("GET /api/orders/track error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to track order" },
      { status: 500 }
    );
  }
}
