"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Package,
  Truck,
  Ban,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  ShoppingBag,
  Save,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { PriceDisplay } from "@/components/ui/PriceDisplay";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { formatDate, formatCurrency, cn } from "@/lib/utils";

interface OrderDetail {
  _id: string;
  orderNumber: string;
  status: string;
  items: {
    productId: string;
    productSnapshot: {
      name: string;
      productCode: string;
      thumbnailImage: string;
      price: number;
      slug: string;
      selectedSize?: string;
      selectedColor?: string;
      selectedMetalVariants?: {
        metalName: string;
        variantName: string;
        pricePerGram: number;
        weightInGrams: number;
      }[];
      selectedGemstone?: {
        gemstoneName: string;
        variantName: string;
        weightInCarats: number;
        quantity: number;
        pricePerCarat: number;
      };
    };
    quantity: number;
    priceAtOrder: number;
  }[];
  shippingAddress: {
    fullName: string;
    phone: string;
    email?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
  };
  payment: {
    method: string;
    status: string;
    transactionId?: string;
    paidAt?: string;
    verifiedAt?: string;
  };
  subtotal: number;
  shippingCharge: number;
  totalAmount: number;
  customerNotes?: string;
  adminNotes?: string;
  cancelReason?: string;
  trackingInfo?: {
    provider?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    estimatedDelivery?: string;
  };
  timeline: {
    status: string;
    note: string;
    timestamp: string;
    updatedBy?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

const STATUS_FLOW = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "text-yellow-600 bg-yellow-50 border-yellow-200", icon: Clock },
  confirmed: { label: "Confirmed", color: "text-blue-600 bg-blue-50 border-blue-200", icon: CheckCircle2 },
  processing: { label: "Processing", color: "text-indigo-600 bg-indigo-50 border-indigo-200", icon: Package },
  shipped: { label: "Shipped", color: "text-purple-600 bg-purple-50 border-purple-200", icon: Truck },
  delivered: { label: "Delivered", color: "text-green-600 bg-green-50 border-green-200", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "text-red-600 bg-red-50 border-red-200", icon: Ban },
};

