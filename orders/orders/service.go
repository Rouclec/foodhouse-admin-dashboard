package orders

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/foodhouse/foodhouseapp/grpc/go/ordersgrpc"
	"github.com/foodhouse/foodhouseapp/orders/db/converters"
	"github.com/foodhouse/foodhouseapp/orders/db/repo"
	"github.com/foodhouse/foodhouseapp/orders/db/sqlc"
	"github.com/foodhouse/foodhouseapp/payment"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/nyaruka/phonenumbers"
	"github.com/rs/zerolog"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/encoding/protojson"
)

const (

	// DailySMSLimit is the maximum number of times a particular phone number can receive SMSs from the service.
	DailySMSLimit = 20

	MinimumPasswordLength = 12

	VerifyEmail = "VERIFY_EMAIL"

	ResetPassword = "RESET_PASSWORD"

	OneMillion = 1000000

	PaymentStatusSuccessful = "SUCCESSFUL"

	PaymentStatusFailed = "FAILED"
)

// Impl is the implementation of the products service.
type Impl struct {
	repo               repo.OrdersRepo
	logger             zerolog.Logger
	devMethodsEndabled bool
	paymentService     payment.PaymentProvider

	ordersgrpc.UnsafeOrdersServer
}

var _ ordersgrpc.OrdersServer = (*Impl)(nil)

// NewOrders returns a new instance of the ordersImpl.
func NewOrders(
	repo repo.OrdersRepo,
	logger zerolog.Logger,
	enableDevMethods bool,
	paymentService payment.PaymentProvider,
) *Impl {
	return &Impl{
		repo:               repo,
		logger:             logger,
		devMethodsEndabled: enableDevMethods,
		paymentService:     paymentService,
	}
}

// ConfirmDelivery implements ordersgrpc.OrdersServer.
func (i *Impl) ConfirmDelivery(ctx context.Context, req *ordersgrpc.ConfirmDeliveryRequest) (*ordersgrpc.ConfirmDeliveryResponse, error) {
	querier, tx, err := i.repo.Begin(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to begin transaction: %v", err)
	}

	i.logger.Debug().Msgf("secret key %v", req.GetSecretKey())

	// Proper rollback handling
	defer func() {
		err = tx.Rollback(ctx)
		if err != nil && !errors.Is(err, sql.ErrTxDone) {
			i.logger.Err(err).Msgf("Failed to rollback transaction: %v", req)
		}
	}()

	order, err := querier.GetUserOrderBySecretKey(ctx, sqlc.GetUserOrderBySecretKeyParams{
		CreatedBy: &req.UserId,
		SecretKey: &req.SecretKey,
	})

	if err != nil {
		i.logger.Debug().Msgf("error getting order with secret key %v why: %v", req.GetSecretKey(), err)
		return nil, status.Errorf(codes.Internal, "error getting order with secret key %v why: %v", req.GetSecretKey(), err)
	}

	beforeBytes, err := protojson.Marshal(converters.SqlcOrderToProto(order))
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to marshal proto order: %v", err)
	}

	paymentReference := fmt.Sprintf("payount-%s-%s", strconv.FormatInt(order.OrderNumber, 10), time.Now().Format("20060102150405"))
	testAmount := 10

	i.logger.Debug().Msgf("payout phone number %v", *order.PayoutPhoneNumber)

	_, err = i.paymentService.WithdrawFunds(ctx,
		*order.PayoutPhoneNumber, int64(testAmount),
		*order.PriceCurrency, fmt.Sprintf("payment for order %v", order.OrderNumber),
		&paymentReference)

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error making payout %v", err)
	}

	err = querier.UpdateOrderStatus(ctx, sqlc.UpdateOrderStatusParams{
		OrderNumber: order.OrderNumber,
		Status:      ordersgrpc.OrderStatus_OrderStatus_DELIVERED.String(),
	})

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error updating order status %v", err)
	}

	updatedOrder, err := querier.GetOrderByOrderNumber(ctx, order.OrderNumber)

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error getting updated order %v", err)
	}

	afterBytes, err := protojson.Marshal(converters.SqlcOrderToProto(updatedOrder))

	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to marshal proto order: %v", err)
	}

	err = querier.CreateOrderAuditLog(ctx, sqlc.CreateOrderAuditLogParams{
		OrderNumber:    order.OrderNumber,
		EventTimestamp: pgtype.Timestamptz{Time: time.Now(), Valid: true},
		Actor:          req.GetUserId(),
		Action:         "ConfirmDelivery",
		Reason:         "Confirming that the delivery has been made",
		Before:         beforeBytes,
		After:          afterBytes,
	})

	if err != nil {
		i.logger.Debug().Msgf("Error creating order logs %v", err)
		return nil, status.Errorf(codes.Internal, "error creating order logs %v", err)
	}

	err = tx.Commit(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to commit transaction: %v", err)
	}

	return &ordersgrpc.ConfirmDeliveryResponse{}, nil
}

