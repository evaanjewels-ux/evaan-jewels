import { Metadata } from "next";
import { TrackOrderClient } from "./TrackOrderClient";

export const metadata: Metadata = {
  title: "Track Your Order | Evaan Jewels",
  description:
    "Track your Evaan Jewels order status in real-time. Enter your order number and phone number to view current status, payment details, and delivery timeline.",
  openGraph: {
    title: "Track Your Order | Evaan Jewels",
    description:
      "Track your Evaan Jewels order status in real-time.",
  },
};

export default function TrackOrderPage() {
  return <TrackOrderClient />;
}
