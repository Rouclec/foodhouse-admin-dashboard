-- name: CreateUserPaymentMethod :one
INSERT INTO user_payment_methods (user_id, method, method_id)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetUserPaymentMethodsByUserID :many
SELECT * FROM user_payment_methods
WHERE user_id = $1;

-- name: DeleteUserPaymentMethod :exec
DELETE FROM user_payment_methods
WHERE id = $1;