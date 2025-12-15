// Direct Postgres connection pool for performance-critical queries
// This bypasses Supabase PostgREST overhead for ~10x faster queries

import { Pool } from 'pg';

let pool: Pool | null = null;

export function getDbPool(): Pool {
  if (!pool) {
    const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('Missing SUPABASE_DB_URL or DATABASE_URL environment variable');
    }

    pool = new Pool({
      connectionString,
      max: 10, // Reduce pool size to avoid connection limits
      idleTimeoutMillis: 10000, // Close idle clients faster (10 seconds)
      connectionTimeoutMillis: 10000, // Increase timeout to 10 seconds
      statement_timeout: 8000, // Kill queries after 8 seconds
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle database client', err);
    });
  }

  return pool;
}

// Graceful shutdown
export async function closeDbPool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
