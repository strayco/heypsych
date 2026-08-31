// src/domains/architect/hooks/useArchitectProducts.ts
// Client-side hook for loading Architect products with full pagination

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ProductArchitectureMetadata } from "../schemas";
import type { ArchitectProductDisplay } from "../services";
import type { ArchitectProductsResponse } from "@/app/api/architect/products/route";

export interface UseArchitectProductsResult {
  metadataMap: Map<string, ProductArchitectureMetadata>;
  displayMap: Map<string, ArchitectProductDisplay>;
  isLoading: boolean;
  isInitialLoading: boolean; // First page loading
  loadingProgress: number; // 0-100
  error: Error | null;
  totalProducts: number;
  loadedProducts: number;
  refetch: () => Promise<void>;
  retry: () => Promise<void>;
}

// Page size for each request
const PAGE_SIZE = 100;

// Maximum retries per page
const MAX_RETRIES = 3;

// Delay between retries (exponential backoff)
const RETRY_DELAY_MS = 1000;

/**
 * Hook to load all V4 products adapted for Architect
 * Automatically paginates through all pages
 */
export function useArchitectProducts(): UseArchitectProductsResult {
  const [metadataMap, setMetadataMap] = useState<Map<string, ProductArchitectureMetadata>>(new Map());
  const [displayMap, setDisplayMap] = useState<Map<string, ArchitectProductDisplay>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loadedProducts, setLoadedProducts] = useState(0);

  // Track if a fetch is in progress to prevent duplicates
  const fetchInProgress = useRef(false);

  /**
   * Fetch a single page with retry logic
   */
  const fetchPage = useCallback(async (offset: number, retryCount = 0): Promise<ArchitectProductsResponse> => {
    try {
      const response = await fetch(`/api/architect/products?offset=${offset}&limit=${PAGE_SIZE}`);

      if (!response.ok) {
        throw new Error(`Failed to load products: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      if (retryCount < MAX_RETRIES) {
        // Exponential backoff
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAY_MS * Math.pow(2, retryCount))
        );
        return fetchPage(offset, retryCount + 1);
      }
      throw err;
    }
  }, []);

  /**
   * Fetch all products (paginated)
   */
  const fetchAllProducts = useCallback(async () => {
    // Prevent concurrent fetches
    if (fetchInProgress.current) return;
    fetchInProgress.current = true;

    setIsLoading(true);
    setIsInitialLoading(true);
    setError(null);
    setLoadingProgress(0);
    setLoadedProducts(0);

    try {
      const allMetadata = new Map<string, ProductArchitectureMetadata>();
      const allDisplay = new Map<string, ArchitectProductDisplay>();

      let offset = 0;
      let hasMore = true;
      let total = 0;
      let isFirst = true;

      while (hasMore) {
        const data = await fetchPage(offset);

        // Update total on first page
        if (isFirst) {
          total = data.total;
          setTotalProducts(total);
          setIsInitialLoading(false);
          isFirst = false;
        }

        // Add products to maps
        for (const { slug, metadata, display } of data.products) {
          allMetadata.set(slug, metadata);
          allDisplay.set(slug, display);
        }

        // Update progress
        const loaded = allMetadata.size;
        setLoadedProducts(loaded);
        setLoadingProgress(total > 0 ? Math.round((loaded / total) * 100) : 0);

        // Check if more pages
        hasMore = data.hasMore;
        offset += PAGE_SIZE;
      }

      setMetadataMap(allMetadata);
      setDisplayMap(allDisplay);
    } catch (err) {
      console.error("[useArchitectProducts] Failed to load products:", err);
      setError(err instanceof Error ? err : new Error("Failed to load products"));
    } finally {
      setIsLoading(false);
      fetchInProgress.current = false;
    }
  }, [fetchPage]);

  // Initial load
  useEffect(() => {
    fetchAllProducts();
  }, [fetchAllProducts]);

  return {
    metadataMap,
    displayMap,
    isLoading,
    isInitialLoading,
    loadingProgress,
    error,
    totalProducts,
    loadedProducts,
    refetch: fetchAllProducts,
    retry: fetchAllProducts,
  };
}

/**
 * Hook to load products for a specific capability
 * Useful for shortlist panes where you only need subset
 */
export function useArchitectProductsForCapability(
  capabilityId: string | null
): UseArchitectProductsResult {
  const [metadataMap, setMetadataMap] = useState<Map<string, ProductArchitectureMetadata>>(new Map());
  const [displayMap, setDisplayMap] = useState<Map<string, ArchitectProductDisplay>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [totalProducts, setTotalProducts] = useState(0);

  const fetchInProgress = useRef(false);

  const fetchProducts = useCallback(async () => {
    if (!capabilityId) {
      setMetadataMap(new Map());
      setDisplayMap(new Map());
      setTotalProducts(0);
      return;
    }

    if (fetchInProgress.current) return;
    fetchInProgress.current = true;

    setIsLoading(true);
    setError(null);

    try {
      // For capability-filtered requests, we can usually get all in one request
      const response = await fetch(
        `/api/architect/products?capability=${encodeURIComponent(capabilityId)}&limit=${PAGE_SIZE}`
      );

      if (!response.ok) {
        throw new Error(`Failed to load products: ${response.status}`);
      }

      const data: ArchitectProductsResponse = await response.json();

      const newMetadataMap = new Map<string, ProductArchitectureMetadata>();
      const newDisplayMap = new Map<string, ArchitectProductDisplay>();

      for (const { slug, metadata, display } of data.products) {
        newMetadataMap.set(slug, metadata);
        newDisplayMap.set(slug, display);
      }

      setMetadataMap(newMetadataMap);
      setDisplayMap(newDisplayMap);
      setTotalProducts(data.total);

      // If there are more pages, fetch them
      if (data.hasMore) {
        let offset = PAGE_SIZE;
        let hasMore = true;
        while (hasMore) {
          const nextResponse = await fetch(
            `/api/architect/products?capability=${encodeURIComponent(capabilityId)}&offset=${offset}&limit=${PAGE_SIZE}`
          );

          if (!nextResponse.ok) break;

          const nextData: ArchitectProductsResponse = await nextResponse.json();

          for (const { slug, metadata, display } of nextData.products) {
            newMetadataMap.set(slug, metadata);
            newDisplayMap.set(slug, display);
          }

          hasMore = nextData.hasMore;
          offset += PAGE_SIZE;
        }

        setMetadataMap(new Map(newMetadataMap));
        setDisplayMap(new Map(newDisplayMap));
      }
    } catch (err) {
      console.error("[useArchitectProductsForCapability] Failed to load products:", err);
      setError(err instanceof Error ? err : new Error("Failed to load products"));
    } finally {
      setIsLoading(false);
      fetchInProgress.current = false;
    }
  }, [capabilityId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    metadataMap,
    displayMap,
    isLoading,
    isInitialLoading: isLoading,
    loadingProgress: isLoading ? 50 : 100,
    error,
    totalProducts,
    loadedProducts: metadataMap.size,
    refetch: fetchProducts,
    retry: fetchProducts,
  };
}
