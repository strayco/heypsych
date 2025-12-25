import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import type { Resource } from "@/lib/types/support-community";
import { ResourceCard } from "./ResourceCard";
import { matchesQuery } from "@/lib/utils/search";

interface Props {
  resources: Resource[];
  page?: number;
}

const ITEMS_PER_PAGE = 30;

export function TreatmentTab({ resources, page = 1 }: Props) {
  const [searchQuery, setSearchQuery] = useState("");

  const { filteredResources, totalResources } = useMemo(() => {
    const filtered = resources.filter((r) => matchesQuery(r, searchQuery));
    return { filteredResources: filtered, totalResources: filtered.length };
  }, [resources, searchQuery]);

  // Pagination logic
  const { paginatedResources, totalPages } = useMemo(() => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginated = filteredResources.slice(startIndex, endIndex);
    const total = Math.ceil(filteredResources.length / ITEMS_PER_PAGE);
    return { paginatedResources: paginated, totalPages: total };
  }, [filteredResources, page]);

  const groupedResources = useMemo(() => {
    const groups: Record<string, Resource[]> = {};
    paginatedResources.forEach((resource) => {
      const category = resource.category || "Other";
      if (!groups[category]) groups[category] = [];
      groups[category].push(resource);
    });
    return groups;
  }, [paginatedResources]);

  return (
    <div className="space-y-8">
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardContent className="p-6">
          <h2 className="mb-2 text-xl font-bold text-slate-900">Professional Treatment Resources</h2>
          <p className="text-sm text-slate-700">
            Search directories, find treatment centers, and connect with professional care providers.
          </p>
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search treatment resources and directories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Grouped Resources */}
      {Object.entries(groupedResources).map(([category, categoryResources]) => (
        <motion.div
          key={category}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="mb-4 text-xl font-bold text-slate-900">{category}</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categoryResources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        </motion.div>
      ))}

      {Object.keys(groupedResources).length === 0 && searchQuery && (
        <Card>
          <CardContent className="p-8 text-center text-slate-900">
            <p>No results found for "{searchQuery}"</p>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            baseUrl="/resources/support-community"
            tabParam="treatment"
          />
        </motion.div>
      )}
    </div>
  );
}
