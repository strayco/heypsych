// src/lib/types/nppes-provider.ts
export type NPPESProvider = {
  npi: string;
  slug: string;
  name: {
    first: string;
    last: string;
    suffix?: string | null;
    credential?: string | null;
  };
  taxonomy: {
    primary: {
      code: string | null;
      specialization?: string | null;
    };
  };
  business: {
    practiceAddress: { city: string; state: string };
    phone?: string | null;
  };
};

export type SimpleProviderFilters = {
  query?: string;
  state?: string;
  city?: string;
  specialization?: string;
  gender?: "M" | "F";
  limit?: number;
  offset?: number;
};
