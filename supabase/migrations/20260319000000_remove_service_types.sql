-- ============================================
-- MIGRATION: Remove service_types table
-- Date: 2026-03-19
-- Description: Elimina la tabella service_types e aggiunge
--              operator_id + category_id direttamente su disdette.
--              Il wizard passa da 4 step a 3 step.
-- ============================================

-- STEP 1: Add new columns to disdette
ALTER TABLE disdette
  ADD COLUMN IF NOT EXISTS operator_id BIGINT REFERENCES operators(id),
  ADD COLUMN IF NOT EXISTS category_id BIGINT REFERENCES categories(id);

-- STEP 2: Migrate existing data from service_types
UPDATE disdette d
SET
  operator_id = st.operator_id,
  category_id = st.category_id
FROM service_types st
WHERE d.service_type_id = st.id;

-- STEP 3: Verify migration (throws exception if any disdette still have NULL)
DO $$
DECLARE
  unmigrated_count INT;
BEGIN
  SELECT COUNT(*) INTO unmigrated_count
  FROM disdette
  WHERE operator_id IS NULL OR category_id IS NULL;

  IF unmigrated_count > 0 THEN
    RAISE EXCEPTION 'Migration failed: % disdette have NULL operator_id or category_id. Check that all disdette have a valid service_type_id.', unmigrated_count;
  END IF;

  RAISE NOTICE 'Migration verification passed: All disdette migrated successfully';
END $$;

-- STEP 4: Make new columns NOT NULL (after verification)
ALTER TABLE disdette
  ALTER COLUMN operator_id SET NOT NULL,
  ALTER COLUMN category_id SET NOT NULL;

-- STEP 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_disdette_operator ON disdette(operator_id);
CREATE INDEX IF NOT EXISTS idx_disdette_category ON disdette(category_id);
CREATE INDEX IF NOT EXISTS idx_disdette_operator_category ON disdette(operator_id, category_id);

-- STEP 6: Drop old foreign key and column
ALTER TABLE disdette DROP CONSTRAINT IF EXISTS disdette_service_type_id_fkey;
ALTER TABLE disdette DROP COLUMN IF EXISTS service_type_id;

-- STEP 7: Drop service_types table
DROP TABLE IF EXISTS service_types CASCADE;

-- STEP 8: Add documentation comments
COMMENT ON COLUMN disdette.operator_id IS 'Direct reference to operator (replaced service_types)';
COMMENT ON COLUMN disdette.category_id IS 'Direct reference to category (replaced service_types)';
