export interface ComparisonMetric {
  key: string;
  label: string;
  description: string;
  dataPath: string;
  unit?: string;
  type: "numeric" | "text" | "boolean" | "array";
  scale?: [number, number];
  higherIsBetter?: boolean;
  icon: string;
  category: "efficacy" | "safety" | "cost" | "logistics" | "other";
  applicableSchemas: string[];
}

export const comparisonMetrics: ComparisonMetric[] = [
  // Efficacy Metrics
  {
    key: "efficacy_depression",
    label: "Depression Efficacy",
    description: "Effectiveness for treating depression symptoms",
    dataPath: "efficacy.depression",
    type: "numeric",
    scale: [1, 5],
    higherIsBetter: true,
    unit: "/5",
    icon: "trending-up",
    category: "efficacy",
    applicableSchemas: ["medication", "tms", "supplement"],
  },
  {
    key: "efficacy_anxiety",
    label: "Anxiety Efficacy",
    description: "Effectiveness for treating anxiety symptoms",
    dataPath: "efficacy.anxiety",
    type: "numeric",
    scale: [1, 5],
    higherIsBetter: true,
    unit: "/5",
    icon: "trending-up",
    category: "efficacy",
    applicableSchemas: ["medication", "supplement"],
  },
  {
    key: "efficacy_ocd",
    label: "OCD Efficacy",
    description: "Effectiveness for treating OCD symptoms",
    dataPath: "efficacy.ocd",
    type: "numeric",
    scale: [1, 5],
    higherIsBetter: true,
    unit: "/5",
    icon: "trending-up",
    category: "efficacy",
    applicableSchemas: ["medication", "tms"],
  },

  // Safety Metrics
  {
    key: "side_effects_sexual",
    label: "Sexual Side Effects",
    description: "Impact on sexual function",
    dataPath: "side_effects.sexual",
    type: "numeric",
    scale: [1, 5],
    higherIsBetter: false,
    unit: "/5",
    icon: "heart",
    category: "safety",
    applicableSchemas: ["medication"],
  },
  {
    key: "side_effects_weight_gain",
    label: "Weight Gain",
    description: "Likelihood of weight gain",
    dataPath: "side_effects.weight_gain",
    type: "numeric",
    scale: [1, 5],
    higherIsBetter: false,
    unit: "/5",
    icon: "scale",
    category: "safety",
    applicableSchemas: ["medication"],
  },
  {
    key: "side_effects_sedation",
    label: "Sedation",
    description: "Drowsiness and fatigue",
    dataPath: "side_effects.sedation",
    type: "numeric",
    scale: [1, 5],
    higherIsBetter: false,
    unit: "/5",
    icon: "moon",
    category: "safety",
    applicableSchemas: ["medication"],
  },
  {
    key: "side_effects_activation",
    label: "Activation",
    description: "Restlessness and agitation",
    dataPath: "side_effects.activation",
    type: "numeric",
    scale: [1, 5],
    higherIsBetter: false,
    unit: "/5",
    icon: "zap",
    category: "safety",
    applicableSchemas: ["medication"],
  },

  // Cost Metrics
  {
    key: "cost_monthly",
    label: "Monthly Cost",
    description: "Average monthly cost",
    dataPath: "cost_monthly",
    type: "numeric",
    higherIsBetter: false,
    unit: "$",
    icon: "dollar-sign",
    category: "cost",
    applicableSchemas: ["medication", "supplement"],
  },
  {
    key: "cost_per_session",
    label: "Cost per Session",
    description: "Cost for each treatment session",
    dataPath: "cost_per_session",
    type: "numeric",
    higherIsBetter: false,
    unit: "$",
    icon: "dollar-sign",
    category: "cost",
    applicableSchemas: ["tms"],
  },

  // Logistics Metrics
  {
    key: "starting_dose",
    label: "Starting Dose",
    description: "Initial recommended dose",
    dataPath: "starting_dose",
    type: "text",
    icon: "pill",
    category: "logistics",
    applicableSchemas: ["medication"],
  },
  {
    key: "half_life_hours",
    label: "Half Life",
    description: "How long the medication stays in your system",
    dataPath: "half_life_hours",
    type: "numeric",
    unit: "hours",
    icon: "clock",
    category: "logistics",
    applicableSchemas: ["medication"],
  },
  {
    key: "sessions_total",
    label: "Total Sessions",
    description: "Total number of treatment sessions needed",
    dataPath: "sessions_total",
    type: "numeric",
    icon: "calendar",
    category: "logistics",
    applicableSchemas: ["tms"],
  },
  {
    key: "session_duration_min",
    label: "Session Duration",
    description: "Length of each treatment session",
    dataPath: "session_duration_min",
    type: "numeric",
    unit: "minutes",
    icon: "clock",
    category: "logistics",
    applicableSchemas: ["tms"],
  },
  {
    key: "dose_amount",
    label: "Dose",
    description: "Recommended dosage",
    dataPath: "dose_amount",
    type: "text",
    icon: "droplet",
    category: "logistics",
    applicableSchemas: ["supplement"],
  },
  {
    key: "third_party_tested",
    label: "Third Party Tested",
    description: "Independently verified for purity and potency",
    dataPath: "third_party_tested",
    type: "boolean",
    icon: "check-circle",
    category: "other",
    applicableSchemas: ["supplement"],
  },
  {
    key: "fda_cleared_conditions",
    label: "FDA Cleared For",
    description: "Conditions approved by FDA",
    dataPath: "fda_cleared_conditions",
    type: "array",
    icon: "shield",
    category: "other",
    applicableSchemas: ["tms"],
  },
];

// Helper functions
export function getMetricsByCategory(category: string): ComparisonMetric[] {
  return comparisonMetrics.filter((metric) => metric.category === category);
}

export function getMetricsForSchema(schemaName: string): ComparisonMetric[] {
  return comparisonMetrics.filter((metric) => metric.applicableSchemas.includes(schemaName));
}

export function getMetricByKey(key: string): ComparisonMetric | undefined {
  return comparisonMetrics.find((metric) => metric.key === key);
}

export const metricCategories = [
  { key: "efficacy", label: "Efficacy", icon: "trending-up", color: "blue" },
  { key: "safety", label: "Safety", icon: "shield", color: "green" },
  { key: "cost", label: "Cost", icon: "dollar-sign", color: "yellow" },
  { key: "logistics", label: "Logistics", icon: "calendar", color: "purple" },
  { key: "other", label: "Other", icon: "more-horizontal", color: "gray" },
];
