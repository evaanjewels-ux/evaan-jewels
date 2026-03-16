"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Phone, MapPin, Globe, Heart } from "lucide-react";
import { useWishlist } from "@/components/providers/WishlistProvider";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/Logo";
import { CartIcon } from "@/components/website/CartIcon";
import { WEBSITE_NAV_ITEMS } from "@/constants/navigation";
import { useLanguage } from "@/components/providers/LanguageProvider";

const NAV_KEYS: Record<string, string> = {
  "/": "nav.home",
  "/categories": "nav.categories",
  "/new-arrivals": "nav.newArrivals",
  "/track-order": "nav.trackOrder",
  "/about": "nav.about",
  "/contact": "nav.contact",
};

export function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { t, toggleLanguage, language } = useLanguage();
  const { itemCount: wishlistCount } = useWishlist();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    const handleRouteChange = () => setIsMenuOpen(false);
    handleRouteChange();
  }, [pathname]);

  return (
    <>
      {/* Top Bar */}
      <div className="hidden bg-charcoal-700 text-charcoal-300 text-xs sm:block border-b border-charcoal-600/50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <a
              href="tel:+919654148574"
              className="flex items-center gap-1.5 transition-colors hover:text-gold-400"
            >
              <Phone className="h-3 w-3" />
              <span>+91 96541 48574</span>
            </a>
            <span className="hidden text-charcoal-500 md:inline">|</span>
            <span className="hidden items-center gap-1.5 md:flex">
              <MapPin className="h-3 w-3" />
              <span>2nd Floor, B-169, Mohan Garden ,
Uttam Nagar, Delhi — 110059 </span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 text-charcoal-300 transition-colors hover:text-gold-400"
            >
              <Globe className="h-3 w-3" />
              <span>{language === "en" ? "हिंदी" : "English"}</span>
            </button>
            <span className="text-charcoal-500">|</span>
            <div className="flex items-center gap-1.5 text-gold-400">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-gold-500" />
              <span>{t("hero.badge")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-500",
          isScrolled
            ? "bg-charcoal-900/98 shadow-lg backdrop-blur-md border-b border-gold-500/20"
            : "bg-gradient-to-r from-charcoal-900 via-charcoal-800 to-charcoal-900 border-b border-gold-500/15"
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo */}
          <Logo size="md" variant="dark" />

          {/* Desktop Navigation */}
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
                    "relative px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-lg",
                    isActive
                      ? "text-gold-400"
                      : "text-charcoal-200 hover:text-gold-400 hover:bg-white/5"
                  )}
                >
                  {t(NAV_KEYS[item.href] || item.title)}
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-gold-500"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop CTA + Cart + Wishlist + Language Toggle */}
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/wishlist"
              className="relative flex h-10 w-10 items-center justify-center rounded-lg text-charcoal-300 transition-colors hover:bg-white/10 hover:text-gold-400"
              aria-label="Wishlist"
            >
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-gold-500 text-[10px] font-bold text-white">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <CartIcon />
            <a
              href="https://wa.me/919654148574?text=Hi%20Evaan%20Jewels%2C%20I%27m%20interested%20in%20your%20jewelry%20collection."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-gold-500 px-5 py-2.5 text-sm font-medium text-charcoal-900 shadow-sm transition-all duration-200 hover:bg-gold-400 hover:shadow-md active:scale-[0.97]"
            >
              {t("nav.enquireNow")}
            </a>
          </div>

          {/* Mobile: Cart + Wishlist + Language Toggle + Menu */}
          <div className="flex items-center gap-2 md:hidden">
            <Link
              href="/wishlist"
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-charcoal-300 transition-colors hover:bg-white/10"
              aria-label="Wishlist"
            >
              <Heart className="h-4.5 w-4.5" />
              {wishlistCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gold-500 text-[9px] font-bold text-white">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <CartIcon />
            <button
              onClick={toggleLanguage}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-charcoal-300 transition-colors hover:bg-white/10"
              aria-label="Toggle language"
            >
              <Globe className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-charcoal-200 transition-colors hover:bg-white/10"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden border-t border-charcoal-700 md:hidden bg-charcoal-800"
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
                          ? "bg-gold-500/10 text-gold-400"
                          : "text-charcoal-300 hover:bg-white/5 hover:text-charcoal-100"
                      )}
                    >
                      {t(NAV_KEYS[item.href] || item.title)}
                    </Link>
                  );
                })}

                {/* Mobile CTA */}
                <div className="mt-4 border-t border-charcoal-700 pt-4">
                  <a
                    href="https://wa.me/919654148574?text=Hi%20Evaan%20Jewels%2C%20I%27m%20interested%20in%20your%20jewelry%20collection."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-gold-500 px-5 py-3 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-gold-600"
                  >
                    {t("nav.enquireWhatsApp")}
                  </a>
                  <a
                    href="tel:+919654148574"
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-charcoal-600 px-5 py-3 text-sm font-medium text-charcoal-200 transition-colors hover:bg-white/5"
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
