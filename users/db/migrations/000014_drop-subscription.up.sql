-- Drop dependent tables first (those with foreign keys referencing subscriptions)
drop table user_subscriptions;
drop table user_payment_methods;
-- Then drop the referenced table
drop table subscriptions;