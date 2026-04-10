ALTER TABLE orders
ADD COLUMN IF NOT EXISTS pickup_location Point;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS pickup_address text;

