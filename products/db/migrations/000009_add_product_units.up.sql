-- Migration: Add product_units table for multiple prices per product
-- This allows farmers to specify different unit types (e.g., per bucket, per cup) for the same product

-- Create product_units table
CREATE TABLE IF NOT EXISTS product_units (
    id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::varchar(36),
    product_id varchar(36) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    unit_type text NOT NULL,
    value bigint NOT NULL,
    currency_iso_code varchar(3) NOT NULL DEFAULT 'XAF',
    created_by varchar(36),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(product_id, unit_type)
);

-- Index for faster lookups by product
CREATE INDEX IF NOT EXISTS idx_product_units_product_id ON product_units(product_id);

-- Create price_types table (for predefined unit types)
CREATE TABLE IF NOT EXISTS price_types (
    id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::varchar(36),
    name text NOT NULL,
    slug text NOT NULL,
    category_id varchar(36) REFERENCES categories(id) ON DELETE SET NULL,
    delivery_fee_amount bigint,
    delivery_fee_currency varchar(3),
    created_at timestamptz DEFAULT now(),
    UNIQUE(category_id, slug)
);

-- Index for price_types lookups
CREATE INDEX IF NOT EXISTS idx_price_types_category_id ON price_types(category_id);

-- Function to get default product price (for backward compatibility)
-- Returns the product's direct price if no units exist, or the first unit price
CREATE OR REPLACE FUNCTION get_product_price(p_product_id varchar(36))
RETURNS TABLE(value bigint, currency_iso_code varchar(3), unit_type text) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(pu.value, p.value) as value,
        COALESCE(pu.currency_iso_code, p.currency_iso_code) as currency_iso_code,
        COALESCE(pu.unit_type, p.unit_type) as unit_type
    FROM products p
    LEFT JOIN product_units pu ON pu.product_id = p.id
    WHERE p.id = p_product_id
    ORDER BY pu.created_at ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- View to get product with its primary unit price (for backward compatibility with existing queries)
CREATE OR REPLACE VIEW products_with_price AS
SELECT 
    p.*,
    COALESCE(pu.value, p.value) as price_value,
    COALESCE(pu.currency_iso_code, p.currency_iso_code) as price_currency,
    COALESCE(pu.unit_type, p.unit_type) as price_unit_type
FROM products p
LEFT JOIN LATERAL (
    SELECT value, currency_iso_code, unit_type
    FROM product_units
    WHERE product_id = p.id
    ORDER BY created_at ASC
    LIMIT 1
) pu ON true;
