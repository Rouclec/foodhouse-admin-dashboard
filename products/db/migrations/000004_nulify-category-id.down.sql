-- Drop foreign keys with ON DELETE SET NULL
ALTER TABLE product
  DROP CONSTRAINT product_category_id_fkey;

ALTER TABLE product_names
  DROP CONSTRAINT product_names_category_id_fkey;

ALTER TABLE price_types
  DROP CONSTRAINT price_types_category_id_fkey;

-- Add foreign keys with ON DELETE CASCADE
ALTER TABLE product
  ADD CONSTRAINT product_category_id_fkey
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;

ALTER TABLE product_names
  ADD CONSTRAINT product_names_category_id_fkey
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;

ALTER TABLE price_types
  ADD CONSTRAINT price_types_category_id_fkey
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;

-- Make category_id NOT NULL
ALTER TABLE product
  ALTER COLUMN category_id SET NOT NULL;

ALTER TABLE product_names
  ALTER COLUMN category_id SET NOT NULL;

ALTER TABLE price_types
  ALTER COLUMN category_id SET NOT NULL;
