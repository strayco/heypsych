import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const slugs = ["deepscribe", "daylio"];
  
  for (const slug of slugs) {
    const { data, error } = await supabase
      .from("entities")
      .select("*")
      .eq("slug", slug)
      .limit(1);

    if (error) {
      console.error(`Error for ${slug}:`, error);
      continue;
    }

    if (!data || data.length === 0) {
      console.log(`No entity found for slug: ${slug}`);
      continue;
    }

    const row = data[0];
    console.log(`\n=== ${slug} ===`);
    console.log("row.type:", row.type);
    console.log("row.content?.type:", row.content?.type);
    console.log("row.content?.kind:", row.content?.kind);
  }
}

test();
