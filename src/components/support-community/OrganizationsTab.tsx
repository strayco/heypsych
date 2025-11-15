import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, ChevronDown, ChevronUp, Heart, Users, Calendar, HandHeart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Resource } from "@/lib/types/support-community";
import { ResourceCard } from "./ResourceCard";
import { matchesQuery } from "@/lib/utils/search";

interface Props {
  resources: Resource[];
}

export function OrganizationsTab({ resources }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLane, setSelectedLane] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const lanes = [
    {
      id: "disorder",
      title: "By Disorder / Concern",
      icon: Heart,
      description: "Support groups and resources organized by mental health condition",
      sections: [
        { id: "anxiety-mood", title: "Anxiety & Mood", subcategory: "Anxiety & Mood" },
        { id: "ocd", title: "OCD & Related", subcategory: "OCD & Related" },
        { id: "psychosis", title: "Psychosis/Schizophrenia", subcategory: "Psychosis/Schizophrenia" },
        { id: "eating", title: "Eating Disorders", subcategory: "Eating Disorders" },
        { id: "addiction", title: "Addiction & Recovery", subcategory: "Addiction & Recovery" },
      ],
    },
    {
      id: "identity",
      title: "By Identity / Culture",
      icon: Users,
      description: "Culturally-specific and identity-affirming support communities",
      sections: [
        { id: "bipoc", title: "BIPOC Communities", subcategory: "BIPOC" },
        { id: "lgbtq", title: "LGBTQ+ Support", subcategory: "LGBTQ+" },
        { id: "faith", title: "Faith-Based Support", subcategory: "Faith-Based" },
      ],
    },
    {
      id: "age",
      title: "By Age Group",
      icon: Calendar,
      description: "Age-appropriate support and resources",
      sections: [
        { id: "youth", title: "Youth/Students", subcategory: "Youth/Students" },
        { id: "adults", title: "Adults", subcategory: "Adults" },
      ],
    },
    {
      id: "family",
      title: "Family & Caregiver Support",
      icon: HandHeart,
      description: "Resources for families and caregivers",
      sections: [
        { id: "family-programs", title: "Family Programs", subcategory: "Family Programs" },
        { id: "caregiver", title: "Caregiver Programs", subcategory: "Caregiver Programs" },
      ],
    },
  ];

  const filteredResources = useMemo(() => {
    return resources.filter((r) => matchesQuery(r, searchQuery));
  }, [resources, searchQuery]);

  const getResourcesForSection = (subcategory: string) => {
    return filteredResources.filter((r) => r.subcategory === subcategory);
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  if (!selectedLane) {
    // Show 4 lane entry blocks OR search results
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Search organizations and communities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {searchQuery ? (
          // Show filtered search results
          <div>
            <p className="mb-4 text-sm text-slate-600">
              Showing {filteredResources.length} results for "{searchQuery}"
            </p>
            {filteredResources.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredResources.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-slate-600">
                  <p>No results found for "{searchQuery}"</p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          // Show lane cards when no search query
          <div className="grid gap-6 md:grid-cols-2">
            {lanes.map((lane, index) => {
              const Icon = lane.icon;
              return (
                <motion.div
                  key={lane.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    className="group cursor-pointer transition-all hover:shadow-xl"
                    onClick={() => setSelectedLane(lane.id)}
                  >
                    <CardContent className="p-6">
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                          <Icon className="h-6 w-6 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600">
                          {lane.title}
                        </h3>
                      </div>
                      <p className="mb-4 text-sm text-slate-600">{lane.description}</p>
                      <Button variant="outline" size="sm" className="w-full">
                        Explore {lane.sections.length} Categories
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Show accordion view for selected lane
  const selectedLaneData = lanes.find((l) => l.id === selectedLane)!;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => setSelectedLane(null)}>
          ← Back to Categories
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-2 text-2xl font-bold text-slate-900">{selectedLaneData.title}</h2>
          <p className="text-slate-600">{selectedLaneData.description}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search this category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Accordion Sections */}
      <div className="space-y-3">
        {selectedLaneData.sections.map((section) => {
          const isExpanded = expandedSection === section.id;
          const sectionResources = getResourcesForSection(section.subcategory);

          return (
            <Card key={section.id}>
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full p-4 text-left transition-colors hover:bg-slate-50"
                aria-expanded={isExpanded}
                aria-controls={`section-${section.id}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900">{section.title}</h3>
                    <p className="text-sm text-slate-600">{sectionResources.length} resources</p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <CardContent id={`section-${section.id}`} className="border-t p-4">
                  {sectionResources.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {sectionResources.map((resource) => (
                        <ResourceCard key={resource.id} resource={resource} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-slate-600">No resources in this category</p>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
