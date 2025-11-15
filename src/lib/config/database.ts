// src/lib/config/database.ts
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!url || !anon) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
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

export const supabase = createClient<Database>(url, anon, {
  auth: { persistSession: true, autoRefreshToken: true },
});
