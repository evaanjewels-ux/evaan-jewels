"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  Package,
  CheckCircle2,
  Clock,
  Truck,
  Ban,
  ArrowRight,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, cn } from "@/lib/utils";
import { Breadcrumb } from "@/components/shared/Breadcrumb";

interface TimelineEntry {
  status: string;
  note: string;
  timestamp: string;
}

interface TrackedOrder {
  orderNumber: string;
  status: string;
  items: {
    productSnapshot: {
      name: string;
      productCode: string;
      thumbnailImage: string;
      price: number;
    };
    quantity: number;
    priceAtOrder: number;
  }[];
  subtotal: number;
  shippingCharge: number;
  totalAmount: number;
  payment: {
    method: string;
    status: string;
  };
  trackingInfo?: {
    provider?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    estimatedDelivery?: string;
  };
  timeline: TimelineEntry[];
  createdAt: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  pending: { label: "Pending", color: "text-yellow-600 bg-yellow-50", icon: Clock },
  confirmed: { label: "Confirmed", color: "text-blue-600 bg-blue-50", icon: CheckCircle2 },
  processing: { label: "Processing", color: "text-indigo-600 bg-indigo-50", icon: Package },
  shipped: { label: "Shipped", color: "text-purple-600 bg-purple-50", icon: Truck },
  delivered: { label: "Delivered", color: "text-green-600 bg-green-50", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "text-red-600 bg-red-50", icon: Ban },
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Payment Pending",
  received: "Payment Received",
  verified: "Payment Verified",
  failed: "Payment Failed",
  refunded: "Refunded",
};

