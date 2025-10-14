-- Add geometry column to products
ALTER TABLE products ADD COLUMN location geometry(Point, 4326);

-- Table to hold named regions with polygons
CREATE TABLE regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    boundary geometry(POLYGON, 4326) NOT NULL
);

-- Cameroon region polygons (approx bounding boxes)
INSERT INTO regions (name, boundary)
VALUES
('NORTH_WEST',
 ST_GeomFromText('POLYGON((9.7 5.7, 11.0 5.7, 11.0 7.0, 9.7 7.0, 9.7 5.7))', 4326)),
('SOUTH_WEST',
 ST_GeomFromText('POLYGON((8.5 4.0, 10.5 4.0, 10.5 6.2, 8.5 6.2, 8.5 4.0))', 4326)),
('WEST',
 ST_GeomFromText('POLYGON((9.9 5.0, 11.0 5.0, 11.0 6.2, 9.9 6.2, 9.9 5.0))', 4326)),
('DOUALA',
 ST_GeomFromText('POLYGON((9.65 3.95, 9.75 3.95, 9.75 4.10, 9.65 4.10, 9.65 3.95))', 4326)),
('YAOUNDE',
 ST_GeomFromText('POLYGON((11.45 3.80, 11.55 3.80, 11.55 3.95, 11.45 3.95, 11.45 3.80))', 4326)),
('CAMEROON',
 ST_GeomFromText('POLYGON((8.3 1.6, 16.2 1.6, 16.2 13.1, 8.3 13.1, 8.3 1.6))', 4326));