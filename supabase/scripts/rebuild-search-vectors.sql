-- Rebuild search vectors in batches to avoid timeout
-- Run this after updating the update_search_vector function

-- Increase timeout for this operation
SET statement_timeout = '10min';

DO $$
DECLARE
  batch_size int := 100;
  processed int := 0;
  total int;
  start_time timestamp;
BEGIN
  -- Get total count
  SELECT COUNT(*) INTO total FROM entities WHERE type <> 'provider';

  RAISE NOTICE 'Rebuilding search vectors for % entities in batches of %', total, batch_size;
  start_time := clock_timestamp();

  -- Process in batches
  LOOP
    -- Update one batch by touching updated_at (triggers the search_vector update)
    UPDATE entities
    SET updated_at = updated_at
    WHERE id IN (
      SELECT id
      FROM entities
      WHERE type <> 'provider'
      LIMIT batch_size
      OFFSET processed
    );

    -- Check if we're done
    IF NOT FOUND THEN
      EXIT;
    END IF;

    processed := processed + batch_size;
    RAISE NOTICE 'Processed % / % entities (%.1f%%) - elapsed: %',
      LEAST(processed, total),
      total,
      (LEAST(processed, total)::float / total * 100),
      (clock_timestamp() - start_time);

    -- Small delay to avoid overwhelming the database
    PERFORM pg_sleep(0.1);
  END LOOP;

  RAISE NOTICE 'Completed! Rebuilt search vectors for % entities in %',
    total,
    (clock_timestamp() - start_time);
END $$;
