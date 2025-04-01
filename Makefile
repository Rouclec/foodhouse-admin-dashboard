.PHONY: test

generate:
	@echo "Generating protos"
	cd protobuf && make generate
	@echo "Generating infra"
	cd infra && make generate	
	npx tsx openapi-ts.ts 
	go generate ./...

install-dependencies:
	@echo "Installing go dependencies"
	go mod tidy



lint:
	@echo "Linting code"
	cd protobuf && make lint
	cd infra && make lint	
	cd jsonproxy && make lint	
	cd users && make lint

test:
	@echo "Running infra tests"
	# cd infra && make test # TODO: handle cloudformation template validation errors
	echo "Running proto tests"
	cd protobuf && make test	
	cd jsonproxy && make test	
	cd users && make test	


