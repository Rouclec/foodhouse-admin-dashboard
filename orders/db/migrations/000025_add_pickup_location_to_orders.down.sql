ALTER TABLE orders
DROP COLUMN IF EXISTS pickup_address;

ALTER TABLE orders
DROP COLUMN IF EXISTS pickup_location;

