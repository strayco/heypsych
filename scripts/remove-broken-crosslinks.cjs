#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const brokenSlugs = ['988-suicide-crisis-lifeline', 'crisis-text-line', 'nami'];

const filesToFix = [
  'data/resources/support-community/immediate-crisis/the-trevor-project.json',
  'data/resources/support-community/immediate-crisis/trans-lifeline.json',
  'data/resources/support-community/immediate-crisis/veterans-crisis-line.json',
  'data/resources/support-community/organizations-communities/dbsa.json'
];

filesToFix.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  if (data.relatedResourceSlugs) {
    const originalLength = data.relatedResourceSlugs.length;
    data.relatedResourceSlugs = data.relatedResourceSlugs.filter(slug => !brokenSlugs.includes(slug));

    if (data.relatedResourceSlugs.length < originalLength) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
      console.log(`✅ Fixed: ${file}`);
      console.log(`   Removed ${originalLength - data.relatedResourceSlugs.length} broken crosslinks`);
    }
  }
});

console.log('\n✅ Broken crosslinks removed!');
