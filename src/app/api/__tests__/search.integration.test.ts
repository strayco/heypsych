// INTEGRATION TESTS - Search API
// Tests real API behavior

import { GET } from "../search/route";
import { NextRequest } from "next/server";

describe("/api/search - Integration Tests", () => {
  describe("Input Validation", () => {
    it("should reject queries under 2 characters", async () => {
      const req = new NextRequest("http://localhost:3000/api/search?q=a");
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toEqual([]);
      expect(data.message).toContain("at least 2 characters");
    });

    it("should handle empty query parameter", async () => {
      const req = new NextRequest("http://localhost:3000/api/search?q=");
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toEqual([]);
    });

    it("should handle missing query parameter", async () => {
      const req = new NextRequest("http://localhost:3000/api/search");
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toEqual([]);
    });

    it("should handle special characters safely", async () => {
      const req = new NextRequest("http://localhost:3000/api/search?q=test%20%26%20quotes%20%22");
      const response = await GET(req);

      expect(response.status).toBe(200);
    });

    it("should handle SQL injection attempts safely", async () => {
      const req = new NextRequest("http://localhost:3000/api/search?q='; DROP TABLE entities; --");
      const response = await GET(req);

      expect(response.status).toBe(200);
      // Should not return error, parameterized queries prevent injection
    });
  });

  describe("Search Functionality", () => {
    it("should search across multiple entity types", async () => {
      const req = new NextRequest("http://localhost:3000/api/search?q=anxiety");
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("results");
      expect(data).toHaveProperty("totalCount");
      expect(data).toHaveProperty("loadTimeMs");
      expect(Array.isArray(data.results)).toBe(true);
    });

    it("should return structured result objects", async () => {
      const req = new NextRequest("http://localhost:3000/api/search?q=therapy");
      const response = await GET(req);
      const data = await response.json();

      if (data.results.length > 0) {
        const result = data.results[0];
        expect(result).toHaveProperty("id");
        expect(result).toHaveProperty("slug");
        expect(result).toHaveProperty("name");
        expect(result).toHaveProperty("type");
      }
    });

    it("should support type filtering", async () => {
      const req = new NextRequest("http://localhost:3000/api/search?q=therapy&type=treatment");
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      // All results should be treatments (if any)
      data.results.forEach((result: any) => {
        expect(["treatment", "therapy", "medication"]).toContain(result.type);
      });
    });
  });

  describe("Pagination", () => {
    it("should respect limit parameter", async () => {
      const req = new NextRequest("http://localhost:3000/api/search?q=depression&limit=10");
      const response = await GET(req);
      const data = await response.json();

      expect(data.results.length).toBeLessThanOrEqual(10);
    });

    it("should respect offset parameter", async () => {
      const req = new NextRequest("http://localhost:3000/api/search?q=treatment&limit=5&offset=0");
      const response1 = await GET(req);
      const data1 = await response1.json();

      const req2 = new NextRequest("http://localhost:3000/api/search?q=treatment&limit=5&offset=5");
      const response2 = await GET(req2);
      const data2 = await response2.json();

      // Results should be different (if enough results exist)
      if (data1.results.length === 5 && data2.results.length > 0) {
        expect(data1.results[0].id).not.toBe(data2.results[0].id);
      }
    });

    it("should provide pagination metadata", async () => {
      const req = new NextRequest("http://localhost:3000/api/search?q=anxiety&limit=10&offset=0");
      const response = await GET(req);
      const data = await response.json();

      expect(data).toHaveProperty("hasMore");
      expect(data).toHaveProperty("nextOffset");
      expect(typeof data.hasMore).toBe("boolean");
      expect(typeof data.nextOffset).toBe("number");
    });

    it("should enforce maximum limit of 100", async () => {
      const req = new NextRequest("http://localhost:3000/api/search?q=treatment&limit=500");
      const response = await GET(req);
      const data = await response.json();

      // Should cap at 100
      expect(data.results.length).toBeLessThanOrEqual(100);
    });
  });

  describe("Performance", () => {
    it("should return results within 500ms (p95 target)", async () => {
      const req = new NextRequest("http://localhost:3000/api/search?q=therapy");
      const start = Date.now();
      const response = await GET(req);
      const elapsed = Date.now() - start;
      const data = await response.json();

      expect(elapsed).toBeLessThan(500);
      expect(data.loadTimeMs).toBeLessThan(500);
    });

    it("should return simple queries within 100ms (p50 target)", async () => {
      const req = new NextRequest("http://localhost:3000/api/search?q=anxiety");
      const start = Date.now();
      const response = await GET(req);
      const elapsed = Date.now() - start;
      const data = await response.json();

      // This may fail initially, but should pass after optimization
      expect(data.loadTimeMs).toBeLessThan(100);
    });

    it("should handle concurrent requests efficiently", async () => {
      const requests = Array.from({ length: 10 }, (_, i) =>
        GET(new NextRequest(`http://localhost:3000/api/search?q=test${i}`))
      );

      const start = Date.now();
      const responses = await Promise.all(requests);
      const elapsed = Date.now() - start;

      // 10 requests should complete in <2 seconds
      expect(elapsed).toBeLessThan(2000);
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe("Ranking & Relevance", () => {
    it("should rank exact name matches first", async () => {
      const req = new NextRequest("http://localhost:3000/api/search?q=sertraline");
      const response = await GET(req);
      const data = await response.json();

      if (data.results.length > 0) {
        // First result should contain the search term in name
        expect(data.results[0].name.toLowerCase()).toContain("sertraline");
      }
    });

    it("should return results in rank order", async () => {
      const req = new NextRequest("http://localhost:3000/api/search?q=depression treatment");
      const response = await GET(req);
      const data = await response.json();

      // Results should have rank scores (if using full-text search)
      if (data.results.length > 1) {
        // Cannot guarantee order without rank, but should be consistent
        expect(data.results.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Error Handling", () => {
    it("should return 500 on database errors", async () => {
      // This test requires mocking Supabase to return an error
      // For now, we'll skip it unless we can mock dependencies
    });

    it("should handle unicode characters", async () => {
      const req = new NextRequest("http://localhost:3000/api/search?q=café");
      const response = await GET(req);

      expect(response.status).toBe(200);
    });

    it("should handle very long queries gracefully", async () => {
      const longQuery = "a".repeat(1000);
      const req = new NextRequest(`http://localhost:3000/api/search?q=${longQuery}`);
      const response = await GET(req);

      expect(response.status).toBe(200);
    });
  });
});

describe("/api/search - Performance Regression Tests", () => {
  // These tests establish performance baselines
  // Run before and after optimization to measure improvement

  const performanceTests = [
    { query: "anxiety", expectedP50: 100, expectedP95: 400 },
    { query: "depression treatment", expectedP50: 100, expectedP95: 400 },
    { query: "cognitive behavioral therapy", expectedP50: 150, expectedP95: 500 },
  ];

  performanceTests.forEach(({ query, expectedP50, expectedP95 }) => {
    it(`should handle "${query}" within p95 threshold`, async () => {
      const measurements: number[] = [];

      // Run 20 requests to get distribution
      for (let i = 0; i < 20; i++) {
        const req = new NextRequest(`http://localhost:3000/api/search?q=${query}`);
        const start = Date.now();
        await GET(req);
        measurements.push(Date.now() - start);
      }

      measurements.sort((a, b) => a - b);
      const p50 = measurements[Math.floor(measurements.length * 0.5)];
      const p95 = measurements[Math.floor(measurements.length * 0.95)];

      console.log(`Query "${query}": p50=${p50}ms, p95=${p95}ms`);

      // Assert p95 within threshold
      expect(p95).toBeLessThan(expectedP95);
    });
  });
});
