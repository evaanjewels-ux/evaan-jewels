"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  CreditCard,
  Truck,
  CheckCircle2,
  ArrowLeft,
  QrCode,
  Building2,
  Banknote,
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

type PaymentMethod = "upi" | "bank_transfer" | "cod";

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

export function CheckoutClient() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<{
    orderNumber: string;
    totalAmount: number;
  } | null>(null);

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

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [customerNotes, setCustomerNotes] = useState("");

  const shippingCharge = subtotal >= 50000 ? 0 : 500;
  const totalAmount = subtotal + shippingCharge;

  const upiId = process.env.NEXT_PUBLIC_UPI_ID || "your-upi@upi";
  const upiName = process.env.NEXT_PUBLIC_UPI_NAME || "Evaan Jewels";
  const upiQrImage = process.env.NEXT_PUBLIC_UPI_QR_IMAGE || "";

  // Validation
  const validateShipping = (): boolean => {
    if (!shipping.fullName.trim()) {
      toast.error("Full name is required");
      return false;
    }
    if (!shipping.phone.trim() || shipping.phone.length < 10) {
      toast.error("Valid phone number is required");
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
    if (!shipping.pincode.trim() || shipping.pincode.length !== 6) {
      toast.error("Valid 6-digit pincode is required");
      return false;
    }
    return true;
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
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            customPrice: item.totalPrice,
            selectedSize: item.selectedSize,
            selectedColor: item.selectedColor,
            selectedMetalVariants: item.selectedMetalVariants,
            selectedGemstone: item.selectedGemstone,
          })),
          shippingAddress: shipping,
          paymentMethod,
          customerNotes,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || "Failed to place order");
        return;
      }

      setOrderResult({
        orderNumber: data.data.orderNumber,
        totalAmount: data.data.totalAmount,
      });
      clearCart();
      setStep(3);
      toast.success("Order placed successfully!");
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
            { label: "Cart", href: "#" },
            { label: "Checkout" },
          ]}
        />

        {/* Steps Indicator */}
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
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Shipping */}
            {step === 1 && (
              <div className="rounded-xl border border-charcoal-100 bg-white p-6 shadow-card sm:p-8">
                <h2 className="text-xl font-semibold text-charcoal-700">
                  Shipping Address
                </h2>
                <p className="mt-1 text-sm text-charcoal-400">
                  Where should we deliver your order?
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
                        setShipping({ ...shipping, phone: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-charcoal-200 px-4 py-2.5 text-sm text-charcoal-700 placeholder:text-charcoal-300 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                      placeholder="10-digit mobile number"
                      maxLength={10}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-charcoal-600">
                      Email (optional)
                    </label>
                    <input
                      type="email"
                      value={shipping.email}
                      onChange={(e) =>
                        setShipping({ ...shipping, email: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-charcoal-200 px-4 py-2.5 text-sm text-charcoal-700 placeholder:text-charcoal-300 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                      placeholder="your@email.com"
                    />
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
                        setShipping({ ...shipping, pincode: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-charcoal-200 px-4 py-2.5 text-sm text-charcoal-700 placeholder:text-charcoal-300 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                      placeholder="6-digit pincode"
                      maxLength={6}
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
                  onClick={() => {
                    if (validateShipping()) setStep(2);
                  }}
                  className="mt-6 w-full rounded-lg bg-gold-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-gold-600"
                >
                  Continue to Payment
                </button>
              </div>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <div className="rounded-xl border border-charcoal-100 bg-white p-6 shadow-card sm:p-8">
                <button
                  onClick={() => setStep(1)}
                  className="mb-4 flex items-center gap-1 text-sm text-charcoal-500 hover:text-charcoal-700"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Shipping
                </button>

                <h2 className="text-xl font-semibold text-charcoal-700">
                  Payment Method
                </h2>
                <p className="mt-1 text-sm text-charcoal-400">
                  Choose how you&apos;d like to pay. Payment will be verified
                  manually by our team.
                </p>

                <div className="mt-6 space-y-3">
                  {/* UPI */}
                  <button
                    onClick={() => setPaymentMethod("upi")}
                    className={cn(
                      "w-full rounded-xl border-2 p-4 text-left transition-all",
                      paymentMethod === "upi"
                        ? "border-gold-500 bg-gold-50/50"
                        : "border-charcoal-100 hover:border-charcoal-200"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-lg",
                          paymentMethod === "upi"
                            ? "bg-gold-100 text-gold-600"
                            : "bg-charcoal-100 text-charcoal-500"
                        )}
                      >
                        <QrCode className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-charcoal-700">
                          UPI Payment
                        </p>
                        <p className="text-xs text-charcoal-400">
                          Pay via Google Pay, PhonePe, Paytm, or any UPI app
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Bank Transfer */}
                  <button
                    onClick={() => setPaymentMethod("bank_transfer")}
                    className={cn(
                      "w-full rounded-xl border-2 p-4 text-left transition-all",
                      paymentMethod === "bank_transfer"
                        ? "border-gold-500 bg-gold-50/50"
                        : "border-charcoal-100 hover:border-charcoal-200"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-lg",
                          paymentMethod === "bank_transfer"
                            ? "bg-gold-100 text-gold-600"
                            : "bg-charcoal-100 text-charcoal-500"
                        )}
                      >
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-charcoal-700">
                          Bank Transfer (NEFT/IMPS)
                        </p>
                        <p className="text-xs text-charcoal-400">
                          Transfer directly to our bank account
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* COD */}
                  <button
                    onClick={() => setPaymentMethod("cod")}
                    className={cn(
                      "w-full rounded-xl border-2 p-4 text-left transition-all",
                      paymentMethod === "cod"
                        ? "border-gold-500 bg-gold-50/50"
                        : "border-charcoal-100 hover:border-charcoal-200"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-lg",
                          paymentMethod === "cod"
                            ? "bg-gold-100 text-gold-600"
                            : "bg-charcoal-100 text-charcoal-500"
                        )}
                      >
                        <Banknote className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-charcoal-700">
                          Cash on Delivery
                        </p>
                        <p className="text-xs text-charcoal-400">
                          Pay when you receive the order
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                {/* UPI Details */}
                {paymentMethod === "upi" && (
                  <div className="mt-6 rounded-xl bg-charcoal-50 p-5">
                    <h3 className="text-sm font-semibold text-charcoal-700">
                      UPI Payment Details
                    </h3>
                    <p className="mt-1 text-xs text-charcoal-400">
                      After placing the order, send the payment to the UPI ID
                      below. Our team will verify and confirm your order.
                    </p>
                    <div className="mt-3 flex items-center gap-4">
                      {upiQrImage && (
                        <div className="relative h-32 w-32 overflow-hidden rounded-lg border border-charcoal-200 bg-white">
                          <Image
                            src={upiQrImage}
                            alt="UPI QR Code"
                            fill
                            className="object-contain p-1"
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-charcoal-400">UPI ID</p>
                          <p className="font-mono text-sm font-semibold text-charcoal-700">
                            {upiId}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-charcoal-400">Name</p>
                          <p className="text-sm font-medium text-charcoal-700">
                            {upiName}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-charcoal-400">Amount</p>
                          <p className="font-mono text-sm font-semibold text-gold-700">
                            {formatCurrency(totalAmount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bank Transfer Details */}
                {paymentMethod === "bank_transfer" && (
                  <div className="mt-6 rounded-xl bg-charcoal-50 p-5">
                    <h3 className="text-sm font-semibold text-charcoal-700">
                      Bank Transfer Details
                    </h3>
                    <p className="mt-1 text-xs text-charcoal-400">
                      Transfer the total amount to our account. Share the
                      transaction reference after placing the order.
                    </p>
                    <div className="mt-3 space-y-2 text-sm">
                      <p className="text-charcoal-400">
                        Amount:{" "}
                        <span className="font-mono font-semibold text-gold-700">
                          {formatCurrency(totalAmount)}
                        </span>
                      </p>
                      <p className="text-charcoal-400">
                        Bank details will be shared via WhatsApp after you place
                        the order.
                      </p>
                    </div>
                  </div>
                )}

                {/* Info */}
                <div className="mt-4 flex gap-2 rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    Your order will be confirmed once we verify the payment. For
                    COD orders, we may contact you on WhatsApp for confirmation.
                  </p>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting}
                  className={cn(
                    "mt-6 w-full rounded-lg bg-gold-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-gold-600",
                    isSubmitting && "cursor-not-allowed opacity-60"
                  )}
                >
                  {isSubmitting ? "Placing Order..." : "Place Order"}
                </button>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && orderResult && (
              <div className="rounded-xl border border-charcoal-100 bg-white p-6 text-center shadow-card sm:p-10">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="mt-4 text-2xl font-bold text-charcoal-700">
                  Order Placed Successfully!
                </h2>
                <p className="mt-2 text-charcoal-400">
                  Thank you for your order. We&apos;ll confirm it once the
                  payment is verified.
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
                      <span className="font-medium capitalize text-charcoal-700">
                        {paymentMethod === "cod"
                          ? "Cash on Delivery"
                          : paymentMethod === "bank_transfer"
                            ? "Bank Transfer"
                            : "UPI"}
                      </span>
                    </div>
                  </div>
                </div>

                {paymentMethod === "upi" && (
                  <div className="mx-auto mt-4 max-w-sm rounded-xl bg-gold-50 p-4">
                    <p className="text-sm font-medium text-gold-800">
                      Please send{" "}
                      <span className="font-mono font-bold">
                        {formatCurrency(orderResult.totalAmount)}
                      </span>{" "}
                      to UPI ID:{" "}
                      <span className="font-mono font-bold">{upiId}</span>
                    </p>
                    <p className="mt-1 text-xs text-gold-600">
                      Mention your order number {orderResult.orderNumber} in the
                      payment remarks.
                    </p>
                  </div>
                )}

                <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                  <Link
                    href={`/track-order?orderNumber=${orderResult.orderNumber}`}
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
                    className="font-medium text-gold-600 hover:underline"
                  >
                    +91 {process.env.NEXT_PUBLIC_SHOP_PHONE || "9654148574"}
                  </a>
                </p>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          {step !== 3 && (
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-xl border border-charcoal-100 bg-white p-6 shadow-card">
                <h3 className="text-lg font-semibold text-charcoal-700">
                  Order Summary
                </h3>

                <ul className="mt-4 divide-y divide-charcoal-100">
                  {items.map((item) => (
                    <li key={item.productId} className="flex gap-3 py-3">
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
