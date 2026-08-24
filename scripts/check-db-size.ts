import { Pool } from 'pg';
import { config } from 'dotenv';

// Load env vars
config({ path: '.env.local' });

async function main() {
  const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    console.log('No DATABASE_URL found in environment');
    return;
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    // Check table sizes
    const sizes = await pool.query(`
      SELECT
        relname as table_name,
        pg_size_pretty(pg_total_relation_size(relid)) as total_size,
        n_live_tup as row_count
      FROM pg_stat_user_tables
      ORDER BY pg_total_relation_size(relid) DESC
    `);

    console.log('\n=== TABLE SIZES ===');
    console.table(sizes.rows);

    // Check entity counts by type and status
    const entities = await pool.query(`
      SELECT type, status, COUNT(*) as count
      FROM entities
      GROUP BY type, status
      ORDER BY count DESC
    `);

    console.log('\n=== ENTITIES BY TYPE/STATUS ===');
    console.table(entities.rows);

    // Check for duplicates
    const duplicates = await pool.query(`
      SELECT slug, COUNT(*) as count
      FROM entities
      GROUP BY slug
      HAVING COUNT(*) > 1
      LIMIT 20
    `);

    if (duplicates.rows.length > 0) {
      console.log('\n=== DUPLICATE SLUGS ===');
      console.table(duplicates.rows);
    }

    // Check provider data
    const providerSample = await pool.query(`
      SELECT slug, title,
        pg_column_size(content) as content_bytes,
        pg_column_size(metadata) as metadata_bytes
      FROM entities
      WHERE type = 'provider'
      ORDER BY pg_column_size(content) DESC
      LIMIT 5
    `);
    console.log('\n=== LARGEST PROVIDERS ===');
    console.table(providerSample.rows);

    // Average provider size
    const avgSize = await pool.query(`
      SELECT
        AVG(pg_column_size(content)) as avg_content_bytes,
        AVG(pg_column_size(metadata)) as avg_metadata_bytes,
        AVG(pg_column_size(content) + pg_column_size(metadata)) as avg_total_bytes
      FROM entities
      WHERE type = 'provider'
    `);
    console.log('\n=== AVG PROVIDER SIZE ===');
    console.table(avgSize.rows);

  } catch (err: any) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

main();
