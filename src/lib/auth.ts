import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import Admin from "@/models/Admin";
import User from "@/models/User";
import { authConfig } from "@/auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        accountType: { label: "Account Type", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const accountType =
          (credentials.accountType as string) === "customer"
            ? "customer"
            : "admin";

        await dbConnect();
        const email = (credentials.email as string).toLowerCase().trim();

        if (accountType === "customer") {
          const user = await User.findOne({ email, isActive: true });
          if (!user) throw new Error("Invalid email or password");

          const ok = await bcrypt.compare(
            credentials.password as string,
            user.password
          );
          if (!ok) throw new Error("Invalid email or password");

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: "customer",
            accountType: "customer" as const,
          };
        }

        const admin = await Admin.findOne({ email, isActive: true });
        if (!admin) throw new Error("Invalid email or password");

        const ok = await bcrypt.compare(
          credentials.password as string,
          admin.password
        );
        if (!ok) throw new Error("Invalid email or password");

        return {
          id: admin._id.toString(),
          name: admin.name,
          email: admin.email,
          role: admin.role,
          accountType: "admin" as const,
        };
      },
    }),
  ],
});
