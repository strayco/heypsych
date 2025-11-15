"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, Brain, Users, Shield } from "lucide-react";
import { EntityService } from "@/lib/data/entity-service";
import type { Entity } from "@/lib/types/database";

export default function SexualDisordersPage() {
  const [conditions, setConditions] = React.useState<Entity[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Fetch conditions on mount
  React.useEffect(() => {
    const fetchConditions = async () => {
      try {
        setIsLoading(true);
        const allConditions = await EntityService.getByEntityType("condition");
        setConditions(allConditions || []);
      } catch (error) {
        console.error("Error fetching conditions:", error);
        setConditions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConditions();
  }, []);

  // Filter for sexual disorders
  const sexualConditions = React.useMemo(() => {
    if (!conditions) return [];

    return conditions.filter(
      (condition) => condition.metadata?.category === "other-conditions/sexual-disorders"
    );
  }, [conditions]);

  // Debug logging
  React.useEffect(() => {
  }, [conditions, sexualConditions]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50">
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
              <div className="mb-4 inline-flex rounded-2xl bg-rose-50 p-4">
                <Heart className="h-8 w-8 text-rose-600" />
              </div>

              <h1 className="mb-4 bg-gradient-to-r from-rose-900 via-pink-900 to-rose-900 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl lg:text-5xl">
                Sexual Disorders
              </h1>

              <p className="mx-auto mb-6 max-w-3xl text-lg text-slate-600">
                Conditions involving persistent difficulties with sexual response, desire, orgasm, or
                pain that cause distress or interpersonal difficulty.
              </p>

              {/* Stats */}
              <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-rose-500"></div>
                  {sexualConditions.length} Conditions
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  Evidence-Based
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-pink-500"></div>
                  Multifactorial
                </div>
              </div>
            </div>

            {/* Spacer for alignment */}
            <div className="w-[220px]"></div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-rose-100 bg-white/50 p-4 text-center backdrop-blur-sm">
              <Brain className="mx-auto mb-2 h-6 w-6 text-rose-600" />
              <h3 className="mb-1 font-semibold text-slate-900">Biopsychosocial</h3>
              <p className="text-sm text-slate-600">
                Complex interplay of biological, psychological, and social factors
              </p>
            </div>
            <div className="rounded-xl border border-rose-100 bg-white/50 p-4 text-center backdrop-blur-sm">
              <Users className="mx-auto mb-2 h-6 w-6 text-rose-600" />
              <h3 className="mb-1 font-semibold text-slate-900">Relationship-Focused</h3>
              <p className="text-sm text-slate-600">
                Often involves couples therapy and communication work
              </p>
            </div>
            <div className="rounded-xl border border-rose-100 bg-white/50 p-4 text-center backdrop-blur-sm">
              <Shield className="mx-auto mb-2 h-6 w-6 text-rose-600" />
              <h3 className="mb-1 font-semibold text-slate-900">Holistic Treatment</h3>
              <p className="text-sm text-slate-600">
                Combines medical, psychological, and lifestyle interventions
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Conditions Grid */}
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-rose-600"></div>
            </div>
          ) : sexualConditions.length === 0 ? (
            <div className="py-12 text-center">
              <Heart className="mx-auto mb-4 h-12 w-12 text-slate-400" />
              <p className="text-slate-600">No sexual disorders found in the database.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sexualConditions.map((condition, index) => (
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
                    <Card className="h-full border-rose-100 bg-white/80 backdrop-blur-sm transition-all duration-300 group-hover:-translate-y-1 hover:border-rose-200 hover:shadow-lg">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-bold text-slate-900 transition-colors group-hover:text-rose-700">
                          {condition.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {condition.data?.description && (
                          <p className="mb-4 line-clamp-3 text-sm text-slate-600">
                            {condition.data.description}
                          </p>
                        )}

                        {/* Condition Tags */}
                        <div className="mb-4 flex flex-wrap gap-2">
                          {condition.data?.prevalence && (
                            <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700">
                              Prevalence: {condition.data.prevalence.split(".")[0]}
                            </span>
                          )}
                          {condition.metadata?.dsm5_code && (
                            <span className="inline-flex items-center rounded-full bg-pink-50 px-2 py-1 text-xs font-medium text-pink-700">
                              DSM-5: {condition.metadata.dsm5_code}
                            </span>
                          )}
                        </div>

                        {/* Learn More */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-rose-600 group-hover:text-rose-700">
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
