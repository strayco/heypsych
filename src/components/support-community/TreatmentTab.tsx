import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import type { Resource } from "@/lib/types/support-community";
import { ResourceCard } from "./ResourceCard";
import { matchesQuery } from "@/lib/utils/search";

interface Props {
  resources: Resource[];
}

export function TreatmentTab({ resources }: Props) {
  const [searchQuery, setSearchQuery] = useState("");

  const groupedResources = useMemo(() => {
    const filtered = resources.filter((r) => matchesQuery(r, searchQuery));

    const groups: Record<string, Resource[]> = {};
    filtered.forEach((resource) => {
      const category = resource.category || "Other";
      if (!groups[category]) groups[category] = [];
      groups[category].push(resource);
    });

    return groups;
  }, [resources, searchQuery]);

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
          <CardContent className="p-8 text-center text-slate-600">
            <p>No results found for "{searchQuery}"</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
