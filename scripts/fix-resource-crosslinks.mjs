#!/usr/bin/env node
/**
 * Fix cross-linking in resources and knowledge hub articles
 * 
 * 1. Updates assessment files to use actual condition slugs
 * 2. Updates tags to use proper entity slugs
 * 3. Adds relevant cross-linkable tags to knowledge hub articles
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Map generic terms to actual condition slugs
const CONDITION_SLUG_MAP = {
  'anxiety': 'generalized-anxiety-disorder',
  'depression': 'major-depressive-disorder',
  'ptsd': 'post-traumatic-stress-disorder',
  'ocd': 'obsessive-compulsive-disorder',
  'adhd': 'attention-deficit-hyperactivity-disorder',
  'bipolar': 'bipolar-disorder',
  'schizophrenia': 'schizophrenia',
  'eating': 'eating-disorders',
  'substance': 'substance-use-disorder',
  'autism': 'autism-spectrum-disorder',
  'panic': 'panic-disorder',
  'social-anxiety': 'social-anxiety-disorder',
  'phobia': 'specific-phobia',
  'trauma': 'post-traumatic-stress-disorder',
  'insomnia': 'insomnia-disorder',
};

// Map generic tags to cross-linkable entity slugs
const TAG_TO_ENTITY_MAP = {
  // Conditions
  'anxiety': { slug: 'generalized-anxiety-disorder', type: 'condition' },
  'depression': { slug: 'major-depressive-disorder', type: 'condition' },
  'ptsd': { slug: 'post-traumatic-stress-disorder', type: 'condition' },
  'ocd': { slug: 'obsessive-compulsive-disorder', type: 'condition' },
  'adhd': { slug: 'attention-deficit-hyperactivity-disorder', type: 'condition' },
  'bipolar': { slug: 'bipolar-disorder', type: 'condition' },
  'panic': { slug: 'panic-disorder', type: 'condition' },
  'trauma': { slug: 'post-traumatic-stress-disorder', type: 'condition' },
  
  // Treatments
  'cbt': { slug: 'cognitive-behavioral-therapy', type: 'treatment' },
  'therapy': { slug: 'cognitive-behavioral-therapy', type: 'treatment' },
  'medication': { slug: 'psychiatric-medications', type: 'treatment' },
  'ssri': { slug: 'selective-serotonin-reuptake-inhibitors', type: 'treatment' },
  'antidepressant': { slug: 'antidepressants', type: 'treatment' },
  'mindfulness': { slug: 'mindfulness-based-cognitive-therapy', type: 'treatment' },
};

// Knowledge hub article → relevant entity tags
const ARTICLE_TAG_MAP = {
  'finding-a-therapist': [
    { slug: 'cognitive-behavioral-therapy', type: 'treatment', display: 'Cognitive Behavioral Therapy' },
    { slug: 'generalized-anxiety-disorder', type: 'condition', display: 'Anxiety' },
    { slug: 'major-depressive-disorder', type: 'condition', display: 'Depression' },
  ],
  'manage-anxiety-attacks': [
    { slug: 'panic-disorder', type: 'condition', display: 'Panic Disorder' },
    { slug: 'generalized-anxiety-disorder', type: 'condition', display: 'Generalized Anxiety' },
    { slug: 'cognitive-behavioral-therapy', type: 'treatment', display: 'CBT' },
  ],
  'talk-to-doctor-antidepressants': [
    { slug: 'major-depressive-disorder', type: 'condition', display: 'Depression' },
    { slug: 'sertraline', type: 'treatment', display: 'Sertraline' },
    { slug: 'escitalopram', type: 'treatment', display: 'Escitalopram' },
  ],
  'find-adhd-therapist': [
    { slug: 'attention-deficit-hyperactivity-disorder', type: 'condition', display: 'ADHD' },
    { slug: 'cognitive-behavioral-therapy', type: 'treatment', display: 'CBT' },
  ],
  'understanding-therapy-types': [
    { slug: 'cognitive-behavioral-therapy', type: 'treatment', display: 'CBT' },
    { slug: 'dialectical-behavior-therapy', type: 'treatment', display: 'DBT' },
    { slug: 'psychodynamic-therapy', type: 'treatment', display: 'Psychodynamic Therapy' },
  ],
  'insurance-navigation': [
    { slug: 'major-depressive-disorder', type: 'condition', display: 'Depression' },
    { slug: 'generalized-anxiety-disorder', type: 'condition', display: 'Anxiety' },
  ],
  'therapy-insurance': [
    { slug: 'cognitive-behavioral-therapy', type: 'treatment', display: 'CBT' },
    { slug: 'major-depressive-disorder', type: 'condition', display: 'Depression' },
  ],
  'adhd-women-thirties': [
    { slug: 'attention-deficit-hyperactivity-disorder', type: 'condition', display: 'ADHD' },
    { slug: 'adderall', type: 'treatment', display: 'Adderall' },
  ],
  'bipolar-diagnosis-journey': [
    { slug: 'bipolar-disorder', type: 'condition', display: 'Bipolar Disorder' },
    { slug: 'lithium', type: 'treatment', display: 'Lithium' },
  ],
  'ocd-intrusive-thoughts': [
    { slug: 'obsessive-compulsive-disorder', type: 'condition', display: 'OCD' },
    { slug: 'exposure-response-prevention', type: 'treatment', display: 'ERP Therapy' },
  ],
  'adhd-medication-shortage': [
    { slug: 'attention-deficit-hyperactivity-disorder', type: 'condition', display: 'ADHD' },
    { slug: 'adderall', type: 'treatment', display: 'Adderall' },
  ],
  'ai-therapy-apps': [
    { slug: 'cognitive-behavioral-therapy', type: 'treatment', display: 'CBT' },
    { slug: 'generalized-anxiety-disorder', type: 'condition', display: 'Anxiety' },
  ],
  'ketamine-therapy-2024': [
    { slug: 'ketamine', type: 'treatment', display: 'Ketamine' },
    { slug: 'major-depressive-disorder', type: 'condition', display: 'Depression' },
  ],
  'exercise-antidepressant-study': [
    { slug: 'major-depressive-disorder', type: 'condition', display: 'Depression' },
  ],
  'psychedelics-depression-study': [
    { slug: 'psilocybin', type: 'treatment', display: 'Psilocybin' },
    { slug: 'major-depressive-disorder', type: 'condition', display: 'Depression' },
  ],
  'sleep-mental-health-link': [
    { slug: 'insomnia-disorder', type: 'condition', display: 'Insomnia' },
    { slug: 'major-depressive-disorder', type: 'condition', display: 'Depression' },
    { slug: 'generalized-anxiety-disorder', type: 'condition', display: 'Anxiety' },
  ],
};

// Assessment → condition mapping
const ASSESSMENT_CONDITION_MAP = {
  'gad-7': ['generalized-anxiety-disorder'],
  'phq-9': ['major-depressive-disorder'],
  'phq-2': ['major-depressive-disorder'],
  'pcl-5': ['post-traumatic-stress-disorder'],
  'mdq': ['bipolar-disorder'],
  'audit': ['alcohol-use-disorder'],
  'cage': ['alcohol-use-disorder'],
  'asrs': ['attention-deficit-hyperactivity-disorder'],
  'y-bocs': ['obsessive-compulsive-disorder'],
  'epds': ['major-depressive-disorder', 'postpartum-depression'],
  'ham-d': ['major-depressive-disorder'],
  'ham-a': ['generalized-anxiety-disorder'],
  'bdi-ii': ['major-depressive-disorder'],
  'dass-21': ['major-depressive-disorder', 'generalized-anxiety-disorder'],
};

let updatedCount = 0;

/**
 * Update assessment files with proper condition slugs
 */
