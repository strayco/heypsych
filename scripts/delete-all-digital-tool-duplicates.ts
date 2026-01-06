#!/usr/bin/env tsx
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const duplicateIds = [
  '87e2e137-3c86-416f-b9b7-c523e09d44d9', // betterhelp
  '6b936d04-0610-4b8a-a101-5d8636611fd2', // calm
  '06d77394-9aee-42b8-a578-102e2052a39e', // cbt-i-coach
  '0ac0f726-b649-4371-a4a5-a9625d90b043', // deepscribe
  '249484b8-1751-455c-8f5a-0dc282aeb468', // happify
  'e2ca0c6d-7902-4e50-a624-c100104ee665', // headspace
  '264584c9-596f-4b43-a2ee-3a5c9158dfdc', // insight-timer
  '2f364a4d-5008-4761-9360-1f402218fcf2', // mindshift-cbt
  '9ec2c407-bc3f-4ade-a2b3-b83c4525d45e', // moodfit
  '7dd07cee-c061-49bd-903a-e93b207b0f1d', // ptsd-coach
  'add7a8a6-3a5b-4bea-8db8-30cb81eb8332', // rootd
  '0536674a-1194-4150-9083-bde41a3f4a11', // talkspace
  'e8a476c2-c26f-491e-8c99-0c256ee52e87', // woebot
  'e1832811-b8c9-4fe0-855c-dded06aa9b0d', // wysa
];

async function deleteAllDuplicates() {
  console.log(`🗑️  Deleting ${duplicateIds.length} duplicate 'digital-tool' rows...\n`);

  const { data, error } = await supabase
    .from("entities")
    .delete()
    .in("id", duplicateIds)
    .select("slug, type");

  if (error) {
    console.error("❌ Error:", error);
    return;
  }

  console.log(`✅ Successfully deleted ${data.length} rows:\n`);
  data.forEach((row, i) => {
    console.log(`   ${i + 1}. ${row.slug} (type: ${row.type})`);
  });

  console.log("\n✅ All digital-tool duplicates removed!");
  console.log("✅ Only 'resource' type rows remain for these slugs");
}

deleteAllDuplicates();
