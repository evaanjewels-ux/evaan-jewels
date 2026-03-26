"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid3X3, Sparkles, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { title: "Home", href: "/", icon: Home },
  { title: "Categories", href: "/categories", icon: Grid3X3 },
  { title: "New", href: "/new-arrivals", icon: Sparkles },
  { title: "WhatsApp", href: "https://wa.me/919654148574?text=Hi%20Evaan%20Jewels%2C%20I%27m%20interested%20in%20your%20jewellery%20collection.", icon: MessageCircle },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-charcoal-100 bg-white/95 backdrop-blur-md md:hidden">
      <div className="flex items-center justify-around px-2 py-1.5">
        {NAV_ITEMS.map((item) => {
          const isExternal = item.href.startsWith("http");
          const isActive =
            !isExternal &&
            (item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href));

          if (isExternal) {
            return (
              <a
                key={item.title}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[10px] font-medium text-[#25D366] active:opacity-70"
              >
                <item.icon className="h-5 w-5 text-[#25D366]" />
                <span>{item.title}</span>
              </a>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[10px] font-medium transition-colors",
                isActive
                  ? "text-gold-600"
                  : "text-charcoal-400 active:text-charcoal-600"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5",
                  isActive ? "text-gold-600" : "text-charcoal-400"
                )}
              />
              <span>{item.title}</span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-gold-500" />
              )}
            </Link>
          );
        })}
      </div>
      {/* Safe area padding for devices with bottom notch */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