function updateAssessments() {
  const assessmentsDir = path.join(rootDir, 'data', 'resources', 'assessments-screeners');
  
  if (!fs.existsSync(assessmentsDir)) {
    console.log('⚠️  Assessments directory not found');
    return;
  }
  
  const files = fs.readdirSync(assessmentsDir).filter(f => f.endsWith('.json'));
  
  for (const file of files) {
    const filePath = path.join(assessmentsDir, file);
    const slug = file.replace('.json', '');
    
    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      let modified = false;
      
      // Update conditions array with proper slugs
      if (ASSESSMENT_CONDITION_MAP[slug]) {
        content.conditions = ASSESSMENT_CONDITION_MAP[slug];
        modified = true;
      } else if (content.conditions && content.conditions.length > 0) {
        // Map generic condition terms to slugs
        const mappedConditions = content.conditions.map(c => {
          const mapped = CONDITION_SLUG_MAP[c.toLowerCase()];
          return mapped || c;
        });
        if (JSON.stringify(mappedConditions) !== JSON.stringify(content.conditions)) {
          content.conditions = mappedConditions;
          modified = true;
        }
      }
      
      // Add cross-linkable tags based on conditions
      if (content.conditions && content.conditions.length > 0) {
        const entityTags = content.conditions.map(c => ({
          slug: c,
          type: 'condition',
        }));
        
        // Add to validated_tags if not already present
        if (!content.validated_tags) {
          content.validated_tags = entityTags;
          modified = true;
        }
      }
      
      if (modified) {
        fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n');
        console.log(`✅ Updated ${file}`);
        updatedCount++;
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  }
}

/**
 * Update knowledge hub articles with cross-linkable tags
 */
function updateKnowledgeHub() {
  const knowledgeHubDir = path.join(rootDir, 'content', 'knowledge-hub');
  
  if (!fs.existsSync(knowledgeHubDir)) {
    console.log('⚠️  Knowledge hub directory not found');
    return;
  }
  
  // Recursively find all JSON files
  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('_')) {
        walkDir(filePath);
      } else if (file.endsWith('.json') && !file.startsWith('_')) {
        updateKnowledgeHubArticle(filePath);
      }
    }
  }
  
  walkDir(knowledgeHubDir);
}

