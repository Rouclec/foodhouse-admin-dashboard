-- name: CreateDeliveryPoint :one
INSERT INTO delivery_points (delivery_location, location_name, delivery_point_name, city) VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: UpdateDeliveryPoint :exec
UPDATE delivery_points
SET (delivery_location, location_name, delivery_point_name, city) = ($2, $3, $4, $5)
WHERE id = $1;

-- name: DeleteDeliveryPoint :exec
DELETE FROM delivery_points WHERE id = $1;

-- name: ListDeliveryPoints :many
SELECT * 
FROM delivery_points
WHERE
  (
    sqlc.arg(city)::varchar = '' 
    OR LOWER(city) ILIKE '%' || LOWER(sqlc.arg(city)::varchar) || '%'
  )
  AND
  (
    sqlc.arg(created_before)::timestamptz = '0001-01-01 00:00:00+00'::timestamptz 
    OR created_at < sqlc.arg(created_before)::timestamptz
  )
ORDER BY created_at DESC
LIMIT sqlc.arg(count)::int;

-- name: ListUniqueCities :many
SELECT DISTINCT city
FROM delivery_points
ORDER BY city ASC;