"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Package,
  Truck,
  Ban,
  Eye,
  Filter,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { PriceDisplay } from "@/components/ui/PriceDisplay";
import { SearchBar } from "@/components/ui/SearchBar";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { formatDate, cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { ITEMS_PER_PAGE } from "@/constants";

interface OrderItem {
  _id: string;
  orderNumber: string;
  status: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    city: string;
    state: string;
  };
  items: { productSnapshot: { name: string } }[];
  totalAmount: number;
  payment: {
    method: string;
    status: string;
  };
  createdAt: string;
}

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "", label: "All Payments" },
  { value: "pending", label: "Payment Pending" },
  { value: "received", label: "Payment Received" },
  { value: "verified", label: "Payment Verified" },
  { value: "failed", label: "Payment Failed" },
  { value: "refunded", label: "Refunded" },
];

const STATUS_BADGE: Record<string, { variant: "gold" | "info" | "success" | "rose" | "error"; icon: React.ElementType }> = {
  pending: { variant: "gold", icon: Clock },
  confirmed: { variant: "info", icon: CheckCircle2 },
  processing: { variant: "rose", icon: Package },
  shipped: { variant: "gold", icon: Truck },
  delivered: { variant: "success", icon: CheckCircle2 },
  cancelled: { variant: "error", icon: Ban },
};

const PAYMENT_BADGE: Record<string, "gold" | "info" | "success" | "rose" | "error"> = {
  pending: "gold",
  received: "info",
  verified: "success",
  failed: "error",
  refunded: "rose",
};

export default function OrdersListPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const fetchOrders = useCallback(async (retries = 3) => {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        setIsLoading(true);
        const params = new URLSearchParams({
          page: String(page),
          limit: String(ITEMS_PER_PAGE),
          _t: String(Date.now()),
        });
        if (search) params.set("search", search);
        if (status) params.set("status", status);
        if (paymentStatus) params.set("paymentStatus", paymentStatus);

        const res = await fetch(`/api/orders?${params}`, { cache: "no-store" });
        const data = await res.json();
        if (data.success) {
          setOrders(data.data);
          setTotalPages(data.pagination.totalPages);
          setTotal(data.pagination.total);
          setIsLoading(false);
          return;
        }
      } catch {
        if (attempt === retries - 1) toast.error("Failed to load orders");
      }
      if (attempt < retries - 1) await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
    }
    setIsLoading(false);
  }, [page, search, status, paymentStatus]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    setPage(1);
  }, [search, status, paymentStatus]);

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Orders" },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-700 lg:text-3xl">
            Orders
          </h1>
          <p className="mt-1 text-sm text-charcoal-400">
            {total} total order{total !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search by order number, name, phone..."
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
              showFilters
                ? "border-gold-300 bg-gold-50 text-gold-700"
                : "border-charcoal-200 text-charcoal-600 hover:bg-charcoal-50"
            )}
          >
            <Filter className="h-4 w-4" />
            Filters
            {(status || paymentStatus) && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold-500 text-xs font-bold text-white">
                {[status, paymentStatus].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 grid gap-3 border-t border-charcoal-100 pt-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-charcoal-500">
                Order Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm text-charcoal-700 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-charcoal-500">
                Payment Status
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm text-charcoal-700 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              >
                {PAYMENT_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </Card>

      {/* Orders List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No orders found"
          description={
            search || status || paymentStatus
              ? "Try adjusting your filters"
              : "Orders will appear here when customers place them"
          }
        />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-3"
        >
          {orders.map((order) => {
            const statusBadge = STATUS_BADGE[order.status] || STATUS_BADGE.pending;
            const StatusIcon = statusBadge.icon;
            const paymentBadgeVariant = PAYMENT_BADGE[order.payment.status] || "gold";
            const itemCount = order.items.length;

            return (
              <motion.div key={order._id} variants={staggerItem}>
                <Link href={`/admin/orders/${order._id}`}>
                  <Card className="p-4 transition-all hover:shadow-card-hover hover:border-gold-200">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-50 text-gold-600">
                          <StatusIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-sm font-semibold text-charcoal-700">
                              {order.orderNumber}
                            </p>
                            <Badge variant={statusBadge.variant} size="sm">
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-xs text-charcoal-400">
                            {order.shippingAddress.fullName} &middot;{" "}
                            {order.shippingAddress.phone} &middot;{" "}
                            {order.shippingAddress.city}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 sm:text-right">
                        <div>
                          <PriceDisplay
                            amount={order.totalAmount}
                            size="sm"
                            className="font-semibold"
                          />
                          <div className="flex items-center gap-2">
                            <Badge variant={paymentBadgeVariant} size="sm">
                              {order.payment.method === "cod"
                                ? "COD"
                                : order.payment.method === "bank_transfer"
                                  ? "Bank"
                                  : "UPI"}
                            </Badge>
                            <Badge variant={paymentBadgeVariant} size="sm">
                              {order.payment.status.charAt(0).toUpperCase() +
                                order.payment.status.slice(1)}
                            </Badge>
                          </div>
                        </div>
                        <div className="hidden text-right sm:block">
                          <p className="text-xs text-charcoal-400">
                            {formatDate(order.createdAt)}
                          </p>
                          <p className="text-xs text-charcoal-300">
                            {itemCount} item{itemCount !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-charcoal-300" />
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-charcoal-200 px-4 py-2 text-sm font-medium text-charcoal-600 hover:bg-charcoal-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-charcoal-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-charcoal-200 px-4 py-2 text-sm font-medium text-charcoal-600 hover:bg-charcoal-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
