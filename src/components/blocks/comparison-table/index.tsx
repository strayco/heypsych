"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Entity } from "@/lib/types/database";
import {
  comparisonMetrics,
  getMetricByKey,
  metricCategories,
} from "@/lib/config/comparison-metrics";
import { formatCurrency } from "@/lib/utils/format";
import {
  X,
  BarChart3,
  TrendingUp,
  Shield,
  DollarSign,
  Calendar,
  MoreHorizontal,
  Check,
  Minus,
  Star,
} from "lucide-react";

interface ComparisonTableProps {
  treatments: Entity[];
  onRemoveTreatment: (treatmentId: string) => void;
  onClearAll: () => void;
  className?: string;
}

const iconMap = {
  "trending-up": TrendingUp,
  shield: Shield,
  "dollar-sign": DollarSign,
  calendar: Calendar,
  "more-horizontal": MoreHorizontal,
  "bar-chart-3": BarChart3,
};

export function ComparisonTable({
  treatments,
  onRemoveTreatment,
  onClearAll,
  className = "",
}: ComparisonTableProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showCharts, setShowCharts] = useState(true);

  if (treatments.length === 0) {
    return (
      <Card className={`${className}`}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="mb-4 text-neutral-600">
            <BarChart3 className="h-12 w-12" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-neutral-900">
            No treatments selected for comparison
          </h3>
          <p className="max-w-sm text-center text-neutral-800">
            Add treatments to your comparison by clicking the "Add to Compare" button on treatment
            cards.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Get applicable metrics for all selected treatments
  const getApplicableMetrics = () => {
    const schemaNames = treatments.map((t) => t.schema?.schema_name).filter(Boolean);
    const uniqueSchemas = [...new Set(schemaNames)];

    return comparisonMetrics.filter((metric) =>
      metric.applicableSchemas.some((schema) => uniqueSchemas.includes(schema))
    );
  };

  const applicableMetrics = getApplicableMetrics();

  const filteredMetrics =
    selectedCategory === "all"
      ? applicableMetrics
      : applicableMetrics.filter((metric) => metric.category === selectedCategory);

  // Extract value from treatment data using dataPath
  const extractValue = (treatment: Entity, dataPath: string): any => {
    const keys = dataPath.split(".");
    return keys.reduce((obj, key) => obj?.[key], treatment.data);
  };

  // Format value based on metric type
  const formatValue = (value: any, metric: any): string => {
    if (value === null || value === undefined) {
      return "N/A";
    }

    switch (metric.type) {
      case "boolean":
        return value ? "✅ Yes" : "❌ No";
      case "array":
        return Array.isArray(value) ? value.join(", ") : String(value);
      case "numeric":
        if (metric.unit === "$") {
          return formatCurrency(value);
        }
        return `${value}${metric.unit || ""}`;
      default:
        return String(value);
    }
  };

  // Get color for numeric values based on whether higher is better
  const getValueColor = (value: any, metric: any, allValues: any[]): string => {
    if (metric.type !== "numeric" || !metric.scale) {
      return "text-neutral-900";
    }

    const numValue = Number(value);
    if (isNaN(numValue)) return "text-neutral-900";

    const validValues = allValues.filter((v) => !isNaN(Number(v)));
    if (validValues.length < 2) return "text-neutral-900";

    const min = Math.min(...validValues.map(Number));
    const max = Math.max(...validValues.map(Number));

    if (metric.higherIsBetter) {
      if (numValue === max) return "text-green-600 font-semibold";
      if (numValue === min) return "text-red-600";
    } else {
      if (numValue === min) return "text-green-600 font-semibold";
      if (numValue === max) return "text-red-600";
    }

    return "text-neutral-900";
  };

  // Render progress bar for numeric values
  const renderProgressBar = (value: any, metric: any, allValues: any[]): React.ReactNode => {
    if (!showCharts || metric.type !== "numeric" || !metric.scale) {
      return null;
    }

    const numValue = Number(value);
    if (isNaN(numValue)) return null;

    const [min, max] = metric.scale;
    const percentage = ((numValue - min) / (max - min)) * 100;

    const barColor = metric.higherIsBetter ? "bg-blue-500" : "bg-red-500";

    return (
      <div className="mt-1">
        <div className="h-1.5 w-full rounded-full bg-gray-200">
          <div
            className={`h-1.5 rounded-full ${barColor} transition-all duration-300`}
            style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Treatment Comparison</CardTitle>
              <p className="mt-1 text-neutral-800">
                Compare {treatments.length} treatment{treatments.length !== 1 ? "s" : ""} side by
                side
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant={showCharts ? "primary" : "outline"}
                size="sm"
                onClick={() => setShowCharts(!showCharts)}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                {showCharts ? "Hide" : "Show"} Charts
              </Button>
              <Button variant="outline" size="sm" onClick={onClearAll}>
                Clear All
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Category Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === "all" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
            >
              All Metrics
            </Button>
            {metricCategories.map((category) => {
              const IconComponent = iconMap[category.icon as keyof typeof iconMap];
              return (
                <Button
                  key={category.key}
                  variant={selectedCategory === category.key ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.key)}
                >
                  {IconComponent && <IconComponent className="mr-2 h-4 w-4" />}
                  {category.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Comparison Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Treatment Headers */}
            <thead>
              <tr className="border-b">
                <th className="w-48 p-4 text-left font-medium text-neutral-700">Metric</th>
                {treatments.map((treatment) => (
                  <th key={treatment.id} className="min-w-48 p-4 text-center">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-left font-semibold text-neutral-900">
                            {treatment.name}
                          </h3>
                          <Badge
                            variant={treatment.schema?.schema_name as any}
                            size="sm"
                            className="mt-1"
                          >
                            {treatment.schema?.display_name}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-neutral-600 hover:text-neutral-800"
                          onClick={() => onRemoveTreatment(treatment.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Metric Rows */}
            <tbody>
              {filteredMetrics.map((metric) => {
                const values = treatments.map((treatment) =>
                  extractValue(treatment, metric.dataPath)
                );

                return (
                  <motion.tr
                    key={metric.key}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b hover:bg-neutral-50"
                  >
                    {/* Metric Label */}
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="font-medium text-neutral-900">{metric.label}</div>
                        <div className="text-sm text-neutral-700">{metric.description}</div>
                        <Badge variant="outline" size="sm">
                          {metricCategories.find((c) => c.key === metric.category)?.label}
                        </Badge>
                      </div>
                    </td>

                    {/* Values */}
                    {treatments.map((treatment, index) => {
                      const value = values[index];
                      const formattedValue = formatValue(value, metric);
                      const colorClass = getValueColor(value, metric, values);

                      return (
                        <td key={treatment.id} className="p-4 text-center">
                          <div className="space-y-1">
                            <div className={`font-medium ${colorClass}`}>{formattedValue}</div>
                            {renderProgressBar(value, metric, values)}
                          </div>
                        </td>
                      );
                    })}
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {treatments.map((treatment) => {
              const costValue =
                extractValue(treatment, "cost_monthly") ||
                extractValue(treatment, "cost_per_session");
              const efficacyValue = extractValue(treatment, "efficacy.depression");

              return (
                <div key={treatment.id} className="space-y-2">
                  <h4 className="font-semibold text-neutral-900">{treatment.name}</h4>
                  <div className="space-y-1 text-sm">
                    {costValue && (
                      <div className="flex justify-between">
                        <span className="text-neutral-800">Cost:</span>
                        <span className="font-medium">{formatCurrency(costValue)}</span>
                      </div>
                    )}
                    {efficacyValue && (
                      <div className="flex justify-between">
                        <span className="text-neutral-800">Depression:</span>
                        <span className="font-medium">{efficacyValue}/5 ⭐</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
