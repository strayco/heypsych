// Direct Postgres connection pool for performance-critical queries
// This bypasses Supabase PostgREST overhead for ~10x faster queries

import { Pool } from 'pg';

let pool: Pool | null = null;
let initializationPromise: Promise<Pool> | null = null;

/**
 * Initialize the database pool and ensure it's ready
 * This ensures the connection is available on first request, even on cold starts
 */
async function initializePool(): Promise<Pool> {
  const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('Missing SUPABASE_DB_URL or DATABASE_URL environment variable');
  }

  // Validate connection string format
  if (!connectionString.startsWith('postgresql://') && !connectionString.startsWith('postgres://')) {
    throw new Error('Invalid database connection string format');
  }

  // Check if connection string looks complete
  if (!connectionString.includes('@') || connectionString.split('@').length < 2) {
    throw new Error('Database connection string appears incomplete');
  }

  const newPool = new Pool({
    connectionString,
    // During build, use smaller pool to avoid exhausting connections during parallel page generation
    // At runtime, use larger pool for better throughput
    // Transaction pooler (6543) can handle more than direct (5432) at runtime
    max: process.env.NEXT_PHASE === 'phase-production-build'
      ? 3  // Build: Small pool (Next.js spawns many workers)
      : (connectionString.includes(':6543') || connectionString.includes('pooler') ? 20 : 10), // Runtime
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 20000,
    // SSL required for Supabase connections
    // Enable certificate verification for production security
    ssl: {
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    },
  });

  // Handle pool errors - reconnect on error
  newPool.on('error', (err) => {
    console.error('[db-pool] Pool error:', err.message);
    // Don't throw - let queries handle errors with retries
  });

  // Test the connection immediately to ensure it's ready
  try {
    await newPool.query('SELECT 1');
  } catch (error) {
    await newPool.end();
    throw new Error(`Failed to establish database connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return newPool;
}

/**
 * Get the database pool, initializing it if necessary
 * Ensures the pool is ready before returning
 */
export async function getDbPool(): Promise<Pool> {
  if (pool) {
    return pool;
  }

  // If initialization is in progress, wait for it
  if (initializationPromise) {
    return initializationPromise;
  }

  // Start initialization
  initializationPromise = initializePool();
  
  try {
    pool = await initializationPromise;
    return pool;
  } catch (error) {
    // Reset promise on failure so we can retry
    initializationPromise = null;
    throw error;
  }
}

// Let the pg Pool library handle connections automatically
// pool.query() will create connections as needed

/**
 * Execute a query with retry logic for connection issues
 * Always attempts to use direct DB connection - throws only if all retries fail
 */
export async function queryWithRetry<T = any>(
  queryText: string,
  params?: any[],
  maxRetries: number = 3,
  statementTimeoutMs: number = 30000
): Promise<{ rows: T[]; rowCount: number }> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Get pool (will initialize and test connection if needed)
      const dbPool = await getDbPool();
      
      // Use a client to set statement_timeout per query
      const client = await dbPool.connect();
      try {
        // Set statement timeout for this query (in milliseconds)
        await client.query(`SET statement_timeout = ${statementTimeoutMs}`);
        const result = await client.query(queryText, params);
        return {
          rows: result.rows,
          rowCount: result.rowCount ?? 0,
        };
      } finally {
        // Always release the client back to the pool
        client.release();
      }
    } catch (error: any) {
      lastError = error as Error;
      
      // Check if this is a connection-related error that might be retryable
      const isConnectionError = 
        error.code === 'ECONNREFUSED' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ENOTFOUND' ||
        error.code === 'ECONNRESET' ||
        error.code === 'EPIPE' ||
        error.code === '57P01' ||
        error.code === '57P02' ||
        error.code === '57P03' ||
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
