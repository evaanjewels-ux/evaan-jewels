import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const ADMIN_ROLES = new Set(["admin", "super_admin"]);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;
  const accountType = req.auth?.user?.accountType;
  const isAdmin =
    accountType === "admin" || (role ? ADMIN_ROLES.has(role) : false);
  const isCustomer = accountType === "customer" || role === "customer";

  // Admin login page
  if (pathname === "/login" || pathname.startsWith("/login/")) {
    if (req.auth && isAdmin) {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Admin panel — admins only
  if (pathname.startsWith("/admin")) {
    if (!req.auth || !isAdmin) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Customer account area (except login/register)
  const isPublicAccount =
    pathname.startsWith("/account/login") ||
    pathname.startsWith("/account/register");

  if (pathname.startsWith("/account") && !isPublicAccount) {
    if (!req.auth || !isCustomer) {
      const loginUrl = new URL("/account/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Logged-in customer on login/register → account home
  if (isPublicAccount && req.auth && isCustomer) {
    return NextResponse.redirect(new URL("/account", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin", "/admin/:path*", "/login", "/account", "/account/:path*"],
};
