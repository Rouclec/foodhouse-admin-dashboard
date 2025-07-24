FROM golang:1.24-alpine3.20 AS builder

# Set the working directory in the container to /app
WORKDIR /app

# Copy only the go.mod and go.sum files from the root
COPY go.mod go.sum ./

# Download the dependencies
RUN go mod download

# Install curl
RUN apk add --no-cache curl


# Copy the source code for orders service
COPY orders ./orders
COPY grpc ./grpc
COPY payment ./payment
# COPY mutations ./mutations

# Build the orders service
WORKDIR /app/orders
RUN go build -o /app/grpc-service ./cmd/grpc-service/...

# Run stage
FROM alpine:3.18

WORKDIR /app

COPY --from=builder /app/grpc-service .

# Copy the database migration files
COPY orders/db/migrations ./migrations

# Add timezone data
RUN apk add --no-cache tzdata

# Run the products
CMD ["/app/grpc-service"]
