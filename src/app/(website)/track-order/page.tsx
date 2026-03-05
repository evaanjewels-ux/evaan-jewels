import { createMetadata } from "@/lib/seo";
import { TrackOrderClient } from "./TrackOrderClient";

export const metadata = createMetadata({
  title: "Track Your Order",
  description:
    "Track your Evaan Jewels order status in real-time. Enter your order number and phone number to view current status, payment details, and delivery timeline.",
  path: "/track-order",
  keywords: [
    "track jewelry order",
    "order status",
    "evaan jewels order tracking",
    "jewelry delivery status",
  ],
});

export default function TrackOrderPage() {
  return <TrackOrderClient />;
}
