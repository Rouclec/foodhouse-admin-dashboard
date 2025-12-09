CREATE TABLE subscriptions (
    id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::varchar(36),
    title varchar(20) NOT NULL,
    "description" TYPE TEXT NOT NULL,
    duration interval NOT NULL,
    amount bigint NOT NULL,
    currency_iso_code varchar(3) NOT NULL
);

CREATE TABLE subscription_items (
    id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::varchar(36),
    subscription_id varchar(36) NOT NULL REFERENCES subscriptions(id),
    product varchar(36) NOT NULL,
    quantity INTEGER NOT NULL,
    COLUMN unit_type TEXT
)

CREATE TABLE user_subscriptions (
    id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::varchar(36),
    user_id varchar(36) NOT NULL,
    subscription_id varchar(36) NOT NULL,
    active boolean NOT NULL default false,
    created_at timestamptz DEFAULT (now()),
    updated_at timestamptz DEFAULT (now()),
    expires_at timestamptz NOT NULL,
    progress float default 0
);

UPDATE TABLE orders 
DROP COLUMN user_subscription_id,
DROP COLUMN expected_delivery_date;

DROP TABLE user_subscriptions;

DROP TABLE subscription_items;

DROP TABLE subscriptions;