"use client";

import React, { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { trackContact } from "@/lib/analytics";
import { useSession } from "next-auth/react";
import {
  ShoppingBag,
  CreditCard,
  Truck,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/components/providers/CartProvider";
import { formatCurrency, cn } from "@/lib/utils";
import { Breadcrumb } from "@/components/shared/Breadcrumb";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
  "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal",
];

type PaymentMethod = "razorpay";

interface ShippingForm {
  fullName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string;
}

interface OrderResult {
  orderNumber: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
    };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function CheckoutClient() {
  const { data: session } = useSession();
  const { items, subtotal, clearCart } = useCart();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);

  const [shipping, setShipping] = useState<ShippingForm>({
    fullName: "",
    phone: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
  });

  useEffect(() => {
    if (session?.user?.accountType !== "customer") return;
    setShipping((s) => ({
      ...s,
      fullName: s.fullName || session.user?.name || "",
      email: s.email || session.user?.email || "",
    }));
    fetch("/api/account/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return;
        setShipping((s) => ({
          ...s,
          fullName: s.fullName || d.data.name || "",
          email: s.email || d.data.email || "",
          phone: s.phone || d.data.phone || "",
        }));
      })
      .catch(() => {});
  }, [session]);

  const paymentMethod: PaymentMethod = "razorpay";
  const [customerNotes, setCustomerNotes] = useState("");

  const shippingCharge = subtotal >= 50000 ? 0 : 500;
  const totalAmount = subtotal + shippingCharge;

  const validateShipping = (): boolean => {
    if (!shipping.fullName.trim()) {
      toast.error("Full name is required");
      return false;
    }
    if (!/^[6-9]\d{9}$/.test(shipping.phone.trim())) {
      toast.error("Enter a valid 10-digit Indian mobile number");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shipping.email.trim())) {
      toast.error("Valid email is required for order receipts");
      return false;
    }
    if (!shipping.addressLine1.trim()) {
      toast.error("Address is required");
      return false;
    }
    if (!shipping.city.trim()) {
      toast.error("City is required");
      return false;
    }
    if (!shipping.state) {
      toast.error("State is required");
      return false;
    }
    if (!/^\d{6}$/.test(shipping.pincode.trim())) {
      toast.error("Valid 6-digit pincode is required");
      return false;
    }
    return true;
  };

  const buildPayload = useCallback(
    () => ({
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        selectedSize: item.selectedSize,
        selectedColor: item.selectedColor,
        selectedMetalVariants: item.selectedMetalVariants,
        selectedGemstone: item.selectedGemstone,
      })),
      shippingAddress: shipping,
      paymentMethod,
      customerNotes,
    }),
    [items, shipping, paymentMethod, customerNotes]
  );

  const openRazorpayCheckout = async (data: {
    _id: string;
    orderNumber: string;
    totalAmount: number;
    razorpay: {
      keyId: string;
      orderId: string;
      amount: number;
      currency: string;
      name: string;
      description: string;
      prefill: { name: string; email?: string; contact: string };
    };
  }) => {
    const loaded = await loadRazorpayScript();
    if (!loaded || !window.Razorpay) {
      toast.error("Could not load payment gateway. Please try again.");
      return;
    }

    const rz = data.razorpay;

    await new Promise<void>((resolve) => {
      const rzp = new window.Razorpay!({
        key: rz.keyId,
        amount: rz.amount,
        currency: rz.currency,
        name: rz.name,
        description: rz.description,
        order_id: rz.orderId,
        prefill: rz.prefill,
        theme: { color: "#C9A227" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyRes = await fetch("/api/payments/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: data._id,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyData.success) {
              toast.error(verifyData.error || "Payment verification failed");
              resolve();
              return;
            }
            setOrderResult({
              orderNumber: verifyData.data.orderNumber,
              totalAmount: verifyData.data.totalAmount,
              paymentMethod: "razorpay",
              paymentStatus: verifyData.data.paymentStatus,
            });
            clearCart();
            setStep(3);
            toast.success("Payment successful!");
          } catch {
            toast.error("Payment received but verification failed. Contact support with your order number.");
          } finally {
            resolve();
          }
        },
        modal: {
          ondismiss: () => {
            toast.info(
              `Payment cancelled. Your order ${data.orderNumber} is saved — you can pay later via Track Order / WhatsApp.`
            );
            resolve();
          },
        },
      });

      rzp.on("payment.failed", () => {
        toast.error("Payment failed. Please try again.");
      });

      rzp.open();
    });
  };

  const handlePlaceOrder = async () => {
    if (!validateShipping()) {
      setStep(1);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || "Failed to place order");
        return;
      }

      if (!data.data.razorpay) {
        toast.error("Payment gateway unavailable. Please contact us on WhatsApp.");
        return;
      }

      await openRazorpayCheckout(data.data);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0 && !orderResult) {
    return (
      <div className="py-16 text-center">
        <div className="mx-auto max-w-md">
          <ShoppingBag className="mx-auto h-20 w-20 text-charcoal-200" />
          <h1 className="mt-6 text-2xl font-bold text-charcoal-700">
            Your cart is empty
          </h1>
          <p className="mt-2 text-charcoal-400">
            Add some beautiful jewelry to your cart before checking out.
          </p>
          <Link
            href="/categories"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gold-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gold-600"
          >
            Browse Collection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 md:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumb
          homeHref="/"
          items={[
            { label: "Home", href: "/" },
            { label: "Checkout" },
          ]}
        />

        <div className="mt-6 flex items-center justify-center gap-4">
          {[
            { num: 1, label: "Shipping", icon: Truck },
            { num: 2, label: "Payment", icon: CreditCard },
            { num: 3, label: "Confirmation", icon: CheckCircle2 },
          ].map(({ num, label, icon: Icon }) => (
            <div key={num} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                  step >= num
                    ? "bg-gold-500 text-white"
                    : "bg-charcoal-100 text-charcoal-400"
                )}
              >
                {step > num ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <span
                className={cn(
                  "hidden text-sm font-medium sm:inline",
                  step >= num ? "text-charcoal-700" : "text-charcoal-400"
                )}
              >
                {label}
              </span>
              {num < 3 && (
                <div
                  className={cn(
                    "h-px w-8 sm:w-16",
                    step > num ? "bg-gold-500" : "bg-charcoal-200"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {step === 1 && (
              <div className="rounded-xl border border-charcoal-100 bg-white p-6 shadow-card sm:p-8">
                <h2 className="text-xl font-semibold text-charcoal-700">
                  Shipping Address
                </h2>
                <p className="mt-1 text-sm text-charcoal-400">
                  Where should we deliver your order?
                  {session?.user?.accountType !== "customer" && (
                    <>
                      {" "}
                      <Link
                        href="/account/login?callbackUrl=/checkout"
                        className="font-medium text-gold-600 hover:underline"
                      >
                        Sign in
                      </Link>{" "}
                      to autofill your details.
                    </>
                  )}
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-charcoal-600">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={shipping.fullName}
                      onChange={(e) =>
                        setShipping({ ...shipping, fullName: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-charcoal-200 px-4 py-2.5 text-sm text-charcoal-700 placeholder:text-charcoal-300 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                      placeholder="Enter your full name"
                      autoComplete="name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-charcoal-600">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={shipping.phone}
                      onChange={(e) =>
                        setShipping({
                          ...shipping,
                          phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-charcoal-200 px-4 py-2.5 text-sm text-charcoal-700 placeholder:text-charcoal-300 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      autoComplete="tel"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-charcoal-600">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={shipping.email}
                      onChange={(e) =>
                        setShipping({ ...shipping, email: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-charcoal-200 px-4 py-2.5 text-sm text-charcoal-700 placeholder:text-charcoal-300 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                      placeholder="your@email.com"
                      autoComplete="email"
                    />
                    <p className="mt-1 text-xs text-charcoal-400">
                      Order receipt and updates are sent here
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-charcoal-600">
                      Address Line 1 *
                    </label>
                    <input
                      type="text"
                      value={shipping.addressLine1}
                      onChange={(e) =>
                        setShipping({
                          ...shipping,
                          addressLine1: e.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-charcoal-200 px-4 py-2.5 text-sm text-charcoal-700 placeholder:text-charcoal-300 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                      placeholder="House no, Building, Street"
                      autoComplete="address-line1"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-charcoal-600">
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      value={shipping.addressLine2}
                      onChange={(e) =>
                        setShipping({
                          ...shipping,
                          addressLine2: e.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-charcoal-200 px-4 py-2.5 text-sm text-charcoal-700 placeholder:text-charcoal-300 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                      placeholder="Area, Colony (optional)"
                      autoComplete="address-line2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-charcoal-600">
                      City *
                    </label>
                    <input
                      type="text"
                      value={shipping.city}
                      onChange={(e) =>
                        setShipping({ ...shipping, city: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-charcoal-200 px-4 py-2.5 text-sm text-charcoal-700 placeholder:text-charcoal-300 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                      placeholder="City"
                      autoComplete="address-level2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-charcoal-600">
                      State *
                    </label>
                    <select
                      value={shipping.state}
                      onChange={(e) =>
                        setShipping({ ...shipping, state: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-charcoal-200 px-4 py-2.5 text-sm text-charcoal-700 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-charcoal-600">
                      Pincode *
                    </label>
                    <input
                      type="text"
                      value={shipping.pincode}
                      onChange={(e) =>
                        setShipping({
                          ...shipping,
                          pincode: e.target.value.replace(/\D/g, "").slice(0, 6),
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-charcoal-200 px-4 py-2.5 text-sm text-charcoal-700 placeholder:text-charcoal-300 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                      placeholder="6-digit pincode"
                      maxLength={6}
                      autoComplete="postal-code"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-charcoal-600">
                      Landmark
                    </label>
                    <input
                      type="text"
                      value={shipping.landmark}
                      onChange={(e) =>
                        setShipping({ ...shipping, landmark: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-charcoal-200 px-4 py-2.5 text-sm text-charcoal-700 placeholder:text-charcoal-300 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                      placeholder="Near..."
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-charcoal-600">
                    Order Notes (optional)
                  </label>
                  <textarea
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-charcoal-200 px-4 py-2.5 text-sm text-charcoal-700 placeholder:text-charcoal-300 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                    placeholder="Any special instructions..."
                    maxLength={500}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (validateShipping()) setStep(2);
                  }}
                  className="mt-6 w-full rounded-lg bg-gold-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-gold-600"
                >
                  Continue to Payment
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="rounded-xl border border-charcoal-100 bg-white p-6 shadow-card sm:p-8">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="mb-4 flex items-center gap-1 text-sm text-charcoal-500 hover:text-charcoal-700"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Shipping
                </button>

                <h2 className="text-xl font-semibold text-charcoal-700">
                  Payment
                </h2>
                <p className="mt-1 text-sm text-charcoal-400">
                  Pay securely online with Razorpay.
                </p>

                <div className="mt-6">
                  <div className="w-full rounded-xl border-2 border-gold-500 bg-gold-50/50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-100 text-gold-600">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-charcoal-700">
                          Pay Online (Razorpay)
                        </p>
                        <p className="text-xs text-charcoal-400">
                          UPI, Cards, Netbanking, Wallets — instant confirmation
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2 rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    Prices are recalculated securely on our servers at checkout.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting}
                  className={cn(
                    "mt-6 w-full rounded-lg bg-gold-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-gold-600",
                    isSubmitting && "cursor-not-allowed opacity-60"
                  )}
                >
                  {isSubmitting
                    ? "Opening payment..."
                    : `Pay ${formatCurrency(totalAmount)}`}
                </button>
              </div>
            )}

            {step === 3 && orderResult && (
              <div className="rounded-xl border border-charcoal-100 bg-white p-6 text-center shadow-card sm:p-10">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="mt-4 text-2xl font-bold text-charcoal-700">
                  {orderResult.paymentMethod === "razorpay" &&
                  orderResult.paymentStatus === "verified"
                    ? "Payment Successful!"
                    : "Order Placed Successfully!"}
                </h2>
                <p className="mt-2 text-charcoal-400">
                  Thank you for your purchase. Your order is confirmed.
                </p>

                <div className="mx-auto mt-6 max-w-sm rounded-xl bg-charcoal-50 p-5">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-charcoal-400">Order Number</span>
                      <span className="font-mono font-semibold text-charcoal-700">
                        {orderResult.orderNumber}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-charcoal-400">Total Amount</span>
                      <span className="font-mono font-semibold text-gold-700">
                        {formatCurrency(orderResult.totalAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-charcoal-400">Payment</span>
                      <span className="font-medium text-charcoal-700">
                        Razorpay (Paid)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                  <Link
                    href={`/track-order?orderNumber=${orderResult.orderNumber}&phone=${shipping.phone}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-gold-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gold-600"
                  >
                    Track Your Order
                  </Link>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 rounded-lg border border-charcoal-200 px-6 py-2.5 text-sm font-medium text-charcoal-600 transition-colors hover:bg-charcoal-50"
                  >
                    Continue Shopping
                  </Link>
                </div>

                <p className="mt-6 text-xs text-charcoal-400">
                  For queries, contact us on WhatsApp:{" "}
                  <a
                    href={`https://wa.me/91${process.env.NEXT_PUBLIC_SHOP_PHONE || "9654148574"}`}
                    onClick={() => trackContact({ type: "whatsapp" })}
                    className="font-medium text-gold-600 hover:underline"
                  >
                    +91 {process.env.NEXT_PUBLIC_SHOP_PHONE || "9654148574"}
                  </a>
                </p>
              </div>
            )}
          </div>

          {step !== 3 && (
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-xl border border-charcoal-100 bg-white p-6 shadow-card">
                <h3 className="text-lg font-semibold text-charcoal-700">
                  Order Summary
                </h3>

                <ul className="mt-4 divide-y divide-charcoal-100">
                  {items.map((item) => (
                    <li key={item.cartItemId} className="flex gap-3 py-3">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-charcoal-50">
                        <Image
                          src={item.thumbnailImage}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-charcoal-700 line-clamp-1">
                          {item.name}
                        </p>
                        <p className="text-xs text-charcoal-400">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="font-mono text-sm font-semibold text-charcoal-700">
                        {formatCurrency(item.totalPrice * item.quantity)}
                      </p>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 space-y-2 border-t border-charcoal-100 pt-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-charcoal-400">Subtotal</span>
                    <span className="font-mono font-medium text-charcoal-700">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charcoal-400">Shipping</span>
                    <span className="font-mono font-medium text-charcoal-700">
                      {shippingCharge === 0
                        ? "Free"
                        : formatCurrency(shippingCharge)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-charcoal-100 pt-2 text-base">
                    <span className="font-semibold text-charcoal-700">
                      Total
                    </span>
                    <span className="font-mono font-bold text-gold-700">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                </div>

                {subtotal < 50000 && (
                  <p className="mt-3 text-xs text-charcoal-400">
                    Add{" "}
                    <span className="font-semibold text-gold-600">
                      {formatCurrency(50000 - subtotal)}
                    </span>{" "}
                    more for free shipping!
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
