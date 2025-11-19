// Test what the search returns for lavender
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  max: 5,
});

async function testSearch() {
  try {
    const result = await pool.query(
      'SELECT * FROM search_entities_grouped($1, $2)',
      ['anxiety', 5]
    );

    // Find lavender in the results
    const lavender = result.rows.find(r =>
      r.title && r.title.toLowerCase().includes('lavender')
    );

    if (lavender) {
      console.log('Lavender result found:');
      console.log('- entity_type:', lavender.entity_type);
      console.log('- type:', lavender.type);
      console.log('- slug:', lavender.slug);
      console.log('- title:', lavender.title);
      console.log('- id:', lavender.id);
      console.log('\nExpected URL: /treatments/' + lavender.slug);
    } else {
      console.log('Lavender not found in results');
      console.log('\nAll treatments:');
      result.rows
        .filter(r => r.entity_type === 'treatment')
        .forEach(r => console.log(`  - ${r.title} (${r.type}) -> ${r.slug}`));
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

testSearch();
