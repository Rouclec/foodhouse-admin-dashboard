package converters

import (
	"encoding/json"
	"fmt"
	"math"

	"github.com/foodhouse/foodhouseapp/grpc/go/ordersgrpc"
	"github.com/foodhouse/foodhouseapp/grpc/go/types"
	"github.com/foodhouse/foodhouseapp/orders/db/sqlc"
	"github.com/rs/zerolog"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/types/known/timestamppb"
)

const OneMillion = 1000000

func derefFloat(f *float64) float64 {
	if f != nil {
		return *f
	}
	return 0.00
}

func SqlcOrderBySecretKeyToProto(order sqlc.GetUserOrderBySecretKeyRow) *ordersgrpc.Order {

	// Convert price
	var price *types.Amount
	if order.PriceValue != nil && order.PriceCurrency != nil {
		price = &types.Amount{
			Value:           *order.PriceValue,
			CurrencyIsoCode: *order.PriceCurrency,
		}
	}

	// Convert status (string → enum) — safe default
	statusEnum := ordersgrpc.OrderStatus_OrderStatus_UNSPECIFIED
	switch order.Status {
	case ordersgrpc.OrderStatus_OrderStatus_CREATED.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_CREATED
	case ordersgrpc.OrderStatus_OrderStatus_PAYMENT_SUCCESSFUL.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_PAYMENT_SUCCESSFUL
	case ordersgrpc.OrderStatus_OrderStatus_PAYMENT_FAILED.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_PAYMENT_FAILED
	case ordersgrpc.OrderStatus_OrderStatus_IN_TRANSIT.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_IN_TRANSIT
	case ordersgrpc.OrderStatus_OrderStatus_DELIVERED.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_DELIVERED
	case ordersgrpc.OrderStatus_OrderStatus_APPROVED.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_APPROVED
	case ordersgrpc.OrderStatus_OrderStatus_REJECTED.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_REJECTED
	}

	// Convert items JSON -> []*ordersgrpc.OrderItem
	var items []*ordersgrpc.OrderItem
	if order.Items != nil {
		switch v := order.Items.(type) {
		case []byte:
			err := json.Unmarshal(v, &items)
			if err != nil {
				// handle error
			}
		case string:
			err := json.Unmarshal([]byte(v), &items)
			if err != nil {
				// handle error
			}
		case []*ordersgrpc.OrderItem:
			// already enriched in memory → perfect, use directly
			items = v
		default:
			// unexpected type
			items = []*ordersgrpc.OrderItem{}
		}
	}

	return &ordersgrpc.Order{
		OrderNumber: stringFromInt64(order.OrderNumber),
		DeliveryLocation: &types.Point{
			Address: order.DeliveryAddress,
			Lat:     order.DeliveryLocation.P.Y,
			Lon:     order.DeliveryLocation.P.X,
		},
		SumTotal:          price,
		Status:            statusEnum,
		Rating:            int32(order.Rating.Int.Int64()),
		Review:            order.Review,
		CreatedBy:         derefString(order.CreatedBy),
		CreatedAt:         timestamppb.New(order.CreatedAt.Time),
		UpdatedAt:         timestamppb.New(order.UpdatedAt.Time),
		SecretKey:         derefString(order.SecretKey),
		ProductOwner:      derefString(order.ProductOwner),
		PayoutPhoneNumber: derefString(order.PayoutPhoneNumber),
		DispatchedBy:      derefString(order.DispatchedBy),
		DeliveryFee: &types.Amount{
			Value:           derefFloat(order.DeliveryFeeAmount),
			CurrencyIsoCode: derefString(order.DeliveryFeeCurrency),
		},
		ServiceFee: &types.Amount{
			Value:           order.ServiceFeeAmount,
			CurrencyIsoCode: order.ServiceFeeCurrency,
		},
		OrderItems: items,
	}
}

