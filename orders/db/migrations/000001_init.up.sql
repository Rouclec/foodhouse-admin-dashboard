CREATE TABLE orders (
    order_number bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    delivery_location Point,
    price_value bigint,
    price_currency varchar(3),
    status text,
    rating numeric CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
    review text,
    product varchar(36),
    created_by varchar(36),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE orders_audit (
    id SERIAL PRIMARY KEY,
    event_timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    order_number bigint NOT NULL,
    actor VARCHAR NOT NULL,
    action VARCHAR NOT NULL,
    reason TEXT NOT NULL,
    before JSONB,
    after JSONB,
    FOREIGN KEY (order_number) REFERENCES orders(order_number)
)