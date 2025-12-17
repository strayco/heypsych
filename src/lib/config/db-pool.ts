// Direct Postgres connection pool for performance-critical queries
// This bypasses Supabase PostgREST overhead for ~10x faster queries

import { Pool } from 'pg';

let pool: Pool | null = null;
let connectionReadyPromise: Promise<void> | null = null;

/**
 * Initialize the database pool (synchronously, no connection yet)
 * Connection will be established on first use via ensureConnectionReady()
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

  return newPool;
}

/**
 * Get the database pool, initializing it if necessary
 * Note: This only creates the pool object, connection is established on first use
 */
export function getDbPool(): Pool {
  if (!pool) {
    pool = initializePool();
  }
  return pool;
}

// No module-level initialization - we'll establish connection on first use
// This ensures we don't waste time on cold starts establishing connections that might timeout

/**
 * Ensure the database pool has at least one ready connection
 * Uses singleton pattern - if connection establishment is in progress, waits for it
 * If no connection exists, establishes one using pool.connect() and verifies it works
 */
async function ensureConnectionReady(): Promise<void> {
  const pool = getDbPool();
  
  // If we already have idle connections, we're ready
  if (pool.idleCount > 0) {
    return;
  }
  
  // If connection establishment is already in progress, wait for it
  if (connectionReadyPromise) {
    await connectionReadyPromise;
    return;
  }
  
  // Start establishing a connection (only once, even with concurrent requests)
  connectionReadyPromise = (async () => {
    try {
      // Explicitly get a client to establish connection
      const client = await pool.connect();
      try {
        // Verify connection works
        await client.query('SELECT 1');
        console.log('✅ Database connection established');
      } finally {
        // Release client back to pool (connection stays alive)
        client.release();
      }
    } catch (error) {
      // Clear promise so we can retry next time
      connectionReadyPromise = null;
      throw error;
    }
  })();
  
  // Wait for connection to be ready
  await connectionReadyPromise;
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
