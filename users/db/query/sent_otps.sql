-- name: CreateSentOtp :one
INSERT INTO sent_otps (factor_type, factor, secret_value, max_attempts)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetSentOtpByRequestId :one
SELECT * FROM sent_otps WHERE request_id = $1;

-- name: UpdateSentOtp :exec
UPDATE sent_otps
SET
    number_of_attempts = $1
WHERE
    request_id = $2;

-- name: GetLatestSentOtpByFactor :many
SELECT * FROM sent_otps WHERE factor = $1 ORDER BY created_at DESC LIMIT $2;

-- name: CountSentOtpsToFactorToday :one
SELECT COUNT(*) FROM sent_otps
WHERE factor = $1
  AND DATE(created_at) = CURRENT_DATE;