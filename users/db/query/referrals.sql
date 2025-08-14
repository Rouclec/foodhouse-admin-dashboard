-- name: CreateReferral :one
INSERT INTO referrals (referrer_id, referred_id)
VALUES ($1, $2)
RETURNING *;

-- name: CountReferralsByReferrer :one
SELECT COUNT(*) AS count
FROM referrals
WHERE referrer_id = $1;

-- name: GetReferralByReferredID :one
SELECT *
FROM referrals
WHERE referred_id = $1;