func SqlcOrderByNumberToProto(order sqlc.GetOrderByOrderNumberRow, logger zerolog.Logger) *ordersgrpc.Order {

	// Convert price
	var price *types.Amount
	if order.PriceValue != nil && order.PriceCurrency != nil {
		price = &types.Amount{
			Value:           *order.PriceValue,
			CurrencyIsoCode: *order.PriceCurrency,
		}
	}

	// Convert status (string → enum) — safe default
	statusEnum := ordersgrpc.OrderStatus_OrderStatus_UNSPECIFIED
	switch order.Status {
	case ordersgrpc.OrderStatus_OrderStatus_CREATED.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_CREATED
	case ordersgrpc.OrderStatus_OrderStatus_PAYMENT_SUCCESSFUL.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_PAYMENT_SUCCESSFUL
	case ordersgrpc.OrderStatus_OrderStatus_PAYMENT_FAILED.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_PAYMENT_FAILED
	case ordersgrpc.OrderStatus_OrderStatus_IN_TRANSIT.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_IN_TRANSIT
	case ordersgrpc.OrderStatus_OrderStatus_DELIVERED.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_DELIVERED
	case ordersgrpc.OrderStatus_OrderStatus_APPROVED.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_APPROVED
	case ordersgrpc.OrderStatus_OrderStatus_REJECTED.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_REJECTED
	}

	logger.Debug().Msgf("order items: %v", order.Items)

	// Convert items JSON -> []*ordersgrpc.OrderItem
	var items []*ordersgrpc.OrderItem
	if order.Items != nil {
		switch v := order.Items.(type) {
		case []byte:
			err := json.Unmarshal(v, &items)
			if err != nil {
				// handle error
			}
		case string:
			err := json.Unmarshal([]byte(v), &items)
			if err != nil {
				// handle error
			}
		case []*ordersgrpc.OrderItem:
			// already enriched in memory → perfect, use directly
			items = v
		default:
			// unexpected type
			items = []*ordersgrpc.OrderItem{}
		}
	}

	return &ordersgrpc.Order{
		OrderNumber: stringFromInt64(order.OrderNumber),
		DeliveryLocation: &types.Point{
			Address: order.DeliveryAddress,
			Lat:     order.DeliveryLocation.P.Y,
			Lon:     order.DeliveryLocation.P.X,
		},
		SumTotal:          price,
		Status:            statusEnum,
		Rating:            int32(order.Rating.Int.Int64()),
		Review:            order.Review,
		CreatedBy:         derefString(order.CreatedBy),
		CreatedAt:         timestamppb.New(order.CreatedAt.Time),
		UpdatedAt:         timestamppb.New(order.UpdatedAt.Time),
		SecretKey:         derefString(order.SecretKey),
		ProductOwner:      derefString(order.ProductOwner),
		PayoutPhoneNumber: derefString(order.PayoutPhoneNumber),
		DispatchedBy:      derefString(order.DispatchedBy),
		DeliveryFee: &types.Amount{
			Value:           derefFloat(order.DeliveryFeeAmount),
			CurrencyIsoCode: derefString(order.DeliveryFeeCurrency),
		},
		ServiceFee: &types.Amount{
			Value:           order.ServiceFeeAmount,
			CurrencyIsoCode: order.ServiceFeeCurrency,
		},
		OrderItems: items,
	}
}

