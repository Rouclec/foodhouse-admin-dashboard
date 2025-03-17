-- name: CreatePayment :one
INSERT INTO payments (amount, currency_iso_code, method, external_ref)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetPaymentForUpdate :one
SELECT * FROM payments where id = $1 FOR UPDATE;

-- name: UpdatePaymentStatus :exec
UPDATE payments 
SET
    status = $1
WHERE 
    id = $2;

-- name: GetPaymentById :one
SELECT * FROM payments where id = $1;

-- name: GetPaymentByExternalReference :one
SELECT * FROM payments where external_ref = $1;