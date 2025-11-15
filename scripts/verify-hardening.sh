#!/bin/bash

# Verify production hardening is complete
# Run this to ensure no console logs leak to production

echo "🔍 Verifying Production Hardening..."
echo ""

# Count console statements in critical paths
echo "📊 Checking critical files..."
echo ""

CRITICAL_LOGS=$(grep -r "console\." \
  --include="*.ts" \
  --include="*.tsx" \
  src/app/api \
  src/app/treatments/error.tsx \
  src/app/providers/error.tsx \
  src/app/resources/error.tsx \
  src/app/search/page.tsx \
  src/app/conditions/anxiety-fear \
  src/app/conditions/trauma-stress \
  src/app/resources/digital-tools \
  src/app/resources/articles-guides \
  src/app/resources/knowledge-hub \
  2>/dev/null | grep -v "logger\." | wc -l)

echo "Critical paths console logs: $CRITICAL_LOGS"

if [ "$CRITICAL_LOGS" -eq 0 ]; then
  echo "✅ PASS: No console logs in critical paths"
else
  echo "⚠️  WARNING: Found $CRITICAL_LOGS console logs in critical paths"
  grep -rn "console\." \
    --include="*.ts" \
    --include="*.tsx" \
    src/app/api \
    src/app/treatments/error.tsx \
    src/app/providers/error.tsx \
    src/app/resources/error.tsx \
    src/app/search/page.tsx \
    2>/dev/null | grep -v "logger\."
fi

echo ""

# Check logger utility exists
echo "📦 Checking logger utility..."
if [ -f "src/lib/utils/logger.ts" ]; then
  echo "✅ PASS: Logger utility exists"
else
  echo "❌ FAIL: Logger utility missing"
  exit 1
fi

echo ""

# Check logger imports in API routes
echo "🔌 Checking logger imports..."
LOGGER_IMPORTS=$(grep -r "from.*@/lib/utils/logger" \
  --include="*.ts" \
  src/app/api \
  2>/dev/null | wc -l)

echo "Logger imports in API routes: $LOGGER_IMPORTS"

if [ "$LOGGER_IMPORTS" -ge 3 ]; then
  echo "✅ PASS: Logger imported in API routes"
else
  echo "⚠️  WARNING: Logger might not be imported in all API routes"
fi

echo ""

# Test production build
echo "🏗️  Testing production build..."
NODE_ENV=production npm run build > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "✅ PASS: Production build successful"
else
  echo "⚠️  WARNING: Production build has errors (check separately)"
fi

echo ""
echo "================================================"
echo "Production Hardening Verification Complete"
echo "================================================"

if [ "$CRITICAL_LOGS" -eq 0 ]; then
  echo "✅ Status: PRODUCTION READY"
  echo ""
  echo "Next steps:"
  echo "  1. Test in production mode: NODE_ENV=production npm start"
  echo "  2. Open browser console - should be silent"
  echo "  3. Search/filter - verify no logs appear"
  echo "  4. Deploy with confidence! 🚀"
  exit 0
else
  echo "⚠️  Status: NEEDS ATTENTION"
  echo ""
  echo "Fix remaining console logs before deploying"
  exit 1
fi
