
install-tools:
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@v1.62.2


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
	go run ./cmd/api/...
