import { Pool } from 'pg';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function main() {
  const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    console.log('No DATABASE_URL found');
    return;
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Count providers first
    const countResult = await pool.query(`
      SELECT COUNT(*) as count FROM entities WHERE type = 'provider'
    `);
    console.log(`\nFound ${countResult.rows[0].count} providers to delete...`);

    // Delete in smaller batches to avoid timeout
    let deleted = 0;
    const batchSize = 1000;

    while (true) {
      const result = await pool.query(`
        DELETE FROM entities
        WHERE id IN (
          SELECT id FROM entities
          WHERE type = 'provider'
          LIMIT $1
        )
      `, [batchSize]);

      deleted += result.rowCount || 0;
      console.log(`Deleted ${deleted} providers so far...`);

      if ((result.rowCount || 0) < batchSize) break;
    }

    console.log(`\n✅ Deleted ${deleted} providers total`);

    // Check new size
    const sizeResult = await pool.query(`
      SELECT pg_size_pretty(pg_total_relation_size('entities')) as size
    `);
    console.log(`\nNew entities table size: ${sizeResult.rows[0].size}`);
    console.log('\n⚠️  Run VACUUM FULL in Supabase SQL Editor to reclaim disk space');

  } catch (err: any) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

main();
