-- Speed up agent dashboard stats and agent order lookups
CREATE INDEX IF NOT EXISTS idx_orders_status_agent_id ON orders(status, agent_id);

