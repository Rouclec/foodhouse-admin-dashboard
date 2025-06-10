CREATE table farmers_reviews (
    id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::varchar(36),
    farmer_id varchar(36) NOT NULL REFERENCES users(id),
    order_id text NOT NULL,
    product_id text NOT NULL,
    rating float NOT NULL DEFAULT 1,
    comment text NOT NULL,
    created_at timestamptz DEFAULT (now()),
    created_by varchar(36) REFERENCES users(id) ON DELETE SET NULL
);