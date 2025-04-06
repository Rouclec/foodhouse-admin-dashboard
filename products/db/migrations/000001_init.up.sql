CREATE TABLE categories (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::varchar(36),
  name text,
  slug text,
  created_by varchar(36)
);

CREATE TABLE product (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::varchar(36),
  category_id varchar(36) NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  unit_type text NOT NULL,
  value bigint NOT NULL,
  currency_iso_code varchar(3) NOT NULL,
  description text,
  image text,
  created_by varchar(36),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

