-- Add agent_id to orders table to track which agent is assigned to delivery
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS agent_id varchar(36);

-- Add index for faster queries on agent_id
CREATE INDEX IF NOT EXISTS idx_orders_agent_id ON orders(agent_id);

-- Add agent_id to user subscriptions for location tracking
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS agent_id varchar(36);