// ConfirmOrderPayment implements ordersgrpc.OrdersServer.
func (i *Impl) ConfirmOrderPayment(ctx context.Context, req *ordersgrpc.ConfirmOrderPaymentRequest) (*ordersgrpc.ConfirmOrderPaymentResponse, error) {
	querier, tx, err := i.repo.Begin(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to begin transaction: %v", err)
	}

	i.logger.Debug().Msgf("external ref %v", req.GetExternalReference())
	i.logger.Debug().Msgf("payment status %v", req.GetStatus())

	// Proper rollback handling
	defer func() {
		err = tx.Rollback(ctx)
		if err != nil && !errors.Is(err, sql.ErrTxDone) {
			i.logger.Err(err).Msgf("Failed to rollback transaction: %v", req)
		}
	}()

	payment, err := querier.GetPaymentByExternalReference(ctx, req.GetExternalReference())

	if err != nil {
		i.logger.Debug().Msgf("error getting payment %v", err)
		return nil, status.Errorf(codes.Internal, "error getting payment %v", err)
	}

	order, err := querier.GetOrderByOrderNumber(ctx, payment.OrderNumber)

	if err != nil {
		i.logger.Debug().Msgf("error getting order for payment with ref %v, why: %v", req.GetExternalReference(), err)
		return nil, status.Errorf(codes.Internal, "error getting order for payment with ref %v, why: %v", req.GetExternalReference(), err)
	}

	beforeBytes, err := protojson.Marshal(converters.SqlcOrderToProto(order))

	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to marshal proto order: %v", err)
	}

	var updatedPaymentStatus ordersgrpc.PaymentStatus
	var updatedOrderStatus ordersgrpc.OrderStatus

	if req.GetStatus() == PaymentStatusSuccessful {
		updatedPaymentStatus = ordersgrpc.PaymentStatus_PaymentStatus_COMPLETED
		updatedOrderStatus = ordersgrpc.OrderStatus_OrderStatus_PAYMENT_SUCCESSFUL
	} else {
		updatedPaymentStatus = ordersgrpc.PaymentStatus_PaymentStatus_FAILED
		updatedOrderStatus = ordersgrpc.OrderStatus_OrderStatus_PAYMENT_FAILED
	}

	err = querier.UpdatePaymentStatusByExternalReference(ctx, sqlc.UpdatePaymentStatusByExternalReferenceParams{
		ExternalRef: req.GetExternalReference(),
		Status:      updatedPaymentStatus.String(),
	})

	if err != nil {
		i.logger.Debug().Msgf("Error updating payment status %v", err)
		return nil, status.Errorf(codes.Internal, "error updating payment status %v", err)
	}

	err = querier.UpdateOrderStatus(ctx, sqlc.UpdateOrderStatusParams{
		OrderNumber: order.OrderNumber,
		Status:      updatedOrderStatus.String(),
	})

	if err != nil {
		i.logger.Debug().Msgf("Error updating order status %v", err)
		return nil, status.Errorf(codes.Internal, "error updating order status %v", err)
	}

	updatedOrder, err := querier.GetOrderByOrderNumber(ctx, order.OrderNumber)

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error getting updated order %v", err)
	}

	afterBytes, err := protojson.Marshal(converters.SqlcOrderToProto(updatedOrder))

	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to marshal proto order: %v", err)
	}

	err = querier.CreateOrderAuditLog(ctx, sqlc.CreateOrderAuditLogParams{
		OrderNumber:    order.OrderNumber,
		EventTimestamp: pgtype.Timestamptz{Time: time.Now(), Valid: true},
		Actor:          "campay",
		Action:         "ConfirmOrderPayment",
		Reason:         "Payment webhook has returned",
		Before:         beforeBytes,
		After:          afterBytes,
	})

	err = tx.Commit(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to commit transaction: %v", err)
	}

	return &ordersgrpc.ConfirmOrderPaymentResponse{}, nil
}

