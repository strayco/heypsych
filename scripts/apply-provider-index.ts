import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config({ path: ".env.local" });

const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing required environment variables");
  process.exit(1);
}

// Type assertions - safe because of guard above
const supabaseUrl: string = NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey: string = SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

async function applyIndexes() {
  console.log("🔧 Adding provider search indexes...\n");

  // Read the SQL file
  const sqlPath = path.join(__dirname, "add-provider-search-index.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

  // Split by semicolons to execute each statement separately
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith("--"));

  console.log(`📄 Found ${statements.length} SQL statements\n`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (!statement) continue;

    console.log(`[${i + 1}/${statements.length}] Executing...`);
    console.log(statement.substring(0, 100) + "...\n");

    try {
      const { error } = await supabase.rpc("exec_sql", { sql_query: statement });

      if (error) {
        // Try direct execution if RPC doesn't work
        console.log("⚠️  RPC failed, trying direct execution...");
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ query: statement }),
        });

        if (!response.ok) {
          console.error(`❌ Failed: ${response.statusText}`);
          console.error(
            "💡 You may need to run this SQL manually in Supabase SQL Editor:"
          );
          console.error(`   ${sqlPath}\n`);
          continue;
        }
      }

      console.log("✅ Success\n");
    } catch (err: any) {
      console.error(`❌ Error: ${err.message}\n`);
    }
  }

  console.log("\n🎉 Index creation attempted!");
  console.log(
    "\n💡 If the above commands failed, please run the SQL file manually:"
  );
  console.log(`   1. Go to Supabase Dashboard > SQL Editor`);
  console.log(`   2. Copy contents from: ${sqlPath}`);
  console.log(`   3. Run the SQL`);
  console.log(
    `\n📈 After indexes are created, provider searches should be much faster!`
  );

  process.exit(0);
}

applyIndexes();
