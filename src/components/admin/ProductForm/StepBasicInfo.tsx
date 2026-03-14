"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { GENDER_OPTIONS } from "@/constants";

const basicInfoSchema = z.object({
  name: z.string().min(1, "Product name is required").max(200),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  gender: z.enum(["men", "women", "unisex", "kids"]),
  sizes: z.array(z.string()),
  colors: z.array(z.string()),
});

export type BasicInfoData = z.infer<typeof basicInfoSchema>;

interface StepBasicInfoProps {
  data: BasicInfoData;
  onChange: (data: BasicInfoData) => void;
  categories: Array<{ _id: string; name: string; slug: string }>;
  onNext: () => void;
}

const RING_SIZES = Array.from({ length: 21 }, (_, i) => String(i + 6)); // 6 to 26

const COLOR_PRESETS = [
  "Yellow Gold",
  "Rose Gold",
  "White Gold",
  "Silver",
  "Platinum",
  "Black",
  "Red",
  "Blue",
  "Green",
];

export function StepBasicInfo({
  data,
  onChange,
  categories,
  onNext,
}: StepBasicInfoProps) {
  const [sizeInput, setSizeInput] = useState("");
  const [colorInput, setColorInput] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BasicInfoData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: data,
  });

  const sizes = watch("sizes") || [];
  const colors = watch("colors") || [];
  const selectedCategoryId = watch("category");

  // Detect if the selected category is a ring category
  const isRingCategory = useMemo(() => {
    const cat = categories.find((c) => c._id === selectedCategoryId);
    if (!cat) return false;
    return cat.name.toLowerCase().includes("ring") || cat.slug.toLowerCase().includes("ring");
  }, [selectedCategoryId, categories]);

  const addSize = () => {
    const trimmed = sizeInput.trim();
    if (trimmed && !sizes.includes(trimmed)) {
      const updated = [...sizes, trimmed];
      setValue("sizes", updated);
      setSizeInput("");
    }
  };

  const toggleRingSize = (size: string) => {
    if (sizes.includes(size)) {
      setValue("sizes", sizes.filter((s) => s !== size));
    } else {
      setValue("sizes", [...sizes, size]);
    }
  };

  const removeSize = (index: number) => {
    const updated = sizes.filter((_, i) => i !== index);
    setValue("sizes", updated);
  };

  const addColor = () => {
    const trimmed = colorInput.trim();
    if (trimmed && !colors.includes(trimmed)) {
      const updated = [...colors, trimmed];
      setValue("colors", updated);
      setColorInput("");
    }
  };

  const toggleColorPreset = (color: string) => {
    if (colors.includes(color)) {
      setValue("colors", colors.filter((c) => c !== color));
    } else {
      setValue("colors", [...colors, color]);
    }
  };

  const removeColor = (index: number) => {
    const updated = colors.filter((_, i) => i !== index);
    setValue("colors", updated);
  };

  const onSubmit = (values: BasicInfoData) => {
    onChange(values);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <div className="p-5 md:p-6 space-y-5">
          <h2 className="text-lg font-semibold text-charcoal-700">
            Basic Information
          </h2>

          <Input
            label="Product Name"
            placeholder="e.g., Gold Diamond Ring"
            error={errors.name?.message}
            {...register("name")}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Category"
              error={errors.category?.message}
              options={categories.map((c) => ({
                value: c._id,
                label: c.name,
              }))}
              placeholder="Select category"
              {...register("category")}
            />

            <Select
              label="Gender"
              error={errors.gender?.message}
              options={[...GENDER_OPTIONS]}
              {...register("gender")}
            />
          </div>

          <Textarea
            label="Description"
            placeholder="Detailed description of the product..."
            error={errors.description?.message}
            {...register("description")}
          />

          {/* Sizes */}
          <div>
            <label className="block text-sm font-medium text-charcoal-600 mb-1.5">
              Available Sizes
            </label>

            {/* Ring size quick-select */}
            {isRingCategory && (
              <div className="mb-3">
                <p className="text-xs text-charcoal-400 mb-2">Quick select ring sizes (6–26)</p>
                <div className="flex flex-wrap gap-1.5">
                  {RING_SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleRingSize(size)}
                      className={`h-8 w-10 rounded-lg border text-xs font-medium transition-all ${
                        sizes.includes(size)
                          ? "border-gold-400 bg-gold-50 text-gold-700"
                          : "border-charcoal-200 bg-white text-charcoal-500 hover:border-charcoal-300"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 mb-2">
              <Input
                placeholder={isRingCategory ? "Custom size (e.g., 6.5)" : "e.g., 6, 7, 8, Free Size, S, M, L"}
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSize();
                  }
                }}
              />
              <Button type="button" variant="secondary" size="sm" onClick={addSize}>
                <Plus size={16} />
              </Button>
            </div>
            {sizes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {sizes.map((size, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-full bg-charcoal-100 px-3 py-1 text-sm text-charcoal-700"
                  >
                    {size}
                    <button
                      type="button"
                      onClick={() => removeSize(i)}
                      className="text-charcoal-400 hover:text-error"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Colors */}
          <div>
            <label className="block text-sm font-medium text-charcoal-600 mb-1.5">
              Available Colors
            </label>

            {/* Color presets */}
            <div className="mb-3">
              <p className="text-xs text-charcoal-400 mb-2">Common options (click to add)</p>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => toggleColorPreset(preset)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                      colors.includes(preset)
                        ? "border-gold-400 bg-gold-50 text-gold-700"
                        : "border-charcoal-200 bg-white text-charcoal-500 hover:border-charcoal-300"
                    }`}
                  >
                    {colors.includes(preset) ? <span className="mr-1">✓</span> : null}{preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Custom color (e.g., Champagne Gold)"
                value={colorInput}
                onChange={(e) => setColorInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addColor();
                  }
                }}
              />
              <Button type="button" variant="secondary" size="sm" onClick={addColor}>
                <Plus size={16} />
              </Button>
            </div>
            {colors.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {colors.map((color, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-full bg-charcoal-100 px-3 py-1 text-sm text-charcoal-700"
                  >
                    {color}
                    <button
                      type="button"
                      onClick={() => removeColor(i)}
                      className="text-charcoal-400 hover:text-error"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" variant="primary">
          Continue to Composition
        </Button>
      </div>
    </form>
  );
}
