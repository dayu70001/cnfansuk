-- Records which safe classification layer produced a staging suggestion.
-- This is staging metadata only; it never changes products.
ALTER TABLE product_classification_suggestions ADD COLUMN classification_source TEXT;

CREATE INDEX IF NOT EXISTS idx_product_classification_suggestions_source
  ON product_classification_suggestions(classification_source);
