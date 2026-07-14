import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import Product from "@/models/Product";
import User from "@/models/User";
import { getNextSequence } from "@/models/Counter";
import { orderCreateSchema } from "@/lib/validators/order";
import { resolveLinePrice, shippingForSubtotal } from "@/lib/order-pricing";
import {
  createRazorpayOrder,
  getRazorpayKeyId,
} from "@/lib/razorpay";
import { auth } from "@/lib/auth";
import { orderToEmailData, sendOrderPlacedEmail } from "@/lib/email";
import { ITEMS_PER_PAGE } from "@/constants";
import type { IProduct } from "@/types";

export const dynamic = "force-dynamic";

// GET /api/orders — Admin only
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.accountType === "customer") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

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

    const skip = (page - 1) * limit;
    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Math.min(limit, 100))
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

// POST /api/orders — Place order (public). Razorpay returns checkout payload.
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await auth();
    const body = await request.json();
    const validated = orderCreateSchema.parse(body);

    const orderItems = [];
    let subtotal = 0;

    for (const item of validated.items) {
      const product = (await Product.findOne({
        _id: item.productId,
        isActive: true,
        isOutOfStock: false,
      })
        .populate("category", "name")
        .lean()) as IProduct | null;

      if (!product) {
        return NextResponse.json(
          {
            success: false,
            error: `Product not found or unavailable: ${item.productId}`,
          },
          { status: 400 }
        );
      }

      let priced;
      try {
        priced = await resolveLinePrice(product, {
          selectedMetalVariants: item.selectedMetalVariants?.map((m) => ({
            metalId: m.metalId,
            variantId: m.variantId,
            weightInGrams: m.weightInGrams,
          })),
          selectedGemstone: item.selectedGemstone
            ? {
                gemstoneId: item.selectedGemstone.gemstoneId,
                variantId: item.selectedGemstone.variantId,
                weightInCarats: item.selectedGemstone.weightInCarats,
                quantity: item.selectedGemstone.quantity,
              }
            : undefined,
        });
      } catch (e) {
        return NextResponse.json(
          {
            success: false,
            error: e instanceof Error ? e.message : "Invalid product options",
          },
          { status: 400 }
        );
      }

      const itemTotal = priced.unitPrice * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: priced.unitPrice,
        total: itemTotal,
        productSnapshot: {
          name: product.name,
          productCode: product.productCode,
          slug: product.slug,
          thumbnailImage: product.thumbnailImage,
          totalPrice: priced.unitPrice,
          metalComposition: priced.metalComposition.map((m) => ({
            variantName: m.variantName,
            weightInGrams: m.weightInGrams,
          })),
          category:
            typeof product.category === "object" && product.category !== null
              ? (product.category as unknown as { name: string }).name
              : "",
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor,
          selectedMetalVariants: priced.selectedMetalVariants,
          selectedGemstone: priced.selectedGemstone,
        },
      });
    }

    const shippingCharge = shippingForSubtotal(subtotal);
    const totalAmount = subtotal + shippingCharge;

    const year = new Date().getFullYear();
    const seq = await getNextSequence("order", "EJ", year);
    const orderNumber = `EJ-${year}-${String(seq).padStart(4, "0")}`;

    const isCod = validated.paymentMethod === "cod";

    let userId =
      session?.user?.accountType === "customer" ? session.user.id : undefined;

    if (!userId && validated.shippingAddress.email) {
      const existing = await User.findOne({
        email: validated.shippingAddress.email.toLowerCase(),
        isActive: true,
      })
        .select("_id")
        .lean();
      if (existing) userId = String(existing._id);
    }

    const order = await Order.create({
      orderNumber,
      user: userId || undefined,
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
      status: isCod ? "confirmed" : "pending",
      customerNotes: validated.customerNotes || "",
      timeline: [
        {
          status: isCod ? "confirmed" : "pending",
          message: isCod
            ? "Order placed with Cash on Delivery."
            : "Order created. Awaiting Razorpay payment.",
          timestamp: new Date(),
        },
      ],
    });

    // COD: receipt now. Razorpay: receipt only after payment (verify/webhook).
    if (isCod) {
      const emailData = orderToEmailData(order);
      if (emailData) {
        await sendOrderPlacedEmail(emailData);
        order.emailsSent = { ...order.emailsSent, placed: true };
        await order.save();
      }

      return NextResponse.json(
        {
          success: true,
          data: {
            orderNumber: order.orderNumber,
            totalAmount: order.totalAmount,
            status: order.status,
            paymentMethod: order.payment.method,
            paymentStatus: order.payment.status,
            _id: order._id,
          },
          message: "Order placed successfully!",
        },
        { status: 201 }
      );
    }

    // Razorpay: create gateway order before returning checkout payload
    let rzOrder;
    try {
      rzOrder = await createRazorpayOrder({
        amountInr: totalAmount,
        receipt: orderNumber,
        notes: {
          orderId: String(order._id),
          orderNumber,
        },
      });
    } catch (rzErr) {
      console.error("Razorpay order create failed:", rzErr);
      order.status = "cancelled";
      order.cancelReason = "Payment gateway unavailable";
      order.timeline.push({
        status: "cancelled",
        message: "Cancelled — payment gateway could not be started.",
        timestamp: new Date(),
      });
      await order.save();
      return NextResponse.json(
        {
          success: false,
          error:
            "Payment gateway is not configured correctly. Please try again or choose COD.",
        },
        { status: 502 }
      );
    }

    order.payment.razorpayOrderId = rzOrder.id;
    await order.save();

    return NextResponse.json(
      {
        success: true,
        data: {
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          status: order.status,
          paymentMethod: order.payment.method,
          paymentStatus: order.payment.status,
          _id: order._id,
          razorpay: {
            keyId: getRazorpayKeyId(),
            orderId: rzOrder.id,
            amount: rzOrder.amount,
            currency: rzOrder.currency,
            name: "Evaan Jewels",
            description: `Order ${orderNumber}`,
            prefill: {
              name: validated.shippingAddress.fullName,
              email: validated.shippingAddress.email || undefined,
              contact: validated.shippingAddress.phone,
            },
          },
        },
        message: "Order created. Complete payment to confirm.",
      },
      { status: 201 }
    );
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
    console.error("POST /api/orders error:", error);
    const message =
      error instanceof Error && error.message.includes("RAZORPAY")
        ? "Payment gateway is not configured. Please try again later."
        : "Failed to place order";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
