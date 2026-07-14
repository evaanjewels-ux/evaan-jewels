"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { Stepper } from "@/components/ui/Stepper";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { StepBasicInfo, type BasicInfoData } from "./StepBasicInfo";
import {
  StepComposition,
  type CompositionData,
  type MetalEntry,
  type GemstoneEntry,
  type DisplayVariantEntry,
  type DisplayGemstoneEntry,
} from "./StepComposition";
import {
  StepBarDetails,
  getDefaultBarSpecs,
  barSpecsToMetalComposition,
  type BarSpecsData,
} from "./StepBarDetails";
import { StepCharges, type ChargesData } from "./StepCharges";
import { StepImages, type ImagesData, type ColorImageEntry, type VideoEntry } from "./StepImages";
import { StepReview } from "./StepReview";
import { calculateProductPrice } from "@/lib/pricing";
import { generateProductCode } from "@/lib/utils";
import { isBarCategory, formatBarWeightLabel } from "@/lib/bar-product";

const JEWELRY_STEPS = [
  { id: 0, label: "Basic Info" },
  { id: 1, label: "Composition" },
  { id: 2, label: "Charges" },
  { id: 3, label: "Images & Flags" },
  { id: 4, label: "Review" },
];

const BAR_STEPS = [
  { id: 0, label: "Basic Info" },
  { id: 1, label: "Bar Details" },
  { id: 2, label: "Charges" },
  { id: 3, label: "Images & Flags" },
  { id: 4, label: "Review" },
];

