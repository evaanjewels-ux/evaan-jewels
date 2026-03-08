import { NextRequest, NextResponse } from "next/server";
import { uploadToR2, generateFileKey, deleteFromR2, getKeyFromUrl } from "@/lib/cloudflare-r2";

// Vercel free tier has a 4.5 MB body limit — keep video uploads under 4 MB
const MAX_VIDEO_SIZE = 4 * 1024 * 1024; // 4MB
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"];

// POST /api/upload/video — Upload a short product video to Cloudflare R2
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "videos";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Allowed: MP4, WebM" },
        { status: 400 }
      );
    }

    if (file.size > MAX_VIDEO_SIZE) {
      return NextResponse.json(
        { success: false, error: "File too large. Maximum video size is 4MB (Vercel free tier limit). Use shorter clips or external video URLs for larger files." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const ext = file.type === "video/webm" ? ".webm" : ".mp4";
    const contentType = file.type;
    const key = generateFileKey(folder, file.name.replace(/\.[^.]+$/, ext));
    const url = await uploadToR2(buffer, key, contentType);

    return NextResponse.json({
      success: true,
      data: { url, key },
      message: "Video uploaded successfully",
    });
  } catch (error) {
    console.error("POST /api/upload/video error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload video" },
      { status: 500 }
    );
  }
}

// DELETE /api/upload/video — Delete a video from Cloudflare R2
export async function DELETE(request: NextRequest) {
  try {
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
      message: "Video deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/upload/video error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete video" },
      { status: 500 }
    );
  }
}
