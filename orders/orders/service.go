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
	"github.com/foodhouse/foodhouseapp/grpc/go/productsgrpc"
	"github.com/foodhouse/foodhouseapp/grpc/go/types"
	"github.com/foodhouse/foodhouseapp/grpc/go/usersgrpc"
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
	"google.golang.org/protobuf/types/known/timestamppb"
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

	TotalPercentage = 1.08
)

var supportedCurrencies = map[string]struct{}{
	"XAF": {},
}

// Impl is the implementation of the products service.
type Impl struct {
	repo               repo.OrdersRepo
	logger             zerolog.Logger
	devMethodsEndabled bool
	paymentService     payment.PaymentProvider
	userService        usersgrpc.UsersClient
	productService     productsgrpc.ProductsClient
	ordersgrpc.UnsafeOrdersServer
}

var _ ordersgrpc.OrdersServer = (*Impl)(nil)

// NewOrders returns a new instance of the ordersImpl.
func NewOrders(
	repo repo.OrdersRepo,
	logger zerolog.Logger,
	enableDevMethods bool,
	paymentService payment.PaymentProvider,
	userService usersgrpc.UsersClient,
	productService productsgrpc.ProductsClient,
) *Impl {
	return &Impl{
		repo:               repo,
		logger:             logger,
		devMethodsEndabled: enableDevMethods,
		paymentService:     paymentService,
		userService:        userService,
		productService:     productService,
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
		*order.PayoutPhoneNumber, float64(testAmount),
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

// ConfirmPayment implements ordersgrpc.OrdersServer.
func (i *Impl) ConfirmPayment(ctx context.Context, req *ordersgrpc.ConfirmPaymentRequest) (*ordersgrpc.ConfirmPaymentResponse, error) {
	// TODO: add valiadation to confirm that request is coming from campay
	querier, tx, err := i.repo.Begin(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to begin transaction: %v", err)
	}

	i.logger.Debug().Msgf("payment id %v", req.GetExternalReference())
	i.logger.Debug().Msgf("payment status %v", req.GetStatus())

	// Proper rollback handling
	defer func() {
		err = tx.Rollback(ctx)
		if err != nil && !errors.Is(err, sql.ErrTxDone) {
			i.logger.Err(err).Msgf("Failed to rollback transaction: %v", req)
		}
	}()

	payment, err := querier.GetPaymentById(ctx, req.GetExternalReference())

	if err != nil {
		i.logger.Debug().Msgf("error getting payment %v", err)
		return nil, status.Errorf(codes.Internal, "error getting payment %v", err)
	}

	if payment.PaymentEntity == ordersgrpc.PaymentEntity_PaymentEntity_UNSPECIFIED.String() {
		return nil, status.Errorf(codes.InvalidArgument, "payment entity is unspecified")
	}

	// case for when payment is for an order
	if payment.PaymentEntity == ordersgrpc.PaymentEntity_PaymentEntity_ORDER.String() {
		orderId, err := strconv.ParseInt(payment.EntityID, 10, 64)

		if err != nil {
			return nil, status.Errorf(codes.Internal, "error parsing order id %v", err)
		}

		order, err := querier.GetOrderByOrderNumber(ctx, orderId)

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

		err = querier.UpdatePaymentStatus(ctx, sqlc.UpdatePaymentStatusParams{
			ID:     req.GetExternalReference(),
			Status: updatedPaymentStatus.String(),
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

		return &ordersgrpc.ConfirmPaymentResponse{}, nil
	}

	// case for when payment is for subscription
	if payment.PaymentEntity == ordersgrpc.PaymentEntity_PaymentEntity_SUBSCRIPTION.String() {
		i.logger.Debug().Msgf("user subscription id ", payment.EntityID)

		if err != nil {
			return nil, status.Errorf(codes.Internal, "error getting subscription %v", err)
		}

		if err != nil {
			i.logger.Debug().Msgf("error getting order for payment with ref %v, why: %v", req.GetExternalReference(), err)
			return nil, status.Errorf(codes.Internal, "error getting order for payment with ref %v, why: %v", req.GetExternalReference(), err)
		}

		if err != nil {
			return nil, status.Errorf(codes.Internal, "failed to marshal proto order: %v", err)
		}

		var updatedPaymentStatus ordersgrpc.PaymentStatus

		if req.GetStatus() != PaymentStatusSuccessful {
			_, err := i.userService.DeleteUserSubscription(ctx, &usersgrpc.DeleteUserSubscriptionRequest{
				UserSubscriptionId: payment.EntityID,
			})

			if err != nil {
				return nil, status.Errorf(codes.Internal, "error confirming payment %v", err)
			}

			err = tx.Commit(ctx)
			if err != nil {
				return nil, status.Errorf(codes.Internal, "failed to commit transaction: %v", err)
			}
			return &ordersgrpc.ConfirmPaymentResponse{}, nil
		}

		err = querier.UpdatePaymentStatus(ctx, sqlc.UpdatePaymentStatusParams{
			ID:     req.GetExternalReference(),
			Status: updatedPaymentStatus.String(),
		})

		if err != nil {
			i.logger.Debug().Msgf("Error updating payment status %v", err)
			return nil, status.Errorf(codes.Internal, "error updating payment status %v", err)
		}

		_, err = i.userService.ActivateUserSubscription(ctx, &usersgrpc.ActivateUserSubscriptionRequest{
			UserSubscriptionId: payment.EntityID,
		})

		if err != nil {
			return nil, status.Errorf(codes.Internal, "error confirming payment %v", err)
		}

		err = tx.Commit(ctx)
		if err != nil {
			return nil, status.Errorf(codes.Internal, "failed to commit transaction: %v", err)
		}

		return &ordersgrpc.ConfirmPaymentResponse{}, nil

	}

	return &ordersgrpc.ConfirmPaymentResponse{}, nil
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

	secretKey, err := generateHexSecretKey(6)

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error generating order secret key %v", err)
	}

	product, err := i.productService.GetProduct(ctx, &productsgrpc.GetProductRequest{
		ProductId: req.GetProductId(),
	})

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error getting product %v", err)
	}

	// Calculate totalAmount as float64 to avoid type mismatch
	totalAmount := float64(product.GetProduct().GetAmount().GetValue()) * float64(req.GetQuantity()) * TotalPercentage

	args := sqlc.CreateOrderParams{
		DeliveryLocation: pgtype.Point{P: pgtype.Vec2{X: float64(req.GetDeliveryLocation().GetLon()),
			Y: float64(req.GetDeliveryLocation().GetLat())},
			Valid: true},
		PriceValue:      totalAmount,
		PriceCurrency:   product.GetProduct().GetAmount().GetCurrencyIsoCode(),
		Status:          ordersgrpc.OrderStatus_OrderStatus_CREATED.String(),
		Product:         req.GetProductId(),
		CreatedBy:       req.UserId,
		SecretKey:       secretKey,
		ProductOwner:    product.GetProduct().GetCreatedBy(),
		DeliveryAddress: req.GetDeliveryLocation().GetAddress(),
		Quantity:        req.GetQuantity(),
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

	err = tx.Commit(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to commit transaction: %v", err)
	}

	return &ordersgrpc.DispatchOrderResponse{}, nil
}

// GetOrderDetails implements ordersgrpc.OrdersServer.
func (i *Impl) GetOrderDetails(ctx context.Context, req *ordersgrpc.GetOrderDetailsRequest) (*ordersgrpc.GetOrderDetailsResponse, error) {
	sqlcOrder, err := i.repo.Do().GetOrderByOrderNumber(ctx, req.GetOrderNumber())

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error getting order with number %v. why?: %v", req.GetOrderNumber(), err)
	}

	i.logger.Debug().Msgf("sqlc order: %v", sqlcOrder)

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
		Status:        req.GetStatus().String(),
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
		Status:        req.GetStatus().String(),
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

func IsSupportedCurrency(code string) bool {
	_, ok := supportedCurrencies[code]
	return ok
}

// InitiatePayment implements ordersgrpc.OrdersServer.
func (i *Impl) InitiatePayment(ctx context.Context, req *ordersgrpc.InitiatePaymentRequest) (*ordersgrpc.InitiatePaymentResponse, error) {

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

	if req.GetPaymentEntity() != ordersgrpc.PaymentEntity_PaymentEntity_ORDER && req.GetPaymentEntity() != ordersgrpc.PaymentEntity_PaymentEntity_SUBSCRIPTION {
		return nil, status.Errorf(codes.InvalidArgument, "invalid payment entity %s", req.GetPaymentEntity())
	}

	if req.GetAccount().PaymentMethod != ordersgrpc.PaymentMethodType_PaymentMethodType_MOBILE_MONEY && req.GetAccount().PaymentMethod != ordersgrpc.PaymentMethodType_PaymentMethodType_ORANGE_MONEY {
		return nil, status.Errorf(codes.Internal, "payment method %s not supported", req.GetAccount().GetPaymentMethod())
	}

	if _, ok := supportedCurrencies[req.GetAmount().GetCurrencyIsoCode()]; !ok {
		return nil, status.Errorf(codes.Internal, "currency %s is not supported", req.GetAmount().GetCurrencyIsoCode())
	}

	payment, err := querier.CreatePayment(ctx, sqlc.CreatePaymentParams{
		PaymentEntity:  req.GetPaymentEntity().String(),
		EntityID:       req.GetEntityId(),
		AmountValue:    &req.GetAmount().Value,
		AmountCurrency: &req.GetAmount().CurrencyIsoCode,
		AccountNumber:  req.GetAccount().GetAccountNumber(),
		Method:         req.GetAccount().GetPaymentMethod().String(),
		Status:         ordersgrpc.PaymentStatus_PaymentStatus_INITIATED.String(),
		ExpiresAt:      pgtype.Timestamptz{Time: time.Now().Add(5 * time.Minute), Valid: true},
		CreatedBy:      req.GetUserId(),
	})

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error creating payment %v", err)
	}

	formattedNumber, err := formatPhoneNumber(req.Account.GetAccountNumber())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid phone number: %v", err)
	}

	i.logger.Debug().Msgf("Formated number log %v", formattedNumber)

	supportedCurrencies := []string{"XAF"}
	currencySupported := false
	for _, c := range supportedCurrencies {
		currencySupported = req.GetAmount().GetCurrencyIsoCode() == c
		if currencySupported {
			break
		}
	}
	if !currencySupported {
		return nil, status.Errorf(codes.Internal, "currency %s is not supported", req.GetAmount().GetCurrencyIsoCode())
	}

	// TODO: revert to actual amount when live
	// _, err = i.paymentService.RequestPayment(ctx, formattedNumber, *payment.AmountValue, *payment.AmountCurrency, fmt.Sprintf("payment for entity: %s  with id: %s", req.GetPaymentEntity(), req.GetEntityId()), &payment.ID)

	// Using test amount while in sandbox mode

	testAmount := float64(10)
	_, err = i.paymentService.RequestPayment(ctx, formattedNumber, testAmount, "XAF", fmt.Sprintf("payment for entity: %s  with id: %s", req.GetPaymentEntity(), req.GetEntityId()), &payment.ID)

	if err != nil {
		i.logger.Debug().Msgf("payment error %v", err)
		return nil, status.Errorf(codes.Internal, "error initiating payment %v", err)
	}

	err = tx.Commit(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to commit transaction: %v", err)
	}

	return &ordersgrpc.InitiatePaymentResponse{
		Payment: &ordersgrpc.Payment{
			Id: payment.PaymentEntity,
			Amount: &types.Amount{
				Value:           *payment.AmountValue,
				CurrencyIsoCode: *payment.AmountCurrency,
			},
			ExpiresAt: timestamppb.New(payment.ExpiresAt.Time),
		},
	}, nil
}

// ApproveOrder implements ordersgrpc.OrdersServer.
func (i *Impl) ApproveOrder(ctx context.Context, req *ordersgrpc.ApproveOrderRequest) (*ordersgrpc.ApproveOrderResponse, error) {

	orderNumber, err := strconv.ParseInt(req.GetOrderId(), 10, 64)

	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid order number %s", req.GetOrderId())
	}

	order, err := i.repo.Do().GetOrderByOrderNumber(ctx, orderNumber)

	if err != nil {
		i.logger.Debug().Msgf("error getting order with id %s why: %v", req.GetOrderId(), err)
		return nil, status.Errorf(codes.Internal, "error getting order with id %s why: %v", req.GetOrderId(), err)
	}

	beforeBytes, err := protojson.Marshal(converters.SqlcOrderToProto(order))
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to marshal proto order: %v", err)
	}

	err = i.repo.Do().UpdateOrderStatus(ctx, sqlc.UpdateOrderStatusParams{
		OrderNumber: order.OrderNumber,
		Status:      ordersgrpc.OrderStatus_OrderStatus_APPROVED.String(),
	})

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error updating order status %v", err)
	}

	updatedOrder, err := i.repo.Do().GetOrderByOrderNumber(ctx, order.OrderNumber)

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error getting updated order %v", err)
	}

	afterBytes, err := protojson.Marshal(converters.SqlcOrderToProto(updatedOrder))

	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to marshal proto order: %v", err)
	}

	err = i.repo.Do().CreateOrderAuditLog(ctx, sqlc.CreateOrderAuditLogParams{
		OrderNumber:    order.OrderNumber,
		EventTimestamp: pgtype.Timestamptz{Time: time.Now(), Valid: true},
		Actor:          req.GetUserId(),
		Action:         "ApproveOrder",
		Reason:         "Farmer has approved this order, and they are processing it",
		Before:         beforeBytes,
		After:          afterBytes,
	})

	if err != nil {
		i.logger.Debug().Msgf("Error creating order logs %v", err)
		return nil, status.Errorf(codes.Internal, "error creating order logs %v", err)
	}

	return &ordersgrpc.ApproveOrderResponse{}, nil
}

