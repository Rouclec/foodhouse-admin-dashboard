-- Remove the deleted_at column
ALTER TABLE users
DROP COLUMN delete_requested_at,
DROP COLUMN deleted_at;