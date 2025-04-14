-- 1. Add the column with a default
ALTER TABLE product
ADD COLUMN whole_sale boolean NOT NULL DEFAULT false;

-- 2. Update existing rows to have false explicitly
UPDATE product
SET whole_sale = false
WHERE whole_sale IS NULL;

CREATE TABLE product_names (
    name text PRIMARY KEY,
    slug text,
    category_id varchar(36) NOT NULL REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE price_types (
    id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::varchar(36),
    name text NOT NULL,
    slug text,
    category_id varchar(36) NOT NULL REFERENCES categories(id) ON DELETE CASCADE
)