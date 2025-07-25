-- Drop the existing unique constraint
ALTER TABLE users DROP CONSTRAINT users_email_key;

-- Create a partial unique index: unique only when email IS NOT NULL
CREATE UNIQUE INDEX users_email_unique_idx ON users (email) WHERE email IS NOT NULL;