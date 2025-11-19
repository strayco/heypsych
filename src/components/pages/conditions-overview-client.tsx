"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Brain,
  ArrowRight,
  ArrowLeft,
  Zap,
  Target,
  Shield,
  Waves,
  Heart,
  Eye,
  Puzzle,
  Wine,
  AlertCircle,
  MoreHorizontal,
} from "lucide-react";
import { Entity } from "@/lib/types/database";

const conditionCategories = [
  {
    title: "Mood & Depression",
    description:
      "Major depression, bipolar disorder, seasonal depression, and mood-related conditions",
    icon: Brain,
    gradient: "from-blue-500 to-cyan-500",
    hoverGradient: "group-hover:from-blue-600 group-hover:to-cyan-600",
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600",
    href: "/conditions/mood-depression",
    emoji: "💙",
  },
  {
    title: "Anxiety & Fear",
    description:
      "Generalized anxiety, panic disorder, social anxiety, phobias, and fear-based conditions",
    icon: Zap,
    gradient: "from-yellow-500 to-orange-500",
    hoverGradient: "group-hover:from-yellow-600 group-hover:to-orange-600",
    bgColor: "bg-yellow-50",
    iconColor: "text-yellow-600",
    href: "/conditions/anxiety-fear",
    emoji: "😰",
  },
  {
    title: "Attention & Learning",
    description: "ADHD, learning disorders, focus issues, and cognitive development conditions",
    icon: Target,
    gradient: "from-purple-500 to-pink-500",
    hoverGradient: "group-hover:from-purple-600 group-hover:to-pink-600",
    bgColor: "bg-purple-50",
    iconColor: "text-purple-600",
    href: "/conditions/attention-learning",
    emoji: "🎯",
  },
  {
    title: "Trauma & Stress",
    description: "PTSD, acute stress disorder, adjustment disorders, and trauma-related conditions",
    icon: Shield,
    gradient: "from-red-500 to-rose-500",
    hoverGradient: "group-hover:from-red-600 group-hover:to-rose-600",
    bgColor: "bg-red-50",
    iconColor: "text-red-600",
    href: "/conditions/trauma-stress",
    emoji: "💔",
  },
  {
    title: "Obsessive & Compulsive",
    description: "OCD, body dysmorphic disorder, hoarding, and repetitive behavior conditions",
    icon: Waves,
    gradient: "from-teal-500 to-emerald-500",
    hoverGradient: "group-hover:from-teal-600 group-hover:to-emerald-600",
    bgColor: "bg-teal-50",
    iconColor: "text-teal-600",
    href: "/conditions/obsessive-compulsive",
    emoji: "🔄",
  },
  {
    title: "Eating & Body Image",
    description: "Anorexia, bulimia, binge eating disorder, and body image-related conditions",
    icon: Heart,
    gradient: "from-pink-500 to-fuchsia-500",
    hoverGradient: "group-hover:from-pink-600 group-hover:to-fuchsia-600",
    bgColor: "bg-pink-50",
    iconColor: "text-pink-600",
    href: "/conditions/eating-body-image",
    emoji: "🍽️",
  },
  {
    title: "Psychotic Disorders",
    description:
      "Schizophrenia, schizoaffective disorder, delusional disorder, and psychotic conditions",
    icon: Eye,
    gradient: "from-indigo-500 to-violet-500",
    hoverGradient: "group-hover:from-indigo-600 group-hover:to-violet-600",
    bgColor: "bg-indigo-50",
    iconColor: "text-indigo-600",
    href: "/conditions/psychotic-disorders",
    emoji: "👁️",
  },
  {
    title: "Personality Disorders",
    description: "Borderline, narcissistic, antisocial, and other personality-related conditions",
    icon: Puzzle,
    gradient: "from-slate-500 to-gray-500",
    hoverGradient: "group-hover:from-slate-600 group-hover:to-gray-600",
    bgColor: "bg-slate-50",
    iconColor: "text-neutral-800",
    href: "/conditions/personality-disorders",
    emoji: "🧩",
  },
  {
    title: "Substance Use Disorders",
    description: "Alcohol, drug addiction, gambling addiction, and substance-related conditions",
    icon: Wine,
    gradient: "from-amber-500 to-orange-500",
    hoverGradient: "group-hover:from-amber-600 group-hover:to-orange-600",
    bgColor: "bg-amber-50",
    iconColor: "text-amber-600",
    href: "/conditions/substance-use-disorders",
    emoji: "🚫",
  },
  {
    title: "Autism & Development",
    description: "Autism spectrum disorders, developmental delays, and communication disorders",
    icon: Puzzle,
    gradient: "from-emerald-500 to-green-500",
    hoverGradient: "group-hover:from-emerald-600 group-hover:to-green-600",
    bgColor: "bg-emerald-50",
    iconColor: "text-emerald-600",
    href: "/conditions/autism-development",
    emoji: "🧩",
  },
  {
    title: "Dementia & Memory",
    description: "Alzheimer's disease, dementia, memory loss, and cognitive decline conditions",
    icon: Brain,
    gradient: "from-violet-500 to-purple-500",
    hoverGradient: "group-hover:from-violet-600 group-hover:to-purple-600",
    bgColor: "bg-violet-50",
    iconColor: "text-violet-600",
    href: "/conditions/dementia-memory",
    emoji: "🧠",
  },
  {
    title: "Behavioral Disorders",
    description:
      "Conduct disorder, oppositional defiant disorder, and disruptive behavior conditions",
    icon: AlertCircle,
    gradient: "from-orange-500 to-red-500",
    hoverGradient: "group-hover:from-orange-600 group-hover:to-red-600",
    bgColor: "bg-orange-50",
    iconColor: "text-orange-600",
    href: "/conditions/behavioral-disorders",
    emoji: "⚡",
  },
];

