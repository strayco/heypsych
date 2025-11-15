// Shared types for Support & Community resources

export type AccessType = "hotline" | "text" | "chat" | "online" | "in-person";
export type CostType = "free" | "sliding-scale" | "paid" | "insurance";
export type RegionType = "US" | "CA" | "INTL";
export type Tag =
  | "peer-led"
  | "evidence-based"
  | "faith"
  | "lgbtq"
  | "bipoc"
  | "veteran"
  | "youth"
  | "family"
  | "identity"
  | "directory"
  | "24/7"
  | "verified";

export interface PhoneContact {
  label: string;
  number: string;
}

export interface Resource {
  id: string;
  name: string;
  url: string;
  description: string; // ≤160 chars
  category: string;
  subcategory?: string;
  access: AccessType[];
  phones?: PhoneContact[];
  regions: RegionType[];
  cost: CostType[];
  tags: Tag[];
  keywords?: string[];
  organization?: string;
  logo?: string;
}

export interface TabFile {
  tab: "crisis" | "organizations" | "treatment";
  lastUpdated: string; // ISO date
  resources: Resource[];
}
