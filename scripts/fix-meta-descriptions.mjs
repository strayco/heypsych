import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

function getAllJsonFiles(dir) {
  const files = [];
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...getAllJsonFiles(fullPath));
    } else if (entry.endsWith('.json')) {
      files.push(fullPath);
    }
  }

  return files;
}

const dir = 'data/tools-v4/products';
const files = getAllJsonFiles(dir);

let totalFixed = 0;

for (const filepath of files) {
  try {
    const content = readFileSync(filepath, 'utf8');
    const data = JSON.parse(content);
    let modified = false;

    // Fix meta_description if over 160 chars
    if (data.seo?.meta_description && data.seo.meta_description.length > 160) {
      // Truncate to 157 chars and add "..."
      data.seo.meta_description = data.seo.meta_description.substring(0, 157) + '...';
      modified = true;
    }

    // Fix SEO title if over 60 chars
    if (data.seo?.title && data.seo.title.length > 60) {
      data.seo.title = data.seo.title.substring(0, 57) + '...';
      modified = true;
    }

    if (modified) {
      writeFileSync(filepath, JSON.stringify(data, null, 2) + '\n');
      totalFixed++;
      console.log(`Fixed: ${filepath.replace(dir + '/', '')}`);
    }
  } catch (e) {
    console.error(`Error processing ${filepath}: ${e.message}`);
  }
}

console.log(`\nTotal files fixed: ${totalFixed}`);
