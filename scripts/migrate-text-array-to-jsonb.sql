-- Migration Script: Convert TEXT[] columns to JSONB in exercise_library
-- Issue: Repository code expects JSONB format but database columns are TEXT[]
-- Solution: Convert primary_muscle_groups and secondary_muscle_groups from TEXT[] to JSONB

-- Migration Information
-- Date: 2025-08-31
-- Purpose: Fix "cannot cast type text[] to jsonb" error in muscle group filtering
-- Tables affected: exercise_library
-- Columns: primary_muscle_groups, secondary_muscle_groups

BEGIN;

-- Step 1: Create backup of current data
DO $$
BEGIN
    RAISE NOTICE 'Starting migration: TEXT[] to JSONB conversion for exercise_library';
    RAISE NOTICE 'Creating backup table exercise_library_backup...';
END $$;

CREATE TABLE IF NOT EXISTS exercise_library_backup AS 
SELECT * FROM exercise_library;

-- Step 2: Check current data format and count records
DO $$
DECLARE
    record_count INTEGER;
    sample_primary_muscle TEXT[];
    sample_secondary_muscle TEXT[];
BEGIN
    SELECT COUNT(*) INTO record_count FROM exercise_library;
    RAISE NOTICE 'Total records to migrate: %', record_count;
    
    -- Show sample data format
    SELECT primary_muscle_groups, secondary_muscle_groups 
    INTO sample_primary_muscle, sample_secondary_muscle
    FROM exercise_library 
    WHERE primary_muscle_groups IS NOT NULL 
    LIMIT 1;
    
    RAISE NOTICE 'Sample primary_muscle_groups (TEXT[]): %', sample_primary_muscle;
    RAISE NOTICE 'Sample secondary_muscle_groups (TEXT[]): %', sample_secondary_muscle;
END $$;

-- Step 3: Add temporary JSONB columns
ALTER TABLE exercise_library 
ADD COLUMN primary_muscle_groups_jsonb JSONB,
ADD COLUMN secondary_muscle_groups_jsonb JSONB;

-- Step 4: Convert data from TEXT[] to JSONB
-- Handle primary_muscle_groups conversion
UPDATE exercise_library 
SET primary_muscle_groups_jsonb = to_jsonb(primary_muscle_groups)
WHERE primary_muscle_groups IS NOT NULL;

-- Handle secondary_muscle_groups conversion  
UPDATE exercise_library 
SET secondary_muscle_groups_jsonb = to_jsonb(secondary_muscle_groups)
WHERE secondary_muscle_groups IS NOT NULL;

-- Set empty arrays for NULL values to maintain consistency
UPDATE exercise_library 
SET primary_muscle_groups_jsonb = '[]'::jsonb
WHERE primary_muscle_groups IS NULL;

UPDATE exercise_library 
SET secondary_muscle_groups_jsonb = '[]'::jsonb
WHERE secondary_muscle_groups IS NULL;

-- Step 5: Verify conversion integrity
DO $$
DECLARE
    total_records INTEGER;
    converted_primary INTEGER;
    converted_secondary INTEGER;
    sample_jsonb_primary JSONB;
    sample_jsonb_secondary JSONB;
BEGIN
    SELECT COUNT(*) INTO total_records FROM exercise_library;
    
    SELECT COUNT(*) INTO converted_primary 
    FROM exercise_library 
    WHERE primary_muscle_groups_jsonb IS NOT NULL;
    
    SELECT COUNT(*) INTO converted_secondary 
    FROM exercise_library 
    WHERE secondary_muscle_groups_jsonb IS NOT NULL;
    
    RAISE NOTICE 'Conversion verification:';
    RAISE NOTICE '  Total records: %', total_records;
    RAISE NOTICE '  Primary muscle groups converted: %', converted_primary;
    RAISE NOTICE '  Secondary muscle groups converted: %', converted_secondary;
    
    -- Show sample converted data
    SELECT primary_muscle_groups_jsonb, secondary_muscle_groups_jsonb 
    INTO sample_jsonb_primary, sample_jsonb_secondary
    FROM exercise_library 
    WHERE primary_muscle_groups_jsonb IS NOT NULL 
    LIMIT 1;
    
    RAISE NOTICE 'Sample converted primary_muscle_groups (JSONB): %', sample_jsonb_primary;
    RAISE NOTICE 'Sample converted secondary_muscle_groups (JSONB): %', sample_jsonb_secondary;
    
    -- Verify that all records have been converted
    IF converted_primary != total_records OR converted_secondary != total_records THEN
        RAISE EXCEPTION 'Data conversion incomplete! Expected % records, got primary: %, secondary: %', 
            total_records, converted_primary, converted_secondary;
    END IF;
    
    RAISE NOTICE 'Data conversion verification: PASSED';
