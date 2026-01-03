'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { GeneratedContent, ContentSection, FAQ, KeyFact, ComparisonTable, RelatedPage, Breadcrumb } from '@/lib/programmatic-seo/content-engine';

interface GuidePageClientProps {
  content: GeneratedContent;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  },
};

export function GuidePageClient({ content }: GuidePageClientProps) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Hero Section */}
      <HeroSection content={content} />

      {/* Quick Answer Box (for featured snippets) */}
      {content.quickAnswer && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="max-w-4xl mx-auto px-6 -mt-8 relative z-10"
        >
          <Card variant="glow" className="bg-white border-blue-200 shadow-lg">
            <CardContent className="pt-0">
              <div className="flex gap-4">
                <span className="text-2xl flex-shrink-0">💡</span>
                <div>
                  <h2 className="font-semibold text-slate-900 mb-2 text-lg">Quick Answer</h2>
                  <p className="text-slate-700 leading-relaxed quick-answer" itemProp="description">
                    {content.quickAnswer}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      )}

      {/* Key Facts (for featured snippets) */}
      {content.keyFacts && content.keyFacts.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="max-w-4xl mx-auto px-6 mt-8"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {content.keyFacts.map((fact, index) => (
              <KeyFactCard key={index} fact={fact} />
            ))}
          </div>
        </motion.section>
      )}

      {/* Comparison Table */}
      {content.comparisonTable && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-4xl mx-auto px-6 mt-10"
        >
          <ComparisonTableComponent table={content.comparisonTable} />
        </motion.section>
      )}

      {/* Main Content Sections */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto px-6 py-12"
      >
        <div className="space-y-8">
          {content.sections.map((section) => (
            <motion.div key={section.id} variants={itemVariants}>
              <SectionCard section={section} />
            </motion.div>
          ))}
        </div>

        {/* FAQs */}
        {content.faqs.length > 0 && (
          <motion.div variants={itemVariants} className="mt-16">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {content.faqs.map((faq, index) => (
                <FAQCard key={index} faq={faq} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Related Pages (Internal Linking) */}
        {content.relatedPages.length > 0 && (
          <motion.div variants={itemVariants} className="mt-16">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Related Guides
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {content.relatedPages.map((page, index) => (
                <RelatedPageCard key={index} page={page} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Reading Time & Word Count + HONEST Authority Signals (THE WIN PROTOCOL) */}
        <motion.div variants={itemVariants} className="mt-12">
          {/* Content Metrics */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 mb-4">
            <span>📖 {content.readingTimeMinutes} min read</span>
            <span className="hidden sm:inline">•</span>
            <span>{content.wordCount.toLocaleString()} words</span>
          </div>
          
          {/* Medical Review Badge - HONEST Dates (not fake "Updated today") */}
          {content.medicallyReviewed && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <span className="text-2xl flex-shrink-0">🩺</span>
              <div>
                <p className="text-sm font-semibold text-blue-900">Medically Reviewed</p>
                <p className="text-xs text-blue-700 mt-1">
                  <Link 
                    href="/about/medical-review-board" 
                    className="underline hover:text-blue-900 transition-colors"
                  >
                    {content.reviewedBy || 'HeyPsych Medical Review Board'}
                  </Link>
                </p>
                {content.lastReviewed && (
                  <p className="text-xs text-blue-600 mt-1">
                    Last reviewed: {new Date(content.lastReviewed).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                )}
                <p className="text-xs text-slate-500 mt-2 italic">
                  Reviewed for clinical accuracy against FDA labeling and current practice guidelines.
                </p>
              </div>
            </div>
          )}

          {/* Citations - Borrow Authority Pattern */}
          {content.citations && content.citations.length > 0 && (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-600">
              <p className="font-medium mb-1">Information based on:</p>
              <ul className="list-disc list-inside space-y-0.5">
                {content.citations.map((citation, i) => (
                  <li key={i}>{citation}</li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>

        {/* Medical Disclaimer */}
        <motion.div variants={itemVariants} className="mt-12">
          <DisclaimerCard level={content.disclaimerLevel} />
        </motion.div>
      </motion.section>
    </main>
  );
}

// ============ SUB-COMPONENTS ============

function HeroSection({ content }: { content: GeneratedContent }) {
  return (
    <section className="relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-indigo-50/50 to-purple-50/30" />
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-100/20 to-transparent" />
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative max-w-4xl mx-auto px-6 py-16 md:py-20"
      >
        {/* Breadcrumb */}
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm text-slate-500 flex-wrap">
            {content.breadcrumbs.map((crumb, index) => (
              <li key={index} className="flex items-center gap-2">
                {index > 0 && <span className="text-slate-300">/</span>}
                {index === content.breadcrumbs.length - 1 ? (
                  <span className="text-slate-700 font-medium truncate max-w-[200px]">
                    {crumb.name}
                  </span>
                ) : (
                  <Link href={crumb.url} className="hover:text-blue-600 transition-colors">
                    {crumb.name}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>

        {/* H1 Title */}
        <h1 
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight mb-4"
          itemProp="headline"
        >
          {content.h1}
        </h1>

        {/* Subtitle */}
        {content.subtitle && (
          <p className="text-lg text-blue-600 font-medium mb-4">
            {content.subtitle}
          </p>
        )}

        {/* Introduction */}
        <p 
          className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-3xl"
          itemProp="abstract"
        >
          {content.introduction}
        </p>
      </motion.div>
    </section>
  );
}

function KeyFactCard({ fact }: { fact: KeyFact }) {
  return (
    <Card variant="glass" size="sm" className="text-center">
      <CardContent className="pt-0">
        {fact.icon && <span className="text-xl mb-1 block">{fact.icon}</span>}
        <div className="text-sm text-slate-500">{fact.label}</div>
        <div className="font-semibold text-slate-900">{fact.value}</div>
      </CardContent>
    </Card>
  );
}

function ComparisonTableComponent({ table }: { table: ComparisonTable }) {
  return (
    <Card variant="default">
      <CardHeader>
        <CardTitle>Quick Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                {table.headers.map((header, index) => (
                  <th 
                    key={index} 
                    className={`py-3 px-4 text-left font-semibold text-slate-900 ${
                      index === 0 ? 'bg-slate-50' : ''
                    }`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-slate-100 last:border-0">
                  {row.cells.map((cell, cellIndex) => (
                    <td 
                      key={cellIndex} 
                      className={`py-3 px-4 ${
                        cellIndex === 0 ? 'font-medium text-slate-700 bg-slate-50' : 'text-slate-600'
                      }`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {table.caption && (
          <p className="text-xs text-slate-500 mt-3 text-center">{table.caption}</p>
        )}
      </CardContent>
    </Card>
  );
}

function SectionCard({ section }: { section: ContentSection }) {
  const getIcon = () => {
    if (section.icon) return <span className="text-xl">{section.icon}</span>;
    switch (section.type) {
      case 'warning':
        return <span className="text-xl">⚠️</span>;
      case 'tip':
        return <span className="text-xl">💡</span>;
      case 'callout':
        return <span className="text-xl">📌</span>;
      default:
        return null;
    }
  };

  const getBgClass = () => {
    switch (section.type) {
      case 'warning':
        return 'bg-red-50/50 border-red-200';
      case 'tip':
        return 'bg-green-50/50 border-green-200';
      case 'callout':
        return 'bg-blue-50/50 border-blue-200';
      default:
        return '';
    }
  };

  const getVariant = (): "default" | "filled" | "gradient" => {
    switch (section.type) {
      case 'warning':
      case 'tip':
      case 'callout':
        return 'filled';
      default:
        return 'default';
    }
  };

  // Parse markdown-style bold text
  const parseText = (text: string) => {
    const parts = text.split(/\*\*(.+?)\*\*/g);
    return parts.map((part, index) => 
      index % 2 === 1 ? <strong key={index} className="font-semibold">{part}</strong> : part
    );
  };

  return (
    <Card variant={getVariant()} className={getBgClass()}>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          {getIcon()}
          <span>{section.heading}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-slate-600 leading-relaxed mb-4">
          {section.content}
        </p>
        
        {section.items && Array.isArray(section.items) && section.items.length > 0 && (
          <ul className={`space-y-3 ${section.type === 'numbered-list' ? 'list-decimal list-inside' : ''}`}>
            {section.items.map((item, index) => (
              <li key={index} className={`flex gap-3 ${section.type === 'numbered-list' ? 'block' : ''}`}>
                {section.type !== 'numbered-list' && (
                  <span className={`flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full ${
                    section.type === 'warning' ? 'bg-red-400' :
                    section.type === 'tip' ? 'bg-green-400' :
                    'bg-blue-400'
                  }`} />
                )}
                <span className="text-slate-700">{parseText(item)}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Render subsections */}
        {section.subsections && section.subsections.length > 0 && (
          <div className="mt-6 space-y-4">
            {section.subsections.map((sub) => (
              <div key={sub.id} className="pl-4 border-l-2 border-slate-200">
                <h4 className="font-semibold text-slate-800 mb-2">{sub.heading}</h4>
                <p className="text-slate-600 text-sm">{sub.content}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FAQCard({ faq }: { faq: FAQ }) {
  return (
    <Card variant="outlined" className="overflow-hidden">
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer p-6 list-none">
          <h3 className="font-semibold text-slate-900 pr-4">
            {faq.question}
          </h3>
          <span className="flex-shrink-0 text-slate-400 group-open:rotate-180 transition-transform duration-200">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path 
                d="M5 7.5L10 12.5L15 7.5" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </summary>
        <div className="px-6 pb-6 faq-answer" itemProp="text">
          <p className="text-slate-600 leading-relaxed">
            {faq.answer}
          </p>
        </div>
      </details>
    </Card>
  );
}

function RelatedPageCard({ page }: { page: RelatedPage }) {
  const getIcon = () => {
    switch (page.type) {
      case 'condition':
        return '🧠';
      case 'treatment':
        return '💊';
      case 'guide':
        return '📖';
      case 'resource':
        return '📚';
      default:
        return '→';
    }
  };

  return (
    <Link href={page.url}>
      <Card 
        variant="outlined" 
        interactive 
        size="sm"
        className="h-full hover:border-blue-300 hover:bg-blue-50/30"
      >
        <CardContent className="pt-0">
          <div className="flex items-start gap-3">
            <span className="text-xl">{getIcon()}</span>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">
                {page.title}
              </h3>
              {page.description && (
                <p className="text-sm text-slate-500 line-clamp-2">
                  {page.description}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function DisclaimerCard({ level }: { level: 'standard' | 'elevated' | 'critical' }) {
  const config = {
    standard: {
      icon: '📋',
      title: 'Medical Information Disclaimer',
      bgClass: 'bg-slate-50/50 border-slate-200',
      textClass: 'text-slate-800',
    },
    elevated: {
      icon: '⚕️',
      title: 'Medical Disclaimer',
      bgClass: 'bg-amber-50/50 border-amber-200',
      textClass: 'text-amber-900',
    },
    critical: {
      icon: '🚨',
      title: 'Important Medical Warning',
      bgClass: 'bg-red-50/50 border-red-200',
      textClass: 'text-red-900',
    },
  };

  const c = config[level];

  return (
    <Card variant="filled" className={c.bgClass}>
      <CardContent className="pt-0">
        <div className="flex gap-3">
          <span className="text-2xl">{c.icon}</span>
          <div>
            <h3 className={`font-semibold ${c.textClass} mb-2`}>{c.title}</h3>
            <p className={`text-sm ${c.textClass} opacity-90 leading-relaxed`}>
              This information is for educational purposes only and is not a substitute for 
              professional medical advice, diagnosis, or treatment. Always seek the advice of 
              your physician or other qualified health provider with any questions you may have 
              regarding a medical condition. Never disregard professional medical advice or 
              delay in seeking it because of something you have read on this website.
              {level === 'critical' && (
                <strong className="block mt-2">
                  If you are experiencing a medical emergency, call 911 or your local emergency services immediately.
                </strong>
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
