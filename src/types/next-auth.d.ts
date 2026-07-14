import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: string;
      accountType: "admin" | "customer";
    };
  }

  interface User {
    role?: string;
    accountType?: "admin" | "customer";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    accountType?: "admin" | "customer";
  }
}
