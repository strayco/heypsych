// Test search performance and get query plan
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSearch() {
  console.log('Testing OPTIMIZED search performance...\n');

  const queries = ['anxiety', 'zoloft', 'depression', 'therapy'];

  for (const query of queries) {
    console.log(`\n=== Testing: "${query}" ===`);
    const start = Date.now();

    try {
      const { data, error } = await supabase.rpc('search_entities_grouped', {
        query_text: query,
        limit_per_type: 5
      });

      const duration = Date.now() - start;

      if (error) {
        console.log('Error:', error.message);
      } else {
        console.log(`Duration: ${duration}ms`);
        console.log(`Total results: ${data?.length || 0}`);

        // Group by entity_type
        const byType = {};
        data?.forEach(r => {
          if (!byType[r.entity_type]) byType[r.entity_type] = [];
          byType[r.entity_type].push(r);
        });

        Object.keys(byType).forEach(type => {
          const results = byType[type];
          const total = results[0]?.type_total_count || 0;
          console.log(`  ${type}: ${results.length} results (${total} total matches)`);
        });
      }
    } catch (err) {
      const duration = Date.now() - start;
      console.log('Exception:', err.message);
      console.log(`Duration: ${duration}ms`);
    }
  }

  // Test via HTTP API
  console.log('\n\n=== Testing via HTTP API ===');
  const apiQueries = ['anxiety', 'depression'];

  for (const query of apiQueries) {
    console.log(`\nAPI test: "${query}"`);
    const start = Date.now();

    try {
      const response = await fetch(`http://localhost:3000/api/search?q=${query}&limit=5`);
      const duration = Date.now() - start;
      const data = await response.json();

      console.log(`Duration: ${duration}ms (HTTP + processing)`);
      console.log(`Fallback used: ${data.fallbackUsed}`);
      console.log(`Conditions: ${data.conditions?.results?.length || 0}/${data.conditions?.totalCount || 0}`);
      console.log(`Treatments: ${data.treatments?.results?.length || 0}/${data.treatments?.totalCount || 0}`);
      console.log(`Resources: ${data.resources?.results?.length || 0}/${data.resources?.totalCount || 0}`);
    } catch (err) {
      const duration = Date.now() - start;
      console.log('Exception:', err.message);
      console.log(`Duration: ${duration}ms`);
    }
  }
}

testSearch().then(() => process.exit(0));
