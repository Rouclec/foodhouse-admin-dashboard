package products

import (
	"context"
	"database/sql"
	"errors"
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

	count := int(req.GetCount())
	if count == 0 {
		count = 20 // or whatever default you want
	}

	if req.GetStartKey() != "" {
		startKey, err = time.Parse(time.RFC3339, req.GetStartKey())
		if err != nil {
			return nil, status.Errorf(codes.InvalidArgument, "Invalid start key")
		}
	}

	i.logger.Debug().Msgf("Start key %v", startKey)

	args := sqlc.ListProductsParams{
		CategoryID:    req.GetCategoryId(),
		MinValue:      req.GetMinAmount().GetValue(),
		MaxValue:      req.GetMaxAmount().GetValue(),
		Search:        req.GetSearch(),
		CreatedBefore: startKey,
		Count:         int32(count), // Convert count to int32
	}

	products, err := i.repo.Do().ListProducts(ctx, args)

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error getting products %v", err)
	}

	i.logger.Debug().Msgf("sqlc products %v", products)

	protoProducts, err := converters.SqlcToProtoProducts(products)

	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to convert sqlc products to proto: %v", err)
	}

	i.logger.Debug().Msgf("proto products %v", protoProducts)

	nextKey := ""

	if len(protoProducts) >= count {
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

	count := int(req.GetCount())
	if count == 0 {
		count = 20 // or whatever default you want
	}

	products, err := i.repo.Do().ListProducts(ctx, sqlc.ListProductsParams{
		CreatedBy:     req.GetUserId(),
		CategoryID:    req.GetCategoryId(),
		MinValue:      req.GetMinAmount().GetValue(),
		MaxValue:      req.GetMaxAmount().GetValue(),
		Search:        req.GetSearch(),
		CreatedBefore: startKey,
		Count:         int32(count), // Convert count to int32
	})

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error getting products %v", err)
	}

	protoProducts, err := converters.SqlcToProtoProducts(products)

	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to convert sqlc products to proto: %v", err)
	}

	nextKey := ""

	i.logger.Debug().Msgf("Count %v, product length %v", count, len(protoProducts))

	if len(protoProducts) >= count {
		nextKey = protoProducts[len(protoProducts)-1].GetCreatedAt().AsTime().Format(time.RFC3339)
	}
	return &productsgrpc.ListFarmerProductsResponse{
		Products: protoProducts,
		NextKey:  nextKey,
	}, nil
}

// UpdateProduct implements productsgrpc.ProductsServer.
func (i *Impl) UpdateProduct(ctx context.Context, req *productsgrpc.UpdateProductRequest) (*productsgrpc.UpdateProductResponse, error) {
	querier, tx, err := i.repo.Begin(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to begin transaction: %v", err)
	}

	// Proper rollback handling
	defer func() {
		err = tx.Rollback(ctx)
		if err != nil && !errors.Is(err, sql.ErrTxDone) {
			i.logger.Err(err).Msgf("Failed to rollback transaction: %v", req)
		}
	}()

	product, err := querier.GetProductForUpdate(ctx, req.GetProductId())

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error getting product %v", err)
	}

	i.logger.Debug().Interface("product found: ", product).Msg("Product for update")

	_, ok := productsgrpc.UnitType_value[req.GetUnitType().String()]

	if !ok {
		return nil, status.Errorf(codes.InvalidArgument, "invalid unit type %v", req.GetUnitType().String())
	}

	arg := sqlc.UpdateProductParams{
		CategoryID:      req.GetCategoryId(),
		Name:            req.GetName(),
		UnitType:        req.GetUnitType().String(),
		Value:           req.Amount.GetValue(),
		CurrencyIsoCode: req.GetAmount().GetCurrencyIsoCode(),
		Description:     req.GetDescription(),
		Image:           req.GetImage(),
	}

	err = querier.UpdateProduct(ctx, arg)

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error updating product %v", err)
	}

	err = tx.Commit(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to commit transaction: %v", err)
	}

	return &productsgrpc.UpdateProductResponse{
		Message: fmt.Sprintf("Product with id %v updated successfully", req.GetProductId()),
	}, nil
}

// GetFarmerProduct implements productsgrpc.ProductsServer.
func (i *Impl) GetFarmerProduct(ctx context.Context, req *productsgrpc.GetFarmerProductRequest) (*productsgrpc.GetFarmerProductResponse, error) {
	product, err := i.repo.Do().GetProduct(ctx, req.GetProductId())

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error getting product %v", err)
	}

	category, err := i.repo.Do().GetCategory(ctx, product.CategoryID)

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error fetching category %v for product with id %v", err, req.GetProductId())
	}

	protoProduct, err := converters.SqlcToProtoProduct(product, &category)

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error converting proto product to grpc %v", err)
	}
	return &productsgrpc.GetFarmerProductResponse{
		Product: protoProduct,
	}, nil
}

// GetProduct implements productsgrpc.ProductsServer.
func (i *Impl) GetProduct(ctx context.Context, req *productsgrpc.GetProductRequest) (*productsgrpc.GetProductResponse, error) {
	product, err := i.repo.Do().GetProduct(ctx, req.GetProductId())

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error getting product %v", err)
	}

	category, err := i.repo.Do().GetCategory(ctx, product.CategoryID)

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error fetching category %v for product with id %v", err, req.GetProductId())
	}

	protoProduct, err := converters.SqlcToProtoProduct(product, &category)

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error converting proto product to grpc %v", err)
	}
	return &productsgrpc.GetProductResponse{
		Product: protoProduct,
	}, nil
}

// GetCategories implements productsgrpc.ProductsServer.
func (i *Impl) ListCategories(ctx context.Context, req *productsgrpc.ListCategoriesRequest) (*productsgrpc.ListCategoriesResponse, error) {
	categories, err := i.repo.Do().ListCategories(ctx)

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error fetching categories %v", err)
	}

	protoCategories, err := converters.SqlcToProtoCategories(categories)

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error converting sqlc to proto categories: %v", err)
	}

	return &productsgrpc.ListCategoriesResponse{
		Categories: protoCategories,
	}, nil
}
