"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Image from "next/image";

const DEFAULT_HERO = "/Herobg.png";
const SLIDE_MS = 4000;

interface HeroSectionProps {
  images?: string[];
  mobileImages?: string[];
}

function HeroCarousel({
  slides,
  className,
}: {
  slides: string[];
  className?: string;
}) {
  const prefersReduced = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1 || prefersReduced) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, SLIDE_MS);
    return () => clearInterval(id);
  }, [slides.length, prefersReduced]);

  return (
    <div className={className}>
      <AnimatePresence mode="sync">
        <motion.div
          key={slides[index]}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <Image
            src={slides[index]}
            alt="Evaan Jewels hero"
            fill
            className="object-cover object-center"
            priority={index === 0}
            sizes="100vw"
          />
        </motion.div>
      </AnimatePresence>

      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show hero image ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === index
                  ? "w-6 bg-gold-400"
                  : "w-1.5 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function HeroSection({
  images = [],
  mobileImages = [],
}: HeroSectionProps) {
  const desktopSlides = images.length > 0 ? images : [DEFAULT_HERO];
  const mobileSlides =
    mobileImages.length > 0 ? mobileImages : desktopSlides;

  return (
    <section
      className="relative w-full overflow-hidden bg-charcoal-900 aspect-[9/16] md:aspect-[1.85/1] md:max-h-[72vh]"
      aria-label="Hero"
    >
      <HeroCarousel
        slides={mobileSlides}
        className="absolute inset-0 md:hidden"
      />
      <HeroCarousel
        slides={desktopSlides}
        className="absolute inset-0 hidden md:block"
      />
    </section>
  );
}
