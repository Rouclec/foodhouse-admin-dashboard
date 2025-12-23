-- Add order_index to subscription_items to support grouping items into multiple orders
ALTER TABLE subscription_items
ADD COLUMN order_index INTEGER NOT NULL DEFAULT 0;

-- Add comment explaining order_index
COMMENT ON COLUMN subscription_items.order_index IS 'Index indicating which order (delivery) this item belongs to. 0 = first order, 1 = second order, etc.';

