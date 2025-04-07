.PHONY: test generate lint

generate: generate-protos generate-client

lint:
	@echo "Running clang-format on protobufs"
	clang-format --dry-run --Werror *.proto types/*.proto

test:
	@echo "No tests implemented for protobufs"


## Protobuf Generation
../googleapis/google:
	git submodule init
	git submodule update

generate-protos: ../googleapis/google
	@echo "Generating Protobufs..."
	cd .. && docker build -t foodhouse-gen-protos -f ./protobuf/Dockerfile .
	cd ../ && mkdir -p grpc; \
	rm -rf ./grpc/go; \
	mkdir -p ./grpc/go/types
	## Generate service and message definitions
	cd ../ && docker run  --name foodhouse-gen-protos --rm \
		-v ./protobuf:/app/protobuf \
		-v ./openapi:/app/openapi \
		-v ./googleapis:/app/googleapis \
		-v ./grpc:/app/grpc   \
		 -w /app/protobuf foodhouse-gen-protos \
		sh -c ' \
	for proto_file in ./*.proto; do \
		base_name=$$(basename "$$proto_file" .proto); \
		mkdir -p ../grpc/go/$${base_name}grpc; \
		protoc -I . -I ../googleapis \
			--go_out "../grpc/go/$${base_name}grpc" --go_opt paths=source_relative \
			--go-grpc_out "../grpc/go/$${base_name}grpc" --go-grpc_opt paths=source_relative \
			--grpc-gateway_out "../grpc/go/$${base_name}grpc" \
			--grpc-gateway_opt paths=source_relative \
			--openapiv2_out ../openapi \
			--openapiv2_opt use_go_templates=true \
			"$$proto_file"; \
	done'

generate-client: generate-protos
	@echo "Generating Typescript Clients from OpenAPI spec"
	## disabling this for now during development
	# node generate-client.js;
