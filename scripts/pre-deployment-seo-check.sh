#!/bin/bash
set -e

###############################################################################
# Pre-Deployment SEO Check Script
#
# Runs comprehensive SEO validation before deploying to production.
# Ensures all SEO requirements are met and prevents regressions.
#
# Usage:
#   bash scripts/pre-deployment-seo-check.sh
###############################################################################

echo "🚀 Running pre-deployment SEO checks..."
echo ""

# Track failures
FAILED=0

# 1. Image alt text audit
echo "1️⃣  Checking image alt text..."
if npm run audit:images; then
  echo "   ✅ All images have proper alt text"
else
  echo "   ❌ Image alt text audit failed"
  FAILED=$((FAILED + 1))
fi
echo ""

# 2. Validate sitemap
echo "2️⃣  Validating sitemap..."
if node scripts/validate-sitemap.mjs; then
  echo "   ✅ Sitemap valid"
else
  echo "   ❌ Sitemap validation failed"
  FAILED=$((FAILED + 1))
fi
echo ""

# 3. Verify hub pages (requires server running)
echo "3️⃣  Verifying hub pages..."
echo "   ℹ️  Ensure server is running (npm run start in another terminal)"
if SITE_URL=http://localhost:3000 node scripts/verify-hub-pages.mjs; then
  echo "   ✅ All hub pages return 200 OK"
else
  echo "   ⚠️  Hub page verification failed (server may not be running)"
  echo "   ℹ️  This check is optional for pre-deployment but required in CI"
fi
echo ""

# 4. Check TypeScript types (optional but recommended)
echo "4️⃣  Checking TypeScript types..."
if npm run typecheck; then
  echo "   ✅ TypeScript checks passed"
else
  echo "   ⚠️  TypeScript errors found (optional)"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $FAILED -eq 0 ]; then
  echo "✅ All pre-deployment SEO checks passed!"
  echo ""
  echo "Next steps:"
  echo "  1. Commit your changes"
  echo "  2. Push to GitHub"
  echo "  3. Lighthouse CI will run automatically"
  echo "  4. Verify production after deploy with: bash scripts/verify-production-seo.sh"
  echo ""
else
  echo "❌ $FAILED pre-deployment checks failed"
  echo ""
  echo "Please fix the issues above before deploying."
  echo ""
  exit 1
fi
