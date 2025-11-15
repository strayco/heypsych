#!/bin/bash
# Rollback Phase 1: Revert to original search API
#
# Use this script if:
# - p95 response time > 400ms for 5+ minutes
# - Error rate > 2% for 2+ minutes
# - Index not being used (Seq Scan instead of Index Scan)

set -e

echo "🔄 Phase 1 Rollback: Reverting Search API"
echo "=========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BACKUP_FILE="src/app/api/search/route.backup.ts"
TARGET_FILE="src/app/api/search/route.ts"

# Check if backup exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ ERROR: Backup file not found: $BACKUP_FILE${NC}"
    echo "Cannot rollback without backup. Manual intervention required."
    exit 1
fi

echo -e "${YELLOW}⚠️  This will revert the search API to the original version${NC}"
echo ""
read -p "Continue with rollback? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Rollback cancelled"
    exit 0
fi

echo ""
echo "🔄 Reverting to original search route..."

# Restore backup
cp "$BACKUP_FILE" "$TARGET_FILE"

echo -e "${GREEN}✅ Search route reverted to backup${NC}"
echo ""

# Rebuild
echo "🏗️  Rebuilding application..."
if npm run build; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo ""
echo "========================================="
echo "✅ Rollback Complete"
echo "========================================="
echo ""
echo "The optimized search API has been reverted."
echo ""
echo "Next steps:"
echo "1. Deploy immediately: vercel --prod"
echo "2. Verify search works"
echo "3. Monitor Sentry for recovery (p95 should drop to <300ms)"
echo "4. Investigate cause of performance degradation"
echo ""
echo "⚠️  NOTE: Database migration is NOT rolled back."
echo "The search_vector column and indexes remain in place."
echo "This is safe and can be used in future optimizations."
echo ""
