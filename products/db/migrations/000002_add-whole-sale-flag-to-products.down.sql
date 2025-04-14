-- Drop table price_type
DROP TABLE price_types;

-- Drop table product_names
DROP TABLE product_names;

-- Remove the 'whole_sale' column from the 'product' table
ALTER TABLE product
DROP COLUMN whole_sale;