// CreateOrder implements ordersgrpc.OrdersServer.
func (i *Impl) CreateOrder(ctx context.Context, req *ordersgrpc.CreateOrderRequest) (*ordersgrpc.CreateOrderResponse, error) {
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

	secretKey, err := generateHexSecretKey(3)

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error generating order secret key %v", err)
	}

	testAmount := int64(100)

	args := sqlc.CreateOrderParams{
		DeliveryLocation: pgtype.Point{P: pgtype.Vec2{X: float64(req.GetOrder().GetDeliveryLocation().GetLon()),
			Y: float64(req.GetOrder().GetDeliveryLocation().GetLat())},
			Valid: true},
		// PriceValue:    &req.GetOrder().GetPrice().Value,
		PriceValue:        testAmount, // TODO: this is for testing, use actual amount in production
		PriceCurrency:     req.GetOrder().GetPrice().CurrencyIsoCode,
		Status:            ordersgrpc.OrderStatus_OrderStatus_CREATED.String(),
		Product:           req.GetOrder().Product,
		CreatedBy:         req.UserId,
		SecretKey:         secretKey,
		ProductOwner:      req.GetOrder().ProductOwner,
		PayoutPhoneNumber: req.GetOrder().GetPayoutPhoneNumber(),
	}

	i.logger.Debug().Msgf("argurments %v", args)
	order, err := querier.CreateOrder(ctx, args)

	if err != nil {
		i.logger.Debug().Msgf("Error creating order %v", err)
		return nil, status.Errorf(codes.Internal, "error creating order %v", err)
	}

	afterBytes, err := protojson.Marshal(converters.SqlcOrderToProto(order))
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to marshal proto order: %v", err)
	}

	err = querier.CreateOrderAuditLog(ctx, sqlc.CreateOrderAuditLogParams{
		OrderNumber:    order.OrderNumber,
		EventTimestamp: pgtype.Timestamptz{Time: time.Now(), Valid: true},
		Actor:          req.GetUserId(),
		Action:         "CreateOrder",
		Reason:         "",
		Before:         nil,
		After:          afterBytes,
	})

	if err != nil {
		i.logger.Debug().Msgf("Error creating order logs %v", err)
		return nil, status.Errorf(codes.Internal, "error creating order logs %v", err)
	}

	payment, err := querier.CreatePayment(ctx, sqlc.CreatePaymentParams{
		OrderNumber:   order.OrderNumber,
		PriceValue:    order.PriceValue,
		PriceCurrency: order.PriceCurrency,
		Status:        ordersgrpc.PaymentStatus_PaymentStatus_INITIATED.String(),
		ExternalRef:   fmt.Sprintf("%s-%s", strconv.FormatInt(order.OrderNumber, 10), time.Now().Format("20060102150405")),
	})

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error creating payment %v", err)
	}

	formattedNumber, err := formatPhoneNumber(req.GetPhoneNumber())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid phone number: %v", err)
	}

	i.logger.Debug().Msgf("Formated number %v", formattedNumber)

	_, err = i.paymentService.RequestPayment(ctx, formattedNumber, *payment.PriceValue, *payment.PriceCurrency, fmt.Sprintf("payment for order %s", strconv.FormatInt(order.OrderNumber, 10)), &payment.ExternalRef)

	if err != nil {
		i.logger.Debug().Msgf("payment error %v", err)
		return nil, status.Errorf(codes.Internal, "error initiating payment %v", err)
	}

	err = tx.Commit(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to commit transaction: %v", err)
	}

	return &ordersgrpc.CreateOrderResponse{
		Order: &ordersgrpc.Order{
			OrderNumber: strconv.FormatInt(order.OrderNumber, 10),
			SecretKey:   *order.SecretKey,
			Status:      ordersgrpc.OrderStatus(ordersgrpc.OrderStatus_value[order.Status]),
		},
	}, nil
}

// DispatchOrder implements ordersgrpc.OrdersServer.
func (i *Impl) DispatchOrder(ctx context.Context, req *ordersgrpc.DispatchOrderRequest) (*ordersgrpc.DispatchOrderResponse, error) {
	order, err := i.repo.Do().GetOrderByOrderNumber(ctx, req.GetOrderNumber())

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error getting order %v", err)
	}

	beforeBytes, err := protojson.Marshal(converters.SqlcOrderToProto(order))

	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to marshal proto order: %v", err)
	}

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

	if order.Status != ordersgrpc.OrderStatus_OrderStatus_PAYMENT_SUCCESSFUL.String() {
		return nil, status.Errorf(codes.Internal, "order must be in status %v to be dispatched", ordersgrpc.OrderStatus_OrderStatus_PAYMENT_SUCCESSFUL)
	}

	err = querier.UpdateOrderStatus(ctx, sqlc.UpdateOrderStatusParams{
		OrderNumber: req.GetOrderNumber(),
		Status:      ordersgrpc.OrderStatus_OrderStatus_IN_TRANSIT.String(),
	})

	updatedOrder, err := querier.GetOrderByOrderNumber(ctx, order.OrderNumber)

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error getting updated order %v", err)
	}

	afterBytes, err := protojson.Marshal(converters.SqlcOrderToProto(updatedOrder))

	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to marshal proto order: %v", err)
	}

	err = querier.CreateOrderAuditLog(ctx, sqlc.CreateOrderAuditLogParams{
		OrderNumber:    order.OrderNumber,
		EventTimestamp: pgtype.Timestamptz{Time: time.Now(), Valid: true},
		Actor:          req.GetUserId(),
		Action:         "DispatchOrder",
		Reason:         "Order is now in transit",
		Before:         beforeBytes,
		After:          afterBytes,
	})

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error dispatching order %v", err)
	}

	return &ordersgrpc.DispatchOrderResponse{}, nil
}

