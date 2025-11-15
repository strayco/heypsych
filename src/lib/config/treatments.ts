export const treatmentConfig = {
  types: [
    {
      id: "medication",
      name: "Medications",
      icon: "pill",
      color: "blue",
      description: "FDA-approved prescription medications",
    },
    {
      id: "interventional",
      name: "Interventional",
      icon: "zap",
      color: "purple",
      description: "Brain stimulation and medical procedures",
    },
    {
      id: "investigational",
      name: "Investigational",
      icon: "beaker",
      color: "amber",
      description: "Clinical trials and breakthrough therapies",
    },
    {
      id: "alternative",
      name: "Alternative",
      icon: "sun",
      color: "yellow",
      description: "Traditional medicine and holistic approaches",
    },
    {
      id: "therapy",
      name: "Therapy",
      icon: "brain",
      color: "green",
      description: "Psychotherapy and counseling approaches",
    },
    {
      id: "supplement",
      name: "Supplements",
      icon: "leaf",
      color: "emerald",
      description: "Vitamins, minerals, and natural compounds",
    },
  ],

  // Comparison metrics (easily customizable)
  comparisonMetrics: [
    { key: "efficacy", name: "Effectiveness", icon: "trending-up" },
    { key: "speed", name: "Time to Effect", icon: "clock" },
    { key: "safety", name: "Side Effects", icon: "shield" },
    { key: "cost", name: "Cost", icon: "dollar-sign" },
    { key: "access", name: "Accessibility", icon: "map-pin" },
  ],
} as const;
