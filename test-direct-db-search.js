// Test direct database search performance
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  max: 5,
});

async function testDirectSearch() {
  console.log('Testing direct DB search...\n');

  const queries = ['therapy', 'zoloft', 'anxiety'];

  for (const query of queries) {
    console.log(`\n=== Testing: "${query}" ===`);
    const start = Date.now();

    try {
      const result = await pool.query(
        'SELECT * FROM search_entities_grouped($1, $2)',
        [query, 5]
      );

      const duration = Date.now() - start;
      console.log(`Duration: ${duration}ms`);
      console.log(`Total rows: ${result.rows.length}`);

      // Group by entity_type
      const byType = {};
      result.rows.forEach(r => {
        if (!byType[r.entity_type]) byType[r.entity_type] = [];
        byType[r.entity_type].push(r);
      });

      Object.keys(byType).forEach(type => {
        const results = byType[type];
        const total = results[0]?.type_total_count || 0;
        console.log(`  ${type}: ${results.length} results (${total} total matches)`);
      });
    } catch (err) {
      const duration = Date.now() - start;
      console.log('Error:', err.message);
      console.log(`Duration: ${duration}ms`);
    }
  }

  await pool.end();
}

testDirectSearch().then(() => process.exit(0)).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
