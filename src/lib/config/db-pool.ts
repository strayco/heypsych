// Direct Postgres connection pool for performance-critical queries
// This bypasses Supabase PostgREST overhead for ~10x faster queries

import { Pool } from 'pg';

let pool: Pool | null = null;
let poolInitializationError: Error | null = null;

/**
 * Initialize the database pool
 * Connections are created automatically by pool.query() when needed
 */
function initializePool(): Pool | null {
  // If we already tried and failed, don't retry on every request
  if (poolInitializationError) {
    return null;
  }

  const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    poolInitializationError = new Error('Missing SUPABASE_DB_URL or DATABASE_URL environment variable');
    return null;
  }

  // Validate connection string format
  if (!connectionString.startsWith('postgresql://') && !connectionString.startsWith('postgres://')) {
    poolInitializationError = new Error('Invalid database connection string format');
    return null;
  }

  // Check if connection string looks complete
  if (!connectionString.includes('@') || connectionString.split('@').length < 2) {
    poolInitializationError = new Error('Database connection string appears incomplete');
    return null;
  }

  try {
    const newPool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 20000,
      // SSL required for Supabase connections
      ssl: {
        rejectUnauthorized: false
      },
    });

    // Handle pool errors gracefully
    newPool.on('error', (err) => {
      // Log but don't throw - let individual queries handle errors
      console.error('[db-pool] Pool error:', err.message);
    });

    return newPool;
  } catch (error) {
    poolInitializationError = error instanceof Error ? error : new Error('Failed to initialize pool');
    return null;
  }
}

/**
 * Get the database pool, initializing it if necessary
 * Returns null if initialization failed (caller should use fallback)
 */
export function getDbPool(): Pool | null {
  if (!pool) {
    pool = initializePool();
  }
  return pool;
}

// Let the pg Pool library handle connections automatically
// pool.query() will create connections as needed

/**
 * Execute a query with retry logic for connection issues
 * Returns null if pool is unavailable (caller should use fallback)
 */
export async function queryWithRetry<T = any>(
  queryText: string,
  params?: any[],
  maxRetries: number = 3
): Promise<{ rows: T[]; rowCount: number } | null> {
  const pool = getDbPool();
  
  if (!pool) {
    // Pool initialization failed - return null so caller can use fallback
    return null;
  }

  let lastError: Error | null = null;

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

      // Not retryable or out of retries - return null to trigger fallback
      return null;
    }
  }

  return null;
}

// Graceful shutdown
export async function closeDbPool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
