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
INSERT INTO products (
  category_id, name, unit_type, value, currency_iso_code,
  description, image, created_by, whole_sale, delivery_fee_amount, delivery_fee_currency
) VALUES (
  $1, $2, $3, $4, $5,
  $6, $7, $8, $9, $10, $11
)
RETURNING *;

-- name: UpdateProduct :exec
UPDATE products
SET category_id = $2,
    name = $3,
    unit_type = $4,
    value = $5,
    currency_iso_code = $6,
    description = $7,
    image = $8,
    whole_sale = $9,
    updated_at = now()
WHERE id = $1;

-- name: DeleteProduct :exec
UPDATE products SET deleted_at = now() WHERE id = $1;

-- name: ListProducts :many
SELECT * FROM products
WHERE
  deleted_at IS NULL AND
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
ORDER BY created_at ASC
LIMIT sqlc.arg(count)::int;

-- name: GetProductForUpdate :one
SELECT * FROM products WHERE   
deleted_at IS NULL AND  
id = $1 FOR UPDATE;

-- name: GetProduct :one
SELECT * FROM products where id = $1; 

-- name: CreateProductName :one
INSERT INTO product_names (name, slug, category_id)
VALUES ($1, $2, $3)
RETURNING *;

-- name: CreatePriceType :one
INSERT INTO price_types (name, slug, category_id, delivery_fee_amount, delivery_fee_currency)
VALUES ($1, $2, $3, $4, $5)
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
JOIN products p ON p.id = t.id;


-- name: GetProductStatsBetweenDates :one
SELECT
  COUNT(*) AS total_products
FROM products
WHERE created_at >= sqlc.arg(start_date)::timestamptz
  AND created_at <= sqlc.arg(end_date)::timestamptz;