func SqlcOrderRowToProto(order sqlc.ListOrdersRow) *ordersgrpc.Order {

	// Convert price
	var price *types.Amount
	if order.PriceValue != nil && order.PriceCurrency != nil {
		price = &types.Amount{
			Value:           *order.PriceValue,
			CurrencyIsoCode: *order.PriceCurrency,
		}
	}

	// Convert status (string → enum)
	statusEnum := ordersgrpc.OrderStatus_OrderStatus_UNSPECIFIED
	switch order.Status {
	case ordersgrpc.OrderStatus_OrderStatus_CREATED.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_CREATED
	case ordersgrpc.OrderStatus_OrderStatus_PAYMENT_SUCCESSFUL.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_PAYMENT_SUCCESSFUL
	case ordersgrpc.OrderStatus_OrderStatus_PAYMENT_FAILED.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_PAYMENT_FAILED
	case ordersgrpc.OrderStatus_OrderStatus_IN_TRANSIT.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_IN_TRANSIT
	case ordersgrpc.OrderStatus_OrderStatus_DELIVERED.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_DELIVERED
	case ordersgrpc.OrderStatus_OrderStatus_APPROVED.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_APPROVED
	case ordersgrpc.OrderStatus_OrderStatus_REJECTED.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_REJECTED
	}

	// Convert preview item
	var previewItems []*ordersgrpc.OrderItem
	if order.PreviewProduct != "" {
		previewItems = []*ordersgrpc.OrderItem{
			{
				ProductId: order.PreviewProduct,
				Quantity:  int64(order.PreviewQuantity),
			},
		}
	}

	return &ordersgrpc.Order{
		OrderNumber: stringFromInt64(order.OrderNumber),
		DeliveryLocation: &types.Point{
			Address: order.DeliveryAddress,
			Lat:     order.DeliveryLocation.P.Y,
			Lon:     order.DeliveryLocation.P.X,
		},
		SumTotal:          price,
		Status:            statusEnum,
		Rating:            int32(order.Rating.Int.Int64()),
		Review:            order.Review,
		CreatedBy:         derefString(order.CreatedBy),
		CreatedAt:         timestamppb.New(order.CreatedAt.Time),
		UpdatedAt:         timestamppb.New(order.UpdatedAt.Time),
		SecretKey:         derefString(order.SecretKey),
		ProductOwner:      derefString(order.ProductOwner),
		PayoutPhoneNumber: derefString(order.PayoutPhoneNumber),
		DispatchedBy:      derefString(order.DispatchedBy),
		DeliveryFee: &types.Amount{
			Value:           derefFloat(order.DeliveryFeeAmount),
			CurrencyIsoCode: derefString(order.DeliveryFeeCurrency),
		},
		ServiceFee: &types.Amount{
			Value:           order.ServiceFeeAmount,
			CurrencyIsoCode: order.ServiceFeeCurrency,
		},
		TotalItems: order.TotalItems,
		OrderItems: previewItems,
	}
}

func SqlcUserOrderRowToProto(order sqlc.ListUserOrdersRow) *ordersgrpc.Order {

	// Convert price
	var price *types.Amount
	if order.PriceValue != nil && order.PriceCurrency != nil {
		price = &types.Amount{
			Value:           *order.PriceValue,
			CurrencyIsoCode: *order.PriceCurrency,
		}
	}

	// Convert status (string → enum)
	statusEnum := ordersgrpc.OrderStatus_OrderStatus_UNSPECIFIED
	switch order.Status {
	case ordersgrpc.OrderStatus_OrderStatus_CREATED.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_CREATED
	case ordersgrpc.OrderStatus_OrderStatus_PAYMENT_SUCCESSFUL.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_PAYMENT_SUCCESSFUL
	case ordersgrpc.OrderStatus_OrderStatus_PAYMENT_FAILED.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_PAYMENT_FAILED
	case ordersgrpc.OrderStatus_OrderStatus_IN_TRANSIT.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_IN_TRANSIT
	case ordersgrpc.OrderStatus_OrderStatus_DELIVERED.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_DELIVERED
	case ordersgrpc.OrderStatus_OrderStatus_APPROVED.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_APPROVED
	case ordersgrpc.OrderStatus_OrderStatus_REJECTED.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_REJECTED
	}

	// Convert preview item
	var previewItems []*ordersgrpc.OrderItem
	if order.PreviewProduct != "" {
		previewItems = []*ordersgrpc.OrderItem{
			{
				ProductId: order.PreviewProduct,
				Quantity:  int64(order.PreviewQuantity),
			},
		}
	}

	return &ordersgrpc.Order{
		OrderNumber: stringFromInt64(order.OrderNumber),
		DeliveryLocation: &types.Point{
			Address: order.DeliveryAddress,
			Lat:     order.DeliveryLocation.P.Y,
			Lon:     order.DeliveryLocation.P.X,
		},
		SumTotal:          price,
		Status:            statusEnum,
		Rating:            int32(order.Rating.Int.Int64()),
		Review:            order.Review,
		CreatedBy:         derefString(order.CreatedBy),
		CreatedAt:         timestamppb.New(order.CreatedAt.Time),
		UpdatedAt:         timestamppb.New(order.UpdatedAt.Time),
		SecretKey:         derefString(order.SecretKey),
		ProductOwner:      derefString(order.ProductOwner),
		PayoutPhoneNumber: derefString(order.PayoutPhoneNumber),
		DispatchedBy:      derefString(order.DispatchedBy),
		DeliveryFee: &types.Amount{
			Value:           derefFloat(order.DeliveryFeeAmount),
			CurrencyIsoCode: derefString(order.DeliveryFeeCurrency),
		},
		ServiceFee: &types.Amount{
			Value:           order.ServiceFeeAmount,
			CurrencyIsoCode: order.ServiceFeeCurrency,
		},
		TotalItems: order.TotalItems,
		OrderItems: previewItems,
	}
}

