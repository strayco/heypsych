import fs from "fs";
import path from "path";
import type { Resource, TabFile } from "@/lib/types/support-community";

interface Hotline {
  id: string;
  name: string;
  summary: string;
  categories?: string[];
  labels: {
    free?: boolean;
    availability?: string;
    focus?: string[];
    audience?: string[];
    verified?: boolean;
  };
  org: {
    name: string;
    url?: string | null;
  };
  coverage: Array<{
    region: string;
    scope: string;
  }>;
  contacts: Array<{
    region: string;
    channels: {
      call?: Array<{ label: string; value: string | null }>;
      text?: Array<{ label: string; value: string | null }>;
      chat?: Array<{ label: string; value: string | null }>;
      tty?: Array<{ label: string; value: string | null }>;
    };
  }>;
  actions: {
    site_url?: string | null;
    chat_url?: string | null;
    text?: string | null;
    tty?: string | null;
    whatsapp?: string | null;
  };
  taxonomy: {
    topics?: string[];
    conditions?: string[];
    identities?: string[];
  };
  search: {
    keywords?: string[];
    aka?: string[];
  };
}

export async function loadCrisisResources(): Promise<Resource[]> {
  try {
    const filePath = path.join(
      process.cwd(),
      "data/resources/support-community/immediate-crisis/index.json"
    );
    const fileContents = fs.readFileSync(filePath, "utf8");
    const data: TabFile = JSON.parse(fileContents);

    if (process.env.NODE_ENV === "development") {
      console.log(`✅ Loaded ${data.resources.length} crisis resources`);
    }

    return data.resources;
  } catch (error) {
    console.error("Error loading crisis resources:", error);
    return [];
  }
}

export async function loadOrganizationsResources(): Promise<Resource[]> {
  try {
    const dirPath = path.join(
      process.cwd(),
      "data/resources/support-community/organizations-communities"
    );

    // Read all JSON files in the organizations-communities directory (except index.json)
    const files = fs.readdirSync(dirPath)
      .filter(file => file.endsWith('.json') && file !== 'index.json');

    const resources: Resource[] = [];

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const fileContents = fs.readFileSync(filePath, "utf8");
      const resource: Resource = JSON.parse(fileContents);
      resources.push(resource);
    }

    if (process.env.NODE_ENV === "development") {
      console.log(`✅ Loaded ${resources.length} organization resources from individual files`);
    }

    return resources;
  } catch (error) {
    console.error("Error loading organization resources:", error);
    return [];
  }
}

export async function loadTreatmentResources(): Promise<Resource[]> {
  try {
    const filePath = path.join(
      process.cwd(),
      "data/resources/support-community/treatment-professional-care/index.json"
    );
    const fileContents = fs.readFileSync(filePath, "utf8");
    const data: TabFile = JSON.parse(fileContents);

    if (process.env.NODE_ENV === "development") {
      console.log(`✅ Loaded ${data.resources.length} treatment resources`);
    }

    return data.resources;
  } catch (error) {
    console.error("Error loading treatment resources:", error);
    return [];
  }
}

export async function loadCrisisHotlines(): Promise<Hotline[]> {
  try {
    const dirPath = path.join(
      process.cwd(),
      "data/resources/support-community/immediate-crisis"
    );

    // Read all JSON files in the immediate-crisis directory (except index.json)
    const files = fs.readdirSync(dirPath)
      .filter(file => file.endsWith('.json') && file !== 'index.json');

    const hotlines: Hotline[] = [];

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const fileContents = fs.readFileSync(filePath, "utf8");
      const hotline: Hotline = JSON.parse(fileContents);
      hotlines.push(hotline);
    }

    if (process.env.NODE_ENV === "development") {
      console.log(`✅ Loaded ${hotlines.length} crisis hotlines from individual files`);
    }

    return hotlines;
  } catch (error) {
    console.error("Error loading crisis hotlines:", error);
    return [];
  }
}

export type { Hotline };
