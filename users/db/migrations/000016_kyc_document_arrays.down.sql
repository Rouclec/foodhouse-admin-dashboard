-- Rollback migration: revert KYC documents to single-url columns

ALTER TABLE kyc_verifications
ADD COLUMN identity_document_url TEXT,
ADD COLUMN selfie_url TEXT,
ADD COLUMN vehicle_document_url TEXT;

UPDATE kyc_verifications
SET
  identity_document_url = COALESCE(identity_document_urls[1], ''),
  selfie_url = COALESCE(selfie_urls[1], ''),
  vehicle_document_url = COALESCE(vehicle_document_urls[1], '');

ALTER TABLE kyc_verifications
DROP COLUMN identity_document_urls,
DROP COLUMN selfie_urls,
DROP COLUMN vehicle_document_urls;