// CreateDeliveryPoint implements ordersgrpc.OrdersServer.
func (i *Impl) CreateDeliveryPoint(ctx context.Context, req *ordersgrpc.CreateDeliveryPointRequest) (*ordersgrpc.CreateDeliveryPointResponse, error) {
	deliveryPoint, err := i.repo.Do().CreateDeliveryPoint(ctx, sqlc.CreateDeliveryPointParams{
		DeliveryLocation: pgtype.Point{P: pgtype.Vec2{X: float64(req.GetAddress().GetLon()),
			Y: float64(req.GetAddress().GetLat())},
			Valid: true},
		LocationName:      req.GetAddress().GetAddress(),
		DeliveryPointName: req.GetDeliveryPointName(),
		City:              req.GetCity(),
	})

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error creating delivery point %v", err)
	}

	return &ordersgrpc.CreateDeliveryPointResponse{
		DeliveryPoint: &ordersgrpc.DeliveryPoint{
			Id: deliveryPoint.ID,
			Address: &types.Point{
				Address: deliveryPoint.LocationName,
				Lon:     deliveryPoint.DeliveryLocation.P.X,
				Lat:     deliveryPoint.DeliveryLocation.P.Y,
			},
			City:              deliveryPoint.City,
			DeliveryPointName: deliveryPoint.DeliveryPointName,
			CreatedAt:         timestamppb.New(deliveryPoint.CreatedAt.Time),
		},
	}, nil
}

