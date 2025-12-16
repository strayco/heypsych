import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get all active entities
const { data: allEntities, error } = await supabase
  .from('entities')
  .select('slug, type, title, status')
  .eq('status', 'active');

if (error) {
  console.error('Error:', error);
  process.exit(1);
}

// Build sets
const validSlugs = new Set(allEntities.map(e => e.slug));
const conditionEntities = allEntities.filter(e => e.type === 'condition');
const validConditionSlugs = new Set(conditionEntities.map(e => e.slug));

// Common abbreviation mappings
const abbreviationMap = {
  'ptsd': 'posttraumatic-stress-disorder',
  'ocd': 'obsessive-compulsive-disorder', 
  'adhd': 'attention-deficit-hyperactivity-disorder',
  'mdd': 'major-depressive-disorder',
  'gad': 'generalized-anxiety-disorder',
  'sad': 'social-anxiety-disorder',
  'odd': 'oppositional-defiant-disorder',
  'depression': 'major-depressive-disorder',
  'anxiety': 'generalized-anxiety-disorder',
};

console.log(`Total entities: ${allEntities.length}`);
console.log(`Conditions: ${validConditionSlugs.size}`);

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

async function getJsonFiles(dir) {
  const files = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...await getJsonFiles(fullPath));
      } else if (entry.name.endsWith('.json')) {
        files.push(fullPath);
      }
    }
  } catch (e) {}
  return files;
}

const issues = [];

function checkSlugExists(slug, type = null) {
  // Direct match
  if (validSlugs.has(slug)) return true;
  
  // Try abbreviation mapping
  const mapped = abbreviationMap[slug.toLowerCase()];
  if (mapped && validSlugs.has(mapped)) return true;
  
  // Try without hyphens vs with
  const variants = [
    slug.replace(/-/g, ''),
    slug.replace(/\s+/g, '-'),
  ];
  for (const v of variants) {
    if (validSlugs.has(v)) return true;
  }
  
  return false;
}

async function checkFile(filePath) {
  const content = await readFile(filePath, 'utf-8');
  const relativePath = filePath.replace(process.cwd() + '/', '');
  
  // Find all link patterns
  const linkPatterns = [
    /\{link:([^:}]+):([^:}]+)(?::([^}]+))?\}/g,  // Full: {link:type:slug:text}
    /\{link:([^:}]+)\}/g,  // Simple: {link:slug}
  ];
  
  const foundLinks = new Set();
  
  // Check full format
  let match;
  const fullRegex = /\{link:([^:}]+):([^:}]+)(?::([^}]+))?\}/g;
  while ((match = fullRegex.exec(content)) !== null) {
    const [fullMatch, type, slug] = match;
    const key = `${type}:${slug}`;
    if (foundLinks.has(key)) continue;
    foundLinks.add(key);
    
    if (!checkSlugExists(slug)) {
      issues.push({ file: relativePath, link: fullMatch, slug, type, format: 'full' });
    }
  }
  
  // Check simple format (avoid double-counting)
  const simpleRegex = /\{link:([a-z0-9-]+)\}/gi;
  while ((match = simpleRegex.exec(content)) !== null) {
    const [fullMatch, slug] = match;
    // Skip if it's actually part of a full link (has another colon after)
    const afterMatch = content.substring(match.index + fullMatch.length - 1, match.index + fullMatch.length + 1);
    if (afterMatch.startsWith(':')) continue;
    
    if (foundLinks.has(`condition:${slug}`)) continue;
    foundLinks.add(`condition:${slug}`);
    
    if (!checkSlugExists(slug)) {
      issues.push({ file: relativePath, link: fullMatch, slug, type: 'condition', format: 'simple' });
    }
  }
}

// Scan
const dirs = ['data/conditions', 'data/treatments', 'data/resources'];
for (const dir of dirs) {
  const files = await getJsonFiles(dir);
  for (const file of files) {
    await checkFile(file);
  }
}

// Dedupe and group
const uniqueIssues = [];
const seen = new Set();
for (const issue of issues) {
  const key = `${issue.file}:${issue.slug}`;
  if (!seen.has(key)) {
    seen.add(key);
    uniqueIssues.push(issue);
  }
}

// Group by file
const byFile = {};
for (const issue of uniqueIssues) {
  if (!byFile[issue.file]) byFile[issue.file] = [];
  byFile[issue.file].push(issue);
}

console.log(`\nFound ${uniqueIssues.length} broken links in ${Object.keys(byFile).length} files:\n`);

for (const [file, fileIssues] of Object.entries(byFile).sort()) {
  console.log(`📄 ${file}`);
  for (const issue of fileIssues) {
    console.log(`   ❌ ${issue.slug}`);
  }
}

if (uniqueIssues.length === 0) {
  console.log('✅ No broken links found!');
}
