-- ============================================
-- Migration: Add service_type_id to disdette
-- ============================================

-- 1. Aggiungi colonna service_type_id (nullable inizialmente)
ALTER TABLE disdette
ADD COLUMN service_type_id BIGINT REFERENCES service_types(id);

-- 2. Crea indice per performance
CREATE INDEX idx_disdette_service_type ON disdette(service_type_id);

-- 3. Aggiungi commento
COMMENT ON COLUMN disdette.service_type_id IS 'Foreign key to service_types - identifies operator and service category for PEC sending';

-- 4. Popola dati esistenti dove possibile (basandosi su supplier_name)

-- TIM Mobile
UPDATE disdette
SET service_type_id = (
  SELECT st.id FROM service_types st
  JOIN operators o ON st.operator_id = o.id
  JOIN categories c ON st.category_id = c.id
  WHERE o.name = 'TIM' AND c.name = 'Mobile'
  LIMIT 1
)
WHERE (supplier_name ILIKE '%tim%' OR supplier_name ILIKE '%telecom%')
  AND service_type_id IS NULL;

-- Enel Energia
UPDATE disdette
SET service_type_id = (
  SELECT st.id FROM service_types st
  JOIN operators o ON st.operator_id = o.id
  WHERE o.name = 'Enel Energia'
  LIMIT 1
)
WHERE supplier_name ILIKE '%enel%'
  AND service_type_id IS NULL;

-- Vodafone
UPDATE disdette
SET service_type_id = (
  SELECT st.id FROM service_types st
  JOIN operators o ON st.operator_id = o.id
  WHERE o.name = 'Vodafone'
  LIMIT 1
)
WHERE supplier_name ILIKE '%vodafone%'
  AND service_type_id IS NULL;

-- WindTre
UPDATE disdette
SET service_type_id = (
  SELECT st.id FROM service_types st
  JOIN operators o ON st.operator_id = o.id
  WHERE o.name = 'WindTre'
  LIMIT 1
)
WHERE (supplier_name ILIKE '%windtre%' OR supplier_name ILIKE '%wind%' OR supplier_name ILIKE '%tre%')
  AND service_type_id IS NULL;

-- Fastweb
UPDATE disdette
SET service_type_id = (
  SELECT st.id FROM service_types st
  JOIN operators o ON st.operator_id = o.id
  WHERE o.name = 'Fastweb'
  LIMIT 1
)
WHERE supplier_name ILIKE '%fastweb%'
  AND service_type_id IS NULL;

-- 5. Verifica risultati
SELECT
  COUNT(*) as total_disdette,
  COUNT(service_type_id) as with_service_type,
  COUNT(*) - COUNT(service_type_id) as missing_service_type
FROM disdette;

-- 6. Mostra disdette senza service_type_id (per debug)
SELECT id, supplier_name, status, created_at
FROM disdette
WHERE service_type_id IS NULL
ORDER BY created_at DESC
LIMIT 20;