-- Remove delivery fee columns from orders
ALTER TABLE orders
DROP COLUMN delivery_fee_amount,
DROP COLUMN delivery_fee_currency;