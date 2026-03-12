-- Migration: Set default values for category image and handle nulls

-- Update null images to empty string
UPDATE categories SET image = '' WHERE image IS NULL;
