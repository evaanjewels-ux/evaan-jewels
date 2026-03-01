import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { getNextSequence } from "@/models/Counter";
import { orderCreateSchema } from "@/lib/validators/order";
import { ITEMS_PER_PAGE } from "@/constants";

export const dynamic = "force-dynamic";

// GET /api/orders — List orders (admin: all, public: by phone/email/orderNumber)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(
      searchParams.get("limit") || String(ITEMS_PER_PAGE),
      10
    );
    const sort = searchParams.get("sort") || "-createdAt";
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const paymentStatus = searchParams.get("paymentStatus") || "";
    const phone = searchParams.get("phone") || "";
    const orderNumber = searchParams.get("orderNumber") || "";

    const filter: Record<string, unknown> = {};

    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { "shippingAddress.fullName": { $regex: search, $options: "i" } },
        { "shippingAddress.phone": { $regex: search, $options: "i" } },
        { "shippingAddress.email": { $regex: search, $options: "i" } },
      ];
    }

    if (status) filter.status = status;
    if (paymentStatus) filter["payment.status"] = paymentStatus;
    if (phone) filter["shippingAddress.phone"] = phone;
    if (orderNumber) filter.orderNumber = orderNumber;

    const skip = (page - 1) * limit;
    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json(
      {
        success: true,
        data: orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// POST /api/orders — Place a new order (public)
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const validated = orderCreateSchema.parse(body);

    // Validate & snapshot products
    const orderItems = [];
    let subtotal = 0;

    for (const item of validated.items) {
      const product = await Product.findOne({
        _id: item.productId,
        isActive: true,
        isOutOfStock: false,
      })
        .populate("category", "name")
        .lean();

      if (!product) {
        return NextResponse.json(
          {
            success: false,
            error: `Product not found or unavailable: ${item.productId}`,
          },
          { status: 400 }
        );
      }

      const itemTotal = product.totalPrice * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.totalPrice,
        total: itemTotal,
        productSnapshot: {
          name: product.name,
          productCode: product.productCode,
          slug: product.slug,
          thumbnailImage: product.thumbnailImage,
          totalPrice: product.totalPrice,
          metalComposition: product.metalComposition?.map((m) => ({
            variantName: m.variantName,
            weightInGrams: m.weightInGrams,
          })),
          category:
            typeof product.category === "object" && product.category !== null
              ? (product.category as unknown as { name: string }).name
              : "",
        },
      });
    }

    // Calculate totals
    const shippingCharge = subtotal >= 50000 ? 0 : 500; // Free shipping above ₹50,000
    const totalAmount = subtotal + shippingCharge;

    // Generate order number: EJ-2026-0001
    const year = new Date().getFullYear();
    const seq = await getNextSequence("order", "EJ", year);
    const orderNumber = `EJ-${year}-${String(seq).padStart(4, "0")}`;

    const order = await Order.create({
      orderNumber,
      items: orderItems,
      shippingAddress: validated.shippingAddress,
      payment: {
        method: validated.paymentMethod,
        status: "pending",
        amount: totalAmount,
      },
      subtotal,
      shippingCharge,
      discount: 0,
      totalAmount,
      status: "pending",
      customerNotes: validated.customerNotes || "",
      timeline: [
        {
          status: "pending",
          message: "Order placed successfully. Awaiting payment confirmation.",
          timestamp: new Date(),
        },
      ],
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          status: order.status,
          paymentMethod: order.payment.method,
          _id: order._id,
        },
        message: "Order placed successfully!",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error },
        { status: 400 }
      );
    }
    console.error("POST /api/orders error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to place order" },
      { status: 500 }
    );
  }
}
