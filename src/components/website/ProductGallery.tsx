"use client";

import Image from "next/image";
import { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface VideoItem {
  type: "upload" | "external";
  url: string;
}

interface ProductGalleryProps {
  images: string[];
  productName: string;
  videos?: VideoItem[];
}

/** Convert YouTube/Vimeo URLs to embeddable URLs */
function getEmbedUrl(url: string): string | null {
  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;

  return null;
}

export function ProductGallery({ images, productName, videos = [] }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  // Build combined media list: images first, then videos
  const mediaItems = useMemo(() => {
    const items: Array<{ kind: "image"; src: string } | { kind: "video"; video: VideoItem }> = [];
    images.forEach((src) => items.push({ kind: "image", src }));
    videos.forEach((video) => items.push({ kind: "video", video }));
    return items;
  }, [images, videos]);

  // Reset activeIndex when the images list changes (e.g. color variant switch)
  // to prevent accessing an out-of-bounds index (crash: cannot read 'kind' of undefined).
  useEffect(() => {
    setActiveIndex(0);
    setIsZoomed(false);
  }, [images]);

  const goTo = (index: number) => {
    if (index < 0) setActiveIndex(mediaItems.length - 1);
    else if (index >= mediaItems.length) setActiveIndex(0);
    else setActiveIndex(index);
    setIsZoomed(false);
  };

  if (!mediaItems.length) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-xl bg-charcoal-100 text-charcoal-400">
        No images available
      </div>
    );
  }

  // Clamp to valid range as a safety guard
  const safeIndex = Math.min(activeIndex, mediaItems.length - 1);
  const activeItem = mediaItems[safeIndex];

  return (
    <div className="flex flex-col gap-3">
      {/* Main Media */}
      <div className="group relative aspect-square overflow-hidden rounded-xl bg-charcoal-50">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative h-full w-full"
          >
            {activeItem.kind === "image" ? (
              <Image
                src={activeItem.src}
                alt={`${productName} — Image ${safeIndex + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className={cn(
                  "object-cover transition-transform duration-500",
                  isZoomed && "scale-150 cursor-zoom-out"
                )}
                priority={activeIndex === 0}
                onClick={() => setIsZoomed(!isZoomed)}
              />
            ) : activeItem.video.type === "upload" ? (
              <video
                src={activeItem.video.url}
                controls
                className="h-full w-full object-contain bg-black"
                playsInline
                preload="metadata"
              />
            ) : (
              (() => {
                const embedUrl = getEmbedUrl(activeItem.video.url);
                if (embedUrl) {
                  return (
                    <iframe
                      src={embedUrl}
                      className="h-full w-full"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                      title={`${productName} video`}
                    />
                  );
                }
                // Fallback: link to external video
                return (
                  <a
                    href={activeItem.video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-full w-full items-center justify-center bg-charcoal-100 text-charcoal-500 hover:text-gold-500 transition-colors"
                  >
                    <Play size={48} />
                  </a>
                );
              })()
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        {mediaItems.length > 1 && (
          <>
            <button
              onClick={() => goTo(activeIndex - 1)}
              className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-charcoal-700 shadow-sm opacity-0 backdrop-blur-sm transition-all group-hover:opacity-100 hover:bg-white"
              aria-label="Previous"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => goTo(activeIndex + 1)}
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-charcoal-700 shadow-sm opacity-0 backdrop-blur-sm transition-all group-hover:opacity-100 hover:bg-white"
              aria-label="Next"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Zoom Indicator (only for images) */}
        {activeItem.kind === "image" && (
          <div className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-charcoal-600 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
            <ZoomIn className="h-4 w-4" />
          </div>
        )}

        {/* Media Counter */}
        {mediaItems.length > 1 && (
          <div className="absolute bottom-2 left-2 rounded-full bg-charcoal-900/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {safeIndex + 1} / {mediaItems.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {mediaItems.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {mediaItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all sm:h-20 sm:w-20",
                safeIndex === idx
                  ? "border-gold-500 shadow-gold"
                  : "border-transparent hover:border-charcoal-200"
              )}
            >
              {item.kind === "image" ? (
                <Image
                  src={item.src}
                  alt={`${productName} — Thumbnail ${idx + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-charcoal-100">
                  <Play size={16} className="text-charcoal-500" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
