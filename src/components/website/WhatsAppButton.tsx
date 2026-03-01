"use client";

import { MessageCircle } from "lucide-react";

export function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/919654148574?text=Hi%20Evaan%20Jewels%2C%20I%27m%20interested%20in%20your%20jewelry%20collection."
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-all duration-200 hover:scale-110 hover:shadow-xl active:scale-95 md:bottom-8 md:right-8"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
