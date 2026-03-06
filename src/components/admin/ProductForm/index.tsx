"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { Stepper } from "@/components/ui/Stepper";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { StepBasicInfo, type BasicInfoData } from "./StepBasicInfo";
import { StepComposition, type CompositionData, type MetalEntry, type GemstoneEntry } from "./StepComposition";
import { StepCharges, type ChargesData } from "./StepCharges";
import { StepImages, type ImagesData, type ColorImageEntry } from "./StepImages";
import { StepReview } from "./StepReview";
import { calculateProductPrice } from "@/lib/pricing";
import { generateProductCode } from "@/lib/utils";

const STEPS = [
  { id: 0, label: "Basic Info" },
  { id: 1, label: "Composition" },
  { id: 2, label: "Charges" },
  { id: 3, label: "Images & Flags" },
  { id: 4, label: "Review" },
];

export interface ProductFormData {
  basic: BasicInfoData;
  composition: CompositionData;
  charges: ChargesData;
  images: ImagesData;
}

interface ProductFormProps {
  mode: "create" | "edit";
  initialData?: Record<string, unknown>;
  productId?: string;
}

export function ProductForm({ mode, initialData, productId }: ProductFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState<ProductFormData>(() => {
    if (initialData) {
      return parseInitialData(initialData);
    }
    return getDefaultFormData();
  });

  // Track categories for product code generation
  const [categories, setCategories] = useState<
    Array<{ _id: string; name: string; slug: string }>
  >([]);

  useEffect(() => {
    let cancelled = false;

    const fetchCategories = async (retries = 3) => {
      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          const ts = Date.now();
          const res = await fetch(`/api/categories?_t=${ts}`, { cache: "no-store" });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const d = await res.json();
          if (d.success && d.data?.length > 0) {
            if (!cancelled) setCategories(d.data);
            return;
          }
          // API returned success but empty data — may be a timing issue, retry
          if (attempt < retries - 1) {
            await new Promise((r) => setTimeout(r, 600));
          }
        } catch {
          if (attempt < retries - 1) {
            await new Promise((r) => setTimeout(r, 600));
          }
        }
      }
      // Final fallback attempt
      try {
        const res = await fetch(`/api/categories?_t=${Date.now()}`, { cache: "no-store" });
        const d = await res.json();
        if (d.success && d.data) {
          if (!cancelled) setCategories(d.data);
        }
      } catch {
        // Exhausted all retries
      }
    };

    fetchCategories();
    return () => { cancelled = true; };
  }, []);

  const updateBasic = useCallback((data: BasicInfoData) => {
    setFormData((prev) => ({ ...prev, basic: data }));
  }, []);

  const updateComposition = useCallback((data: CompositionData) => {
    setFormData((prev) => ({ ...prev, composition: data }));
  }, []);

  const updateCharges = useCallback((data: ChargesData) => {
    setFormData((prev) => ({ ...prev, charges: data }));
  }, []);

  const updateImages = useCallback((data: ImagesData) => {
    setFormData((prev) => ({ ...prev, images: data }));
  }, []);

  const goNext = () => {
    setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const goBack = () => {
    setCurrentStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const goTo = (step: number) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const calculatePrices = () => {
    return calculateProductPrice({
      metalComposition: formData.composition.metals.map((m: MetalEntry) => ({
        metal: m.metalId as unknown as import("mongoose").Types.ObjectId,
        variantId: m.variantId as unknown as import("mongoose").Types.ObjectId,
        variantName: m.variantName,
        weightInGrams: m.weightInGrams,
        pricePerGram: m.pricePerGram,
        subtotal: m.weightInGrams * m.pricePerGram,
        wastageCharges: m.wastageCharges,
      })),
      gemstoneComposition: formData.composition.gemstones.map((g: GemstoneEntry) => ({
        gemstone: g.gemstoneId as unknown as import("mongoose").Types.ObjectId,
        variantId: g.variantId as unknown as import("mongoose").Types.ObjectId,
        variantName: g.variantName,
        weightInCarats: g.weightInCarats,
        quantity: g.quantity,
        pricePerCarat: g.pricePerCarat,
        subtotal: g.weightInCarats * g.quantity * g.pricePerCarat,
        wastageCharges: g.wastageCharges,
      })),
      makingCharges: formData.charges.makingCharges,
      gstPercentage: formData.charges.gstPercentage,
      otherCharges: formData.charges.otherCharges,
    });
  };

  const handleSubmit = async () => {
    // Client-side guard: require at least one image
    if (formData.images.images.length === 0) {
      toast.error("Please upload at least one product image");
      setCurrentStep(3);
      return;
    }

    setIsSubmitting(true);
    try {
      const prices = calculatePrices();

      // Build the product payload
      const categorySlug =
        categories.find((c) => c._id === formData.basic.category)?.slug || "gen";

      const payload = {
        name: formData.basic.name,
        description: formData.basic.description,
        category: formData.basic.category,
        gender: formData.basic.gender,

        metalComposition: formData.composition.metals
          .filter((m: MetalEntry) => m.metalId !== "" && m.variantId !== "")
          .map((m: MetalEntry) => ({
            metal: m.metalId,
            variantId: m.variantId,
            variantName: m.variantName,
            weightInGrams: m.weightInGrams,
            pricePerGram: m.pricePerGram,
            subtotal: m.weightInGrams * m.pricePerGram,
            wastageCharges: m.wastageCharges,
          })),
        gemstoneComposition: formData.composition.gemstones
          .filter((g: GemstoneEntry) => g.gemstoneId !== "" && g.variantId !== "")
          .map((g: GemstoneEntry) => ({
            gemstone: g.gemstoneId,
            variantId: g.variantId,
            variantName: g.variantName,
            weightInCarats: g.weightInCarats,
            quantity: g.quantity,
            pricePerCarat: g.pricePerCarat,
            subtotal: g.weightInCarats * g.quantity * g.pricePerCarat,
            wastageCharges: g.wastageCharges,
          })),

        makingCharges: formData.charges.makingCharges,
        // wastageCharges is now stored per-composition item above
        wastageCharges: { type: "fixed", value: 0 },
        gstPercentage: formData.charges.gstPercentage,
        otherCharges: formData.charges.otherCharges,

        ...prices,

        images: formData.images.images,
        thumbnailImage: formData.images.images[0] || "",

        isNewArrival: formData.images.isNewArrival,
        isOutOfStock: formData.images.isOutOfStock,
        isFeatured: formData.images.isFeatured,
        isActive: formData.images.isActive,

        metaTitle: formData.images.metaTitle || undefined,
        metaDescription: formData.images.metaDescription || undefined,

        colorImages: formData.images.colorImages.filter(
          (ci: ColorImageEntry) => ci.images.length > 0
        ),

        sizes: formData.basic.sizes || [],
        colors: formData.basic.colors || [],

        grossWeight: formData.composition.metals.reduce(
          (s: number, m: MetalEntry) => s + m.weightInGrams,
          0
        ),
        netWeight: formData.composition.metals.reduce(
          (s: number, m: MetalEntry) => s + m.weightInGrams,
          0
        ),
      };

      // For create, generate product code
      if (mode === "create") {
        const codePrefix = categorySlug.substring(0, 3).toUpperCase();
        (payload as Record<string, unknown>).productCode = generateProductCode(
          codePrefix,
          Date.now() % 10000
        );
      }

      const url =
        mode === "edit" ? `/api/products/${productId}` : "/api/products";
      const method = mode === "edit" ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (result.success) {
        setIsSuccess(true);
        toast.success(
          mode === "edit"
            ? "Product updated successfully"
            : "Product created successfully"
        );
        setTimeout(() => {
          router.push("/admin/products");
          router.refresh();
        }, 1500);
      } else {
        toast.error(result.error || "Failed to save product");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10 mb-6"
        >
          <Check size={40} className="text-success" />
        </motion.div>
        <h2 className="text-2xl font-heading font-bold text-charcoal-700">
          {mode === "edit" ? "Product Updated!" : "Product Created!"}
        </h2>
        <p className="text-charcoal-400 mt-2">Redirecting to products list...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Products", href: "/admin/products" },
          { label: mode === "edit" ? "Edit Product" : "Add Product" },
        ]}
      />

      <div>
        <h1 className="text-2xl font-heading font-bold text-charcoal-700">
          {mode === "edit" ? "Edit Product" : "Add New Product"}
        </h1>
        <p className="text-sm text-charcoal-400 mt-1">
          {mode === "edit"
            ? "Update product details, composition, and pricing"
            : "Create a new product with detailed composition and pricing"}
        </p>
      </div>

      <Stepper steps={STEPS} currentStep={currentStep} />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {currentStep === 0 && (
            <StepBasicInfo
              data={formData.basic}
              onChange={updateBasic}
              categories={categories}
              onNext={goNext}
            />
          )}
          {currentStep === 1 && (
            <StepComposition
              data={formData.composition}
              onChange={updateComposition}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {currentStep === 2 && (
            <StepCharges
              data={formData.charges}
              onChange={updateCharges}
              compositionData={formData.composition}
              onCompositionChange={updateComposition}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {currentStep === 3 && (
            <StepImages
              data={formData.images}
              onChange={updateImages}
              colors={formData.basic.colors}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {currentStep === 4 && (
            <StepReview
              formData={formData}
              categories={categories}
              prices={calculatePrices()}
              onBack={goBack}
              onGoTo={goTo}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              mode={mode}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function getDefaultFormData(): ProductFormData {
  return {
    basic: {
      name: "",
      description: "",
      category: "",
      gender: "unisex",
      sizes: [],
      colors: [],
    },
    composition: {
      metals: [],
      gemstones: [],
    },
    charges: {
      makingCharges: { type: "fixed", value: 0 },
      gstPercentage: 3,
      otherCharges: [],
    },
    images: {
      images: [],
      colorImages: [],
      isNewArrival: false,
      isOutOfStock: false,
      isFeatured: false,
      isActive: true,
      metaTitle: "",
      metaDescription: "",
    },
  };
}

function parseInitialData(d: Record<string, unknown>): ProductFormData {
  const data = d as Record<string, unknown>;
  const metalComposition = (data.metalComposition as Array<Record<string, unknown>>) || [];
  const gemstoneComposition = (data.gemstoneComposition as Array<Record<string, unknown>>) || [];
  const makingCharges = (data.makingCharges as Record<string, unknown>) || {
    type: "fixed",
    value: 0,
  };
  const otherCharges = (data.otherCharges as Array<Record<string, unknown>>) || [];

  return {
    basic: {
      name: (data.name as string) || "",
      description: (data.description as string) || "",
      category:
        typeof data.category === "object"
          ? ((data.category as Record<string, unknown>)?._id as string) || ""
          : (data.category as string) || "",
      gender: (data.gender as "men" | "women" | "unisex" | "kids") || "unisex",
      sizes: (data.sizes as string[]) || [],
      colors: (data.colors as string[]) || [],
    },
    composition: {
      metals: metalComposition
        .map((m) => {
          const metalRef = m.metal as Record<string, unknown> | string | null;
          const mWastage = (m.wastageCharges as Record<string, unknown>) || null;
          const metalId =
            (typeof metalRef === "object" && metalRef !== null)
              ? (metalRef._id as string) || ""
              : (metalRef as string) || "";
          return {
            metalId,
            metalName:
              (typeof metalRef === "object" && metalRef !== null)
                ? (metalRef.name as string) || ""
                : "",
            variantId: (m.variantId as string) || "",
            variantName: (m.variantName as string) || "",
            weightInGrams: (m.weightInGrams as number) || 0,
            pricePerGram: (m.pricePerGram as number) || 0,
            wastageCharges: mWastage
              ? {
                  type: (mWastage.type as "fixed" | "percentage") || "percentage",
                  value: (mWastage.value as number) || 0,
                }
              : { type: "percentage" as const, value: 0 },
          };
        })
        // Drop any composition entries whose metal ref was deleted from the DB
        .filter((m) => m.metalId !== ""),
      gemstones: gemstoneComposition
        .map((g) => {
          const gemRef = g.gemstone as Record<string, unknown> | string | null;
          const gWastage = (g.wastageCharges as Record<string, unknown>) || null;
          const gemstoneId =
            (typeof gemRef === "object" && gemRef !== null)
              ? (gemRef._id as string) || ""
              : (gemRef as string) || "";
          return {
            gemstoneId,
            gemstoneName:
              (typeof gemRef === "object" && gemRef !== null)
                ? (gemRef.name as string) || ""
                : "",
            variantId: (g.variantId as string) || "",
            variantName: (g.variantName as string) || "",
            weightInCarats: (g.weightInCarats as number) || 0,
            quantity: (g.quantity as number) || 1,
            pricePerCarat: (g.pricePerCarat as number) || 0,
            wastageCharges: gWastage
              ? {
                  type: (gWastage.type as "fixed" | "percentage") || "percentage",
                  value: (gWastage.value as number) || 0,
                }
              : { type: "percentage" as const, value: 0 },
          };
        })
        // Drop any composition entries whose gemstone ref was deleted from the DB
        .filter((g) => g.gemstoneId !== ""),
    },
    charges: {
      makingCharges: {
        type: (makingCharges.type as "fixed" | "percentage") || "fixed",
        value: (makingCharges.value as number) || 0,
      },
      gstPercentage: (data.gstPercentage as number) ?? 3,
      otherCharges: otherCharges.map((c) => ({
        name: (c.name as string) || "",
        amount: (c.amount as number) || 0,
      })),
    },
    images: {
      images: (data.images as string[]) || [],
      colorImages: ((data.colorImages as Array<Record<string, unknown>>) || []).map((ci) => ({
        color: (ci.color as string) || "",
        images: (ci.images as string[]) || [],
      })),
      isNewArrival: (data.isNewArrival as boolean) ?? false,
      isOutOfStock: (data.isOutOfStock as boolean) ?? false,
      isFeatured: (data.isFeatured as boolean) ?? false,
      isActive: (data.isActive as boolean) ?? true,
      metaTitle: (data.metaTitle as string) || "",
      metaDescription: (data.metaDescription as string) || "",
    },
  };
}
