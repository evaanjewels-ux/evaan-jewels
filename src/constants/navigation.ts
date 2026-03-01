import {
  LayoutDashboard,
  Package,
  Grid3X3,
  CircleDollarSign,
  Gem,
  Receipt,
  BarChart3,
  Settings,
  Users,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Products",
    href: "/admin/products",
    icon: Package,
  },
  {
    title: "Categories",
    href: "/admin/categories",
    icon: Grid3X3,
  },
  {
    title: "Metals",
    href: "/admin/metals",
    icon: CircleDollarSign,
  },
  {
    title: "Gemstones",
    href: "/admin/gemstones",
    icon: Gem,
  },
  {
    title: "Pricing",
    href: "/admin/pricing",
    icon: BarChart3,
  },
  {
    title: "Orders",
    href: "/admin/orders",
    icon: ShoppingCart,
  },
  {
    title: "Customers",
    href: "/admin/customers",
    icon: Users,
  },
  {
    title: "Bills",
    href: "/admin/bills",
    icon: Receipt,
  },
];

export const ADMIN_MOBILE_NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Orders",
    href: "/admin/orders",
    icon: ShoppingCart,
  },
  {
    title: "Products",
    href: "/admin/products",
    icon: Package,
  },
  {
    title: "Categories",
    href: "/admin/categories",
    icon: Grid3X3,
  },
  {
    title: "Pricing",
    href: "/admin/pricing",
    icon: BarChart3,
  },
];

export const ADMIN_MORE_NAV_ITEMS: NavItem[] = [
  {
    title: "Metals",
    href: "/admin/metals",
    icon: CircleDollarSign,
  },
  {
    title: "Gemstones",
    href: "/admin/gemstones",
    icon: Gem,
  },
  {
    title: "Customers",
    href: "/admin/customers",
    icon: Users,
  },
  {
    title: "Bills",
    href: "/admin/bills",
    icon: Receipt,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

// ─── Website Navigation ─────────────────────────────

export interface WebsiteNavItem {
  title: string;
  href: string;
}

export const WEBSITE_NAV_ITEMS: WebsiteNavItem[] = [
  { title: "Home", href: "/" },
  { title: "Categories", href: "/categories" },
  { title: "New Arrivals", href: "/new-arrivals" },
  { title: "Track Order", href: "/track-order" },
  { title: "About", href: "/about" },
  { title: "Contact", href: "/contact" },
];

export const WEBSITE_FOOTER_LINKS = {
  shop: [
    { title: "All Categories", href: "/categories" },
    { title: "New Arrivals", href: "/new-arrivals" },
    { title: "Featured", href: "/featured" },
    { title: "Track Order", href: "/track-order" },
  ],
  company: [
    { title: "About Us", href: "/about" },
    { title: "Contact", href: "/contact" },
    { title: "Privacy Policy", href: "/privacy-policy" },
    { title: "Terms & Conditions", href: "/terms" },
  ],
};
