#!/usr/bin/env npx tsx

import * as fs from 'fs';
import * as path from 'path';

const KNOWLEDGE_HUB_DIR = path.join(process.cwd(), 'data/resources/knowledge-hub');

function removeAsterisks(obj: any): any {
  if (typeof obj === 'string') {
    // Remove all ** formatting
    return obj.replace(/\*\*/g, '');
  } else if (Array.isArray(obj)) {
    return obj.map(removeAsterisks);
  } else if (obj && typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      newObj[key] = removeAsterisks(obj[key]);
    }
    return newObj;
  }
  return obj;
}

function processArticle(filePath: string): void {
  console.log(`Processing: ${filePath}`);

  const content = fs.readFileSync(filePath, 'utf-8');
  const article = JSON.parse(content);

  // Make anonymous
  if (article.author && article.author !== 'Anonymous') {
    console.log(`  - Anonymizing author: ${article.author}`);
    article.author = 'Anonymous';
  }

  // Remove author_bio if exists
  if (article.author_bio) {
    console.log(`  - Removing author_bio`);
    delete article.author_bio;
  }

  // Remove image_url if exists (personal photos)
  if (article.image_url) {
    console.log(`  - Removing image_url`);
    delete article.image_url;
  }

  // Remove asterisks
  const cleaned = removeAsterisks(article);

  // Write back
  fs.writeFileSync(filePath, JSON.stringify(cleaned, null, 2) + '\n', 'utf-8');
  console.log(`  ✓ Updated`);
}

function findAllArticles(dir: string): string[] {
  const files: string[] = [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...findAllArticles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push(fullPath);
    }
  }

  return files;
}

console.log('Anonymizing and formatting knowledge hub articles...\n');

const articleFiles = findAllArticles(KNOWLEDGE_HUB_DIR);

console.log(`Found ${articleFiles.length} articles\n`);

for (const file of articleFiles) {
  try {
    processArticle(file);
  } catch (error) {
    console.error(`Error processing ${file}:`, error);
  }
}

console.log('\n✓ All articles processed');
