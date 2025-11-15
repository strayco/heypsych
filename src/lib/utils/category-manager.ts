// src/lib/utils/category-manager.ts - Utility for managing dynamic categories
import { readdirSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

export class CategoryManager {
  private static readonly DATA_PATH = join(process.cwd(), "data");

  /** Get all treatment categories */
  static getTreatmentCategories(): string[] {
    return this.getCategoriesForType("treatments");
  }

  /** Get all condition categories */
  static getConditionCategories(): string[] {
    return this.getCategoriesForType("conditions");
  }

  /** Generic method to get categories for any type */
  static getCategoriesForType(type: string): string[] {
    try {
      const typePath = join(this.DATA_PATH, type);

      if (!existsSync(typePath)) {
        console.warn(`${type} directory not found:`, typePath);
        return [];
      }

      return readdirSync(typePath, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name)
        .sort();
    } catch (error) {
      console.error(`Error scanning ${type} categories:`, error);
      return [];
    }
  }

  /** Get all files in a specific category */
  static getFilesInCategory(type: string, category: string): string[] {
    try {
      const categoryPath = join(this.DATA_PATH, type, category);

      if (!existsSync(categoryPath)) {
        return [];
      }

      return readdirSync(categoryPath)
        .filter((file) => file.endsWith(".json"))
        .map((file) => file.replace(".json", ""))
        .sort();
    } catch (error) {
      console.error(`Error reading ${type}/${category}:`, error);
      return [];
    }
  }

  /** Create a new category directory */
  static createCategory(type: string, category: string): boolean {
    try {
      const categoryPath = join(this.DATA_PATH, type, category);

      if (existsSync(categoryPath)) {
        console.log(`Category ${type}/${category} already exists`);
        return true;
      }

      mkdirSync(categoryPath, { recursive: true });
      console.log(`✅ Created new category: ${type}/${category}`);
      return true;
    } catch (error) {
      console.error(`Error creating category ${type}/${category}:`, error);
      return false;
    }
  }

  /** Get comprehensive category information */
  static getCategoryInfo(type: string, category: string) {
    const files = this.getFilesInCategory(type, category);
    const categoryPath = join(this.DATA_PATH, type, category);

    return {
      category,
      type,
      path: categoryPath,
      exists: existsSync(categoryPath),
      fileCount: files.length,
      files: files,
      lastModified: existsSync(categoryPath)
        ? readdirSync(categoryPath, { withFileTypes: true }).filter((f) => f.isFile()).length > 0
          ? "Has files"
          : "Empty"
        : "Does not exist",
    };
  }

  /** Get a complete overview of all categories */
  static getFullOverview() {
    const treatments = this.getTreatmentCategories();
    const conditions = this.getConditionCategories();

    return {
      treatments: {
        categories: treatments,
        count: treatments.length,
        details: treatments.map((cat) => this.getCategoryInfo("treatments", cat)),
      },
      conditions: {
        categories: conditions,
        count: conditions.length,
        details: conditions.map((cat) => this.getCategoryInfo("conditions", cat)),
      },
      summary: {
        totalTreatmentCategories: treatments.length,
        totalConditionCategories: conditions.length,
        totalCategories: treatments.length + conditions.length,
      },
    };
  }

  /** Validate category structure */
  static validateStructure(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check if base directories exist
    const treatmentsPath = join(this.DATA_PATH, "treatments");
    const conditionsPath = join(this.DATA_PATH, "conditions");

    if (!existsSync(treatmentsPath)) {
      issues.push("treatments directory does not exist");
    }

    if (!existsSync(conditionsPath)) {
      issues.push("conditions directory does not exist");
    }

    // Check if categories have files
    const treatmentCategories = this.getTreatmentCategories();
    for (const category of treatmentCategories) {
      const files = this.getFilesInCategory("treatments", category);
      if (files.length === 0) {
        issues.push(`Treatment category '${category}' is empty`);
      }
    }

    const conditionCategories = this.getConditionCategories();
    for (const category of conditionCategories) {
      const files = this.getFilesInCategory("conditions", category);
      if (files.length === 0) {
        issues.push(`Condition category '${category}' is empty`);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /** Get entity type mapping for treatment categories */
  static getEntityTypeMapping(): Record<string, string> {
    const treatments = this.getTreatmentCategories();
    const mapping: Record<string, string> = {};

    treatments.forEach((category) => {
      switch (category) {
        case "medications":
          mapping[category] = "medication";
          break;
        case "interventional":
          mapping[category] = "interventional";
          break;
        case "investigational":
          mapping[category] = "investigational";
          break;
        case "alternative":
          mapping[category] = "alternative";
          break;
        case "therapy":
          mapping[category] = "therapy";
          break;
        case "supplements":
          mapping[category] = "supplement";
          break;
        default:
          mapping[category] = "treatment";
      }
    });

    return mapping;
  }
}

// Export convenience functions
export const getTreatmentCategories = () => CategoryManager.getTreatmentCategories();
export const getConditionCategories = () => CategoryManager.getConditionCategories();
export const getCategoryOverview = () => CategoryManager.getFullOverview();
export const validateCategoryStructure = () => CategoryManager.validateStructure();
