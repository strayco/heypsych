# Treatment JSON Renderer - Final Contract

**Version**: 2.0  
**Last Updated**: 2025-01-28  
**Status**: Canonical Reference for Engineering & Content Teams

---

## Overview

This document defines the **complete contract** between treatment JSON files and the treatment page renderer. This contract ensures:

- ✅ **SEO Optimization**: Semantic HTML, proper heading hierarchy, snippet-friendly structure
- ✅ **UX Excellence**: Progressive disclosure, scannable content, reduced scroll fatigue
- ✅ **UI Consistency**: Uniform collapsible patterns, mobile-optimized interactions
- ✅ **CX Quality**: Clear information hierarchy, discoverable content

---

## Section Structure

Every section in the `sections` array must follow this structure:

```typescript
{
  type: string;              // Required: Section type identifier
  heading?: string;          // Optional: Custom heading (overrides auto-generated)
  ux_display?: string;       // Optional: Controls default visibility
  collapsible?: boolean;     // Optional: Enables collapse behavior
  // ... section-specific fields
}
```

### Section IDs

Every section automatically receives a semantic ID for deep linking:
- Format: `{type}` → `id="{type}"` (kebab-case)
- Example: `"patient_experience"` → `id="patient-experience"`
- Deep link: `/treatments/alprazolam-xanax#patient-experience`

---

## Semantic HTML Structure

### Heading Hierarchy

```
h1 → Page title (treatment name)
  └─ h2 → Section titles (e.g., "What Xanax Feels Like")
       └─ h3 → Subsection titles (e.g., "Common Side Effects")
            └─ h4 → Sub-subsection titles (rare, when needed)
```

**Rules**:
- All section titles are `<h2 id="section-id">`
- All subsection titles are `<h3>`
- Use `<p>` tags for paragraph text
- Use `<ul>` / `<li>` for lists
- Use semantic HTML throughout

### Text Rendering

- **Paragraph text**: Always wrapped in `<p>` tags
- **Lists**: Always use `<ul>` or `<ol>` with `<li>` items
- **Inline links**: Handled by `ParsedContent` component
- **Subheadings**: Use `<h3>` for subsections within sections

---

## UX Display Modes

### `fully_visible`
**Purpose**: Show all content immediately, no collapsing  
**Use Case**: Critical sections users need to see immediately  
**Behavior**: All content expanded by default, `collapsible` flag can enable collapse  
**Example Sections**: `patient_experience`, `onset_duration` (key info)

### `top_two_visible`
**Purpose**: Show first 2 items, collapse the rest  
**Use Case**: Long lists where showing everything creates scroll fatigue  
**Behavior**: 
- Shows first 2 items by default
- "Show X more" button reveals remaining items
- Requires `collapsible: true`
**Example Sections**: `adverse_effects.common`, `interactions.items`, `warnings.other`

### `patient_text_only`
**Purpose**: Prioritize patient-friendly content, hide clinical details initially  
**Use Case**: Sections with both patient and clinical content  
**Behavior**:
- Shows patient text immediately
- Clinical details in collapsible section
- "Show clinical details" button
**Example Sections**: `efficacy`, `dosing`, `mechanism`, `tapering`, `special_populations`

### `symptom_only`
**Purpose**: Ultra-minimal view with just symptom names  
**Use Case**: Quick reference without detailed explanations  
**Behavior**: Shows only symptom names, no incidence rates or patient notes  
**Example Sections**: `adverse_effects`

---

## Collapsible Behavior

### How It Works

The `collapsible` flag works with `ux_display` to control collapse behavior:

- `collapsible: false` → Content always expanded (even with `top_two_visible`)
- `collapsible: true` → Respects `ux_display` mode collapse rules
- `collapsible: undefined` → Defaults to allowing collapse based on `ux_display`

### Collapsible UI Pattern

All collapsible sections use a consistent pattern:

```tsx
<button className="collapsible-button">
  {isExpanded ? "Show less" : "Show X more"}
  <ChevronIcon rotated={isExpanded} />
</button>
```

**Requirements**:
- Smooth height transitions (300ms)
- Touch-friendly targets (min 44x44px)
- Consistent styling across all sections
- Accessible (ARIA attributes)

---

## Section Types & Contracts

### `patient_experience`

**Required Fields**:
- `items` (array): Array of objects with:
  - `category` (string): Category name
  - `quotes` (array of strings): Patient quotes
  - `note` (string, optional): Explanatory note

**Optional Fields**:
- `intro` (string): Introduction paragraph
- `ux_display`: `"fully_visible"` (default)
- `collapsible`: `false` (default)

**Rendering**:
- Intro as `<p>` tag
- Each category as subsection with `<h3>`
- Quotes as blockquotes or styled divs
- Notes as `<p>` tags

---

### `onset_duration`

**Required Fields**:
- `text` (string): Main description
- `key_points` (array of strings): Bullet points

**Optional Fields**:
- `ux_display`: `"fully_visible"` (default)
- `collapsible`: `false` (default)

