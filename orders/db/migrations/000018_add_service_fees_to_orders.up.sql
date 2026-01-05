-- Add service fee columns to orders (flat fee charged by platform, excluded from farmer payout)
ALTER TABLE orders
ADD COLUMN service_fee_amount float NOT NULL DEFAULT 0,
ADD COLUMN service_fee_currency varchar(3) NOT NULL DEFAULT 'XAF';


