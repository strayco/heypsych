"use client";

import React, { useState, useEffect, ChangeEvent, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProviderCard } from "@/components/blocks/provider-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { logger, analytics } from "@/lib/utils/logger";
import {
  MapPin,
  Search,
  Filter,
  Users,
  Grid,
  List,
  X,
  AlertCircle,
  ArrowLeft,
  Phone,
} from "lucide-react";
import Link from "next/link";

// Transform API data to match component expectations
interface TransformedProvider {
  id: string;
  slug: string;
  data: {
    full_name: string;
    first_name: string;
    last_name: string;
    credentials: string;
    specialties: string[];
    address: {
      city: string;
      state: string;
    };
    phone: string | null;
    accepting_new_patients: boolean | null;
    telehealth_available: boolean | null;
    practice_name?: string;
    bio?: string;
  };
}

export default function ProvidersPage() {
  const [providers, setProviders] = useState<TransformedProvider[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [stateFilter, setStateFilter] = useState<string>("");
  const [cityFilter, setCityFilter] = useState<string>("");
  const [zipFilter, setZipFilter] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState<boolean>(true); // Show filters by default

  // Refs to hold current values for synchronous access
  // These are updated synchronously in onChange handlers to avoid React batching issues
  const stateFilterRef = React.useRef<string>("");
  const cityFilterRef = React.useRef<string>("");
  const zipFilterRef = React.useRef<string>("");

  // Track if we're doing a manual search to prevent duplicate fetches
  const isManualSearchRef = React.useRef<boolean>(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PROVIDERS_PER_PAGE = 50;

  // Active filters state - stores the filters currently applied
  // Start empty - only load providers after user applies filters
  const [activeFilters, setActiveFilters] = useState<Record<string, string | undefined>>({});
  const [hasSearched, setHasSearched] = useState(false);

  // Fetch providers from API with pagination
  const fetchProviders = useCallback(
    async (page = 1, filters = {}) => {
      const fetchStartTime = Date.now();
      logger.debug("🚀 fetchProviders called with:", { page, filters });

      setIsLoading(true);
      try {
        const offset = (page - 1) * PROVIDERS_PER_PAGE;
        const filteredParams = Object.fromEntries(Object.entries(filters).filter(([_, value]) => value));

        const params = new URLSearchParams({
          limit: PROVIDERS_PER_PAGE.toString(),
          offset: offset.toString(),
          ...filteredParams,
        });

        const url = `/api/providers/search?${params}`;
        logger.debug("📡 Fetching URL:", url);

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        logger.debug("📦 API Response:", {
          providersCount: data.providers?.length || 0,
          totalCount: data.totalCount,
          error: data.error,
        });

        // Check for API-level errors (like timeouts)
        if (data.error) {
          logger.error("API returned error:", null, { error: data.error });
          alert(data.error); // Show user-friendly error message
          setProviders([]);
          setTotalCount(0);
          return;
        }

        // Check if providers array exists and has data
        if (!data.providers || !Array.isArray(data.providers)) {
          logger.error("Invalid API response structure", null, { data });
          setProviders([]);
          setTotalCount(0);
          return;
        }

        // Transform API response to match component's expected format
        const transformedProviders: TransformedProvider[] = data.providers.map((p: any) => ({
          id: p.slug,
          slug: p.slug,
          data: {
            full_name: `${p.name?.first || ""} ${p.name?.last || ""}`.trim(),
            first_name: p.name?.first || "",
            last_name: p.name?.last || "",
            credentials: p.name?.credential || "",
            specialties: p.specialties || ["general_psychiatry"],
            address: {
              city: p.business?.practiceAddress?.city || "",
              state: p.business?.practiceAddress?.state || "",
            },
            phone: p.business?.phone || null,
            accepting_new_patients: null, // Not available from NPPES
            telehealth_available: null, // Not available from NPPES
            practice_name: p.business?.practiceAddress?.city
              ? `Practice in ${p.business.practiceAddress.city}`
              : undefined,
            bio: undefined,
          },
        }));

        setProviders(transformedProviders);
        setTotalCount(data.totalCount || 0);

        const loadTime = Date.now() - fetchStartTime;
        logger.debug("✅ Set providers:", transformedProviders.length, "Total count:", data.totalCount);

        // Track search analytics
        analytics.trackSearch({
          filters: filteredParams,
          resultsCount: data.totalCount || 0,
          loadTimeMs: loadTime,
        });
      } catch (error) {
        logger.error("Failed to fetch providers", error);
        setProviders([]);
        setTotalCount(0);
      } finally {
        setIsLoading(false);
      }
    },
    [PROVIDERS_PER_PAGE]
  );

  // Fetch providers when page or activeFilters change (including initial mount)
  // Skip if this is a manual search (handleSearch already called fetchProviders)
  useEffect(() => {
    logger.debug("⚡ useEffect triggered:", {
      hasSearched,
      isManualSearch: isManualSearchRef.current,
      currentPage,
      activeFilters,
    });

    if (hasSearched && !isManualSearchRef.current) {
      logger.debug("🔄 useEffect calling fetchProviders");
      fetchProviders(currentPage, activeFilters);
    } else {
      logger.debug("⏭️ useEffect skipped fetch");
    }
    // Reset the manual search flag after the effect runs
    isManualSearchRef.current = false;
  }, [currentPage, activeFilters, fetchProviders, hasSearched]);

  // Handle manual search (for Enter key or Search button)
  const handleSearch = useCallback(() => {
    // Use refs for synchronous reads to avoid React batching issues
    // This ensures we always get the latest values even if state updates are batched
    const filters = {
      q: searchQuery.trim() || undefined,
      state: stateFilterRef.current.trim() || undefined,
      city: cityFilterRef.current.trim() || undefined,
      zip: zipFilterRef.current.trim() || undefined,
      specialization: selectedSpecialties.length > 0 ? selectedSpecialties.join(",") : undefined,
    };

    logger.debug("🔍 Applying filters:", filters);

    // Track filter usage
    if (filters.state) analytics.trackFilterUsage("state", filters.state);
    if (filters.city) analytics.trackFilterUsage("city", filters.city);
    if (filters.specialization) analytics.trackFilterUsage("specialization", filters.specialization);

    // Set flag to prevent useEffect from also fetching
    isManualSearchRef.current = true;

    // Update state for UI consistency
    setActiveFilters(filters);
    setHasSearched(true);
    setCurrentPage(1);

    // Call fetchProviders directly with the filters to avoid React batching delays
    // This ensures the fetch happens immediately with the correct filter values
    fetchProviders(1, filters);
  }, [searchQuery, selectedSpecialties, fetchProviders]);

  // Handle search input change
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle Enter key press for immediate search
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  // Always show all available specialty options (excluding general_psychiatry since all are general at minimum)
  const allAvailableSpecialties = [
    "child_adolescent",
    "forensic",
    "addiction",
    "geriatric",
  ].sort();

  // Specialty display names
  const specialtyNames: Record<string, string> = {
    general_psychiatry: "General Psychiatry",
    child_adolescent: "Child/Adolescent",
    forensic: "Forensic Psychiatry",
    addiction: "Addiction Psychiatry",
    geriatric: "Geriatric Psychiatry",
    depression: "Depression",
    anxiety: "Anxiety Disorders",
    adhd: "ADHD",
    bipolar: "Bipolar Disorder",
    trauma: "Trauma/PTSD",
    eating_disorders: "Eating Disorders",
    psychotic_disorders: "Psychotic Disorders",
    psychiatry: "General Psychiatry",
  };

  // All filtering is now done server-side - just use providers as-is
  const filteredProviders = providers || [];

  const handleContactProvider = (provider: TransformedProvider) => {
    analytics.trackContact(provider.slug, "phone");
    const phone = provider.data.phone;
    if (phone) {
      window.open(`tel:${phone}`, "_self");
    }
  };

  const handleViewProfile = (provider: TransformedProvider) => {
    analytics.trackProfileView(provider.slug);
    window.location.href = `/psychiatrists/${provider.slug}`;
  };

  const clearFilters = () => {
    setSelectedSpecialties([]);
    setSearchQuery("");
    setStateFilter("");
    setCityFilter("");
    setZipFilter("");
    // Clear refs synchronously
    stateFilterRef.current = "";
    cityFilterRef.current = "";
    zipFilterRef.current = "";
    setActiveFilters({});
    setHasSearched(false);
    setProviders([]);
    setTotalCount(0);
    setCurrentPage(1);
  };

  const activeFiltersCount = [
    selectedSpecialties.length > 0,
    searchQuery.length > 0,
    stateFilter.length > 0,
    cityFilter.length > 0,
    zipFilter.length > 0,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        {/* Back Button + Title Row */}
        <div className="mb-4 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" className="group">
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to Home
            </Button>
          </Link>

          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Psychiatrists
            </span>
          </h1>

          <div className="w-[140px]"></div>
        </div>

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <p className="mx-auto mb-3 max-w-2xl text-sm text-slate-600">
            Find board-certified psychiatrists in your area. Psychiatrists are medical doctors who
            can prescribe medication and provide comprehensive mental health treatment.
          </p>

          {/* Quick Stats */}
          <div className="mb-4 flex items-center justify-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              {isLoading && hasSearched ? (
                <div className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-green-500 border-t-transparent"></div>
              ) : (
                <>
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                  {hasSearched ? totalCount.toLocaleString() : "68,945"}{" "}
                  {hasSearched && totalCount > 0 ? "Matching" : "Total"} Psychiatrists
                </>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
              Board-Certified
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-purple-500"></div>
              Updated Oct 2025
            </div>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card>
            <CardContent className="p-6">
              {/* Search Bar */}
              <div className="relative mb-6">
                <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-neutral-600" />
                <Input
                  type="text"
                  placeholder="Search by name"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchKeyDown}
                  className="h-12 pl-10 text-lg"
                />
                <Button
                  onClick={handleSearch}
                  className="absolute top-1/2 right-2 h-8 -translate-y-1/2 transform"
                  size="sm"
                >
                  Search
                </Button>
              </div>

              {/* Filter Controls */}
              <div className="mb-4 flex flex-wrap items-center gap-4">
                <Button
                  variant={showFilters ? "primary" : "outline"}
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-2"
                >
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                  {activeFiltersCount > 0 && (
                    <Badge variant="outline" className="ml-1">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex items-center space-x-2 text-neutral-700">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                    <span className="text-sm">Loading...</span>
                  </div>
                )}

                {/* View Mode Toggle */}
                <div className="ml-auto flex items-center space-x-2">
                  <Button
                    variant={viewMode === "grid" ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Expanded Filters */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t pt-4"
                  >
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                      {/* Location Filters */}
                      <div className="space-y-3">
                        <label className="mb-2 block text-sm font-medium text-neutral-800">
                          Location
                        </label>

                        {/* State Filter */}
                        <div>
                          <label htmlFor="state-filter" className="mb-1 block text-xs text-neutral-800">
                            State
                          </label>
                          <select
                            id="state-filter"
                            value={stateFilter}
                            onChange={(e) => {
                              const newState = e.target.value;
                              logger.debug("📍 State filter changed to:", newState);
                              setStateFilter(newState);
                              stateFilterRef.current = newState; // Update ref synchronously
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleSearch();
                              }
                            }}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">All States</option>
                            <option value="AL">Alabama</option>
                            <option value="AK">Alaska</option>
                            <option value="AZ">Arizona</option>
                            <option value="AR">Arkansas</option>
                            <option value="CA">California</option>
                            <option value="CO">Colorado</option>
                            <option value="CT">Connecticut</option>
                            <option value="DE">Delaware</option>
                            <option value="FL">Florida</option>
                            <option value="GA">Georgia</option>
                            <option value="HI">Hawaii</option>
                            <option value="ID">Idaho</option>
                            <option value="IL">Illinois</option>
                            <option value="IN">Indiana</option>
                            <option value="IA">Iowa</option>
                            <option value="KS">Kansas</option>
                            <option value="KY">Kentucky</option>
                            <option value="LA">Louisiana</option>
                            <option value="ME">Maine</option>
                            <option value="MD">Maryland</option>
                            <option value="MA">Massachusetts</option>
                            <option value="MI">Michigan</option>
                            <option value="MN">Minnesota</option>
                            <option value="MS">Mississippi</option>
                            <option value="MO">Missouri</option>
                            <option value="MT">Montana</option>
                            <option value="NE">Nebraska</option>
                            <option value="NV">Nevada</option>
                            <option value="NH">New Hampshire</option>
                            <option value="NJ">New Jersey</option>
                            <option value="NM">New Mexico</option>
                            <option value="NY">New York</option>
                            <option value="NC">North Carolina</option>
                            <option value="ND">North Dakota</option>
                            <option value="OH">Ohio</option>
                            <option value="OK">Oklahoma</option>
                            <option value="OR">Oregon</option>
                            <option value="PA">Pennsylvania</option>
                            <option value="RI">Rhode Island</option>
                            <option value="SC">South Carolina</option>
                            <option value="SD">South Dakota</option>
                            <option value="TN">Tennessee</option>
                            <option value="TX">Texas</option>
                            <option value="UT">Utah</option>
                            <option value="VT">Vermont</option>
                            <option value="VA">Virginia</option>
                            <option value="WA">Washington</option>
                            <option value="WV">West Virginia</option>
                            <option value="WI">Wisconsin</option>
                            <option value="WY">Wyoming</option>
                          </select>
                        </div>

                        {/* City Filter */}
                        <div>
                          <label htmlFor="city-filter" className="mb-1 block text-xs text-neutral-800">
                            City
                          </label>
                          <Input
                            id="city-filter"
                            type="text"
                            placeholder="Enter city name"
                            value={cityFilter}
                            onChange={(e) => {
                              setCityFilter(e.target.value);
                              cityFilterRef.current = e.target.value; // Update ref synchronously
                            }}
                            className="h-9 text-sm"
                          />
                        </div>

                        {/* Zip Code Filter */}
                        <div>
                          <label htmlFor="zip-filter" className="mb-1 block text-xs text-neutral-800">
                            Zip Code
                          </label>
                          <Input
                            id="zip-filter"
                            type="text"
                            placeholder="Enter zip code"
                            value={zipFilter}
                            onChange={(e) => {
                              setZipFilter(e.target.value);
                              zipFilterRef.current = e.target.value; // Update ref synchronously
                            }}
                            className="h-9 text-sm"
                            maxLength={5}
                          />
                        </div>
                      </div>

                      {/* Specialty Filter */}
                      <div>
                        <label className="mb-2 block text-sm font-medium text-neutral-800">
                          Specialties
                        </label>
                        <div className="max-h-60 overflow-y-auto rounded-md border border-gray-300 bg-white p-3">
                          <div className="space-y-2">
                            {allAvailableSpecialties.map((specialty) => {
                              const isSelected = selectedSpecialties.includes(specialty);
                              return (
                                <label
                                  key={specialty}
                                  className="flex cursor-pointer items-center space-x-2 rounded p-1 hover:bg-neutral-50"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedSpecialties((prev) => [...prev, specialty]);
                                      } else {
                                        setSelectedSpecialties((prev) =>
                                          prev.filter((s) => s !== specialty)
                                        );
                                      }
                                    }}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-sm text-neutral-900">
                                    {specialtyNames[specialty] || specialty}
                                  </span>
                                </label>
                              );
                            })}
                          </div>

                          {/* Quick actions */}
                          {selectedSpecialties.length > 0 && (
                            <div className="mt-3 border-t border-neutral-200 pt-2">
                              <button
                                onClick={() => setSelectedSpecialties([])}
                                className="text-xs text-neutral-700 hover:text-neutral-800"
                              >
                                Clear all ({selectedSpecialties.length})
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Apply Filters and Clear Filters */}
                      <div className="flex flex-col items-start justify-end gap-2">
                        <Button
                          onClick={handleSearch}
                          className="w-full"
                          disabled={isLoading}
                        >
                          <Search className="mr-2 h-4 w-4" />
                          Apply Filters
                        </Button>
                        {activeFiltersCount > 0 && (
                          <Button
                            variant="ghost"
                            onClick={clearFilters}
                            className="w-full text-neutral-800 hover:text-neutral-900"
                          >
                            <X className="mr-2 h-4 w-4" />
                            Clear All ({activeFiltersCount})
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results Summary */}
        {hasSearched && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between">
              {totalCount > 0 && (
                <p className="text-neutral-800">
                  Showing <span className="font-semibold">{((currentPage - 1) * PROVIDERS_PER_PAGE) + 1}-{Math.min(currentPage * PROVIDERS_PER_PAGE, totalCount)}</span> of{" "}
                  <span className="font-semibold">{totalCount.toLocaleString()}</span> psychiatrists
                </p>
              )}

              {/* Active Filters Display */}
            {activeFiltersCount > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-neutral-800">Active filters:</span>
                <div className="flex flex-wrap gap-2">
                  {searchQuery && (
                    <Badge variant="outline" className="flex items-center space-x-1">
                      <span>"{searchQuery}"</span>
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery("")} />
                    </Badge>
                  )}
                  {stateFilter && (
                    <Badge variant="outline" className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>{stateFilter}</span>
                      <X className="h-3 w-3 cursor-pointer" onClick={() => {
                        setStateFilter("");
                        stateFilterRef.current = "";
                      }} />
                    </Badge>
                  )}
                  {cityFilter && (
                    <Badge variant="outline" className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>{cityFilter}</span>
                      <X className="h-3 w-3 cursor-pointer" onClick={() => {
                        setCityFilter("");
                        cityFilterRef.current = "";
                      }} />
                    </Badge>
                  )}
                  {zipFilter && (
                    <Badge variant="outline" className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>ZIP: {zipFilter}</span>
                      <X className="h-3 w-3 cursor-pointer" onClick={() => {
                        setZipFilter("");
                        zipFilterRef.current = "";
                      }} />
                    </Badge>
                  )}
                  {selectedSpecialties.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selectedSpecialties.map((specialty) => (
                        <Badge
                          key={specialty}
                          variant="outline"
                          className="flex items-center space-x-1"
                        >
                          <span>{specialtyNames[specialty]}</span>
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() =>
                              setSelectedSpecialties((prev) => prev.filter((s) => s !== specialty))
                            }
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
        )}

        {/* Providers Grid/List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {!hasSearched ? (
            <Card className="py-12 text-center">
              <CardContent>
                <Users className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                <h3 className="mb-2 text-xl font-semibold text-neutral-900">
                  Ready to find psychiatrists
                </h3>
                <p className="mb-4 text-neutral-800">
                  Use the filters above to search by location, specialty, or name. Click "Apply Filters" or "Search" to see results.
                </p>
                <Button onClick={handleSearch} size="lg" className="mt-2">
                  <Search className="mr-2 h-5 w-5" />
                  Search All Psychiatrists
                </Button>
              </CardContent>
            </Card>
          ) : isLoading ? (
            <Card className="py-16 text-center">
              <CardContent>
                <div className="flex flex-col items-center space-y-6">
                  {/* Animated Loading Spinner */}
                  <div className="relative">
                    <div className="h-20 w-20 animate-spin rounded-full border-8 border-blue-200 border-t-blue-600"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>

                  {/* Loading Text */}
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-neutral-900">Searching Psychiatrists...</h3>
                    <p className="text-base text-neutral-800">
                      Searching through 69,000+ providers
                    </p>
                    <p className="text-sm text-neutral-700">
                      This may take a few seconds. Please wait...
                    </p>
                  </div>

                  {/* Progress Dots */}
                  <div className="flex space-x-2">
                    <div className="h-3 w-3 animate-bounce rounded-full bg-blue-600" style={{ animationDelay: '0ms' }}></div>
                    <div className="h-3 w-3 animate-bounce rounded-full bg-blue-600" style={{ animationDelay: '150ms' }}></div>
                    <div className="h-3 w-3 animate-bounce rounded-full bg-blue-600" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : filteredProviders.length === 0 ? (
            <Card className="py-12 text-center">
              <CardContent>
                <AlertCircle className="mx-auto mb-4 h-12 w-12 text-neutral-600" />
                <h3 className="mb-2 text-lg font-semibold text-neutral-900">No psychiatrists found</h3>
                <p className="mb-4 text-neutral-800">
                  Try adjusting your filters or search terms to find more providers.
                </p>
                <Button onClick={clearFilters} variant="outline">
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
                  : "space-y-4"
              }
            >
              {filteredProviders.map((provider, index) => (
                <motion.div
                  key={provider.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ProviderCard
                    provider={provider as any}
                    variant={viewMode === "list" ? "detailed" : "default"}
                    onContact={() => handleContactProvider(provider)}
                    onViewProfile={() => handleViewProfile(provider)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Pagination Controls */}
        {hasSearched && totalCount > PROVIDERS_PER_PAGE && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 flex items-center justify-center gap-4"
          >
            <Button
              variant="outline"
              disabled={currentPage === 1 || isLoading}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-neutral-800">
                Page {currentPage} of {Math.ceil(totalCount / PROVIDERS_PER_PAGE)}
              </span>
              <span className="text-neutral-600">•</span>
              <span className="text-neutral-800">
                {totalCount.toLocaleString()} total psychiatrists
              </span>
            </div>

            <Button
              variant="outline"
              disabled={currentPage >= Math.ceil(totalCount / PROVIDERS_PER_PAGE) || isLoading}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </Button>
          </motion.div>
        )}

        {/* Call to Action */}
        {providers && providers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12"
          >
            <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-green-50">
              <CardContent className="p-8 text-center">
                <h3 className="mb-2 text-xl font-semibold text-neutral-900">
                  Can't find the right psychiatrist?
                </h3>
                <p className="mb-4 text-neutral-800">
                  We're always adding new providers to our directory. Check back soon or contact us
                  for help finding the right care.
                </p>
                <div className="flex flex-col justify-center gap-4 sm:flex-row">
                  <Button variant="outline">
                    <MapPin className="mr-2 h-4 w-4" />
                    Expand Search Area
                  </Button>
                  <Button variant="primary">
                    <Phone className="mr-2 h-4 w-4" />
                    Get Help Finding Care
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
