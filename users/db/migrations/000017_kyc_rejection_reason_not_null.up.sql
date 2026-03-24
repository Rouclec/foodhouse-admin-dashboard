-- Migration: ensure rejection_reason is non-null

UPDATE kyc_verifications
SET rejection_reason = ''
WHERE rejection_reason IS NULL;

ALTER TABLE kyc_verifications
ALTER COLUMN rejection_reason SET DEFAULT '',
ALTER COLUMN rejection_reason SET NOT NULL;

