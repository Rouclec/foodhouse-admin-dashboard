-- name: CreateOrder :one
INSERT INTO orders (
    delivery_location, 
    pickup_location,
    price_value, 
    price_currency, 
    status, 
    created_by, 
    secret_key, 
    product_owner,
    payout_phone_number,
    rating, 
    review,
    delivery_address,
    pickup_address,
    delivery_fee_amount,
    delivery_fee_currency,
    service_fee_amount,
    service_fee_currency,
    user_subscription_id,
    expected_delivery_date
)
VALUES (
    sqlc.arg(delivery_location)::point,    -- Enforcing as POINT (casting delivery_location)
    sqlc.arg(pickup_location)::point,
    sqlc.arg(price_value)::float,         -- Enforcing as BIGINT
    sqlc.arg(price_currency)::varchar(3),  -- Enforcing as VARCHAR(3)
    sqlc.arg(status)::text,                -- Enforcing as TEXT
    sqlc.arg(created_by)::varchar(36),     -- Enforcing as VARCHAR(36)
    sqlc.arg(secret_key)::varchar(6),      -- Enforcing as VARCHAR(6)
    sqlc.arg(product_owner)::varchar(36),   -- Enforcing as VARCHAR(36)
    sqlc.arg(payout_phone_number)::varchar(36), 
    1, -- Default rating
    '', -- Default review
    sqlc.arg(delivery_address)::text,
    sqlc.arg(pickup_address)::text,
    sqlc.arg(delivery_fee_amount)::float,
    sqlc.arg(delivery_fee_currency)::varchar(3),
    sqlc.arg(service_fee_amount)::float,
    sqlc.arg(service_fee_currency)::varchar(3),
    sqlc.arg(user_subscription_id),
    sqlc.arg(expected_delivery_date)
)
RETURNING *;

-- name: UpdateOrderStatus :exec
UPDATE orders
SET
  status = $2,
  updated_at = now(),
  dispatched_by = COALESCE($3, dispatched_by)
WHERE order_number = $1;


-- name: UpdateOrderAgent :exec
UPDATE orders
SET
  agent_id = $2,
  updated_at = now()
WHERE order_number = $1;


-- name: GetOrderByOrderNumber :one
SELECT 
    o.order_number, o.delivery_location, o.price_value, o.price_currency, o.status, o.rating, COALESCE(o.review, '')::text AS review, o.created_by, o.created_at, o.updated_at, o.secret_key, o.product_owner, o.payout_phone_number, o.delivery_address, o.dispatched_by, o.delivery_fee_amount, o.delivery_fee_currency, o.service_fee_amount, o.service_fee_currency, o.agent_id, o.pickup_location, COALESCE(o.pickup_address, '')::text AS pickup_address,
    COALESCE(
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'product', oi.product,
                'quantity', oi.quantity,
                'unit_type', oi.unit_type
            )
        ) FILTER (WHERE oi.id IS NOT NULL),
        '[]'
    ) AS items
FROM orders o
LEFT JOIN order_items oi
    ON o.order_number = oi.order_number
WHERE o.order_number = $1
GROUP BY o.order_number;

-- name: GetUserOrderBySecretKey :one
SELECT 
    o.order_number, o.delivery_location, o.price_value, o.price_currency, o.status, o.rating, COALESCE(o.review, '')::text AS review, o.created_by, o.created_at, o.updated_at, o.secret_key, o.product_owner, o.payout_phone_number, o.delivery_address, o.dispatched_by, o.delivery_fee_amount, o.delivery_fee_currency, o.service_fee_amount, o.service_fee_currency, o.agent_id, o.pickup_location, COALESCE(o.pickup_address, '')::text AS pickup_address,
    COALESCE(
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'product', oi.product,
                'quantity', oi.quantity,
                'unit_type', oi.unit_type
            )
        ) FILTER (WHERE oi.id IS NOT NULL),
        '[]'
    ) AS items
FROM orders o
LEFT JOIN order_items oi
    ON o.order_number = oi.order_number
WHERE o.secret_key = $1
GROUP BY o.order_number;