// ListDeliveryPoints implements ordersgrpc.OrdersServer.
func (i *Impl) ListDeliveryPoints(ctx context.Context, req *ordersgrpc.ListDeliveryPointsRequest) (*ordersgrpc.ListDeliveryPointsResponse, error) {
	var err error
	startKey := time.Now().Add(time.Hour)

	count := int(req.GetCount())

	if count == 0 {
		count = 10
	}

	if req.GetStartKey() != "" {
		startKey, err = time.Parse(time.RFC3339, req.GetStartKey())
		if err != nil {
			return nil, status.Errorf(codes.InvalidArgument, "Invalid start key")
		}
	}

	args := sqlc.ListDeliveryPointsParams{
		City:          req.GetCity(),
		CreatedBefore: startKey,
		Count:         int32(count),
	}

	deliveryPoints, err := i.repo.Do().ListDeliveryPoints(ctx, args)

	if err != nil {
		return nil, status.Errorf(codes.Internal, "errror fetching products %v", err)
	}

	protoDeliveryPoints, err := converters.SqlcToProtoDeliveryPoints(deliveryPoints)

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error converting sqlc to proto delivery points %v", err)
	}

	nextKey := ""

	if len(protoDeliveryPoints) >= count {
		nextKey = protoDeliveryPoints[len(protoDeliveryPoints)-1].GetCreatedAt().AsTime().Format(time.RFC3339)
	}

	return &ordersgrpc.ListDeliveryPointsResponse{
		DeliveryPoints: protoDeliveryPoints,
		NextKey:        nextKey,
	}, nil
}

// ListDeliveryCities implements ordersgrpc.OrdersServer.
func (i *Impl) ListDeliveryCities(ctx context.Context, req *ordersgrpc.ListDeliveryCitiesRequest) (*ordersgrpc.ListDeliveryCitiesResponse, error) {
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

	// args := sqlc.ListUniqueCitiesParams{
	// 	CreatedBefore: startKey,
	// 	Count:         int32(count), // Convert count to int32
	// }

	cities, err := i.repo.Do().ListUniqueCities(ctx)

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error lissting cities %v", err)
	}

	return &ordersgrpc.ListDeliveryCitiesResponse{
		Cities: cities,
	}, nil
}
