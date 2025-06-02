CREATE TABLE payments (
    id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::varchar(36),
    external_ref varchar NOT NULL,
    amount bigint NOT NULL,
    "status" varchar NOT NULL DEFAULT 'PAYMENT_STATUS_CREATED',
    currency_iso_code varchar(3) NOT NULL,
    method varchar NOT NULL,
    created_at timestamptz DEFAULT (now()),
    updated_at timestamptz DEFAULT (now())
);

ALTER TABLE subscriptions
    ALTER COLUMN amount TYPE bigint