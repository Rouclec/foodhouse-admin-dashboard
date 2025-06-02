-- name: CreateDeliveryPoint :one
INSERT INTO delivery_points (delivery_location, location_name, delivery_point_name, city) VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: ListDeliveryPoints :many
SELECT * 
FROM delivery_points
WHERE
  (sqlc.arg(city)::varchar = '' OR city = sqlc.arg(city)::varchar) 
  AND
  (sqlc.arg(created_before)::timestamptz = '0001-01-01 00:00:00+00'::timestamptz OR created_at < sqlc.arg(created_before)::timestamptz)
ORDER BY created_at DESC
LIMIT sqlc.arg(count)::int;