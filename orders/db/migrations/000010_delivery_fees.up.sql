-- Add delivery fee columns to orders
ALTER TABLE orders
ADD COLUMN delivery_fee_amount float,
ADD COLUMN delivery_fee_currency varchar(3);