import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Admin from "@/models/Admin";
import { auth } from "@/lib/auth";
import { changePasswordSchema } from "@/lib/validators/customer-auth";

export const dynamic = "force-dynamic";

// PATCH /api/account/password — customer or admin
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.accountType) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = changePasswordSchema.parse(body);

    await dbConnect();

    const isAdmin = session.user.accountType === "admin";
    const doc = isAdmin
      ? await Admin.findById(session.user.id)
      : await User.findById(session.user.id);

    if (!doc || !doc.isActive) {
      return NextResponse.json(
        { success: false, error: "Account not found" },
        { status: 404 }
      );
    }

    const valid = await bcrypt.compare(currentPassword, doc.password);
    if (!valid) {
      return NextResponse.json(
        { success: false, error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    doc.password = await bcrypt.hash(newPassword, 12);
    await doc.save();

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const msg =
        error.issues[0]?.message || "Validation failed";
      return NextResponse.json(
        { success: false, error: msg, details: error.flatten() },
        { status: 400 }
      );
    }
    console.error("PATCH /api/account/password error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update password" },
      { status: 500 }
    );
  }
}
