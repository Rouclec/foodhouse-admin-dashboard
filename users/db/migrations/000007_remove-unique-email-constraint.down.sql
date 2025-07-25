-- Drop the partial unique index
DROP INDEX IF EXISTS users_email_unique_idx;

-- Re-add the original unique constraint (non-partial)
ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);