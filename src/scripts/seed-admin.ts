/**
 * Admin Seed Script
 *
 * Creates an initial admin user for the Evaan Jewels application.
 *
 * Usage:
 *   npx tsx src/scripts/seed-admin.ts
 *
 * Environment:
 *   Requires MONGODB_URI in .env.local
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
import path from "path";

// Load env
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI is not defined in .env.local");
  process.exit(1);
}

// Admin schema (inline to avoid ESM/import issues in script)
const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: ["super_admin", "admin"],
      default: "admin",
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Admin =
  mongoose.models.Admin || mongoose.model("Admin", adminSchema);

async function seedAdmin() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI as string);
    console.log("Connected successfully.");

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({
      email: "admin@evaanjewels.com",
    });

    if (existingAdmin) {
      console.log("Admin user already exists:");
      console.log(`  Email: ${existingAdmin.email}`);
      console.log(`  Name: ${existingAdmin.name}`);
      console.log(`  Role: ${existingAdmin.role}`);
      console.log("\nNo changes made.");
      await mongoose.disconnect();
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash("Admin@123", salt);

    // Create admin
    const admin = await Admin.create({
      name: "Aakash Gupta",
      email: "admin@evaanjewels.com",
      password: hashedPassword,
      role: "super_admin",
      isActive: true,
    });

    console.log("\nAdmin user created successfully!");
    console.log("──────────────────────────────");
    console.log(`  Name:     ${admin.name}`);
    console.log(`  Email:    ${admin.email}`);
    console.log(`  Password: Admin@123`);
    console.log(`  Role:     ${admin.role}`);
    console.log("──────────────────────────────");
    console.log("\n⚠ Change this password after first login!");

    await mongoose.disconnect();
    console.log("Done.");
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

seedAdmin();
