"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  BookOpen,
  TrendingUp,
  Heart,
  Lightbulb,
  Users,
  Newspaper,
  Calendar,
  Clock,
  ArrowRight,
  Filter,
  X,
  Tag,
  User,
  Brain,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Entity } from "@/lib/types/database";

import { BackToResourcesButton } from "@/components/resources/BackToResourcesButton";

interface ArticlesBlogsHubProps {
  resources: Entity[];
  showBackButton?: boolean;
}

export function ArticlesBlogsHub({ resources, showBackButton = false }: ArticlesBlogsHubProps) {
  const [selectedPillar, setSelectedPillar] = useState<string>("latest"); // Default to Latest & Trending
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");

  // Parse pillar from resource
  const getPillar = (resource: Entity): string => {
    const resourceAny = resource as any;
    const data = resource.data as any;
    const meta = resource.metadata as any;

    // Try to get pillar from the new structure (top-level first!)
    if (resourceAny?.pillar) return resourceAny.pillar;
    if (data?.pillar) return data.pillar;
    if (meta?.pillar) return meta.pillar;

    // Fallback: map old article_type to new pillar
    const articleType = meta?.article_type || data?.article_type;
    if (articleType === 'research') return 'research-and-science';
    if (articleType === 'lived-experience') return 'community-and-stories';
    if (articleType === 'how-to') return 'how-to-guides';

    return 'how-to-guides'; // default
  };

  // Get published date from resource
  const getPublishedDate = (resource: Entity): Date => {
    const data = resource.data as any;
    const meta = resource.metadata as any;

    const dateStr =
      data?.publishedAt ||
      data?.published_date ||
      meta?.published_date ||
      resource.created_at ||
      new Date().toISOString();

    return new Date(dateStr);
  };

  // Parse topics from resources
  const getTopics = (resource: Entity): string[] => {
    const meta = resource.metadata as any;
    const data = resource.data as any;

    const topics = [
      ...(Array.isArray(meta?.topics) ? meta.topics : []),
      ...(Array.isArray(data?.topics) ? data.topics : []),
      ...(Array.isArray(meta?.tags) ? meta.tags : []),
      ...(Array.isArray(data?.tags) ? data.tags : []),
    ].filter(Boolean) as string[];

    return topics;
  };

  // Group resources by pillar
  const resourcesByPillar = useMemo(() => {
    return resources.reduce(
      (acc, resource) => {
        const pillar = getPillar(resource);
        if (!acc[pillar]) acc[pillar] = [];
        acc[pillar].push(resource);
        return acc;
      },
      {} as Record<string, Entity[]>
    );
  }, [resources]);

  // Get top 10 latest articles sorted by date
  const latestArticles = useMemo(() => {
    return [...resources]
      .sort((a, b) => getPublishedDate(b).getTime() - getPublishedDate(a).getTime())
      .slice(0, 10);
  }, [resources]);

  // Get all unique topics
  const allTopics = useMemo(() => {
    const topicSet = new Set<string>();
    resources.forEach((resource) => {
      getTopics(resource).forEach((t) => topicSet.add(t));
    });
    return Array.from(topicSet).sort();
  }, [resources]);

  // 4 PILLAR DEFINITIONS (Latest removed - it's now auto-generated below)
  const pillars = [
    {
      id: "self-help-and-wellness",
      name: "Self-Help & Wellness",
      icon: Heart,
      gradient: "from-rose-500 to-pink-600",
      bgColor: "bg-rose-50",
      iconColor: "text-rose-600",
      borderColor: "border-rose-200",
      description: "Mindfulness, habits, emotional resilience, relationships",
      count: resourcesByPillar["self-help-and-wellness"]?.length || 0,
      emoji: "🧘",
    },
    {
      id: "research-and-science",
      name: "Research & Science",
      icon: Lightbulb,
      gradient: "from-purple-500 to-indigo-600",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
      borderColor: "border-purple-200",
      description: "Neuroscience, psychology, mental health trends, reports",
      count: resourcesByPillar["research-and-science"]?.length || 0,
      emoji: "🔬",
    },
    {
      id: "how-to-guides",
      name: "How-To Guides",
      icon: BookOpen,
      gradient: "from-emerald-500 to-teal-600",
      bgColor: "bg-emerald-50",
      iconColor: "text-emerald-600",
      borderColor: "border-emerald-200",
      description: "Health systems, therapy access, insurance, workplace wellbeing",
      count: resourcesByPillar["how-to-guides"]?.length || 0,
      emoji: "📖",
    },
    {
      id: "community-and-stories",
      name: "Community & Stories",
      icon: Users,
      gradient: "from-amber-500 to-orange-600",
      bgColor: "bg-amber-50",
      iconColor: "text-amber-600",
      borderColor: "border-amber-200",
      description: "Personal stories, expert Q&As, recovery journeys, community spotlights",
      count: resourcesByPillar["community-and-stories"]?.length || 0,
      emoji: "💭",
    },
  ];

  // Filter resources
  const filteredResources = useMemo(() => {
    let filtered = resources;

    // Special handling for "latest" - show top 10 by date
    if (selectedPillar === "latest") {
      return [...resources]
        .sort((a, b) => getPublishedDate(b).getTime() - getPublishedDate(a).getTime())
        .slice(0, 10);
    }

    // Filter by pillar (if not "all" or "latest")
    if (selectedPillar !== "all" && selectedPillar !== "latest") {
      filtered = filtered.filter((r) => getPillar(r) === selectedPillar);
    }

    // Filter by topic
    if (selectedTopic !== "all") {
      filtered = filtered.filter((r) => getTopics(r).includes(selectedTopic));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.name?.toLowerCase().includes(query) ||
          r.description?.toLowerCase().includes(query) ||
          (r.data as any)?.author?.toLowerCase().includes(query) ||
          (r.data as any)?.authors?.some((a: string) => a.toLowerCase().includes(query))
      );
    }

    // Sort by date
    return filtered.sort((a, b) => getPublishedDate(b).getTime() - getPublishedDate(a).getTime());
  }, [resources, selectedPillar, selectedTopic, searchQuery]);

  const activeFiltersCount =
    (selectedPillar !== "all" && selectedPillar !== "latest" ? 1 : 0) + (selectedTopic !== "all" ? 1 : 0);

  const clearFilters = () => {
    setSelectedPillar("latest"); // Reset to default Latest & Trending
    setSelectedTopic("all");
    setSearchQuery("");
  };

  // Format date helper
  const formatDate = (dateString: string | Date) => {
    if (!dateString) return "";
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // Component for rendering an article card
  const ArticleCard = ({ resource, index, pillarInfo }: { resource: Entity; index: number; pillarInfo?: any }) => {
    const data = resource.data as any;
    const meta = resource.metadata as any;
    const pillar = getPillar(resource);
    const topics = getTopics(resource);
    const author = data?.authors?.[0] || data?.author || meta?.author;
    const publishedDate = getPublishedDate(resource);
    const readTime = data?.readingMinutes ? `${data.readingMinutes} min read` : (data?.read_time || meta?.read_time);
    const imageUrl = data?.coverImage || data?.image_url || meta?.image_url;

    // Get pillar info for styling (use provided or look up)
    const cardPillarInfo = pillarInfo || pillars.find(p => p.id === pillar) || pillars[2];

    return (
      <Link key={resource.id || index} href={`/resources/${resource.slug}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.03 }}
          className="group h-full"
        >
          <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-xl">
            {/* Featured Image */}
            {imageUrl && (
              <div className="relative h-48 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute top-4 left-4 z-20">
                  <Badge className={`bg-gradient-to-r ${cardPillarInfo.gradient} text-white`}>
                    {cardPillarInfo.name}
                  </Badge>
                </div>
              </div>
            )}

            <CardContent className="p-6">
              {/* Pillar Badge (if no image) */}
              {!imageUrl && (
                <div className="mb-3">
                  <Badge
                    variant="outline"
                    className={`${cardPillarInfo.borderColor} ${cardPillarInfo.iconColor}`}
                  >
                    {cardPillarInfo.emoji} {cardPillarInfo.name}
                  </Badge>
                </div>
              )}

              {/* Title */}
              <h3 className="mb-2 line-clamp-2 text-lg font-bold text-slate-900 transition-colors group-hover:text-purple-600">
                {resource.name}
              </h3>

              {/* Meta Info */}
              <div className="mb-3 flex items-center gap-3 text-xs text-slate-500">
                {author && (
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{author}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(publishedDate)}</span>
                </div>
                {readTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{readTime}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <p className="mb-4 line-clamp-3 text-sm text-slate-600">
                {resource.description ||
                  data?.summary ||
                  "Read more to discover insights on mental health and wellness."}
              </p>

              {/* Topics */}
              {topics.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {topics.slice(0, 3).map((topic, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700"
                    >
                      <Tag className="h-3 w-3" />
                      {topic}
                    </span>
                  ))}
                </div>
              )}

              {/* Read More Link */}
              <div className="flex items-center gap-2 text-sm font-semibold text-purple-600 transition-all group-hover:gap-3">
                <span>Read Article</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {showBackButton && (
            <div className="mb-4 flex justify-center sm:justify-start">
              <BackToResourcesButton />
            </div>
          )}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 text-center"
          >
            <h1 className="mb-2 text-2xl font-bold sm:text-3xl">
              <span className="bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
                Knowledge Hub
              </span>
            </h1>
            <p className="mx-auto mb-3 max-w-2xl text-sm text-slate-600">
              Explore our 4-pillar content hub: self-help resources, scientific research, practical guides, and community stories
            </p>
          </motion.div>
        </div>
      </section>

      {/* 4 Pillar Tabs - Full width with gradients */}
      <section className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Pillar Tabs */}
          <div className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map((pillar, index) => (
              <motion.button
                key={pillar.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() =>
                  setSelectedPillar(pillar.id === selectedPillar ? "latest" : pillar.id)
                }
                className={`group relative overflow-hidden rounded-lg border-2 p-4 text-left transition-all duration-300 ${
                  selectedPillar === pillar.id
                    ? `${pillar.borderColor} bg-gradient-to-br ${pillar.gradient} shadow-lg`
                    : `border-slate-200 ${pillar.bgColor} hover:border-slate-300 hover:shadow-md`
                }`}
              >
                {/* Background gradient overlay when selected */}
                {selectedPillar === pillar.id && (
                  <div className="absolute inset-0 bg-gradient-to-br opacity-90 ${pillar.gradient}" />
                )}

                {/* Content */}
                <div className="relative">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-2xl">{pillar.emoji}</span>
                    <div className="flex-1">
                      <h3
                        className={`text-sm font-bold ${
                          selectedPillar === pillar.id ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {pillar.name}
                      </h3>
                      <p
                        className={`text-xs ${
                          selectedPillar === pillar.id
                            ? "text-white/90"
                            : "text-slate-600"
                        }`}
                      >
                        {pillar.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={selectedPillar === pillar.id ? "default" : "outline"}
                      className={`text-xs ${
                        selectedPillar === pillar.id
                          ? "bg-white/20 text-white border-white/30"
                          : ""
                      }`}
                    >
                      {pillar.count} {pillar.count === 1 ? "article" : "articles"}
                    </Badge>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Latest & Trending Tab Button */}
          <div className="flex justify-center">
            <Button
              variant={selectedPillar === "latest" ? "primary" : "outline"}
              onClick={() => setSelectedPillar("latest")}
              className={`gap-2 transition-all ${
                selectedPillar === "latest"
                  ? "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                  : ""
              }`}
            >
              <Sparkles className="h-4 w-4" />
              Latest & Trending (Top 10)
            </Button>
          </div>
        </div>
      </section>


      {/* All Articles Grid (filtered) */}
      <section className="px-4 py-4 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {filteredResources.length > 0 ? (
            <>
              <div className="mb-6 flex items-center gap-3">
                {selectedPillar === "latest" && <Sparkles className="h-6 w-6 text-blue-600" />}
                <h2 className="text-2xl font-bold text-slate-900">
                  {selectedPillar === "latest"
                    ? "Latest & Trending"
                    : selectedPillar !== "all"
                    ? `${pillars.find(p => p.id === selectedPillar)?.name} Articles`
                    : "All Articles"}
                </h2>
              </div>
              {selectedPillar === "latest" && (
                <p className="mb-6 text-sm text-slate-600">
                  Our 10 most recent articles across all pillars, sorted by publication date
                </p>
              )}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredResources.map((resource, index) => (
                  <ArticleCard key={resource.id || index} resource={resource} index={index} />
                ))}
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Newspaper className="mx-auto mb-4 h-16 w-16 text-slate-300" />
                <h3 className="mb-2 text-xl font-semibold text-slate-900">No Articles Found</h3>
                <p className="mb-6 text-slate-600">
                  {searchQuery ? `No results for "${searchQuery}"` : "Try adjusting your filters"}
                </p>
                <Button onClick={clearFilters} variant="outline">
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
