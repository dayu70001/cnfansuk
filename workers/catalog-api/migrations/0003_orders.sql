CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  customer_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  preferred_contact TEXT,
  whatsapp TEXT,
  telegram TEXT,
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  county TEXT,
  postcode TEXT NOT NULL,
  shipping_method_id TEXT NOT NULL,
  shipping_method_label TEXT NOT NULL,
  shipping_estimate TEXT NOT NULL,
  shipping_fee REAL NOT NULL,
  subtotal REAL NOT NULL,
  total REAL NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('GBP', 'EUR', 'USD')),
  payment_method TEXT NOT NULL DEFAULT '待确认',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'paid', 'processing', 'shipped', 'completed', 'cancelled'))
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL,
  product_code TEXT NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  product_url TEXT NOT NULL,
  image_url TEXT,
  size TEXT NOT NULL,
  color TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price REAL NOT NULL,
  line_total REAL NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('GBP', 'EUR', 'USD')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_code ON order_items(product_code);
