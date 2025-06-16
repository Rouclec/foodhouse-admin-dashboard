-- Add the new user_status column with a default value
ALTER TABLE users
ADD COLUMN user_status TEXT;

-- Set default value for all existing users
UPDATE users
SET user_status = 'UserStatus_ACTIVE';

-- Enforce non-null constraint after setting the value
ALTER TABLE users
ALTER COLUMN user_status SET NOT NULL;
