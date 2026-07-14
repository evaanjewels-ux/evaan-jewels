"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Phone, MapPin, Globe, Heart, User } from "lucide-react";
import { useWishlist } from "@/components/providers/WishlistProvider";
import { CartIcon } from "@/components/website/CartIcon";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/Logo";
import { WEBSITE_NAV_ITEMS } from "@/constants/navigation";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { trackContact } from "@/lib/analytics";

const NAV_KEYS: Record<string, string> = {
  "/": "nav.home",
  "/categories": "nav.categories",
  "/new-arrivals": "nav.newArrivals",
  "/track-order": "nav.trackOrder",
  "/about": "nav.about",
  "/contact": "nav.contact",
};

/** Same wine + gold — just a touch lighter than the deep version */
const iconBtn =
  "relative flex items-center justify-center rounded-lg text-gold-200 transition-colors hover:bg-white/10 hover:text-gold-300";

export function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { t, toggleLanguage, language } = useLanguage();
  const { itemCount: wishlistCount } = useWishlist();
  const { data: session } = useSession();
  const isCustomer = session?.user?.accountType === "customer";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <div className="hidden border-b border-[#7A2030]/70 bg-[#6E1A26] text-xs text-gold-200 sm:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <a
              href="tel:+919654148574"
              onClick={() => trackContact({ type: "call" })}
              className="flex items-center gap-1.5 transition-colors hover:text-gold-300"
            >
              <Phone className="h-3 w-3" />
              <span>+91 96541 48574</span>
            </a>
            <span className="hidden text-gold-200/40 md:inline">|</span>
            <span className="hidden items-center gap-1.5 text-gold-100/90 md:flex">
              <MapPin className="h-3 w-3" />
              <span>
                2nd Floor, B-169, Mohan Garden , Uttam Nagar, Delhi — 110059
              </span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 text-gold-200 transition-colors hover:text-gold-300"
            >
              <Globe className="h-3 w-3" />
              <span>{language === "en" ? "हिंदी" : "English"}</span>
            </button>
            <span className="text-gold-200/40">|</span>
            <div className="flex items-center gap-1.5 text-gold-300">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-gold-400" />
              <span>{t("hero.badge")}</span>
            </div>
          </div>
        </div>
      </div>

      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-500",
          isScrolled
            ? "border-b border-gold-500/30 bg-[#942D3A]/98 shadow-lg backdrop-blur-md"
            : "border-b border-gold-500/25 bg-[#A23342]"
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Logo size="md" />

          <nav className="hidden items-center gap-1 md:flex">
            {WEBSITE_NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200",
                    isActive
                      ? "text-gold-300"
                      : "text-gold-100/90 hover:bg-white/10 hover:text-gold-300"
                  )}
                >
                  {t(NAV_KEYS[item.href] || item.title)}
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-gold-400"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <CartIcon />
            <Link
              href={isCustomer ? "/account" : "/account/login"}
              className={cn(iconBtn, "h-10 w-10")}
              aria-label={isCustomer ? "My account" : "Sign in"}
            >
              <User className="h-5 w-5" />
            </Link>
            <Link
              href="/wishlist"
              className={cn(iconBtn, "h-10 w-10")}
              aria-label="Wishlist"
            >
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-gold-400 text-[10px] font-bold text-[#7A1E28]">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <a
              href="https://wa.me/919654148574?text=Hi%20Evaan%20Jewels%2C%20I%27m%20interested%20in%20your%20jewelry%20collection."
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackContact({ type: "whatsapp" })}
              className="ml-1 inline-flex items-center gap-2 rounded-lg bg-gold-400 px-5 py-2.5 text-sm font-semibold text-[#6B1A24] shadow-sm transition-all duration-200 hover:bg-gold-300 hover:shadow-md active:scale-[0.97]"
            >
              {t("nav.enquireNow")}
            </a>
          </div>

          <div className="flex items-center gap-1 md:hidden">
            <CartIcon />
            <Link
              href={isCustomer ? "/account" : "/account/login"}
              className={cn(iconBtn, "h-9 w-9")}
              aria-label={isCustomer ? "My account" : "Sign in"}
            >
              <User className="h-4.5 w-4.5" />
            </Link>
            <Link
              href="/wishlist"
              className={cn(iconBtn, "h-9 w-9")}
              aria-label="Wishlist"
            >
              <Heart className="h-4.5 w-4.5" />
              {wishlistCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gold-400 text-[9px] font-bold text-[#7A1E28]">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <button
              onClick={toggleLanguage}
              className={cn(iconBtn, "h-9 w-9")}
              aria-label="Toggle language"
            >
              <Globe className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={cn(iconBtn, "h-11 w-11")}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden border-t border-gold-500/25 bg-[#942D3A] md:hidden"
            >
              <nav className="flex flex-col px-4 py-4">
                {WEBSITE_NAV_ITEMS.map((item) => {
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center rounded-lg px-4 py-3 text-base font-medium transition-colors",
                        isActive
                          ? "bg-white/10 text-gold-300"
                          : "text-gold-100/90 hover:bg-white/10 hover:text-gold-300"
                      )}
                    >
                      {t(NAV_KEYS[item.href] || item.title)}
                    </Link>
                  );
                })}

                <div className="mt-4 border-t border-gold-500/25 pt-4">
                  <a
                    href="https://wa.me/919654148574?text=Hi%20Evaan%20Jewels%2C%20I%27m%20interested%20in%20your%20jewelry%20collection."
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackContact({ type: "whatsapp" })}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-gold-400 px-5 py-3 text-sm font-semibold text-[#6B1A24] shadow-sm transition-all duration-200 hover:bg-gold-300"
                  >
                    {t("nav.enquireWhatsApp")}
                  </a>
                  <a
                    href="tel:+919654148574"
                    onClick={() => trackContact({ type: "call" })}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-gold-400/40 px-5 py-3 text-sm font-medium text-gold-200 transition-colors hover:bg-white/10"
                  >
                    <Phone className="h-4 w-4" />
                    {t("nav.callUs")}
                  </a>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
