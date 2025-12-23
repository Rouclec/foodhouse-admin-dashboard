-- name: CreateSubscription :one
INSERT INTO subscriptions (title, "description", duration, amount, currency_iso_code, estimated_delivery_time)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: CreateSubscriptionItem :one
INSERT INTO subscription_items (subscription_id, product, quantity, unit_type, order_index)
values ($1, $2, $3, $4, $5)
RETURNING id, subscription_id, product, quantity, unit_type, order_index;

-- name: DeleteSubscriptionItem :exec
DELETE FROM subscription_items where id = $1;

-- name: UpdateSubscription :one
UPDATE subscriptions
SET
    title = COALESCE(sqlc.narg('title'), title),
    "description" = COALESCE(sqlc.narg('description'), "description"),
    duration = COALESCE(sqlc.narg('duration'), duration),
    amount = COALESCE(sqlc.narg('amount'), amount),
    currency_iso_code = COALESCE(sqlc.narg('currency_iso_code'), currency_iso_code),
    estimated_delivery_time = COALESCE(sqlc.narg('estimated_delivery_time'), estimated_delivery_time),
    updated_at = now()
WHERE
    id = sqlc.arg('id')
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
SELECT * FROM subscription_items WHERE subscription_id = $1 ORDER BY order_index ASC, id ASC;

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

-- name: ListAllActiveUserSubscriptions :many
SELECT 
    us.id, us.public_id, us.user_id, us.subscription_id, us.active, us.created_at, us.updated_at, us.expires_at, us.progress, us.amount, us.currency_iso_code, us.estimated_delivery_time, us.is_custom, us.daily_delivery_limit,
    MIN(o.expected_delivery_date)::timestamptz as soonest_delivery_date
FROM user_subscriptions us
LEFT JOIN orders o ON o.user_subscription_id = us.id
    AND o.status NOT IN ('OrderStatus_DELIVERED', 'OrderStatus_REJECTED', 'OrderStatus_CANCELLED')
    AND o.expected_delivery_date IS NOT NULL
WHERE us.active = true 
GROUP BY us.id, us.public_id, us.user_id, us.subscription_id, us.active, us.created_at, us.updated_at, us.expires_at, us.progress, us.amount, us.currency_iso_code, us.estimated_delivery_time, us.is_custom, us.daily_delivery_limit
ORDER BY 
    CASE 
        WHEN MIN(o.expected_delivery_date) IS NULL THEN 1
        WHEN MIN(o.expected_delivery_date) < NOW() THEN 0
        ELSE 2
    END,
    MIN(o.expected_delivery_date) ASC NULLS LAST,
    us.created_at DESC;