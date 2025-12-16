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
  console.error('Error fetching entities:', error);
  process.exit(1);
}

// Build a set of valid slugs for quick lookup
const validSlugs = new Set(allEntities.map(e => e.slug));
const validConditionSlugs = new Set(allEntities.filter(e => e.type === 'condition').map(e => e.slug));

console.log(`Total active entities: ${allEntities.length}`);
console.log(`Condition entities: ${validConditionSlugs.size}`);
console.log('\n--- Scanning JSON files for broken links ---\n');

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
  } catch (e) {
    // Directory doesn't exist
  }
  return files;
}

// Regex patterns for link syntax
const fullLinkRegex = /\{link:([^:}]+):([^:}]+)(?::([^}]+))?\}/g;
const simpleLinkRegex = /\{link:([^:}]+)\}/g;

const issues = [];

async function checkFile(filePath) {
  const content = await readFile(filePath, 'utf-8');
  const relativePath = filePath.replace(process.cwd() + '/', '');
  
  // Find all link syntax
  let match;
  
  // Check full format links
  const fullRegex = /\{link:([^:}]+):([^:}]+)(?::([^}]+))?\}/g;
  while ((match = fullRegex.exec(content)) !== null) {
    const [fullMatch, type, slug, text] = match;
    
    // Check if slug exists
    if (!validSlugs.has(slug)) {
      issues.push({
        file: relativePath,
        link: fullMatch,
        slug: slug,
        type: type,
        issue: 'Slug does not exist in database'
      });
    }
  }
  
  // Check simple format links {link:slug}
  const simpleRegex = /\{link:([^:}]+)\}(?!\})/g;
  const contentCopy = content.replace(/\{link:[^:}]+:[^:}]+(?::[^}]+)?\}/g, ''); // Remove full links first
  while ((match = simpleRegex.exec(contentCopy)) !== null) {
    const [fullMatch, slug] = match;
    
    // Simple format assumes condition type
    if (!validConditionSlugs.has(slug)) {
      // Check with common abbreviation mappings
      const abbreviationMap = {
        'ptsd': 'posttraumatic-stress-disorder',
        'ocd': 'obsessive-compulsive-disorder',
        'adhd': 'attention-deficit-hyperactivity-disorder',
        'mdd': 'major-depressive-disorder',
        'gad': 'generalized-anxiety-disorder',
      };
      
      const mappedSlug = abbreviationMap[slug.toLowerCase()] || slug;
      if (!validConditionSlugs.has(mappedSlug)) {
        issues.push({
          file: relativePath,
          link: fullMatch,
          slug: slug,
          type: 'condition (assumed)',
          issue: 'Condition slug does not exist'
        });
      }
    }
  }
}

// Scan all data directories
const dirs = ['data/conditions', 'data/treatments', 'data/resources'];
for (const dir of dirs) {
  const files = await getJsonFiles(dir);
  for (const file of files) {
    await checkFile(file);
  }
}

// Group issues by file
const issuesByFile = {};
for (const issue of issues) {
  if (!issuesByFile[issue.file]) {
    issuesByFile[issue.file] = [];
  }
  issuesByFile[issue.file].push(issue);
}

// Print results
const fileCount = Object.keys(issuesByFile).length;
console.log(`Found ${issues.length} broken links in ${fileCount} files:\n`);

for (const [file, fileIssues] of Object.entries(issuesByFile).sort()) {
  console.log(`\n📄 ${file}`);
  for (const issue of fileIssues) {
    console.log(`   ❌ ${issue.link}`);
    console.log(`      → slug "${issue.slug}" not found`);
  }
}

if (issues.length === 0) {
  console.log('✅ No broken links found!');
}
