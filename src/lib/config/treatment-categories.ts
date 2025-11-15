// Centralized configuration for all treatment categories
// Add or remove categories here and all treatment pages will auto-adjust

export type TreatmentCategoryConfig = {
  id: string;
  label: string;
  slug: string;
  icon?: string;
  description?: string;
  filterCategories: FilterCategory[];
  sortOptions: SortOption[];
  defaultSort: string;
};

export type FilterCategory = {
  id: string;
  label: string;
  field: string; // Which field in metadata to filter by
  type: 'multi-select' | 'single-select' | 'range';
  options?: string[]; // For predefined options (will be auto-populated from data if not specified)
  autoPopulate?: boolean; // If true, options will be extracted from actual data
  transformValue?: (value: any) => string; // Optional transform function for values
};

export type SortOption = {
  id: string;
  label: string;
  field?: string; // Field to sort by (if not using custom logic)
  direction?: 'asc' | 'desc';
  customSort?: (a: any, b: any) => number; // Custom sorting function
};

export const TREATMENT_CATEGORIES: Record<string, TreatmentCategoryConfig> = {
  medications: {
    id: 'medications',
    label: 'Medications',
    slug: 'medications',
    description: 'Psychiatric medications and pharmacological treatments',
    filterCategories: [
      {
        id: 'drug_classes',
        label: 'Drug Class',
        field: 'metadata.drug_classes',
        type: 'multi-select',
        autoPopulate: true,
      },
      {
        id: 'therapeutic_categories',
        label: 'Therapeutic Category',
        field: 'metadata.therapeutic_categories',
        type: 'multi-select',
        autoPopulate: true,
      },
      {
        id: 'mechanism_categories',
        label: 'Mechanism',
        field: 'metadata.mechanism_categories',
        type: 'multi-select',
        autoPopulate: true,
      },
      {
        id: 'administration_routes',
        label: 'Route',
        field: 'metadata.administration_routes',
        type: 'multi-select',
        autoPopulate: true,
      },
      {
        id: 'controlled_substance',
        label: 'Controlled Substance',
        field: 'metadata.controlled_substance',
        type: 'single-select',
        options: ['Yes', 'No'],
      },
      {
        id: 'generic_available',
        label: 'Generic Available',
        field: 'metadata.generic_available',
        type: 'single-select',
        options: ['Yes', 'No'],
      },
    ],
    sortOptions: [
      { id: 'a-z', label: 'A-Z' },
      { id: 'z-a', label: 'Z-A' },
      {
        id: 'newest',
        label: 'Newest First',
        field: 'metadata.fda_approval_year',
        direction: 'desc',
        customSort: (a, b) => {
          const aYear = a.data?.metadata?.fda_approval_year || 0;
          const bYear = b.data?.metadata?.fda_approval_year || 0;
          if (bYear !== aYear) return bYear - aYear;
          return a.name.localeCompare(b.name);
        },
      },
      {
        id: 'oldest',
        label: 'Oldest First',
        field: 'metadata.fda_approval_year',
        direction: 'asc',
        customSort: (a, b) => {
          const aYear = a.data?.metadata?.fda_approval_year || 9999;
          const bYear = b.data?.metadata?.fda_approval_year || 9999;
          if (aYear !== bYear) return aYear - bYear;
          return a.name.localeCompare(b.name);
        },
      },
    ],
    defaultSort: 'a-z',
  },

  therapy: {
    id: 'therapy',
    label: 'Therapy',
    slug: 'therapy',
    description: 'Psychotherapy and counseling approaches',
    filterCategories: [
      {
        id: 'therapy_types',
        label: 'Therapy Type',
        field: 'metadata.therapy_type',
        type: 'multi-select',
        autoPopulate: true,
      },
      {
        id: 'delivery_formats',
        label: 'Format',
        field: 'metadata.delivery_format',
        type: 'multi-select',
        autoPopulate: true,
      },
      {
        id: 'target_populations',
        label: 'Target Population',
        field: 'metadata.target_population',
        type: 'multi-select',
        autoPopulate: true,
      },
      {
        id: 'treatment_duration',
        label: 'Duration',
        field: 'metadata.typical_duration',
        type: 'multi-select',
        autoPopulate: true,
      },
    ],
    sortOptions: [
      { id: 'name', label: 'Name (A-Z)' },
      { id: 'name-desc', label: 'Name (Z-A)' },
    ],
    defaultSort: 'name',
  },

  interventional: {
    id: 'interventional',
    label: 'Interventional',
    slug: 'interventional',
    description: 'Brain stimulation and interventional procedures',
    filterCategories: [
      {
        id: 'intervention_types',
        label: 'Intervention Type',
        field: 'metadata.intervention_type',
        type: 'multi-select',
        autoPopulate: true,
      },
      {
        id: 'invasiveness',
        label: 'Invasiveness',
        field: 'metadata.invasiveness',
        type: 'multi-select',
        autoPopulate: true,
      },
      {
        id: 'anesthesia_requirements',
        label: 'Anesthesia Required',
        field: 'metadata.anesthesia_requirement',
        type: 'multi-select',
        autoPopulate: true,
      },
      {
        id: 'fda_status',
        label: 'FDA Status',
        field: 'metadata.regulatory_status',
        type: 'multi-select',
        autoPopulate: true,
      },
    ],
    sortOptions: [
      { id: 'name', label: 'Name (A-Z)' },
      { id: 'name-desc', label: 'Name (Z-A)' },
    ],
    defaultSort: 'name',
  },

  supplements: {
    id: 'supplements',
    label: 'Supplements',
    slug: 'supplements',
    description: 'Nutritional supplements and vitamins',
    filterCategories: [
      {
        id: 'supplement_types',
        label: 'Supplement Type',
        field: 'metadata.supplement_type',
        type: 'multi-select',
        autoPopulate: true,
      },
      {
        id: 'evidence_level',
        label: 'Evidence Level',
        field: 'metadata.evidence_level',
        type: 'multi-select',
        autoPopulate: true,
      },
      {
        id: 'safety_profile',
        label: 'Safety Profile',
        field: 'metadata.safety_profile',
        type: 'multi-select',
        autoPopulate: true,
      },
    ],
    sortOptions: [
      { id: 'name', label: 'Name (A-Z)' },
      { id: 'name-desc', label: 'Name (Z-A)' },
    ],
    defaultSort: 'name',
  },

  alternative: {
    id: 'alternative',
    label: 'Alternative & Complementary',
    slug: 'alternative',
    description: 'Alternative and complementary approaches',
    filterCategories: [
      {
        id: 'modality_types',
        label: 'Modality Type',
        field: 'metadata.modality_type',
        type: 'multi-select',
        autoPopulate: true,
      },
      {
        id: 'evidence_basis',
        label: 'Evidence Basis',
        field: 'metadata.evidence_basis',
        type: 'multi-select',
        autoPopulate: true,
      },
      {
        id: 'accessibility',
        label: 'Accessibility',
        field: 'metadata.accessibility',
        type: 'multi-select',
        autoPopulate: true,
      },
    ],
    sortOptions: [
      { id: 'name', label: 'Name (A-Z)' },
      { id: 'name-desc', label: 'Name (Z-A)' },
    ],
    defaultSort: 'name',
  },

  investigational: {
    id: 'investigational',
    label: 'Investigational',
    slug: 'investigational',
    description: 'Experimental and investigational treatments',
    filterCategories: [
      {
        id: 'research_phase',
        label: 'Research Phase',
        field: 'metadata.research_phase',
        type: 'multi-select',
        autoPopulate: true,
      },
      {
        id: 'mechanism_class',
        label: 'Mechanism Class',
        field: 'metadata.mechanism_class',
        type: 'multi-select',
        autoPopulate: true,
      },
      {
        id: 'availability',
        label: 'Availability',
        field: 'metadata.availability',
        type: 'multi-select',
        autoPopulate: true,
      },
    ],
    sortOptions: [
      { id: 'name', label: 'Name (A-Z)' },
      { id: 'name-desc', label: 'Name (Z-A)' },
    ],
    defaultSort: 'name',
  },
};

// Helper function to get category config
export function getTreatmentCategory(categoryId: string): TreatmentCategoryConfig | undefined {
  return TREATMENT_CATEGORIES[categoryId];
}

// Helper function to get all category IDs
export function getAllTreatmentCategoryIds(): string[] {
  return Object.keys(TREATMENT_CATEGORIES);
}

// Helper function to get all category configs
export function getAllTreatmentCategories(): TreatmentCategoryConfig[] {
  return Object.values(TREATMENT_CATEGORIES);
}
