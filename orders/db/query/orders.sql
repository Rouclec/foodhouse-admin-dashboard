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
UPDATE orders
SET
  status = $2,
  updated_at = now(),
  dispatched_by = COALESCE($3, approved_by)
WHERE order_number = $1;


-- name: GetOrderByOrderNumber :one
SELECT * FROM orders WHERE order_number = $1;

-- name: GetUserOrderBySecretKey :one
SELECT * FROM orders WHERE secret_key = $1 AND created_by = $2;

-- name: ListUserOrders :many
SELECT * FROM orders 
WHERE created_by = $1 AND 
  (
    sqlc.arg(included_statuses)::TEXT[] IS NULL OR
    sqlc.arg(included_statuses)::TEXT[] = '{}'::TEXT[] OR
    status::TEXT = ANY(sqlc.arg(included_statuses))
  ) AND 
  (
    sqlc.arg(created_before)::timestamptz = '0001-01-01 00:00:00+00'::timestamptz 
    OR created_at < sqlc.arg(created_before)::timestamptz
  ) AND
  (
    sqlc.arg(search_key)::TEXT IS NULL OR order_number::TEXT ILIKE '%' || sqlc.arg(search_key) || '%'
  )
ORDER BY created_at DESC
LIMIT sqlc.arg(count)::int;

-- name: ListFarmerOrders :many
SELECT * 
FROM orders 
WHERE product_owner = $1 AND 
  (
        sqlc.arg(included_statuses)::TEXT[] IS NULL OR
        sqlc.arg(included_statuses)::TEXT[] = '{}'::TEXT[] OR
        status::TEXT  = ANY(sqlc.arg(included_statuses))
  ) AND 
  (
    sqlc.arg(created_before)::timestamptz = '0001-01-01 00:00:00+00'::timestamptz 
    OR created_at < sqlc.arg(created_before)::timestamptz
  )
  AND
  (
    sqlc.arg(search_key)::TEXT IS NULL OR order_number::TEXT ILIKE '%' || sqlc.arg(search_key) || '%'
  )
ORDER BY created_at DESC
LIMIT sqlc.arg(count)::int;

-- name: ListOrders :many
SELECT * FROM orders 
WHERE 
  (
    sqlc.arg(included_statuses)::TEXT[] IS NULL OR
    sqlc.arg(included_statuses)::TEXT[] = '{}'::TEXT[] OR
    status::TEXT = ANY(sqlc.arg(included_statuses))
  ) AND 
  (
    sqlc.arg(created_before)::timestamptz = '0001-01-01 00:00:00+00'::timestamptz 
    OR created_at < sqlc.arg(created_before)::timestamptz
  ) AND
  (
    sqlc.arg(search_key)::TEXT IS NULL 
    OR order_number::TEXT ILIKE '%' || sqlc.arg(search_key) || '%'
  )
ORDER BY created_at DESC
LIMIT sqlc.arg(count)::int;

-- name: ReviewOrder :exec
UPDATE orders SET review = $1, rating = $2, updated_at = now() WHERE order_number = $3;

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

-- name: GetPaymentByEntity :one
SELECT * from payments WHERE payment_entity = $1 AND entity_id = $2;

-- name: UpdatePaymentStatus :exec
UPDATE payments SET status = $2, updated_at = now() WHERE id = $1;

-- name: GetOrdersGroupedByDay :many
SELECT 
  DATE_TRUNC('day', updated_at)::timestamptz AS group_date,
  JSON_AGG(JSON_BUILD_OBJECT(
    'product_id', product,
    'quantity', quantity
  )) AS products
FROM orders
WHERE product_owner = $1
  AND status = $2
  AND updated_at BETWEEN $3 AND $4
GROUP BY group_date
ORDER BY group_date;

-- name: GetOrdersGroupedByMonth :many
SELECT 
  DATE_TRUNC('month', updated_at)::timestamptz AS group_date,
  JSON_AGG(JSON_BUILD_OBJECT(
    'product_id', product,
    'quantity', quantity
  )) AS products
FROM orders
WHERE product_owner = $1
  AND status = $2
  AND updated_at BETWEEN $3 AND $4
GROUP BY group_date
ORDER BY group_date;

-- name: GetOrdersGroupedByYear :many
SELECT 
  DATE_TRUNC('year', updated_at)::timestamptz AS group_date,
  JSON_AGG(JSON_BUILD_OBJECT(
    'product_id', product,
    'quantity', quantity
  )) AS products
FROM orders
WHERE product_owner = $1
  AND status = $2
  AND updated_at BETWEEN $3 AND $4
GROUP BY group_date
ORDER BY group_date;

-- name: GetOrderStatsBetweenDates :one
SELECT 
  COUNT(*) AS total_orders
FROM orders
WHERE status = ANY(sqlc.arg(included_statuses)::TEXT[])
  AND created_at >= sqlc.arg(start_date)::timestamptz
  AND created_at <= sqlc.arg(end_date)::timestamptz;

-- name: GetPaymentStatsBetweenDates :one
SELECT 
  COALESCE(SUM(amount_value), 0)::float AS total_value
FROM payments
WHERE status = 'PaymentStatus_COMPLETED'
  AND created_at >= sqlc.arg(start_date)::timestamptz
  AND created_at <= sqlc.arg(end_date)::timestamptz;


-- name: ListPayments :many
SELECT * FROM payments 
WHERE 
  (
    sqlc.arg(created_before)::timestamptz = '0001-01-01 00:00:00+00'::timestamptz 
    OR created_at < sqlc.arg(created_before)::timestamptz
  ) AND
  (
    sqlc.arg(search_key)::TEXT IS NULL OR external_ref ILIKE '%' || sqlc.arg(search_key) || '%'
  )
ORDER BY created_at DESC
LIMIT sqlc.arg(count)::int;