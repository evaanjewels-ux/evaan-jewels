import Link from "next/link";
import { Phone, MapPin, Mail, Clock } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { WEBSITE_FOOTER_LINKS } from "@/constants/navigation";
import { APP_NAME } from "@/constants";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-charcoal-800 text-charcoal-200 pb-20 md:pb-0">
      {/* Main Footer — compact on mobile */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 md:py-16 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column — hidden on mobile, shown on sm+ */}
          <div className="hidden sm:block sm:col-span-2 lg:col-span-1">
            <Logo size="lg" variant="light" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-charcoal-300">
              Premium gold &amp; diamond jewelry crafted with precision and worn with
              pride. Trusted by families for generations.
            </p>
            {/* Trust Badges */}
            <div className="mt-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-charcoal-700">
                <span className="text-xs font-bold text-gold-400">BIS</span>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-charcoal-700">
                <span className="text-[10px] font-bold text-gold-400">916</span>
              </div>
              <div className="text-xs text-charcoal-400">
                Hallmark Certified<br />
                <span className="text-gold-500">Since 2005</span>
              </div>
            </div>
          </div>

          {/* Mobile: compact 2-column links */}
          <div className="grid grid-cols-2 gap-6 sm:hidden">
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gold-500">
                Shop
              </h4>
              <ul className="space-y-2">
                {WEBSITE_FOOTER_LINKS.shop.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-xs text-charcoal-300 transition-colors hover:text-gold-400"
                    >
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gold-500">
                Company
              </h4>
              <ul className="space-y-2">
                {WEBSITE_FOOTER_LINKS.company.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-xs text-charcoal-300 transition-colors hover:text-gold-400"
                    >
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Mobile: compact contact info */}
          <div className="flex flex-wrap gap-4 text-xs text-charcoal-300 sm:hidden">
            <a href="tel:+919654148574" className="flex items-center gap-1.5 hover:text-gold-400">
              <Phone className="h-3.5 w-3.5 text-gold-600" />
              +91 96541 48574
            </a>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-gold-600" />
              Mon–Sat: 10AM–8PM
            </span>
          </div>

          {/* Desktop/Tablet: Shop Links */}
          <div className="hidden sm:block">
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gold-500">
              Shop
            </h4>
            <ul className="space-y-3">
              {WEBSITE_FOOTER_LINKS.shop.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-charcoal-300 transition-colors hover:text-gold-400"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Desktop/Tablet: Company Links */}
          <div className="hidden sm:block">
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gold-500">
              Company
            </h4>
            <ul className="space-y-3">
              {WEBSITE_FOOTER_LINKS.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-charcoal-300 transition-colors hover:text-gold-400"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Desktop/Tablet: Contact Column */}
          <div className="hidden sm:block">
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gold-500">
              Get In Touch
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="tel:+919654148574"
                  className="flex items-center gap-2 text-sm text-charcoal-300 transition-colors hover:text-gold-400"
                >
                  <Phone className="h-4 w-4 shrink-0 text-gold-600" />
                  +91 96541 48574
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@evaanjewels.com"
                  className="flex items-center gap-2 text-sm text-charcoal-300 transition-colors hover:text-gold-400"
                >
                  <Mail className="h-4 w-4 shrink-0 text-gold-600" />
                  info@evaanjewels.com
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm text-charcoal-300">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" />
                <span>
                  2nd Floor, B-169, Mohan Garden,<br />
                  Uttam Nagar, Delhi — 110059
                </span>
              </li>
              <li className="flex items-center gap-2 text-sm text-charcoal-300">
                <Clock className="h-4 w-4 shrink-0 text-gold-600" />
                Mon–Sat: 10 AM – 8 PM
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-charcoal-700">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-3 text-[10px] text-charcoal-400 sm:flex-row sm:px-6 sm:text-xs lg:px-8">
          <p>&copy; {currentYear} {APP_NAME}. All rights reserved.</p>
          <p>Crafted with love in India</p>
        </div>
      </div>
    </footer>
  );
}
