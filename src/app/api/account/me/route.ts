import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
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
    const user = await User.findById(session.user.id)
      .select("name email phone createdAt")
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Account not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("GET /api/account/me error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load profile" },
      { status: 500 }
    );
  }
}