END $$;

-- Step 6: Test JSONB queries to ensure they work as expected
DO $$
DECLARE
    test_count INTEGER;
    test_muscle VARCHAR := 'chest';
BEGIN
    RAISE NOTICE 'Testing JSONB query functionality...';
    
    -- Test the exact query pattern used in repository
    SELECT COUNT(*) INTO test_count
    FROM exercise_library 
    WHERE (primary_muscle_groups_jsonb ? test_muscle OR secondary_muscle_groups_jsonb ? test_muscle);
    
    RAISE NOTICE 'JSONB query test: Found % exercises with muscle group "%"', test_count, test_muscle;
    
    -- Test array elements query
    SELECT COUNT(*) INTO test_count
    FROM exercise_library 
    WHERE primary_muscle_groups_jsonb::text LIKE '%chest%';
    
    RAISE NOTICE 'JSONB contains test: Found % exercises containing "%"', test_count, test_muscle;
    
    IF test_count = 0 THEN
        RAISE WARNING 'No exercises found with test muscle group - this may indicate an issue';
    END IF;
END $$;

-- Step 7: Drop old TEXT[] columns and rename JSONB columns
ALTER TABLE exercise_library DROP COLUMN primary_muscle_groups;
ALTER TABLE exercise_library DROP COLUMN secondary_muscle_groups;

ALTER TABLE exercise_library RENAME COLUMN primary_muscle_groups_jsonb TO primary_muscle_groups;
ALTER TABLE exercise_library RENAME COLUMN secondary_muscle_groups_jsonb TO secondary_muscle_groups;

-- Step 8: Add constraints and indexes for JSONB columns
ALTER TABLE exercise_library 
ADD CONSTRAINT valid_primary_muscles_jsonb CHECK (
    jsonb_typeof(primary_muscle_groups) = 'array' AND 
    jsonb_array_length(primary_muscle_groups) > 0
);

ALTER TABLE exercise_library 
ADD CONSTRAINT valid_secondary_muscles_jsonb CHECK (
    jsonb_typeof(secondary_muscle_groups) = 'array'
);

-- Add GIN indexes for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_exercise_library_primary_muscle_groups_gin 
ON exercise_library USING GIN (primary_muscle_groups);

CREATE INDEX IF NOT EXISTS idx_exercise_library_secondary_muscle_groups_gin 
ON exercise_library USING GIN (secondary_muscle_groups);

-- Drop the old GIN index on TEXT[] if it exists
DROP INDEX IF EXISTS idx_exercise_library_muscles;

-- Step 9: Final verification
DO $$
DECLARE
    final_count INTEGER;
    jsonb_test INTEGER;
BEGIN
    SELECT COUNT(*) INTO final_count FROM exercise_library;
    
    -- Test the repository query pattern
    SELECT COUNT(*) INTO jsonb_test
    FROM exercise_library 
    WHERE primary_muscle_groups ? 'chest';
    
    RAISE NOTICE 'Final verification:';
    RAISE NOTICE '  Total records after migration: %', final_count;
    RAISE NOTICE '  JSONB query test (chest muscle): % results', jsonb_test;
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Backup table "exercise_library_backup" contains original data';
END $$;

-- Commit the transaction
COMMIT;

-- Instructions for cleanup (run manually after verifying everything works)
-- DROP TABLE exercise_library_backup;

-- Summary Report
DO $$
BEGIN
    RAISE NOTICE '=== MIGRATION SUMMARY ===';
    RAISE NOTICE 'Migration: TEXT[] to JSONB conversion completed';
    RAISE NOTICE 'Tables modified: exercise_library';
    RAISE NOTICE 'Columns converted: primary_muscle_groups, secondary_muscle_groups';
    RAISE NOTICE 'Backup created: exercise_library_backup';
    RAISE NOTICE 'New indexes: idx_exercise_library_primary_muscle_groups_gin, idx_exercise_library_secondary_muscle_groups_gin';
    RAISE NOTICE 'Repository queries should now work without casting errors';
    RAISE NOTICE '========================';
END $$;