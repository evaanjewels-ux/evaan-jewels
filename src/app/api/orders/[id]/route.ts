import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import { orderStatusUpdateSchema } from "@/lib/validators/order";
import { auth } from "@/lib/auth";
import { orderToEmailData, sendOrderStatusEmail } from "@/lib/email";
import { ORDER_STATUS_CONFIG, type OrderStatus } from "@/constants/orderStatus";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function isAdminSession(session: {
  user?: { accountType?: string; role?: string };
} | null) {
  if (!session?.user) return false;
  if (session.user.accountType === "admin") return true;
  return session.user.role === "admin" || session.user.role === "super_admin";
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!isAdminSession(session)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

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

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!isAdminSession(session)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const normalized = {
      status: body.status,
      message: body.message || body.note || body.statusNote || "",
      trackingNumber:
        body.trackingNumber || body.trackingInfo?.trackingNumber || undefined,
      trackingUrl:
        body.trackingUrl || body.trackingInfo?.trackingUrl || undefined,
      cancelReason: body.cancelReason,
      notes: body.notes || body.adminNotes,
    };

    const validated = orderStatusUpdateSchema.parse(normalized);

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    const prevStatus = order.status;

    if (validated.status) {
      order.status = validated.status;
      const statusLabel =
        ORDER_STATUS_CONFIG[validated.status as OrderStatus]?.label ||
        validated.status;
      order.timeline.push({
        status: validated.status,
        message:
          validated.message || `Order status updated to ${statusLabel}`,
        timestamp: new Date(),
        updatedBy: session!.user!.id as unknown as import("mongoose").Types.ObjectId,
      });

      if (validated.status === "cancelled" && validated.cancelReason) {
        order.cancelReason = validated.cancelReason;
      }
    }

    if (validated.trackingNumber !== undefined) {
      order.trackingNumber = validated.trackingNumber;
    }
    if (validated.trackingUrl !== undefined) {
      order.trackingUrl = validated.trackingUrl;
    }
    if (validated.notes !== undefined) {
      order.notes = validated.notes;
    }

    await order.save();

    if (validated.status && validated.status !== prevStatus) {
      const emailData = orderToEmailData(order);
      if (emailData) {
        // fire-and-forget-ish but awaited so delivery is reliable
        await sendOrderStatusEmail(emailData);
      }
    }

    return NextResponse.json({
      success: true,
      data: order,
      message: "Order updated successfully",
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
    console.error("PATCH /api/orders/:id error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update order" },
      { status: 500 }
    );
  }
}
