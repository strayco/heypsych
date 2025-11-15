// Reusable hook for treatment category pages
// Handles filtering, sorting, pagination dynamically based on category config

import { useState, useMemo } from 'react';
import type { Entity } from '@/lib/types/database';
import { getTreatmentCategory, type TreatmentCategoryConfig } from '@/lib/config/treatment-categories';

export function useTreatmentCategory(
  categoryId: string,
  entities: Entity[] | undefined
) {
  const config = getTreatmentCategory(categoryId);

  if (!config) {
    throw new Error(`Treatment category "${categoryId}" not found in configuration`);
  }

  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [searchInput, setSearchInput] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>(config.defaultSort);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Auto-populate filter options from actual data
  const enrichedFilterCategories = useMemo(() => {
    if (!entities || !config) return [];

    return config.filterCategories.map((category) => {
      if (!category.autoPopulate) {
        return category;
      }

      // Extract unique values from entities based on field path
      const values = new Set<string>();

      entities.forEach((entity) => {
        const fieldPath = category.field.split('.');
        let value: any = entity;

        // Navigate through the field path
        for (const part of fieldPath) {
          value = value?.[part];
        }

        // Handle arrays
        if (Array.isArray(value)) {
          value.forEach((v: any) => {
            if (v != null) {
              const strValue = String(v);
              if (strValue.trim()) values.add(strValue);
            }
          });
        } else if (value != null) {
          const strValue = String(value);
          if (strValue.trim()) values.add(strValue);
        }
      });

      return {
        ...category,
        options: Array.from(values).sort((a, b) => a.localeCompare(b)),
      };
    });
  }, [entities, config]);

  // Filter entities
  const filteredEntities = useMemo(() => {
    if (!entities) return [];

    let results = entities;

    // Apply filters
    Object.entries(activeFilters).forEach(([categoryId, selectedValues]) => {
      if (!selectedValues.length) return;

      const filterCategory = enrichedFilterCategories.find((c) => c.id === categoryId);
      if (!filterCategory) return;

      results = results.filter((entity) => {
        const fieldPath = filterCategory.field.split('.');
        let value: any = entity;

        // Navigate through the field path
        for (const part of fieldPath) {
          value = value?.[part];
        }

        // Handle boolean values for Yes/No filters
        if (typeof value === 'boolean') {
          const boolValue = value ? 'Yes' : 'No';
          return selectedValues.includes(boolValue);
        }

        // Handle array values
        if (Array.isArray(value)) {
          return value.some((v) => selectedValues.includes(String(v)));
        }

        // Handle single values
        return selectedValues.includes(String(value));
      });
    });

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      results = results.filter((entity) => {
        const name = entity.name?.toLowerCase() || "";
        const description = entity.description?.toLowerCase() || "";
        const summary = (entity.data as any)?.summary?.toLowerCase() || "";

        return (
          name.includes(query) ||
          description.includes(query) ||
          summary.includes(query)
        );
      });
    }

    return results;
  }, [entities, activeFilters, searchQuery, enrichedFilterCategories]);

  // Sort entities
  const sortedEntities = useMemo(() => {
    if (!filteredEntities) return [];

    const sortOption = config.sortOptions.find((opt) => opt.id === sortBy);
    if (!sortOption) return filteredEntities;

    const sorted = [...filteredEntities];

    // Use custom sort function if provided
    if (sortOption.customSort) {
      sorted.sort(sortOption.customSort);
      return sorted;
    }

    // Default alphabetical sorting
    if (sortBy === 'a-z' || sortBy === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'z-a' || sortBy === 'name-desc') {
      sorted.sort((a, b) => b.name.localeCompare(a.name));
    }

    return sorted;
  }, [filteredEntities, sortBy, config.sortOptions]);

  // Paginate entities
  const paginatedEntities = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedEntities.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedEntities, currentPage]);

  const totalPages = Math.ceil(sortedEntities.length / ITEMS_PER_PAGE);

  // Filter helpers
  const handleFilterToggle = (categoryId: string, value: string) => {
    setActiveFilters((prev) => {
      const current = prev[categoryId] || [];
      const newValues = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];

      return {
        ...prev,
        [categoryId]: newValues,
      };
    });
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    setSearchInput("");
    setSearchQuery("");
    setCurrentPage(1);
  };

  const getActiveFilterCount = () => {
    return Object.values(activeFilters).reduce(
      (sum, values) => sum + values.length,
      0
    );
  };

  // Search handlers
  const handleSearch = () => {
    setSearchQuery(searchInput);
    setCurrentPage(1);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return {
    config,
    // Filter state
    activeFilters,
    enrichedFilterCategories,
    handleFilterToggle,
    clearAllFilters,
    getActiveFilterCount,
    // Search state
    searchInput,
    setSearchInput,
    searchQuery,
    handleSearch,
    handleSearchKeyDown,
    // Sort state
    sortBy,
    setSortBy,
    // Pagination state
    currentPage,
    setCurrentPage,
    totalPages,
    // Results
    filteredEntities,
    sortedEntities,
    paginatedEntities,
    totalResults: sortedEntities.length,
  };
}
