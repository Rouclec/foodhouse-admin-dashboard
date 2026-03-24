-- Speed up agent dashboard stats and agent order lookups
CREATE INDEX idx_orders_status_agent_id ON orders(status, agent_id);

