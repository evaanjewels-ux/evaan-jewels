import {
  Clock,
  CheckCircle2,
  Package,
  Truck,
  Ban,
  Box,
  Layers,
  Flame,
  Sparkles,
  Gem,
  Wand2,
  type LucideIcon,
} from "lucide-react";

/** Main fulfillment path (excludes cancelled). */
export const ORDER_STATUS_FLOW = [
  "pending",
  "confirmed",
  "processing",
  "cad_3d_print",
  "wax_treeing",
  "lost_wax_casting",
  "filing_cleanup",
  "setting",
  "polishing_finish",
  "shipped",
  "delivered",
] as const;

export type OrderStatus =
  | (typeof ORDER_STATUS_FLOW)[number]
  | "cancelled";

export const ORDER_STATUS_VALUES: OrderStatus[] = [
  ...ORDER_STATUS_FLOW,
  "cancelled",
];

export const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; description: string; color: string; icon: LucideIcon }
> = {
  pending: {
    label: "Pending",
    description: "Order placed and awaiting confirmation",
    color: "text-yellow-600 bg-yellow-50",
    icon: Clock,
  },
  confirmed: {
    label: "Confirmed",
    description: "Payment verified and order confirmed",
    color: "text-blue-600 bg-blue-50",
    icon: CheckCircle2,
  },
  processing: {
    label: "Processing",
    description: "Order is being prepared for production",
    color: "text-indigo-600 bg-indigo-50",
    icon: Package,
  },
  cad_3d_print: {
    label: "CAD & 3D Print",
    description: "Digital design and 3D resin model in progress",
    color: "text-sky-600 bg-sky-50",
    icon: Box,
  },
  wax_treeing: {
    label: "Wax Treeing",
    description: "Wax models assembled onto a casting tree",
    color: "text-amber-600 bg-amber-50",
    icon: Layers,
  },
  lost_wax_casting: {
    label: "Lost-Wax Casting",
    description: "Metal cast using the lost-wax process",
    color: "text-orange-600 bg-orange-50",
    icon: Flame,
  },
  filing_cleanup: {
    label: "Filing & Clean-up",
    description: "Cast metal cleaned, filed, and refined",
    color: "text-stone-600 bg-stone-50",
    icon: Wand2,
  },
  setting: {
    label: "Setting",
    description: "Artisans setting stones into the piece",
    color: "text-rose-600 bg-rose-50",
    icon: Gem,
  },
  polishing_finish: {
    label: "Polishing & Finish",
    description: "Final polish and finishing touches",
    color: "text-teal-600 bg-teal-50",
    icon: Sparkles,
  },
  shipped: {
    label: "Shipped",
    description: "Order has been shipped",
    color: "text-purple-600 bg-purple-50",
    icon: Truck,
  },
  delivered: {
    label: "Delivered",
    description: "Order delivered successfully",
    color: "text-green-600 bg-green-50",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    description: "Order was cancelled",
    color: "text-red-600 bg-red-50",
    icon: Ban,
  },
};

export function getOrderStatusIndex(status: string): number {
  return ORDER_STATUS_FLOW.indexOf(
    status as (typeof ORDER_STATUS_FLOW)[number]
  );
}
