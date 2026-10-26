/**
 * Guide Hub Page
 * 
 * Landing page for all programmatic SEO guides.
 * Dynamically shows statistics based on actual JSON data.
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { PageIntro } from "@/components/brand/PageIntro";
import { ArrowRight } from 'lucide-react';
import { getDynamicPageStats } from '@/lib/programmatic-seo/dynamic-generator';

export const metadata: Metadata = {
  title: 'Mental Health Treatment Guides',
  description: 'Comprehensive guides on medications, therapies, and treatments for mental health conditions. Evidence-based information tailored to your needs.',
  alternates: {
    canonical: 'https://heypsych.com/guide',
  },
  openGraph: {
    images: ["/images/og/heypsych.png"],
    title: 'Mental Health Treatment Guides',
    description: 'Comprehensive guides on medications, therapies, and treatments for mental health conditions.',
    url: 'https://heypsych.com/guide',
    type: 'website',
  },
};

// Popular guide categories with example links
const GUIDE_CATEGORIES = [
  {
    title: 'Anxiety Medications',
    description: 'Guides on medications commonly prescribed for anxiety disorders',
    icon: '💊',
    links: [
      { title: 'Lexapro for Anxiety', href: '/guide/lexapro-for-anxiety' },
      { title: 'Zoloft for Anxiety', href: '/guide/zoloft-for-anxiety' },
      { title: 'Buspirone for Anxiety', href: '/guide/buspirone-for-anxiety' },
      { title: 'Xanax for Panic', href: '/guide/xanax-for-panic-disorder' },
    ],
  },
  {
    title: 'Depression Treatments',
    description: 'Evidence-based guides for treating depression',
    icon: '🧠',
    links: [
      { title: 'Prozac for Depression', href: '/guide/prozac-for-depression' },
      { title: 'Wellbutrin for Depression', href: '/guide/wellbutrin-for-depression' },
      { title: 'CBT for Depression', href: '/guide/cognitive-behavioral-therapy-for-depression' },
      { title: 'Natural Remedies', href: '/guide/natural-remedies-for-depression' },
    ],
  },
  {
    title: 'ADHD Medications',
    description: 'Guides on stimulant and non-stimulant ADHD treatments',
    icon: '⚡',
    links: [
      { title: 'Adderall for ADHD', href: '/guide/adderall-for-adhd' },
      { title: 'Ritalin for ADHD', href: '/guide/ritalin-for-adhd' },
      { title: 'Adderall vs Ritalin', href: '/guide/adderall-vs-ritalin' },
      { title: 'Strattera for ADHD', href: '/guide/strattera-for-adhd' },
    ],
  },
  {
    title: 'Medication Comparisons',
    description: 'Side-by-side comparisons to help you understand your options',
    icon: '⚖️',
    links: [
      { title: 'Lexapro vs Zoloft', href: '/guide/lexapro-vs-zoloft' },
      { title: 'Prozac vs Zoloft', href: '/guide/prozac-vs-zoloft' },
      { title: 'Wellbutrin vs Lexapro', href: '/guide/lexapro-vs-wellbutrin' },
      { title: 'Xanax vs Klonopin', href: '/guide/klonopin-vs-xanax' },
    ],
  },
  {
    title: 'Side Effects & Safety',
    description: 'What to expect and how to manage medication effects',
    icon: '⚠️',
    links: [
      { title: 'Lexapro Side Effects', href: '/guide/lexapro-side-effects' },
      { title: 'Zoloft Withdrawal', href: '/guide/zoloft-withdrawal-symptoms' },
      { title: 'Lexapro & Alcohol', href: '/guide/can-you-drink-alcohol-on-lexapro' },
      { title: 'Lexapro Weight Gain', href: '/guide/does-lexapro-cause-weight-gain' },
    ],
  },
  {
    title: 'Natural Approaches',
    description: 'Non-medication options and complementary treatments',
    icon: '🌿',
    links: [
      { title: 'Natural Anxiety Relief', href: '/guide/natural-remedies-for-anxiety' },
      { title: 'Depression Without Meds', href: '/guide/how-to-treat-depression-without-medication' },
      { title: 'Home Remedies for Anxiety', href: '/guide/home-remedies-for-anxiety' },
      { title: 'Natural ADHD Management', href: '/guide/natural-remedies-for-adhd' },
    ],
  },
];

export default async function GuidePage() {
  // Get dynamic stats from your actual JSON files
  let stats: {
    total: number;
    byType: Record<string, number>;
    bySearchVolume: Record<string, number>;
    topTreatments: { slug: string; pages: number }[];
    topConditions: { slug: string; pages: number }[];
  } = { 
    total: 0, 
    byType: {}, 
    bySearchVolume: {}, 
    topTreatments: [], 
    topConditions: [] 
  };
  
  try {
    stats = await getDynamicPageStats();
  } catch (error) {
    console.error('Error getting page stats:', error);
  }

  return (
    <div className="min-h-screen bg-canvas">
      <PageIntro
        title="Treatment guides"
        object="reading"
        description="Guides to medications, therapies, and other treatments for specific conditions, ages, and goals, with the evidence behind each."
        footnote={stats.total > 0 ? `${stats.total.toLocaleString()} guides.` : undefined}
      />

      {/* Guide Categories */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="mb-8 text-[26px] text-label-primary sm:text-[30px]">
          Browse by category
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {GUIDE_CATEGORIES.map((category) => (
            <div key={category.title} className="rounded-2xl border border-separator bg-surface p-6">
              <h3 className="font-semibold text-label-primary">{category.title}</h3>
              <p className="text-label-secondary text-sm mt-2 mb-4">{category.description}</p>
              <ul className="space-y-2">
                {category.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-label-primary hover:text-accent text-sm font-medium"
                    >
                      {link.title} →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Searches Section */}
      <section className="max-w-6xl mx-auto px-6 pb-8">
        <h2 className="text-xl font-bold text-slate-900 mb-4">
          Popular Searches
        </h2>
        <div className="flex flex-wrap gap-2">
          {[
            'Lexapro side effects',
            'Zoloft vs Lexapro',
            'Anxiety symptoms in women',
            'How long does Lexapro take to work',
            'Natural remedies for depression',
            'ADHD in adults',
            'Prozac withdrawal',
            'CBT for anxiety',
            'Depression treatment options',
            'Wellbutrin weight loss',
          ].map((term) => (
            <Link
              key={term}
              href={`/guide/${term.toLowerCase().replace(/\s+/g, '-')}`}
              className="px-3 py-1.5 bg-surface-grouped hover:bg-fill-secondary rounded-full text-sm text-label-secondary transition-colors"
            >
              {term}
            </Link>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="rounded-xl border border-separator bg-surface p-8 text-center">
          <h2 className="text-xl font-semibold text-label-primary mb-4">
            Can&apos;t find what you&apos;re looking for?
          </h2>
          <p className="text-label-secondary mb-6">
            Use our search to find specific treatments, conditions, or comparisons.
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-6 py-3 bg-treatment text-white font-medium rounded-xl hover:bg-treatment-600 transition-colors"
          >
            Search All Content
            <ArrowRight className="h-4 w-4 text-white" />
          </Link>
        </div>
      </section>
    </div>
  );
}
