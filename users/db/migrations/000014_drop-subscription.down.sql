CREATE TABLE subscriptions (
    id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::varchar(36),
    title varchar(20) NOT NULL,
    "description" TEXT NOT NULL,
    duration interval NOT NULL,
    amount bigint NOT NULL,
    currency_iso_code varchar(3) NOT NULL
);

CREATE TABLE user_subscriptions (
    id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::varchar(36),
    user_id varchar(36) NOT NULL REFERENCES users(id),
    subscription_id varchar(36) NOT NULL REFERENCES subscriptions(id),
    active boolean NOT NULL default false,
    created_at timestamptz DEFAULT (now()),
    updated_at timestamptz DEFAULT (now()),
    expires_at timestamptz NOT NULL
);

CREATE TABLE user_payment_methods (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::varchar(36),
  user_id varchar(36) NOT NULL REFERENCES users(id),
  method varchar NOT NULL,
  method_id varchar
);