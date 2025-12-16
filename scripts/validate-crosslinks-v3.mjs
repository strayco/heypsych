import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get ALL entities with pagination
async function getAllEntities() {
  const all = [];
  let page = 0;
  const pageSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('entities')
      .select('slug, type, title, status')
      .eq('status', 'active')
      .range(page * pageSize, (page + 1) * pageSize - 1);
    
    if (error) throw error;
    if (!data || data.length === 0) break;
    
    all.push(...data);
    if (data.length < pageSize) break;
    page++;
  }
  return all;
}

const allEntities = await getAllEntities();

// Build sets
const validSlugs = new Set(allEntities.map(e => e.slug));
const conditionEntities = allEntities.filter(e => e.type === 'condition');
const validConditionSlugs = new Set(conditionEntities.map(e => e.slug));

// Abbreviation mappings
const abbreviationMap = {
  'ptsd': 'posttraumatic-stress-disorder',
  'ocd': 'obsessive-compulsive-disorder', 
  'adhd': 'attention-deficit-hyperactivity-disorder',
  'mdd': 'major-depressive-disorder',
  'gad': 'generalized-anxiety-disorder',
  'sad': 'social-anxiety-disorder',
  'odd': 'oppositional-defiant-disorder',
  'bpd': 'borderline-personality-disorder',
  'depression': 'major-depressive-disorder',
  'anxiety': 'generalized-anxiety-disorder',
};

console.log(`Total entities: ${allEntities.length}`);
console.log(`Conditions: ${validConditionSlugs.size}`);
console.log(`\nSample condition slugs:`, [...validConditionSlugs].slice(0, 5));

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

function checkSlugExists(slug) {
  // Direct match
  if (validSlugs.has(slug)) return true;
  
  // Try abbreviation mapping
  const mapped = abbreviationMap[slug.toLowerCase()];
  if (mapped && validSlugs.has(mapped)) return true;
  
  return false;
}

async function checkFile(filePath) {
  const content = await readFile(filePath, 'utf-8');
  const relativePath = filePath.replace(process.cwd() + '/', '');
  
  const foundLinks = new Set();
  
  // Check full format {link:type:slug} or {link:type:slug:text}
  const fullRegex = /\{link:([^:}]+):([^:}]+)(?::([^}]+))?\}/g;
  let match;
  while ((match = fullRegex.exec(content)) !== null) {
    const [fullMatch, type, slug] = match;
    if (foundLinks.has(slug)) continue;
    foundLinks.add(slug);
    
    if (!checkSlugExists(slug)) {
      issues.push({ file: relativePath, slug, format: 'full' });
    }
  }
  
  // Check simple format {link:slug} - only those NOT part of full format
  const simpleRegex = /\{link:([a-z0-9-]+)\}/gi;
  while ((match = simpleRegex.exec(content)) !== null) {
    const [fullMatch, slug] = match;
    // Check if this is actually a simple format (not start of full format)
    const afterPos = match.index + fullMatch.length;
    if (content[afterPos] === ':') continue; // Part of full format
    
    if (foundLinks.has(slug)) continue;
    foundLinks.add(slug);
    
    if (!checkSlugExists(slug)) {
      issues.push({ file: relativePath, slug, format: 'simple' });
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

// Dedupe
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

console.log(`\n========================================`);
console.log(`Found ${uniqueIssues.length} broken links in ${Object.keys(byFile).length} files:`);
console.log(`========================================\n`);

for (const [file, fileIssues] of Object.entries(byFile).sort()) {
  console.log(`📄 ${file}`);
  for (const issue of fileIssues) {
    console.log(`   ❌ ${issue.slug}`);
  }
}

if (uniqueIssues.length === 0) {
  console.log('✅ No broken links found!');
}
