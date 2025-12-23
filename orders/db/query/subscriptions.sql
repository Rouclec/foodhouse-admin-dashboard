-- name: CreateSubscription :one
INSERT INTO subscriptions (title, "description", duration, amount, currency_iso_code)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: CreateSubscriptionItem :one
INSERT INTO subscription_items (subscription_id, product, quantity, unit_type)
values ($1, $2, $3, $4)
RETURNING *;

-- name: DeleteSubscriptionItem :exec
DELETE FROM subscription_items where id = $1;

-- name: UpdateSubscription :one
UPDATE subscriptions
SET
    (title, "description", duration, amount, currency_iso_code) =
    ($1, $2, $3, $4, $5)
WHERE
    id = $6
RETURNING *;

-- name: DeleteSubscription :exec
DELETE FROM subscriptions WHERE id = $1;

-- name: GetSubscriptionByID :one
SELECT * FROM subscriptions WHERE id = $1;

-- name: GetSubscriptionForUpdate :one
SELECT * FROM subscriptions WHERE id = $1 FOR UPDATE;

-- name: ListSubsriptions :many
SELECT * FROM subscriptions ORDER BY amount ASC;


-- name: CreateUserSubscription :one
INSERT INTO user_subscriptions (user_id, subscription_id, active, amount, currency_iso_code, estimated_delivery_time, is_custom, daily_delivery_limit)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: GetAllUserSubscriptions :many
SELECT * FROM user_subscriptions;

-- name: GetUserSubscriptionByID :one
SELECT * FROM user_subscriptions WHERE id = $1;

-- name: GetUserSubscriptionByPublicID :one
SELECT * FROM user_subscriptions WHERE public_id = $1;

-- name: ActivateUserSubscription :exec
UPDATE user_subscriptions
SET active = true, updated_at = now()
WHERE public_id = $1;

-- name: GetSubscriptionItemsBySubscriptionID :many
SELECT * FROM subscription_items WHERE subscription_id = $1;

-- name: ListUserSubscriptionsByUserID :many
SELECT * FROM user_subscriptions WHERE user_id = $1 ORDER BY created_at DESC;

-- name: ListOrdersDueSoon :many
SELECT 
    o.order_number, o.delivery_location, o.price_value, o.price_currency, o.status, o.rating, o.review, o.created_by, o.created_at, o.updated_at, o.secret_key, o.product_owner, o.payout_phone_number, o.delivery_address, o.dispatched_by, o.delivery_fee_amount, o.delivery_fee_currency, o.user_subscription_id, o.expected_delivery_date,
    COALESCE(oi_count.total_items, 0)::int AS total_items,
    oi_preview.product AS preview_product,
    oi_preview.quantity AS preview_quantity
FROM orders o
LEFT JOIN LATERAL (
    SELECT product, quantity
    FROM order_items
    WHERE order_number = o.order_number
    LIMIT 1
) AS oi_preview ON TRUE
LEFT JOIN (
    SELECT order_number, COUNT(*) AS total_items
    FROM order_items
    GROUP BY order_number
) AS oi_count ON oi_count.order_number = o.order_number
WHERE 
    o.expected_delivery_date IS NOT NULL
    AND o.expected_delivery_date >= NOW()
    AND o.expected_delivery_date <= NOW() + (sqlc.arg(days)::int || ' days')::interval
    AND o.status NOT IN ('OrderStatus_DELIVERED', 'OrderStatus_REJECTED', 'OrderStatus_CANCELLED')
ORDER BY o.expected_delivery_date ASC;

-- name: GetUserSubscriptionsBySubscriptionID :many
SELECT * FROM user_subscriptions WHERE subscription_id = $1;