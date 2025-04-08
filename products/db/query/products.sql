-- name: CreateCategory :one
INSERT INTO categories (name, slug, created_by)
VALUES ($1, $2, $3)
RETURNING *;

-- name: ListCategories :many
SELECT * FROM categories;

-- name: GetCategory :one
SELECT * FROM categories where id = $1;

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
LIMIT COALESCE($7::int, 50);

-- name: GetProductForUpdate :one
SELECT * FROM product where id = $1 FOR UPDATE;

-- name: GetProduct :one
SELECT * FROM product where id = $1; 

-- name: GetProductWithCategory :one
SELECT 
  p.id AS product_id,
  p.name AS product_name,
  p.unit_type,
  p.value,
  p.currency_iso_code,
  p.description,
  p.image,
  p.created_by AS product_created_by,
  p.created_at,
  p.updated_at,
  
  c.id AS category_id,
  c.name AS category_name,
  c.slug AS category_slug,
  c.created_by AS category_created_by

FROM product p
JOIN categories c ON p.category_id = c.id
WHERE p.id = $1;