**Rendering**:
- Text as `<p>` tag
- Key points as `<ul>` / `<li>`

---

### `adverse_effects`

**Required Fields**:
- `common` (array): Array of objects with:
  - `symptom` (string): Symptom name
  - `incidence` (string): Incidence rate
  - `patient_note` (string, optional): Patient-friendly explanation

**Optional Fields**:
- `summary` (string): Overview paragraph
- `plain_language_list` (array of strings): Simple list
- `serious` (array of strings): Serious side effects
- `patient_text` (string): Patient-friendly summary
- `ux_display`: `"fully_visible"`, `"top_two_visible"`, `"symptom_only"`
- `collapsible`: `true` (when using `top_two_visible`)

**Rendering**:
- Summary as `<p>` tag
- Plain language list as `<ul>` / `<li>` with `<h3>` heading
- Common effects with incidence badges
- Serious effects as `<ul>` / `<li>` with `<h3>` heading
- Collapsible when `top_two_visible` + `collapsible: true`

---

### `warnings`

**Required Fields**: None (at least one field should be present)

**Optional Fields**:
- `highlight` (string): Prominent warning highlight
- `black_box` (string): Black box warning text
- `other` (array of strings): Clinical warnings list
- `patient_counseling` (array of strings): Key counseling points
- `ux_display`: `"fully_visible"`, `"top_two_visible"`
- `collapsible`: `true` (when using `top_two_visible`)

**Rendering**:
- Highlight as `<p>` tag in highlighted box
- Black box as prominent box with `<h3>` heading
- Other warnings as `<ul>` / `<li>` with `<h3>` heading
- Patient counseling as `<ul>` / `<li>` with `<h3>` heading
- Collapsible when `top_two_visible` + `collapsible: true`

---

### `tapering`

**Required Fields**:
- `text` (string): Clinical description
- `patient_text` (string): Patient-friendly explanation

**Optional Fields**:
- `key_points` (array of strings): Important points
- `ux_display`: `"patient_text_only"` (recommended)
- `collapsible`: `true` (when using `patient_text_only`)

**Rendering**:
- Patient text first (always visible)
- Clinical text and key points in collapsible section

---

### `indications`

**Required Fields**:
- `items` (array of strings): Primary indications (supports `{link:}` syntax)

**Optional Fields**:
- `off_label` (array of strings): Off-label uses
- `patient_text` (string): Patient-friendly explanation
- `ux_display`: `"fully_visible"` (default)
- `collapsible`: `true` (optional)

**Rendering**:
- Items as linked badges
- Off-label as separate section with `<h3>` heading
- Patient text in highlighted box

---

### `dosing`

**Required Fields**: None (at least one field should be present)

**Optional Fields**:
- `adult.start` (string): Starting dose
- `adult.max` (string): Maximum dose
- `adult.notes` (string): Dosing notes
- `renal_adjustments`, `hepatic_adjustments` (objects): Adjustment details
- `patient_text` (string): Patient-friendly explanation
- `simple_explanation` (string): Simple explanation
- `ux_display`: `"fully_visible"`, `"patient_text_only"` (recommended)
- `collapsible`: `true` (when using `patient_text_only`)

**Rendering**:
- Patient text first (when `patient_text_only`)
- Clinical details in collapsible section
- Subheadings as `<h3>` tags

---

### `interactions`

**Required Fields**:
- `items` (array): Array of objects with:
  - `with` (string): Interacting substance
  - `risk` (string): Risk description
  - `action` (string): Recommended action

**Optional Fields**:
- `intro` (string): Introduction paragraph
- `ux_display`: `"fully_visible"`, `"top_two_visible"` (recommended)
- `collapsible`: `true` (when using `top_two_visible`)

**Rendering**:
- Intro as `<p>` tag
- Items as cards or structured blocks
- Collapsible when `top_two_visible` + `collapsible: true`

---

### `special_populations`

**Required Fields**: None (at least one field should be present)

**Optional Fields**:
- `pregnancy`, `lactation`, `pediatrics`, `geriatrics` (strings): Population-specific info
- `patient_text` (string): Patient-friendly summary
- `ux_display`: `"fully_visible"`, `"patient_text_only"` (recommended)
- `collapsible`: `true` (when using `patient_text_only`)

**Rendering**:
- Patient text first (when `patient_text_only`)
- Details as subsections with `<h3>` headings
- Collapsible clinical details

---

### `efficacy`

**Required Fields**:
- `metric` (string): Efficacy metric name
- `value` (string): Efficacy value
- `comparison` (string): Comparison data

**Optional Fields**:
- `text` (string): Clinical description
- `patient_text` (string): Patient-friendly explanation
- `citation` (object): Citation with `label` and `url`
- `ux_display`: `"fully_visible"`, `"patient_text_only"`
- `collapsible`: `true` (when using `patient_text_only`)

**Rendering**:
- Metric/value displayed prominently
- Patient text first (when `patient_text_only`)
- Clinical details and citation in collapsible section

