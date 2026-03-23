-- Create agent delivery ratings table
CREATE TABLE delivery_ratings (
    id SERIAL PRIMARY KEY,
    order_number bigint NOT NULL REFERENCES orders(order_number),
    agent_id varchar(36) NOT NULL,
    user_id varchar(36) NOT NULL,
    rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Index for fetching agent's ratings
CREATE INDEX idx_delivery_ratings_agent_id ON delivery_ratings(agent_id);

-- Index for fetching ratings for a specific order
CREATE INDEX idx_delivery_ratings_order_number ON delivery_ratings(order_number);
