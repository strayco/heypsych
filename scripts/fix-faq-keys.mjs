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

    // Fix FAQ keys: question -> q, answer -> a
    if (data.seo?.faqs && Array.isArray(data.seo.faqs)) {
      data.seo.faqs = data.seo.faqs.map(faq => {
        const newFaq = {};
        if (faq.question || faq.q) {
          newFaq.q = faq.q || faq.question;
          if (faq.question && !faq.q) modified = true;
        }
        if (faq.answer || faq.a) {
          newFaq.a = faq.a || faq.answer;
          if (faq.answer && !faq.a) modified = true;
        }
        return newFaq;
      });
    }

    // Remove invalid fields that are not part of the schema
    if (data.audiences?.specialties) {
      delete data.audiences.specialties;
      modified = true;
    }

    // Ensure one_liner exists if missing
    if (!data.one_liner && data.short_description) {
      data.one_liner = data.short_description.substring(0, 100);
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
