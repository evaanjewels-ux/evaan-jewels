/**
 * Edge-compatible auth config.
 * No bcrypt / mongoose imports — safe for the proxy (edge) runtime.
 */
import type { NextAuthConfig } from "next-auth";

const ADMIN_ROLES = new Set(["admin", "super_admin"]);

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/account/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.accountType =
          user.accountType ||
          (ADMIN_ROLES.has(user.role || "") ? "admin" : "customer");
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) || "customer";
        session.user.accountType =
          (token.accountType as "admin" | "customer") || "customer";
      }
      return session;
    },
  },
  providers: [],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days for customers; fine for admins too
  },
  secret: process.env.AUTH_SECRET,
};
