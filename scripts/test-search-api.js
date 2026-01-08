// Test script to verify search API works at any moment (no delays)
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const API_URL = process.env.API_URL || 'http://localhost:3000';

async function testSearchAPI() {
  console.log('🧪 Testing search API connection readiness...\n');
  console.log(`API URL: ${API_URL}\n`);

  const testQueries = ['anxiety', 'depression', 'therapy', 'zoloft'];

  // Test 1: First request (cold start)
  console.log('Test 1: First request (cold start - should work immediately)...');
  const firstStart = Date.now();
  try {
    const response = await fetch(`${API_URL}/api/search?q=${testQueries[0]}&limit=5`);
    const data = await response.json();
    const firstTime = Date.now() - firstStart;
    
    if (response.ok && data.loadTimeMs) {
      console.log(`✅ First request completed in ${firstTime}ms (API reported: ${data.loadTimeMs}ms)`);
      console.log(`   Results: ${data.conditions?.results?.length || 0} conditions, ${data.treatments?.results?.length || 0} treatments, ${data.resources?.results?.length || 0} resources\n`);
    } else {
      console.error(`❌ First request failed: ${response.status}`);
      if (data.error) console.error(`   Error: ${data.error}`);
      return;
    }
  } catch (error) {
    console.error(`❌ First request failed: ${error.message}`);
    return;
  }

  // Test 2-5: Subsequent requests (should all be fast)
  for (let i = 1; i < testQueries.length; i++) {
    const query = testQueries[i];
    console.log(`Test ${i + 1}: Search for "${query}" (connection should be ready)...`);
    
    const start = Date.now();
    try {
      const response = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(query)}&limit=5`);
      const data = await response.json();
      const time = Date.now() - start;
      
      if (response.ok && data.loadTimeMs) {
        console.log(`✅ Request ${i + 1} completed in ${time}ms (API reported: ${data.loadTimeMs}ms)`);
        console.log(`   Results: ${data.conditions?.results?.length || 0} conditions, ${data.treatments?.results?.length || 0} treatments, ${data.resources?.results?.length || 0} resources`);
        
        // Check if it was fast (should be under 500ms)
        if (data.loadTimeMs < 500) {
          console.log(`   ✅ Fast response (<500ms)\n`);
        } else {
          console.log(`   ⚠️  Slower than expected (>500ms)\n`);
        }
      } else {
        console.error(`❌ Request ${i + 1} failed: ${response.status}\n`);
        if (data.error) console.error(`   Error: ${data.error}\n`);
      }
    } catch (error) {
      console.error(`❌ Request ${i + 1} failed: ${error.message}\n`);
    }
  }

  // Test 6: Wait 5 seconds, then query again (connection should still be ready)
  console.log('Test 6: Waiting 5 seconds, then querying again (connection should still be ready)...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const delayedStart = Date.now();
  try {
    const response = await fetch(`${API_URL}/api/search?q=anxiety&limit=5`);
    const data = await response.json();
    const delayedTime = Date.now() - delayedStart;
    
    if (response.ok && data.loadTimeMs) {
      console.log(`✅ Delayed request completed in ${delayedTime}ms (API reported: ${data.loadTimeMs}ms)`);
      
      if (data.loadTimeMs < 500) {
        console.log(`   ✅ Connection was kept alive (fast response)\n`);
      } else {
        console.log(`   ⚠️  Query took longer - connection might have been recreated\n`);
      }
    } else {
      console.error(`❌ Delayed request failed: ${response.status}\n`);
    }
  } catch (error) {
    console.error(`❌ Delayed request failed: ${error.message}\n`);
  }

  // Test 7: Concurrent requests (simulating multiple users)
  console.log('Test 7: Sending 5 concurrent requests (simulating multiple users)...');
  const concurrentStart = Date.now();
  
  try {
    const promises = Array.from({ length: 5 }, (_, i) =>
      fetch(`${API_URL}/api/search?q=${testQueries[i % testQueries.length]}&limit=5`)
    );
    
    const responses = await Promise.all(promises);
    const concurrentTime = Date.now() - concurrentStart;
    
    const allOk = responses.every(r => r.ok);
    if (allOk) {
      console.log(`✅ All 5 concurrent requests completed in ${concurrentTime}ms`);
      console.log(`   Average: ${(concurrentTime / 5).toFixed(0)}ms per request\n`);
    } else {
      console.error(`❌ Some concurrent requests failed\n`);
    }
  } catch (error) {
    console.error(`❌ Concurrent requests failed: ${error.message}\n`);
  }

  console.log('✅ All tests completed!');
}

testSearchAPI().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});




