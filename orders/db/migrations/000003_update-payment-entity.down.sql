ALTER TABLE payments
  ADD COLUMN order_number bigint REFERENCES orders(order_number) ON DELETE CASCADE,
  ADD COLUMN price_value bigint,
  ADD COLUMN price_currency varchar(3),
  ADD COLUMN external_ref text,
  ADD COLUMN order_secret_key varchar(6),
  DROP COLUMN payment_entity,
  DROP COLUMN entity_id,
  DROP COLUMN amount_value,
  DROP COLUMN amount_currency,
  DROP COLUMN created_by,
  DROP COLUMN expires_at,
  DROP COLUMN created_at,
  DROP COLUMN updated_at,
  DROP COLUMN method,
  DROP COLUMN account_number;

ALTER TABLE orders
  DROP COLUMN delivery_address text,
  DROP COLUMN quantity bigint,
  ALTER COLUMN price_value TYPE bigint; 