-- name: ListUserOrders :many
SELECT 
  o.order_number, o.delivery_location, o.price_value, o.price_currency, o.status, o.rating, COALESCE(o.review, '')::text AS review, o.created_by, o.created_at, o.updated_at, o.secret_key, o.product_owner, o.payout_phone_number, o.delivery_address, o.dispatched_by, o.delivery_fee_amount, o.delivery_fee_currency, o.user_subscription_id, o.expected_delivery_date, o.service_fee_amount, o.service_fee_currency, o.agent_id, o.pickup_location, COALESCE(o.pickup_address, '')::text AS pickup_address,
  COALESCE(oi_count.total_items, 0)::int AS total_items,
  oi_preview.product AS preview_product,
  oi_preview.quantity AS preview_quantity
FROM orders o
LEFT JOIN LATERAL (
    SELECT product, quantity
    FROM order_items
    WHERE order_number = o.order_number
    LIMIT 1
) AS oi_preview ON TRUE
LEFT JOIN (
    SELECT order_number, COUNT(*) AS total_items
    FROM order_items
    GROUP BY order_number
) AS oi_count ON oi_count.order_number = o.order_number
WHERE 
  o.created_by = $1
  AND (
    sqlc.arg(included_statuses)::TEXT[] IS NULL OR
    sqlc.arg(included_statuses)::TEXT[] = '{}'::TEXT[] OR
    o.status::TEXT = ANY(sqlc.arg(included_statuses))
  )
  AND (
    sqlc.arg(created_before)::timestamptz = '0001-01-01 00:00:00+00'::timestamptz OR
    o.created_at < sqlc.arg(created_before)::timestamptz
  )
  AND (
    sqlc.arg(search_key)::TEXT IS NULL OR
    o.order_number::TEXT ILIKE '%' || sqlc.arg(search_key) || '%'
  )
ORDER BY o.created_at DESC
LIMIT sqlc.arg(count)::int;

-- name: ListFarmerOrders :many
SELECT 
    o.order_number, o.delivery_location, o.price_value, o.price_currency, o.status, o.rating, COALESCE(o.review, '')::text AS review, o.created_by, o.created_at, o.updated_at, o.secret_key, o.product_owner, o.payout_phone_number, o.delivery_address, o.dispatched_by, o.delivery_fee_amount, o.delivery_fee_currency, o.service_fee_amount, o.service_fee_currency, o.agent_id, o.pickup_location, COALESCE(o.pickup_address, '')::text AS pickup_address,
    COALESCE(oi_count.total_items, 0)::int AS total_items,
    oi_preview.product AS preview_product,
    oi_preview.quantity AS preview_quantity
FROM orders o
LEFT JOIN LATERAL (
    SELECT product, quantity, unit_type
    FROM order_items
    WHERE order_number = o.order_number
    LIMIT 1
) AS oi_preview ON TRUE
LEFT JOIN (
    SELECT order_number, COUNT(*) AS total_items
    FROM order_items
    GROUP BY order_number
) AS oi_count ON oi_count.order_number = o.order_number
WHERE 
    o.product_owner = $1
    AND (sqlc.arg(included_statuses)::TEXT[] IS NULL OR
         sqlc.arg(included_statuses)::TEXT[] = '{}'::TEXT[] OR
         o.status::TEXT = ANY(sqlc.arg(included_statuses)))
    AND (sqlc.arg(created_before)::timestamptz = '0001-01-01 00:00:00+00'::timestamptz 
         OR o.created_at < sqlc.arg(created_before)::timestamptz)
    AND (sqlc.arg(search_key)::TEXT IS NULL 
         OR o.order_number::TEXT ILIKE '%' || sqlc.arg(search_key) || '%')
ORDER BY o.created_at DESC
LIMIT sqlc.arg(count)::int;

-- name: ListOrders :many
SELECT 
    o.order_number, o.delivery_location, o.price_value, o.price_currency, o.status, o.rating, COALESCE(o.review, '')::text AS review, o.created_by, o.created_at, o.updated_at, o.secret_key, o.product_owner, o.payout_phone_number, o.delivery_address, o.dispatched_by, o.delivery_fee_amount, o.delivery_fee_currency, o.service_fee_amount, o.service_fee_currency, o.agent_id, o.pickup_location, COALESCE(o.pickup_address, '')::text AS pickup_address,
    COALESCE(oi_count.total_items, 0)::int AS total_items,
    oi_preview.product AS preview_product,
    oi_preview.quantity AS preview_quantity
