"use client";

import { motion } from "framer-motion";
import { Shield, Award, Gem, Clock } from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/animations";

const badges = [
  {
    icon: Shield,
    title: "BIS Hallmark",
    description: "Every piece certified for purity",
  },
  {
    icon: Award,
    title: "20+ Years Trust",
    description: "Serving families since 2005",
  },
  {
    icon: Gem,
    title: "Premium Craftsmanship",
    description: "Handcrafted by master artisans",
  },
  {
    icon: Clock,
    title: "Lifetime Exchange",
    description: "Easy exchange & upgrade policy",
  },
];

export function TrustBadges() {
  return (
    <section className="bg-charcoal-50/50 py-8 md:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-2 gap-6 md:grid-cols-4"
        >
          {badges.map((badge) => (
            <motion.div
              key={badge.title}
              variants={staggerItem}
              className="flex flex-col items-center text-center"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-100 text-gold-600">
                <badge.icon className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-charcoal-700">
                {badge.title}
              </h3>
              <p className="mt-1 text-xs text-charcoal-400 leading-relaxed">
                {badge.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
