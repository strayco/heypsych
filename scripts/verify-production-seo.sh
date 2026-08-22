#!/bin/bash
set -e

###############################################################################
# Production SEO Verification Script
#
# Verifies SEO implementation in production environment.
# Run after deploying to ensure everything works correctly.
#
# Usage:
#   bash scripts/verify-production-seo.sh
###############################################################################

PROD_URL="${PROD_URL:-https://www.heypsych.com}"

echo "🔍 Verifying production SEO at $PROD_URL..."
echo ""

# Track failures
FAILED=0

# 1. Check canonical redirects
echo "1️⃣  Testing canonical redirects..."
REDIRECT_URL=$(curl -s -o /dev/null -w "%{redirect_url}" "https://heypsych.com/" || echo "")
if [ "$REDIRECT_URL" = "https://www.heypsych.com/" ]; then
  echo "   ✅ Non-www → www redirect working"
else
  echo "   ❌ Redirect failed or incorrect"
  echo "      Expected: https://www.heypsych.com/"
  echo "      Got: $REDIRECT_URL"
  FAILED=$((FAILED + 1))
fi
echo ""

# 2. Verify hub pages
echo "2️⃣  Verifying hub pages..."
if SITE_URL=$PROD_URL node scripts/verify-hub-pages.mjs; then
  echo "   ✅ All hub pages accessible"
else
  echo "   ❌ Some hub pages failed"
  FAILED=$((FAILED + 1))
fi
echo ""

# 3. Check robots.txt
echo "3️⃣  Checking robots.txt..."
if curl -s "$PROD_URL/robots.txt" | grep -q "www.heypsych.com"; then
  echo "   ✅ robots.txt contains canonical URL"
else
  echo "   ❌ robots.txt missing canonical URL"
  FAILED=$((FAILED + 1))
fi
echo ""

# 4. Check sitemap accessibility (canonical is sitemap-index.xml)
echo "4️⃣  Checking sitemap..."

# Check the canonical sitemap-index.xml
SITEMAP_INDEX_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL/sitemap-index.xml")
if [ "$SITEMAP_INDEX_STATUS" = "200" ]; then
  echo "   ✅ sitemap-index.xml accessible (HTTP $SITEMAP_INDEX_STATUS)"

  # Check if sitemap index contains expected sub-sitemaps
  SITEMAP_INDEX_CONTENT=$(curl -s "$PROD_URL/sitemap-index.xml")
  if echo "$SITEMAP_INDEX_CONTENT" | grep -q "sitemap-conditions.xml"; then
    echo "   ✅ sitemap-index.xml contains conditions sitemap"
  else
    echo "   ⚠️  sitemap-index.xml missing conditions sitemap"
  fi

  if echo "$SITEMAP_INDEX_CONTENT" | grep -q "sitemap-tools.xml"; then
    echo "   ✅ sitemap-index.xml contains tools sitemap"
  else
    echo "   ❌ sitemap-index.xml missing tools sitemap"
    FAILED=$((FAILED + 1))
  fi
else
  echo "   ❌ sitemap-index.xml not accessible (HTTP $SITEMAP_INDEX_STATUS)"
  FAILED=$((FAILED + 1))
fi

# Check legacy /sitemap.xml redirect
SITEMAP_LEGACY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL/sitemap.xml")
if [ "$SITEMAP_LEGACY_STATUS" = "301" ] || [ "$SITEMAP_LEGACY_STATUS" = "308" ]; then
  echo "   ✅ /sitemap.xml redirects to sitemap-index.xml (HTTP $SITEMAP_LEGACY_STATUS)"
elif [ "$SITEMAP_LEGACY_STATUS" = "200" ]; then
  echo "   ⚠️  /sitemap.xml returns 200 (expected 301 redirect to sitemap-index.xml)"
else
  echo "   ❌ /sitemap.xml unexpected status (HTTP $SITEMAP_LEGACY_STATUS)"
fi
echo ""

# 5. Check homepage meta tags
echo "5️⃣  Checking homepage meta tags..."
HOMEPAGE_HTML=$(curl -s "$PROD_URL/")

if echo "$HOMEPAGE_HTML" | grep -q "<meta name=\"viewport\""; then
  echo "   ✅ Viewport meta tag present"
else
  echo "   ❌ Viewport meta tag missing"
  FAILED=$((FAILED + 1))
fi

if echo "$HOMEPAGE_HTML" | grep -q "<title>"; then
  echo "   ✅ Title tag present"
else
  echo "   ❌ Title tag missing"
  FAILED=$((FAILED + 1))
fi

if echo "$HOMEPAGE_HTML" | grep -q "<meta name=\"description\""; then
  echo "   ✅ Meta description present"
else
  echo "   ❌ Meta description missing"
  FAILED=$((FAILED + 1))
fi

if echo "$HOMEPAGE_HTML" | grep -q "<link rel=\"canonical\""; then
  echo "   ✅ Canonical link present"
else
  echo "   ❌ Canonical link missing"
  FAILED=$((FAILED + 1))
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $FAILED -eq 0 ]; then
  echo "✅ Production SEO verification passed!"
  echo ""
  echo "Next steps:"
  echo "  1. Run Lighthouse audit manually:"
  echo "     https://pagespeed.web.dev/analysis?url=$PROD_URL"
  echo ""
  echo "  2. Verify additional pages:"
  echo "     - $PROD_URL/conditions/depression-major-depressive-disorder"
  echo "     - $PROD_URL/treatments/sertraline-zoloft"
  echo "     - $PROD_URL/resources"
  echo ""
else
  echo "❌ $FAILED production checks failed"
  echo ""
  echo "Please investigate and fix the issues above."
  echo ""
  exit 1
fi
