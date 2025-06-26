-- Up migration: Add ON DELETE CASCADE to user_id foreign key
ALTER TABLE refresh_tokens
  DROP CONSTRAINT refresh_tokens_user_id_fkey;

ALTER TABLE refresh_tokens
  ADD CONSTRAINT refresh_tokens_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES users(id)
  ON DELETE CASCADE;