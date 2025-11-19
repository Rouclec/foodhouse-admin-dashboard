-- 1. Create new table
CREATE TABLE order_item (
    id SERIAL PRIMARY KEY,
    order_number INTEGER NOT NULL,
    product TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    FOREIGN KEY (order_number) REFERENCES orders(order_number)
);

-- 2. Move old data into order_item
INSERT INTO order_item (order_number, product, quantity)
SELECT order_number, product, quantity
FROM orders;

-- 3. Drop old columns
ALTER TABLE orders
DROP COLUMN product,
DROP COLUMN quantity;