const otherConditionsCategory = {
  title: "Other Conditions",
  description:
    "Sleep disorders, sexual health, dissociative disorders, and other specialized conditions",
  icon: MoreHorizontal,
  gradient: "from-slate-400 to-gray-400",
  hoverGradient: "group-hover:from-slate-500 group-hover:to-gray-500",
  bgColor: "bg-slate-50",
  iconColor: "text-neutral-800",
  href: "/conditions/other",
  emoji: "🔍",
  isSecondary: true,
};

interface ConditionsOverviewClientProps {
  conditions: Entity[];
}

export function ConditionsOverviewClient({ conditions }: ConditionsOverviewClientProps) {
  const renderConditionTile = (category: any, index: number) => {
    const IconComponent = category.icon;

    return (
      <Link key={category.href} href={category.href} className="group block">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`relative h-full overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg transition-all duration-500 group-hover:-translate-y-1 hover:shadow-xl ${
            category.isSecondary ? "opacity-90 hover:opacity-100" : ""
          }`}
        >
          <div
            className={`absolute inset-0 bg-gradient-to-br ${category.gradient} ${category.hoverGradient} opacity-5 transition-opacity duration-500 group-hover:opacity-10`}
          />

          <div className="relative p-4">
            <div className="mb-3 text-center">
              <div className="mb-2 flex items-center justify-center gap-2">
                <div
                  className={`inline-flex rounded-xl p-2 ${category.bgColor} transition-transform duration-300 group-hover:scale-110`}
                >
                  <IconComponent className={`h-5 w-5 ${category.iconColor}`} />
                </div>
                <div className="text-xl">{category.emoji}</div>
              </div>
              <h3 className="mb-2 text-base font-bold text-neutral-900 transition-colors group-hover:text-neutral-900">
                {category.title}
              </h3>
            </div>

            <p className="mb-3 min-h-[2.5rem] text-center text-xs leading-relaxed text-neutral-900">
              {category.description}
            </p>

            <div className="flex items-center justify-center gap-1 text-xs font-semibold">
              <span className={`bg-gradient-to-r ${category.gradient} bg-clip-text text-transparent`}>
                Learn More
              </span>
              <ArrowRight className="h-3 w-3 text-neutral-500 transition-transform duration-300 group-hover:translate-x-1" />
            </div>
          </div>

          <div className="absolute inset-0 rounded-2xl ring-2 ring-transparent transition-all duration-300 group-hover:ring-neutral-200" />
        </motion.div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <section className="relative px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" className="group">
                <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to Home
              </Button>
            </Link>

            <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Mental Health Conditions
              </span>
            </h1>

            <div className="w-[140px]"></div>
          </div>

          <div className="mb-8 text-center">
            <p className="mx-auto mb-4 max-w-2xl text-sm text-neutral-900">
              Browse comprehensive information about mental health conditions, symptoms, diagnosis, and
              evidence-based treatment options.
            </p>

            <div className="flex items-center justify-center gap-4 text-xs text-neutral-900">
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                {conditions.length}+ Conditions
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                Evidence-Based
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-500"></div>
                Medically Reviewed
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {conditionCategories.map(renderConditionTile)}
            {renderConditionTile(otherConditionsCategory, conditionCategories.length)}
          </div>
        </div>
      </section>
    </div>
  );
}
