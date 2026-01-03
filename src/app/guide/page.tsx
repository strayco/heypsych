/**
 * Guide Hub Page
 * 
 * Landing page for all programmatic SEO guides.
 * Dynamically shows statistics based on actual JSON data.
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getDynamicPageStats } from '@/lib/programmatic-seo/dynamic-generator';

export const metadata: Metadata = {
  title: 'Mental Health Treatment Guides | HeyPsych',
  description: 'Comprehensive guides on medications, therapies, and treatments for mental health conditions. Evidence-based information tailored to your needs.',
  alternates: {
    canonical: 'https://heypsych.com/guide',
  },
  openGraph: {
    title: 'Mental Health Treatment Guides | HeyPsych',
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
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-indigo-50/50 to-purple-50/30" />
        
        <div className="relative max-w-6xl mx-auto px-6 py-16 md:py-24">
          <Badge variant="primary" size="md" className="mb-4">
            {stats.total > 0 ? `${stats.total.toLocaleString()}+` : 'Thousands of'} Guides
          </Badge>
          
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-6">
            Mental Health Treatment Guides
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-3xl">
            Evidence-based guides on medications, therapies, and treatments for mental health 
            conditions. Find detailed information tailored to specific conditions, demographics, 
            and treatment goals.
          </p>
        </div>
      </section>

      {/* Stats */}
      {stats.total > 0 && (
        <section className="max-w-6xl mx-auto px-6 -mt-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Treatment Guides', value: stats.byType['treatment-for-condition'] || 0 },
              { label: 'Comparisons', value: stats.byType['treatment-vs-treatment'] || 0 },
              { label: 'Symptom Guides', value: stats.byType['condition-symptoms-demographic'] || 0 },
              { label: 'High-Volume Pages', value: stats.bySearchVolume['high'] || 0 },
            ].map((stat) => (
              <Card key={stat.label} variant="glass" size="sm">
                <CardContent className="pt-0 text-center">
                  <div className="text-2xl font-bold text-blue-600">{stat.value.toLocaleString()}</div>
                  <div className="text-sm text-slate-500">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Guide Categories */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-8">
          Browse by Category
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {GUIDE_CATEGORIES.map((category) => (
            <Card key={category.title} variant="default" className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <span className="text-2xl">{category.icon}</span>
                  <span>{category.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm mb-4">{category.description}</p>
                <ul className="space-y-2">
                  {category.links.map((link) => (
                    <li key={link.href}>
                      <Link 
                        href={link.href}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                      >
                        {link.title} →
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
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
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-sm text-slate-700 transition-colors"
            >
              {term}
            </Link>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <Card variant="gradient" size="lg" className="text-center">
          <CardContent className="pt-0">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Can&apos;t find what you&apos;re looking for?
            </h2>
            <p className="text-slate-600 mb-6">
              Use our search to find specific treatments, conditions, or comparisons.
            </p>
            <Link 
              href="/search"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              Search All Content
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path 
                  d="M8 4L14 10L8 16" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
