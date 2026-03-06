import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wishlist | Evaan Jewels",
  description: "Your saved items — Evaan Jewels wishlist.",
};

export default function WishlistPage() {
  return <WishlistClient />;
}

import { WishlistClient } from "./WishlistClient";
