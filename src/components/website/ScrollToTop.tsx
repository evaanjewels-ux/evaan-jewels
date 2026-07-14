"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function forceScrollTop() {
  if (typeof window === "undefined") return;
  // Disable browser history scroll restoration for SPA navigations
  try {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  } catch {
    /* ignore */
  }
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

/**
 * Resets scroll position on client-side route changes.
 * Next.js / browsers often restore previous scroll (and cart hydration can
 * expand page height), so we force top and re-run a few times after paint.
 */
export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    forceScrollTop();

    const raf = requestAnimationFrame(() => forceScrollTop());
    const t1 = window.setTimeout(forceScrollTop, 50);
    const t2 = window.setTimeout(forceScrollTop, 150);
    const t3 = window.setTimeout(forceScrollTop, 400);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [pathname]);

  return null;
}
