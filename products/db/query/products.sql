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
  description, image, created_by, whole_sale, delivery_fee_amount, delivery_fee_currency, location
) VALUES (
  $1, $2, $3, $4, $5,
  $6, $7, $8, $9, $10, $11, $12
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
    location = $10,
    updated_at = now()
WHERE id = $1;

-- name: DeleteProduct :exec
UPDATE products SET deleted_at = now() WHERE id = $1;

-- name: ListProducts :many
SELECT 
    p.id,
    p.category_id,
    p.name,
    p.unit_type,
    p.value,
    p.currency_iso_code,
    p.description,
    p.image,
    p.created_by,
    p.created_at,
    p.updated_at,
    p.whole_sale,
    p.deleted_at,
    p.delivery_fee_amount,
    p.delivery_fee_currency,
    p.is_approved,
    r.name AS region_name
FROM products p
LEFT JOIN regions r
    ON ST_Contains(r.boundary, p.location)
WHERE
    p.deleted_at IS NULL
    AND (
        sqlc.arg(is_approved_provided)::boolean = false
        OR p.is_approved = sqlc.arg(is_approved)::boolean
    )
    AND (sqlc.arg(created_by)::varchar = '' OR p.created_by = sqlc.arg(created_by)::varchar)
    AND (sqlc.arg(category_id)::varchar = '' OR p.category_id = sqlc.arg(category_id)::varchar)
    AND (sqlc.arg(min_value)::float = 0 OR p.value >= sqlc.arg(min_value)::float)
    AND (
        sqlc.arg(max_value)::float = 0 OR p.value <= COALESCE(sqlc.arg(max_value)::float, 9223372036854775807)
    )
    AND (
        sqlc.arg(search)::text = '' OR
        p.name ILIKE '%' || sqlc.arg(search)::text || '%' OR
        p.description ILIKE '%' || sqlc.arg(search)::text || '%'
    )
    AND (
        sqlc.arg(created_after)::timestamptz = '0001-01-01 00:00:00+00'::timestamptz
        OR p.created_at > sqlc.arg(created_after)::timestamptz
    )
    AND (
        sqlc.arg(allowed_regions)::text[] = ARRAY['__ADMIN_OVERRIDE__']
        OR (
            array_length(sqlc.arg(allowed_regions)::text[], 1) > 0
            AND r.name = ANY(sqlc.arg(allowed_regions)::text[])
        )
    )
ORDER BY p.created_at ASC
LIMIT sqlc.arg(count)::int;



-- name: GetProductForUpdate :one
SELECT 
    p.id,
    p.category_id,
    p.name,
    p.unit_type,
    p.value,
    p.currency_iso_code,
    p.description,
    p.image,
    p.created_by,
    p.created_at,
    p.updated_at,
    p.whole_sale,
    p.deleted_at,
    p.delivery_fee_amount,
    p.delivery_fee_currency,
    p.is_approved
FROM products p
WHERE   
deleted_at IS NULL AND  
id = $1 FOR UPDATE;

-- name: GetProduct :one
SELECT 
    p.id,
    p.category_id,
    p.name,
    p.unit_type,
    p.value,
    p.currency_iso_code,
    p.description,
    p.image,
    p.created_by,
    p.created_at,
    p.updated_at,
    p.whole_sale,
    p.deleted_at,
    p.delivery_fee_amount,
    p.delivery_fee_currency,
    p.is_approved
FROM products p
WHERE id = $1; 

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

-- name: GetPriceTypeById :one
SELECT * FROM price_types where id = $1;

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


-- name: PublishProduct :exec
UPDATE products SET is_approved = true where id = $1;

-- name: UnPublishProduct :exec
UPDATE products SET is_approved = false where id = $1;

-- name: GetRegionName :one
SELECT name
FROM regions
WHERE ST_Contains(
    boundary,
    ST_SetSRID(ST_MakePoint(sqlc.arg(lon)::float, sqlc.arg(lat)::float), 4326)
)
LIMIT 1;