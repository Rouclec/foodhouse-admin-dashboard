-- Ensure a user can rate an order only once
CREATE UNIQUE INDEX IF NOT EXISTS idx_delivery_ratings_order_user_unique
  ON delivery_ratings(order_number, user_id);

