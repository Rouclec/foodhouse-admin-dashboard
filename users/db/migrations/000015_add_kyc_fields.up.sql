-- Migration: Create KYC table for agent verification

CREATE TABLE kyc_verifications (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::varchar(36),
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    identity_document_url TEXT,
    selfie_url TEXT,
    vehicle_document_url TEXT,
    status VARCHAR(20) DEFAULT 'KYC_STATUS_PENDING',
    rejection_reason TEXT,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

CREATE INDEX idx_kyc_user_id ON kyc_verifications(user_id);
