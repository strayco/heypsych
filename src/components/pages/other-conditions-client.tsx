"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  MoreHorizontal,
  ArrowRight,
  Moon,
  Heart,
  User,
  Waves,
  Stethoscope,
  Eye,
  Droplet,
} from "lucide-react";

interface CategoryTile {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  href: string;
  emoji: string;
}

const otherCategories: CategoryTile[] = [
  {
    title: "Sleep Disorders",
    description: "Insomnia, sleep apnea, narcolepsy, and other sleep-wake disorders",
    icon: Moon,
    color: "indigo",
    href: "/conditions/other/sleep-disorders",
    emoji: "🌙",
  },
  {
    title: "Sexual Health",
    description: "Sexual dysfunctions and sexual health-related conditions",
    icon: Heart,
    color: "rose",
    href: "/conditions/other/sexual-disorders",
    emoji: "💕",
  },
  {
    title: "Gender Identity",
    description: "Gender dysphoria and gender identity-related conditions",
    icon: User,
    color: "purple",
    href: "/conditions/other/gender-disorders",
    emoji: "🏳️‍⚧️",
  },
  {
    title: "Dissociative Disorders",
    description: "Dissociative identity disorder, amnesia, and related conditions",
    icon: Waves,
    color: "cyan",
    href: "/conditions/other/dissociative-disorders",
    emoji: "🌀",
  },
  {
    title: "Somatic Disorders",
    description: "Somatic symptom disorders and illness-related conditions",
    icon: Stethoscope,
    color: "green",
    href: "/conditions/other/somatic-disorders",
    emoji: "🏥",
  },
  {
    title: "Elimination Disorders",
    description: "Enuresis, encopresis, and elimination-related conditions",
    icon: Droplet,
    color: "amber",
    href: "/conditions/other/elimination-disorders",
    emoji: "🚽",
  },
  {
    title: "Paraphilic Disorders",
    description: "Paraphilic disorders and related conditions",
    icon: Eye,
    color: "red",
    href: "/conditions/other/paraphilic-disorders",
    emoji: "🔞",
  },
];

export function OtherConditionsClient() {
  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <section className="relative px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Header Row */}
          <div className="mb-8 flex items-start justify-between">
            {/* Back Button */}
            <Link href="/conditions">
              <Button variant="ghost" className="group">
                <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to Conditions
              </Button>
            </Link>

            {/* Title Section */}
            <div className="flex-1 text-center">
              <div className="mb-4 inline-flex rounded-2xl bg-surface p-4">
                <MoreHorizontal className="h-8 w-8 text-label-tertiary" />
              </div>

              <h1 className="mb-4 text-3xl font-bold text-label-primary sm:text-4xl lg:text-5xl">
                🔍 Other Conditions
              </h1>

              <p className="mx-auto mb-6 max-w-3xl text-lg text-label-tertiary">
                Sleep disorders, sexual health, dissociative disorders, and other specialized mental
                health conditions.
              </p>

              {/* Stats */}
              <div className="flex items-center justify-center gap-6 text-sm text-label-primary0">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-surface0"></div>
                  {otherCategories.length} Categories
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-positive-tint0"></div>
                  Evidence-Based
                </div>
              </div>
            </div>

            {/* Spacer for alignment */}
            <div className="w-[220px]"></div>
          </div>
        </div>
      </section>

      {/* Other Category Tiles */}
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {otherCategories.map((category, index) => {
              const IconComponent = category.icon;
              return (
                <Link key={category.href} href={category.href} className="group block">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative h-full overflow-hidden rounded-2xl border border-separator bg-surface shadow-lg transition-all duration-500 group-hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="relative p-6">
                      {/* Icon and title */}
                      <div className="mb-4 text-center">
                        <div className="mb-3 flex items-center justify-center gap-3">
                          <div className="inline-flex rounded-xl bg-surface p-3 transition-transform duration-300 group-hover:scale-110">
                            <IconComponent className="h-6 w-6 text-label-tertiary" />
                          </div>
                          <div className="text-2xl">{category.emoji}</div>
                        </div>
                        <h3 className="mb-2 text-lg font-bold text-label-primary transition-colors group-hover:text-label-secondary">
                          {category.title}
                        </h3>
                      </div>

                      {/* Description */}
                      <p className="mb-4 min-h-[3rem] text-center text-sm leading-relaxed text-label-tertiary">
                        {category.description}
                      </p>

                      {/* Call to action */}
                      <div className="flex items-center justify-center gap-2 text-sm font-semibold">
                        <span className="text-label-tertiary">Explore</span>
                        <ArrowRight className="h-4 w-4 text-label-primary0 transition-transform duration-300 group-hover:translate-x-1" />
                      </div>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Back to Conditions */}
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <Link href="/conditions">
            <Button variant="outline" size="lg">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to All Conditions
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

















