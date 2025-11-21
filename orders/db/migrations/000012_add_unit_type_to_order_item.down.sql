-- 1. Remove unit_type column
ALTER TABLE order_items
DROP COLUMN unit_type;

-- 2. Rename table back
ALTER TABLE order_items RENAME TO order_item;