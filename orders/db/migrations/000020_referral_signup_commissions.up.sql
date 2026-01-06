-- Allow commissions that are not tied to a real order (e.g. referral signup commissions).
-- We keep order_number NOT NULL for backward compatibility with existing code/protos,
-- but drop the foreign key so order_number=0 can be used as a sentinel.

ALTER TABLE commissions
DROP CONSTRAINT IF EXISTS commissions_order_number_fkey;


