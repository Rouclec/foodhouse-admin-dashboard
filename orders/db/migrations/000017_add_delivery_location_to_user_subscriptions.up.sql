-- Add delivery location + address to user_subscriptions so subscription-generated
-- orders can inherit the chosen delivery location.
ALTER TABLE user_subscriptions
ADD COLUMN delivery_location Point,
ADD COLUMN delivery_address text NOT NULL DEFAULT '';


