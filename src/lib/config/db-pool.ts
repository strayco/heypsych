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
    console.error('[db-pool] ❌ Missing SUPABASE_DB_URL or DATABASE_URL environment variable');
    throw new Error('Missing SUPABASE_DB_URL or DATABASE_URL environment variable');
  }

  // Validate connection string format
  if (!connectionString.startsWith('postgresql://') && !connectionString.startsWith('postgres://')) {
    console.error('[db-pool] ❌ Invalid connection string format. Must start with postgresql:// or postgres://');
    console.error('[db-pool] Connection string length:', connectionString.length);
    console.error('[db-pool] First 50 chars:', connectionString.substring(0, 50));
    throw new Error('Invalid database connection string format');
  }

  // Check if connection string looks complete (should contain @ and ://)
  if (!connectionString.includes('@') || connectionString.split('@').length < 2) {
    console.error('[db-pool] ❌ Connection string appears incomplete (missing @)');
    console.error('[db-pool] Connection string length:', connectionString.length);
    throw new Error('Database connection string appears incomplete');
  }

  // Log connection info (masked) for debugging
  const maskedUrl = connectionString.replace(/:[^:@]+@/, ':****@');
  console.log('[db-pool] Initializing pool with connection:', maskedUrl);
  console.log('[db-pool] Connection string length:', connectionString.length);
  
  const newPool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 20000, // Increased timeout for serverless cold starts
    // SSL required for Supabase connections (always needed, even if sslmode= is in URL)
    ssl: {
      rejectUnauthorized: false
    },
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
      if (attempt === 0) {
        console.log(`[db-pool] Executing query (attempt ${attempt + 1}/${maxRetries + 1})...`);
      }
      const result = await pool.query(queryText, params);
      if (attempt > 0) {
        console.log(`[db-pool] ✅ Query succeeded on retry attempt ${attempt + 1}`);
      }
      return {
        rows: result.rows,
        rowCount: result.rowCount ?? 0,
      };
    } catch (error: any) {
      lastError = error as Error;
      // Log connection errors for debugging
      console.error(`[db-pool] ❌ Query failed (attempt ${attempt + 1}/${maxRetries + 1}):`, {
        code: error.code,
        message: error.message,
        name: error.name,
        query: queryText.substring(0, 50) + '...'
      });
      
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
