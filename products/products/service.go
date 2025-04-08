package products

import (
	"context"
	"fmt"
	"time"

	"github.com/foodhouse/foodhouseapp/grpc/go/productsgrpc"
	"github.com/foodhouse/foodhouseapp/products/db/converters"
	"github.com/foodhouse/foodhouseapp/products/db/repo"
	"github.com/foodhouse/foodhouseapp/products/db/sqlc"
	"github.com/gosimple/slug"
	"github.com/rs/zerolog"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"
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
func (i *Impl) CreateCategory(ctx context.Context, req *productsgrpc.CreateCategoryRequest) (*productsgrpc.CreateCategoryResponse, error) {
	i.logger.Debug().Msgf("name %v and slug %v", req.GetName(), slug.Make(req.GetName()))

	category, err := i.repo.Do().CreateCategory(ctx, sqlc.CreateCategoryParams{
		Name:      req.GetName(),
		Slug:      slug.Make(req.GetName()),
		CreatedBy: &req.UserId,
	})

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error creating category %v", err)
	}

	return &productsgrpc.CreateCategoryResponse{
		Category: &productsgrpc.Category{
			Id:        category.ID,
			Name:      category.Name,
			Slug:      category.Slug,
			CreatedBy: *category.CreatedBy,
		},
	}, nil
}

// CreateProduct implements productsgrpc.ProductsServer.
func (i *Impl) CreateProduct(ctx context.Context, req *productsgrpc.CreateProductRequest) (*productsgrpc.CreateProductResponse, error) {
	i.logger.Debug().Msgf("name %v and slug %v", req.GetName(), slug.Make(req.GetName()))

	category, err := i.repo.Do().GetCategory(ctx, req.GetCategoryId())

	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "error getting category %v", err)
	}

	unitType, ok := productsgrpc.UnitType_value[req.GetUnitType().String()]

	if !ok {
		return nil, status.Errorf(codes.InvalidArgument, "invalid unit type %v", req.GetUnitType().String())
	}

	product, err := i.repo.Do().CreateProduct(ctx, sqlc.CreateProductParams{
		CategoryID:      req.GetCategoryId(),
		Name:            req.GetName(),
		UnitType:        req.GetUnitType().String(),
		Value:           req.GetAmount().GetValue(),
		CurrencyIsoCode: req.GetAmount().GetCurrencyIsoCode(),
		Description:     req.GetDescription(),
		Image:           req.GetImage(),
		CreatedBy:       &req.UserId,
	})

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error creating product: %v", err)
	}

	return &productsgrpc.CreateProductResponse{
		Product: &productsgrpc.Product{
			Id: product.ID,
			Category: &productsgrpc.Category{
				Id:   category.ID,
				Name: category.Name,
				Slug: category.Slug,
			},
			Name:     product.Name,
			UnitType: productsgrpc.UnitType(unitType),
			Amount: &productsgrpc.Amount{
				Value:           product.Value,
				CurrencyIsoCode: product.CurrencyIsoCode,
			},
			Description: product.Description,
			Image:       product.Image,
			CreatedBy:   *product.CreatedBy,
			CreatedAt:   timestamppb.New(product.CreatedAt.Time),
			UpdatedAt:   timestamppb.New(product.UpdatedAt.Time),
		},
	}, nil
}

// DeleteProduct implements productsgrpc.ProductsServer.
func (i *Impl) DeleteProduct(ctx context.Context, req *productsgrpc.DeleteProductRequest) (*productsgrpc.DeleteProductResponse, error) {
	i.logger.Debug().Msgf("product id: %v", req.GetProductId())

	err := i.repo.Do().DeleteProduct(ctx, req.GetProductId())

	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "error deleting product %v", err)
	}

	return &productsgrpc.DeleteProductResponse{
		Message: fmt.Sprintf("Product with id %v deleted successfully", req.GetProductId()),
	}, nil
}

