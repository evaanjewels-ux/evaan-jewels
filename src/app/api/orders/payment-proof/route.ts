import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { timingSafeEqual } from "crypto";
import sharp from "sharp";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import { paymentProofSchema } from "@/lib/validators/order";
import { uploadToR2, generateFileKey } from "@/lib/cloudflare-r2";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * POST /api/orders/payment-proof
 * Attach bank-transfer screenshot. Auth = orderNumber + shipping phone
 * (same pattern as track-order). Re-encodes image to strip EXIF.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    const fields = paymentProofSchema.parse({
      orderNumber: formData.get("orderNumber") || "",
      phone: formData.get("phone") || "",
      transactionId: formData.get("transactionId") || "",
      paymentNotes: formData.get("paymentNotes") || "",
    });

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Payment screenshot is required" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file type. Allowed: JPEG, PNG, WebP, AVIF",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "File too large. Maximum size is 5MB" },
        { status: 400 }
      );
    }

    await dbConnect();

    const order = await Order.findOne({
      orderNumber: fields.orderNumber.toUpperCase().trim(),
    });

    if (!order || !safeEqual(order.shippingAddress.phone, fields.phone)) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.payment.method !== "bank_transfer") {
      return NextResponse.json(
        {
          success: false,
          error: "Payment proof is only for bank transfer orders",
        },
        { status: 400 }
      );
    }

    if (
      order.payment.status === "verified" ||
      order.payment.status === "refunded" ||
      order.status === "cancelled"
    ) {
      return NextResponse.json(
        { success: false, error: "This order can no longer accept proof" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // Re-encode → strips EXIF/GPS metadata
    const optimized = await sharp(buffer)
      .rotate()
      .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    const key = generateFileKey(
      "payment-proofs",
      `${order.orderNumber}.webp`
    );
    const url = await uploadToR2(optimized, key, "image/webp");

    order.payment.proofUrl = url;
    order.payment.proofUploadedAt = new Date();
    if (fields.transactionId) {
      order.payment.transactionId = fields.transactionId;
    }
    if (fields.paymentNotes) {
      order.payment.notes = fields.paymentNotes;
    }
    // Mark received so admin sees it awaiting verification — never auto-verify
    if (order.payment.status === "pending") {
      order.payment.status = "received";
    }
    order.timeline.push({
      status: order.status,
      message: "Customer uploaded bank transfer proof.",
      timestamp: new Date(),
    });
    await order.save();

    return NextResponse.json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        proofUrl: url,
        paymentStatus: order.payment.status,
      },
      message: "Payment proof uploaded. We will verify and confirm your order.",
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
    console.error("POST /api/orders/payment-proof error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload payment proof" },
      { status: 500 }
    );
  }
}
