-- Extend the existing category/subcategory validation for Tops / Sweaters.
-- This migration is intentionally pending and must be applied separately.
DROP TRIGGER IF EXISTS products_classification_insert;
DROP TRIGGER IF EXISTS products_classification_update;

CREATE TRIGGER products_classification_insert
BEFORE INSERT ON products
WHEN NOT (
  NEW.category IN ('outerwear', 'tops', 'bottoms', 'co-ords-sets')
  AND (
    NEW.subcategory IS NULL
    OR (NEW.category = 'outerwear' AND NEW.subcategory IN ('jackets', 'puffers', 'coats', 'gilets'))
    OR (NEW.category = 'tops' AND NEW.subcategory IN ('t-shirts', 'hoodies', 'shirts', 'sweaters'))
    OR (NEW.category = 'bottoms' AND NEW.subcategory IN ('jeans', 'trousers', 'shorts'))
    OR (NEW.category = 'co-ords-sets' AND NEW.subcategory IN ('shorts-sets', 'trouser-sets'))
  )
)
BEGIN
  SELECT RAISE(ABORT, 'Invalid category/subcategory pair');
END;

CREATE TRIGGER products_classification_update
BEFORE UPDATE OF category, subcategory ON products
WHEN (NEW.category IS NOT OLD.category OR NEW.subcategory IS NOT OLD.subcategory)
AND NOT (
  NEW.category IN ('outerwear', 'tops', 'bottoms', 'co-ords-sets')
  AND (
    NEW.subcategory IS NULL
    OR (NEW.category = 'outerwear' AND NEW.subcategory IN ('jackets', 'puffers', 'coats', 'gilets'))
    OR (NEW.category = 'tops' AND NEW.subcategory IN ('t-shirts', 'hoodies', 'shirts', 'sweaters'))
    OR (NEW.category = 'bottoms' AND NEW.subcategory IN ('jeans', 'trousers', 'shorts'))
    OR (NEW.category = 'co-ords-sets' AND NEW.subcategory IN ('shorts-sets', 'trouser-sets'))
  )
)
BEGIN
  SELECT RAISE(ABORT, 'Invalid category/subcategory pair');
END;
