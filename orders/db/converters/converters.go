package converters

import (
	"fmt"

	"github.com/foodhouse/foodhouseapp/grpc/go/ordersgrpc"
	"github.com/foodhouse/foodhouseapp/grpc/go/types"
	"github.com/foodhouse/foodhouseapp/orders/db/sqlc"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func SqlcOrderToProto(order sqlc.Order) *ordersgrpc.Order {

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
	case "OrderStatus_CREATED":
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_CREATED
	case "OrderStatus_PAYMENT_SUCCESSFUL":
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_PAYMENT_SUCCESSFUL
	case "OrderStatus_PAYMENT_FAILED":
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_PAYMENT_FAILED
	case "OrderStatus_IN_TRANSIT":
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_IN_TRANSIT
	case "OrderStatus_DELIVERED":
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_DELIVERED
	case "OrderStatus_APPROVED":
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_APPROVED
	}

	return &ordersgrpc.Order{
		OrderNumber: stringFromInt64(order.OrderNumber),
		DeliveryLocation: &types.Point{
			Address: order.DeliveryAddress,
			Lat:     order.DeliveryLocation.P.Y,
			Lon:     order.DeliveryLocation.P.X,
		},
		Price:             price,
		Status:            statusEnum,
		Rating:            int32(order.Rating.Int.Int64()),
		Review:            order.Review,
		Product:           derefString(order.Product),
		CreatedBy:         derefString(order.CreatedBy),
		CreatedAt:         timestamppb.New(order.CreatedAt.Time),
		UpdatedAt:         timestamppb.New(order.UpdatedAt.Time),
		SecretKey:         derefString(order.SecretKey),
		ProductOwner:      derefString(order.ProductOwner),
		PayoutPhoneNumber: derefString(order.PayoutPhoneNumber),
		Quantity:          int64(*order.Quantity),
	}
}

func SqlcOrdersToProto(orders []sqlc.Order) []*ordersgrpc.Order {
	result := make([]*ordersgrpc.Order, 0, len(orders))
	for _, order := range orders {
		result = append(result, SqlcOrderToProto(order))
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
	default:
		paymentMethodEnum = ordersgrpc.PaymentMethodType_PaymentMethodType_UNSPECIFIED
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