func SqlcFarmerOrderRowToProto(order sqlc.ListFarmerOrdersRow) *ordersgrpc.Order {

	// Convert price
	var price *types.Amount
	if order.PriceValue != nil && order.PriceCurrency != nil {
		price = &types.Amount{
			Value:           *order.PriceValue,
			CurrencyIsoCode: *order.PriceCurrency,
		}
	}

	// Convert status (string → enum)
	statusEnum := ordersgrpc.OrderStatus_OrderStatus_UNSPECIFIED
	switch order.Status {
	case ordersgrpc.OrderStatus_OrderStatus_CREATED.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_CREATED
	case ordersgrpc.OrderStatus_OrderStatus_PAYMENT_SUCCESSFUL.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_PAYMENT_SUCCESSFUL
	case ordersgrpc.OrderStatus_OrderStatus_PAYMENT_FAILED.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_PAYMENT_FAILED
	case ordersgrpc.OrderStatus_OrderStatus_IN_TRANSIT.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_IN_TRANSIT
	case ordersgrpc.OrderStatus_OrderStatus_DELIVERED.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_DELIVERED
	case ordersgrpc.OrderStatus_OrderStatus_APPROVED.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_APPROVED
	case ordersgrpc.OrderStatus_OrderStatus_REJECTED.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_REJECTED
	}

	// Convert preview item
	var previewItems []*ordersgrpc.OrderItem
	if order.PreviewProduct != "" {
		previewItems = []*ordersgrpc.OrderItem{
			{
				ProductId: order.PreviewProduct,
				Quantity:  int64(order.PreviewQuantity),
			},
		}
	}

	return &ordersgrpc.Order{
		OrderNumber: stringFromInt64(order.OrderNumber),
		DeliveryLocation: &types.Point{
			Address: order.DeliveryAddress,
			Lat:     order.DeliveryLocation.P.Y,
			Lon:     order.DeliveryLocation.P.X,
		},
		SumTotal:          price,
		Status:            statusEnum,
		Rating:            int32(order.Rating.Int.Int64()),
		Review:            order.Review,
		CreatedBy:         derefString(order.CreatedBy),
		CreatedAt:         timestamppb.New(order.CreatedAt.Time),
		UpdatedAt:         timestamppb.New(order.UpdatedAt.Time),
		SecretKey:         derefString(order.SecretKey),
		ProductOwner:      derefString(order.ProductOwner),
		PayoutPhoneNumber: derefString(order.PayoutPhoneNumber),
		DispatchedBy:      derefString(order.DispatchedBy),
		DeliveryFee: &types.Amount{
			Value:           derefFloat(order.DeliveryFeeAmount),
			CurrencyIsoCode: derefString(order.DeliveryFeeCurrency),
		},
		ServiceFee: &types.Amount{
			Value:           order.ServiceFeeAmount,
			CurrencyIsoCode: order.ServiceFeeCurrency,
		},
		TotalItems: order.TotalItems,
		OrderItems: previewItems,
	}
}

