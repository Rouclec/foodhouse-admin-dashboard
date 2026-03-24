-- Migration: store KYC documents as arrays

ALTER TABLE kyc_verifications
ADD COLUMN identity_document_urls TEXT[] NOT NULL DEFAULT '{}'::text[],
ADD COLUMN selfie_urls TEXT[] NOT NULL DEFAULT '{}'::text[],
ADD COLUMN vehicle_document_urls TEXT[] NOT NULL DEFAULT '{}'::text[];

-- Backfill from legacy single-url columns
UPDATE kyc_verifications
SET
  identity_document_urls = CASE
    WHEN identity_document_url IS NULL OR identity_document_url = '' THEN '{}'::text[]
    ELSE ARRAY[identity_document_url]
  END,
  selfie_urls = CASE
    WHEN selfie_url IS NULL OR selfie_url = '' THEN '{}'::text[]
    ELSE ARRAY[selfie_url]
  END,
  vehicle_document_urls = CASE
    WHEN vehicle_document_url IS NULL OR vehicle_document_url = '' THEN '{}'::text[]
    ELSE ARRAY[vehicle_document_url]
  END;

ALTER TABLE kyc_verifications
DROP COLUMN identity_document_url,
DROP COLUMN selfie_url,
DROP COLUMN vehicle_document_url;

