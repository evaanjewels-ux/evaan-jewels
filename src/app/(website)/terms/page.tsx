import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { APP_NAME } from "@/constants";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Terms & Conditions",
  description: `Terms and Conditions for ${APP_NAME}. Read our policies on purchases, returns, exchanges, and more.`,
  path: "/terms",
});

export default function TermsPage() {
  return (
    <div className="py-8 md:py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Breadcrumb
          homeHref="/"
          items={[
            { label: "Home", href: "/" },
            { label: "Terms & Conditions" },
          ]}
        />

        <h1 className="mt-6 font-heading text-3xl font-bold text-charcoal-700 sm:text-4xl">
          Terms &amp; Conditions
        </h1>
        <p className="mt-2 text-sm text-charcoal-400">
          Last updated: February 2026
        </p>

        <div className="prose-charcoal mt-8 space-y-8 text-sm leading-relaxed text-charcoal-500">
          <section>
            <h2 className="text-lg font-semibold text-charcoal-700">
              1. General Terms
            </h2>
            <p className="mt-2">
              By accessing and using the {APP_NAME} website, you agree to be bound
              by these Terms and Conditions. If you do not agree with any part of
              these terms, please do not use our website.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-charcoal-700">
              2. Products &amp; Pricing
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                All product prices are in Indian Rupees (INR) and include applicable
                GST.
              </li>
              <li>
                Metal and gemstone prices are subject to daily market fluctuations.
                The price displayed at the time of inquiry or purchase is the
                applicable price.
              </li>
              <li>
                Product images are for representation purposes. Actual products may
                vary slightly in appearance due to handcrafting.
              </li>
              <li>
                All gold jewelry is BIS Hallmark certified, guaranteeing purity as
                stated.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-charcoal-700">
              3. Purchases &amp; Payment
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                Purchases are currently facilitated through in-store visits. Online
                inquiries can be made via the website or WhatsApp.
              </li>
              <li>
                We accept cash, credit/debit cards, UPI, and bank transfers.
              </li>
              <li>
                A detailed bill with full price breakdown will be provided with every
                purchase.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-charcoal-700">
              4. Exchange &amp; Return Policy
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                Gold jewelry can be exchanged at prevailing market rates, subject to
                deductions for making charges and wastage.
              </li>
              <li>
                Diamond and gemstone jewelry exchange is subject to evaluation and
                applicable terms.
              </li>
              <li>
                Products must be in their original condition with all certificates
                and bills for exchange.
              </li>
              <li>
                Customized or made-to-order jewelry is non-returnable unless there is
                a manufacturing defect.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-charcoal-700">
              5. Certification &amp; Purity
            </h2>
            <p className="mt-2">
              All gold jewelry sold at {APP_NAME} is BIS Hallmark certified by the
              Bureau of Indian Standards, ensuring the purity of gold as marked.
              Certification details are provided on the jewelry and the accompanying
              bill.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-charcoal-700">
              6. Intellectual Property
            </h2>
            <p className="mt-2">
              All content on this website, including text, images, logos, and designs,
              is the property of {APP_NAME} and is protected by intellectual property
              laws. Content may not be reproduced without written permission.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-charcoal-700">
              7. Limitation of Liability
            </h2>
            <p className="mt-2">
              {APP_NAME} shall not be liable for any indirect, incidental, or
              consequential damages arising from the use of our website or products.
              Our liability is limited to the purchase price of the product in
              question.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-charcoal-700">
              8. Changes to Terms
            </h2>
            <p className="mt-2">
              We reserve the right to update these Terms and Conditions at any time.
              Changes will be posted on this page with an updated revision date.
              Continued use of the website constitutes acceptance of the revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-charcoal-700">
              9. Contact
            </h2>
            <p className="mt-2">
              For any questions regarding these terms, please contact us:
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
