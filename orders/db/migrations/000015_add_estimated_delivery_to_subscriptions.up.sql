-- Add estimated_delivery_time to subscriptions table
ALTER TABLE subscriptions
ADD COLUMN estimated_delivery_time interval;

