-- Enable PostGIS
CREATE EXTENSION postgis;

-- Add geography column to products
ALTER TABLE products
ADD COLUMN location geography(Point, 4326);


-- Table to hold named regions with polygons
CREATE TABLE regions (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    boundary geography(POLYGON, 4326) NOT NULL
);

-- Cameroon region polygons (approx bounding boxes)
INSERT INTO regions (name, boundary)
VALUES
('NORTH_WEST',
 ST_GeogFromText('POLYGON((9.7 5.7, 11.0 5.7, 11.0 7.0, 9.7 7.0, 9.7 5.7))')),
('SOUTH_WEST',
 ST_GeogFromText('POLYGON((8.5 4.0, 10.5 4.0, 10.5 6.2, 8.5 6.2, 8.5 4.0))')),
('WEST',
 ST_GeogFromText('POLYGON((9.9 5.0, 11.0 5.0, 11.0 6.2, 9.9 6.2, 9.9 5.0))')),
('DOUALA',
 ST_GeogFromText('POLYGON((9.65 3.95, 9.75 3.95, 9.75 4.10, 9.65 4.10, 9.65 3.95))')),
('YAOUNDE',
 ST_GeogFromText('POLYGON((11.45 3.80, 11.55 3.80, 11.55 3.95, 11.45 3.95, 11.45 3.80))')),
('CAMEROON',
 ST_GeogFromText('POLYGON((8.3 1.6, 16.2 1.6, 16.2 13.1, 8.3 13.1, 8.3 1.6))'));