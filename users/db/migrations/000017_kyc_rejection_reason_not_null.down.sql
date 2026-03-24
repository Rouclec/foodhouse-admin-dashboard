-- Rollback migration: allow rejection_reason to be null again

ALTER TABLE kyc_verifications
ALTER COLUMN rejection_reason DROP NOT NULL,
ALTER COLUMN rejection_reason DROP DEFAULT;

