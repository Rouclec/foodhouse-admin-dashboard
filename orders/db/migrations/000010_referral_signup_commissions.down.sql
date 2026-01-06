-- Best-effort rollback: restore the FK from commissions.order_number to orders(order_number).
-- Note: this may fail if there are rows with order_number=0 (signup commissions).

ALTER TABLE commissions
ADD CONSTRAINT commissions_order_number_fkey
FOREIGN KEY (order_number) REFERENCES orders(order_number);


