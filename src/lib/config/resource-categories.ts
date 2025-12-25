/**
 * Resource Category Configuration
 *
 * Defines the canonical list of resource categories for the /resources section.
 * Mirrors the pattern established in condition-categories.ts for consistency.
 */

import { Brain, HeartPulse, Smartphone, Users, type LucideIcon } from "lucide-react";

export interface ResourceCategoryConfig {
  slug: string;
  displayTitle: string;
  subtitle: string;
  emoji: string;
  icon: LucideIcon;
  gradient: string;
  hoverGradient: string;
  bgColor: string;
  iconColor: string;
  href: string;
  description: string;
  keywords: string[];
}

/**
 * Canonical list of resource categories
 * Order determines display order on /resources hub
 */
export const RESOURCE_CATEGORIES: ResourceCategoryConfig[] = [
  {
    slug: "assessments-screeners",
    displayTitle: "Assessments & Screeners",
    subtitle: "Evidence-based screening tools",
    emoji: "📋",
    icon: Brain,
    gradient: "from-blue-500 to-indigo-600",
    hoverGradient: "from-blue-600 to-indigo-700",
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600",
    href: "/resources/assessments-screeners",
    description: "Validated mental health screening tools and assessments to help identify symptoms and guide treatment decisions.",
    keywords: [
      "depression screener",
      "anxiety test",
      "PHQ-9",
      "GAD-7",
      "mental health assessment",
      "ADHD screening",
      "substance use screening"
    ]
  },
  {
    slug: "support-community",
    displayTitle: "Support & Community",
    subtitle: "Crisis support & resources",
    emoji: "🤝",
    icon: Users,
    gradient: "from-green-500 to-emerald-600",
    hoverGradient: "from-green-600 to-emerald-700",
    bgColor: "bg-green-50",
    iconColor: "text-green-600",
    href: "/resources/support-community",
    description: "24/7 crisis helplines, support organizations, and community resources for mental health support and connection.",
    keywords: [
      "988",
      "crisis helpline",
      "suicide prevention",
      "NAMI",
      "mental health support",
      "crisis text line",
      "support groups"
    ]
  },
  {
    slug: "digital-tools",
    displayTitle: "Digital Tools & Apps",
    subtitle: "Mental health apps & platforms",
    emoji: "📱",
    icon: Smartphone,
    gradient: "from-purple-500 to-pink-600",
    hoverGradient: "from-purple-600 to-pink-700",
    bgColor: "bg-purple-50",
    iconColor: "text-purple-600",
    href: "/resources/digital-tools",
    description: "Curated mental health apps, online therapy platforms, and digital wellness tools to support your mental health journey.",
    keywords: [
      "mental health apps",
      "therapy apps",
      "meditation apps",
      "Headspace",
      "Calm",
      "BetterHelp",
      "Talkspace",
      "online therapy"
    ]
  },
  {
    slug: "knowledge-hub",
    displayTitle: "Knowledge Hub",
    subtitle: "Educational guides & articles",
    emoji: "📚",
    icon: HeartPulse,
    gradient: "from-orange-500 to-red-600",
    hoverGradient: "from-orange-600 to-red-700",
    bgColor: "bg-orange-50",
    iconColor: "text-orange-600",
    href: "/resources/knowledge-hub",
    description: "Evidence-based guides, how-to articles, and mental health education resources to help you understand and manage mental health.",
    keywords: [
      "therapy guide",
      "mental health education",
      "CBT explained",
      "finding a therapist",
      "mental health research",
      "how to guides"
    ]
  }
];

/**
 * Get category config by slug
 */
export function getCategoryBySlug(slug: string): ResourceCategoryConfig | undefined {
  return RESOURCE_CATEGORIES.find((cat) => cat.slug === slug);
}

/**
 * Get all category slugs (for validation)
 */
export function getAllCategorySlugs(): string[] {
  return RESOURCE_CATEGORIES.map((cat) => cat.slug);
}

/**
 * Validate if a category slug exists
 */
export function isValidCategory(slug: string): boolean {
  return RESOURCE_CATEGORIES.some((cat) => cat.slug === slug);
}
