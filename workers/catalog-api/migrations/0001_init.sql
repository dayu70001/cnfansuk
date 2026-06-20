CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_code TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  category TEXT NOT NULL,
  subcategory TEXT,
  brand TEXT NOT NULL DEFAULT '',
  price_gbp REAL NOT NULL,
  compare_at_price_gbp REAL,
  currency TEXT NOT NULL DEFAULT 'GBP',
  status TEXT NOT NULL DEFAULT 'draft',
  sort_order INTEGER NOT NULL DEFAULT 0,
  source_url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_code TEXT NOT NULL,
  image_key TEXT NOT NULL,
  image_url TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  alt TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_code TEXT NOT NULL,
  option_name TEXT NOT NULL,
  option_value TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_product_code ON products(product_code);
CREATE INDEX IF NOT EXISTS idx_product_images_product_code ON product_images(product_code);
CREATE INDEX IF NOT EXISTS idx_product_options_product_code ON product_options(product_code);
