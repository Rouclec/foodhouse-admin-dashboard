FROM golang:1.23.3-bookworm

WORKDIR /app

ENV HOME=/root

RUN apt-get update && apt-get install -y ca-certificates protobuf-compiler
RUN protoc --version # Ensure compiler is available

RUN go install github.com/grpc-ecosystem/grpc-gateway/v2/protoc-gen-grpc-gateway@v2.23.0
RUN go install github.com/grpc-ecosystem/grpc-gateway/v2/protoc-gen-openapiv2@v2.23.0
RUN go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.35.2
RUN go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.5.1
