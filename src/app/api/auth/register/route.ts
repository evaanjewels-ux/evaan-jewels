import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { customerRegisterSchema } from "@/lib/validators/customer-auth";
import { sendWelcomeEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const validated = customerRegisterSchema.parse(body);

    const existing = await User.findOne({ email: validated.email });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(validated.password, 12);
    const user = await User.create({
      name: validated.name,
      email: validated.email,
      phone: validated.phone,
      password: hashed,
    });

    await sendWelcomeEmail({ to: user.email, name: user.name });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
        },
        message: "Account created successfully",
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
    console.error("POST /api/auth/register error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create account" },
      { status: 500 }
    );
  }
}