export function TrackOrderClient() {
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Pre-fill from URL params
  useEffect(() => {
    const on = searchParams.get("orderNumber");
    if (on) setOrderNumber(on);
  }, [searchParams]);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) {
      toast.error("Please enter your order number");
      return;
    }
    if (!phone.trim() || phone.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setIsLoading(true);
    setNotFound(false);
    setOrder(null);

    try {
      const res = await fetch(
        `/api/orders/track?orderNumber=${encodeURIComponent(orderNumber.trim())}&phone=${encodeURIComponent(phone.trim())}`
      );
      const data = await res.json();

      if (!data.success) {
        setNotFound(true);
        return;
      }
      setOrder(data.data);
    } catch {
      toast.error("Failed to track order. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const statusConfig = order ? STATUS_CONFIG[order.status] || STATUS_CONFIG.pending : null;

  return (
    <div className="py-8 md:py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Breadcrumb
          homeHref="/"
          items={[
            { label: "Home", href: "/" },
            { label: "Track Order" },
          ]}
        />

        <div className="mt-6 text-center">
          <h1 className="font-heading text-2xl font-bold text-charcoal-700 sm:text-3xl">
            Track Your Order
          </h1>
          <p className="mt-2 text-sm text-charcoal-400">
            Enter your order number and phone number to check the status
          </p>
        </div>

        {/* Search Form */}
        <form
          onSubmit={handleTrack}
          className="mx-auto mt-8 max-w-lg rounded-xl border border-charcoal-100 bg-white p-6 shadow-card"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-charcoal-600">
                Order Number
              </label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                placeholder="EJ-2025-0001"
                className="mt-1 w-full rounded-lg border border-charcoal-200 px-4 py-2.5 font-mono text-sm text-charcoal-700 placeholder:text-charcoal-300 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-600">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                maxLength={10}
                className="mt-1 w-full rounded-lg border border-charcoal-200 px-4 py-2.5 text-sm text-charcoal-700 placeholder:text-charcoal-300 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-gold-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-gold-600",
              isLoading && "cursor-not-allowed opacity-60"
            )}
          >
            <Search className="h-4 w-4" />
            {isLoading ? "Tracking..." : "Track Order"}
          </button>
        </form>

        {/* Not Found */}
        {notFound && (
          <div className="mt-8 rounded-xl border border-red-100 bg-red-50 p-6 text-center">
            <Ban className="mx-auto h-10 w-10 text-red-400" />
            <h3 className="mt-3 text-sm font-semibold text-red-700">
              Order Not Found
            </h3>
            <p className="mt-1 text-xs text-red-500">
              Please check the order number and phone number and try again.
            </p>
          </div>
        )}

        {/* Order Result */}
        {order && statusConfig && (
          <div className="mt-8 space-y-6">
            {/* Status Banner */}
            <div
              className={cn(
                "flex items-center gap-3 rounded-xl p-4",
                statusConfig.color
              )}
            >
              <statusConfig.icon className="h-6 w-6" />
              <div>
                <p className="font-semibold">{statusConfig.label}</p>
                <p className="text-xs opacity-80">
                  Order {order.orderNumber} &middot;{" "}
                  {PAYMENT_STATUS_LABELS[order.payment.status] ||
                    order.payment.status}
                </p>
              </div>
            </div>

            {/* Tracking Info */}
            {order.trackingInfo?.trackingNumber && (
              <div className="rounded-xl border border-charcoal-100 bg-white p-4 shadow-card">
                <h3 className="text-sm font-semibold text-charcoal-700">
                  Shipping Details
                </h3>
                <div className="mt-2 space-y-1 text-sm text-charcoal-500">
                  {order.trackingInfo.provider && (
                    <p>Carrier: {order.trackingInfo.provider}</p>
                  )}
                  <p>Tracking: {order.trackingInfo.trackingNumber}</p>
                  {order.trackingInfo.estimatedDelivery && (
                    <p>
                      Est. Delivery:{" "}
                      {new Date(
                        order.trackingInfo.estimatedDelivery
                      ).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  )}
                  {order.trackingInfo.trackingUrl && (
                    <a
                      href={order.trackingInfo.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-gold-600 hover:underline"
                    >
                      Track with carrier
                      <ArrowRight className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Items */}
            <div className="rounded-xl border border-charcoal-100 bg-white p-4 shadow-card">
              <h3 className="text-sm font-semibold text-charcoal-700">
                Order Items
              </h3>
              <ul className="mt-3 divide-y divide-charcoal-100">
                {order.items.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 py-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-charcoal-50">
                      {item.productSnapshot?.thumbnailImage ? (
                        <Image
                          src={item.productSnapshot.thumbnailImage}
                          alt={item.productSnapshot?.name ?? "Product"}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      ) : (
                        <div className="h-full w-full bg-charcoal-100" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-charcoal-700">
                        {item.productSnapshot?.name ?? "Unknown Product"}
                      </p>
                      <p className="text-xs text-charcoal-400">
                        {item.productSnapshot?.productCode} &middot; Qty:{" "}
                        {item.quantity}
                      </p>
                    </div>
                    <p className="font-mono text-sm font-semibold text-charcoal-700">
                      {formatCurrency(item.priceAtOrder * item.quantity)}
                    </p>
                  </li>
                ))}
              </ul>
              <div className="mt-3 space-y-1 border-t border-charcoal-100 pt-3 text-sm">
                <div className="flex justify-between text-charcoal-400">
                  <span>Subtotal</span>
                  <span className="font-mono">
                    {formatCurrency(order.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-charcoal-400">
                  <span>Shipping</span>
                  <span className="font-mono">
                    {order.shippingCharge === 0
                      ? "Free"
                      : formatCurrency(order.shippingCharge)}
                  </span>
                </div>
                <div className="flex justify-between font-semibold text-charcoal-700">
                  <span>Total</span>
                  <span className="font-mono text-gold-700">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            {order.timeline.length > 0 && (
              <div className="rounded-xl border border-charcoal-100 bg-white p-4 shadow-card">
                <h3 className="text-sm font-semibold text-charcoal-700">
                  Order Timeline
                </h3>
                <ol className="relative mt-4 ml-3 border-l border-charcoal-200">
                  {order.timeline.map((entry, i) => {
                    const conf = STATUS_CONFIG[entry.status] || STATUS_CONFIG.pending;
                    return (
                      <li key={i} className="mb-6 ml-6 last:mb-0">
                        <span
                          className={cn(
                            "absolute -left-[9px] flex h-4.5 w-4.5 items-center justify-center rounded-full border-2 border-white",
                            i === 0
                              ? "bg-gold-500"
                              : "bg-charcoal-200"
                          )}
                        />
                        <div>
                          <p className="text-sm font-medium text-charcoal-700">
                            {conf.label}
                          </p>
                          {entry.note && (
                            <p className="text-xs text-charcoal-400">
                              {entry.note}
                            </p>
                          )}
                          <time className="text-[10px] text-charcoal-300">
                            {new Date(entry.timestamp).toLocaleString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </time>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}

            {/* Help */}
            <div className="text-center text-xs text-charcoal-400">
              Need help?{" "}
              <a
                href={`https://wa.me/919654148574?text=${encodeURIComponent(`Hi, I need help with order ${order.orderNumber}`)}`}
                className="font-medium text-gold-600 hover:underline"
              >
                Chat with us on WhatsApp
              </a>
            </div>
          </div>
        )}

        {/* No search yet */}
        {!order && !notFound && !isLoading && (
          <div className="mt-12 text-center">
            <ShoppingBag className="mx-auto h-16 w-16 text-charcoal-200" />
            <p className="mt-4 text-sm text-charcoal-400">
              Enter your order details above to track your order
            </p>
            <Link
              href="/categories"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-gold-600 hover:text-gold-700"
            >
              Continue Shopping
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
