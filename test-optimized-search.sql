-- Test the optimized grouped search function

\timing on

-- Test 1: Run the new grouped function (should be much faster)
EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT * FROM search_entities_grouped('anxiety', 5);

-- Test 2: Actual execution time
SELECT 'Running grouped search for: anxiety' as test;
SELECT entity_type, COUNT(*) as results_returned, MAX(type_total_count) as total_matches
FROM search_entities_grouped('anxiety', 5)
GROUP BY entity_type
ORDER BY entity_type;

-- Test 3: Compare old vs new for single type
SELECT 'Old function (treatment)' as method;
SELECT COUNT(*) FROM search_entities('anxiety', 5, 0, 'treatment');

SELECT 'New function (treatment)' as method;
SELECT COUNT(*) FROM search_entities_grouped('anxiety', 5) WHERE entity_type = 'treatment';

-- Test 4: More search terms
SELECT 'Testing: depression' as test;
SELECT entity_type, COUNT(*) as results
FROM search_entities_grouped('depression', 5)
GROUP BY entity_type;

SELECT 'Testing: zoloft' as test;
SELECT entity_type, COUNT(*) as results
FROM search_entities_grouped('zoloft', 5)
GROUP BY entity_type;

SELECT 'Testing: therapy' as test;
SELECT entity_type, COUNT(*) as results
FROM search_entities_grouped('therapy', 5)
GROUP BY entity_type;
