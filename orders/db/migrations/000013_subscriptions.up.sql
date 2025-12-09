CREATE TABLE subscriptions (
    id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::varchar(36),
    title varchar(20) NOT NULL,
    "description" TEXT NOT NULL,
    duration interval NOT NULL,
    amount bigint NOT NULL,
    currency_iso_code varchar(3) NOT NULL,
    created_at timestamptz DEFAULT (now()),
    updated_at timestamptz DEFAULT (now())
);

CREATE TABLE subscription_items (
    id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::varchar(36),
    subscription_id varchar(36) NOT NULL REFERENCES subscriptions(id),
    product varchar(36) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_type TEXT
);

CREATE TABLE user_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    public_id TEXT GENERATED ALWAYS AS ('sub-' || id) STORED,
    user_id varchar(36) NOT NULL,
    subscription_id varchar(36) NOT NULL,
    active boolean NOT NULL default false,
    created_at timestamptz DEFAULT (now()),
    updated_at timestamptz DEFAULT (now()),
    expires_at timestamptz DEFAULT NULL,
    progress float default 0,
    amount bigint NOT NULL,
    currency_iso_code varchar(3) NOT NULL
);

ALTER TABLE orders 
ADD COLUMN user_subscription_id BIGSERIAL default NULL,
ADD COLUMN expected_delivery_date timestamptz default NULL;