FROM orders o
LEFT JOIN LATERAL (
    SELECT product, quantity
    FROM order_items
    WHERE order_number = o.order_number
    LIMIT 1
) AS oi_preview ON TRUE
LEFT JOIN (
    SELECT order_number, COUNT(*) AS total_items
    FROM order_items
    GROUP BY order_number
) AS oi_count ON oi_count.order_number = o.order_number
WHERE 
    (sqlc.arg(included_statuses)::TEXT[] IS NULL OR
     sqlc.arg(included_statuses)::TEXT[] = '{}'::TEXT[] OR
     o.status::TEXT = ANY(sqlc.arg(included_statuses)))
  AND (sqlc.arg(created_before)::timestamptz = '0001-01-01 00:00:00+00'::timestamptz 
       OR o.created_at < sqlc.arg(created_before)::timestamptz)
  AND (sqlc.arg(search_key)::TEXT IS NULL 
       OR o.order_number::TEXT ILIKE '%' || sqlc.arg(search_key) || '%')
ORDER BY o.created_at DESC
LIMIT sqlc.arg(count)::int;

-- name: ListAgentAvailableOrders :many
SELECT
  o.order_number, o.delivery_location, o.status, o.created_by, o.created_at, o.updated_at, o.product_owner, o.delivery_address, o.dispatched_by, o.delivery_fee_amount, o.delivery_fee_currency, o.agent_id, o.pickup_location, COALESCE(o.pickup_address, '')::text AS pickup_address,
  COALESCE(oi_count.total_items, 0)::int AS total_items,
  oi_preview.product AS preview_product,
  oi_preview.quantity AS preview_quantity
FROM orders o
LEFT JOIN LATERAL (
    SELECT product, quantity
    FROM order_items
    WHERE order_number = o.order_number
    LIMIT 1
) AS oi_preview ON TRUE
LEFT JOIN (
    SELECT order_number, COUNT(*) AS total_items
    FROM order_items
    GROUP BY order_number
) AS oi_count ON oi_count.order_number = o.order_number
WHERE
  o.status = 'OrderStatus_APPROVED'
  AND o.agent_id IS NULL
  AND o.delivery_location IS NOT NULL
  AND (
    sqlc.arg(created_before)::timestamptz = '0001-01-01 00:00:00+00'::timestamptz OR
    o.created_at < sqlc.arg(created_before)::timestamptz
  )
  AND (
    6371 * 2 * asin(
      sqrt(
        power(
          sin(radians((o.delivery_location[1] - (sqlc.arg(agent_location)::point)[1]) / 2)),
          2
        ) +
        cos(radians((sqlc.arg(agent_location)::point)[1])) *
        cos(radians(o.delivery_location[1])) *
        power(
          sin(radians((o.delivery_location[0] - (sqlc.arg(agent_location)::point)[0]) / 2)),
          2
        )
      )
    )
  ) <= sqlc.arg(radius_km)::float8
ORDER BY o.created_at DESC
LIMIT sqlc.arg(count)::int;

-- name: ListAgentOngoingOrders :many
SELECT
  o.order_number, o.delivery_location, o.status, o.created_by, o.created_at, o.updated_at, o.product_owner, o.delivery_address, o.dispatched_by, o.delivery_fee_amount, o.delivery_fee_currency, o.agent_id, o.pickup_location, COALESCE(o.pickup_address, '')::text AS pickup_address,
  COALESCE(oi_count.total_items, 0)::int AS total_items,
  oi_preview.product AS preview_product,
  oi_preview.quantity AS preview_quantity
FROM orders o
LEFT JOIN LATERAL (
    SELECT product, quantity
    FROM order_items
    WHERE order_number = o.order_number
    LIMIT 1
) AS oi_preview ON TRUE
LEFT JOIN (
    SELECT order_number, COUNT(*) AS total_items
    FROM order_items
    GROUP BY order_number
) AS oi_count ON oi_count.order_number = o.order_number
WHERE
  o.status = 'OrderStatus_IN_TRANSIT'
  AND o.agent_id = sqlc.arg(agent_id)::varchar(36)
  AND (
    sqlc.arg(created_before)::timestamptz = '0001-01-01 00:00:00+00'::timestamptz OR
    o.created_at < sqlc.arg(created_before)::timestamptz
  )
