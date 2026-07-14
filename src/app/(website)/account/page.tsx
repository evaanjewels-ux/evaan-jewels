"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import {
  Package,
  LogOut,
  User,
  ExternalLink,
  Truck,
  KeyRound,
} from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { ChangePasswordForm } from "@/components/shared/ChangePasswordForm";
import {
  ORDER_STATUS_CONFIG,
  type OrderStatus,
} from "@/constants/orderStatus";

interface AccountOrder {
  _id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  payment: { method: string; status: string };
  itemCount: number;
  createdAt: string;
  trackingNumber?: string;
  trackingUrl?: string;
  phone: string;
  thumbnailImage?: string;
  firstItemName?: string;
}

type Tab = "orders" | "password";

function statusLabel(status: string) {
  return (
    ORDER_STATUS_CONFIG[status as OrderStatus]?.label ||
    status.replace(/_/g, " ")
  );
}

function statusColor(status: string) {
  return (
    ORDER_STATUS_CONFIG[status as OrderStatus]?.color ||
    "bg-charcoal-50 text-charcoal-600"
  );
}

export default function AccountPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("orders");

  useEffect(() => {
    fetch("/api/account/orders")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setOrders(d.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="py-10 md:py-14">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold text-charcoal-700">
              My Account
            </h1>
            <p className="mt-1 flex items-center gap-2 text-sm text-charcoal-400">
              <User className="h-4 w-4" />
              {session?.user?.name} · {session?.user?.email}
            </p>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="inline-flex items-center gap-2 rounded-lg border border-charcoal-200 px-4 py-2 text-sm text-charcoal-600 hover:bg-charcoal-50"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>

        <div className="mt-6 flex gap-1 border-b border-charcoal-100">
          {(
            [
              { id: "orders" as const, label: "Orders", icon: Package },
              { id: "password" as const, label: "Password", icon: KeyRound },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                tab === id
                  ? "border-gold-500 text-gold-700"
                  : "border-transparent text-charcoal-400 hover:text-charcoal-600"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {tab === "orders" && (
          <section className="mt-6">
            <h2 className="sr-only">Your orders</h2>

            {loading ? (
              <p className="text-sm text-charcoal-400">Loading orders...</p>
            ) : orders.length === 0 ? (
              <div className="rounded-xl border border-charcoal-100 bg-white p-8 text-center">
                <Package className="mx-auto h-10 w-10 text-charcoal-200" />
                <p className="mt-3 text-sm text-charcoal-400">No orders yet.</p>
                <Link
                  href="/categories"
                  className="mt-4 inline-block text-sm font-medium text-gold-600 hover:underline"
                >
                  Browse collection
                </Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {orders.map((o) => {
                  const trackHref = `/track-order?orderNumber=${encodeURIComponent(o.orderNumber)}${
                    o.phone ? `&phone=${encodeURIComponent(o.phone)}` : ""
                  }`;

                  return (
                    <li
                      key={o._id}
                      className="rounded-xl border border-charcoal-100 bg-white p-4 shadow-card"
                    >
                      <div className="flex gap-3">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-charcoal-50">
                          {o.thumbnailImage ? (
                            <Image
                              src={o.thumbnailImage}
                              alt={o.firstItemName || o.orderNumber}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Package className="h-6 w-6 text-charcoal-200" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="font-mono text-sm font-semibold text-charcoal-700">
                                {o.orderNumber}
                              </p>
                              <p className="text-xs text-charcoal-400">
                                {formatDate(o.createdAt)} · {o.itemCount} item
                                {o.itemCount === 1 ? "" : "s"}
                              </p>
                              {o.firstItemName && (
                                <p className="mt-0.5 truncate text-xs text-charcoal-500">
                                  {o.firstItemName}
                                  {o.itemCount > 1 ? " + more" : ""}
                                </p>
                              )}
                            </div>
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                                statusColor(o.status)
                              )}
                            >
                              {statusLabel(o.status)}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                            <p className="font-mono text-sm font-semibold text-gold-700">
                              {formatCurrency(o.totalAmount)}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              {o.trackingUrl && (
                                <a
                                  href={o.trackingUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs font-medium text-charcoal-500 hover:text-charcoal-700"
                                >
                                  <Truck className="h-3.5 w-3.5" />
                                  Carrier
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                              <Link
                                href={trackHref}
                                className="inline-flex items-center gap-1 rounded-full bg-gold-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gold-600"
                              >
                                Track order
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        {tab === "password" && (
          <section className="mt-6 rounded-xl border border-charcoal-100 bg-white p-5 shadow-card sm:max-w-md">
            <ChangePasswordForm />
          </section>
        )}
      </div>
    </div>
  );
}
