#!/bin/bash

echo "🚀 Creating all 13 category pages..."

# Function to create a category page
create_category_page() {
    local slug=$1
    local title=$2
    local emoji=$3
    local description=$4
    local icon=$5
    local color=$6
    
    echo "Creating $slug..."
    mkdir -p "src/app/conditions/$slug"
    
    cat > "src/app/conditions/$slug/page.tsx" << EOF
'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useConditionsByCategory } from '@/lib/hooks/use-entities'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, $icon, Brain, ArrowRight } from 'lucide-react'

export default function CategoryPage() {
  const { data: conditions, isLoading, error } = useConditionsByCategory('$slug')

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-$color-500 border-t-transparent rounded-full mx-auto"></div>
          <h1 className="text-2xl font-bold text-gray-900">Loading conditions...</h1>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <h1 className="text-xl font-bold text-gray-900 mb-2">Error Loading Conditions</h1>
            <p className="text-gray-600 mb-4">We couldn't load the conditions data.</p>
            <Link href="/conditions">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to All Conditions
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-$color-50 via-white to-$color-50">
      {/* Header */}
      <section className="relative py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-6">
            <Link 
              href="/conditions" 
              className="hover:text-$color-600 transition-colors"
            >
              Conditions
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-medium">$title</span>
          </div>

          {/* Title Section */}
          <div className="text-center mb-8">
            <div className="inline-flex p-4 rounded-2xl bg-$color-50 mb-4">
              <$icon className="w-8 h-8 text-$color-600" />
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-900 via-$color-900 to-slate-900 bg-clip-text text-transparent mb-4">
              <span className="bg-gradient-to-r from-$color-600 to-$color-600 bg-clip-text text-transparent">
                $emoji $title
              </span>
            </h1>
            
            <p className="text-lg text-slate-600 mb-6 max-w-3xl mx-auto">
              $description
            </p>

            {/* Stats */}
            <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-$color-500 rounded-full"></div>
                {conditions?.length || 0} Conditions
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Evidence-Based
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Conditions List */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white rounded-3xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-slate-900 text-center">
                All $title Conditions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {conditions && conditions.length > 0 ? (
                <div className="space-y-4">
                  {conditions.map((condition, index) => (
                    <Link
                      key={condition.slug}
                      href={\`/conditions/\${condition.slug}\`}
                      className="group block"
                    >
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-6 border border-slate-200 rounded-xl hover:border-$color-300 hover:shadow-md transition-all duration-300 group-hover:bg-$color-50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-$color-50 group-hover:bg-$color-100 transition-colors">
                              <Brain className="w-6 h-6 text-$color-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900 group-hover:text-$color-600 transition-colors text-lg">
                                {condition.name}
                              </h3>
                              <p className="text-slate-600 text-sm mt-1">
                                {condition.data?.description?.substring(0, 100)}...
                              </p>
                            </div>
                          </div>
                          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-$color-500 group-hover:translate-x-1 transition-all" />
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <$icon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    No Conditions Found
                  </h3>
                  <p className="text-slate-600 mb-6">
                    We couldn't find any conditions in this category yet.
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm text-slate-500">Debug info:</p>
                    <p className="text-xs text-slate-400">
                      Looking for category: "$slug"
                    </p>
                    <p className="text-xs text-slate-400">
                      Conditions found: {conditions?.length || 0}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Back to Conditions */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Link href="/conditions">
            <Button variant="outline" size="lg">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to All Conditions
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
EOF
    
    echo "✅ Created $slug/page.tsx"
}

# Create all category pages
create_category_page "mood-depression" "Mood & Depression" "💙" "Major depression, bipolar disorder, seasonal depression, and mood-related conditions" "Brain" "blue"
create_category_page "anxiety-fear" "Anxiety & Fear" "😰" "Generalized anxiety, panic disorder, social anxiety, phobias, and fear-based conditions" "Zap" "yellow" 
create_category_page "attention-learning" "Attention & Learning" "🎯" "ADHD, learning disorders, focus issues, and cognitive development conditions" "Target" "purple"
create_category_page "trauma-stress" "Trauma & Stress" "💔" "PTSD, acute stress disorder, adjustment disorders, and trauma-related conditions" "Shield" "red"
create_category_page "obsessive-compulsive" "Obsessive & Compulsive" "🔄" "OCD, body dysmorphic disorder, hoarding, and repetitive behavior conditions" "Waves" "teal"
create_category_page "eating-body-image" "Eating & Body Image" "🍽️" "Anorexia, bulimia, binge eating disorder, and body image-related conditions" "Heart" "pink"
create_category_page "psychotic-disorders" "Psychotic Disorders" "👁️" "Schizophrenia, schizoaffective disorder, delusional disorder, and psychotic conditions" "Eye" "indigo"
create_category_page "personality-disorders" "Personality Disorders" "🧩" "Borderline, narcissistic, antisocial, and other personality-related conditions" "Users" "slate"
create_category_page "substance-use-disorders" "Substance Use Disorders" "🚫" "Alcohol, drug addiction, gambling addiction, and substance-related conditions" "Wine" "amber"
create_category_page "autism-development" "Autism & Development" "🧩" "Autism spectrum disorders, developmental delays, and communication disorders" "Puzzle" "emerald"
create_category_page "dementia-memory" "Dementia & Memory" "🧠" "Alzheimer's disease, dementia, memory loss, and cognitive decline conditions" "Brain" "violet"
create_category_page "behavioral-disorders" "Behavioral Disorders" "⚡" "Conduct disorder, oppositional defiant disorder, and disruptive behavior conditions" "AlertCircle" "orange"

# Create special "Other" page
echo "Creating other..."
mkdir -p "src/app/conditions/other"
cat > "src/app/conditions/other/page.tsx" << 'EOF'
'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MoreHorizontal, ArrowRight, Moon, Heart, User, Palette, Waves, Stethoscope, Eye, HelpCircle } from 'lucide-react'

const otherCategories = [
  {
    title: 'Sleep Disorders',
    description: 'Insomnia, sleep apnea, narcolepsy, and other sleep-wake disorders',
    icon: Moon,
    color: 'indigo',
    href: '/conditions/other/sleep-disorders',
    emoji: '🌙'
  },
  {
    title: 'Sexual Health',
    description: 'Sexual dysfunctions and sexual health-related conditions',
    icon: Heart,
    color: 'rose',
    href: '/conditions/other/sexual-disorders',
    emoji: '💕'
  },
  {
    title: 'Gender Identity',
    description: 'Gender dysphoria and gender identity-related conditions',
    icon: User,
    color: 'purple',
    href: '/conditions/other/gender-disorders',
    emoji: '🏳️‍⚧️'
  },
  {
    title: 'Dissociative Disorders',
    description: 'Dissociative identity disorder, amnesia, and related conditions',
    icon: Waves,
    color: 'cyan',
    href: '/conditions/other/dissociative-disorders',
    emoji: '🌀'
  },
  {
    title: 'Somatic Disorders',
    description: 'Somatic symptom disorders and illness-related conditions',
    icon: Stethoscope,
    color: 'green',
    href: '/conditions/other/somatic-disorders',
    emoji: '🏥'
  },
  {
    title: 'Elimination Disorders',
    description: 'Enuresis, encopresis, and elimination-related conditions',
    icon: Palette,
    color: 'amber',
    href: '/conditions/other/elimination-disorders',
    emoji: '🚽'
  },
  {
    title: 'Paraphilic Disorders',
    description: 'Paraphilic disorders and related conditions',
    icon: Eye,
    color: 'red',
    href: '/conditions/other/paraphilic-disorders',
    emoji: '🔞'
  },
  {
    title: 'Rare Conditions',
    description: 'Other specified and unspecified mental health conditions',
    icon: HelpCircle,
    color: 'gray',
    href: '/conditions/other/rare-disorders',
    emoji: '❓'
  }
]

export default function OtherConditionsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <section className="relative py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-6">
            <Link 
              href="/conditions" 
              className="hover:text-slate-600 transition-colors"
            >
              Conditions
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-medium">Other Conditions</span>
          </div>

          {/* Title Section */}
          <div className="text-center mb-8">
            <div className="inline-flex p-4 rounded-2xl bg-slate-50 mb-4">
              <MoreHorizontal className="w-8 h-8 text-slate-600" />
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-900 via-slate-900 to-slate-900 bg-clip-text text-transparent mb-4">
              <span className="bg-gradient-to-r from-slate-600 to-slate-600 bg-clip-text text-transparent">
                🔍 Other Conditions
              </span>
            </h1>
            
            <p className="text-lg text-slate-600 mb-6 max-w-3xl mx-auto">
              Sleep disorders, sexual health, dissociative disorders, and other specialized mental health conditions.
            </p>

            {/* Stats */}
            <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                {otherCategories.length} Categories
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Evidence-Based
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Other Category Tiles */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {otherCategories.map((category, index) => {
              const IconComponent = category.icon
              
              return (
                <Link
                  key={category.href}
                  href={category.href}
                  className="group block"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-500 group-hover:-translate-y-1 h-full"
                  >
                    {/* Content */}
                    <div className="relative p-6">
                      {/* Icon and title */}
                      <div className="text-center mb-4">
                        <div className="flex items-center justify-center gap-3 mb-3">
                          <div className="inline-flex p-3 rounded-xl bg-slate-50 group-hover:scale-110 transition-transform duration-300">
                            <IconComponent className="w-6 h-6 text-slate-600" />
                          </div>
                          <div className="text-2xl">{category.emoji}</div>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-slate-700 transition-colors mb-2">
                          {category.title}
                        </h3>
                      </div>

                      {/* Description */}
                      <p className="text-slate-600 text-center text-sm leading-relaxed mb-4 min-h-[3rem]">
                        {category.description}
                      </p>

                      {/* Call to action */}
                      <div className="flex items-center justify-center gap-2 text-sm font-semibold">
                        <span className="text-slate-600">
                          Explore
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform duration-300" />
                      </div>
                    </div>
                  </motion.div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Back to Conditions */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Link href="/conditions">
            <Button variant="outline" size="lg">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to All Conditions
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
EOF

echo "✅ Created other/page.tsx"

echo ""
echo "🎉 All 13 category pages created successfully!"
echo "🚀 Now test your anxiety-fear page!"