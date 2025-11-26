ALTER TABLE users
ADD COLUMN delete_requested_at timestamptz DEFAULT null,
ADD COLUMN deleted_at timestamptz DEFAULT null;
