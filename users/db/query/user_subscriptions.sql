-- name: CreateUserSubscription :one
INSERT INTO user_subscriptions (user_id, subscription_id, active, expires_at)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetAllUserSubscriptions :many
SELECT * FROM user_subscriptions;

-- name: GetUserSubscriptionByID :one
SELECT * FROM user_subscriptions WHERE id = $1;

-- name: ActivateUserSubscription :exec
UPDATE user_subscriptions
SET active = true, updated_at = now()
WHERE id = $1;

-- name: GetUserActiveSubscription :one
SELECT * 
FROM user_subscriptions 
WHERE user_id = $1 
AND active = TRUE 
LIMIT 1;