-- Make category_id nullable
ALTER TABLE product
  ALTER COLUMN category_id DROP NOT NULL;

ALTER TABLE product_names
  ALTER COLUMN category_id DROP NOT NULL;

ALTER TABLE price_types
  ALTER COLUMN category_id DROP NOT NULL;

-- Drop existing foreign keys
ALTER TABLE product
  DROP CONSTRAINT product_category_id_fkey;

ALTER TABLE product_names
  DROP CONSTRAINT product_names_category_id_fkey;

ALTER TABLE price_types
  DROP CONSTRAINT price_types_category_id_fkey;

-- Add new foreign keys with ON DELETE SET NULL
ALTER TABLE product
  ADD CONSTRAINT product_category_id_fkey
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

ALTER TABLE product_names
  ADD CONSTRAINT product_names_category_id_fkey
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

ALTER TABLE price_types
  ADD CONSTRAINT price_types_category_id_fkey
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;
