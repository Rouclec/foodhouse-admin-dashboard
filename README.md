# FoodHouse

## Overview

FoodHouse is a **microservices-based backend system** designed for a food delivery or restaurant management platform. The project is organized into multiple services, each handling a specific business domain (users, orders, products, payments, etc.), and uses modern technologies like gRPC, OpenAPI, and Docker for scalability and maintainability.

---

## Project Structure

```plaintext
food-house/
├── users/                  # User management service
│   ├── users/              # Core service logic
│   ├── db/                 # Database migrations and queries
│   ├── cmd/                # Entry points (e.g., gRPC service)
│   ├── Dockerfile          # Container definition
│   └── Makefile            # Build, test, and deployment commands
├── orders/                 # Order management service
│   ├── orders/             # Core service logic
│   ├── db/                 # Database migrations and queries
│   ├── cmd/                # Entry points
│   ├── Dockerfile          # Container definition
│   └── Makefile            # Build, test, and deployment commands
├── products/               # Product management service
│   ├── products/           # Core service logic
│   ├── db/                 # Database migrations and queries
│   ├── cmd/                # Entry points
│   ├── Dockerfile          # Container definition
│   └── Makefile            # Build, test, and deployment commands
├── payment/                # Payment processing service
│   ├── payment.go          # Payment logic
│   └── campay.go           # Campay payment integration
├── protobuf/               # Protocol buffer definitions
│   ├── users.proto         # User service API definitions
│   ├── orders.proto        # Order service API definitions
│   ├── products.proto      # Product service API definitions
│   └── types/              # Shared protobuf types
├── grpc/                   # Generated gRPC code
│   └── go/                 # Go-specific generated code
│       ├── usersgrpc/      # Generated code for users service
│       ├── ordersgrpc/     # Generated code for orders service
│       └── productsgrpc/   # Generated code for products service
├── openapi/                # OpenAPI (Swagger) specifications
│   ├── users.swagger.json  # OpenAPI spec for users service
│   ├── orders.swagger.json # OpenAPI spec for orders service
│   └── products.swagger.json # OpenAPI spec for products service
├── mobile/                 # Mobile client integration
│   └── client/             # Swagger-generated client code
│       ├── orders.swagger/ # Client for orders service
│       ├── products.swagger/ # Client for products service
│       └── users.swagger/  # Client for users service
├── infra/                  # Infrastructure as code
│   ├── cloudformation/     # AWS CloudFormation templates
│   └── Makefile            # Infrastructure build and deployment commands
├── jsonproxy/              # JSON proxy service
│   ├── cmd/                # Entry points
│   ├── Dockerfile          # Container definition
│   └── Makefile            # Build, test, and deployment commands
├── googleapis/             # Google API integrations or proto files
├── openapi-ts.ts           # TypeScript OpenAPI-related code
├── package.json            # Node.js dependencies
├── go.mod                  # Go module dependencies
├── Makefile                # Root-level build, test, and deployment commands
└── README.md               # Project documentation
```

---

## Key Components

### 1. **Service Domains**
Each service (users, orders, products, payment) is a standalone module with its own:
- **Core Logic:** Implemented in Go (e.g., `service.go`)
- **Database Layer:** Migrations and queries in `db/`
- **Entry Points:** Command-line tools in `cmd/`
- **Containerization:** Dockerfile and Makefile for building and deploying

### 2. **API & Communication**
- **gRPC:**  
  - Protocol buffer definitions in `protobuf/` (e.g., `users.proto`, `orders.proto`)
  - Generated Go code in `grpc/go/` (e.g., `usersgrpc/`, `ordersgrpc/`)
- **OpenAPI:**  
  - OpenAPI (Swagger) JSON specs in `openapi/` for RESTful APIs

### 3. **Mobile Integration**
- Swagger-generated client code in `mobile/client/` for mobile app integration

### 4. **Infrastructure & Deployment**
- Infrastructure as code in `infra/` (e.g., AWS CloudFormation templates)
- Makefiles and Dockerfiles for building, testing, and deploying containers

### 5. **Supporting Components**
- `jsonproxy/` — Service for proxying or transforming JSON APIs
- `googleapis/` — Google API integrations or proto files
- `openapi-ts.ts` — TypeScript OpenAPI-related code

---

## Setup Guide

### Prerequisites
- **Go** (v1.16 or later)
- **Docker** and Docker Compose
- **Node.js** and Yarn (for OpenAPI client generation)
- **AWS CLI** (for infrastructure deployment)

### Step 1: Clone the Repository
```bash
git clone https://github.com/FoodHouse-CMR/foodhouseapp.git
cd foodhouseapp
```

### Step 2: Install Dependencies
```bash
# Install Go dependencies
make install-dependencies

# Install Node.js dependencies (if needed)
yarn install
```

### Step 3: Generate Code
```bash
# Generate protobuf, OpenAPI, and other code
make generate
```

### Step 4: Run Tests
```bash
# Run tests for all services
make test
```

### Step 5: Build and Run Services
Each service can be built and run independently using its Makefile. For example:

#### Users Service
```bash
cd users
make build
make run
```

#### Orders Service
```bash
cd orders
make build
make run
```

#### Products Service
```bash
cd products
make build
make run
```

#### JSON Proxy Service
```bash
cd jsonproxy
make build
make run
```

### Step 6: Run Databases
Each service uses PostgreSQL. You can start a local database using Docker:

```bash
# For Users Service
cd users
make rundb

# For Orders Service
cd orders
make rundb

# For Products Service
cd products
make rundb
```

### Step 7: Deploy Infrastructure
To deploy AWS CloudFormation templates:

```bash
cd infra
make publish bucket_name=your-s3-bucket artifact_hash=your-artifact-hash
```

---

## Development Workflow

### Code Generation
- **Protobuf:** Run `make generate` in the `protobuf/` directory to generate Go code and OpenAPI specs.
- **OpenAPI Clients:** Run `npx tsx openapi-ts.ts` to generate TypeScript clients.

### Linting and Testing
- **Lint:** Run `make lint` in each service directory.
- **Test:** Run `make test` in each service directory.

### Building and Publishing
- **Build:** Run `make build` in each service directory to build Docker images.
- **Publish:** Run `make publish` to push Docker images to a registry.

---

## Contributing
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -m 'Add your feature'`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a Pull Request.

---

## License
This project is licensed under the MIT License. See the LICENSE file for details.

---

## Contact
For questions or support, please contact [info@myfoodhouse.com](mailto:info@myfoodhouse.com).

---