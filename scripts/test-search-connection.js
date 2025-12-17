// Test script to verify database connection pool warm-up and search functionality
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ Missing SUPABASE_DB_URL or DATABASE_URL environment variable');
  process.exit(1);
}

async function testConnectionWarmup() {
  console.log('🧪 Testing database connection pool warm-up...\n');

  // Create pool with same config as production
  const pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    min: 1, // Keep at least 1 connection ready
  });

  // Test 1: Warm up connection (simulating pool initialization)
  console.log('Test 1: Warming up connection pool...');
  const warmupStart = Date.now();
  
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    const warmupTime = Date.now() - warmupStart;
    console.log(`✅ Connection warmed up in ${warmupTime}ms\n`);
  } catch (error) {
    console.error('❌ Warm-up failed:', error.message);
    await pool.end();
    process.exit(1);
  }

  // Test 2: First query (should be fast since connection is ready)
  console.log('Test 2: First search query (should use pre-warmed connection)...');
  const firstQueryStart = Date.now();
  
  try {
    const result = await pool.query(
      'SELECT * FROM search_entities_grouped($1, $2)',
      ['anxiety', 5]
    );
    const firstQueryTime = Date.now() - firstQueryStart;
    console.log(`✅ First query completed in ${firstQueryTime}ms`);
    console.log(`   Results: ${result.rows.length} rows\n`);
  } catch (error) {
    console.error('❌ First query failed:', error.message);
    await pool.end();
    process.exit(1);
  }

  // Test 3: Second query (should be even faster)
  console.log('Test 3: Second search query (connection should be ready)...');
  const secondQueryStart = Date.now();
  
  try {
    const result = await pool.query(
      'SELECT * FROM search_entities_grouped($1, $2)',
      ['depression', 5]
    );
    const secondQueryTime = Date.now() - secondQueryStart;
    console.log(`✅ Second query completed in ${secondQueryTime}ms`);
    console.log(`   Results: ${result.rows.length} rows\n`);
  } catch (error) {
    console.error('❌ Second query failed:', error.message);
    await pool.end();
    process.exit(1);
  }

  // Test 4: Verify connection is kept alive (wait a bit, then query again)
  console.log('Test 4: Waiting 2 seconds, then querying again (connection should still be ready)...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const thirdQueryStart = Date.now();
  try {
    const result = await pool.query(
      'SELECT * FROM search_entities_grouped($1, $2)',
      ['therapy', 5]
    );
    const thirdQueryTime = Date.now() - thirdQueryStart;
    console.log(`✅ Third query completed in ${thirdQueryTime}ms`);
    console.log(`   Results: ${result.rows.length} rows\n`);
    
    if (thirdQueryTime < 100) {
      console.log('✅ Connection was kept alive (query was fast)\n');
    } else {
      console.log('⚠️  Query took longer than expected - connection might have been recreated\n');
    }
  } catch (error) {
    console.error('❌ Third query failed:', error.message);
    await pool.end();
    process.exit(1);
  }

  // Test 5: Check pool stats
  console.log('Test 5: Pool statistics...');
  console.log(`   Total connections: ${pool.totalCount}`);
  console.log(`   Idle connections: ${pool.idleCount}`);
  console.log(`   Waiting clients: ${pool.waitingCount}\n`);

  await pool.end();
  console.log('✅ All tests passed! Connection pool is working correctly.');
}

testConnectionWarmup().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});


