"use client";

import { useEffect, useState } from "react";

import { formatCurrency } from "@/lib/utils";

interface PriceRate {
  name: string;
  variantName: string;
  price: number;
  unit: string;
}

export function PriceTicker() {
  const [rates, setRates] = useState<PriceRate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRates() {
      try {
        const res = await fetch("/api/metals");
        const data = await res.json();
        if (data.success && data.data) {
          const extractedRates: PriceRate[] = [];
          for (const metal of data.data) {
            for (const variant of metal.variants) {
              extractedRates.push({
                name: metal.name,
                variantName: variant.name,
                price: variant.pricePerGram,
                unit: `/${variant.unit}`,
              });
            }
          }
          setRates(extractedRates);
        }
      } catch {
        // Silent fail — ticker is non-critical
      } finally {
        setLoading(false);
      }
    }
    fetchRates();
    // Refresh rates every 5 minutes
    const interval = setInterval(fetchRates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !rates.length) return null;

  // Two identical halves so translateX(-50%) loops seamlessly
  const tickerItems = [...rates, ...rates];

  return (
    <section className="border-y border-gold-200/50 bg-linear-to-r from-gold-50/80 via-white to-gold-50/80 overflow-hidden">
      <div className="py-3 relative">
        {/* Gold label */}
        <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center bg-linear-to-r from-gold-600 to-gold-500 px-4 sm:px-6 shadow-md">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap">
            Live Rates
          </span>
        </div>

        {/* Scrolling ticker — w-max + shrink-0 so the track is wider than the viewport */}
        <div className="ml-20 sm:ml-28 overflow-hidden">
          <div className="flex w-max animate-ticker will-change-transform">
            {tickerItems.map((rate, idx) => (
              <div
                key={idx}
                className="inline-flex shrink-0 items-center gap-2 px-6 sm:px-8 border-r border-gold-200/50"
              >
                <span className="text-xs sm:text-sm font-medium text-charcoal-600 whitespace-nowrap">
                  {rate.name} {rate.variantName}
                </span>
                <span className="font-mono text-sm sm:text-base font-bold text-gold-700 whitespace-nowrap">
                  {formatCurrency(rate.price)}
                </span>
                <span className="text-[10px] text-charcoal-400 whitespace-nowrap">
                  {rate.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