const PAYMENT_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "received", label: "Received" },
  { value: "verified", label: "Verified" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

const PAYMENT_BADGE: Record<string, "gold" | "info" | "success" | "error" | "rose"> = {
  pending: "gold",
  received: "info",
  verified: "success",
  failed: "error",
  refunded: "rose",
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Status update
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Payment update
  const [newPaymentStatus, setNewPaymentStatus] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);

  // Tracking
  const [trackingProvider, setTrackingProvider] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [estimatedDelivery, setEstimatedDelivery] = useState("");

  // Cancel
  const [cancelReason, setCancelReason] = useState("");

  // Admin notes
  const [adminNotes, setAdminNotes] = useState("");

  const fetchOrder = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      if (data.success) {
        setOrder(data.data);
        setNewStatus(data.data.status);
        setNewPaymentStatus(data.data.payment.status);
        setAdminNotes(data.data.adminNotes || "");
        if (data.data.trackingInfo) {
          setTrackingProvider(data.data.trackingInfo.provider || "");
          setTrackingNumber(data.data.trackingInfo.trackingNumber || "");
          setTrackingUrl(data.data.trackingInfo.trackingUrl || "");
          setEstimatedDelivery(
            data.data.trackingInfo.estimatedDelivery
              ? new Date(data.data.trackingInfo.estimatedDelivery).toISOString().split("T")[0]
              : ""
          );
        }
      } else {
        toast.error("Order not found");
        router.push("/admin/orders");
      }
    } catch {
      toast.error("Failed to load order");
    } finally {
      setIsLoading(false);
    }
  }, [orderId, router]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleStatusUpdate = async () => {
    if (!newStatus || newStatus === order?.status) return;

    setIsUpdatingStatus(true);
    try {
      const body: Record<string, unknown> = {
        status: newStatus,
        note: statusNote,
        adminNotes,
      };

      if (newStatus === "cancelled") {
        body.cancelReason = cancelReason;
      }

      if (newStatus === "shipped") {
        body.trackingInfo = {
          provider: trackingProvider,
          trackingNumber,
          trackingUrl,
          estimatedDelivery: estimatedDelivery || undefined,
        };
      }

      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(`Order status updated to ${newStatus}`);
        setStatusNote("");
        setCancelReason("");
        fetchOrder();
      } else {
        toast.error(data.error || "Failed to update status");
      }
    } catch {
      toast.error("Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handlePaymentUpdate = async () => {
    if (!newPaymentStatus || newPaymentStatus === order?.payment.status) return;

    setIsUpdatingPayment(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentStatus: newPaymentStatus,
          transactionId: transactionId || undefined,
          note: paymentNote,
        }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(`Payment status updated to ${newPaymentStatus}`);
        setPaymentNote("");
        setTransactionId("");
        fetchOrder();
      } else {
        toast.error(data.error || "Failed to update payment");
      }
    } catch {
      toast.error("Failed to update payment");
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!order) return null;

  const statusConf = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConf.icon;
  const currentStatusIndex = STATUS_FLOW.indexOf(order.status);

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Orders", href: "/admin/orders" },
          { label: order.orderNumber },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-charcoal-200 text-charcoal-500 hover:bg-charcoal-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-xl font-bold text-charcoal-700">
                {order.orderNumber}
              </h1>
              <Badge variant={PAYMENT_BADGE[order.status] || "gold"}>
                {statusConf.label}
              </Badge>
            </div>
            <p className="text-sm text-charcoal-400">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Status Progress */}
      {order.status !== "cancelled" && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            {STATUS_FLOW.map((s, i) => {
              const conf = STATUS_CONFIG[s];
              const Icon = conf.icon;
              const isActive = i <= currentStatusIndex;
              const isCurrent = s === order.status;

              return (
                <div key={s} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                        isCurrent
                          ? "border-gold-500 bg-gold-500 text-white"
                          : isActive
                            ? "border-gold-300 bg-gold-50 text-gold-600"
                            : "border-charcoal-200 bg-charcoal-50 text-charcoal-400"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span
                      className={cn(
                        "mt-1 hidden text-xs font-medium sm:block",
                        isCurrent
                          ? "text-gold-700"
                          : isActive
                            ? "text-charcoal-600"
                            : "text-charcoal-400"
                      )}
                    >
                      {conf.label}
                    </span>
                  </div>
                  {i < STATUS_FLOW.length - 1 && (
                    <div
                      className={cn(
                        "mx-1 h-0.5 w-6 sm:w-12 md:w-20",
                        i < currentStatusIndex ? "bg-gold-400" : "bg-charcoal-200"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Items + Address */}
        <div className="space-y-6 lg:col-span-2">
          {/* Order Items */}
          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold text-charcoal-700">
              <ShoppingBag className="h-4 w-4 text-gold-600" />
              Order Items ({order.items.length})
            </h2>
            <ul className="mt-4 divide-y divide-charcoal-100">
              {order.items.map((item, i) => (
                <li key={i} className="flex gap-3 py-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-charcoal-50">
                    <Image
                      src={item.productSnapshot.thumbnailImage}
                      alt={item.productSnapshot.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-charcoal-700">
                      {item.productSnapshot.name}
                    </p>
                    <p className="text-xs text-charcoal-400">
                      {item.productSnapshot.productCode} &middot; Qty: {item.quantity}
                    </p>
                    {/* Customization details */}
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {item.productSnapshot.selectedSize && (
                        <span className="inline-flex items-center rounded-full bg-charcoal-100 px-2 py-0.5 text-xs text-charcoal-600">
                          Size: {item.productSnapshot.selectedSize}
                        </span>
                      )}
                      {item.productSnapshot.selectedColor && (
                        <span className="inline-flex items-center rounded-full bg-charcoal-100 px-2 py-0.5 text-xs text-charcoal-600">
                          Colour: {item.productSnapshot.selectedColor}
                        </span>
                      )}
                    </div>
                    {item.productSnapshot.selectedMetalVariants && item.productSnapshot.selectedMetalVariants.length > 0 && (
                      <div className="mt-1.5">
                        <p className="text-xs font-medium text-charcoal-500 mb-1">Metal:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {item.productSnapshot.selectedMetalVariants.map((mv, j) => (
                            <span key={j} className="inline-flex items-center rounded-full bg-gold-50 border border-gold-200 px-2 py-0.5 text-xs text-gold-700">
                              {mv.metalName} · {mv.variantName} · {mv.weightInGrams}g
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {item.productSnapshot.selectedGemstone && (
                      <div className="mt-1.5">
                        <p className="text-xs font-medium text-charcoal-500 mb-1">Gemstone:</p>
                        <span className="inline-flex items-center rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-xs text-rose-700">
                          {item.productSnapshot.selectedGemstone.gemstoneName} · {item.productSnapshot.selectedGemstone.variantName} · {item.productSnapshot.selectedGemstone.weightInCarats}ct × {item.productSnapshot.selectedGemstone.quantity}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <PriceDisplay amount={item.priceAtOrder * item.quantity} size="sm" />
                    <p className="text-xs text-charcoal-400">
                      @ {formatCurrency(item.priceAtOrder)} each
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-3 space-y-1 border-t border-charcoal-100 pt-3 text-sm">
              <div className="flex justify-between text-charcoal-400">
                <span>Subtotal</span>
                <span className="font-mono">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-charcoal-400">
                <span>Shipping</span>
                <span className="font-mono">
                  {order.shippingCharge === 0 ? "Free" : formatCurrency(order.shippingCharge)}
                </span>
              </div>
              <div className="flex justify-between text-base font-semibold text-charcoal-700">
                <span>Total</span>
                <span className="font-mono text-gold-700">{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </Card>

          {/* Shipping Address */}
          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold text-charcoal-700">
              <MapPin className="h-4 w-4 text-gold-600" />
              Shipping Address
            </h2>
            <div className="mt-3 space-y-2 text-sm text-charcoal-600">
              <p className="font-medium text-charcoal-700">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.addressLine1}</p>
              {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}
              </p>
              {order.shippingAddress.landmark && <p>Near: {order.shippingAddress.landmark}</p>}
              <div className="flex flex-wrap gap-4 border-t border-charcoal-100 pt-2">
                <a
                  href={`tel:+91${order.shippingAddress.phone}`}
                  className="inline-flex items-center gap-1.5 text-xs text-gold-600 hover:underline"
                >
                  <Phone className="h-3.5 w-3.5" />
                  +91 {order.shippingAddress.phone}
                </a>
                {order.shippingAddress.email && (
                  <a
                    href={`mailto:${order.shippingAddress.email}`}
                    className="inline-flex items-center gap-1.5 text-xs text-gold-600 hover:underline"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {order.shippingAddress.email}
                  </a>
                )}
                <a
                  href={`https://wa.me/91${order.shippingAddress.phone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-green-600 hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  WhatsApp
                </a>
              </div>
            </div>
          </Card>

          {/* Customer Notes */}
          {order.customerNotes && (
            <Card className="p-5">
              <h2 className="text-base font-semibold text-charcoal-700">Customer Notes</h2>
              <p className="mt-2 text-sm text-charcoal-500">{order.customerNotes}</p>
            </Card>
          )}

          {/* Timeline */}
          <Card className="p-5">
            <h2 className="text-base font-semibold text-charcoal-700">Order Timeline</h2>
            <ol className="relative mt-4 ml-3 border-l border-charcoal-200">
              {order.timeline.map((entry, i) => {
                const conf = STATUS_CONFIG[entry.status] || STATUS_CONFIG.pending;
                return (
                  <li key={i} className="mb-6 ml-6 last:mb-0">
                    <span
                      className={cn(
                        "absolute -left-[9px] flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-white",
                        i === 0 ? "bg-gold-500" : "bg-charcoal-200"
                      )}
                    />
                    <div>
                      <p className="text-sm font-medium text-charcoal-700">{conf.label}</p>
                      {entry.note && (
                        <p className="text-xs text-charcoal-400">{entry.note}</p>
                      )}
                      {entry.updatedBy && (
                        <p className="text-[10px] text-charcoal-300">by {entry.updatedBy}</p>
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
          </Card>
        </div>

        {/* Right Sidebar: Actions */}
        <div className="space-y-6">
          {/* Update Order Status */}
          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold text-charcoal-700">
              <Package className="h-4 w-4 text-gold-600" />
              Update Status
            </h2>
            <div className="mt-3 space-y-3">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm text-charcoal-700 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              >
                {[...STATUS_FLOW, "cancelled"].map((s) => (
                  <option key={s} value={s}>
                    {STATUS_CONFIG[s]?.label || s}
                  </option>
                ))}
              </select>

              {newStatus === "cancelled" && (
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Reason for cancellation..."
                  rows={2}
                  className="w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm text-charcoal-700 placeholder:text-charcoal-300 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                />
              )}

              {newStatus === "shipped" && (
                <div className="space-y-2 rounded-lg bg-charcoal-50 p-3">
                  <p className="text-xs font-medium text-charcoal-600">Tracking Details</p>
                  <input
                    type="text"
                    placeholder="Carrier (e.g., BlueDart)"
                    value={trackingProvider}
                    onChange={(e) => setTrackingProvider(e.target.value)}
                    className="w-full rounded-lg border border-charcoal-200 px-3 py-1.5 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Tracking Number"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full rounded-lg border border-charcoal-200 px-3 py-1.5 text-sm"
                  />
                  <input
                    type="url"
                    placeholder="Tracking URL"
                    value={trackingUrl}
                    onChange={(e) => setTrackingUrl(e.target.value)}
                    className="w-full rounded-lg border border-charcoal-200 px-3 py-1.5 text-sm"
                  />
                  <input
                    type="date"
                    placeholder="Est. Delivery"
                    value={estimatedDelivery}
                    onChange={(e) => setEstimatedDelivery(e.target.value)}
                    className="w-full rounded-lg border border-charcoal-200 px-3 py-1.5 text-sm"
                  />
                </div>
              )}

              <input
                type="text"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Add a note (optional)..."
                className="w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm text-charcoal-700 placeholder:text-charcoal-300 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              />

              <button
                onClick={handleStatusUpdate}
                disabled={isUpdatingStatus || newStatus === order.status}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-lg bg-gold-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gold-600",
                  (isUpdatingStatus || newStatus === order.status) && "cursor-not-allowed opacity-50"
                )}
              >
                <Save className="h-4 w-4" />
                {isUpdatingStatus ? "Updating..." : "Update Status"}
              </button>
            </div>
          </Card>

          {/* Update Payment Status */}
          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold text-charcoal-700">
              <CreditCard className="h-4 w-4 text-gold-600" />
              Payment Status
            </h2>
            <div className="mt-2 text-sm">
              <div className="flex justify-between text-charcoal-400">
                <span>Method</span>
                <span className="font-medium capitalize text-charcoal-700">
                  {order.payment.method === "cod"
                    ? "Cash on Delivery"
                    : order.payment.method === "bank_transfer"
                      ? "Bank Transfer"
                      : "UPI"}
                </span>
              </div>
              <div className="mt-1 flex justify-between text-charcoal-400">
                <span>Status</span>
                <Badge variant={PAYMENT_BADGE[order.payment.status] || "gold"} size="sm">
                  {order.payment.status.charAt(0).toUpperCase() + order.payment.status.slice(1)}
                </Badge>
              </div>
              {order.payment.transactionId && (
                <div className="mt-1 flex justify-between text-charcoal-400">
                  <span>Txn ID</span>
                  <span className="font-mono text-xs text-charcoal-700">
                    {order.payment.transactionId}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4 space-y-3 border-t border-charcoal-100 pt-3">
              <select
                value={newPaymentStatus}
                onChange={(e) => setNewPaymentStatus(e.target.value)}
                className="w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm text-charcoal-700 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              >
                {PAYMENT_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Transaction ID (optional)"
                className="w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm text-charcoal-700 placeholder:text-charcoal-300 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              />

              <input
                type="text"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder="Payment note (optional)..."
                className="w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm text-charcoal-700 placeholder:text-charcoal-300 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              />

              <button
                onClick={handlePaymentUpdate}
                disabled={isUpdatingPayment || newPaymentStatus === order.payment.status}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-lg bg-charcoal-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-charcoal-800",
                  (isUpdatingPayment || newPaymentStatus === order.payment.status) &&
                    "cursor-not-allowed opacity-50"
                )}
              >
                <CreditCard className="h-4 w-4" />
                {isUpdatingPayment ? "Updating..." : "Update Payment"}
              </button>
            </div>
          </Card>

          {/* Admin Notes */}
          <Card className="p-5">
            <h2 className="text-base font-semibold text-charcoal-700">Admin Notes</h2>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
              placeholder="Internal notes..."
              className="mt-3 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm text-charcoal-700 placeholder:text-charcoal-300 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
            />
            <p className="mt-1 text-[10px] text-charcoal-300">
              Only visible to admins. Saved with status updates.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