func SqlcOrderToProto(order sqlc.Order) *ordersgrpc.Order {

	// Convert price
	var price *types.Amount
	if order.PriceValue != nil && order.PriceCurrency != nil {
		price = &types.Amount{
			Value:           *order.PriceValue,
			CurrencyIsoCode: *order.PriceCurrency,
		}
	}

	// Convert status (string → enum)
	statusEnum := ordersgrpc.OrderStatus_OrderStatus_UNSPECIFIED
	switch order.Status {
	case ordersgrpc.OrderStatus_OrderStatus_CREATED.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_CREATED
	case ordersgrpc.OrderStatus_OrderStatus_PAYMENT_SUCCESSFUL.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_PAYMENT_SUCCESSFUL
	case ordersgrpc.OrderStatus_OrderStatus_PAYMENT_FAILED.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_PAYMENT_FAILED
	case ordersgrpc.OrderStatus_OrderStatus_IN_TRANSIT.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_IN_TRANSIT
	case ordersgrpc.OrderStatus_OrderStatus_DELIVERED.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_DELIVERED
	case ordersgrpc.OrderStatus_OrderStatus_APPROVED.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_APPROVED
	case ordersgrpc.OrderStatus_OrderStatus_REJECTED.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_REJECTED
	}

	return &ordersgrpc.Order{
		OrderNumber: stringFromInt64(order.OrderNumber),
		DeliveryLocation: &types.Point{
			Address: order.DeliveryAddress,
			Lat:     order.DeliveryLocation.P.Y,
			Lon:     order.DeliveryLocation.P.X,
		},
		SumTotal:          price,
		Status:            statusEnum,
		Rating:            int32(order.Rating.Int.Int64()),
		Review:            order.Review,
		CreatedBy:         derefString(order.CreatedBy),
		CreatedAt:         timestamppb.New(order.CreatedAt.Time),
		UpdatedAt:         timestamppb.New(order.UpdatedAt.Time),
		SecretKey:         derefString(order.SecretKey),
		ProductOwner:      derefString(order.ProductOwner),
		PayoutPhoneNumber: derefString(order.PayoutPhoneNumber),
		DispatchedBy:      derefString(order.DispatchedBy),
		DeliveryFee: &types.Amount{
			Value:           derefFloat(order.DeliveryFeeAmount),
			CurrencyIsoCode: derefString(order.DeliveryFeeCurrency),
		},
		ServiceFee: &types.Amount{
			Value:           order.ServiceFeeAmount,
			CurrencyIsoCode: order.ServiceFeeCurrency,
		},
	}
}

func SqlcOrdersToProto(orders []sqlc.ListOrdersRow) []*ordersgrpc.Order {
	result := make([]*ordersgrpc.Order, 0, len(orders))
	for _, order := range orders {
		result = append(result, SqlcOrderRowToProto(order))
	}
	return result
}

func SqlcFarmerOrdersToProto(orders []sqlc.ListFarmerOrdersRow) []*ordersgrpc.Order {
	result := make([]*ordersgrpc.Order, 0, len(orders))
	for _, order := range orders {
		result = append(result, SqlcFarmerOrderRowToProto(order))
	}
	return result
}

func SqlcUserOrdersToProto(orders []sqlc.ListUserOrdersRow) []*ordersgrpc.Order {
	result := make([]*ordersgrpc.Order, 0, len(orders))
	for _, order := range orders {
		result = append(result, SqlcUserOrderRowToProto(order))
	}
	return result
}

// Utility helpers

func derefString(s *string) string {
	if s != nil {
		return *s
	}
	return ""
}

func stringFromInt64(num int64) string {
	return fmt.Sprintf("%d", num)
}

