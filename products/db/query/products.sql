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
  description, image, created_by, whole_sale
) VALUES (
  $1, $2, $3, $4, $5,
  $6, $7, $8, $9
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
    whole_sale = $10,
    updated_at = now()
WHERE id = $2 AND created_by = $1;

-- name: DeleteProduct :exec
DELETE FROM product
WHERE id = $1;

-- name: ListProducts :many
SELECT
  p.*,
  pt.slug AS unit_type_slug
FROM product p
LEFT JOIN price_types pt ON p.unit_type = pt.id
WHERE
  (sqlc.arg(created_by)::varchar = '' OR p.created_by = sqlc.arg(created_by)::varchar) AND
  (sqlc.arg(category_id)::varchar = '' OR p.category_id = sqlc.arg(category_id)::varchar) AND
  (sqlc.arg(min_value)::bigint = 0 OR p.value >= sqlc.arg(min_value)::bigint) AND
  (
    sqlc.arg(max_value)::bigint = 0 OR p.value <= COALESCE(sqlc.arg(max_value)::bigint, 9223372036854775807)
  ) AND
  (
    sqlc.arg(search)::text = '' OR
    p.name ILIKE '%' || sqlc.arg(search)::text || '%' OR
    p.description ILIKE '%' || sqlc.arg(search)::text || '%'
  ) AND
  (sqlc.arg(created_before)::timestamptz = '0001-01-01 00:00:00+00'::timestamptz OR p.created_at < sqlc.arg(created_before)::timestamptz)
ORDER BY p.created_at DESC
LIMIT sqlc.arg(count)::int;

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
  p.whole_sale,
  p.currency_iso_code,
  p.description,
  p.image,
  p.created_by AS product_created_by,
  p.created_at,
  p.updated_at,
  
  c.id AS category_id,
  c.name AS category_name,
  c.slug AS category_slug,
  c.created_by AS category_created_by,

  pt.slug as unit_type_slug

FROM product p
JOIN categories c ON p.category_id = c.id
JOIN price_types pt ON p.unit_type = pt.id
WHERE p.id = $1;

-- name: CreateProductName :one
INSERT INTO product_names (name, slug, category_id)
VALUES ($1, $2, $3)
RETURNING *;

-- name: CreatePriceType :one
INSERT INTO price_types (name, slug, category_id)
VALUES ($1, $2, $3)
RETURNING *; 


-- name: DeleteProductName :exec
DELETE FROM product_names WHERE name = $1;

-- name: DeletePriceType :exec
DELETE FROM price_types WHERE id = $1;

-- name: ListProductNamesByCategory :many
SELECT * FROM product_names WHERE category_id = $1
ORDER BY slug ASC;

-- name: ListPriceTypesByCategory :many
SELECT * FROM price_types WHERE category_id = $1
ORDER BY slug ASC;