-- Add estimated_delivery_time to user_subscriptions
ALTER TABLE user_subscriptions
ADD COLUMN estimated_delivery_time interval;

-- Add is_custom flag to distinguish custom subscriptions from plan-based subscriptions
ALTER TABLE user_subscriptions
ADD COLUMN is_custom boolean NOT NULL DEFAULT false;

-- Add daily_delivery_limit for custom subscriptions (in cents/amount)
ALTER TABLE user_subscriptions
ADD COLUMN daily_delivery_limit bigint;

