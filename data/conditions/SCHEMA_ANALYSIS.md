# Condition JSON Schema Variability Analysis

**Dataset:** 130 JSON files across 14 categories
**Sample size:** 8 files analyzed in depth

## Schema Consistency

### Top-level Structure (✓ Consistent)
All files follow the same top-level pattern:
```
{
  "name": string,
  "slug": string,
  "type": "condition",
  "metadata": { ... },
  "content": { ... },
  "status": "active",
  "editorial": { ... }
}
```

### Metadata Variations
- **Standard fields:** category, dsm5_code, icd10_code, wikidata_qid
- **Optional fields:**
  - `aliases` (found in ADHD)
  - Some conditions missing `dsm5_code` (e.g., PTSD)

### Content Structure Variations

#### Fields Present in Some but Not All:
1. **shortDefinition** (ADHD only)
2. **citations** (ADHD only)
3. **linkedMedications** (ADHD only)
4. **related_conditions** (PTSD only)
5. **developmental_stages** (most have, some don't)
6. **etiologies** (neurocognitive disorder has extensive subsection)

#### Field Type Variations:
- **evaluation**: Usually object, sometimes array (Insomnia)
- **neurobiology**: Structure varies significantly:
  - Some: circuitry, neurochemistry, genetic_environmental
  - Others: mechanisms, pathophysiology, structural_findings
  - Neurocognitive: pathology, network_disruption, neurochemical_changes, genetics

#### Consistently Missing (Need to Add):
- `content.aeo` (all files)
- `content.temporal_criteria` (all files)
- `content.misdiagnosis_explained` (all files)
- `content.comparisons` (all files)
- `content.faqs` (all files)
- `content.description.what_it_can_look_like_in_real_life` (all files)
- `content.description.common_reactions_to_diagnosis` (all files)
- `content.lived_experience` (all files)
- `ui` (all files)

## Key Findings for Batch Processor

1. **Preserve all existing content** - no deletion allowed
2. **Handle variable field types** - evaluation can be object or array
3. **Respect existing order** - use OrderedDict or equivalent
4. **Add new fields deterministically** - append at end of content object
5. **Handle nested structures** - especially for conditions with etiologies
6. **Validate JSON output** - some real_life_examples are short, need enrichment
7. **Remove medication schedules** - scan for numeric lab/dosing schedules
8. **Differential diagnosis cleanup** - labels only in specific sections

## Risk Areas

1. **Large nested structures** (neurocognitive disorder with 12+ etiologies)
2. **Inconsistent real_life_examples** (some too brief, some diagnostic language)
3. **Medication safety text** may contain numeric schedules to remove
4. **Field type mismatches** could break JSON parsing if not careful

## Recommendations

1. Use JSON parser that preserves key order
2. Deep merge strategy for nested objects
3. Validate each output with JSON.parse
4. Retry mechanism for API failures
5. Log all transformations for audit trail
