-- Rollback migration: Remove image column from categories table

ALTER TABLE categories DROP COLUMN image;
