"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card } from "@/components/ui/Card";
import { MultiImageUpload } from "@/components/ui/ImageUpload";
import { MAX_PRODUCT_IMAGES } from "@/constants";
import { Palette } from "lucide-react";

export interface ColorImageEntry {
  color: string;
  images: string[];
}

export interface ImagesData {
  images: string[];
  colorImages: ColorImageEntry[];
  isNewArrival: boolean;
  isOutOfStock: boolean;
  isFeatured: boolean;
  isActive: boolean;
  metaTitle: string;
  metaDescription: string;
}

interface StepImagesProps {
  data: ImagesData;
  onChange: (data: ImagesData) => void;
  colors: string[];
  onNext: () => void;
  onBack: () => void;
}

export function StepImages({ data, onChange, colors, onNext, onBack }: StepImagesProps) {
  const hasColors = colors.length > 0;

  // Ensure colorImages entries exist for each color
  const getColorImages = (color: string): string[] => {
    return data.colorImages.find((ci) => ci.color === color)?.images || [];
  };

  const updateColorImages = (color: string, images: string[]) => {
    const existing = data.colorImages.filter((ci) => ci.color !== color);
    onChange({
      ...data,
      colorImages: [...existing, { color, images }],
    });
  };

  return (
    <div className="space-y-6">
      {/* Main Product Images */}
      <Card>
        <div className="p-5 md:p-6">
          <h2 className="text-lg font-semibold text-charcoal-700 mb-4">
            Product Images
          </h2>
          <p className="text-sm text-charcoal-400 mb-4">
            Upload up to {MAX_PRODUCT_IMAGES} general images. The first image will be
            used as thumbnail.
          </p>
          <MultiImageUpload
            value={data.images}
            onChange={(images) => onChange({ ...data, images })}
            folder="products"
            maxImages={MAX_PRODUCT_IMAGES}
          />
        </div>
      </Card>

      {/* Per-Color Images */}
      {hasColors && (
        <Card>
          <div className="p-5 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Palette size={20} className="text-gold-500" />
              <h2 className="text-lg font-semibold text-charcoal-700">
                Color-Specific Images
              </h2>
            </div>
            <p className="text-sm text-charcoal-400 mb-6">
              Upload images for each color variant. When a customer selects a color,
              these images will be shown in the gallery.
            </p>
            <div className="space-y-6">
              {colors.map((color) => (
                <div
                  key={color}
                  className="rounded-xl border border-charcoal-100 bg-charcoal-50/30 p-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center rounded-full bg-gold-100 px-3 py-1 text-sm font-medium text-gold-800">
                      {color}
                    </span>
                    <span className="text-xs text-charcoal-400">
                      {getColorImages(color).length} image(s)
                    </span>
                  </div>
                  <MultiImageUpload
                    value={getColorImages(color)}
                    onChange={(images) => updateColorImages(color, images)}
                    folder="products/colors"
                    maxImages={MAX_PRODUCT_IMAGES}
                  />
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Flags */}
      <Card>
        <div className="p-5 md:p-6">
          <h2 className="text-lg font-semibold text-charcoal-700 mb-4">
            Product Flags
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ToggleField
              label="New Arrival"
              description="Show 'New' badge on the product"
              checked={data.isNewArrival}
              onChange={(v) => onChange({ ...data, isNewArrival: v })}
            />
            <ToggleField
              label="Featured"
              description="Show in featured products section"
              checked={data.isFeatured}
              onChange={(v) => onChange({ ...data, isFeatured: v })}
            />
            <ToggleField
              label="Out of Stock"
              description="Mark as currently unavailable"
              checked={data.isOutOfStock}
              onChange={(v) => onChange({ ...data, isOutOfStock: v })}
            />
            <ToggleField
              label="Active"
              description="Publish product on the website"
              checked={data.isActive}
              onChange={(v) => onChange({ ...data, isActive: v })}
            />
          </div>
        </div>
      </Card>

      {/* SEO */}
      <Card>
        <div className="p-5 md:p-6 space-y-4">
          <h2 className="text-lg font-semibold text-charcoal-700">
            SEO (Optional)
          </h2>
          <Input
            label="Meta Title"
            placeholder="Custom page title (max 70 chars)"
            maxLength={70}
            value={data.metaTitle}
            onChange={(e) => onChange({ ...data, metaTitle: e.target.value })}
            helperText={`${data.metaTitle.length}/70 characters`}
          />
          <Textarea
            label="Meta Description"
            placeholder="Custom meta description (max 160 chars)"
            maxLength={160}
            value={data.metaDescription}
            onChange={(e) =>
              onChange({ ...data, metaDescription: e.target.value })
            }
            helperText={`${data.metaDescription.length}/160 characters`}
          />
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button type="button" variant="ghost" onClick={onBack}>
          Back
        </Button>
        <div className="flex items-center gap-3">
          {data.images.length === 0 && (
            <p className="text-sm text-error">Upload at least one image</p>
          )}
          <Button
            type="button"
            variant="primary"
            onClick={onNext}
            disabled={data.images.length === 0}
          >
            Review Product
          </Button>
        </div>
      </div>
    </div>
  );
}

function ToggleField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 p-3 rounded-lg border border-charcoal-100 cursor-pointer hover:bg-charcoal-50/50 transition-colors">
      <div className="relative inline-flex items-center shrink-0 mt-0.5">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className="w-9 h-5 bg-charcoal-200 peer-focus:ring-2 peer-focus:ring-gold-500/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:inset-s-0.5 after:bg-white after:border-charcoal-200 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gold-500"></div>
      </div>
      <div>
        <p className="text-sm font-medium text-charcoal-700">{label}</p>
        <p className="text-xs text-charcoal-400">{description}</p>
      </div>
    </label>
  );
}
