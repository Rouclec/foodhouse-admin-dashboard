DB_PASSWORD=password

install-tools:
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@v1.62.2
	go install github.com/sqlc-dev/sqlc/cmd/sqlc@v1.26.0
	go install go.uber.org/mock/mockgen@v0.5.0 


generate:
	go generate ./...

lint:
	go run github.com/golangci/golangci-lint/cmd/golangci-lint@v1.62.2 run ./...

test:
	go test ./... --cover

build:
	docker build -f ./Dockerfile -t $(full_image_tag) ..

publish:
	docker push $(full_image_tag)

run:
	go run ./cmd/grpc-service/...

create-migration:
	migrate create -ext sql -dir db/migrations -seq $(name)

generate-sqlc:
	go generate ./...

rundb:
	docker run --name postgres16 -p 5432:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=$(DB_PASSWORD) -e POSTGRES_DB=products -d postgres:16-alpine
