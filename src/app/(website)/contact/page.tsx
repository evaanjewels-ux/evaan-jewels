import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { ContactForm } from "@/components/website/ContactForm";
import { JsonLd } from "@/components/shared/JsonLd";
import { createMetadata, localBusinessJsonLd, breadcrumbJsonLd, SITE_URL } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Contact Evaan Jewels — Visit, Call or WhatsApp",
  description:
    "Get in touch with Evaan Jewels in Mohan Garden, Uttam Nagar, Delhi. Call +91 96541 48574, WhatsApp us, or visit our store. Open Mon-Sat 10 AM - 8 PM.",
  path: "/contact",
  keywords: [
    "contact evaan jewels",
    "jewelry store location",
    "jewelry store phone",
    "jewelry shop uttam nagar",
    "jewelry shop mohan garden",
    "evaan jewels address",
    "evaan jewels phone number",
    "jewelry shop near me delhi",
  ],
});

export default function ContactPage() {
  return (
    <div className="py-8 md:py-12">
      <JsonLd data={localBusinessJsonLd()} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: SITE_URL },
          { name: "Contact", url: `${SITE_URL}/contact` },
        ])}
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumb
          homeHref="/"
          items={[
            { label: "Home", href: "/" },
            { label: "Contact" },
          ]}
        />

        <div className="mt-6">
          <h1 className="font-heading text-3xl font-bold text-charcoal-700 sm:text-4xl">
            Get In Touch
          </h1>
          <p className="mt-2 max-w-lg text-charcoal-400">
            We&apos;d love to hear from you. Visit our store, give us a call, or send us
            a message — we&apos;re here to help.
          </p>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-5 lg:gap-16">
          {/* Contact Form */}
          <div className="lg:col-span-3">
            <div className="rounded-xl border border-charcoal-100 bg-white p-6 shadow-card sm:p-8">
              <h2 className="text-xl font-semibold text-charcoal-700">
                Send Us a Message
              </h2>
              <p className="mt-1 text-sm text-charcoal-400">
                Fill out the form below and we&apos;ll get back to you within 24 hours.
              </p>
              <div className="mt-6">
                <ContactForm />
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-6 lg:col-span-2">
            {/* Quick Contact */}
            <div className="rounded-xl border border-charcoal-100 bg-white p-6 shadow-card">
              <h3 className="text-lg font-semibold text-charcoal-700">
                Quick Contact
              </h3>
              <div className="mt-4 space-y-4">
                <a
                  href="tel:+919654148574"
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
            </div>

            {/* Store Location */}
            <div className="rounded-xl border border-charcoal-100 bg-white p-6 shadow-card">
              <h3 className="text-lg font-semibold text-charcoal-700">
                Visit Our Store
              </h3>
              <div className="mt-4 space-y-3">
                <div className="flex items-start gap-3 text-sm text-charcoal-500">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" />
                  <span>
                    2nd Floor, B-169, Mohan Garden,<br />
                    Uttam Nagar, Delhi — 110059
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-charcoal-500">
                  <Clock className="h-4 w-4 shrink-0 text-gold-600" />
                  <span>Mon — Sat: 10:00 AM – 8:00 PM</span>
                </div>
              </div>

              {/* Map Embed */}
              <div className="mt-4 overflow-hidden rounded-lg">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14400!2d77.035!3d28.6219!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d04f5f1c1c1c1%3A0x1a1a1a1a1a1a1a1a!2sMohan%20Garden%2C%20Uttam%20Nagar%2C%20Delhi%20110059!5e0!3m2!1sen!2sin!4v1"
                  width="100%"
                  height="200"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Evaan Jewels Location"
                  className="rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
