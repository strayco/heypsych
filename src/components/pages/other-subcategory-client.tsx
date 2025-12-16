"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Moon,
  Clock,
  Brain,
  Activity,
  Heart,
  User,
  Waves,
  Stethoscope,
  Droplet,
  Eye,
  LucideIcon,
  HelpCircle,
} from "lucide-react";
import type { Entity } from "@/lib/types/database";

// Icon map to resolve string names to components (avoids passing functions from server to client)
const iconMap: Record<string, LucideIcon> = {
  moon: Moon,
  clock: Clock,
  brain: Brain,
  activity: Activity,
  heart: Heart,
  user: User,
  waves: Waves,
  stethoscope: Stethoscope,
  droplet: Droplet,
  eye: Eye,
};

interface SubcategoryConfig {
  title: string;
  description: string;
  icon: string; // Icon name as string, resolved from iconMap
  iconColor: string;
  bgColor: string;
  gradient: string;
  features?: Array<{
    icon: string; // Icon name as string
    title: string;
    description: string;
  }>;
}

interface OtherSubcategoryClientProps {
  conditions: Entity[];
  config: SubcategoryConfig;
}

export function OtherSubcategoryClient({ conditions, config }: OtherSubcategoryClientProps) {
  const IconComponent = iconMap[config.icon] || HelpCircle;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${config.bgColor} via-white to-blue-50`}>
      {/* Header */}
      <section className="relative px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Header Row */}
          <div className="mb-8 flex items-start justify-between">
            {/* Back Button */}
            <Link href="/conditions/other">
              <Button variant="ghost" className="group">
                <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to Other Conditions
              </Button>
            </Link>

            {/* Title Section */}
            <div className="flex-1 text-center">
              <div className={`mb-4 inline-flex rounded-2xl ${config.bgColor} p-4`}>
                <IconComponent className={`h-8 w-8 ${config.iconColor}`} />
              </div>

              <h1 className={`mb-4 bg-gradient-to-r ${config.gradient} bg-clip-text text-3xl font-bold text-transparent sm:text-4xl lg:text-5xl`}>
                {config.title}
              </h1>

              <p className="mx-auto mb-6 max-w-3xl text-lg text-slate-600">
                {config.description}
              </p>

              {/* Stats */}
              <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${config.iconColor.replace('text-', 'bg-')}`}></div>
                  {conditions.length} Conditions
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  Evidence-Based
                </div>
              </div>
            </div>

            {/* Spacer for alignment */}
            <div className="w-[220px]"></div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      {config.features && config.features.length > 0 && (
        <section className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              {config.features.map((feature, index) => {
                const FeatureIcon = iconMap[feature.icon] || HelpCircle;
                return (
                  <div
                    key={index}
                    className={`rounded-xl border ${config.bgColor.replace('from-', 'border-').split(' ')[0].replace('bg-', 'border-')} bg-white/50 p-4 text-center backdrop-blur-sm`}
                  >
                    <FeatureIcon className={`mx-auto mb-2 h-6 w-6 ${config.iconColor}`} />
                    <h3 className="mb-1 font-semibold text-slate-900">{feature.title}</h3>
                    <p className="text-sm text-slate-600">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Conditions Grid */}
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {conditions.length === 0 ? (
            <div className="py-12 text-center">
              <IconComponent className="mx-auto mb-4 h-12 w-12 text-slate-400" />
              <p className="text-slate-600">No conditions found in this category yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {conditions.map((condition, index) => (
                <Link
                  key={condition.id}
                  href={`/conditions/${condition.slug}`}
                  className="group block"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={`h-full border-${config.iconColor.split('-')[1]}-100 bg-white/80 backdrop-blur-sm transition-all duration-300 group-hover:-translate-y-1 hover:shadow-lg`}>
                      <CardHeader className="pb-3">
                        <CardTitle className={`text-lg font-bold text-slate-900 transition-colors group-hover:${config.iconColor}`}>
                          {condition.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {condition.data?.description && (
                          <p className="mb-4 line-clamp-3 text-sm text-slate-600">
                            {typeof condition.data.description === 'string' 
                              ? condition.data.description 
                              : 'Click to learn more about this condition'}
                          </p>
                        )}

                        {/* Condition Tags */}
                        <div className="mb-4 flex flex-wrap gap-2">
                          {condition.data?.prevalence && (
                            <span className={`inline-flex items-center rounded-full ${config.bgColor} px-2 py-1 text-xs font-medium ${config.iconColor}`}>
                              Prevalence: {String(condition.data.prevalence).split(".")[0]}
                            </span>
                          )}
                          {condition.metadata?.dsm5_code && (
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                              DSM-5: {condition.metadata.dsm5_code}
                            </span>
                          )}
                        </div>

                        {/* Learn More */}
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${config.iconColor}`}>
                            Learn More →
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Back Navigation */}
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-4 text-center">
          <Link href="/conditions/other">
            <Button variant="outline" size="lg" className="mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Other Conditions
            </Button>
          </Link>
          <Link href="/conditions">
            <Button variant="outline" size="lg">
              <ArrowLeft className="mr-2 h-4 w-4" />
              All Conditions
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

