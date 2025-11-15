// scripts/config/schemas.config.js
export const SCHEMAS = {
  medication: {
    schema_name: "medication",
    display_name: "Medication",
    entity_type: "treatment",
    icon: "pill",
    color: "green",
    field_definitions: {
      description: { type: "text", required: true },
      category: { type: "text", required: true },
      type: { type: "text", required: true },
      fda_approved: { type: "boolean" },
      mechanism: { type: "text" },
      side_effects: { type: "object" },
    },
    validation_rules: {}, // keep if your table requires it
  },

  therapy: {
    schema_name: "therapy",
    display_name: "Therapy",
    entity_type: "treatment",
    icon: "users",
    color: "purple",
    field_definitions: {
      description: { type: "text", required: true },
      category: { type: "text", required: true },
      type: { type: "text", required: true },
    },
    validation_rules: {},
  },

  // Fixed: changed from 'interventional_treatment' to 'interventional'
  interventional: {
    schema_name: "interventional",
    display_name: "Interventional Treatment",
    entity_type: "treatment",
    icon: "zap",
    color: "orange",
    field_definitions: {
      description: { type: "text", required: true },
      category: { type: "text", required: true },
      type: { type: "text", required: true },
    },
    validation_rules: {},
  },

  supplement: {
    schema_name: "supplement",
    display_name: "Supplement",
    entity_type: "treatment",
    icon: "leaf",
    color: "emerald",
    field_definitions: {
      description: { type: "text", required: true },
      category: { type: "text", required: true },
      type: { type: "text", required: true },
    },
    validation_rules: {},
  },

  // Added: missing 'alternative' schema
  alternative: {
    schema_name: "alternative",
    display_name: "Alternative Treatment",
    entity_type: "treatment",
    icon: "sparkles",
    color: "indigo",
    field_definitions: {
      description: { type: "text", required: true },
      category: { type: "text", required: true },
      type: { type: "text", required: true },
    },
    validation_rules: {},
  },

  // Added: missing 'investigational' schema
  investigational: {
    schema_name: "investigational",
    display_name: "Investigational Treatment",
    entity_type: "treatment",
    icon: "beaker",
    color: "red",
    field_definitions: {
      description: { type: "text", required: true },
      category: { type: "text", required: true },
      type: { type: "text", required: true },
    },
    validation_rules: {},
  },
};
