"use client";

import { useState } from "react";
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

  const addSize = () => {
    const trimmed = sizeInput.trim();
    if (trimmed && !sizes.includes(trimmed)) {
      const updated = [...sizes, trimmed];
      setValue("sizes", updated);
      setSizeInput("");
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
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="e.g., 6, 7, 8, Free Size, S, M, L"
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
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="e.g., Yellow Gold, Rose Gold, White"
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
