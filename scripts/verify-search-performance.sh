#!/bin/bash
# Verify search performance and index usage
# Run before and after deploying search optimization

set -e

echo "🔍 Verifying Database Search Performance"
echo "========================================="
echo ""

# Check for DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable not set"
    echo "   Set it with: export DATABASE_URL='your-connection-string'"
    exit 1
fi

echo "📊 Running performance tests..."
echo ""

# Test 1: Single-term search (direct query)
echo "Test 1: Single-term search (anxiety)"
echo "-----------------------------------"
psql "$DATABASE_URL" <<'EOF'
\timing on
EXPLAIN ANALYZE
SELECT
  id, type, slug, title, description, metadata,
  ts_rank(search_vector, websearch_to_tsquery('english', 'anxiety')) as rank
FROM entities
WHERE
  type <> 'provider'
  AND status = 'active'
  AND search_vector @@ websearch_to_tsquery('english', 'anxiety')
ORDER BY rank DESC
LIMIT 50;
\timing off
EOF
echo ""

# Test 2: Multi-term search
echo "Test 2: Multi-term search (cognitive behavioral therapy)"
echo "------------------------------------------------------"
psql "$DATABASE_URL" <<'EOF'
\timing on
EXPLAIN ANALYZE
SELECT * FROM search_entities('cognitive behavioral therapy', 50, 0);
\timing off
EOF
echo ""

# Test 3: Brand name search
echo "Test 3: Brand name search (zoloft)"
echo "----------------------------------"
psql "$DATABASE_URL" <<'EOF'
\timing on
EXPLAIN ANALYZE
SELECT * FROM search_entities('zoloft', 50, 0);
\timing off
EOF
echo ""

# Test 4: Large result set
echo "Test 4: Large result set (treatment)"
echo "------------------------------------"
psql "$DATABASE_URL" <<'EOF'
\timing on
EXPLAIN ANALYZE
SELECT * FROM search_entities('treatment', 100, 0);
\timing off
EOF
echo ""

# Check index health
echo "📈 Index Health Check"
echo "--------------------"
psql "$DATABASE_URL" <<'EOF'
SELECT
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched,
  CASE
    WHEN idx_scan = 0 THEN '❌ Not used'
    WHEN idx_tup_fetch = 0 THEN '⚠️  No fetches'
    ELSE '✅ Healthy'
  END as status
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename = 'entities'
ORDER BY pg_relation_size(indexrelid) DESC;
EOF
echo ""

# Performance summary
echo "✅ Performance verification complete!"
echo ""
echo "Expected results:"
echo "  - Execution time: <50ms for simple queries"
echo "  - Execution time: <100ms for complex queries"
echo "  - Index used: 'Bitmap Index Scan on idx_entities_search_vector'"
echo "  - Index status: ✅ Healthy"
echo ""
echo "🚨 Rollback triggers:"
echo "  - Execution time >100ms consistently"
echo "  - 'Seq Scan' instead of 'Bitmap Index Scan'"
echo "  - Planning time >5ms"
