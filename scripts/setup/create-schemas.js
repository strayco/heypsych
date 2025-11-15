// scripts/setup/create-schemas.js
import dotenv from "dotenv";
import { Client } from "pg";

dotenv.config({ path: ".env.local" });

const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("❌ Missing SUPABASE_DB_URL (or DATABASE_URL) in .env.local");
  console.error("   Get it from Supabase → Project Settings → Database → Connection string → URI");
  process.exit(1);
}

const client = new Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

async function run(sql) {
  await client.query(sql);
}

async function createExtensions() {
  await run(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
  await run(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);
}

async function createEntities() {
  await run(`
    CREATE TABLE IF NOT EXISTS public.entities (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      type varchar(50) NOT NULL,
      slug varchar(255) NOT NULL,
      title varchar(500) NOT NULL,
      description text,
      content jsonb DEFAULT '{}'::jsonb,
      metadata jsonb DEFAULT '{}'::jsonb,
      status varchar(20) DEFAULT 'active',
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  `);

  // updated_at trigger
  await run(`
    CREATE OR REPLACE FUNCTION public.set_updated_at()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$;
  `);

  await run(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_entities_set_updated_at'
      ) THEN
        CREATE TRIGGER trg_entities_set_updated_at
        BEFORE UPDATE ON public.entities
        FOR EACH ROW
        EXECUTE FUNCTION public.set_updated_at();
      END IF;
    END$$;
  `);
}

/** Ensure UNIQUE(type, slug) and drop any older global-unique slug constraint */
async function fixEntitiesUniqueConstraint() {
  await run(`ALTER TABLE public.entities DROP CONSTRAINT IF EXISTS entities_slug_key;`);
  await run(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'entities_type_slug_key'
      ) THEN
        ALTER TABLE public.entities
        ADD CONSTRAINT entities_type_slug_key UNIQUE (type, slug);
      END IF;
    END$$;
  `);
}

async function createRelationshipsAndFiles() {
  // slug/type relationships (wipe old versions once, then keep)
  await run(`DROP TABLE IF EXISTS public.entity_relationships CASCADE;`);
  await run(`
    CREATE TABLE public.entity_relationships (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      source_slug varchar(255) NOT NULL,
      source_type varchar(50) NOT NULL,
      target_slug varchar(255) NOT NULL,
      target_type varchar(50) NOT NULL,
      relation varchar(100) NOT NULL,
      metadata jsonb DEFAULT '{}'::jsonb,
      created_at timestamptz DEFAULT now()
    );
  `);

  await run(`DROP TABLE IF EXISTS public.content_files CASCADE;`);
  await run(`
    CREATE TABLE public.content_files (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      slug varchar(255) NOT NULL,
      type varchar(50) NOT NULL,
      file_path varchar(500) NOT NULL,
      meta jsonb DEFAULT '{}'::jsonb,
      created_at timestamptz DEFAULT now()
    );
  `);

  await run(`DROP TABLE IF EXISTS public.user_interactions CASCADE;`);
  await run(`
    CREATE TABLE public.user_interactions (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      entity_type varchar(50) NOT NULL,
      entity_slug varchar(255) NOT NULL,
      interaction_type varchar(50) NOT NULL,
      user_id varchar(255),
      session_id varchar(255),
      metadata jsonb DEFAULT '{}'::jsonb,
      created_at timestamptz DEFAULT now()
    );
  `);
}

async function createIndexes() {
  // entities
  await run(`CREATE INDEX IF NOT EXISTS idx_entities_type ON public.entities(type);`);
  await run(`CREATE INDEX IF NOT EXISTS idx_entities_status ON public.entities(status);`);
  await run(
    `CREATE INDEX IF NOT EXISTS idx_entities_type_status ON public.entities(type, status);`
  );
  await run(
    `CREATE INDEX IF NOT EXISTS idx_entities_title_trgm ON public.entities USING gin (title gin_trgm_ops);`
  );
  await run(
    `CREATE INDEX IF NOT EXISTS idx_entities_content_gin ON public.entities USING gin (content);`
  );
  await run(
    `CREATE INDEX IF NOT EXISTS idx_entities_metadata_gin ON public.entities USING gin (metadata);`
  );

  // relationships
  await run(
    `CREATE INDEX IF NOT EXISTS idx_rels_source ON public.entity_relationships (source_slug, source_type, relation);`
  );
  await run(
    `CREATE INDEX IF NOT EXISTS idx_rels_target ON public.entity_relationships (target_slug, target_type, relation);`
  );
  await run(
    `CREATE INDEX IF NOT EXISTS idx_rels_relation ON public.entity_relationships (relation);`
  );

  // files
  await run(
    `CREATE INDEX IF NOT EXISTS idx_content_files_slug_type ON public.content_files (slug, type);`
  );

  // interactions
  await run(
    `CREATE INDEX IF NOT EXISTS idx_interactions_entity ON public.user_interactions (entity_type, entity_slug);`
  );
  await run(
    `CREATE INDEX IF NOT EXISTS idx_interactions_type ON public.user_interactions (interaction_type);`
  );
}

async function enableRLSAndPolicies() {
  await run(`ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;`);
  await run(`ALTER TABLE public.entity_relationships ENABLE ROW LEVEL SECURITY;`);
  await run(`ALTER TABLE public.content_files ENABLE ROW LEVEL SECURITY;`);
  await run(`ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;`);

  // Public read of active entities
  await run(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname='public' AND tablename='entities' AND policyname='Public read active entities'
      ) THEN
        CREATE POLICY "Public read active entities"
        ON public.entities
        FOR SELECT
        USING (status = 'active');
      END IF;
    END$$;
  `);

  // Public read of relationships
  await run(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname='public' AND tablename='entity_relationships' AND policyname='Public read relationships'
      ) THEN
        CREATE POLICY "Public read relationships"
        ON public.entity_relationships
        FOR SELECT
        USING (true);
      END IF;
    END$$;
  `);

  // Public read of content_files
  await run(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname='public' AND tablename='content_files' AND policyname='Public read content files'
      ) THEN
        CREATE POLICY "Public read content files"
        ON public.content_files
        FOR SELECT
        USING (true);
      END IF;
    END$$;
  `);
}

async function main() {
  try {
    await client.connect();

    console.log("🏗️  Creating HeyPsych database schemas...\n");
    await createExtensions();
    console.log("  ✅ extensions");

    await createEntities();
    await fixEntitiesUniqueConstraint();
    console.log("  ✅ entities");

    await createRelationshipsAndFiles();
    console.log("  ✅ relationships & files");

    await createIndexes();
    console.log("  ✅ indexes");

    await enableRLSAndPolicies();
    console.log("  ✅ RLS & policies");

    console.log("\n🎉 Database ready!");
    console.log("Next: npm run seed (or individual seed:* scripts)");
  } catch (err) {
    console.error("❌ Setup failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
