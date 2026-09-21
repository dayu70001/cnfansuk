-- Add explicit checkout/payment states and a session key for idempotent order creation.
-- SQLite cannot alter a CHECK constraint in place, so rebuild only the orders
-- table while preserving every existing order and order item.
PRAGMA foreign_keys=OFF;

CREATE TABLE orders_checkout_new (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  checkout_session_id TEXT,
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
  payment_fee REAL NOT NULL DEFAULT 0,
  payment_fee_rate REAL NOT NULL DEFAULT 0,
  final_total REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'awaiting_payment', 'payment_submitted', 'payment_confirmed', 'confirmed', 'paid', 'processing', 'shipped', 'completed', 'cancelled'))
);

INSERT INTO orders_checkout_new (
  id, order_number, created_at, updated_at, customer_name, email, phone,
  preferred_contact, whatsapp, telegram, country_code, country_name,
  address_line1, address_line2, city, county, postcode, shipping_method_id,
  shipping_method_label, shipping_estimate, shipping_fee, subtotal, total,
  currency, payment_method, payment_fee, payment_fee_rate, final_total, status
)
SELECT
  id, order_number, created_at, updated_at, customer_name, email, phone,
  preferred_contact, whatsapp, telegram, country_code, country_name,
  address_line1, address_line2, city, county, postcode, shipping_method_id,
  shipping_method_label, shipping_estimate, shipping_fee, subtotal, total,
  currency, payment_method, payment_fee, payment_fee_rate, final_total, status
FROM orders;

DROP TABLE orders;
ALTER TABLE orders_checkout_new RENAME TO orders;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_checkout_session_id
  ON orders(checkout_session_id)
  WHERE checkout_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

PRAGMA foreign_keys=ON;
