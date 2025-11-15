// scripts/add-provider-indexes.js
import dotenv from "dotenv";
import { Client } from "pg";
import { readFileSync } from "fs";
import { join } from "path";

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

async function createIndexes() {
  try {
    await client.connect();
    console.log("✅ Connected to database");

    // Read the SQL file
    const sqlPath = join(process.cwd(), "add-provider-indexes.sql");
    const sql = readFileSync(sqlPath, "utf-8");

    console.log("📝 Creating provider indexes...\n");

    // Split by semicolons and execute each statement
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith("--") && s !== "");

    for (const statement of statements) {
      // Extract index name from the statement for better logging
      const match = statement.match(/CREATE INDEX IF NOT EXISTS (\w+)/i);
      const indexName = match ? match[1] : "unknown";

      try {
        console.log(`  Creating index: ${indexName}...`);
        await client.query(statement);
        console.log(`  ✅ ${indexName}`);
      } catch (err) {
        // If index already exists, that's fine
        if (err.code === "42P07") {
          console.log(`  ℹ️  ${indexName} (already exists)`);
        } else {
          throw err;
        }
      }
    }

    console.log("\n🎉 All provider indexes created successfully!");
    console.log("\n📊 Verifying indexes...");

    // Verify indexes
    const { rows } = await client.query(`
      SELECT
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'entities'
        AND indexname LIKE '%provider%'
      ORDER BY indexname;
    `);

    if (rows.length > 0) {
      console.log(`\n✅ Found ${rows.length} provider indexes:`);
      rows.forEach((row) => {
        console.log(`  - ${row.indexname}`);
      });
    } else {
      console.log("\n⚠️  No provider indexes found. Something may have gone wrong.");
    }

    console.log("\n🚀 Provider queries should now be much faster!");
    console.log("   Expected improvement: 3000ms → <100ms for state queries");
  } catch (error) {
    console.error("\n❌ Error creating indexes:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createIndexes();
