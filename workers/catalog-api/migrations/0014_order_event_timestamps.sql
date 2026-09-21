-- Record the customer/admin events used to derive the simplified order stage.
-- Nullable fields preserve all existing orders and legacy status values.
ALTER TABLE orders ADD COLUMN payment_page_viewed_at TEXT;
ALTER TABLE orders ADD COLUMN transfer_submitted_at TEXT;
ALTER TABLE orders ADD COLUMN whatsapp_clicked_at TEXT;
ALTER TABLE orders ADD COLUMN payment_confirmed_at TEXT;
