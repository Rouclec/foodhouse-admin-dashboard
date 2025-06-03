-- name: CreateOrder :one
INSERT INTO orders (
    delivery_location, 
    price_value, 
    price_currency, 
    status, 
    product, 
    created_by, 
    secret_key, 
    product_owner,
    payout_phone_number,
    rating, 
    review,
    delivery_address,
    quantity
)
VALUES (
    sqlc.arg(delivery_location)::point,    -- Enforcing as POINT (casting delivery_location)
    sqlc.arg(price_value)::float,         -- Enforcing as BIGINT
    sqlc.arg(price_currency)::varchar(3),  -- Enforcing as VARCHAR(3)
    sqlc.arg(status)::text,                -- Enforcing as TEXT
    sqlc.arg(product)::text,               -- Enforcing as TEXT
    sqlc.arg(created_by)::varchar(36),     -- Enforcing as VARCHAR(36)
    sqlc.arg(secret_key)::varchar(6),      -- Enforcing as VARCHAR(6)
    sqlc.arg(product_owner)::varchar(36),   -- Enforcing as VARCHAR(36)
    sqlc.arg(payout_phone_number)::varchar(36), 
    1, -- Default rating
    '', -- Default review
    sqlc.arg(delivery_address)::text,
    sqlc.arg(quantity)::bigint
)
RETURNING *;

-- name: UpdateOrderStatus :exec
UPDATE orders SET status = $2 WHERE order_number = $1;

-- name: GetOrderByOrderNumber :one
SELECT * FROM orders WHERE order_number = $1;

-- name: GetUserOrderBySecretKey :one
SELECT * FROM orders WHERE secret_key = $1 AND created_by = $2;

-- name: ListUserOrders :many
SELECT * FROM orders 
WHERE created_by = $1
AND (sqlc.arg(status)::varchar = '' OR status = sqlc.arg(status)::varchar)
AND 
  (sqlc.arg(created_before)::timestamptz = '0001-01-01 00:00:00+00'::timestamptz OR created_at < sqlc.arg(created_before)::timestamptz)
ORDER BY created_at DESC
LIMIT sqlc.arg(count)::int;

-- name: ListFarmerOrders :many
SELECT * 
FROM orders 
WHERE product_owner = $1
  AND (sqlc.arg(status)::varchar = '' OR status = sqlc.arg(status)::varchar)
  AND (
    sqlc.arg(created_before)::timestamptz = '0001-01-01 00:00:00+00'::timestamptz 
    OR created_at < sqlc.arg(created_before)::timestamptz
  )
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

-- name: ListOrderAuditLogs :many
SELECT * from orders_audit WHERE order_number = $1;

-- name: CreatePayment :one
INSERT INTO payments (payment_entity, entity_id, amount_value, amount_currency, status, created_by, expires_at, method, account_number)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING *;

-- name: GetPaymentById :one
SELECT * from payments WHERE id = $1
LIMIT 1;

-- name: UpdatePaymentStatus :exec
UPDATE payments SET status = $2 WHERE id = $1;
