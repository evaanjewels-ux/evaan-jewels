import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.accountType !== "customer") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const orders = await Order.find({
      $or: [
        { user: session.user.id },
        { "shippingAddress.email": session.user.email?.toLowerCase() },
      ],
    })
      .sort("-createdAt")
      .limit(50)
      .lean();

    return NextResponse.json({
      success: true,
      data: orders.map((o) => ({
        _id: o._id,
        orderNumber: o.orderNumber,
        status: o.status,
        totalAmount: o.totalAmount,
        payment: {
          method: o.payment.method,
          status: o.payment.status,
        },
        itemCount: o.items.reduce((n, i) => n + i.quantity, 0),
        createdAt: o.createdAt,
        trackingNumber: o.trackingNumber,
        trackingUrl: o.trackingUrl,
        phone: o.shippingAddress?.phone || "",
        thumbnailImage: o.items[0]?.productSnapshot?.thumbnailImage || "",
        firstItemName: o.items[0]?.productSnapshot?.name || "",
      })),
    });
  } catch (error) {
    console.error("GET /api/account/orders error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
