import { createMetadata } from "@/lib/seo";
import { CheckoutClient } from "./CheckoutClient";

export const metadata = createMetadata({
  title: "Checkout",
  description:
    "Complete your purchase at Evaan Jewels. Secure checkout with UPI, bank transfer, or cash on delivery.",
  path: "/checkout",
  noIndex: true,
});

export default function CheckoutPage() {
  return <CheckoutClient />;
}
