package products

import (
	"context"

	"github.com/foodhouse/foodhouseapp/grpc/go/productsgrpc"
	"github.com/foodhouse/foodhouseapp/products/db/repo"
	"github.com/rs/zerolog"
)

const (

	// DailySMSLimit is the maximum number of times a particular phone number can receive SMSs from the service.
	DailySMSLimit = 20

	MinimumPasswordLength = 12

	VerifyEmail = "VERIFY_EMAIL"

	ResetPassword = "RESET_PASSWORD"

	OneMillion = 1000000
)

// Impl is the implementation of the products service.
type Impl struct {
	repo               repo.ProductsRepo
	logger             zerolog.Logger
	devMethodsEndabled bool

	productsgrpc.UnsafeProductsServer
}

var _ productsgrpc.ProductsServer = (*Impl)(nil)

// Newproducts returns a new instance of the productsImpl.
func Newproducts(
	repo repo.ProductsRepo,
	logger zerolog.Logger,
	enableDevMethods bool,
) *Impl {
	return &Impl{
		repo:               repo,
		logger:             logger,
		devMethodsEndabled: enableDevMethods,
	}
}

// CreateCategory implements productsgrpc.ProductsServer.
func (i *Impl) CreateCategory(context.Context, *productsgrpc.CreateCategoryRequest) (*productsgrpc.CreateCategoryResponse, error) {
	panic("unimplemented")
}

// CreateProduct implements productsgrpc.ProductsServer.
func (i *Impl) CreateProduct(context.Context, *productsgrpc.CreateProductRequest) (*productsgrpc.CreateProductResponse, error) {
	panic("unimplemented")
}

// DeleteProduct implements productsgrpc.ProductsServer.
func (i *Impl) DeleteProduct(context.Context, *productsgrpc.DeleteProductRequest) (*productsgrpc.DeleteProductResponse, error) {
	panic("unimplemented")
}

// HealthCheck implements productsgrpc.ProductsServer.
func (i *Impl) HealthCheck(context.Context, *productsgrpc.HealthCheckRequest) (*productsgrpc.HealthCheckResponse, error) {
	return &productsgrpc.HealthCheckResponse{}, nil
}

// ListProducts implements productsgrpc.ProductsServer.
func (i *Impl) ListProducts(context.Context, *productsgrpc.ListProductsRequest) (*productsgrpc.ListProductsResponse, error) {
	panic("unimplemented")
}

// UpdateProduct implements productsgrpc.ProductsServer.
func (i *Impl) UpdateProduct(context.Context, *productsgrpc.UpdateProductRequest) (*productsgrpc.UpdateProductResponse, error) {
	panic("unimplemented")
}
