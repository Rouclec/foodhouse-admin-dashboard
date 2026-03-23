-- Rollback migration: Remove product_units table
DROP TABLE product_units CASCADE;
DROP TABLE price_types CASCADE;
DROP FUNCTION get_product_price(varchar(36));
DROP VIEW products_with_price;
