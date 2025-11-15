"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { TreatmentCard } from "../treatment-card";
import { Entity } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useComparisonStore } from "@/lib/stores/comparison-store";
import { ComparisonTable } from "../comparison-table";
import { BarChart3, X } from "lucide-react";

interface TreatmentGridProps {
  entities: Entity[];
  title?: string;
  variant?: "default" | "compact" | "detailed";
  showFilters?: boolean;
  showComparison?: boolean;
  onEntityClick?: (entity: Entity) => void;
  className?: string;
}

export function TreatmentGrid({
  entities,
  title,
  variant = "default",
  showFilters = true,
  showComparison = false,
  onEntityClick,
  className = "",
}: TreatmentGridProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [showCharts, setShowCharts] = useState(false);
  const [showComparisonTable, setShowComparisonTable] = useState(false);

  // Use comparison store
  const {
    selectedTreatments,
    addTreatment,
    removeTreatment,
    clearComparison,
    isSelected,
    canAddMore,
  } = useComparisonStore();

  // Get unique treatment types for filtering
  const treatmentTypes = Array.from(
    new Set(entities.map((entity) => entity.schema?.schema_name).filter(Boolean))
  ) as string[];

  // Filter entities based on selected filter
  const filteredEntities =
    selectedFilter === "all"
      ? entities
      : entities.filter((entity) => entity.schema?.schema_name === selectedFilter);

  // Animation variants - simplified
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  const handleAddToComparison = (entity: Entity) => {
    if (isSelected(entity.id)) {
      removeTreatment(entity.id);
    } else if (canAddMore()) {
      addTreatment(entity);
    }
  };

  const getGridColumns = () => {
    switch (variant) {
      case "compact":
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
      case "detailed":
        return "grid-cols-1 lg:grid-cols-2";
      default:
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
    }
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case "medication":
        return "medication";
      case "interventional":
        return "interventional";
      case "supplement":
        return "supplement";
      case "therapy":
        return "therapy";
      case "alternative":
        return "alternative";
      case "investigational":
        return "investigational";
      default:
        return "default";
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      {title && (
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-neutral-900">{title}</h2>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant={showCharts ? "primary" : "outline"}
              onClick={() => setShowCharts(!showCharts)}
            >
              {showCharts ? "Hide Charts" : "Show Charts"}
            </Button>
            <span className="text-sm text-neutral-700">{filteredEntities.length} treatments</span>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && treatmentTypes.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={selectedFilter === "all" ? "primary" : "ghost"}
            onClick={() => setSelectedFilter("all")}
          >
            All Treatments
          </Button>
          {treatmentTypes.map((type) => (
            <Button
              key={type}
              size="sm"
              variant={selectedFilter === type ? "primary" : "ghost"}
              onClick={() => setSelectedFilter(type)}
            >
              {entities.find((e) => e.schema?.schema_name === type)?.schema?.display_name || type}
            </Button>
          ))}
        </div>
      )}

      {/* Comparison Bar */}
      {showComparison && selectedTreatments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-blue-200 bg-blue-50 p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-blue-900">
                Compare Selected ({selectedTreatments.length}/4)
              </span>
              <div className="flex gap-2">
                {selectedTreatments.map((entity) => (
                  <Badge
                    key={entity.id}
                    variant={getBadgeVariant(entity.schema?.schema_name || "") as any}
                    className="cursor-pointer"
                    onClick={() => removeTreatment(entity.id)}
                  >
                    {entity.name} ×
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => clearComparison()}>
                Clear
              </Button>
              <Button size="sm" onClick={() => setShowComparisonTable(!showComparisonTable)}>
                <BarChart3 className="mr-2 h-4 w-4" />
                {showComparisonTable ? "Hide" : "Show"} Comparison
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Comparison Table */}
      {showComparisonTable && selectedTreatments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <ComparisonTable
            treatments={selectedTreatments}
            onRemoveTreatment={removeTreatment}
            onClearAll={() => {
              clearComparison();
              setShowComparisonTable(false);
            }}
          />
        </motion.div>
      )}

      {/* Treatment Grid */}
      <motion.div
        key={`${selectedFilter}-${filteredEntities.length}-${filteredEntities.map(e => e.id).join(',').slice(0, 50)}`}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`grid gap-6 ${getGridColumns()}`}
      >
        {filteredEntities.map((entity) => (
          <motion.div key={entity.id} variants={itemVariants}>
            <TreatmentCard
              entity={entity}
              variant={variant}
              showCharts={showCharts}
              onCompare={showComparison ? handleAddToComparison : undefined}
              onLearnMore={onEntityClick}
              className={isSelected(entity.id) ? "ring-2 ring-blue-500" : ""}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Empty State */}
      {filteredEntities.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-lg text-neutral-700">No treatments found</p>
          <p className="mt-2 text-sm text-neutral-600">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}
