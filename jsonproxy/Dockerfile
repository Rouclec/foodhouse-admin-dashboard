FROM golang:1.23.7-alpine3.20 AS builder

# Set the working directory in the container to /app
WORKDIR /app

# Copy only the go.mod and go.sum files from the root
COPY go.mod go.sum ./

# Download the dependencies
RUN go mod download

# Install curl
RUN apk add --no-cache curl


# Copy the source code for jsonproxy service
COPY jsonproxy ./jsonproxy
COPY grpc ./grpc

# Build the service
WORKDIR /app/jsonproxy
RUN go build -o /app/api ./cmd/api/...

# Run stage
FROM alpine:3.18

WORKDIR /app

COPY --from=builder /app/api .

# Copy the database migration files
# TODO: Uncomment this line when the migrations are ready
# COPY api/src/db/migrations ./migrations

# Add timezone data
RUN apk add --no-cache tzdata

# Run the jsonproxy
CMD ["/app/api"]
