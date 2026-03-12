-- Migration: Add image column to categories table

ALTER TABLE categories ADD COLUMN image TEXT;