ORDER BY o.created_at DESC
LIMIT sqlc.arg(count)::int;

-- name: ListAgentDeliveredOrders :many
SELECT
  o.order_number, o.delivery_location, o.status, o.created_by, o.created_at, o.updated_at, o.product_owner, o.delivery_address, o.dispatched_by, o.delivery_fee_amount, o.delivery_fee_currency, o.agent_id, o.pickup_location, COALESCE(o.pickup_address, '')::text AS pickup_address,
  COALESCE(oi_count.total_items, 0)::int AS total_items,
  oi_preview.product AS preview_product,
  oi_preview.quantity AS preview_quantity
FROM orders o
LEFT JOIN LATERAL (
    SELECT product, quantity
    FROM order_items
    WHERE order_number = o.order_number
    LIMIT 1
) AS oi_preview ON TRUE
LEFT JOIN (
    SELECT order_number, COUNT(*) AS total_items
    FROM order_items
    GROUP BY order_number
) AS oi_count ON oi_count.order_number = o.order_number
WHERE
  o.status = 'OrderStatus_DELIVERED'
  AND o.agent_id = sqlc.arg(agent_id)::varchar(36)
  AND (
    sqlc.arg(created_before)::timestamptz = '0001-01-01 00:00:00+00'::timestamptz OR
    o.created_at < sqlc.arg(created_before)::timestamptz
  )
ORDER BY o.created_at DESC
LIMIT sqlc.arg(count)::int;

-- name: ReviewOrder :exec
UPDATE orders SET review = $1, rating = $2, updated_at = now() WHERE order_number = $3;

-- name: CreateOrderAuditLog :exec
INSERT INTO orders_audit
    (
        order_number,
        event_timestamp,
        actor,
        action,
        reason,
        before,
        after
    )
VALUES ($1, $2, $3, $4, $5, $6, $7);

-- name: ListOrderAuditLogs :many
SELECT * from orders_audit WHERE order_number = $1;

-- name: CreatePayment :one
INSERT INTO payments (payment_entity, entity_id, amount_value, amount_currency, status, created_by, expires_at, method, account_number, type)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING *;

-- name: GetPaymentById :one
SELECT * from payments WHERE id = $1
LIMIT 1;

-- name: GetPaymentByEntity :one
SELECT * from payments WHERE payment_entity = $1 AND entity_id = $2;

-- name: UpdatePaymentStatus :exec
UPDATE payments SET status = $2, updated_at = now() WHERE id = $1;

-- name: GetOrdersGroupedByDay :many
SELECT 
  DATE_TRUNC('day', o.updated_at)::timestamptz AS group_date,
  COALESCE(SUM(o.price_value), 0)::float8 AS sum_total,
  o.price_currency AS currency
FROM orders o
WHERE o.product_owner = $1
  AND o.status = $2
  AND o.updated_at BETWEEN $3 AND $4
GROUP BY group_date, o.price_currency
ORDER BY group_date;

-- name: GetOrdersGroupedByMonth :many
SELECT 
  DATE_TRUNC('month', o.updated_at)::timestamptz AS group_date,
  COALESCE(SUM(o.price_value), 0)::float8 AS sum_total,
  o.price_currency AS currency
FROM orders o
WHERE o.product_owner = $1
  AND o.status = $2
  AND o.updated_at BETWEEN $3 AND $4
GROUP BY group_date, o.price_currency
ORDER BY group_date;


-- name: GetOrdersGroupedByYear :many
SELECT 
  DATE_TRUNC('year', o.updated_at)::timestamptz AS group_date,
  COALESCE(SUM(o.price_value), 0)::float8 AS sum_total,
  o.price_currency AS currency
FROM orders o
WHERE o.product_owner = $1
  AND o.status = $2
  AND o.updated_at BETWEEN $3 AND $4
GROUP BY group_date, o.price_currency
ORDER BY group_date;


-- name: GetOrderStatsBetweenDates :one
SELECT 
  COUNT(*) AS total_orders