function updateKnowledgeHubArticle(filePath) {
  const slug = path.basename(filePath, '.json');
  
  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    let modified = false;
    
    // Add cross-linkable tags from our map
    if (ARTICLE_TAG_MAP[slug]) {
      content.crosslinks = ARTICLE_TAG_MAP[slug];
      modified = true;
      
      // Also update tags array with display names
      const tagNames = ARTICLE_TAG_MAP[slug].map(t => t.display);
      if (!content.tags || content.tags.length === 0) {
        content.tags = tagNames;
        modified = true;
      }
    }
    
    // If no predefined tags, try to extract from content
    if (!content.crosslinks && content.body) {
      const bodyText = JSON.stringify(content.body).toLowerCase();
      const inferredCrosslinks = [];
      
      // Check for condition/treatment mentions
      for (const [keyword, entity] of Object.entries(TAG_TO_ENTITY_MAP)) {
        if (bodyText.includes(keyword)) {
          inferredCrosslinks.push({
            slug: entity.slug,
            type: entity.type,
            display: keyword.charAt(0).toUpperCase() + keyword.slice(1),
          });
        }
      }
      
      if (inferredCrosslinks.length > 0) {
        content.crosslinks = inferredCrosslinks.slice(0, 5); // Max 5 crosslinks
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n');
      console.log(`✅ Updated ${slug}`);
      updatedCount++;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

// Main execution
console.log('');
console.log('🔗 Fixing Cross-Links in Resources & Knowledge Hub');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');

console.log('📊 Updating assessments...');
updateAssessments();

console.log('');
console.log('📚 Updating knowledge hub articles...');
updateKnowledgeHub();

console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`✅ Done! Updated ${updatedCount} files`);
console.log('');
console.log('Next: Run npm run sync:content to update database');
















