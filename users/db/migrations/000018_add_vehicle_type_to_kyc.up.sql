-- Migration: 000018_add_vehicle_type_to_kyc
-- Add vehicle_type field to kyc_verifications table for delivery agents

ALTER TABLE kyc_verifications 
ADD COLUMN vehicle_type VARCHAR(50);

-- Update existing records to have a default value
UPDATE kyc_verifications 
SET vehicle_type = 'VEHICLE_TYPE_UNSPECIFIED' 
WHERE vehicle_type IS NULL;

-- Make the column NOT NULL after setting defaults
ALTER TABLE kyc_verifications 
ALTER COLUMN vehicle_type SET NOT NULL;