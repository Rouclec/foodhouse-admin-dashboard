ALTER TABLE orders 
DROP COLUMN secret_key,
DROP COLUMN product_owner,
DROP COLUMN payout_phone_number;

DROP TABLE payments