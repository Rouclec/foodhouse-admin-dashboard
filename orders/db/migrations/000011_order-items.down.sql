-- 1. Add back the columns
ALTER TABLE orders
ADD COLUMN product varchar(36),
ADD COLUMN quantity bigint;

-- 2. Restore product & quantity from the first order_item per order
UPDATE orders o
SET product = oi.product,
    quantity = oi.quantity
FROM (
    SELECT DISTINCT ON (order_number)
           order_number, product, quantity
    FROM order_item
    ORDER BY order_number, id  -- chooses the first item for each order
) oi
WHERE o.order_number = oi.order_number;

-- 3. Drop order_item table
DROP TABLE order_item;