FROM orders
WHERE status = ANY(sqlc.arg(included_statuses)::TEXT[])
  AND created_at >= sqlc.arg(start_date)::timestamptz
  AND created_at <= sqlc.arg(end_date)::timestamptz;

-- name: GetPaymentStatsBetweenDates :one
SELECT 
  COALESCE(
    SUM(
      CASE 
        WHEN type = 'PaymentType_CREDIT' THEN amount_value
        WHEN type = 'PaymentType_DEBIT'  THEN -amount_value
        ELSE 0
      END
    ), 0
  )::float AS total_value
FROM payments
WHERE status = 'PaymentStatus_COMPLETED'
  AND created_at >= sqlc.arg(start_date)::timestamptz
  AND created_at <= sqlc.arg(end_date)::timestamptz;

-- name: GetAgentStats :one
SELECT
  COUNT(*) FILTER (
    WHERE status = 'OrderStatus_APPROVED'
      AND (agent_id IS NULL OR agent_id = '')
  )::int AS available_count,
  COUNT(*) FILTER (
    WHERE status = 'OrderStatus_IN_TRANSIT'
      AND agent_id = sqlc.arg(agent_id)::varchar
  )::int AS ongoing_count,
  COUNT(*) FILTER (
    WHERE status = 'OrderStatus_DELIVERED'
      AND agent_id = sqlc.arg(agent_id)::varchar
  )::int AS completed_count,
  COALESCE(
    SUM(delivery_fee_amount) FILTER (
      WHERE status = 'OrderStatus_DELIVERED'
        AND agent_id = sqlc.arg(agent_id)::varchar
    ),
    0
  )::float8 AS total_earnings_value,
  COALESCE(
    MAX(delivery_fee_currency) FILTER (
      WHERE status = 'OrderStatus_DELIVERED'
        AND agent_id = sqlc.arg(agent_id)::varchar
    ),
    'XAF'
  )::text AS total_earnings_currency
FROM orders;



-- name: ListPayments :many
SELECT * FROM payments 
WHERE
  ( sqlc.arg(payment_status)::TEXT = 'PaymentStatus_UNSPECIFIED' OR status = sqlc.arg(payment_status)::TEXT ) 
  AND  
  ( sqlc.arg(payment_entity)::TEXT = 'PaymentEntity_UNSPECIFIED' OR payment_entity = sqlc.arg(payment_entity)::TEXT ) 
  AND  
  ( sqlc.arg(payment_type)::TEXT = 'PaymentType_UNSPECIFIED' OR type = sqlc.arg(payment_type)::TEXT ) 
  AND
  (
    sqlc.arg(created_before)::timestamptz = '0001-01-01 00:00:00+00'::timestamptz 
    OR created_at < sqlc.arg(created_before)::timestamptz
  ) 
  AND
  (
    sqlc.arg(search_key)::TEXT IS NULL OR account_number ILIKE '%' || sqlc.arg(search_key) || '%'
  )
ORDER BY created_at DESC
LIMIT sqlc.arg(count)::int;


-- name: CreateOrderItem :exec
INSERT INTO order_items (order_number, product, quantity, unit_type)
VALUES (
    sqlc.arg(order_number)::int,
    sqlc.arg(product)::text,
    sqlc.arg(quantity)::int,
    sqlc.arg(unit_type)::text
);

-- name: GetOrderItemsByOrderNumber :many
SELECT * FROM order_items
WHERE order_number = $1
ORDER BY id;

-- Delivery Ratings

-- name: CreateDeliveryRating :exec
INSERT INTO delivery_ratings (order_number, agent_id, user_id, rating, comment)
VALUES (
    sqlc.arg(order_number)::bigint,
    sqlc.arg(agent_id)::varchar,
    sqlc.arg(user_id)::varchar,
    sqlc.arg(rating)::integer,
    sqlc.arg(comment)::text
);

-- name: GetDeliveryRatingByOrderNumber :one
SELECT * FROM delivery_ratings WHERE order_number = $1;

-- name: GetDeliveryRatingsByAgentId :many
SELECT * FROM delivery_ratings 
WHERE agent_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetAverageAgentRating :one
SELECT 
    agent_id,
    COUNT(*) as rating_count,
    AVG(rating)::numeric(10,2) as average_rating
FROM delivery_ratings
WHERE agent_id = $1
GROUP BY agent_id;