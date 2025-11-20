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
  category_id,
  name,
  unit_type,
  value,
  currency_iso_code,
  description,
  image,
  created_by,
  whole_sale,
  delivery_fee_amount,
  delivery_fee_currency,
  location
)
VALUES (
  sqlc.arg(category_id)::text,
  sqlc.arg(name)::text,
  sqlc.arg(unit_type)::text,
  sqlc.arg(value)::float8,
  sqlc.arg(currency_iso_code)::text,
  sqlc.arg(description)::text,
  sqlc.arg(image)::text,
  sqlc.arg(created_by)::text,
  sqlc.arg(whole_sale)::boolean,
  sqlc.arg(delivery_fee_amount)::float8,
  sqlc.arg(delivery_fee_currency)::text,
  ST_SetSRID(ST_MakePoint(sqlc.arg(lon)::float8, sqlc.arg(lat)::float8), 4326)
)
RETURNING id;

-- name: UpdateProduct :exec
UPDATE products
SET
  category_id = sqlc.arg(category_id)::text,
  name = sqlc.arg(name)::text,
  unit_type = sqlc.arg(unit_type)::text,
  value = sqlc.arg(value)::float8,
  currency_iso_code = sqlc.arg(currency_iso_code)::text,
  description = sqlc.arg(description)::text,
  image = sqlc.arg(image)::text,
  whole_sale = sqlc.arg(whole_sale)::boolean,
  location = ST_SetSRID(ST_MakePoint(sqlc.arg(lon)::float8, sqlc.arg(lat)::float8), 4326),
  updated_at = now()
WHERE id = sqlc.arg(id)::text;

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
    COALESCE(r.name, '') AS region_name
FROM products p
LEFT JOIN LATERAL (
    SELECT r.name
    FROM regions r
    WHERE ST_Contains(r.boundary, p.location)
    ORDER BY ST_Area(r.boundary) ASC
    LIMIT 1
) r ON true
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
        sqlc.arg(max_value)::float = 0 
        OR p.value <= COALESCE(sqlc.arg(max_value)::float, 9223372036854775807)
    )
    AND (
        sqlc.arg(search)::text = '' 
        OR p.name ILIKE '%' || sqlc.arg(search)::text || '%'
        OR p.description ILIKE '%' || sqlc.arg(search)::text || '%'
    )
    AND (
        sqlc.arg(created_before)::timestamptz = '0001-01-01 00:00:00+00'::timestamptz 
        OR created_at < sqlc.arg(created_before)::timestamptz
    ) 
    AND (
        sqlc.arg(allowed_regions)::text[] = ARRAY['__ADMIN_OVERRIDE__']
        OR (
            array_length(sqlc.arg(allowed_regions)::text[], 1) > 0
            AND r.name = ANY(sqlc.arg(allowed_regions)::text[])
        )
    )
ORDER BY p.created_at DESC
LIMIT sqlc.arg(count)::int;


-- name: ListFarmerProducts :many
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
    p.deleted_at IS NULL
    AND p.created_by = sqlc.arg(created_by)::varchar
    AND (sqlc.arg(category_id)::varchar = '' OR p.category_id = sqlc.arg(category_id)::varchar)
    AND (
        sqlc.arg(search)::text = '' OR
        p.name ILIKE '%' || sqlc.arg(search)::text || '%' OR
        p.description ILIKE '%' || sqlc.arg(search)::text || '%'
    ) 
    AND (
        sqlc.arg(created_before)::timestamptz = '0001-01-01 00:00:00+00'::timestamptz 
        OR created_at < sqlc.arg(created_before)::timestamptz
    ) 
ORDER BY p.created_at DESC
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

-- name: GetMaxDeliveryFeeByProductIds :one
SELECT delivery_fee_amount, delivery_fee_currency, created_by
FROM products
WHERE id = ANY($1::text[])
ORDER BY delivery_fee_amount DESC
LIMIT 1;