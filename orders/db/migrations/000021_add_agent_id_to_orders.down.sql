-- Remove agent_id from orders table
ALTER TABLE orders
DROP COLUMN IF EXISTS agent_id;

-- Remove index
DROP INDEX IF EXISTS idx_orders_agent_id;

-- Remove agent_id from user_subscriptions
ALTER TABLE user_subscriptions
DROP COLUMN IF EXISTS agent_id;
