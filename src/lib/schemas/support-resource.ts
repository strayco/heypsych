// src/lib/schemas/support-resource.ts
export interface SupportResource {
  name: string;
  description: string;
  category: "crisis" | "communities" | "identity" | "recovery" | "digital";
  subcategory?: string;
  contact: {
    phone?: string;
    text?: string;
    website?: string;
    email?: string;
  };
  availability: "24/7" | "Business Hours" | "Varies";
  region: "US" | "Global" | "UK" | "Australia" | string;
  languages?: string[];
  populations?: string[]; // ['LGBTQ+', 'Veterans', 'Youth']
  conditions?: string[]; // ['Depression', 'Anxiety', 'PTSD']
  type: "crisis-line" | "support-group" | "forum" | "app" | "organization";
  tags: string[];
  verified: boolean;
  lastUpdated: string;
}
