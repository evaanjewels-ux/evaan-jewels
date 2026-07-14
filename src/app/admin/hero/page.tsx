"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ImageIcon, Save, Trash2, GripVertical, Smartphone, Monitor } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MultiImageUpload } from "@/components/ui/ImageUpload";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { Skeleton } from "@/components/ui/Skeleton";

function ImageOrderList({
  images,
  label,
  onMove,
  onRemove,
}: {
  images: string[];
  label: string;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
}) {
  if (images.length === 0) {
    return (
      <p className="text-sm text-charcoal-400">
        No {label.toLowerCase()} images yet.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {images.map((url, i) => (
        <li
          key={`${url}-${i}`}
          className="flex items-center gap-3 rounded-lg border border-charcoal-100 p-2"
        >
          <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-md bg-charcoal-50">
            <Image
              src={url}
              alt={`${label} ${i + 1}`}
              fill
              className="object-cover"
              sizes="96px"
            />
          </div>
          <div className="flex flex-1 items-center gap-1">
            <button
              type="button"
              onClick={() => onMove(i, i - 1)}
              disabled={i === 0}
              className="rounded p-1.5 text-charcoal-400 hover:bg-charcoal-50 disabled:opacity-30"
              title="Move up"
            >
              <GripVertical className="h-4 w-4 rotate-90" />
            </button>
            <button
              type="button"
              onClick={() => onMove(i, i + 1)}
              disabled={i === images.length - 1}
              className="rounded p-1.5 text-charcoal-400 hover:bg-charcoal-50 disabled:opacity-30"
              title="Move down"
            >
              <GripVertical className="h-4 w-4 -rotate-90" />
            </button>
            <span className="text-xs text-charcoal-400">#{i + 1}</span>
          </div>
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="rounded p-2 text-charcoal-300 hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}

export default function HeroAdminPage() {
  const [images, setImages] = useState<string[]>([]);
  const [mobileImages, setMobileImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/hero", { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setImages(data.data.heroImages || []);
        setMobileImages(data.data.heroImagesMobile || []);
      } else {
        toast.error("Failed to load hero images");
      }
    } catch {
      toast.error("Failed to load hero images");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/hero", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heroImages: images,
          heroImagesMobile: mobileImages,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || "Failed to save");
        return;
      }
      setImages(data.data.heroImages || []);
      setMobileImages(data.data.heroImagesMobile || []);
      toast.success(
        `Hero images saved — ${(data.data.heroImagesMobile || []).length} phone, ${(data.data.heroImages || []).length} desktop`
      );
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const moveDesktop = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    setImages((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const moveMobile = (from: number, to: number) => {
    if (to < 0 || to >= mobileImages.length) return;
    setMobileImages((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Hero Section" },
        ]}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-charcoal-700">Hero Section</h1>
          <p className="mt-1 text-sm text-charcoal-400">
            Upload separate images for desktop and phone. The hero shows only the
            image — no text overlay. Images rotate every 4 seconds.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving || loading} isLoading={saving}>
          <Save className="h-4 w-4" />
          Save
        </Button>
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="space-y-6">
          {/* Desktop */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-5">
              <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-charcoal-700">
                <Monitor className="h-4 w-4 text-gold-600" />
                Desktop images
              </h2>
              <p className="mb-4 text-xs text-charcoal-400">
                Ratio <span className="font-medium text-charcoal-600">16:9</span>{" "}
                — recommended size{" "}
                <span className="font-medium text-charcoal-600">1920 × 1080</span>
                . Max 12 images.
              </p>
              <MultiImageUpload
                value={images}
                onChange={setImages}
                folder="hero"
                maxImages={12}
              />
            </Card>

            <Card className="p-5">
              <h2 className="mb-3 text-base font-semibold text-charcoal-700">
                Desktop order ({images.length})
              </h2>
              <ImageOrderList
                images={images}
                label="Desktop"
                onMove={moveDesktop}
                onRemove={(i) =>
                  setImages((prev) => prev.filter((_, idx) => idx !== i))
                }
              />
            </Card>
          </div>

          {/* Mobile */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-5">
              <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-charcoal-700">
                <Smartphone className="h-4 w-4 text-gold-600" />
                Phone images
              </h2>
              <p className="mb-4 text-xs text-charcoal-400">
                Ratio <span className="font-medium text-charcoal-600">9:16</span>{" "}
                (portrait) — recommended size{" "}
                <span className="font-medium text-charcoal-600">1080 × 1920</span>
                . Max 12 images. If empty, desktop images are used on phones.
              </p>
              <MultiImageUpload
                value={mobileImages}
                onChange={setMobileImages}
                folder="hero-mobile"
                maxImages={12}
              />
            </Card>

            <Card className="p-5">
              <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-charcoal-700">
                <ImageIcon className="h-4 w-4 text-gold-600" />
                Phone order ({mobileImages.length})
              </h2>
              <ImageOrderList
                images={mobileImages}
                label="Phone"
                onMove={moveMobile}
                onRemove={(i) =>
                  setMobileImages((prev) => prev.filter((_, idx) => idx !== i))
                }
              />
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