// GetOrderDetails implements ordersgrpc.OrdersServer.
func (i *Impl) GetOrderDetails(ctx context.Context, req *ordersgrpc.GetOrderDetailsRequest) (*ordersgrpc.GetOrderDetailsResponse, error) {
	sqlcOrder, err := i.repo.Do().GetOrderByOrderNumber(ctx, req.GetOrderNumber())

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error getting order with number %v. why?: %v", req.GetOrderNumber(), err)
	}

	i.logger.Debug().Msgf("sqlc order %v", sqlcOrder)

	sqlcAuditLogs, err := i.repo.Do().ListOrderAuditLogs(ctx, req.GetOrderNumber())

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error fetching audit logs %v", err)
	}

	protoAuditLogs, err := converters.SqlcToProtoOrderAuditLogs(sqlcAuditLogs)

	if err != nil {
		i.logger.Debug().Msgf("error converting sqlc to proto audit logs %v", err)
		return nil, status.Errorf(codes.Internal, "error converting sqlc to proto audit logs %v", err)
	}

	return &ordersgrpc.GetOrderDetailsResponse{
		Order:    converters.SqlcOrderToProto(sqlcOrder),
		AuditLog: protoAuditLogs,
	}, nil
}

// HealthCheck implements ordersgrpc.OrdersServer.
func (i *Impl) HealthCheck(context.Context, *ordersgrpc.HealthCheckRequest) (*ordersgrpc.HealthCheckResponse, error) {
	return &ordersgrpc.HealthCheckResponse{}, nil
}

// ListFarmerOrders implements ordersgrpc.OrdersServer.
func (i *Impl) ListFarmerOrders(ctx context.Context, req *ordersgrpc.ListFarmerOrdersRequest) (*ordersgrpc.ListFarmerOrdersResponse, error) {
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

	orders, err := i.repo.Do().ListFarmerOrders(ctx, sqlc.ListFarmerOrdersParams{
		ProductOwner:  &req.FarmerId,
		CreatedBefore: startKey,
		Count:         int32(count), // Convert count to int32
	})

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error getting orders %v", err)
	}

	protoOrders := converters.SqlcOrdersToProto(orders)

	nextKey := ""

	i.logger.Debug().Msgf("Count %v, orders length %v", count, len(protoOrders))

	if len(protoOrders) >= count {
		nextKey = protoOrders[len(protoOrders)-1].GetCreatedAt().AsTime().Format(time.RFC3339)
	}
	return &ordersgrpc.ListFarmerOrdersResponse{
		Orders:  protoOrders,
		NextKey: nextKey,
	}, nil
}

// ListUserOrders implements ordersgrpc.OrdersServer.
func (i *Impl) ListUserOrders(ctx context.Context, req *ordersgrpc.ListUserOrdersRequest) (*ordersgrpc.ListUserOrdersResponse, error) {
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

	orders, err := i.repo.Do().ListUserOrders(ctx, sqlc.ListUserOrdersParams{
		CreatedBy:     &req.UserId,
		CreatedBefore: startKey,
		Count:         int32(count), // Convert count to int32
	})

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error getting orders %v", err)
	}

	protoOrders := converters.SqlcOrdersToProto(orders)

	nextKey := ""

	i.logger.Debug().Msgf("Count %v, orders length %v", count, len(protoOrders))

	if len(protoOrders) >= count {
		nextKey = protoOrders[len(protoOrders)-1].GetCreatedAt().AsTime().Format(time.RFC3339)
	}
	return &ordersgrpc.ListUserOrdersResponse{
		Orders:  protoOrders,
		NextKey: nextKey,
	}, nil
}

func generateHexSecretKey(length int) (string, error) {
	bytes := make([]byte, length) // length is in bytes, hex string will be twice as long
	_, err := rand.Read(bytes)
	if err != nil {
		return "", err
	}
	return strings.ToUpper(hex.EncodeToString(bytes)), nil
}

func formatPhoneNumber(phoneNumber string) (string, error) {
	parsedNumber, err := phonenumbers.Parse(phoneNumber, "+1")
	if err != nil {
		return "", status.Errorf(codes.InvalidArgument, "Error validating phone number: %v", err)
	}

	// Check if the number is valid
	if !phonenumbers.IsValidNumber(parsedNumber) {
		return "", status.Errorf(codes.InvalidArgument, "Invalid phone number: %s", parsedNumber)
	}

	return phonenumbers.Format(parsedNumber, phonenumbers.E164), nil
}
