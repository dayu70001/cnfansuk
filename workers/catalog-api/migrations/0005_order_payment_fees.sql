ALTER TABLE orders ADD COLUMN payment_fee REAL NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN payment_fee_rate REAL NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN final_total REAL NOT NULL DEFAULT 0;

UPDATE orders SET final_total = total WHERE final_total = 0;
