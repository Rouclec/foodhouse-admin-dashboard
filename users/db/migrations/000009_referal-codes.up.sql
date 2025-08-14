-- 1. Add referral_code column (nullable for now)
ALTER TABLE users
ADD COLUMN referral_code VARCHAR(20);

-- 2. Function to generate a random 5-character alphanumeric string
CREATE OR REPLACE FUNCTION random_alphanum_5()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    result TEXT := '';
    i INT;
BEGIN
    FOR i IN 1..5 LOOP
        result := result || substr(chars, (floor(random() * 36)::int) + 1, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- 3. Function to generate referral code, retry if collision occurs
CREATE OR REPLACE FUNCTION generate_unique_referral_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
BEGIN
    LOOP
        code := 'FH' || random_alphanum_5();
        -- Check uniqueness
        IF NOT EXISTS (SELECT 1 FROM users WHERE referral_code = code) THEN
            RETURN code;
        END IF;
        -- Else loop and try again
    END LOOP;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- 4. Trigger function for new users
CREATE OR REPLACE FUNCTION set_referral_code_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.referral_code IS NULL THEN
        NEW.referral_code := generate_unique_referral_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger for new users
CREATE TRIGGER set_referral_code
BEFORE INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION set_referral_code_trigger();

-- 6. Backfill existing users
UPDATE users
SET referral_code = generate_unique_referral_code()
WHERE referral_code IS NULL;

-- 7. Make referral_code NOT NULL and unique
ALTER TABLE users
ALTER COLUMN referral_code SET NOT NULL;

ALTER TABLE users
ADD CONSTRAINT uq_users_referral_code UNIQUE (referral_code);


CREATE TABLE referrals (
    id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::varchar(36),
    referrer_id varchar(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_id varchar(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT (now()),
    UNIQUE(referrer_id, referred_id)
);