func SqlcUserSubscriptionToProto(sub sqlc.UserSubscription) *ordersgrpc.UserSubscription {
	progress := 0.0
	if sub.Progress != nil {
		progress = *sub.Progress
	}

	var estimatedDeliveryTimeDays *int64
	if sub.EstimatedDeliveryTime.Valid {
		totalDays := int64(sub.EstimatedDeliveryTime.Months)*30 +
			int64(sub.EstimatedDeliveryTime.Days) +
			sub.EstimatedDeliveryTime.Microseconds/(24*60*60*OneMillion)
		estimatedDeliveryTimeDays = &totalDays
	}

	result := &ordersgrpc.UserSubscription{
		Id:                 fmt.Sprintf("%d", sub.ID),
		PublicId:           sub.PublicID,
		UserId:             sub.UserID,
		SubscriptionPlanId: sub.SubscriptionID,
		Active:             sub.Active,
		Progress:           progress,
		Amount: &types.Amount{
			Value:           float64(sub.Amount),
			CurrencyIsoCode: sub.CurrencyIsoCode,
		},
		IsCustom: sub.IsCustom,
	}

	if sub.CreatedAt.Valid {
		result.CreatedAt = timestamppb.New(sub.CreatedAt.Time)
	}
	if sub.UpdatedAt.Valid {
		result.UpdatedAt = timestamppb.New(sub.UpdatedAt.Time)
	}
	if sub.ExpiresAt.Valid {
		result.ExpiresAt = timestamppb.New(sub.ExpiresAt.Time)
	}
	if estimatedDeliveryTimeDays != nil {
		result.EstimatedDeliveryTimeDays = estimatedDeliveryTimeDays
	}
	if sub.DailyDeliveryLimit != nil {
		result.DailyDeliveryLimit = sub.DailyDeliveryLimit
	}
	if sub.DeliveryLocation.Valid || sub.DeliveryAddress != "" {
		result.DeliveryLocation = &types.Point{
			Lon:     sub.DeliveryLocation.P.X,
			Lat:     sub.DeliveryLocation.P.Y,
			Address: sub.DeliveryAddress,
		}
	}

	return result
}

func SqlcSubscriptionToProto(sub sqlc.Subscription, items []*ordersgrpc.SubscriptionItem) *ordersgrpc.Subscription {
	totalDays := int64(sub.Duration.Months)*30 +
		int64(sub.Duration.Days) +
		sub.Duration.Microseconds/(24*60*60*OneMillion)

	var estimatedDeliveryTimeDays *int64
	if sub.EstimatedDeliveryTime.Valid {
		totalEstDays := int64(sub.EstimatedDeliveryTime.Months)*30 +
			int64(sub.EstimatedDeliveryTime.Days) +
			sub.EstimatedDeliveryTime.Microseconds/(24*60*60*OneMillion)
		estimatedDeliveryTimeDays = &totalEstDays
	}

	result := &ordersgrpc.Subscription{
		Id:          sub.ID,
		Title:       sub.Title,
		Description: sub.Description,
		Duration:    int64(math.Round(float64(totalDays) / 7)), // Convert days to weeks
		Amount: &types.Amount{
			Value:           float64(sub.Amount),
			CurrencyIsoCode: sub.CurrencyIsoCode,
		},
		SubscriptionItems: items,
	}

	if sub.CreatedAt.Valid {
		result.CreatedAt = timestamppb.New(sub.CreatedAt.Time)
	}
	if sub.UpdatedAt.Valid {
		result.UpdatedAt = timestamppb.New(sub.UpdatedAt.Time)
	}
	if estimatedDeliveryTimeDays != nil {
		result.EstimatedDeliveryTimeDays = estimatedDeliveryTimeDays
	}

	return result
}

func SqlcToProtoOrderLog(sqlcOrderAuditLog sqlc.OrdersAudit) (*ordersgrpc.OrderAuditLog, error) {
	var before *ordersgrpc.Order
	if sqlcOrderAuditLog.Before != nil {
		before = &ordersgrpc.Order{}
		err := protojson.Unmarshal(sqlcOrderAuditLog.Before, before)
		if err != nil {
			return nil, fmt.Errorf("failed to unmarshal before order: %w", err)
		}
	}

	var after *ordersgrpc.Order
	if sqlcOrderAuditLog.After != nil {
		after = &ordersgrpc.Order{}
		err := protojson.Unmarshal(sqlcOrderAuditLog.After, after)
		if err != nil {
			return nil, fmt.Errorf("failed to unmarshal after order: %w", err)
		}
	}

	return &ordersgrpc.OrderAuditLog{
		Before:    before,
		After:     after,
		Timestamp: timestamppb.New(sqlcOrderAuditLog.EventTimestamp.Time),
		Actor:     sqlcOrderAuditLog.Actor,
		Action:    sqlcOrderAuditLog.Action,
		Reason:    sqlcOrderAuditLog.Reason,
	}, nil
}

