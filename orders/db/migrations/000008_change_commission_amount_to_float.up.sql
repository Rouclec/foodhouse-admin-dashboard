-- Change commission_amount to float
ALTER TABLE commissions
ALTER COLUMN commission_amount TYPE float USING commission_amount::float;