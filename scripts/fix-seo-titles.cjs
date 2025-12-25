#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const fixes = [
  {
    file: 'data/resources/assessments-screeners/phq-9.json',
    oldTitle: 'PHQ-9 Depression Screening Tool - Scoring & Interpretation Guide',
    newTitle: 'PHQ-9 Depression Screener - Scoring & Guide' // 44 chars
  },
  {
    file: 'data/resources/assessments-screeners/gad-7.json',
    oldTitle: 'GAD-7 Anxiety Screening Tool - Scoring & Interpretation Guide',
    newTitle: 'GAD-7 Anxiety Screener - Scoring & Guide' // 41 chars
  },
  {
    file: 'data/resources/assessments-screeners/asrs-v1-1.json',
    oldTitle: 'ASRS v1.1 Adult ADHD Screening Tool - Complete Assessment & Scoring',
    newTitle: 'ASRS v1.1 Adult ADHD Screener - Complete Guide' // 47 chars
  }
];

fixes.forEach(({ file, oldTitle, newTitle }) => {
  const filePath = path.join(process.cwd(), file);
  let content = fs.readFileSync(filePath, 'utf8');

  if (content.includes(oldTitle)) {
    content = content.replace(oldTitle, newTitle);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${file}`);
    console.log(`   Old (${oldTitle.length} chars): ${oldTitle}`);
    console.log(`   New (${newTitle.length} chars): ${newTitle}`);
  } else {
    console.log(`⚠️  Title not found in: ${file}`);
  }
});

console.log('\n✅ All SEO titles fixed!');
