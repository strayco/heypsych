// CRITICAL UNIT TESTS - EntityService
// Covers core data access patterns

import { EntityService } from "../entity-service";
import { supabase } from "@/lib/config/database";

// Mock Supabase
jest.mock("@/lib/config/database", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe("EntityService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getBySlug", () => {
    it("should return entity from database when found", async () => {
      const mockEntity = {
        id: "123",
        slug: "sertraline",
        name: "Sertraline",
        type: "medication",
        status: "active",
      };

      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockEntity, error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const result = await EntityService.getBySlug("sertraline");

      expect(supabase.from).toHaveBeenCalledWith("entities");
      expect(mockFrom.eq).toHaveBeenCalledWith("slug", "sertraline");
      expect(result).toEqual(mockEntity);
    });

    it("should handle database errors gracefully", async () => {
      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Database error" },
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const result = await EntityService.getBySlug("invalid-slug");

      expect(result).toBeNull();
    });

    it("should normalize entity data consistently", async () => {
      const mockEntity = {
        id: "123",
        slug: "therapy",
        name: "Cognitive Behavioral Therapy",
        type: "therapy",
        data: {
          sections: [{ type: "overview", text: "CBT overview" }],
        },
      };

      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockEntity, error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const result = await EntityService.getBySlug("therapy");

      expect(result).toHaveProperty("data.sections");
      expect(result?.data.sections).toHaveLength(1);
    });
  });

  describe("getAllTreatments", () => {
    it("should return all treatment types without duplicates", async () => {
      const mockTreatments = [
        { slug: "sertraline", type: "medication", name: "Sertraline" },
        { slug: "sertraline", type: "treatment", name: "Sertraline" }, // Duplicate
        { slug: "cbt", type: "therapy", name: "CBT" },
      ];

      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockTreatments, error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const result = await EntityService.getAllTreatments();

      // Should deduplicate by slug
      expect(result).toHaveLength(2);
      expect(result.map((t) => t.slug)).toEqual(["sertraline", "cbt"]);
    });
  });
});
