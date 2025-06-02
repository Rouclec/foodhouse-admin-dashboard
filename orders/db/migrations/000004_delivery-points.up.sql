CREATE TABLE delivery_points (
    id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::varchar(36),
    delivery_location Point,
    location_name text,
    delivery_point_name text,
    city text,
    created_at timestamptz DEFAULT (now())
);