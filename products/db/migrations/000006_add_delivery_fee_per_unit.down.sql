-- Remove delivery fee columns from price_types
ALTER TABLE price_types
DROP COLUMN delivery_fee_amount,
DROP COLUMN delivery_fee_currency;

-- Remove delivery fee columns from products
ALTER TABLE products
DROP COLUMN delivery_fee_amount,
DROP COLUMN delivery_fee_currency;