---

### `mechanism`

**Required Fields**:
- `text` (string): Clinical mechanism description

**Optional Fields**:
- `patient_text` (string): Patient-friendly explanation
- `ux_display`: `"fully_visible"`, `"patient_text_only"` (recommended)
- `collapsible`: `true` (when using `patient_text_only`)

**Rendering**:
- Patient text first (when `patient_text_only`)
- Clinical text in collapsible section

---

### `dosage_forms`

**Required Fields**:
- `items` (array of strings): List of dosage forms

**Optional Fields**:
- `patient_note` (string): Patient-friendly note
- `ux_display`: `"fully_visible"` (default)
- `collapsible`: `true` (optional)

**Rendering**:
- Items as `<ul>` / `<li>`
- Patient note as `<p>` tag in highlighted box

---

### `clinical_notes`, `monitoring`

**Required Fields**:
- `items` (array of strings): List of notes/monitoring items

**Optional Fields**:
- `ux_display`: `"fully_visible"` (default)
- `collapsible`: `true` (optional)

**Rendering**:
- Items as `<ul>` / `<li>`

---

### `references`

**Required Fields**:
- `items` (array): Array of objects with:
  - `label` (string): Reference label
  - `url` (string): Reference URL

**Optional Fields**:
- `ux_display`: `"fully_visible"` (default)
- `collapsible`: `true` (optional)

**Rendering**:
- Items as external links in list format

---

## Link Syntax

All text fields support inline linking using `{link:type:slug:label}` syntax:

- `{link:condition:generalized-anxiety-disorder:GAD}` → Links to condition page
- `{link:treatment:alprazolam-xanax:Xanax}` → Links to treatment page
- `{link:condition:slug}` → Simple format (defaults to condition)

Links are automatically parsed and rendered as clickable hyperlinks by the `ParsedContent` component.

---

## SEO Optimizations

### Implemented Features

1. **Semantic HTML**: All headings use proper `<h1>`, `<h2>`, `<h3>` hierarchy
2. **Section IDs**: Every section has a predictable ID for deep linking
3. **Paragraph Tags**: All paragraph text uses `<p>` tags
4. **List Structure**: All lists use semantic `<ul>` / `<li>` or `<ol>` / `<li>`
5. **Accessibility**: ARIA attributes on interactive elements
6. **Mobile Optimization**: Touch-friendly targets (min 44x44px)

### SEO Benefits

- **Rich Snippets**: Semantic structure improves snippet extraction
- **Deep Linking**: Section IDs enable direct linking to specific content
- **Accessibility**: Proper HTML improves screen reader support
- **Mobile SEO**: Optimized structure for mobile-first indexing

---

## Best Practices

### For Content Authors

1. **Use Custom Headings**: Provide clear, SEO-friendly headings
2. **Leverage UX Modes**: Use `top_two_visible` for long lists, `patient_text_only` for clinical sections
3. **Enable Collapsible**: Set `collapsible: true` for sections that can be collapsed
4. **Patient Text First**: Always provide `patient_text` for patient-friendly explanations
5. **Use Links**: Leverage `{link:}` syntax for cross-referencing

### For Developers

1. **Respect Semantic HTML**: Always use proper heading tags and paragraph tags
2. **Maintain IDs**: Ensure section IDs match the contract (kebab-case from type)
3. **Consistent Collapsible**: Use shared collapsible patterns
4. **Mobile First**: Test collapsible behavior on mobile devices
5. **Accessibility**: Include ARIA attributes on interactive elements

---

## Migration Checklist

When updating treatment JSON files:

- [ ] All sections have custom `heading` fields (or accept auto-generated)
- [ ] Appropriate `ux_display` modes are set
- [ ] `collapsible` flags are set correctly
- [ ] Required fields are present for each section type
- [ ] Links use `{link:type:slug:label}` syntax
- [ ] Patient text is provided where available
- [ ] Content is structured for scannability

---

## Testing

### Manual Testing

1. Load treatment page locally
2. Verify all section headings are `<h2>` tags
3. Verify all sections have IDs (check HTML)
4. Test deep linking: `/treatments/{slug}#{section-id}`
5. Test all `ux_display` modes
6. Test collapsible behavior
7. Verify links render correctly
8. Test on mobile device

### Automated Testing

- HTML validation (semantic structure)
- Accessibility audit (ARIA, heading hierarchy)
- Mobile responsiveness
- Link validation

---

## Changelog

### v2.0 (2025-01-28)
- Added semantic HTML structure (h2/h3 headings)
- Added section IDs for deep linking
- Standardized collapsible UI patterns
- Improved mobile optimization
- Enhanced SEO structure

### v1.0 (2025-01-27)
- Initial contract definition
- Basic section type definitions
- UX display mode specifications

---

## Support

For questions or issues:
- Engineering: See implementation in `src/app/treatments/[slug]/client-wrapper.tsx`
- Content: Reference this contract when creating/updating JSON files
- Documentation: This is the canonical reference











