import {
  Brain,
  Zap,
  Target,
  Shield,
  Waves,
  Heart,
  Eye,
  Puzzle,
  Wine,
  AlertCircle,
  Moon,
  LucideIcon,
} from "lucide-react";

export interface CategoryConfig {
  slug: string;
  displayTitle: string; // SEO-optimized title
  subtitle: string; // Human-readable explanation
  emoji: string;
  icon: LucideIcon;
  gradient: string;
  hoverGradient: string;
  bgColor: string;
  iconColor: string;
  href: string;
  description: string; // For category hub meta description
  keywords: string[]; // Category-specific SEO keywords
}

/**
 * 13 Condition Categories (SEO-Optimized)
 *
 * Design principle:
 * - Keep existing URL slugs/routes (backward compatible)
 * - Update display titles for SEO (keyword-aligned)
 * - Derive category display titles from this config at runtime
 */
export const CONDITION_CATEGORIES: CategoryConfig[] = [
  {
    slug: "mood-depression",
    displayTitle: "Depression & Bipolar (Mood Disorders)",
    subtitle: "Major depression, bipolar disorder, seasonal affective disorder",
    emoji: "💙",
    icon: Brain,
    gradient: "from-blue-500 to-cyan-500",
    hoverGradient: "group-hover:from-blue-600 group-hover:to-cyan-600",
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600",
    href: "/conditions/mood-depression",
    description:
      "Comprehensive guide to mood disorders including major depression, bipolar disorder, and seasonal affective disorder with evidence-based treatments.",
    keywords: [
      "depression",
      "bipolar disorder",
      "mood disorders",
      "MDD",
      "SAD",
      "major depressive disorder",
      "manic depression",
    ],
  },
  {
    slug: "anxiety-fear",
    displayTitle: "Anxiety & Panic Disorders",
    subtitle:
      "Generalized anxiety, panic disorder, social anxiety, phobias, and fear-based conditions",
    emoji: "😰",
    icon: Zap,
    gradient: "from-yellow-500 to-orange-500",
    hoverGradient: "group-hover:from-yellow-600 group-hover:to-orange-600",
    bgColor: "bg-yellow-50",
    iconColor: "text-yellow-600",
    href: "/conditions/anxiety-fear",
    description:
      "Evidence-based information on anxiety disorders including generalized anxiety disorder (GAD), panic disorder, social anxiety, and phobias with treatment options.",
    keywords: [
      "anxiety",
      "panic disorder",
      "GAD",
      "social anxiety",
      "phobias",
      "panic attacks",
      "generalized anxiety",
    ],
  },
  {
    slug: "attention-learning",
    displayTitle: "ADHD & Learning Disorders",
    subtitle:
      "ADHD, learning disorders, focus issues, and cognitive development conditions",
    emoji: "🎯",
    icon: Target,
    gradient: "from-purple-500 to-pink-500",
    hoverGradient: "group-hover:from-purple-600 group-hover:to-pink-600",
    bgColor: "bg-purple-50",
    iconColor: "text-purple-600",
    href: "/conditions/attention-learning",
    description:
      "Complete guide to ADHD (attention-deficit/hyperactivity disorder), ADD, learning disabilities, and attention disorders with diagnosis and treatment information.",
    keywords: [
      "ADHD",
      "ADD",
      "learning disorders",
      "attention deficit",
      "hyperactivity",
      "dyslexia",
      "focus issues",
    ],
  },
  {
    slug: "trauma-stress",
    displayTitle: "PTSD & Trauma-Related Disorders",
    subtitle:
      "PTSD, acute stress disorder, adjustment disorders, and trauma-related conditions",
    emoji: "💔",
    icon: Shield,
    gradient: "from-red-500 to-rose-500",
    hoverGradient: "group-hover:from-red-600 group-hover:to-rose-600",
    bgColor: "bg-red-50",
    iconColor: "text-red-600",
    href: "/conditions/trauma-stress",
    description:
      "Expert information on post-traumatic stress disorder (PTSD), complex PTSD, acute stress disorder, and trauma-related conditions with evidence-based treatments.",
    keywords: [
      "PTSD",
      "post-traumatic stress",
      "trauma",
      "complex PTSD",
      "acute stress disorder",
      "trauma recovery",
    ],
  },
  {
    slug: "obsessive-compulsive",
    displayTitle: "OCD & Related Disorders",
    subtitle:
      "OCD, body dysmorphic disorder, hoarding, and repetitive behavior conditions",
    emoji: "🔄",
    icon: Waves,
    gradient: "from-teal-500 to-emerald-500",
    hoverGradient: "group-hover:from-teal-600 group-hover:to-emerald-600",
    bgColor: "bg-teal-50",
    iconColor: "text-teal-600",
    href: "/conditions/obsessive-compulsive",
    description:
      "Comprehensive information on obsessive-compulsive disorder (OCD), body dysmorphic disorder, hoarding disorder, and related conditions with treatment options.",
    keywords: [
      "OCD",
      "obsessive-compulsive disorder",
      "body dysmorphia",
      "hoarding",
      "intrusive thoughts",
      "compulsions",
    ],
  },
  {
    slug: "eating-body-image",
    displayTitle: "Eating Disorders & Body Image",
    subtitle:
      "Anorexia, bulimia, binge eating disorder, and body image-related conditions",
    emoji: "🍽️",
    icon: Heart,
    gradient: "from-pink-500 to-fuchsia-500",
    hoverGradient: "group-hover:from-pink-600 group-hover:to-fuchsia-600",
    bgColor: "bg-pink-50",
    iconColor: "text-pink-600",
    href: "/conditions/eating-body-image",
    description:
      "Expert guide to eating disorders including anorexia nervosa, bulimia nervosa, binge eating disorder, and body image conditions with recovery information.",
    keywords: [
      "eating disorders",
      "anorexia",
      "bulimia",
      "binge eating",
      "body image",
      "body dysmorphia",
      "disordered eating",
    ],
  },
  {
    slug: "psychotic-disorders",
    displayTitle: "Schizophrenia & Psychotic Disorders",
    subtitle:
      "Schizophrenia, schizoaffective disorder, delusional disorder, and psychotic conditions",
    emoji: "👁️",
    icon: Eye,
    gradient: "from-indigo-500 to-violet-500",
    hoverGradient: "group-hover:from-indigo-600 group-hover:to-violet-600",
    bgColor: "bg-indigo-50",
    iconColor: "text-indigo-600",
    href: "/conditions/psychotic-disorders",
    description:
      "Comprehensive information on schizophrenia, schizoaffective disorder, delusional disorder, and psychotic disorders with evidence-based treatment options.",
    keywords: [
      "schizophrenia",
      "psychosis",
      "schizoaffective disorder",
      "delusions",
      "hallucinations",
      "psychotic disorders",
    ],
  },
  {
    slug: "personality-disorders",
    displayTitle: "Personality Disorders",
    subtitle:
      "Borderline, narcissistic, antisocial, and other personality-related conditions",
    emoji: "🧩",
    icon: Puzzle,
    gradient: "from-slate-500 to-gray-500",
    hoverGradient: "group-hover:from-slate-600 group-hover:to-gray-600",
    bgColor: "bg-slate-50",
    iconColor: "text-neutral-800",
    href: "/conditions/personality-disorders",
    description:
      "Expert guide to personality disorders including borderline personality disorder (BPD), narcissistic, antisocial, and other personality conditions with treatment information.",
    keywords: [
      "personality disorders",
      "borderline personality",
      "BPD",
      "narcissistic",
      "antisocial",
      "personality",
    ],
  },
  {
    slug: "substance-use-disorders",
    displayTitle: "Substance Use & Addiction",
    subtitle:
      "Alcohol, drug addiction, gambling addiction, and substance-related conditions",
    emoji: "🚫",
    icon: Wine,
    gradient: "from-amber-500 to-orange-500",
    hoverGradient: "group-hover:from-amber-600 group-hover:to-orange-600",
    bgColor: "bg-amber-50",
    iconColor: "text-amber-600",
    href: "/conditions/substance-use-disorders",
    description:
      "Comprehensive information on substance use disorders, addiction, alcohol use disorder, drug addiction, and recovery resources with evidence-based treatments.",
    keywords: [
      "addiction",
      "substance use",
      "alcohol use disorder",
      "drug addiction",
      "recovery",
      "substance abuse",
    ],
  },
  {
    slug: "autism-development",
    displayTitle: "Autism & Neurodevelopmental Disorders",
    subtitle:
      "Autism spectrum disorders, developmental delays, and communication disorders",
    emoji: "🧩",
    icon: Puzzle,
    gradient: "from-emerald-500 to-green-500",
    hoverGradient: "group-hover:from-emerald-600 group-hover:to-green-600",
    bgColor: "bg-emerald-50",
    iconColor: "text-emerald-600",
    href: "/conditions/autism-development",
    description:
      "Expert guide to autism spectrum disorder (ASD), Asperger's, developmental delays, and neurodevelopmental conditions with support and intervention information.",
    keywords: [
      "autism",
      "ASD",
      "autism spectrum",
      "Asperger's",
      "neurodevelopmental",
      "developmental delays",
    ],
  },
  {
    slug: "dementia-memory",
    displayTitle: "Dementia & Alzheimer's (Neurocognitive Disorders)",
    subtitle:
      "Alzheimer's disease, dementia, memory loss, and cognitive decline conditions",
    emoji: "🧠",
    icon: Brain,
    gradient: "from-violet-500 to-purple-500",
    hoverGradient: "group-hover:from-violet-600 group-hover:to-purple-600",
    bgColor: "bg-violet-50",
    iconColor: "text-violet-600",
    href: "/conditions/dementia-memory",
    description:
      "Comprehensive information on Alzheimer's disease, dementia, memory loss, and neurocognitive disorders with care and treatment guidance.",
    keywords: [
      "Alzheimer's",
      "dementia",
      "memory loss",
      "cognitive decline",
      "neurocognitive",
      "Alzheimer's disease",
    ],
  },
  {
    slug: "behavioral-disorders",
    displayTitle: "Disruptive Behavior Disorders (ODD / Conduct)",
    subtitle:
      "Conduct disorder, oppositional defiant disorder, and disruptive behavior conditions",
    emoji: "⚡",
    icon: AlertCircle,
    gradient: "from-orange-500 to-red-500",
    hoverGradient: "group-hover:from-orange-600 group-hover:to-red-600",
    bgColor: "bg-orange-50",
    iconColor: "text-orange-600",
    href: "/conditions/behavioral-disorders",
    description:
      "Expert information on disruptive behavior disorders including oppositional defiant disorder (ODD), conduct disorder, and behavioral conditions with intervention strategies.",
    keywords: [
      "ODD",
      "oppositional defiant disorder",
      "conduct disorder",
      "disruptive behavior",
      "behavioral disorders",
    ],
  },
  {
    slug: "sleep-disorders",
    displayTitle: "Sleep & Insomnia",
    subtitle:
      "Insomnia, sleep apnea, narcolepsy, and other sleep-related disorders",
    emoji: "🌙",
    icon: Moon,
    gradient: "from-blue-500 to-indigo-500",
    hoverGradient: "group-hover:from-blue-600 group-hover:to-indigo-600",
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600",
    href: "/conditions/sleep-disorders",
    description:
      "Comprehensive guide to sleep disorders including insomnia, sleep apnea, narcolepsy, and circadian rhythm disorders with treatment options.",
    keywords: [
      "insomnia",
      "sleep disorders",
      "sleep apnea",
      "narcolepsy",
      "sleep problems",
      "circadian rhythm",
    ],
  },
  {
    slug: "sexual-health",
    displayTitle: "Sex & Sexual Health",
    subtitle:
      "Sexual dysfunctions, gender dysphoria, and sexual health conditions",
    emoji: "💗",
    icon: Heart,
    gradient: "from-rose-500 to-pink-500",
    hoverGradient: "group-hover:from-rose-600 group-hover:to-pink-600",
    bgColor: "bg-rose-50",
    iconColor: "text-rose-600",
    href: "/conditions/sexual-health",
    description:
      "Expert information on sexual dysfunctions, gender dysphoria, and sexual health conditions with treatment and support resources.",
    keywords: [
      "sexual dysfunction",
      "gender dysphoria",
      "sexual health",
      "erectile dysfunction",
      "arousal disorders",
      "paraphilias",
    ],
  },
  {
    slug: "dissociative-disorders",
    displayTitle: "Dissociative Disorders",
    subtitle:
      "Dissociative identity disorder, depersonalization, and dissociative amnesia",
    emoji: "🔀",
    icon: Puzzle,
    gradient: "from-cyan-500 to-blue-500",
    hoverGradient: "group-hover:from-cyan-600 group-hover:to-blue-600",
    bgColor: "bg-cyan-50",
    iconColor: "text-cyan-600",
    href: "/conditions/dissociative-disorders",
    description:
      "Comprehensive information on dissociative disorders including dissociative identity disorder (DID), depersonalization/derealization, and dissociative amnesia.",
    keywords: [
      "dissociative identity disorder",
      "DID",
      "depersonalization",
      "derealization",
      "dissociative amnesia",
      "dissociation",
    ],
  },
  {
    slug: "somatic-health-anxiety",
    displayTitle: "Somatic & Health Anxiety",
    subtitle:
      "Somatic symptom disorder, illness anxiety, and conversion disorder",
    emoji: "🩺",
    icon: AlertCircle,
    gradient: "from-lime-500 to-green-500",
    hoverGradient: "group-hover:from-lime-600 group-hover:to-green-600",
    bgColor: "bg-lime-50",
    iconColor: "text-lime-600",
    href: "/conditions/somatic-health-anxiety",
    description:
      "Expert guide to somatic symptom disorder, illness anxiety disorder (hypochondriasis), and conversion disorder with evidence-based treatments.",
    keywords: [
      "somatic symptom disorder",
      "illness anxiety",
      "hypochondriasis",
      "conversion disorder",
      "health anxiety",
      "somatization",
    ],
  },
];

/**
 * Get category config by slug
 */
export function getCategoryBySlug(slug: string): CategoryConfig | undefined {
  return CONDITION_CATEGORIES.find((cat) => cat.slug === slug);
}

/**
 * Get serializable category config (without icon component) for client components
 */
export function getSerializableCategoryBySlug(slug: string) {
  const category = getCategoryBySlug(slug);
  if (!category) return undefined;

  // Omit icon property for client component compatibility
  const { icon, ...serializable } = category;
  return serializable;
}

/**
 * Get category display title by slug (for deriving from condition metadata.category)
 */
export function getCategoryDisplayTitle(slug: string): string {
  const category = getCategoryBySlug(slug);
  return category?.displayTitle || slug;
}

/**
 * Get all category slugs
 */
export function getAllCategorySlugs(): string[] {
  return CONDITION_CATEGORIES.map((cat) => cat.slug);
}
