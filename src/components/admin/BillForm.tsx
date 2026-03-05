"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  User,
  CreditCard,
  FileText,
  Percent,
  BadgeIndianRupee,
  CheckCircle2,
  Package,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  AlertTriangle,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PriceDisplay } from "@/components/ui/PriceDisplay";
import { Skeleton } from "@/components/ui/Skeleton";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { formatCurrency, debounce } from "@/lib/utils";
import { fadeIn } from "@/lib/animations";
import { PAYMENT_MODES } from "@/constants";

const billFormSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  customerPhone: z.string().min(10, "Valid phone number required"),
  customerEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  customerAddress: z.string().optional().default(""),
  discountType: z.enum(["fixed", "percentage"]).default("fixed"),
  discountValue: z.number().min(0).default(0),
  amountPaid: z.number().min(0).default(0),
  paymentMode: z
    .enum(["cash", "card", "upi", "bank_transfer"])
    .default("cash"),
  notes: z.string().optional().default(""),
});

type BillFormValues = z.output<typeof billFormSchema>;

interface ProductSearchResult {
  _id: string;
  name: string;
  productCode: string;
  totalPrice: number;
  thumbnailImage: string;
  category?: { name: string } | null;
  sizes?: string[];
  colors?: string[];
}

interface BillItem {
  lineId: string; // unique per line (allows same product with different sizes)
  product: ProductSearchResult;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

interface ExistingCustomer {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalDebt: number;
  totalPurchases: number;
  billCount: number;
}

export default function BillForm() {
  const router = useRouter();

  // Product search
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState<ProductSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Bill items (cart)
  const [billItems, setBillItems] = useState<BillItem[]>([]);

  // Customer search & linking
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<ExistingCustomer[]>([]);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [linkedCustomer, setLinkedCustomer] = useState<ExistingCustomer | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Payment mode
  const [payFullAmount, setPayFullAmount] = useState(true);

  // Discount
  const [discountAmount, setDiscountAmount] = useState(0);

  // Submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdBillId, setCreatedBillId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BillFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(billFormSchema) as any,
    defaultValues: {
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      customerAddress: "",
      discountType: "fixed",
      discountValue: 0,
      amountPaid: 0,
      paymentMode: "cash",
      notes: "",
    },
  });

  const discountType = watch("discountType");
  const discountValue = watch("discountValue");
  const amountPaid = watch("amountPaid");

  // Total across all items
  const itemsTotal = billItems.reduce(
    (sum, item) => sum + item.product.totalPrice * item.quantity,
    0
  );

  // Recalculate discount whenever inputs change
  useEffect(() => {
    if (!billItems.length || !discountValue) {
      setDiscountAmount(0);
      return;
    }
    if (discountType === "percentage") {
      setDiscountAmount(
        Math.round(itemsTotal * (discountValue / 100) * 100) / 100
      );
    } else {
      setDiscountAmount(discountValue);
    }
  }, [discountType, discountValue, itemsTotal, billItems.length]);

  const finalAmount = Math.max(0, itemsTotal - discountAmount);

  // Auto-set amountPaid when payFullAmount is true
  useEffect(() => {
    if (payFullAmount) {
      setValue("amountPaid", Math.round(finalAmount * 100) / 100);
    }
  }, [payFullAmount, finalAmount, setValue]);

  // Calculate debt impact
  const existingDebt = linkedCustomer?.totalDebt || 0;
  const unpaidFromBill = Math.max(0, finalAmount - (amountPaid || 0));
  const newTotalDebt = existingDebt + unpaidFromBill;

  // Product search with retry
  const searchProducts = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setProductResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);

    // Retry up to 2 times on failure
    for (let attempt = 0; attempt <= 2; attempt++) {
      try {
        const ts = Date.now();
        const res = await fetch(
          `/api/products?search=${encodeURIComponent(query)}&limit=8&_t=${ts}`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.success) {
          setProductResults(data.data || []);
          setIsSearching(false);
          return;
        }
        throw new Error(data.error || "Search failed");
      } catch {
        if (attempt === 2) {
          setProductResults([]);
          toast.error("Failed to search products. Please try again.");
        } else {
          await new Promise((r) => setTimeout(r, 500));
        }
      }
    }
    setIsSearching(false);
  }, []);

  // Debounced product search
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((query: unknown) => {
      searchProducts(query as string);
    }, 300),
    [searchProducts]
  );

  useEffect(() => {
    debouncedSearch(productSearch);
  }, [productSearch, debouncedSearch]);

  // Customer search
  const searchCustomers = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setCustomerResults([]);
      setIsSearchingCustomer(false);
      return;
    }
    setIsSearchingCustomer(true);
    try {
      const res = await fetch(
        `/api/customers?search=${encodeURIComponent(query)}&limit=5`
      );
      const data = await res.json();
      if (data.success) {
        setCustomerResults(data.data || []);
      }
    } catch {
      setCustomerResults([]);
    }
    setIsSearchingCustomer(false);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedCustomerSearch = useCallback(
    debounce((query: unknown) => {
      searchCustomers(query as string);
    }, 300),
    [searchCustomers]
  );

  useEffect(() => {
    if (customerSearch && !linkedCustomer) {
      setShowCustomerDropdown(true);
      debouncedCustomerSearch(customerSearch);
    } else {
      setShowCustomerDropdown(false);
    }
  }, [customerSearch, debouncedCustomerSearch, linkedCustomer]);

  // Auto-lookup customer when phone is typed
  const watchedPhone = watch("customerPhone");
  useEffect(() => {
    if (watchedPhone && watchedPhone.length >= 10 && !linkedCustomer) {
      const lookupByPhone = async () => {
        try {
          const res = await fetch(
            `/api/customers?phone=${encodeURIComponent(watchedPhone)}`
          );
          const data = await res.json();
          if (data.success && data.data && data.data.length > 0) {
            const found = data.data[0];
            linkCustomer(found);
          }
        } catch {
          // Silently fail
        }
      };
      lookupByPhone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedPhone]);

  /** Link an existing customer to this bill */
  const linkCustomer = (customer: ExistingCustomer) => {
    setLinkedCustomer(customer);
    setValue("customerName", customer.name);
    setValue("customerPhone", customer.phone);
    setValue("customerEmail", customer.email || "");
    setValue("customerAddress", customer.address || "");
    setCustomerSearch("");
    setCustomerResults([]);
    setShowCustomerDropdown(false);
  };

  /** Unlink customer */
  const unlinkCustomer = () => {
    setLinkedCustomer(null);
  };

  /** Add product to cart — always creates new line if product has size/color variants */
  const addProduct = (product: ProductSearchResult) => {
    const hasVariants = (product.sizes?.length ?? 0) > 0 || (product.colors?.length ?? 0) > 0;
    setBillItems((prev) => {
      if (!hasVariants) {
        const existing = prev.find((i) => i.product._id === product._id);
        if (existing) {
          return prev.map((i) =>
            i.product._id === product._id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          );
        }
      }
      return [...prev, { lineId: `${product._id}-${Date.now()}`, product, quantity: 1 }];
    });
    setProductSearch("");
    setProductResults([]);
  };

  /** Remove item from cart */
  const removeItem = (lineId: string) => {
    setBillItems((prev) => prev.filter((i) => i.lineId !== lineId));
    setValue("discountValue", 0);
  };

  /** Change quantity (+1 or -1; removes item when qty reaches 0) */
  const updateQuantity = (lineId: string, delta: number) => {
    setBillItems((prev) =>
      prev
        .map((i) =>
          i.lineId === lineId
            ? { ...i, quantity: Math.max(0, i.quantity + delta) }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  /** Update selectedSize or selectedColor for a bill item */
  const updateItemOption = (
    lineId: string,
    key: "selectedSize" | "selectedColor",
    value: string
  ) => {
    setBillItems((prev) =>
      prev.map((i) => (i.lineId === lineId ? { ...i, [key]: value } : i))
    );
  };

  const onSubmit = async (values: BillFormValues) => {
    if (!billItems.length) {
      toast.error("Please add at least one product");
      return;
    }

    // Validate amountPaid doesn't exceed finalAmount
    const paid = values.amountPaid || 0;
    if (paid > finalAmount) {
      toast.error("Amount paid cannot exceed the final amount");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        items: billItems.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor,
        })),
        customer: {
          name: values.customerName,
          phone: values.customerPhone,
          email: values.customerEmail || undefined,
          address: values.customerAddress || undefined,
        },
        customerRef: linkedCustomer?._id || undefined,
        discount:
          values.discountValue > 0
            ? {
                type: values.discountType,
                value: values.discountValue,
                amount: discountAmount,
              }
            : undefined,
        finalAmount: Math.round(finalAmount * 100) / 100,
        amountPaid: Math.round(paid * 100) / 100,
        paymentMode: values.paymentMode,
        notes: values.notes,
      };

      // Retry up to 2 times on failure
      let lastError = "Failed to create bill";
      for (let attempt = 0; attempt <= 2; attempt++) {
        try {
          const res = await fetch("/api/bills", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          const data = await res.json();
          if (data.success) {
            setCreatedBillId(data.data._id);
            setIsSuccess(true);
            toast.success(data.message || "Bill created successfully!");
            return;
          }
          lastError = data.error || "Failed to create bill";

          // Don't retry on validation errors (4xx)
          if (res.status >= 400 && res.status < 500) break;
        } catch {
          lastError = "Network error — please check your connection";
          if (attempt < 2) {
            await new Promise((r) => setTimeout(r, 800));
          }
        }
      }

      toast.error(lastError);
    } catch {
      toast.error("Failed to create bill");
    } finally {
      setIsSubmitting(false);
    }
  };

  // â”€â”€ Success Screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (isSuccess && createdBillId) {
    return (
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/admin/dashboard" },
            { label: "Bills", href: "/admin/bills" },
            { label: "New Bill" },
          ]}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 10, delay: 0.1 }}
            className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6"
          >
            <CheckCircle2 className="text-success" size={40} />
          </motion.div>
          <h2 className="text-xl font-heading font-bold text-charcoal-700">
            Bill Created Successfully!
          </h2>
          <p className="text-charcoal-400 mt-2">
            {billItems.length > 1
              ? `${billItems.length} items â€” bill is ready to download.`
              : "Your bill has been generated."}
          </p>
          <div className="flex gap-3 mt-6 flex-wrap justify-center">
            <a
              href={`/api/bills/${createdBillId}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="primary">
                <FileText size={16} />
                Download PDF
              </Button>
            </a>
            <Button
              variant="outline"
              onClick={() => router.push("/admin/bills")}
            >
              View All Bills
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setIsSuccess(false);
                setCreatedBillId(null);
                setBillItems([]);
              }}
            >
              Create Another
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // â”€â”€ Main Form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Bills", href: "/admin/bills" },
          { label: "New Bill" },
        ]}
      />

      <div>
        <h1 className="text-2xl font-heading font-bold text-charcoal-700">
          Generate Bill
        </h1>
        <p className="text-sm text-charcoal-400 mt-1">
          Add one or more products, then fill in customer details
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-24 lg:pb-0"
      >
        {/* â”€â”€ Left column â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="lg:col-span-2 space-y-6">

          {/* Product Search & Items Cart */}
          <motion.div variants={fadeIn} initial="initial" animate="animate">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart size={18} className="text-gold-500" />
                  Bill Items
                  {billItems.length > 0 && (
                    <Badge variant="default" size="sm" className="ml-auto">
                      {billItems.length} item{billItems.length !== 1 ? "s" : ""}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <div className="px-4 pb-4 md:px-6 md:pb-6 space-y-4">

                {/* Search input */}
                <div className="relative">
                  <div className="relative">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400"
                    />
                    <input
                      type="text"
                      placeholder="Search & add products by name or codeâ€¦"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full h-11 pl-9 pr-4 rounded-xl border border-charcoal-200 bg-white text-sm text-charcoal-700 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                    />
                  </div>

                  {/* Dropdown results */}
                  {(productResults.length > 0 || isSearching) && (
                    <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-charcoal-100 rounded-xl shadow-lg max-h-72 overflow-y-auto">
                      {isSearching ? (
                        <div className="p-4 space-y-3">
                          {[0, 1, 2].map((i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                          ))}
                        </div>
                      ) : (
                        productResults.map((product) => (
                          <button
                            key={product._id}
                            type="button"
                            onClick={() => addProduct(product)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gold-50 transition-colors border-b border-charcoal-50 last:border-0"
                          >
                            {product.thumbnailImage && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={product.thumbnailImage}
                                alt=""
                                className="w-10 h-10 rounded-lg object-cover shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-charcoal-700 truncate">
                                {product.name}
                              </p>
                              <p className="text-xs font-mono text-charcoal-400">
                                {product.productCode}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <PriceDisplay amount={product.totalPrice} size="sm" />
                              <span className="text-xs text-gold-600 font-semibold border border-gold-300 rounded-full px-2 py-0.5">
                                + Add
                              </span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Items list */}
                <AnimatePresence mode="popLayout">
                  {billItems.length > 0 ? (
                    <div className="space-y-2">
                      {billItems.map((item, index) => (
                        <motion.div
                          key={item.lineId}
                          layout
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ delay: index * 0.04 }}
                          className="flex items-center gap-3 rounded-xl border border-charcoal-100 bg-charcoal-50/40 p-3"
                        >
                          {item.product.thumbnailImage && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.product.thumbnailImage}
                              alt=""
                              className="w-12 h-12 rounded-lg object-cover shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-charcoal-700 truncate">
                              {item.product.name}
                            </p>
                            <p className="text-xs font-mono text-charcoal-400">
                              {item.product.productCode}
                            </p>

                            {/* Inline size selector */}
                            {(item.product.sizes?.length ?? 0) > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                <span className="text-xs text-charcoal-400 self-center">Size:</span>
                                {item.product.sizes!.map((s) => (
                                  <button
                                    key={s}
                                    type="button"
                                    onClick={() => updateItemOption(item.lineId, "selectedSize", s)}
                                    className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                                      item.selectedSize === s
                                        ? "bg-charcoal-700 text-white border-charcoal-700"
                                        : "border-charcoal-200 text-charcoal-500 hover:border-charcoal-400"
                                    }`}
                                  >
                                    {s}
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Inline color selector */}
                            {(item.product.colors?.length ?? 0) > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                <span className="text-xs text-charcoal-400 self-center">Color:</span>
                                {item.product.colors!.map((c) => (
                                  <button
                                    key={c}
                                    type="button"
                                    onClick={() => updateItemOption(item.lineId, "selectedColor", c)}
                                    className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                                      item.selectedColor === c
                                        ? "bg-charcoal-700 text-white border-charcoal-700"
                                        : "border-charcoal-200 text-charcoal-500 hover:border-charcoal-400"
                                    }`}
                                  >
                                    {c}
                                  </button>
                                ))}
                              </div>
                            )}

                            <p className="text-xs text-charcoal-500 mt-0.5">
                              {formatCurrency(item.product.totalPrice)} ×{" "}
                              {item.quantity} ={" "}
                              <span className="font-semibold text-charcoal-700">
                                {formatCurrency(
                                  item.product.totalPrice * item.quantity
                                )}
                              </span>
                            </p>
                          </div>

                          {/* Qty controls */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.lineId, -1)}
                              className="w-7 h-7 rounded-lg border border-charcoal-200 flex items-center justify-center hover:bg-charcoal-100 transition-colors"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-8 text-center text-sm font-bold text-charcoal-700">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.lineId, 1)}
                              className="w-7 h-7 rounded-lg border border-charcoal-200 flex items-center justify-center hover:bg-charcoal-100 transition-colors"
                            >
                              <Plus size={12} />
                            </button>
                          </div>

                          {/* Remove */}
                          <button
                            type="button"
                            onClick={() => removeItem(item.lineId)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors ml-1 shrink-0"
                          >
                            <Trash2 size={14} />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-charcoal-100 rounded-xl"
                    >
                      <Package size={32} className="text-charcoal-200 mb-3" />
                      <p className="text-sm text-charcoal-400">
                        No items added yet
                      </p>
                      <p className="text-xs text-charcoal-300 mt-1">
                        Search above to add products
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Card>
          </motion.div>

          {/* Customer Details */}
          <motion.div
            variants={fadeIn}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User size={18} className="text-gold-500" />
                  Customer Details
                </CardTitle>
              </CardHeader>
              <div className="px-4 pb-4 md:px-6 md:pb-6 space-y-4">
                {/* Customer Search */}
                <div className="relative">
                  <label className="block text-sm font-medium text-charcoal-600 mb-1">
                    Search Existing Customer
                  </label>
                  <div className="relative">
                    <Users
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400"
                    />
                    <input
                      type="text"
                      placeholder="Search by name or phone to link existing customer…"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      disabled={!!linkedCustomer}
                      className="w-full h-11 pl-9 pr-4 rounded-xl border border-charcoal-200 bg-white text-sm text-charcoal-700 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Customer search dropdown */}
                  {showCustomerDropdown &&
                    (customerResults.length > 0 || isSearchingCustomer) && (
                      <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-charcoal-100 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                        {isSearchingCustomer ? (
                          <div className="p-4 space-y-2">
                            {[0, 1].map((i) => (
                              <Skeleton key={i} className="h-12 w-full" />
                            ))}
                          </div>
                        ) : (
                          customerResults.map((c) => (
                            <button
                              key={c._id}
                              type="button"
                              onClick={() => linkCustomer(c)}
                              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gold-50 transition-colors border-b border-charcoal-50 last:border-0"
                            >
                              <div className="w-9 h-9 rounded-full bg-gold-50 flex items-center justify-center shrink-0">
                                <User size={14} className="text-gold-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-charcoal-700 truncate">
                                  {c.name}
                                </p>
                                <p className="text-xs text-charcoal-400">
                                  {c.phone}
                                </p>
                              </div>
                              {c.totalDebt > 0 && (
                                <Badge variant="rose" size="sm">
                                  Debt: {formatCurrency(c.totalDebt)}
                                </Badge>
                              )}
                              <span className="text-xs text-gold-600 font-semibold border border-gold-300 rounded-full px-2 py-0.5">
                                Select
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                </div>

                {/* Linked Customer Banner */}
                {linkedCustomer && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gold-200 bg-gold-50/50"
                  >
                    <div className="w-10 h-10 rounded-full bg-gold-100 flex items-center justify-center shrink-0">
                      <User size={16} className="text-gold-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-charcoal-700">
                        {linkedCustomer.name}{" "}
                        <span className="text-xs font-normal text-charcoal-400">
                          (existing customer)
                        </span>
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-charcoal-500">
                          {linkedCustomer.phone}
                        </span>
                        <span className="text-xs text-charcoal-400">
                          {linkedCustomer.billCount} bills
                        </span>
                        {linkedCustomer.totalDebt > 0 && (
                          <span className="text-xs font-bold text-red-600 flex items-center gap-0.5">
                            <AlertTriangle size={10} />
                            Debt: {formatCurrency(linkedCustomer.totalDebt)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={unlinkCustomer}
                      className="shrink-0 text-charcoal-400 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                      Unlink
                    </Button>
                  </motion.div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Customer Name *"
                    placeholder="Enter customer name"
                    error={errors.customerName?.message}
                    {...register("customerName")}
                  />
                  <Input
                    label="Phone Number *"
                    placeholder="10-digit mobile number"
                    error={errors.customerPhone?.message}
                    {...register("customerPhone")}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Email"
                    placeholder="customer@email.com"
                    type="email"
                    error={errors.customerEmail?.message}
                    {...register("customerEmail")}
                  />
                  <Input
                    label="Address"
                    placeholder="Customer address"
                    {...register("customerAddress")}
                  />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Payment & Notes */}
          <motion.div
            variants={fadeIn}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard size={18} className="text-gold-500" />
                  Payment & Notes
                </CardTitle>
              </CardHeader>
              <div className="px-4 pb-4 md:px-6 md:pb-6 space-y-4">
                <Select
                  label="Payment Mode"
                  options={[...PAYMENT_MODES]}
                  {...register("paymentMode")}
                />

                {/* Payment amount toggle */}
                {billItems.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={payFullAmount}
                          onChange={() => {
                            setPayFullAmount(true);
                            setValue(
                              "amountPaid",
                              Math.round(finalAmount * 100) / 100
                            );
                          }}
                          className="w-4 h-4 text-gold-500 accent-gold-500"
                        />
                        <span className="text-sm text-charcoal-700">
                          Full Payment
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={!payFullAmount}
                          onChange={() => {
                            setPayFullAmount(false);
                            setValue("amountPaid", 0);
                          }}
                          className="w-4 h-4 text-gold-500 accent-gold-500"
                        />
                        <span className="text-sm text-charcoal-700">
                          Partial / No Payment
                        </span>
                      </label>
                    </div>

                    {!payFullAmount && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <Input
                          label="Amount Paid"
                          type="number"
                          step="0.01"
                          min="0"
                          max={finalAmount}
                          placeholder="0"
                          {...register("amountPaid", {
                            valueAsNumber: true,
                          })}
                        />
                        {unpaidFromBill > 0 && (
                          <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200">
                            <p className="text-xs text-amber-800 flex items-center gap-1">
                              <AlertTriangle size={12} />
                              <span className="font-semibold">
                                {formatCurrency(unpaidFromBill)}
                              </span>{" "}
                              will be added to customer&apos;s debt
                            </p>
                            {existingDebt > 0 && (
                              <p className="text-xs text-amber-700 mt-0.5 ml-4">
                                Existing debt: {formatCurrency(existingDebt)} →
                                New total: {formatCurrency(newTotalDebt)}
                              </p>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                )}

                <Textarea
                  label="Notes"
                  placeholder="Any additional notes…"
                  rows={3}
                  {...register("notes")}
                />
              </div>
            </Card>
          </motion.div>
        </div>

        {/* â”€â”€ Right column: Price summary â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="space-y-6">
          <div className="sticky top-24">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BadgeIndianRupee size={18} className="text-gold-500" />
                  Price Summary
                </CardTitle>
              </CardHeader>
              <div className="px-4 pb-4 md:px-6 md:pb-6 space-y-4">
                {billItems.length > 0 ? (
                  <>
                    {/* Per-item breakdown */}
                    <div className="space-y-2">
                      {billItems.map((item) => (
                        <div
                          key={item.product._id}
                          className="flex items-start justify-between text-sm gap-2"
                        >
                          <span
                            className="text-charcoal-500 truncate flex-1"
                            title={item.product.name}
                          >
                            {item.product.name}
                            {item.quantity > 1 && (
                              <span className="text-charcoal-400 ml-1">
                                Ã—{item.quantity}
                              </span>
                            )}
                          </span>
                          <span className="font-mono text-charcoal-700 shrink-0">
                            {formatCurrency(
                              item.product.totalPrice * item.quantity
                            )}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Items subtotal */}
                    <div className="flex items-center justify-between text-sm border-t border-charcoal-100 pt-3">
                      <span className="text-charcoal-600 font-medium">
                        Items Total
                      </span>
                      <span className="font-mono font-medium text-charcoal-700">
                        {formatCurrency(itemsTotal)}
                      </span>
                    </div>

                    {/* Discount */}
                    <div className="space-y-2 pt-1 border-t border-charcoal-100">
                      <p className="text-sm font-medium text-charcoal-600 flex items-center gap-1">
                        <Percent size={14} />
                        Discount (Optional)
                      </p>
                      <div className="flex gap-2">
                        <Select
                          options={[
                            { value: "fixed", label: "â‚¹ Fixed" },
                            { value: "percentage", label: "% Percent" },
                          ]}
                          {...register("discountType")}
                          className="w-28"
                        />
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0"
                          {...register("discountValue", {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                      {discountAmount > 0 && (
                        <p className="text-xs text-success font-mono">
                          - {formatCurrency(discountAmount)} discount
                        </p>
                      )}
                    </div>

                    {/* Final Amount */}
                    <div className="pt-3 border-t-2 border-gold-200">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-heading font-bold text-charcoal-700">
                          Final Amount
                        </span>
                        <PriceDisplay amount={finalAmount} size="lg" />
                      </div>
                    </div>

                    {/* Payment & Debt Summary */}
                    {billItems.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-charcoal-500">Amount Paid</span>
                          <span className="font-mono text-green-600 font-medium">
                            {formatCurrency(amountPaid || 0)}
                          </span>
                        </div>
                        {unpaidFromBill > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-charcoal-500 flex items-center gap-1">
                              <AlertTriangle
                                size={12}
                                className="text-amber-500"
                              />
                              Unpaid (→ Debt)
                            </span>
                            <span className="font-mono text-red-600 font-medium">
                              {formatCurrency(unpaidFromBill)}
                            </span>
                          </div>
                        )}
                        {existingDebt > 0 && (
                          <>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-charcoal-500">
                                Existing Debt
                              </span>
                              <span className="font-mono text-red-500">
                                {formatCurrency(existingDebt)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm border-t border-charcoal-100 pt-2">
                              <span className="text-charcoal-700 font-semibold">
                                New Total Debt
                              </span>
                              <span className="font-mono text-red-600 font-bold">
                                {formatCurrency(newTotalDebt)}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    <Button
                      type="submit"
                      variant="primary"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="animate-spin">â³</span>
                          Generatingâ€¦
                        </>
                      ) : (
                        <>
                          <FileText size={16} />
                          Generate Bill
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8 text-sm text-charcoal-400">
                    Add products to see price summary
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </form>

      {/* Mobile sticky submit bar — always visible above mobile nav */}
      {billItems.length > 0 && (
        <div className="fixed bottom-17 left-0 right-0 bg-white border-t border-charcoal-200 px-4 py-3 z-30 lg:hidden shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] text-charcoal-400 leading-none">Final Amount</p>
              <PriceDisplay amount={finalAmount} size="lg" />
              {unpaidFromBill > 0 && (
                <p className="text-[10px] text-red-500 flex items-center gap-0.5 mt-0.5">
                  <AlertTriangle size={10} />
                  {formatCurrency(unpaidFromBill)} debt
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="primary"
              disabled={isSubmitting}
              onClick={handleSubmit(onSubmit)}
              className="shrink-0"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Generating…
                </>
              ) : (
                <>
                  <FileText size={16} />
                  Generate Bill
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
