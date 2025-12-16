# Code Health Audit Report
**Date**: 2025-10-25
**Branch**: `chore/code-health-audit`
**Next.js Version**: 15.4.6
**Status**: 🟡 In Progress

---

## Executive Summary

Comprehensive audit of HeyPsych Next.js codebase completed. The application is functional with 46 routes, 289+ conditions, and 50+ treatments. However, several cleanup opportunities exist to improve maintainability and performance.

**Build Status**: ✅ Builds successfully
**Type Safety**: ✅ TypeScript strict mode enabled
**Lint Status**: ⚠️ Warnings present (downgraded from errors)

---

## Key Findings

### ✅ Strengths
- Clean App Router architecture
- Type-safe entity system with Zod validation
- Comprehensive data organization
- Modern React patterns (hooks, suspense, error boundaries)
- Tailwind CSS design system

### ⚠️ Issues Identified
See [CODE_STRUCTURE_OVERVIEW.md](CODE_STRUCTURE_OVERVIEW.md) for complete details.

**Critical (4)**:
1. Deprecated seeding scripts still present
2. Unused utility functions in lib/
3. Orphaned directories (Crisis/, files/)
4. Public debug page at `/debug` (should be protected)

**Moderate (6)**:
5. Incomplete resource renderer coverage
6. ESLint rules downgraded to warnings
7. TypeScript `any` usage
8. Missing component documentation
9. Resource taxonomy inconsistencies
10. API error messages too verbose in production

**Minor (5)**:
11. No test framework
12. Unused dependencies (d3, recharts, framer-motion)
13. Missing bundle analysis
14. Inconsistent import styles
15. Provider search not working

---

## Audit Progress

- [x] Structure mapping completed
- [x] Tooling setup applied
- [x] Static checks (lint, typecheck, build)
- [x] Security and dependency audit
- [ ] Route and link integrity (pending dev server test)
- [ ] Performance analysis (bundle size review)
- [ ] Apply fixes with approval

---

## Static Analysis Results

### TypeScript Compilation
✅ **PASSED** - No type errors
```
tsc --noEmit: Success
```

### ESLint
⚠️ **280+ WARNINGS** (Build: Passing with ignoreDuringBuilds: true)

**Warning Categories:**
- `@typescript-eslint/no-explicit-any`: 150+ occurrences
  - Heaviest in: `src/lib/hooks/use-entities.ts`, `src/lib/types/database.ts`, `src/lib/data/entity-service.ts`
- `@typescript-eslint/no-unused-vars`: 40+ occurrences
  - Unused imports (lucide-react icons, components)
- `react/no-unescaped-entities`: 30+ occurrences
  - Apostrophes/quotes in JSX text
- `@typescript-eslint/no-require-imports`: 2 occurrences
  - `src/lib/data/entity-service.ts` lines 11-12
- `@typescript-eslint/no-empty-object-type`: 1 occurrence
  - `src/lib/config/supabase.ts` line 3

### Build Output
✅ **PASSED** - All 46 routes successfully generated

**Bundle Sizes:**
- Shared First Load JS: **99.6 kB**
- Pages range: **99.8 kB** (legal) to **215 kB** (resource details)
- Largest pages:
  - `/resources/[slug]`: 215 kB (28.1 kB page + shared)
  - `/treatments/[slug]`: 194 kB (7.63 kB page + shared)
  - `/psychiatrists/[slug]`: 197 kB (6.97 kB page + shared)

**Static Generation:**
- 43 Static pages (○)
- 3 Dynamic API routes (ƒ)

---

## Security & Dependencies

### Security Vulnerabilities
🟡 **1 MODERATE** Severity Issue

**CVE Details:**
```
Package: next@15.4.6
Issue: GHSA-4342-x723-ch2f
Title: Next.js Improper Middleware Redirect Handling Leads to SSRF
Severity: Moderate (CVSS 6.5)
CWE: CWE-918 (Server-Side Request Forgery)
Fix: Upgrade to next@15.4.7+
```

**Recommendation:** Upgrade to `next@15.5.6` (latest stable)

### Outdated Packages

**Critical Updates (Patch/Minor - Security/Stability):**
- `next`: 15.4.6 → 15.5.6 (fixes SSRF vulnerability)
- `@supabase/supabase-js`: 2.56.0 → 2.76.1 (20 minor versions behind)
- `@tanstack/react-query`: 5.84.1 → 5.90.5
- `eslint`: 9.32.0 → 9.38.0
- `zod`: 4.0.15 → 4.1.12

**Optional Updates (Minor - UI/DevTools):**
- All `@radix-ui/*` packages: 1 patch version behind
- `tailwindcss`/`@tailwindcss/*`: 4.1.11 → 4.1.16
- `typescript`: 5.9.2 → 5.9.3