func SqlcToProtoOrderAuditLogs(sqlcOrderAuditLogs []sqlc.OrdersAudit) (
	[]*ordersgrpc.OrderAuditLog, error) {
	protoOrderAuditLogs := make([]*ordersgrpc.OrderAuditLog, len(sqlcOrderAuditLogs))
	for i, t := range sqlcOrderAuditLogs {
		protoOrdeerAuditLog, err := SqlcToProtoOrderLog(t)
		if err != nil {
			return nil, err
		}
		protoOrderAuditLogs[i] = protoOrdeerAuditLog
	}
	return protoOrderAuditLogs, nil
}

func SqlcToProtoDeliveryPoints(sqlcDeliveryPoints []sqlc.DeliveryPoint) ([]*ordersgrpc.DeliveryPoint, error) {
	protoDeliveryPoints := make([]*ordersgrpc.DeliveryPoint, len(sqlcDeliveryPoints))

	for i, dp := range sqlcDeliveryPoints {
		protoDeliveryPoints[i] = &ordersgrpc.DeliveryPoint{
			Id: dp.ID,
			Address: &types.Point{
				Address: dp.LocationName,
				Lon:     dp.DeliveryLocation.P.X,
				Lat:     dp.DeliveryLocation.P.Y,
			},
			City:              dp.City,
			DeliveryPointName: dp.DeliveryPointName,
			CreatedAt:         timestamppb.New(dp.CreatedAt.Time),
		}
	}
	return protoDeliveryPoints, nil
}

func SqlcPaymentToProto(payment sqlc.Payment) *ordersgrpc.Payment {

	// Convert price
	var price *types.Amount
	if payment.AmountValue != nil && payment.AmountCurrency != nil {
		price = &types.Amount{
			Value:           *payment.AmountValue,
			CurrencyIsoCode: *payment.AmountCurrency,
		}
	}

	// Convert status (string → enum) — safe default
	var statusEnum ordersgrpc.PaymentStatus
	switch payment.Status {
	case ordersgrpc.PaymentStatus_PaymentStatus_INITIATED.String():
		statusEnum = ordersgrpc.PaymentStatus_PaymentStatus_INITIATED
		break
	case ordersgrpc.PaymentStatus_PaymentStatus_CANCELED.String():
		statusEnum = ordersgrpc.PaymentStatus_PaymentStatus_CANCELED
		break
	case ordersgrpc.PaymentStatus_PaymentStatus_COMPLETED.String():
		statusEnum = ordersgrpc.PaymentStatus_PaymentStatus_COMPLETED
		break
	case ordersgrpc.PaymentStatus_PaymentStatus_FAILED.String():
		statusEnum = ordersgrpc.PaymentStatus_PaymentStatus_FAILED
		break
	default:
		statusEnum = ordersgrpc.PaymentStatus_PaymentStatus_UNSPECIFIED
	}

	var entityEnum ordersgrpc.PaymentEntity

	switch payment.PaymentEntity {
	case ordersgrpc.PaymentEntity_PaymentEntity_ORDER.String():
		entityEnum = ordersgrpc.PaymentEntity_PaymentEntity_ORDER
		break
	case ordersgrpc.PaymentEntity_PaymentEntity_SUBSCRIPTION.String():
		entityEnum = ordersgrpc.PaymentEntity_PaymentEntity_SUBSCRIPTION
		break
	case ordersgrpc.PaymentEntity_PaymentEntity_COMMISSION.String():
		entityEnum = ordersgrpc.PaymentEntity_PaymentEntity_COMMISSION
		break
	case ordersgrpc.PaymentEntity_PaymentEntity_REFUND.String():
		entityEnum = ordersgrpc.PaymentEntity_PaymentEntity_REFUND
		break
	default:
		entityEnum = ordersgrpc.PaymentEntity_PaymentEntity_UNSPECIFIED
	}

	var paymentMethodEnum ordersgrpc.PaymentMethodType

	switch payment.Method {
	case ordersgrpc.PaymentMethodType_PaymentMethodType_CREDIT_CARD.String():
		paymentMethodEnum = ordersgrpc.PaymentMethodType_PaymentMethodType_CREDIT_CARD
		break
	case ordersgrpc.PaymentMethodType_PaymentMethodType_MOBILE_MONEY.String():
		paymentMethodEnum = ordersgrpc.PaymentMethodType_PaymentMethodType_MOBILE_MONEY
		break
	case ordersgrpc.PaymentMethodType_PaymentMethodType_ORANGE_MONEY.String():
		paymentMethodEnum = ordersgrpc.PaymentMethodType_PaymentMethodType_ORANGE_MONEY
	case ordersgrpc.PaymentMethodType_PaymentMethodType_ACCOUNT_BALANCE.String():
		paymentMethodEnum = ordersgrpc.PaymentMethodType_PaymentMethodType_ACCOUNT_BALANCE
	default:
		paymentMethodEnum = ordersgrpc.PaymentMethodType_PaymentMethodType_UNSPECIFIED
	}

	var paymentTypeEmun ordersgrpc.PaymentType

	switch payment.Type {
	case ordersgrpc.PaymentType_PaymentType_CREDIT.String():
		paymentTypeEmun = ordersgrpc.PaymentType_PaymentType_CREDIT
		break
	case ordersgrpc.PaymentType_PaymentType_DEBIT.String():
		paymentTypeEmun = ordersgrpc.PaymentType_PaymentType_DEBIT
		break
	default:
		paymentTypeEmun = ordersgrpc.PaymentType_PaymentType_UNSPECIFIED
	}

	return &ordersgrpc.Payment{
		Id:            payment.ID,
		EntityId:      payment.EntityID,
		PaymentEntity: entityEnum,
		Status:        statusEnum,
		Amount:        price,
		CreatedBy:     payment.CreatedBy,
		CreatedAt:     timestamppb.New(payment.CreatedAt.Time),
		ExpiresAt:     timestamppb.New(payment.ExpiresAt.Time),
		UpdatedAt:     timestamppb.New(payment.UpdatedAt.Time),
		Type:          paymentTypeEmun,
		Account: &ordersgrpc.Account{
			PaymentMethod: paymentMethodEnum,
			AccountNumber: payment.AccountNumber,
		},
	}
}

