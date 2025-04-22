ALTER TABLE orders 
ADD COLUMN secret_key VARCHAR(6),
ADD COLUMN product_owner VARCHAR(36),
ADD COLUMN payout_phone_number varchar(36);

CREATE TABLE payments (
    id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::varchar(36),
    order_number bigint NOT NULL REFERENCES orders(order_number) ON DELETE CASCADE,
    price_value bigint,
    price_currency varchar(3),
    status text,
    external_ref text,
    order_secret_key varchar(6)
);
 