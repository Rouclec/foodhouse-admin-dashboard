-- Add delivery fee columns to price_types
ALTER TABLE price_types
ADD COLUMN delivery_fee_amount float,
ADD COLUMN delivery_fee_currency varchar(3);

-- Add delivery fee columns to products
ALTER TABLE products
ADD COLUMN delivery_fee_amount float,
ADD COLUMN delivery_fee_currency varchar(3);