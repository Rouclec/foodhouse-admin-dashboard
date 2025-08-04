-- Rename the product table to products
ALTER TABLE product
RENAME TO products;

ALTER TABLE products
ADD COLUMN deleted_at timestamptz DEFAULT null;