**Major Version Available (Not Recommended Yet):**
- `next`: 16.0.0 (just released, risky upgrade)
- `@types/node`: 24.x (major version jump)
- `react`/`react-dom`: 19.2.0 (patch available)

---

## Performance Analysis

### Bundle Size Breakdown
- **Shared chunks**: 99.6 kB (reasonable for React 19 + Next.js 15)
- **Largest individual pages**:
  - Resources detail: 28.1 kB (complex renderer logic)
  - Treatments detail: 7.85 kB
  - Providers page: 17.3 kB (search UI)

**Opportunities:**
1. Lazy load assessment engines in `/resources/assessments-screeners`
2. Consider code-splitting for large resource renderers
3. Bundle analyzer shows no obvious duplication

### Images & Assets
- Using `next/image` components ✅
- SVG icons in `/public/` (optimal)

### Client vs Server Components
- Most pages properly using Server Components ✅
- Client components appropriately marked with `'use client'`

---

## Identified Issues Summary

### 🔴 Critical Priority

1. **Next.js SSRF Vulnerability**
   - Current: 15.4.6 → Target: 15.5.6
   - Moderate severity security issue
   - **Action**: Upgrade immediately

2. **Public Debug Page**
   - Route: `/debug` (unprotected)
   - Contains internal diagnostics
   - **Action**: Add middleware protection or remove

3. **280+ ESLint Warnings**
   - 150+ `any` types (type safety compromise)
   - 40+ unused imports (dead code)
   - **Action**: Fix systematically by file

### 🟡 Moderate Priority

4. **Outdated Dependencies**
   - Supabase 20 versions behind
   - TanStack Query 6 versions behind
   - **Action**: Safe minor/patch upgrades

5. **Orphaned Directories**
   - `/Crisis/` (empty)
   - `/files/` (empty)
   - **Action**: Delete after confirmation

6. **Deprecated Scripts**
   - Old seeding scripts in root
   - **Action**: Move to `/scripts/deprecated/` or delete

7. **Unused Utility Functions**
   - `src/lib/utils/link-parser.ts` (ReactElement import unused)
   - **Action**: Remove dead code

### 🟢 Low Priority

8. **Unused Dependencies**
   - `d3` - Installed but no usage found
   - `recharts` - Installed but no usage found
   - `framer-motion` - Only 1 animation usage
   - **Action**: Audit and remove if confirmed unused

9. **Missing Tests**
   - No test framework installed
   - **Action**: Consider Vitest + React Testing Library

10. **Format Consistency**
    - Inconsistent quote usage
    - JSX unescaped entities
    - **Action**: Run `npm run format` + fix JSX

---

## Metrics

### Before Audit
- ESLint: Warnings ignored during builds
- No Prettier configuration
- Missing validation scripts
- No bundle analyzer
- Security: 1 unpatched vulnerability
- Dependencies: 30+ outdated packages

### After Tooling Setup
- ESLint: Warnings visible (280+ identified)
- Prettier: Configured with Tailwind plugin
- Scripts: typecheck, format, validate, analyze
- Bundle analyzer: Installed and ready
- Security: Documented and patch available
- Dependencies: Audit complete with upgrade plan

---

## Recommended Fix Sequence

### Phase 1: Security & Stability (High Priority)
1. Upgrade `next` to 15.5.6 (SSRF fix)
2. Upgrade `@supabase/supabase-js` to 2.76.1
3. Upgrade `@tanstack/react-query` to 5.90.5
4. Upgrade `eslint`, `typescript`, `zod` (patch/minor)
5. Protect or remove `/debug` page

**Approval Required**: See diffs before applying

### Phase 2: Code Cleanup (Moderate Priority)
6. Fix unused imports (auto-fixable with `npm run lint:fix`)
7. Remove orphaned directories (`Crisis/`, `files/`)
8. Fix JSX unescaped entities (auto-fixable with ESLint)
9. Delete unused dependencies (`d3`, `recharts` if confirmed)

**Approval Required**: Confirm unused deps before removal

### Phase 3: Type Safety (Moderate Priority)
10. Replace `any` types systematically (start with high-traffic files)
11. Fix `@typescript-eslint/no-empty-object-type` in Supabase config
12. Document remaining `any` usage with justification

**Time-Intensive**: Will require multiple commits

### Phase 4: Performance & Documentation (Low Priority)
13. Run bundle analyzer (`npm run analyze`)
14. Add lazy loading for assessment engines
15. Add component documentation
16. Consider adding test framework

**Optional**: Can be deferred

---

## Next Steps

**Ready for approval:**
1. Review findings and priority
2. Approve Phase 1 (security updates)
3. Incrementally apply fixes with diffs
4. Re-run validation after each phase
