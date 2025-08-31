package converters

import (
	"github.com/foodhouse/foodhouseapp/grpc/go/productsgrpc"
	"github.com/foodhouse/foodhouseapp/grpc/go/types"
	"github.com/foodhouse/foodhouseapp/products/db/sqlc"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func derefString(s *string) string {
	if s != nil {
		return *s
	}
	return ""
}

func derefFloat(f *float64) float64 {
	if f != nil {
		return *f
	}
	return 0.00
}

func SqlcToProtoProducts(sqlcProducts []sqlc.Product) ([]*productsgrpc.Product, error) {
	protoProducts := make([]*productsgrpc.Product, 0, len(sqlcProducts))

	for _, t := range sqlcProducts {
		protoProduct, err := SqlcToProtoProductRow(t, nil)

		if err != nil {
			return nil, err
		}
		protoProducts = append(protoProducts, protoProduct)
	}

	return protoProducts, nil
}

func SqlcToProtoProductRow(sqlcProduct sqlc.Product, sqlcCategory *sqlc.Category) (*productsgrpc.Product, error) {

	// Build a minimal category with just the ID if category is nil
	category := &productsgrpc.Category{Id: *sqlcProduct.CategoryID}
	if sqlcCategory != nil {
		category.Name = sqlcCategory.Name
		category.Slug = sqlcCategory.Slug
	}

	return &productsgrpc.Product{
		Id:       sqlcProduct.ID,
		Category: category, // Category will be nil if sqlcCategory is nil
		Name:     sqlcProduct.Name,
		UnitType: sqlcProduct.UnitType,
		Amount: &types.Amount{
			Value:           sqlcProduct.Value,
			CurrencyIsoCode: sqlcProduct.CurrencyIsoCode,
		},
		Description: sqlcProduct.Description,
		Image:       sqlcProduct.Image,
		CreatedBy:   derefString(sqlcProduct.CreatedBy),
		CreatedAt:   timestamppb.New(sqlcProduct.CreatedAt.Time),
		UpdatedAt:   timestamppb.New(sqlcProduct.UpdatedAt.Time),
	}, nil
}

func SqlcToProtoProduct(sqlcProduct sqlc.Product) (*productsgrpc.Product, error) {

	return &productsgrpc.Product{
		Id:       sqlcProduct.ID,
		Category: &productsgrpc.Category{Id: *sqlcProduct.CategoryID}, // Category will be nil if sqlcCategory is nil
		Name:     sqlcProduct.Name,
		UnitType: sqlcProduct.UnitType,
		Amount: &types.Amount{
			Value:           sqlcProduct.Value,
			CurrencyIsoCode: sqlcProduct.CurrencyIsoCode,
		},
		Description: sqlcProduct.Description,
		Image:       sqlcProduct.Image,
		CreatedBy:   derefString(sqlcProduct.CreatedBy),
		CreatedAt:   timestamppb.New(sqlcProduct.CreatedAt.Time),
		UpdatedAt:   timestamppb.New(sqlcProduct.UpdatedAt.Time),
		DeliveryFeePerUnit: &types.Amount{
			Value:           derefFloat(sqlcProduct.DeliveryFeeAmount),
			CurrencyIsoCode: derefString(sqlcProduct.DeliveryFeeCurrency),
		},
	}, nil
}

func SqlcToProtoCategories(sqlcCategories []sqlc.Category) ([]*productsgrpc.Category, error) {
	protoCategories := make([]*productsgrpc.Category, 0, len(sqlcCategories))

	for _, c := range sqlcCategories {
		protoCategory := &productsgrpc.Category{
			Id:        c.ID,
			Name:      c.Name,
			Slug:      c.Slug,
			CreatedBy: derefString(c.CreatedBy),
		}
		protoCategories = append(protoCategories, protoCategory)
	}

	return protoCategories, nil
}

func SqlcToProtoPriceTypes(sqlcPriceTypes []sqlc.PriceType) ([]*productsgrpc.PriceType, error) {
	protoPriceTypes := make([]*productsgrpc.PriceType, 0, len(sqlcPriceTypes))

	for _, pt := range sqlcPriceTypes {
		protoPriceType := &productsgrpc.PriceType{
			Id:         pt.ID,
			Name:       pt.Name,
			Slug:       pt.Slug,
			CategoryId: derefString(pt.CategoryID),
			DeliveryFeePerUnit: &types.Amount{
				Value:           derefFloat(pt.DeliveryFeeAmount),
				CurrencyIsoCode: derefString(pt.DeliveryFeeCurrency),
			},
		}
		protoPriceTypes = append(protoPriceTypes, protoPriceType)
	}

	return protoPriceTypes, nil
}

func SqlcToProtoProductNames(sqlcProductNames []sqlc.ProductName) ([]*productsgrpc.ProductName, error) {
	protoProductNames := make([]*productsgrpc.ProductName, 0, len(sqlcProductNames))

	for _, pn := range sqlcProductNames {
		protoProductName := &productsgrpc.ProductName{
			Name:       pn.Name,
			Slug:       pn.Slug,
			CategoryId: derefString(pn.CategoryID),
		}
		protoProductNames = append(protoProductNames, protoProductName)
	}

	return protoProductNames, nil
}
