-- name: CreateReview :one
INSERT into farmers_reviews (farmer_id, order_id, product_id, rating, comment, created_by)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: ListFarmerReviews :many
SELECT * FROM farmers_reviews WHERE farmer_id = $1 
AND
  (sqlc.arg(created_before)::timestamptz = '0001-01-01 00:00:00+00'::timestamptz OR created_at < sqlc.arg(created_before)::timestamptz)
ORDER BY created_at DESC
LIMIT sqlc.arg(count)::int;

-- name: GetFarmerRating :one
SELECT COALESCE(AVG(rating), 0)::float AS average_rating
FROM farmers_reviews
WHERE farmer_id = sqlc.arg(farmer_id);

