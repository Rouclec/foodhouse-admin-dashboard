-- Set default flat service fee for new orders
ALTER TABLE orders
ALTER COLUMN service_fee_amount SET DEFAULT 100,
ALTER COLUMN service_fee_currency SET DEFAULT 'XAF';


