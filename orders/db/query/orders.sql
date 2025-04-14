-- name: CreateOrder :one
INSERT INTO orders (delivery_location, price_value, price_currency, status, product, created_by)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: UpdateOrderStatus :exec
UPDATE orders SET status = $2 WHERE order_number = $1;

-- name: GetOrderByOrderNumber :one
SELECT * FROM orders WHERE order_number = $1;

-- name: GetUserOrders :many
SELECT * FROM orders 
WHERE created_by = $1
AND 
  (sqlc.arg(created_before)::timestamptz = '0001-01-01 00:00:00+00'::timestamptz OR created_at < sqlc.arg(created_before)::timestamptz)
ORDER BY created_at DESC
LIMIT sqlc.arg(count)::int;

-- name: ReviewOrder :exec
UPDATE orders SET review = $1, rating = $2 WHERE order_number = $3;

-- name: CreateOrderAuditLog :exec
INSERT INTO orders_audit
    (
        order_number,
        event_timestamp,
        actor,
        action,
        reason,
        before,
        after
    )
VALUES ($1, $2, $3, $4, $5, $6, $7);