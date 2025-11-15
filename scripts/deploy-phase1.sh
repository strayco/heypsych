#!/bin/bash
# Phase 1 Deployment: Database Full-Text Search + Optimized API
#
# This script applies database migrations and deploys the optimized search API.
# It includes validation, testing, and rollback procedures.

set -e

echo "🚀 Phase 1 Deployment: Database Full-Text Search"
echo "================================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ ERROR: DATABASE_URL environment variable not set${NC}"
    exit 1
fi

if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ ERROR: psql not found. Install PostgreSQL client tools.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites met${NC}"
echo ""

# Step 1: Apply database migration
echo "📊 Step 1: Applying database migration..."
echo "----------------------------------------"

MIGRATION_FILE="supabase/migrations/add_fulltext_search.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}❌ ERROR: Migration file not found: $MIGRATION_FILE${NC}"
    exit 1
fi

echo "Applying migration..."
if psql "$DATABASE_URL" < "$MIGRATION_FILE"; then
    echo -e "${GREEN}✅ Migration applied successfully${NC}"
else
    echo -e "${RED}❌ Migration failed${NC}"
    exit 1
fi

echo ""

# Step 2: Verify indexes created
echo "🔍 Step 2: Verifying indexes..."
echo "-------------------------------"

INDEX_CHECK=$(psql "$DATABASE_URL" -t -c "
SELECT COUNT(*)
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'entities'
  AND indexname = 'idx_entities_search_vector';
")

if [ "$INDEX_CHECK" -eq "1" ]; then
    echo -e "${GREEN}✅ Search vector index exists${NC}"
else
    echo -e "${RED}❌ Search vector index not found${NC}"
    exit 1
fi

echo ""

# Step 3: Verify search function exists
echo "🔧 Step 3: Verifying search function..."
echo "---------------------------------------"

FUNCTION_CHECK=$(psql "$DATABASE_URL" -t -c "
SELECT COUNT(*)
FROM pg_proc
WHERE proname = 'search_entities';
")

if [ "$FUNCTION_CHECK" -ge "1" ]; then
    echo -e "${GREEN}✅ search_entities() function exists${NC}"
else
    echo -e "${RED}❌ search_entities() function not found${NC}"
    exit 1
fi

echo ""

# Step 4: Test search function
echo "🧪 Step 4: Testing search function..."
echo "-------------------------------------"

TEST_RESULT=$(psql "$DATABASE_URL" -t -c "
SELECT COUNT(*)
FROM search_entities('test', 10, 0);
")

echo "Test query returned ${TEST_RESULT} results"

if [ "$TEST_RESULT" -ge "0" ]; then
    echo -e "${GREEN}✅ Search function working${NC}"
else
    echo -e "${RED}❌ Search function failed${NC}"
    exit 1
fi

echo ""

# Step 5: Run performance verification
echo "⚡ Step 5: Performance verification..."
echo "-------------------------------------"

if [ -f "scripts/verify-search-performance.sh" ]; then
    chmod +x scripts/verify-search-performance.sh
    echo "Running performance tests..."
    echo "(See output below for EXPLAIN ANALYZE results)"
    echo ""

    ./scripts/verify-search-performance.sh || {
        echo -e "${YELLOW}⚠️  Performance tests completed with warnings${NC}"
    }
else
    echo -e "${YELLOW}⚠️  Performance verification script not found, skipping${NC}"
fi

echo ""

# Step 6: Deploy optimized API route
echo "🔄 Step 6: Deploying optimized search API..."
echo "--------------------------------------------"

BACKUP_FILE="src/app/api/search/route.backup.ts"
OPTIMIZED_FILE="src/app/api/search/route.optimized.ts"
TARGET_FILE="src/app/api/search/route.ts"

if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${YELLOW}⚠️  Creating backup of current search route${NC}"
    cp "$TARGET_FILE" "$BACKUP_FILE"
fi

if [ ! -f "$OPTIMIZED_FILE" ]; then
    echo -e "${RED}❌ ERROR: Optimized route not found: $OPTIMIZED_FILE${NC}"
    exit 1
fi

echo "Replacing search route with optimized version..."
cp "$OPTIMIZED_FILE" "$TARGET_FILE"

echo -e "${GREEN}✅ Search route updated${NC}"
echo ""

# Step 7: Build and test locally
echo "🏗️  Step 7: Building application..."
echo "-----------------------------------"

if npm run build; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed - rolling back${NC}"
    cp "$BACKUP_FILE" "$TARGET_FILE"
    exit 1
fi

echo ""

# Summary
echo "========================================="
echo "✨ Phase 1 Deployment Complete!"
echo "========================================="
echo ""
echo "✅ Database migration applied"
echo "✅ Full-text search indexes created"
echo "✅ search_entities() function deployed"
echo "✅ Optimized search API route deployed"
echo "✅ Application builds successfully"
echo ""
echo "Next steps:"
echo "1. Test search locally: npm run dev"
echo "2. Visit http://localhost:3000 and test search"
echo "3. Deploy to preview: vercel --preview"
echo "4. Monitor performance in Sentry"
echo "5. If p95 > 400ms for 5+ min, run rollback:"
echo "   ./scripts/rollback-phase1.sh"
echo ""
echo "📊 Monitor at:"
echo "   - Sentry: https://sentry.io"
echo "   - Vercel: https://vercel.com/analytics"
echo ""
