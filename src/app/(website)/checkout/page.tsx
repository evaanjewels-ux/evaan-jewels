import type { Metadata } from "next";
import { CheckoutClient } from "./CheckoutClient";

export const metadata: Metadata = {
  title: "Checkout | Evaan Jewels",
  description: "Complete your jewelry order securely with Razorpay.",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}
