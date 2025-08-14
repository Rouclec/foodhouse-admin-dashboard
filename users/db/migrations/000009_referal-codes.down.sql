-- 1. Drop trigger for new users
DROP TRIGGER set_referral_code ON users;

-- 2. Drop trigger function
DROP FUNCTION set_referral_code_trigger();

-- 3. Drop helper functions
DROP FUNCTION generate_unique_referral_code();
DROP FUNCTION random_alphanum_5();

-- 4. Drop the referral_code column and unique constraint
ALTER TABLE users
DROP CONSTRAINT uq_users_referral_code;

ALTER TABLE users
DROP COLUMN referral_code;

-- Drop the referrals table
DROP TABLE referrals CASCADE;
