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
INSERT INTO user_subscriptions (user_id, subscription_id, active, amount, currency_iso_code)
VALUES ($1, $2, $3, $4, $5)
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