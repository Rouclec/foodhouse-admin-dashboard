ALTER TABLE payments
  DROP COLUMN order_number,
  DROP COLUMN price_value,
  DROP COLUMN price_currency,
  DROP COLUMN external_ref,
  DROP COLUMN order_secret_key,
  ADD COLUMN payment_entity varchar(255) NOT NULL,
  ADD COLUMN entity_id varchar(255) NOT NULL,
  ADD COLUMN amount_value float,
  ADD COLUMN amount_currency varchar(3),
  ADD COLUMN created_by varchar(255) NOT NULL,
  ADD COLUMN expires_at timestamptz,
  ADD COLUMN created_at timestamptz DEFAULT now(),
  ADD COLUMN updated_at timestamptz DEFAULT now(),
  ADD COLUMN method text,
  ADD COLUMN account_number text;

ALTER TABLE orders
  ADD COLUMN delivery_address text,
  ADD COLUMN quantity bigint,
  ALTER COLUMN price_value TYPE float; 