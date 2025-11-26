-- name: CreateUser :one
INSERT INTO users (phone_number, email, "password", first_name, last_name, residence_country_iso_code, "address", location_coordinates, profile_image, "role", user_status)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'UserStatus_ACTIVE')
RETURNING *;

-- name: UpdateUser :one
UPDATE users
SET
    (first_name, last_name, email, "address", location_coordinates, profile_image, phone_number, updated_at) =
    ($1,         $2,        $3,    $4,        $5,                   $6,            $7,           now())
WHERE
    id = $8
AND delete_requested_at IS NULL AND deleted_at IS NULL
RETURNING
    *;

-- name: GetUser :one
SELECT * FROM users WHERE id = $1;

-- name: GetFarmer :one
SELECT * FROM users WHERE id = $1 AND role = 'USER_ROLE_FARMER';

-- name: GetUserForUpdate :one
SELECT * FROM users WHERE id = $1 AND delete_requested_at IS NULL AND deleted_at IS NULL FOR UPDATE;

-- name: GetUserByEmail :one
SELECT * FROM users WHERE email = $1 AND delete_requested_at IS NULL AND deleted_at IS NULL;

-- name: GetUserByPhoneNumber :one
SELECT * FROM users WHERE phone_number = $1 AND delete_requested_at IS NULL AND deleted_at IS NULL;


-- name: GetUserByNationalNumber :one
SELECT *
FROM users
WHERE 
  phone_number = sqlc.arg(national_number)::TEXT
  OR
  (
    RIGHT(phone_number, CHAR_LENGTH(sqlc.arg(national_number)::TEXT)) = sqlc.arg(national_number)::TEXT
    AND CHAR_LENGTH(phone_number) - CHAR_LENGTH(sqlc.arg(national_number)::TEXT) BETWEEN 1 AND 5 -- ensures a valid country code
  );


-- name: UpdateUserPassword :exec
UPDATE users SET password = $1 WHERE id = $2 AND delete_requested_at IS NULL AND deleted_at IS NULL;

-- name: UpdateUserRole :exec
UPDATE users SET role = $1 WHERE id = $2 AND delete_requested_at IS NULL AND deleted_at IS NULL;

-- name: CountUsers :one
SELECT COUNT(*) FROM users WHERE created_at >= sqlc.arg(start_date) AND created_at < sqlc.arg(end_date) AND delete_requested_at IS NULL AND deleted_at IS NULL;


-- name: ListFarmersByRating :many
SELECT
    f.id,
    f.first_name,
    f.last_name,
    f.profile_image,
    f.created_at,
    f.user_status,
    f.address,
    f.phone_number,
    f.email,
    COALESCE(fr.average_rating, 0) AS average_rating
FROM
    users f
LEFT JOIN (
    SELECT
        farmer_id,
        AVG(rating) AS average_rating
    FROM
        farmers_reviews
    GROUP BY
        farmer_id
) AS fr ON f.id = fr.farmer_id
WHERE
    ( sqlc.arg(user_status)::TEXT = 'UserStatus_UNSPECIFIED' OR (f.user_status = sqlc.arg(user_status)::TEXT) )
    AND role = 'USER_ROLE_FARMER'
    AND (
      (
        sqlc.arg(cursor_average_rating)::float = 0
        AND COALESCE(fr.average_rating, 0) = 0
        AND (
          CASE WHEN sqlc.arg(sort_created_at_desc) THEN
            f.created_at < sqlc.arg(cursor_created_at)::timestamptz
          ELSE
            f.created_at > sqlc.arg(cursor_created_at)::timestamptz
          END
        )
      )
      OR (
        sqlc.arg(cursor_average_rating)::float != 0
        AND (
          COALESCE(fr.average_rating, 0) < sqlc.arg(cursor_average_rating)::float
          OR (
            COALESCE(fr.average_rating, 0) = sqlc.arg(cursor_average_rating)::float
            AND (
              CASE WHEN sqlc.arg(sort_created_at_desc) THEN
                f.created_at < sqlc.arg(cursor_created_at)::timestamptz
              ELSE
                f.created_at > sqlc.arg(cursor_created_at)::timestamptz
              END
            )
          )
        )
      )
      OR sqlc.arg(cursor_average_rating)::float > 5.0
    )
    AND (
    sqlc.arg(search_key) = ''
    OR (
        LOWER(f.first_name) LIKE LOWER('%' || sqlc.arg(search_key) || '%')
        OR LOWER(f.last_name) LIKE LOWER('%' || sqlc.arg(search_key) || '%')
        OR LOWER(f.email) LIKE LOWER('%' || sqlc.arg(search_key) || '%')
        OR (
            regexp_replace(phone_number, '[^0-9]', '', 'g')
            LIKE '%' || regexp_replace(sqlc.arg(search_key)::text, '[^0-9]', '', 'g') || '%'
        )
    )
    )
    AND delete_requested_at IS NULL AND deleted_at IS NULL
ORDER BY
    COALESCE(fr.average_rating, 0) DESC,
    CASE WHEN sqlc.arg(sort_created_at_desc) THEN f.created_at END DESC,
    CASE WHEN NOT sqlc.arg(sort_created_at_desc) THEN f.created_at END ASC
LIMIT sqlc.arg(count);

-- name: ListUsers :many
SELECT *
FROM users 
WHERE
    ( sqlc.arg(user_status)::TEXT = 'UserStatus_UNSPECIFIED' OR (user_status = sqlc.arg(user_status)::TEXT) )
    AND role = sqlc.arg(user_role)::TEXT
   AND (
        sqlc.arg(search_key) = ''
        OR (
            LOWER(first_name) LIKE LOWER('%' || sqlc.arg(search_key) || '%')
            OR LOWER(last_name) LIKE LOWER('%' || sqlc.arg(search_key) || '%')
            OR LOWER(email) LIKE LOWER('%' || sqlc.arg(search_key) || '%')
            OR (
                    regexp_replace(phone_number, '[^0-9]', '', 'g')
                    LIKE '%' || regexp_replace(sqlc.arg(search_key)::text, '[^0-9]', '', 'g') || '%'
                )
        )
    )
    AND created_at < sqlc.arg(before)::timestamptz
    AND delete_requested_at IS NULL AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT $1;

-- name: GetUserStatsBetweenDates :one
SELECT
  COUNT(*) FILTER (WHERE role = 'USER_ROLE_USER') AS total_users,
  COUNT(*) FILTER (WHERE role = 'USER_ROLE_FARMER') AS total_farmers
FROM users
WHERE created_at >= sqlc.arg(start_date)::timestamptz
  AND created_at <= sqlc.arg(end_date)::timestamptz;


-- name: SuspendUser :exec
UPDATE users
SET user_status = 'UserStatus_SUSPENDED'
WHERE id = $1; 

-- name: ReactivateUser :exec
UPDATE users
SET user_status = 'UserStatus_ACTIVE'
WHERE id = $1; 

-- -- name: DeleteUser :exec
-- DELETE FROM users where id = $1;

-- name: GetUserByReferralCode :one
SELECT * FROM users WHERE referral_code = $1;

-- name: DeleteUser :exec
UPDATE users
SET delete_requested_at = NOW(),
    deleted_at = NOW() + INTERVAL '90 days'
WHERE id = $1;