-- name: CreateCategory :one
INSERT INTO categories (name, slug, created_by)
VALUES ($1, $2, $3)
RETURNING *;

-- name: CreateProduct :one
INSERT INTO product (
  category_id, name, unit_type, value, currency_iso_code,
  description, image, created_by
) VALUES (
  $1, $2, $3, $4, $5,
  $6, $7, $8
)
RETURNING *;

-- name: UpdateProduct :exec
UPDATE product
SET category_id = $3,
    name = $4,
    unit_type = $5,
    value = $6,
    currency_iso_code = $7,
    description = $8,
    image = $9,
    updated_at = now()
WHERE id = $2 AND created_by = $1;

-- name: DeleteProduct :exec
DELETE FROM product
WHERE id = $1;

-- name: ListProducts :many
SELECT *
FROM product
WHERE
  ($1::varchar IS NULL OR created_by = $1) AND
  ($2::varchar IS NULL OR category_id = $2) AND
  (value >= COALESCE($3, 0)) AND
  (value <= COALESCE($4, 9223372036854775807)) AND
  ($5::text IS NULL OR name ILIKE '%' || $5 || '%' OR description ILIKE '%' || $5 || '%') AND
  ($6::timestamptz IS NULL OR created_at < $6)
ORDER BY created_at DESC
LIMIT COALESCE($7, 50);