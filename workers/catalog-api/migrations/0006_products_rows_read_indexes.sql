-- Reduce rows_read for public catalog, filters, detail and sitemap reads.
-- Safe to run repeatedly against cnfansuk-db.

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug_unique ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products(subcategory);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_products_status_created_at ON products(status, created_at);
CREATE INDEX IF NOT EXISTS idx_products_category_created_at ON products(category, created_at);
CREATE INDEX IF NOT EXISTS idx_products_status_updated_at ON products(status, updated_at);
CREATE INDEX IF NOT EXISTS idx_products_category_status_created_at ON products(category, status, created_at);
