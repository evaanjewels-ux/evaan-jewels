import { Shield, Award, Gem, Clock, Heart, Users } from "lucide-react";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { TrustBadges } from "@/components/website/TrustBadges";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "About Us",
  description:
    "Learn about Evaan Jewels — over 20 years of crafting premium BIS Hallmark certified gold & diamond jewelry. Our story, values, and commitment to excellence.",
  path: "/about",
  keywords: ["about evaan jewels", "jewelry store history", "BIS hallmark certified", "trusted jeweler"],
});

const values = [
  {
    icon: Shield,
    title: "Purity Guaranteed",
    description:
      "Every piece of jewelry is BIS Hallmark certified, ensuring the highest standards of gold and diamond purity.",
  },
  {
    icon: Gem,
    title: "Master Craftsmanship",
    description:
      "Our artisans bring decades of expertise to every design, blending traditional techniques with modern aesthetics.",
  },
  {
    icon: Heart,
    title: "Customer First",
    description:
      "Your satisfaction is our priority. From selection to after-sales, we provide a premium, personalized experience.",
  },
  {
    icon: Users,
    title: "Family Legacy",
    description:
      "A family-owned business for over two decades, we build lasting relationships with our customers, generation after generation.",
  },
  {
    icon: Award,
    title: "Fair Pricing",
    description:
      "Transparent pricing with detailed breakdowns. We believe in earning trust through honesty and value.",
  },
  {
    icon: Clock,
    title: "Lifetime Exchange",
    description:
      "Our easy exchange and upgrade policy means your jewelry investment grows with you over time.",
  },
];

export default function AboutPage() {
  return (
    <div className="py-8 md:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumb
          homeHref="/"
          items={[
            { label: "Home", href: "/" },
            { label: "About Us" },
          ]}
        />

        {/* Hero */}
        <div className="mt-8 text-center">
          <h1 className="font-heading text-3xl font-bold text-charcoal-700 sm:text-4xl lg:text-5xl">
            Our Story
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-charcoal-400">
            For over two decades, Evaan Jewels has been at the heart of celebrations,
            crafting jewelry that marks life&apos;s most precious moments.
          </p>
        </div>

        {/* Story Section */}
        <div className="mt-14 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="relative aspect-4/3 overflow-hidden rounded-2xl bg-charcoal-100">
            <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-gold-100 to-gold-50">
              <div className="text-center">
                <p className="font-heading text-6xl font-bold text-gold-600">20+</p>
                <p className="mt-1 text-sm font-medium text-gold-700">Years of Trust</p>
              </div>
            </div>
          </div>
          <div>
            <h2 className="font-heading text-2xl font-bold text-charcoal-700 sm:text-3xl">
              A Legacy of Excellence
            </h2>
            <div className="mt-4 space-y-4 text-charcoal-400 leading-relaxed">
              <p>
                Founded in 2005, Evaan Jewels began as a small family workshop with
                a singular vision: to create jewelry that is as authentic and timeless as
                the bonds it celebrates.
              </p>
              <p>
                Over the years, we have grown from a local favorite to a trusted name
                known for impeccable craftsmanship, transparent pricing, and genuine
                customer relationships. Every piece that leaves our workshop carries our
                commitment to purity and artistry.
              </p>
              <p>
                Today, with a team of master artisans and modern design capabilities,
                we continue to blend traditional goldsmithing techniques with
                contemporary aesthetics — creating jewelry that tells your unique story.
              </p>
            </div>
          </div>
        </div>

        {/* Values */}
        <div className="mt-20">
          <div className="text-center">
            <h2 className="font-heading text-2xl font-bold text-charcoal-700 sm:text-3xl">
              Our Values
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-charcoal-400">
              The principles that guide every piece we create and every customer
              we serve.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((value) => (
              <div
                key={value.title}
                className="rounded-xl border border-charcoal-100 bg-white p-6 shadow-card transition-all duration-200 hover:shadow-card-hover"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gold-50 text-gold-600">
                  <value.icon className="h-6 w-6" strokeWidth={1.5} />
                </div>
                <h3 className="mt-4 text-base font-semibold text-charcoal-700">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-charcoal-400">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-16">
          <TrustBadges />
        </div>
      </div>
    </div>
  );
}
