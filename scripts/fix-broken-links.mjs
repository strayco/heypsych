import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get all entities
async function getAllEntities() {
  const all = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    const { data } = await supabase
      .from('entities')
      .select('slug, type')
      .eq('status', 'active')
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
    page++;
  }
  return all;
}

const allEntities = await getAllEntities();
const validSlugs = new Set(allEntities.map(e => e.slug));

// Slug corrections (wrong -> right)
const slugCorrections = {
  'post-traumatic-stress-disorder': 'posttraumatic-stress-disorder',
  'attention-deficit-hyperactivity-disorder': 'attention-deficit-hyperactivity-disorder', // verify exists
};

// Abbreviation expansions
const abbreviationMap = {
  'ptsd': 'posttraumatic-stress-disorder',
  'ocd': 'obsessive-compulsive-disorder',
  'adhd': 'attention-deficit-hyperactivity-disorder',
  'mdd': 'major-depressive-disorder',
  'gad': 'generalized-anxiety-disorder',
  'depression': 'major-depressive-disorder',
  'anxiety': 'generalized-anxiety-disorder',
};

function getValidSlug(slug) {
  // Direct match
  if (validSlugs.has(slug)) return slug;
  
  // Try correction
  if (slugCorrections[slug] && validSlugs.has(slugCorrections[slug])) {
    return slugCorrections[slug];
  }
  
  // Try abbreviation
  const lower = slug.toLowerCase();
  if (abbreviationMap[lower] && validSlugs.has(abbreviationMap[lower])) {
    return abbreviationMap[lower];
  }
  
  return null; // Not valid
}

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

let filesFixed = 0;
let linksFixed = 0;
let linksRemoved = 0;

async function fixFile(filePath) {
  let content = await readFile(filePath, 'utf-8');
  let originalContent = content;
  const relativePath = filePath.replace(process.cwd() + '/', '');
  
  // Fix full format links: {link:type:slug} or {link:type:slug:text}
  content = content.replace(/\{link:([^:}]+):([^:}]+)(?::([^}]+))?\}/g, (match, type, slug, text) => {
    const validSlug = getValidSlug(slug);
    if (validSlug) {
      if (validSlug !== slug) {
        linksFixed++;
        // Fix the slug, keep type and text
        return text ? `{link:${type}:${validSlug}:${text}}` : `{link:${type}:${validSlug}}`;
      }
      return match; // Already valid
    }
    // Invalid - convert to plain text
    linksRemoved++;
    const displayText = text || slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return `"${displayText}"`.replace(/^""|""$/g, ''); // Remove double quotes if in string context
  });
  
  // Fix simple format links: {link:slug}
  content = content.replace(/"\{link:([a-z0-9-]+)\}"/gi, (match, slug) => {
    const validSlug = getValidSlug(slug);
    if (validSlug) {
      if (validSlug !== slug) {
        linksFixed++;
        return `"{link:condition:${validSlug}}"`;
      }
      // Convert simple to full format
      return `"{link:condition:${slug}}"`;
    }
    // Invalid - convert to plain text
    linksRemoved++;
    const displayText = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return `"${displayText}"`;
  });
  
  if (content !== originalContent) {
    await writeFile(filePath, content, 'utf-8');
    filesFixed++;
    console.log(`✅ Fixed: ${relativePath}`);
  }
}

// Process all files
const dirs = ['data/treatments'];
for (const dir of dirs) {
  const files = await getJsonFiles(dir);
  for (const file of files) {
    await fixFile(file);
  }
}

console.log(`\n========================================`);
console.log(`Files fixed: ${filesFixed}`);
console.log(`Links corrected: ${linksFixed}`);
console.log(`Links removed (invalid): ${linksRemoved}`);
console.log(`========================================`);
