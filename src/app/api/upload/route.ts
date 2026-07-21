import { NextRequest, NextResponse } from "next/server";
import { uploadToR2, generateFileKey, deleteFromR2, getKeyFromUrl } from "@/lib/cloudflare-r2";
import sharp from "sharp";
import { auth } from "@/lib/auth";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const ALLOWED_FOLDER_PREFIXES = [
  "uploads",
  "hero",
  "hero-mobile",
  "products",
  "categories",
  "bills",
];

function sanitizeFolder(folder: string): string {
  const cleaned = folder.replace(/[^a-zA-Z0-9/_-]/g, "").replace(/^\/+|\/+$/g, "");
  if (
    ALLOWED_FOLDER_PREFIXES.some(
      (p) => cleaned === p || cleaned.startsWith(`${p}/`)
    )
  ) {
    return cleaned;
  }
  return "uploads";
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.accountType === "customer") {
    return null;
  }
  return session;
}

// POST /api/upload — Admin only (customer proofs use /api/orders/payment-proof)
export async function POST(request: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folderRaw = (formData.get("folder") as string) || "uploads";
    const folder = sanitizeFolder(folderRaw);

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Allowed: JPEG, PNG, WebP, AVIF" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "File too large. Maximum size is 5MB" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const optimized =
      folder === "hero"
        ? await sharp(buffer)
            .rotate()
            .resize(1920, 1080, { fit: "inside", withoutEnlargement: true })
            .webp({ quality: 82 })
            .toBuffer()
        : folder === "hero-mobile"
          ? await sharp(buffer)
              .rotate()
              .resize(1080, 1920, { fit: "inside", withoutEnlargement: true })
              .webp({ quality: 82 })
              .toBuffer()
          : await sharp(buffer)
              .rotate()
              .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
              .webp({ quality: 85 })
              .toBuffer();

    const key = generateFileKey(folder, file.name.replace(/\.[^.]+$/, ".webp"));
    const url = await uploadToR2(optimized, key, "image/webp");

    return NextResponse.json({
      success: true,
      data: { url, key },
      message: "Image uploaded successfully",
    });
  } catch (error) {
    console.error("POST /api/upload error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload image" },
      { status: 500 }
    );
  }
}

// DELETE /api/upload — Delete an image from Cloudflare R2
export async function DELETE(request: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { success: false, error: "No URL provided" },
        { status: 400 }
      );
    }

    const key = getKeyFromUrl(url);
    await deleteFromR2(key);

    return NextResponse.json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/upload error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete image" },
      { status: 500 }
    );
  }
}
