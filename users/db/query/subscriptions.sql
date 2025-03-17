-- name: CreateSubscription :one
INSERT INTO subscriptions (title, "description", duration, amount, currency_iso_code)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

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

-- name: GetAllSubscriptions :many
SELECT * FROM subscriptions;