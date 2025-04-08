package converters

import (
	"fmt"

	"github.com/foodhouse/foodhouseapp/grpc/go/productsgrpc"
	"github.com/foodhouse/foodhouseapp/products/db/sqlc"
)

func SqlcToProtoProducts(sqlcProducts []sqlc.Product) ([]*productsgrpc.Product, error) {
	protoProducts := make([]*productsgrpc.Product, 0, len(sqlcProducts))

	for _, t := range sqlcProducts {
		protoProduct, err := SqlcToProtoProduct(t, nil)

		if err != nil {
			return nil, err
		}
		protoProducts = append(protoProducts, protoProduct)
	}

	return protoProducts, nil
}

func SqlcToProtoProduct(sqlcProduct sqlc.Product, sqlcCategory *sqlc.Category) (*productsgrpc.Product, error) {
	unitType, ok := productsgrpc.UnitType_value[sqlcProduct.UnitType]

	if !ok {
		return nil, fmt.Errorf("invalid unit type %v", sqlcProduct.UnitType)
	}
	return &productsgrpc.Product{
		Id: sqlcProduct.ID,
		Category: &productsgrpc.Category{
			Id:   sqlcProduct.CategoryID,
			Name: sqlcCategory.Name,
			Slug: sqlcCategory.Slug,
		},
		Name:     sqlcProduct.Name,
		UnitType: productsgrpc.UnitType(unitType),
		Amount: &productsgrpc.Amount{
			Value:           sqlcProduct.Value,
			CurrencyIsoCode: sqlcProduct.CurrencyIsoCode,
		},
		Description: sqlcProduct.Description,
		Image:       sqlcProduct.Image,
		CreatedBy:   *sqlcProduct.CreatedBy,
	}, nil
}

func SqlcToProtoCategories(sqlcCategories []sqlc.Category) ([]*productsgrpc.Category, error) {
	protoCategories := make([]*productsgrpc.Category, 0, len(sqlcCategories))

	for _, c := range sqlcCategories {
		protoCategory := &productsgrpc.Category{
			Id:        c.ID,
			Name:      c.Name,
			Slug:      c.Slug,
			CreatedBy: *c.CreatedBy,
		}
		protoCategories = append(protoCategories, protoCategory)
	}

	return protoCategories, nil
}
