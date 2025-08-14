-- name: CreateCommission :one
INSERT INTO commissions (
    referrer_id,
    referred_id,
    order_number,
    currency_code,
    commission_amount,
    paid_at,
    payment_reference
) VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: AggregateCommissionByReferrer :many
SELECT 
    currency_code,
    SUM(commission_amount) AS total_amount
FROM commissions
WHERE referrer_id = sqlc.arg(referrer_id)
  AND (sqlc.arg(is_paid)::boolean IS NULL OR (paid_at IS NOT NULL) = sqlc.arg(is_paid)::boolean)
GROUP BY currency_code
ORDER BY currency_code;

-- name: CountUniqueOrdersByReferrer :one
SELECT COUNT(DISTINCT order_number) AS total_orders
FROM commissions
WHERE referrer_id = sqlc.arg(referrer_id)
  AND (sqlc.arg(start_date)::timestamptz IS NULL OR created_at >= sqlc.arg(start_date)::timestamptz)
  AND (sqlc.arg(end_date)::timestamptz IS NULL OR created_at <= sqlc.arg(end_date)::timestamptz);


-- name: BulkSettleCommissions :exec
UPDATE commissions
SET
    paid_at = CURRENT_TIMESTAMP,
    payment_reference = sqlc.arg(payment_reference)::uuid
WHERE id = ANY(sqlc.arg(commission_ids)::uuid[]);