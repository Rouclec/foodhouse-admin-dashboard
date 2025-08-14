-- Revert commission_amount back to DECIMAL(18,2)
ALTER TABLE commissions
ALTER COLUMN commission_amount TYPE DECIMAL(18,2) USING commission_amount::DECIMAL(18,2);