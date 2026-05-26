"use client";

import { Phone, MessageCircle, Mail } from "lucide-react";
import { trackContact } from "@/lib/analytics";

export function ContactLinks() {
  return (
    <div className="mt-4 space-y-4">
      <a
        href="tel:+919654148574"
        onClick={() => trackContact({ type: "call" })}
        className="flex items-center gap-3 text-sm text-charcoal-500 transition-colors hover:text-gold-600"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold-50 text-gold-600">
          <Phone className="h-4 w-4" />
        </div>
        <div>
          <p className="font-medium text-charcoal-700">Phone</p>
          <p>+91 96541 48574</p>
        </div>
      </a>

      <a
        href="https://wa.me/919654148574"
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackContact({ type: "whatsapp" })}
        className="flex items-center gap-3 text-sm text-charcoal-500 transition-colors hover:text-gold-600"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
          <MessageCircle className="h-4 w-4" />
        </div>
        <div>
          <p className="font-medium text-charcoal-700">WhatsApp</p>
          <p>Chat with us</p>
        </div>
      </a>

      <a
        href="mailto:info@evaanjewels.com"
        className="flex items-center gap-3 text-sm text-charcoal-500 transition-colors hover:text-gold-600"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <Mail className="h-4 w-4" />
        </div>
        <div>
          <p className="font-medium text-charcoal-700">Email</p>
          <p>info@evaanjewels.com</p>
        </div>
      </a>
    </div>
  );
}
