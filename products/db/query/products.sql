-- name: CreateCategory :one
INSERT INTO categories (name, slug, created_by)
VALUES ($1, $2, $3)
RETURNING *;

-- name: UpdateCategory :exec
UPDATE categories
SET name = $2,
    slug = $3
WHERE id = $1;

-- name: DeleteCategory :exec
DELETE FROM categories
WHERE id = $1;

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
SELECT * FROM product
WHERE
  (sqlc.arg(created_by)::varchar = '' OR created_by = sqlc.arg(created_by)::varchar) AND
  (sqlc.arg(category_id)::varchar = '' OR category_id = sqlc.arg(category_id)::varchar) AND
  (sqlc.arg(min_value)::float = 0 OR value >= sqlc.arg(min_value)::float) AND
  (
    sqlc.arg(max_value)::float = 0 OR value <= COALESCE(sqlc.arg(max_value)::float, 9223372036854775807)
  ) AND
  (
    sqlc.arg(search)::text = '' OR
    name ILIKE '%' || sqlc.arg(search)::text || '%' OR
    description ILIKE '%' || sqlc.arg(search)::text || '%'
  ) AND
  (sqlc.arg(created_before)::timestamptz = '0001-01-01 00:00:00+00'::timestamptz OR created_at < sqlc.arg(created_before)::timestamptz)
ORDER BY created_at DESC
LIMIT sqlc.arg(count)::int;

-- name: GetProductForUpdate :one
SELECT * FROM product where id = $1 FOR UPDATE;

-- name: GetProduct :one
SELECT * FROM product where id = $1; 

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

-- name: ListProductNames :many
SELECT * FROM product_names 
WHERE (sqlc.arg(category_id)::text = '' OR category_id = sqlc.arg(category_id))
ORDER BY slug ASC;

-- name: ListPriceTypes :many
SELECT * FROM price_types
WHERE (sqlc.arg(category_id)::text = '' OR category_id = sqlc.arg(category_id))
ORDER BY slug ASC;

-- name: SumProductAmounts :one
SELECT 
  COALESCE(SUM(p.value * t.quantity), 0)::double precision AS total
FROM (
  SELECT 
    UNNEST(sqlc.arg(product_ids)::text[]) AS id,
    UNNEST(sqlc.arg(quantities)::bigint[]) AS quantity
) AS t
JOIN product p ON p.id = t.id;


-- name: GetProductStatsBetweenDates :one
SELECT
  COUNT(*) AS total_products
FROM product
WHERE created_at >= sqlc.arg(start_date)::timestamptz
  AND created_at <= sqlc.arg(end_date)::timestamptz;