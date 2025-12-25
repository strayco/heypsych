// Script to update all category hub pages to use centralized config
const fs = require('fs');
const path = require('path');

const categories = [
  'anxiety-fear',
  'attention-learning',
  'autism-development',
  'behavioral-disorders',
  'dementia-memory',
  'dissociative-disorders',
  'eating-body-image',
  'mood-depression',
  'obsessive-compulsive',
  'personality-disorders',
  'psychotic-disorders',
  'sexual-health',
  'sleep-disorders',
  'somatic-health-anxiety',
  'substance-use-disorders',
  'trauma-stress',
];

const template = (slug, functionName) => `import { Metadata } from "next";
import { getConditionsByCategoryServer } from "@/lib/data/server-queries";
import { ConditionsCategoryClient } from "@/components/pages/conditions-category-client";
import { SITE_CONFIG } from "@/lib/seo/config";
import { getCategoryBySlug } from "@/lib/config/condition-categories";

/**
 * Server Component - Pre-fetches data on server for instant page load
 * Includes complete SEO metadata for ${slug} hub page
 */

const fullCategoryConfig = getCategoryBySlug("${slug}")!;
const { icon, ...categoryConfig } = fullCategoryConfig;

export const metadata: Metadata = {
  title: \`\${categoryConfig.displayTitle} | HeyPsych\`,
  description: categoryConfig.description,
  keywords: categoryConfig.keywords.join(", "),
  alternates: {
    canonical: \`\${SITE_CONFIG.url}/conditions/${slug}\`,
  },
  openGraph: {
    title: \`\${categoryConfig.displayTitle} | HeyPsych\`,
    description: categoryConfig.description,
    url: \`\${SITE_CONFIG.url}/conditions/${slug}\`,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
  twitter: {
    card: "summary_large_image",
    title: \`\${categoryConfig.displayTitle} | HeyPsych\`,
    description: categoryConfig.description,
  },
};

export default async function ${functionName}() {
  const conditions = await getConditionsByCategoryServer("${slug}");
  return <ConditionsCategoryClient conditions={conditions} category={categoryConfig} />;
}
`;

categories.forEach(slug => {
  const functionName = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('') + 'Page';

  const filePath = path.join(__dirname, '../src/app/conditions', slug, 'page.tsx');
  const content = template(slug, functionName);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Updated: ${slug}/page.tsx`);
});

console.log(`\n✨ All ${categories.length} category pages updated!`);