// HealthCheck implements productsgrpc.ProductsServer.
func (i *Impl) HealthCheck(context.Context, *productsgrpc.HealthCheckRequest) (*productsgrpc.HealthCheckResponse, error) {
	return &productsgrpc.HealthCheckResponse{}, nil
}

// ListProducts implements productsgrpc.ProductsServer.
func (i *Impl) ListProducts(ctx context.Context, req *productsgrpc.ListProductsRequest) (*productsgrpc.ListProductsResponse, error) {
	var err error
	startKey := time.Now().Add(time.Hour)

	if req.GetStartKey() != "" {
		startKey, err = time.Parse(time.RFC3339, req.GetStartKey())
		if err != nil {
			return nil, status.Errorf(codes.InvalidArgument, "Invalid start key")
		}
	}

	products, err := i.repo.Do().ListProducts(ctx, sqlc.ListProductsParams{
		Column2: req.GetCategoryId(),
		Value:   req.GetMinAmount().GetValue(),
		Value_2: req.GetMaxAmount().GetValue(),
		Column5: req.GetSearch(),
		Column6: startKey,
		Column7: req.GetCount(),
	})

	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "error deleting product %v", err)
	}

	protoProducts, err := converters.SqlcToProtoProducts(products)

	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to convert sqlc products to proto: %v", err)
	}

	nextKey := ""

	if len(protoProducts) >= int(req.GetCount()) {
		nextKey = protoProducts[len(protoProducts)-1].GetCreatedAt().AsTime().Format(time.RFC3339)
	}
	return &productsgrpc.ListProductsResponse{
		Products: protoProducts,
		NextKey:  nextKey,
	}, nil
}

// ListFarmerProducts implements productsgrpc.ProductsServer.
func (i *Impl) ListFarmerProducts(ctx context.Context, req *productsgrpc.ListFarmerProductsRequest) (*productsgrpc.ListFarmerProductsResponse, error) {
	var err error
	startKey := time.Now().Add(time.Hour)

	if req.GetStartKey() != "" {
		startKey, err = time.Parse(time.RFC3339, req.GetStartKey())
		if err != nil {
			return nil, status.Errorf(codes.InvalidArgument, "Invalid start key")
		}
	}

	products, err := i.repo.Do().ListProducts(ctx, sqlc.ListProductsParams{
		Column1: req.GetUserId(),
		Column2: req.GetCategoryId(),
		Value:   req.GetMinAmount().GetValue(),
		Value_2: req.GetMaxAmount().GetValue(),
		Column5: req.GetSearch(),
		Column6: startKey,
		Column7: req.GetCount(),
	})

	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "error deleting product %v", err)
	}

	protoProducts, err := converters.SqlcToProtoProducts(products)

	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to convert sqlc products to proto: %v", err)
	}

	nextKey := ""

	if len(protoProducts) >= int(req.GetCount()) {
		nextKey = protoProducts[len(protoProducts)-1].GetCreatedAt().AsTime().Format(time.RFC3339)
	}
	return &productsgrpc.ListFarmerProductsResponse{
		Products: protoProducts,
		NextKey:  nextKey,
	}, nil
}

// UpdateProduct implements productsgrpc.ProductsServer.
func (i *Impl) UpdateProduct(context.Context, *productsgrpc.UpdateProductRequest) (*productsgrpc.UpdateProductResponse, error) {
	panic("unimplemented")
}

// GetFarmerProduct implements productsgrpc.ProductsServer.
func (i *Impl) GetFarmerProduct(context.Context, *productsgrpc.GetFarmerProductRequest) (*productsgrpc.GetFarmerProductResponse, error) {
	panic("unimplemented")
}

// GetProduct implements productsgrpc.ProductsServer.
func (i *Impl) GetProduct(context.Context, *productsgrpc.GetProductRequest) (*productsgrpc.GetProductResponse, error) {
	panic("unimplemented")
}

// GetCategories implements productsgrpc.ProductsServer.
func (i *Impl) GetCategories(context.Context, *productsgrpc.GetCategoriesRequest) (*productsgrpc.GetCategoriesResponse, error) {
	panic("unimplemented")
}
