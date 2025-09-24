-- Step 1: Add the new column with a default value of false
ALTER TABLE products
ADD COLUMN is_approved BOOLEAN DEFAULT false;

-- Step 2: Update all existing products to set is_approved to true
UPDATE products
SET is_approved = true;