func SqlcPaymentsToProto(payments []sqlc.Payment) []*ordersgrpc.Payment {
	result := make([]*ordersgrpc.Payment, 0, len(payments))
	for _, payment := range payments {
		result = append(result, SqlcPaymentToProto(payment))
	}
	return result
}

func SqlcCommissionToProto(commission sqlc.Commission) *ordersgrpc.Commission {

	var paidAt *timestamppb.Timestamp

	if &commission.PaidAt != nil {
		paidAt = timestamppb.New(commission.PaidAt.Time)
	}

	return &ordersgrpc.Commission{
		Id:               commission.ID,
		ReferrerId:       derefString(&commission.ReferrerID),
		RefferedId:       derefString(&commission.ReferredID),
		OrderNumber:      commission.OrderNumber,
		PaymentReference: derefString(commission.PaymentReference),
		PaidAt:           paidAt,
		CommissionAmount: &types.Amount{
			Value:           commission.CommissionAmount,
			CurrencyIsoCode: commission.CurrencyCode,
		},
		CreatedAt: timestamppb.New(commission.CreatedAt.Time),
	}
}

func SqlcCommissionsToProtoCommissions(commissions []sqlc.Commission) []*ordersgrpc.Commission {
	result := make([]*ordersgrpc.Commission, 0, len(commissions))
	for _, commission := range commissions {
		result = append(result, SqlcCommissionToProto(commission))
	}
	return result
}

func SqlcToProtoAggregatedCommissions(commissions []sqlc.AggregateCommissionByReferrerRow) []*types.Amount {
	result := make([]*types.Amount, 0, len(commissions))

	for _, commission := range commissions {
		result = append(result, &types.Amount{
			Value:           float64(commission.TotalAmount),
			CurrencyIsoCode: commission.CurrencyCode,
		})
	}

	return result
}
