import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { APP_NAME } from "@/constants";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Privacy Policy",
  description: `Privacy Policy for ${APP_NAME}. Learn how we collect, use, and protect your personal information.`,
  path: "/privacy-policy",
});

export default function PrivacyPolicyPage() {
  return (
    <div className="py-8 md:py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Breadcrumb
          homeHref="/"
          items={[
            { label: "Home", href: "/" },
            { label: "Privacy Policy" },
          ]}
        />

        <h1 className="mt-6 font-heading text-3xl font-bold text-charcoal-700 sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-charcoal-400">
          Last updated: February 2026
        </p>

        <div className="prose-charcoal mt-8 space-y-8 text-sm leading-relaxed text-charcoal-500">
          <section>
            <h2 className="text-lg font-semibold text-charcoal-700">
              1. Information We Collect
            </h2>
            <p className="mt-2">
              When you visit our website or make a purchase, we may collect the
              following types of information:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong>Personal Information:</strong> Name, email address, phone
                number, and shipping address when you contact us or place an order.
              </li>
              <li>
                <strong>Usage Data:</strong> Information about how you interact with
                our website, including pages visited, time spent, and browsing
                patterns.
              </li>
              <li>
                <strong>Device Information:</strong> Browser type, operating system,
                and device type for optimizing your experience.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-charcoal-700">
              2. How We Use Your Information
            </h2>
            <p className="mt-2">We use the collected information to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Process and fulfill your orders and inquiries</li>
              <li>Communicate with you about our products and services</li>
              <li>Improve our website and customer experience</li>
              <li>Send promotional communications (with your consent)</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-charcoal-700">
              3. Information Sharing
            </h2>
            <p className="mt-2">
              We do not sell, trade, or rent your personal information to third
              parties. We may share your information only with trusted service
              providers who assist us in operating our website and conducting our
              business, subject to confidentiality agreements.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-charcoal-700">
              4. Data Security
            </h2>
            <p className="mt-2">
              We implement appropriate security measures to protect your personal
              information against unauthorized access, alteration, disclosure, or
              destruction. However, no method of transmission over the Internet is
              100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-charcoal-700">
              5. Cookies
            </h2>
            <p className="mt-2">
              Our website uses cookies to enhance your browsing experience. You can
              choose to disable cookies through your browser settings, though this
              may affect some functionality.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-charcoal-700">
              6. Your Rights
            </h2>
            <p className="mt-2">You have the right to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Access and receive a copy of your personal data</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt out of marketing communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-charcoal-700">
              7. Contact Us
            </h2>
            <p className="mt-2">
              If you have any questions about this Privacy Policy, please contact us
              at:
            </p>
            <ul className="mt-2 space-y-1 pl-0">
              <li>
                <strong>Email:</strong> info@evaanjewels.com
              </li>
              <li>
                <strong>Phone:</strong> +91 96541 48574
              </li>
              <li>
                <strong>Address:</strong> 2nd Floor, B-169, Mohan Garden, Uttam Nagar,
                Delhi — 110059
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
