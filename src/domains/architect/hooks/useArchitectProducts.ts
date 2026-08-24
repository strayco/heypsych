// src/domains/architect/hooks/useArchitectProducts.ts
// Client-side hook for loading Architect products

"use client";

import { useState, useEffect, useCallback } from "react";
import type { ProductArchitectureMetadata } from "../schemas";
import type { ArchitectProductDisplay } from "../services";
import type { ArchitectProductsResponse } from "@/app/api/architect/products/route";

export interface UseArchitectProductsResult {
  metadataMap: Map<string, ProductArchitectureMetadata>;
  displayMap: Map<string, ArchitectProductDisplay>;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to load real V4 products adapted for Architect
 */
export function useArchitectProducts(): UseArchitectProductsResult {
  const [metadataMap, setMetadataMap] = useState<Map<string, ProductArchitectureMetadata>>(new Map());
  const [displayMap, setDisplayMap] = useState<Map<string, ArchitectProductDisplay>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/architect/products");

      if (!response.ok) {
        throw new Error(`Failed to load products: ${response.status}`);
      }

      const data: ArchitectProductsResponse = await response.json();

      // Convert arrays back to maps
      const newMetadataMap = new Map<string, ProductArchitectureMetadata>();
      const newDisplayMap = new Map<string, ArchitectProductDisplay>();

      for (const { slug, metadata, display } of data.products) {
        newMetadataMap.set(slug, metadata);
        newDisplayMap.set(slug, display);
      }

      setMetadataMap(newMetadataMap);
      setDisplayMap(newDisplayMap);
    } catch (err) {
      console.error("[useArchitectProducts] Failed to load products:", err);
      setError(err instanceof Error ? err : new Error("Failed to load products"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    metadataMap,
    displayMap,
    isLoading,
    error,
    refetch: fetchProducts,
  };
}
