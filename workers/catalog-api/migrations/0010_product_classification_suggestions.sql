-- AI classification staging only. This table never updates products.category/subcategory.
CREATE TABLE IF NOT EXISTS product_classification_suggestions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL UNIQUE,
  product_code TEXT NOT NULL UNIQUE,
  old_category TEXT,
  old_subcategory TEXT,
  suggested_category TEXT,
  suggested_subcategory TEXT,
  confidence REAL,
  reason TEXT,
  status TEXT NOT NULL CHECK (status IN ('READY', 'REVIEW', 'UNKNOWN', 'FAILED')),
  image_available INTEGER NOT NULL DEFAULT 0,
  model TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_classification_suggestions_status
  ON product_classification_suggestions(status);

CREATE INDEX IF NOT EXISTS idx_product_classification_suggestions_category
  ON product_classification_suggestions(suggested_category, suggested_subcategory);
