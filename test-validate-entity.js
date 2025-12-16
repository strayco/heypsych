// Test validateEntityExists directly
import { validateEntityExists } from './src/lib/linking/utils.js';

async function testValidation() {
  console.log('\n=== Testing validateEntityExists ===\n');

  const testCases = [
    { name: 'sertraline', type: 'medication' },
    { name: 'escitalopram', type: 'medication' },
    { name: 'CBT', type: 'therapy' },
    { name: 'cognitive behavioral therapy', type: 'therapy' },
  ];

  for (const testCase of testCases) {
    console.log(`\nTesting: "${testCase.name}" (${testCase.type})`);
    try {
      const result = await validateEntityExists(testCase.name, testCase.type);
      if (result) {
        console.log(`  ✅ Found: ${result.slug} (${result.title || result.name})`);
      } else {
        console.log(`  ❌ Not found`);
      }
    } catch (error) {
      console.error(`  ❌ Error:`, error.message);
    }
  }
}

testValidation().catch(console.error);
