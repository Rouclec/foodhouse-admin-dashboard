CREATE TABLE users (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::varchar(36),
  "role" varchar(24) NOT NULL,
  phone_number varchar(50) UNIQUE NOT NULL,
  email varchar(50) UNIQUE,
  first_name varchar(50),
  last_name varchar(50),
  residence_country_iso_code varchar(2) NOT NULL,
  "address" varchar(50),
  location_coordinates point,
  profile_image varchar(100),
  "password" varchar(255) NOT NULL,
  created_at timestamptz DEFAULT (now()),
  updated_at timestamptz DEFAULT (now())
);

CREATE TABLE refresh_tokens (
    token text PRIMARY KEY,
    user_id varchar(36) NOT NULL REFERENCES users(id),
    expires_at timestamp with time zone NOT NULL,
    revoked_at timestamp with time zone
);

CREATE TABLE sent_otps (
  request_id varchar(36) PRIMARY KEY DEFAULT (gen_random_uuid()::varchar(36)),
  factor varchar(36) NOT NULL,
  max_attempts int NOT NULL DEFAULT 5,
  number_of_attempts int NOT NULL DEFAULT 0,
  factor_type varchar NOT NULL DEFAULT 'FACTOR_TYPE_SMS_OTP',
  secret_value varchar(6) NOT NULL,
  created_at timestamptz DEFAULT (now()),
  updated_at timestamptz DEFAULT (now())
);

CREATE TABLE subscriptions (
    id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::varchar(36),
    title varchar(20) NOT NULL,
    "description" varchar(50) NOT NULL,
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

CREATE TABLE user_payment_methods (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::varchar(36),
  user_id varchar(36) NOT NULL REFERENCES users(id),
  method varchar NOT NULL,
  method_id varchar
);