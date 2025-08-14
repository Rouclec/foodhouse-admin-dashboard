-- 1. Add the new column (nullable for now so we can backfill)
ALTER TABLE payments
ADD COLUMN type VARCHAR(50);

-- 2. Backfill with "PaymentType_CREDIT" for existing records
UPDATE payments
SET type = 'PaymentType_CREDIT'
WHERE type IS NULL;

-- 3. Make the column NOT NULL
ALTER TABLE payments
ALTER COLUMN type SET NOT NULL;