export interface ProductFormData {
  basic: BasicInfoData;
  composition: CompositionData;
  barSpecs: BarSpecsData;
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
          if (attempt < retries - 1) {
            await new Promise((r) => setTimeout(r, 600));
          }
        } catch {
          if (attempt < retries - 1) {
            await new Promise((r) => setTimeout(r, 600));
          }
        }
      }
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
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedCategory = useMemo(
    () => categories.find((c) => c._id === formData.basic.category),
    [categories, formData.basic.category]
  );

  const isBar = useMemo(
    () => isBarCategory(selectedCategory?.name, selectedCategory?.slug),
    [selectedCategory]
  );

  const STEPS = isBar ? BAR_STEPS : JEWELRY_STEPS;

  // Keep composition metals in sync when editing bar specs (for charges preview)
  useEffect(() => {
    if (!isBar) return;
    const metals = barSpecsToMetalComposition(formData.barSpecs);
    setFormData((prev) => {
      const same =
        prev.composition.metals.length === metals.length &&
        prev.composition.metals[0]?.metalId === metals[0]?.metalId &&
        prev.composition.metals[0]?.variantId === metals[0]?.variantId &&
        prev.composition.metals[0]?.weightInGrams === metals[0]?.weightInGrams &&
        prev.composition.metals[0]?.pricePerGram === metals[0]?.pricePerGram;
      if (same) return prev;
      return {
        ...prev,
        composition: {
          metals,
          gemstones: [],
          displayVariants: [],
          displayGemstones: [],
        },
      };
    });
  }, [isBar, formData.barSpecs]);

  const updateBasic = useCallback((data: BasicInfoData) => {
    setFormData((prev) => ({ ...prev, basic: data }));
  }, []);

  const updateComposition = useCallback((data: CompositionData) => {
    setFormData((prev) => ({ ...prev, composition: data }));
  }, []);

  const updateBarSpecs = useCallback((data: BarSpecsData) => {
    setFormData((prev) => ({ ...prev, barSpecs: data }));
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

  const activeComposition = isBar
    ? {
        metals: barSpecsToMetalComposition(formData.barSpecs),
        gemstones: [] as GemstoneEntry[],
        displayVariants: [] as DisplayVariantEntry[],
        displayGemstones: [] as DisplayGemstoneEntry[],
      }
    : formData.composition;

  const calculatePrices = () => {
    return calculateProductPrice({
      metalComposition: activeComposition.metals.map((m: MetalEntry) => ({
        metal: m.metalId as unknown as import("mongoose").Types.ObjectId,
        variantId: m.variantId as unknown as import("mongoose").Types.ObjectId,
        variantName: m.variantName,
        weightInGrams: m.weightInGrams,
        pricePerGram: m.pricePerGram,
        subtotal: m.weightInGrams * m.pricePerGram,
        wastageCharges: m.wastageCharges,
      })),
      gemstoneComposition: activeComposition.gemstones.map((g: GemstoneEntry) => ({
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
      chargeBasedOnVariant: formData.charges.chargeBasedOnVariant,
    });
  };

  const handleSubmit = async () => {
    if (formData.images.images.length === 0) {
      toast.error("Please upload at least one product image");
      setCurrentStep(3);
      return;
    }

    if (isBar) {
      if (!formData.barSpecs.metalId || !formData.barSpecs.variantId) {
        toast.error("Select metal and purity for this bar");
        setCurrentStep(1);
        return;
      }
      if (formData.barSpecs.weightOptions.length === 0) {
        toast.error("Add at least one weight option");
        setCurrentStep(1);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const prices = calculatePrices();
      const categorySlug =
        categories.find((c) => c._id === formData.basic.category)?.slug || "gen";

      const metals = activeComposition.metals.filter(
        (m: MetalEntry) => m.metalId !== "" && m.variantId !== ""
      );
      const defaultBarWeight =
        formData.barSpecs.weightOptions.find((w) => w.isDefault) ||
        formData.barSpecs.weightOptions[0];

      const payload: Record<string, unknown> = {
        name: formData.basic.name,
        description: formData.basic.description,
        category: formData.basic.category,
        gender: isBar ? "unisex" : formData.basic.gender,

        metalComposition: metals.map((m: MetalEntry) => ({
          metal: m.metalId,
          variantId: m.variantId,
          variantName: m.variantName,
          weightInGrams: m.weightInGrams,
          pricePerGram: m.pricePerGram,
          subtotal: m.weightInGrams * m.pricePerGram,
          wastageCharges: m.wastageCharges,
        })),
        gemstoneComposition: isBar
          ? []
          : formData.composition.gemstones
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
        hallmarkCertified: formData.images.hallmarkCertified,

        metaTitle: formData.images.metaTitle || undefined,
        metaDescription: formData.images.metaDescription || undefined,

        colorImages: isBar
          ? []
          : formData.images.colorImages.filter(
              (ci: ColorImageEntry) => ci.images.length > 0
            ),

        videos: formData.images.videos.filter((v: VideoEntry) => v.url.length > 0),

        chargeBasedOnVariant: formData.charges.chargeBasedOnVariant || undefined,

        displayVariants: isBar
          ? []
          : formData.composition.displayVariants.filter(
              (dv: DisplayVariantEntry) => dv.metal && dv.variants.length > 0
            ),

        displayGemstones: isBar
          ? []
          : formData.composition.displayGemstones.filter(
              (dg: DisplayGemstoneEntry) => dg.gemstone && dg.variantId
            ),

        sizes: isBar ? [] : formData.basic.sizes || [],
        colors: isBar ? [] : formData.basic.colors || [],

        netWeight: isBar
          ? defaultBarWeight?.netWeight || defaultBarWeight?.weightGrams || 0
          : formData.composition.metals.reduce(
              (s: number, m: MetalEntry) => s + m.weightInGrams,
              0
            ),
        grossWeight: isBar
          ? defaultBarWeight?.weightGrams || 0
          : formData.composition.metals.reduce(
              (s: number, m: MetalEntry) => s + m.weightInGrams,
              0
            ) +
            formData.composition.gemstones
              .filter((g: GemstoneEntry) => g.gemstoneId !== "" && g.variantId !== "")
              .reduce(
                (s: number, g: GemstoneEntry) =>
                  s + g.weightInCarats * g.quantity * 0.2,
                0
              ),
      };

      if (isBar) {
        payload.barSpecs = {
          shape: formData.barSpecs.shape,
          purity: formData.barSpecs.purity,
          countryOfOrigin: formData.barSpecs.countryOfOrigin || "India",
          importer: formData.barSpecs.importer || "NA",
          mintBrand: formData.barSpecs.mintBrand || "",
          weightOptions: formData.barSpecs.weightOptions.map((w) => ({
            weightGrams: w.weightGrams,
            sku: w.sku || "",
            dimension: w.dimension || "",
            netWeight: w.netWeight || w.weightGrams,
            isDefault: w.isDefault,
            isOutOfStock: w.isOutOfStock,
          })),
        };
      } else {
        payload.barSpecs = null;
      }

      if (mode === "create") {
        const codePrefix = isBar
          ? "BAR"
          : categorySlug.substring(0, 3).toUpperCase();
        const skuFromWeight = defaultBarWeight?.sku?.trim();
        payload.productCode =
          isBar && skuFromWeight
            ? skuFromWeight
            : generateProductCode(codePrefix, Date.now() % 10000);
      }

      const url =
        mode === "edit" ? `/api/products/${productId}` : "/api/products";
      const method = mode === "edit" ? "PUT" : "POST";

      let result = null;
      let lastError = "";
      const productCode = payload.productCode as string | undefined;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          result = await res.json();
          if (result.success) break;
          if (res.status === 400) break;
          lastError = result.error || "Failed to save product";
        } catch {
          if (mode === "create" && productCode) {
            try {
              const checkRes = await fetch(
                `/api/products?search=${encodeURIComponent(productCode)}&limit=1`,
                { cache: "no-store" }
              );
              const checkData = await checkRes.json();
              if (
                checkData.success &&
                checkData.data?.some(
                  (p: { productCode: string }) => p.productCode === productCode
                )
              ) {
                result = { success: true, data: checkData.data[0] };
                break;
              }
            } catch {
              // Check failed — continue with retry
            }
          }
          lastError = "Network error — retrying...";
        }

        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        }
      }

      if (result?.success) {
        setIsSuccess(true);
        toast.success(
          mode === "edit"
            ? "Product updated successfully"
            : isBar
              ? `Bar product created (${formatBarWeightLabel(defaultBarWeight?.weightGrams || 0)} default)`
              : "Product created successfully"
        );
        setTimeout(() => {
          router.push("/admin/products");
          router.refresh();
        }, 1500);
      } else {
        toast.error(lastError || result?.error || "Failed to save product");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stable no-op for bar charges (composition edits happen on Bar Details step)
  const noopCompositionChange = useCallback((_data: CompositionData) => {}, []);

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
          {
            label: mode === "edit"
              ? isBar
                ? "Edit Bar"
                : "Edit Product"
              : isBar
                ? "Add Bar"
                : "Add Product",
          },
        ]}
      />

      <div>
        <h1 className="text-2xl font-heading font-bold text-charcoal-700">
          {mode === "edit"
            ? isBar
              ? "Edit Bar Product"
              : "Edit Product"
            : isBar
              ? "Add New Bar"
              : "Add New Product"}
        </h1>
        <p className="text-sm text-charcoal-400 mt-1">
          {isBar
            ? "Create a bullion bar with weight options, purity, dimensions, and origin details"
            : mode === "edit"
              ? "Update product details, composition, and pricing"
              : "Create a new product with detailed composition and pricing"}
        </p>
      </div>

      <Stepper steps={STEPS} currentStep={currentStep} />

      <AnimatePresence mode="wait">
        <motion.div
          key={`${isBar ? "bar" : "jewelry"}-${currentStep}`}
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
          {currentStep === 1 && isBar && (
            <StepBarDetails
              data={formData.barSpecs}
              onChange={updateBarSpecs}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {currentStep === 1 && !isBar && (
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
              compositionData={activeComposition}
              onCompositionChange={isBar ? noopCompositionChange : updateComposition}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {currentStep === 3 && (
            <StepImages
              data={formData.images}
              onChange={updateImages}
              colors={isBar ? [] : formData.basic.colors}
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
              isBar={isBar}
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
      displayVariants: [],
      displayGemstones: [],
    },
    barSpecs: getDefaultBarSpecs(),
    charges: {
      makingCharges: { type: "fixed", value: 0 },
      gstPercentage: 3,
      otherCharges: [],
      chargeBasedOnVariant: undefined,
    },
    images: {
      images: [],
      colorImages: [],
      videos: [],
      isNewArrival: false,
      isOutOfStock: false,
      isFeatured: false,
      isActive: true,
      hallmarkCertified: false,
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
  const rawBar = (data.barSpecs as Record<string, unknown>) || null;
  const firstMetal = metalComposition[0];

  const metalRef = firstMetal?.metal as Record<string, unknown> | string | null | undefined;
  const metalId =
    typeof metalRef === "object" && metalRef !== null
      ? (metalRef._id as string) || ""
      : (metalRef as string) || "";
  const metalName =
    typeof metalRef === "object" && metalRef !== null
      ? (metalRef.name as string) || ""
      : "";

  const weightOptionsFromBar =
    ((rawBar?.weightOptions as Array<Record<string, unknown>>) || []).map(
      (w, i) => ({
        weightGrams: (w.weightGrams as number) || 0,
        sku: (w.sku as string) || "",
        dimension: (w.dimension as string) || "",
        netWeight: (w.netWeight as number) || (w.weightGrams as number) || 0,
        isDefault: (w.isDefault as boolean) ?? i === 0,
        isOutOfStock: (w.isOutOfStock as boolean) ?? false,
      })
    );

  const barSpecs: BarSpecsData = {
    shape: (rawBar?.shape as string) || "Rectangular Ingot",
    purity: (rawBar?.purity as number) || 999.9,
    countryOfOrigin: (rawBar?.countryOfOrigin as string) || "India",
    importer: (rawBar?.importer as string) || "NA",
    mintBrand: (rawBar?.mintBrand as string) || "",
    weightOptions:
      weightOptionsFromBar.length > 0
        ? weightOptionsFromBar
        : getDefaultBarSpecs().weightOptions,
    metalId,
    metalName,
    variantId: (firstMetal?.variantId as string) || "",
    variantName: (firstMetal?.variantName as string) || "",
    pricePerGram: (firstMetal?.pricePerGram as number) || 0,
  };

  if (weightOptionsFromBar.length === 0 && firstMetal?.weightInGrams) {
    barSpecs.weightOptions = [
      {
        weightGrams: firstMetal.weightInGrams as number,
        sku: (data.productCode as string) || "",
        dimension: "",
        netWeight: (data.netWeight as number) || (firstMetal.weightInGrams as number),
        isDefault: true,
        isOutOfStock: false,
      },
    ];
  }

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
          const mRef = m.metal as Record<string, unknown> | string | null;
          const mWastage = (m.wastageCharges as Record<string, unknown>) || null;
          const mId =
            typeof mRef === "object" && mRef !== null
              ? (mRef._id as string) || ""
              : (mRef as string) || "";
          return {
            metalId: mId,
            metalName:
              typeof mRef === "object" && mRef !== null
                ? (mRef.name as string) || ""
                : "",
            variantId: (m.variantId as string) || "",
            variantName: (m.variantName as string) || "",
            weightInGrams: (m.weightInGrams as number) || 0,
            pricePerGram: (m.pricePerGram as number) || 0,
            wastageCharges: mWastage
              ? {
                  type:
                    (mWastage.type as "fixed" | "percentage" | "per_gram") ||
                    "percentage",
                  value: (mWastage.value as number) || 0,
                }
              : { type: "percentage" as const, value: 0 },
          };
        })
        .filter((m) => m.metalId !== ""),
      gemstones: gemstoneComposition
        .map((g) => {
          const gemRef = g.gemstone as Record<string, unknown> | string | null;
          const gWastage = (g.wastageCharges as Record<string, unknown>) || null;
          const gemstoneId =
            typeof gemRef === "object" && gemRef !== null
              ? (gemRef._id as string) || ""
              : (gemRef as string) || "";
          return {
            gemstoneId,
            gemstoneName:
              typeof gemRef === "object" && gemRef !== null
                ? (gemRef.name as string) || ""
                : "",
            variantId: (g.variantId as string) || "",
            variantName: (g.variantName as string) || "",
            weightInCarats: (g.weightInCarats as number) || 0,
            quantity: (g.quantity as number) || 1,
            pricePerCarat: (g.pricePerCarat as number) || 0,
            wastageCharges: gWastage
              ? {
                  type:
                    (gWastage.type as "fixed" | "percentage" | "per_gram") ||
                    "percentage",
                  value: (gWastage.value as number) || 0,
                }
              : { type: "percentage" as const, value: 0 },
          };
        })
        .filter((g) => g.gemstoneId !== ""),
      displayVariants: (
        (data.displayVariants as Array<Record<string, unknown>>) || []
      ).map((dv) => ({
        metal:
          (typeof dv.metal === "object" && dv.metal !== null
            ? ((dv.metal as Record<string, unknown>)._id as string)
            : (dv.metal as string)) || "",
        variants: (
          (dv.variants as Array<Record<string, unknown>>) ||
          (dv.variantIds as string[] || []).map((vid: string) => ({
            variantId: String(vid),
            weightInGrams: 0,
          }))
        ).map((v: Record<string, unknown>) => ({
          variantId: String(v.variantId || ""),
          weightInGrams: (v.weightInGrams as number) || 0,
        })),
      })),
      displayGemstones: (
        (data.displayGemstones as Array<Record<string, unknown>>) || []
      ).map((dg) => ({
        gemstone:
          (typeof dg.gemstone === "object" && dg.gemstone !== null
            ? ((dg.gemstone as Record<string, unknown>)._id as string)
            : (dg.gemstone as string)) || "",
        variantId: (dg.variantId as string) || "",
        variantName: (dg.variantName as string) || "",
        weightInCarats: (dg.weightInCarats as number) || 0,
        quantity: (dg.quantity as number) || 1,
        pricePerCarat: (dg.pricePerCarat as number) || 0,
      })),
    },
    barSpecs,
    charges: {
      makingCharges: {
        type:
          (makingCharges.type as "fixed" | "percentage" | "per_gram") || "fixed",
        value: (makingCharges.value as number) || 0,
      },
      gstPercentage: (data.gstPercentage as number) ?? 3,
      otherCharges: otherCharges.map((c) => ({
        name: (c.name as string) || "",
        amount: (c.amount as number) || 0,
      })),
      chargeBasedOnVariant: data.chargeBasedOnVariant
        ? {
            metalId:
              ((data.chargeBasedOnVariant as Record<string, unknown>)
                .metalId as string) || "",
            variantId:
              ((data.chargeBasedOnVariant as Record<string, unknown>)
                .variantId as string) || "",
            variantName:
              ((data.chargeBasedOnVariant as Record<string, unknown>)
                .variantName as string) || "",
          }
        : undefined,
    },
    images: {
      images: (data.images as string[]) || [],
      colorImages: (
        (data.colorImages as Array<Record<string, unknown>>) || []
      ).map((ci) => ({
        color: (ci.color as string) || "",
        images: (ci.images as string[]) || [],
      })),
      videos: ((data.videos as Array<Record<string, unknown>>) || []).map((v) => ({
        type: (v.type as "upload" | "external") || "external",
        url: (v.url as string) || "",
        thumbnailUrl: (v.thumbnailUrl as string) || "",
      })),
      isNewArrival: (data.isNewArrival as boolean) ?? false,
      isOutOfStock: (data.isOutOfStock as boolean) ?? false,
      isFeatured: (data.isFeatured as boolean) ?? false,
      isActive: (data.isActive as boolean) ?? true,
      hallmarkCertified: (data.hallmarkCertified as boolean) ?? false,
      metaTitle: (data.metaTitle as string) || "",
      metaDescription: (data.metaDescription as string) || "",
    },
  };
}
