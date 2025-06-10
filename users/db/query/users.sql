-- name: CreateUser :one
INSERT INTO users (phone_number, email, "password", first_name, last_name, residence_country_iso_code, "address", location_coordinates, profile_image, "role")
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING *;

-- name: UpdateUser :one
UPDATE users
SET
    (first_name, last_name, email, "address", location_coordinates, profile_image, updated_at) =
    ($1,         $2,        $3,    $4,        $5,                   $6,            now())
WHERE
    id = $7
RETURNING
    *;

-- name: GetUser :one
SELECT * FROM users WHERE id = $1;

-- name: GetFarmer :one
SELECT * FROM users WHERE id = $1 AND role = 'USER_ROLE_FARMER';

-- name: GetUserForUpdate :one
SELECT * FROM users WHERE id = $1 FOR UPDATE;

-- name: GetUserByEmail :one
SELECT * FROM users WHERE email = $1;

-- name: GetUserByPhoneNumber :one
SELECT * FROM users WHERE phone_number = $1;


-- name: GetUserByNationalNumber :one
SELECT *
FROM users
WHERE RIGHT(phone_number, CHAR_LENGTH(sqlc.arg(national_number)::TEXT)) = sqlc.arg(national_number)::TEXT
  AND CHAR_LENGTH(phone_number) - CHAR_LENGTH(sqlc.arg(national_number)::TEXT) BETWEEN 1 AND 5; -- ensures a valid country code

-- name: UpdateUserPassword :exec
UPDATE users SET password = $1 WHERE id = $2;

-- name: UpdateUserRole :exec
UPDATE users SET role = $1 WHERE id = $2;

-- name: CountUsers :one
SELECT COUNT(*) FROM users WHERE created_at >= sqlc.arg(start_date) AND created_at < sqlc.arg(end_date);


-- name: ListFarmersByRating :many
SELECT
    f.id,
    f.first_name,
    f.last_name,
    f.profile_image,
    f.created_at,
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
    (sqlc.arg(cursor_average_rating)::float = 0.0) -- If cursor_average_rating is 0.0 (initial fetch)
    OR
    (COALESCE(fr.average_rating, 0) < sqlc.arg(cursor_average_rating)::float) -- Or, get farmers with a strictly lower average rating than the cursor's rating
AND role = 'USER_ROLE_FARMER'
ORDER BY
    average_rating DESC,
    f.created_at ASC -- Oldest farmers take precedence if ratings are tied
LIMIT sqlc.arg(count);