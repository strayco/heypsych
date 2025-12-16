import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Excluded types
const excludedTypes = new Set(['provider', 'hotline', 'directory', 'resource']);

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
  // Filter client-side
  return all.filter(e => !excludedTypes.has(e.type));
}

const allEntities = await getAllEntities();
const validSlugs = new Set(allEntities.map(e => e.slug));

console.log(`Linkable entities: ${validSlugs.size}`);

async function getJsonFiles(dir) {
  const files = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) files.push(...await getJsonFiles(fullPath));
      else if (entry.name.endsWith('.json')) files.push(fullPath);
    }
  } catch {}
  return files;
}

const issues = [];

async function checkFile(filePath) {
  const content = await readFile(filePath, 'utf-8');
  const relativePath = filePath.replace(process.cwd() + '/', '');
  
  const linkRegex = /\{link:(?:([^:}]+):)?([^:}]+)(?::([^}]+))?\}/g;
  let match;
  const checked = new Set();
  
  while ((match = linkRegex.exec(content)) !== null) {
    const [fullMatch, type, slug] = match;
    if (checked.has(slug)) continue;
    checked.add(slug);
    
    if (!validSlugs.has(slug)) {
      issues.push({ file: relativePath, slug });
    }
  }
}

const dirs = ['data/conditions', 'data/treatments', 'data/resources'];
for (const dir of dirs) {
  for (const file of await getJsonFiles(dir)) await checkFile(file);
}

const unique = [...new Map(issues.map(i => [`${i.file}:${i.slug}`, i])).values()];

console.log(`\nFound ${unique.length} broken links:\n`);

if (unique.length === 0) {
  console.log('🎉 All cross-links are valid!');
} else {
  const byFile = {};
  for (const i of unique) {
    if (!byFile[i.file]) byFile[i.file] = [];
    byFile[i.file].push(i.slug);
  }
  for (const [file, slugs] of Object.entries(byFile).sort()) {
    console.log(`📄 ${file}`);
    for (const s of slugs) console.log(`   ❌ ${s}`);
  }
}
