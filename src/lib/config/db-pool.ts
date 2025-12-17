// Direct Postgres connection pool for performance-critical queries
// This bypasses Supabase PostgREST overhead for ~10x faster queries

import { Pool } from 'pg';

let pool: Pool | null = null;
let poolInitializationPromise: Promise<Pool> | null = null;

/**
 * Initialize the database pool at module load time
 * This ensures the connection is ready before any user requests
 * In serverless environments, this runs when the module is first loaded (before first request)
 */
function initializePool(): Pool {
  const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('Missing SUPABASE_DB_URL or DATABASE_URL environment variable');
  }

  const newPool = new Pool({
    connectionString,
    max: 10, // Reduce pool size to avoid connection limits
    idleTimeoutMillis: 30000, // Keep connections alive for 30 seconds (was 10, too aggressive - caused connections to close too frequently)
    connectionTimeoutMillis: 10000, // Connection establishment timeout
    // Note: statement_timeout must be set per-connection or via SQL, not in pool config
    // The search function sets this internally via set_config('statement_timeout', '10000', true)
    min: 1, // Keep at least 1 connection ready at all times
  });

  // Handle pool errors
  newPool.on('error', (err) => {
    console.error('Unexpected error on idle database client', err);
  });

  // Don't warm up here - it will be done in the initialization promise
  // This keeps initialization synchronous and fast
  return newPool;
}

/**
 * Get the database pool, initializing it if necessary
 * The pool is initialized at module load time, so it's ready before first request
 */
export function getDbPool(): Pool {
  if (!pool) {
    pool = initializePool();
  }
  return pool;
}

// Initialize pool immediately at module load time (not lazily)
// This ensures connection is ready before any user requests
// In serverless, this runs when the module is first loaded, before the first API call
if (typeof window === 'undefined') {
  // Only initialize on server-side
  // Start initialization immediately - this happens when module is loaded
  // CRITICAL: This promise must complete before queries can run
  poolInitializationPromise = (async () => {
    // Ensure pool exists (might have been created by getDbPool() already)
    if (!pool) {
      pool = initializePool();
    }
    
    // CRITICAL: Always warm up, even if pool was already created
    // This ensures the connection is actually ready, not just started
    // We must wait here, not fire-and-forget
    let retries = 3;
    while (retries > 0) {
      try {
        await pool.query('SELECT 1');
        // Success - connection is established and ready
        return pool;
      } catch (error) {
        retries--;
        if (retries === 0) {
          console.warn('Pool warm-up query failed after retries (non-fatal):', error);
          // Don't throw - pool will still work, connection will be created on first query
          return pool;
        } else {
          // Wait a bit before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 100 * (4 - retries)));
        }
      }
    }
    return pool;
  })();
}

/**
 * Ensure the database pool has at least one ready connection
 * In serverless environments, this ensures connection is ready before queries
 * This function will wait for module-level initialization if it's still in progress
 */
async function ensureConnectionReady(): Promise<void> {
  // If pool initialization is still in progress, wait for it to complete
  // This ensures the connection is ready before any queries
  if (poolInitializationPromise) {
    await poolInitializationPromise;
  }
  
  const pool = getDbPool();
  
  // Check if we already have idle connections - if so, we're ready
  if (pool.idleCount > 0) {
    return;
  }

  // If no idle connections, try to create one by executing a simple query
  // Retry up to 3 times with increasing delays
  const maxAttempts = 3;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Try to execute a simple query to establish connection
      await pool.query('SELECT 1');
      // If successful, connection is ready
      return;
    } catch (error: any) {
      // If this is the last attempt, throw the error
      if (attempt === maxAttempts - 1) {
        throw error;
      }
      // Wait before retrying (exponential backoff: 100ms, 200ms)
      const delay = 100 * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
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
  // This will throw if connection cannot be established, which is what we want
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
