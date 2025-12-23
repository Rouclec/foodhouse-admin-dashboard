ALTER TABLE user_subscriptions
DROP COLUMN IF EXISTS daily_delivery_limit;

ALTER TABLE user_subscriptions
DROP COLUMN IF EXISTS is_custom;

ALTER TABLE user_subscriptions
DROP COLUMN IF EXISTS estimated_delivery_time;

