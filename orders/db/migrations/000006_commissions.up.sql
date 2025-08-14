-- 1. Create commissions table
CREATE TABLE commissions (
    iid varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::varchar(36),
    referrer_id varchar(36) NOT NULL,                -- referrer user ID (no FK)
    referred_id varchar(36) NOT NULL,                -- the user who was referred
    order_number BIGINT NOT NULL REFERENCES orders(order_number),
    currency_code varchar(3) NOT NULL,
    commission_amount DECIMAL(18, 2) NOT NULL,
    paid_at timestamptz NULL,                     -- null until bulk payment
    payment_reference varchar(36) NULL REFERENCES payments(id),       -- shared for bulk payments
    created_at timestamptz DEFAULT now()
);

-- 2. Unique constraint to prevent duplicate commissions for same referrer/referred/order
ALTER TABLE commissions
ADD CONSTRAINT uq_commissions_referrer_referred_order UNIQUE (referrer_id, referred_id, order_number);
