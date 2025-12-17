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
      idleTimeoutMillis: 30000, // Keep connections alive for 30 seconds (was 10, too aggressive - caused connections to close too frequently)
      connectionTimeoutMillis: 10000, // Connection establishment timeout
      // Note: statement_timeout must be set per-connection or via SQL, not in pool config
      // The search function sets this internally via set_config('statement_timeout', '10000', true)
      min: 1, // Keep at least 1 connection ready at all times
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle database client', err);
    });

    // Warm up the pool by creating an initial connection immediately
    // This ensures there's always a ready connection, eliminating cold start delays
    pool.connect()
      .then((client) => {
        // Test the connection with a simple query to ensure it's fully ready
        return client.query('SELECT 1').finally(() => {
          client.release();
        });
      })
      .then(() => {
        // Connection warmed up successfully
      })
      .catch((err) => {
        // Log but don't throw - the pool will still work, just first query might be slower
        console.warn('Failed to warm up database pool connection (non-fatal):', err.message);
      });
  }

  return pool;
}

/**
 * Ensure the database pool has at least one ready connection
 * In serverless environments, this ensures connection is ready before queries
 */
async function ensureConnectionReady(): Promise<void> {
  const pool = getDbPool();
  
  // Check if we already have idle connections
  if (pool.idleCount > 0) {
    return; // Connection already ready
  }

  // If no idle connections, create one by executing a simple query
  // This ensures the connection is fully initialized before the actual query
  try {
    await pool.query('SELECT 1');
  } catch (error) {
    // If connection fails, wait a bit and let the retry logic handle it
    // Don't throw here - let queryWithRetry handle retries
  }
}

/**
 * Execute a query with retry logic for connection issues
 * This ensures queries work even on cold starts or after connection timeouts
 * Uses pool.query() which handles connection management automatically
 */
export async function queryWithRetry<T = any>(
  queryText: string,
  params?: any[],
  maxRetries: number = 2
): Promise<{ rows: T[]; rowCount: number }> {
  const pool = getDbPool();
  let lastError: Error | null = null;

  // Ensure connection is ready before first attempt (especially important for serverless cold starts)
  await ensureConnectionReady();

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // pool.query() handles connection acquisition and release automatically
      const result = await pool.query(queryText, params);
      // Handle null rowCount (pg library can return null for some queries)
      return {
        rows: result.rows,
        rowCount: result.rowCount ?? 0,
      };
    } catch (error: any) {
      lastError = error as Error;
      
      // Check if this is a connection-related error that might be retryable
      const isConnectionError = 
        error.code === 'ECONNREFUSED' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ENOTFOUND' ||
        error.code === '57P01' || // Admin shutdown
        error.code === '57P02' || // Crash shutdown
        error.code === '57P03' || // Cannot connect now
        error.message?.includes('connection') ||
        error.message?.includes('timeout') ||
        error.message?.includes('Connection terminated');

      if (isConnectionError && attempt < maxRetries) {
        // Wait a bit before retrying (exponential backoff: 100ms, 200ms, 400ms)
        const delay = Math.min(100 * Math.pow(2, attempt), 1000);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // Not retryable or out of retries
      throw error;
    }
  }

  throw lastError || new Error('Query failed after retries');
}

// Graceful shutdown
export async function closeDbPool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
