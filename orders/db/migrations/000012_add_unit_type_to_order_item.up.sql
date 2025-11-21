-- 1. Rename table
ALTER TABLE order_item RENAME TO order_items;

-- 2. Add unit_type column
ALTER TABLE order_items
ADD COLUMN unit_type TEXT;