ALTER TABLE products ADD COLUMN price_eur REAL;
ALTER TABLE products ADD COLUMN price_usd REAL;

UPDATE products
SET
  price_eur = ROUND(price_gbp * 9.0 / 8.0),
  price_usd = ROUND(price_gbp * 9.0 / 7.0)
WHERE price_eur IS NULL OR price_usd IS NULL;
