# Treatment Renderer Gap Analysis

## Executive Summary

Audit of `src/app/treatments/[slug]/client-wrapper.tsx` against the contract in `TREATMENT_JSON_RENDERER_CONTRACT.md`.

**Status**: Partial implementation with several critical gaps for SEO/UX/CX optimization.

---

## ✅ What's Working

### 1. Link Parsing ✓
- `ParsedContent` component correctly handles `{link:type:slug:label}` syntax
- Links render as proper hyperlinks
- **Status**: Complete

### 2. Section Type Coverage ✓
- All contract-defined section types have handlers
- Patient experience, onset_duration, adverse_effects, warnings, tapering, etc.
- **Status**: Complete

### 3. UX Display Modes (Partial) ⚠️
- `fully_visible`: Implemented
- `top_two_visible`: Implemented for interactions, adverse_effects, warnings
- `patient_text_only`: Implemented for efficacy, dosing, mechanism, tapering, special_populations
- `symptom_only`: Implemented for adverse_effects
- **Status**: Mostly complete, but inconsistent UI patterns

### 4. Lists and Semantic HTML (Partial) ⚠️
- Most sections use `<ul>` and `<li>` properly
- Some sections use generic `<div>` where `<p>` should be used
- **Status**: Needs improvement

---

## ❌ Critical Gaps

### 1. Semantic HTML Headings ✗
**Current**: Section titles use `CardTitle` (styled div)  
**Required**: Semantic `<h2>` tags for SEO  
**Impact**: High - hurts SEO ranking, snippet extraction, accessibility

**Example**:
```tsx
// CURRENT (Bad)
<CardTitle>{title}</CardTitle>

// NEEDED (Good)
<h2 id="section-id">{title}</h2>
```

### 2. Section IDs for Deep Linking ✗
**Current**: No section IDs  
**Required**: Predictable IDs like `id="patient-experience"`, `id="onset-duration"`  
**Impact**: High - prevents deep linking, TOC generation, anchor navigation

### 3. Inconsistent Collapsible UI ⚠️
**Current**: 
- Different button styles across sections
- Inconsistent "Show more/less" text
- Some sections implement collapsible inline, others don't

**Required**: 
- Shared `CollapsibleSection` component
- Consistent styling and behavior
- Smooth transitions

**Impact**: Medium - hurts UX consistency

### 4. Paragraph Text Not Using `<p>` Tags ⚠️
**Current**: Some text uses `<div>` or inline `<span>`  
**Required**: Proper `<p>` tags for paragraph text  
**Impact**: Medium - hurts SEO snippet extraction

**Example**:
```tsx
// CURRENT
<div className="text-neutral-800">{text}</div>

// NEEDED
<p className="text-neutral-800">{text}</p>
```

### 5. Subheadings Not Using Semantic HTML ⚠️
**Current**: Some sections use `<h4>` for subheadings (good), others use styled divs  
**Required**: Consistent use of `<h3>` for subsection headings  
**Impact**: Medium - affects SEO hierarchy

### 6. Missing Smooth Transitions ⚠️
**Current**: Collapsible sections appear/disappear instantly  
**Required**: Smooth height transitions  
**Impact**: Low-Medium - improves perceived performance

### 7. Mobile Optimization ⚠️
**Current**: Collapsible buttons may be too small on mobile  
**Required**: Touch-friendly targets, proper spacing  
**Impact**: Medium - affects mobile UX

---

## 📋 Section-by-Section Analysis

### `patient_experience`
- ✅ Handles `intro` field
- ✅ Uses `<ul>` for lists
- ⚠️ Intro uses `<p>` wrapper but could be more explicit
- ❌ No section ID
- ❌ Heading not semantic

### `onset_duration`
- ✅ Handles `text` and `key_points`
- ✅ Uses `<ul>` for key points
- ⚠️ Text uses ParsedContent (span wrapper) - should use `<p>`
- ❌ Collapsible logic inconsistent
- ❌ No section ID
- ❌ Heading not semantic

### `adverse_effects`
- ✅ Handles `top_two_visible` correctly
- ✅ Uses `<ul>` for lists
- ⚠️ Summary text not in `<p>` tag
- ❌ No section ID
- ❌ Heading not semantic

### `warnings`
- ✅ Handles `top_two_visible` correctly
- ✅ Uses `<ul>` for lists
- ⚠️ Highlight text not in `<p>` tag
- ❌ No section ID
- ❌ Heading not semantic

### `efficacy`
- ✅ Handles `patient_text_only` correctly
- ⚠️ Clinical text not in proper semantic container
- ❌ No section ID
- ❌ Heading not semantic

### `dosing`
- ✅ Handles `patient_text_only` correctly
- ⚠️ Dosing details not in semantic structure
- ❌ No section ID
- ❌ Heading not semantic

### `mechanism`
- ✅ Handles `patient_text_only` correctly
- ⚠️ Text uses ParsedContent span wrapper
- ❌ No section ID
- ❌ Heading not semantic

### Generic Sections (dosage_forms, clinical_notes, monitoring)
- ✅ Use `<ul>` for lists
- ❌ No section ID
- ❌ Heading not semantic

---

## 🎯 Priority Fixes

### Priority 1: Critical SEO
1. Replace `CardTitle` with semantic `<h2>` tags
2. Add section IDs for deep linking
3. Ensure all paragraph text uses `<p>` tags
4. Use proper heading hierarchy (`h2` → `h3` → `h4`)

### Priority 2: UX Consistency
1. Create shared `CollapsibleSection` component
2. Standardize "Show more/less" button styling
3. Add smooth transitions for collapse/expand

### Priority 3: Mobile Optimization
1. Ensure touch-friendly button targets
2. Optimize spacing for mobile screens
3. Test collapsible behavior on mobile

---

## 📊 Implementation Plan

### Phase 1: Semantic HTML Foundation
- [ ] Create utility function to generate section IDs from type
- [ ] Replace all `CardTitle` with `<h2 id="...">`
- [ ] Replace all text divs with `<p>` tags where appropriate
- [ ] Ensure proper heading hierarchy

### Phase 2: Collapsible Component
- [ ] Create `CollapsibleSection` component with:
  - Smooth height transitions
  - Consistent styling
  - Mobile-optimized buttons
  - Accessibility attributes
- [ ] Refactor all sections to use shared component

### Phase 3: UX Polish
- [ ] Add smooth transitions
- [ ] Optimize mobile spacing
- [ ] Test all ux_display modes
- [ ] Verify deep linking works

---

## 🔍 Testing Checklist

After implementation, verify:

- [ ] All section headings are `<h2>` tags
- [ ] All sections have predictable IDs (e.g., `#patient-experience`)
- [ ] Deep links work: `/treatments/alprazolam-xanax#adverse-effects`
- [ ] All paragraph text uses `<p>` tags
- [ ] Collapsible sections have smooth transitions
- [ ] "Show more/less" buttons are consistent across sections
- [ ] Mobile touch targets are at least 44px
- [ ] All `ux_display` modes work as contract specifies
- [ ] Links in content render correctly
- [ ] SEO snippet extraction works (test with Google Rich Results Test)

---

## 📝 Notes

- The Card component structure can remain, but headings must be semantic
- Section IDs should be kebab-case versions of section type
- Collapsible behavior should respect `ux_display` and `collapsible` flags
- All transitions should be smooth (200-300ms)














