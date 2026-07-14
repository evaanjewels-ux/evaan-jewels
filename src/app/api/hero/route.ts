import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import SiteSettings from "@/models/SiteSettings";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const imageUrl = z
  .string()
  .min(1)
  .refine(
    (v) => {
      try {
        const u = new URL(v);
        return u.protocol === "http:" || u.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Invalid image URL" }
  );

const updateSchema = z.object({
  heroImages: z.array(imageUrl).max(12),
  heroImagesMobile: z.array(imageUrl).max(12).default([]),
});

function isAdmin(session: {
  user?: { accountType?: string; role?: string };
} | null) {
  if (!session?.user) return false;
  if (session.user.accountType === "admin") return true;
  return session.user.role === "admin" || session.user.role === "super_admin";
}

// GET /api/hero — public (homepage carousel)
export async function GET() {
  try {
    await dbConnect();
    const doc = await SiteSettings.findOne({ key: "site" }).lean();
    return NextResponse.json({
      success: true,
      data: {
        heroImages: doc?.heroImages ?? [],
        heroImagesMobile: doc?.heroImagesMobile ?? [],
      },
    });
  } catch (error) {
    console.error("GET /api/hero error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load hero images" },
      { status: 500 }
    );
  }
}

// PUT /api/hero — admin only
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!isAdmin(session)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();
    const body = await request.json();
    const { heroImages, heroImagesMobile } = updateSchema.parse(body);

    // Bypass schema-strict stripping (cached models in dev can drop new fields)
    await SiteSettings.collection.updateOne(
      { key: "site" },
      {
        $set: {
          heroImages,
          heroImagesMobile,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    const doc = await SiteSettings.findOne({ key: "site" }).lean();

    return NextResponse.json({
      success: true,
      data: {
        heroImages: doc?.heroImages ?? heroImages,
        heroImagesMobile: doc?.heroImagesMobile ?? heroImagesMobile,
      },
      message: "Hero images updated",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const msg = error.issues[0]?.message || "Validation failed";
      return NextResponse.json(
        { success: false, error: msg, details: error.flatten() },
        { status: 400 }
      );
    }
    console.error("PUT /api/hero error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update hero images" },
      { status: 500 }
    );
  }
}
