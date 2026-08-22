// src/lib/config/database.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Build-time resilience flag
 *
 * When true, the app is building without Supabase credentials.
 * EntityService and other data layers should fall back to local JSON files.
 */
export const SUPABASE_UNAVAILABLE = !url || !anon;

if (SUPABASE_UNAVAILABLE) {
  console.warn(
    "⚠️ Supabase credentials not found. Using local JSON files for data."
  );
}

// Reusable JSON type
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      entities: {
        Row: {
          id: string;
          type: string;
          slug: string;
          title: string;
          description: string | null;
          content: Json;
          metadata: Json;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: string;
          slug: string;
          title: string;
          description?: string | null;
          content?: Json;
          metadata?: Json;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["entities"]["Insert"]>;
        Relationships: [];
      };

      entity_relationships: {
        Row: {
          id: string;
          source_slug: string;
          source_type: string;
          target_slug: string;
          target_type: string;
          relation: string;
          metadata: Json;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["entity_relationships"]["Row"],
          "id" | "created_at"
        > & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["entity_relationships"]["Insert"]>;
        Relationships: [];
      };

      content_files: {
        Row: {
          id: string;
          slug: string;
          type: string;
          file_path: string;
          meta: Json;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["content_files"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["content_files"]["Insert"]>;
        Relationships: [];
      };

      user_interactions: {
        Row: {
          id: string;
          entity_type: string;
          entity_slug: string;
          interaction_type: string;
          user_id: string | null;
          session_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["user_interactions"]["Row"],
          "id" | "created_at"
        > & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_interactions"]["Insert"]>;
        Relationships: [];
      };

      entity_schemas: {
        Row: {
          id: string;
          entity_type: string;
          schema_name: string;
          display_name: string;
          icon: string;
          color: string;
          field_definitions: Json;
          ui_config: Json;
          validation_rules: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["entity_schemas"]["Row"],
          "id" | "created_at" | "updated_at"
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["entity_schemas"]["Insert"]>;
        Relationships: [];
      };

      // Optional table. Typing it lets `.from('collections')` compile even if you haven’t created it yet.
      collections: {
        Row: {
          id: string;
          name: string;
          slug: string;
          collection_type: string;
          icon: string | null;
          color: string | null;
          description: string | null;
          config: Json;
          parent_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["collections"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["collections"]["Insert"]>;
        Relationships: [];
      };

      newsletter_subscribers: {
        Row: {
          id: string;
          email: string;
          subscribed: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["newsletter_subscribers"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["newsletter_subscribers"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
};

/**
 * Internal Supabase client - DO NOT export directly
 *
 * Use supabaseOptional() for nullable access or supabaseRequired() for operations
 * that must fail loudly if Supabase is unavailable.
 */
const _supabaseClient: SupabaseClient<Database> | null = SUPABASE_UNAVAILABLE
  ? null
  : createClient<Database>(url!, anon!, {
      auth: { persistSession: true, autoRefreshToken: true },
      global: {
        fetch: (url, options = {}) => {
          // Increase timeout to 30 seconds for long-running queries like full-text search
          return fetch(url, {
            ...options,
            signal: AbortSignal.timeout(30000),
          });
        },
      },
    });

/**
 * DEPRECATED: Direct client access - use supabaseOptional() or supabaseRequired()
 *
 * This export exists for backwards compatibility but will throw a clear error
 * if accessed when Supabase is unavailable. New code should use the safe accessors.
 *
 * @deprecated Use supabaseOptional() or supabaseRequired() instead
 */
export const supabase: SupabaseClient<Database> = new Proxy(
  {} as SupabaseClient<Database>,
  {
    get(_, prop) {
      if (SUPABASE_UNAVAILABLE) {
        throw new Error(
          `[DATABASE ERROR] Attempted to access supabase.${String(prop)} but ` +
          `Supabase credentials are not configured.\n\n` +
          `If this is a build without database access, use supabaseOptional() ` +
          `and handle the null case.\n\n` +
          `For operations that require database access, use supabaseRequired() ` +
          `which will fail fast with a clear error.`
        );
      }
      return (_supabaseClient as any)[prop];
    },
  }
);

/**
 * Safe accessor for Supabase client - PREFERRED for optional database operations
 *
 * Returns null when Supabase is unavailable (build without credentials).
 * Use this when the operation can gracefully fall back to local data.
 *
 * @example
 * const db = supabaseOptional();
 * if (!db) {
 *   return loadFromLocalJson(); // Graceful fallback
 * }
 * return db.from('entities').select('*');
 */
export function supabaseOptional(): SupabaseClient<Database> | null {
  return _supabaseClient;
}

/**
 * Strict accessor for Supabase client - REQUIRED for critical database operations
 *
 * Throws a clear error if Supabase is unavailable.
 * Use this for operations that MUST have database access (e.g., writes, auth).
 *
 * @throws Error if Supabase credentials are not configured
 *
 * @example
 * const db = supabaseRequired(); // Throws if unavailable
 * await db.from('entities').insert({ ... });
 */
export function supabaseRequired(): SupabaseClient<Database> {
  if (!_supabaseClient) {
    throw new Error(
      `[DATABASE ERROR] Supabase client required but credentials are not configured.\n\n` +
      `Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.\n\n` +
      `If this is expected (e.g., local build), ensure the calling code uses ` +
      `supabaseOptional() with appropriate fallback handling.`
    );
  }
  return _supabaseClient;
}
