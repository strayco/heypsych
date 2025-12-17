// Direct Postgres connection pool for performance-critical queries
// This bypasses Supabase PostgREST overhead for ~10x faster queries

import { Pool } from 'pg';

let pool: Pool | null = null;

/**
 * Initialize the database pool
 * Connections are created automatically by pool.query() when needed
 */
function initializePool(): Pool {
  const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('Missing SUPABASE_DB_URL or DATABASE_URL environment variable');
  }

  const newPool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000, // Increased timeout for serverless cold starts
    // Don't use min - let pool manage connections naturally
    // min causes issues in serverless where connections can't be kept alive
  });

  // Handle pool errors
  newPool.on('error', (err) => {
    console.error('Unexpected error on idle database client', err);
  });

  return newPool;
}

/**
 * Get the database pool, initializing it if necessary
 */
export function getDbPool(): Pool {
  if (!pool) {
    pool = initializePool();
  }
  return pool;
}

// Let the pg Pool library handle connections automatically
// pool.query() will create connections as needed

/**
 * Execute a query with retry logic for connection issues
 * This ensures queries work even on cold starts or after connection timeouts
 * Uses pool.query() which handles connection management automatically
 */
export async function queryWithRetry<T = any>(
  queryText: string,
  params?: any[],
  maxRetries: number = 3
): Promise<{ rows: T[]; rowCount: number }> {
  const pool = getDbPool();
  let lastError: Error | null = null;

  // Let pool.query() handle connections automatically - it's designed for this
  // The pg library manages connection pooling efficiently
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await pool.query(queryText, params);
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
        error.code === 'ECONNRESET' ||
        error.code === 'EPIPE' ||
        error.code === '57P01' || // Admin shutdown
        error.code === '57P02' || // Crash shutdown
        error.code === '57P03' || // Cannot connect now
        error.message?.includes('connection') ||
        error.message?.includes('timeout') ||
        error.message?.includes('Connection terminated') ||
        error.message?.includes('Connection ended');

      if (isConnectionError && attempt < maxRetries) {
        // Exponential backoff: 200ms, 400ms, 800ms
        const delay = 200 * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // Not retryable or out of retries - throw the error
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
