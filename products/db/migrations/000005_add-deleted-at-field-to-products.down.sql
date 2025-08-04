-- Remove the deleted_at column
ALTER TABLE products
DROP COLUMN deleted_at;

-- Rename the table back to product
ALTER TABLE products
RENAME TO product;