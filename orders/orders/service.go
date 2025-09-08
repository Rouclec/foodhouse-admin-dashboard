package orders

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"strconv"
	"strings"
	"time"

	"github.com/foodhouse/foodhouseapp/email"
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

	TPWPaymentStatusCompleted = "COMPLETED"

	TPWPaymentStatusFailed = "FAILED"

	TotalPercentage = 1.10

	RefundPercentage = 0.95

	FarmersPercentage = 0.9

	// agent commission 30% * 20%
	ReferralCommissionPercentage = 0.06

	CENT = 100
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
	emailSender        EmailSender
	companyEmail       string
	companyPhone       string
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
	emailSender EmailSender,
	companyEmail string,
	companyPhone string,
) *Impl {
	return &Impl{
		repo:               repo,
		logger:             logger,
		devMethodsEndabled: enableDevMethods,
		paymentService:     paymentService,
		userService:        userService,
		productService:     productService,
		emailSender:        emailSender,
		companyEmail:       companyEmail,
		companyPhone:       companyPhone,
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

	if order.Status != ordersgrpc.OrderStatus_OrderStatus_IN_TRANSIT.String() {
		return nil, status.Errorf(codes.Internal, "order must be in status %v for delivery to be confirmed", ordersgrpc.OrderStatus_OrderStatus_IN_TRANSIT.String())
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

func Last4Chars(s string) string {
	if len(s) < 4 {
		return s
	}
	return s[len(s)-4:]
}

func GenerateReceiptNumber(orderNumber int64) string {
	today := time.Now().Format("20060102") // YYYYMMDD
	return fmt.Sprintf("RCT-%s-%03d", today, orderNumber)
}

func CleanLabel(input string, prefixToRemove string) string {
	// Step 1: Remove prefix if present
	clean := strings.TrimPrefix(input, prefixToRemove)

	// Step 2: Replace underscores with spaces
	clean = strings.ReplaceAll(clean, "_", " ")

	// Step 3: Capitalize first letter
	if len(clean) == 0 {
		return ""
	}
	return strings.ToUpper(string(clean[0])) + clean[1:]
}

// ConfirmPayment implements ordersgrpc.OrdersServer.
func (i *Impl) ConfirmPayment(ctx context.Context, req *ordersgrpc.ConfirmPaymentRequest) (*ordersgrpc.ConfirmPaymentResponse, error) {
	querier, tx, err := i.repo.Begin(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to begin transaction: %v", err)
	}

	i.logger.Debug().Msgf("TPW request body: %v", req)
	i.logger.Debug().Msgf("payment id %v", req.GetOrderId())
	i.logger.Debug().Msgf("payment status %v", req.GetStatus())

	// Proper rollback handling
	defer func() {
		err = tx.Rollback(ctx)
		if err != nil && !errors.Is(err, sql.ErrTxDone) {
			i.logger.Err(err).Msgf("Failed to rollback transaction: %v", req)
		}
	}()

	payment, err := querier.GetPaymentByEntity(ctx, sqlc.GetPaymentByEntityParams{
		// req.GetReference(),
		PaymentEntity: ordersgrpc.PaymentEntity_PaymentEntity_ORDER.String(), // TODO: assuming that we only need this webhook for orders.
		EntityID:      req.GetOrderId(),
	})

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
			i.logger.Debug().Msgf("error getting order for payment with ref %v, why: %v", payment.ID, err)
			return nil, status.Errorf(codes.Internal, "error getting order for payment with ref %v, why: %v", payment.ID, err)
		}

		beforeBytes, err := protojson.Marshal(converters.SqlcOrderToProto(order))

		if err != nil {
			return nil, status.Errorf(codes.Internal, "failed to marshal proto order: %v", err)
		}

		var updatedPaymentStatus ordersgrpc.PaymentStatus
		var updatedOrderStatus ordersgrpc.OrderStatus
		shouldSendReceipt := false

		if req.GetStatus() == TPWPaymentStatusCompleted {
			updatedPaymentStatus = ordersgrpc.PaymentStatus_PaymentStatus_COMPLETED
			updatedOrderStatus = ordersgrpc.OrderStatus_OrderStatus_PAYMENT_SUCCESSFUL
			shouldSendReceipt = true
		} else {
			updatedPaymentStatus = ordersgrpc.PaymentStatus_PaymentStatus_FAILED
			updatedOrderStatus = ordersgrpc.OrderStatus_OrderStatus_PAYMENT_FAILED
		}

		err = querier.UpdatePaymentStatus(ctx, sqlc.UpdatePaymentStatusParams{
			ID:     payment.ID,
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

		if err != nil {
			return nil, status.Errorf(codes.Internal, "error creating audit log")
		}

		if shouldSendReceipt {
			i.logger.Debug().Msgf("should send receipt")

			// fetch the user and get their email
			// NB: don't fail if receipt can't be sent.
			user, _ := i.userService.GetUserByID(ctx, &usersgrpc.GetUserByIDRequest{
				UserId: *order.CreatedBy,
			})

			if err != nil {
				i.logger.Error().Msgf("error getting user for payment receipt %v", err)
			}

			i.logger.Debug().Msgf("should send receipt to user %v", user.GetUser().GetEmail())

			product, err := i.productService.GetProduct(ctx, &productsgrpc.GetProductRequest{ProductId: *order.Product})

			if err != nil {
				i.logger.Error().Msgf("error getting product for payment receipt %v", err)
			}

			i.logger.Debug().Msgf("product %v", product.GetProduct())

			// send email receipt
			err = i.emailSender.SendPaymentReceipt(ctx,
				user.GetUser().GetEmail(),
				fmt.Sprintf(
					CleanLabel(
						ordersgrpc.PaymentEntity_PaymentEntity_ORDER.String(), "PaymentEntity_")+" "+strconv.FormatInt(order.OrderNumber, 10)),
				email.ReceiptData{
					ReceiptID:     GenerateReceiptNumber(order.OrderNumber),
					Date:          time.Now(),
					CompanyName:   "FoodHouse",
					CompanyEmail:  i.companyEmail,
					CompanyPhone:  i.companyPhone,
					CustomerName:  fmt.Sprintf(user.GetUser().GetFirstName() + " " + user.GetUser().GetLastName()),
					CustomerEmail: user.GetUser().GetEmail(),
					PaymentMethod: fmt.Sprintf(
						CleanLabel(ordersgrpc.PaymentMethodType_PaymentMethodType_MOBILE_MONEY.String(),
							"PaymentMethodType_") +
							" ending in - " + Last4Chars(payment.AccountNumber)),
					TransactionID: payment.ID,
					Items: []email.ReceiptItem{
						{Name: product.GetProduct().GetName(),
							Quantity: *order.Quantity,
							Amount: email.Amount{Value: product.GetProduct().GetAmount().GetValue(),
								CurrencyIsoCode: product.GetProduct().GetAmount().GetCurrencyIsoCode()},
							Unit: product.GetProduct().GetUnitType()},
					},
					ServiceFee: email.Amount{Value: product.Product.GetAmount().GetValue() * float64(*order.Quantity) * 0.05,
						CurrencyIsoCode: *payment.AmountCurrency},
					TransactionFee: email.Amount{Value: product.Product.GetAmount().GetValue() * float64(*order.Quantity) * 0.03,
						CurrencyIsoCode: *payment.AmountCurrency},
					DeliveryFee: email.Amount{Value: 0, CurrencyIsoCode: "XAF"},
				})

			if err != nil {
				i.logger.Error().Msgf("error sending email receipt %v", err)
			}
		}

		err = tx.Commit(ctx)
		if err != nil {
			return nil, status.Errorf(codes.Internal, "failed to commit transaction: %v", err)
		}

		return &ordersgrpc.ConfirmPaymentResponse{}, nil
	}

	// case for when payment is for a user subscription
	if payment.PaymentEntity == ordersgrpc.PaymentEntity_PaymentEntity_SUBSCRIPTION.String() {
		i.logger.Debug().Msgf("user subscription id %v", payment.EntityID)

		if req.GetStatus() != TPWPaymentStatusCompleted {
			_, err := i.userService.DeleteUserSubscription(ctx, &usersgrpc.DeleteUserSubscriptionRequest{
				UserSubscriptionId: payment.EntityID,
			})

			if err != nil {
				return nil, status.Errorf(codes.Internal, "error confirming payment %v", err)
			}

			err = querier.UpdatePaymentStatus(ctx, sqlc.UpdatePaymentStatusParams{
				ID:     payment.ID,
				Status: ordersgrpc.PaymentStatus_PaymentStatus_FAILED.String(),
			})

			if err != nil {
				i.logger.Debug().Msgf("Error updating payment status %v", err)
				return nil, status.Errorf(codes.Internal, "error updating payment status %v", err)
			}

			err = tx.Commit(ctx)
			if err != nil {
				return nil, status.Errorf(codes.Internal, "failed to commit transaction: %v", err)
			}
			return &ordersgrpc.ConfirmPaymentResponse{}, nil
		}

		err = querier.UpdatePaymentStatus(ctx, sqlc.UpdatePaymentStatusParams{
			ID:     payment.ID,
			Status: ordersgrpc.PaymentStatus_PaymentStatus_COMPLETED.String(),
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

	// Calculate the devliery fee
	deliver_fee, err := i.EstimateDeliveryFee(ctx, &ordersgrpc.EstimateDeliveryFeeRequest{
		UserId:           req.GetUserId(),
		ProductId:        req.GetProductId(),
		DeliveryLocation: req.GetDeliveryLocation(),
		Quantity:         req.GetQuantity(),
	})

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error calculating delivery fee: %v", err)
	}

	args := sqlc.CreateOrderParams{
		DeliveryLocation: pgtype.Point{P: pgtype.Vec2{X: float64(req.GetDeliveryLocation().GetLon()),
			Y: float64(req.GetDeliveryLocation().GetLat())},
			Valid: true},
		PriceValue:          totalAmount,
		PriceCurrency:       product.GetProduct().GetAmount().GetCurrencyIsoCode(),
		Status:              ordersgrpc.OrderStatus_OrderStatus_CREATED.String(),
		Product:             req.GetProductId(),
		CreatedBy:           req.UserId,
		SecretKey:           secretKey,
		ProductOwner:        product.GetProduct().GetCreatedBy(),
		DeliveryAddress:     req.GetDeliveryLocation().GetAddress(),
		Quantity:            req.GetQuantity(),
		DeliveryFeeAmount:   deliver_fee.EstimatedDeliveryFee.Value,
		DeliveryFeeCurrency: deliver_fee.EstimatedDeliveryFee.CurrencyIsoCode,
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

	if order.Status != ordersgrpc.OrderStatus_OrderStatus_APPROVED.String() {
		return nil, status.Errorf(codes.Internal, "order must be in status %v to be dispatched", ordersgrpc.OrderStatus_OrderStatus_APPROVED.String())
	}

	err = querier.UpdateOrderStatus(ctx, sqlc.UpdateOrderStatusParams{
		OrderNumber:  req.GetOrderNumber(),
		Status:       ordersgrpc.OrderStatus_OrderStatus_IN_TRANSIT.String(),
		DispatchedBy: &req.UserId,
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

	paymentReference := fmt.Sprintf("payout-%s", strconv.FormatInt(order.OrderNumber, 10))

	product, err := i.productService.GetProduct(ctx, &productsgrpc.GetProductRequest{
		ProductId: *order.Product,
	})

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error getting product %v", err)
	}

	// calculate payout amount from product price and order quantity
	payoutAmount := float64(product.GetProduct().GetAmount().GetValue()) * float64(*order.Quantity) * FarmersPercentage

	i.logger.Debug().Msgf("payout phone number %v", req.GetPayoutPhoneNumber())

	_, err = i.paymentService.WithdrawFunds(ctx,
		req.GetPayoutPhoneNumber(), payoutAmount,
		*order.PriceCurrency, fmt.Sprintf("payment to farmer for order %v", order.OrderNumber),
		&paymentReference)

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error making payout %v", err)
	}

	_, err = querier.CreatePayment(ctx, sqlc.CreatePaymentParams{
		PaymentEntity:  ordersgrpc.PaymentEntity_PaymentEntity_ORDER.String(),
		EntityID:       strconv.FormatInt(req.GetOrderNumber(), 10),
		AmountValue:    &payoutAmount,
		AmountCurrency: order.PriceCurrency,
		AccountNumber:  req.GetPayoutPhoneNumber(),
		Method:         ordersgrpc.PaymentMethodType_PaymentMethodType_ACCOUNT_BALANCE.String(),
		Status:         ordersgrpc.PaymentStatus_PaymentStatus_COMPLETED.String(),
		ExpiresAt:      pgtype.Timestamptz{Time: time.Now().Add(5 * time.Minute), Valid: true},
		CreatedBy:      *order.ProductOwner,
		Type:           ordersgrpc.PaymentType_PaymentType_DEBIT.String(),
	})

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error creating payment entity %v", err)
	}

	err = i.CreateCommissions(ctx, order, querier)

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error creating comissions for order with number %v: %v", order.OrderNumber, err)
	}

	err = tx.Commit(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to commit transaction: %v", err)
	}

	return &ordersgrpc.DispatchOrderResponse{}, nil
}

func (i *Impl) getReferral(ctx context.Context, referredID string) (*usersgrpc.Referral, error) {
	resp, err := i.userService.GetReferralByReferredID(ctx, &usersgrpc.GetReferralByReferredIdRequest{
		ReferredId: referredID,
	})
	if err != nil {
		// Check if it's a NotFound error
		if status.Code(err) == codes.NotFound {
			// No referral exists, return nil without failing
			return nil, nil
		}
		// Some other gRPC error, propagate it
		return nil, err
	}

	return resp.Referral, nil
}

// create commissions is a helper method that creates the commissions neccesary for any given transaction
func (i *Impl) CreateCommissions(ctx context.Context, order sqlc.Order, querier sqlc.Querier) error {

	var commissionsToCreate []sqlc.Commission

	// 1. Get referral for buyer
	if buyerReferral, err := i.getReferral(ctx, *order.CreatedBy); err != nil {
		return err // gRPC error other than NotFound
	} else if buyerReferral != nil {
		commissionsToCreate = append(commissionsToCreate, sqlc.Commission{
			ReferrerID:       buyerReferral.ReferrerId,
			ReferredID:       *order.CreatedBy,
			OrderNumber:      order.OrderNumber,
			CurrencyCode:     *order.PriceCurrency,
			CommissionAmount: calculateCommission(*order.PriceValue),
		})
	}

	// 2. Get referral for farmer
	if farmerReferral, err := i.getReferral(ctx, *order.ProductOwner); err != nil {
		return err
	} else if farmerReferral != nil {
		commissionsToCreate = append(commissionsToCreate, sqlc.Commission{
			ReferrerID:       farmerReferral.ReferrerId,
			ReferredID:       *order.ProductOwner,
			OrderNumber:      order.OrderNumber,
			CurrencyCode:     *order.PriceCurrency,
			CommissionAmount: calculateCommission(*order.PriceValue),
		})
	}

	// 3. Create all commissions outside the if blocks
	for _, c := range commissionsToCreate {
		if _, err := querier.CreateCommission(ctx, sqlc.CreateCommissionParams{
			ReferrerID:       c.ReferrerID,
			ReferredID:       c.ReferredID,
			OrderNumber:      c.OrderNumber,
			CurrencyCode:     c.CurrencyCode,
			CommissionAmount: c.CommissionAmount,
		}); err != nil {
			return err
		}
	}

	return nil
}

func calculateCommission(orderAmount float64) float64 {
	return (orderAmount * ReferralCommissionPercentage) / TotalPercentage
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
		ProductOwner:     &req.FarmerId,
		CreatedBefore:    startKey,
		IncludedStatuses: convertOrderStatusesToStrings(req.GetStatuses()),
		Count:            int32(count), // Convert count to int32
		SearchKey:        req.GetSearchKey(),
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
		CreatedBy:        &req.UserId,
		IncludedStatuses: convertOrderStatusesToStrings(req.GetStatuses()),
		CreatedBefore:    startKey,
		Count:            int32(count), // Convert count to int32
		SearchKey:        req.GetSearchKey(),
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

func convertOrderStatusesToStrings(orderStatus []ordersgrpc.OrderStatus) []string {
	stringStatuses := make([]string, len(orderStatus))

	for _, os := range orderStatus {
		stringStatuses = append(stringStatuses, os.String())
	}

	return stringStatuses
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
		return "", status.Errorf(codes.InvalidArgument, "error validating phone number: %v", err)
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

	// check if a payment has already been initiated for that entity,
	// to avoid users intiating payments twice
	_, err = querier.GetPaymentByEntity(ctx, sqlc.GetPaymentByEntityParams{
		EntityID:      req.GetEntityId(),
		PaymentEntity: req.GetPaymentEntity().String(),
	})

	if err == nil {
		// If no error, then a payment has already been initated for that entity
		return nil, status.Errorf(codes.AlreadyExists, "a payment has already been initated for entity %v with id %v", req.GetPaymentEntity().String(), req.GetEntityId())
	}

	// if there is an error different from no rows error, then it could be in internal server error, return
	if !errors.Is(err, sql.ErrNoRows) {
		return nil, fmt.Errorf("failed to check for existing payment: %v", err)
	}

	if _, ok := supportedCurrencies[req.GetAmount().GetCurrencyIsoCode()]; !ok {
		return nil, status.Errorf(codes.Internal, "currency %s is not supported", req.GetAmount().GetCurrencyIsoCode())
	}

	totalPrice := &req.GetAmount().Value

	if req.GetPaymentEntity() == ordersgrpc.PaymentEntity_PaymentEntity_ORDER {
		// req.GetEntityId() returns a string, but GetOrderByOrderNumber expects int64
		orderNumber, convErr := strconv.ParseInt(req.GetEntityId(), 10, 64)
		if convErr != nil {
			return nil, status.Errorf(codes.InvalidArgument, "invalid order number: %v", convErr)
		}
		order, newErr := querier.GetOrderByOrderNumber(ctx, orderNumber)
		if newErr != nil {
			return nil, status.Errorf(codes.Internal, "error getting order for payment %v", newErr)
		}

		totalPrice = order.PriceValue

	}

	var paymentStatus = ordersgrpc.PaymentStatus_PaymentStatus_INITIATED

	if i.devMethodsEndabled {
		paymentStatus = ordersgrpc.PaymentStatus_PaymentStatus_COMPLETED
	}

	payment, err := querier.CreatePayment(ctx, sqlc.CreatePaymentParams{
		PaymentEntity:  req.GetPaymentEntity().String(),
		EntityID:       req.GetEntityId(),
		AmountValue:    totalPrice,
		AmountCurrency: &req.GetAmount().CurrencyIsoCode,
		AccountNumber:  req.GetAccount().GetAccountNumber(),
		Method:         req.GetAccount().GetPaymentMethod().String(),
		Status:         paymentStatus.String(),
		ExpiresAt:      pgtype.Timestamptz{Time: time.Now().Add(5 * time.Minute), Valid: true},
		CreatedBy:      req.GetUserId(),
		Type:           ordersgrpc.PaymentType_PaymentType_CREDIT.String(),
	})

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error creating payment entity %v", err)
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

	// Using test amount while in sandbox mode

	// testAmount := float64(10)

	// only call TPW in production
	if !i.devMethodsEndabled {
		_, payErr := i.paymentService.RequestPayment(ctx, formattedNumber, *totalPrice, req.GetAmount().GetCurrencyIsoCode(), req.GetPaymentEntity().String(), &req.EntityId)

		if payErr != nil {
			i.logger.Debug().Msgf("payment error %v", err)
			return nil, status.Errorf(codes.Internal, "error initiating payment %v", err)
		}
	}

	err = tx.Commit(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to commit transaction: %v", err)
	}

	return &ordersgrpc.InitiatePaymentResponse{
		Payment: &ordersgrpc.Payment{
			Id:       payment.ID,
			EntityId: payment.EntityID,
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

	if req.GetUserId() != *order.ProductOwner {
		return nil, status.Error(codes.PermissionDenied, "user does not have permission to approve this order")
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

// DeleteDeliveryPoint implements ordersgrpc.OrdersServer.
func (i *Impl) DeleteDeliveryPoint(ctx context.Context, req *ordersgrpc.DeleteDeliveryPointRequest) (*ordersgrpc.DeleteDeliveryPointResponse, error) {
	err := i.repo.Do().DeleteDeliveryPoint(ctx, req.GetId())

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error deleting delivery point %v", err)
	}

	return &ordersgrpc.DeleteDeliveryPointResponse{}, nil
}

// UpdateDeliveryPoint implements ordersgrpc.OrdersServer.
func (i *Impl) UpdateDeliveryPoint(ctx context.Context, req *ordersgrpc.UpdateDeliveryPointRequest) (*ordersgrpc.UpdateDeliveryPointResponse, error) {
	err := i.repo.Do().UpdateDeliveryPoint(ctx, sqlc.UpdateDeliveryPointParams{
		DeliveryLocation: pgtype.Point{P: pgtype.Vec2{X: float64(req.GetAddress().GetLon()),
			Y: float64(req.GetAddress().GetLat())},
			Valid: true},
		LocationName:      req.GetAddress().GetAddress(),
		DeliveryPointName: req.GetDeliveryPointName(),
		City:              req.GetCity(),
		ID:                req.GetId(),
	})

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error updating delivery point %v", err)
	}

	return &ordersgrpc.UpdateDeliveryPointResponse{}, nil
}

func ParsePaymentStatus(status string) (ordersgrpc.PaymentStatus, error) {
	if val, ok := ordersgrpc.PaymentStatus_value[status]; ok {
		return ordersgrpc.PaymentStatus(val), nil
	}
	return ordersgrpc.PaymentStatus_PaymentStatus_UNSPECIFIED, fmt.Errorf("invalid payment status: %s", status)
}

// CheckPaymentStatus implements ordersgrpc.OrdersServer.
func (i *Impl) CheckPaymentStatus(ctx context.Context, req *ordersgrpc.CheckPaymentStatusRequest) (*ordersgrpc.CheckPaymentStatusResponse, error) {
	i.logger.Debug().Msgf("payment id %v", req.GetPaymentId())

	payment, err := i.repo.Do().GetPaymentById(ctx, req.GetPaymentId())

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error fetching payment %v", err)
	}

	if payment.CreatedBy != req.GetUserId() {
		return nil, status.Error(codes.PermissionDenied, "user does not have permission to fetch this payment")
	}

	paymentStatus, err := ParsePaymentStatus(payment.Status)

	if err != nil {
		return nil, status.Errorf(codes.Internal, "cannot parse status %v.", err)
	}

	return &ordersgrpc.CheckPaymentStatusResponse{
		Status: paymentStatus,
	}, nil
}

type GroupBy string

const (
	GroupByDay   GroupBy = "day"
	GroupByMonth GroupBy = "month"
	GroupByYear  GroupBy = "year"
)

func fillMissingDates(results []*ordersgrpc.FarmerEarningsData, filterCtx FilterContext) []*ordersgrpc.FarmerEarningsData {
	switch filterCtx.GroupBy {
	case GroupByDay:
		return fillMissingDays(results, filterCtx.StartDate, filterCtx.EndDate, filterCtx.Format)
	case GroupByMonth:
		return fillMissingMonths(results, filterCtx.StartDate, filterCtx.EndDate, filterCtx.Format)
	case GroupByYear:
		if len(results) < 5 {
			return fillMissingYears(results, filterCtx.Format)
		}
	}
	return results
}

func fillMissingDays(results []*ordersgrpc.FarmerEarningsData, start, end time.Time, format string) []*ordersgrpc.FarmerEarningsData {
	existing := make(map[string]float64)
	for _, r := range results {
		existing[r.Date] = r.Value
	}

	var filled []*ordersgrpc.FarmerEarningsData
	for d := start; d.Before(end); d = d.AddDate(0, 0, 1) {
		dateStr := d.Format(format)
		val := existing[dateStr]
		filled = append(filled, &ordersgrpc.FarmerEarningsData{
			Date:  dateStr,
			Value: val, // will be 0 if not in map
		})
	}
	return filled
}

func fillMissingMonths(results []*ordersgrpc.FarmerEarningsData, start, end time.Time, format string) []*ordersgrpc.FarmerEarningsData {
	existing := make(map[string]float64)
	for _, r := range results {
		existing[r.Date] = r.Value
	}

	var filled []*ordersgrpc.FarmerEarningsData
	for d := start; d.Before(end); d = d.AddDate(0, 1, 0) {
		dateStr := d.Format(format)
		val := existing[dateStr]
		filled = append(filled, &ordersgrpc.FarmerEarningsData{
			Date:  dateStr,
			Value: val,
		})
	}
	return filled
}

func fillMissingYears(results []*ordersgrpc.FarmerEarningsData, format string) []*ordersgrpc.FarmerEarningsData {
	existing := make(map[string]float64)
	minYear := time.Now().Year() - 4
	maxYear := time.Now().Year()

	for _, r := range results {
		existing[r.Date] = r.Value
	}

	var filled []*ordersgrpc.FarmerEarningsData
	for y := minYear; y <= maxYear; y++ {
		t := time.Date(y, 1, 1, 0, 0, 0, 0, time.UTC)
		dateStr := t.Format(format)
		val := existing[dateStr]
		filled = append(filled, &ordersgrpc.FarmerEarningsData{
			Date:  dateStr,
			Value: val,
		})
	}

	return filled
}

type FilterContext struct {
	StartDate time.Time
	EndDate   time.Time
	GroupBy   GroupBy
	Format    string
}

type ProductQuantity struct {
	ProductID string `json:"product_id"`
	Quantity  int64  `json:"quantity"`
}

type Group struct {
	GroupDate pgtype.Timestamptz `json:"group_date"`
	Products  []ProductQuantity  `json:"products"`
}

func GetFilterContext(filter ordersgrpc.FilterType) (FilterContext, error) {
	now := time.Now()
	loc := now.Location()
	switch filter {
	case ordersgrpc.FilterType_FilterType_THIS_WEEK:
		offset := int(now.Weekday())
		start := now.AddDate(0, 0, -offset)
		end := start.AddDate(0, 0, 7)
		return FilterContext{start, end, GroupByDay, "Mon"}, nil

	case ordersgrpc.FilterType_FilterType_THIS_MONTH:
		start := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, loc)
		end := start.AddDate(0, 1, 0)
		return FilterContext{start, end, GroupByDay, "02/01"}, nil

	case ordersgrpc.FilterType_FilterType_THIS_YEAR:
		start := time.Date(now.Year(), 1, 1, 0, 0, 0, 0, loc)
		end := start.AddDate(1, 0, 0)
		return FilterContext{start, end, GroupByMonth, "01/06"}, nil

	case ordersgrpc.FilterType_FilterType_ALL_TIME:
		start := time.Time{}
		return FilterContext{start, now, GroupByYear, "2006"}, nil

	default:
		return FilterContext{}, fmt.Errorf("invalid filter type")
	}
}

// GetFarmerEarnings implements ordersgrpc.OrdersServer.
func (i *Impl) GetFarmerEarnings(ctx context.Context,
	req *ordersgrpc.GetFarmerEarningsRequest) (
	*ordersgrpc.GetFarmerEarningsResponse, error) {

	filterCtx, err := GetFilterContext(req.GetFilter())
	if err != nil {
		return nil, status.Errorf(codes.Internal, "error getting context %v", err)
	}

	i.logger.Debug().Msgf("filter conext %v", filterCtx)
	var rawResults []Group

	switch filterCtx.GroupBy {
	case GroupByDay:
		results, err := i.repo.Do().GetOrdersGroupedByDay(ctx, sqlc.GetOrdersGroupedByDayParams{
			ProductOwner: &req.FarmerId,
			Status:       ordersgrpc.OrderStatus_OrderStatus_DELIVERED.String(),
			UpdatedAt: pgtype.Timestamptz{
				Valid: true,
				Time:  filterCtx.StartDate,
			},
			UpdatedAt_2: pgtype.Timestamptz{
				Valid: true,
				Time:  filterCtx.EndDate,
			},
		})
		if err != nil {
			return nil, status.Errorf(codes.Internal, "error getting earnings by day: %v", err)
		}
		rawResults = make([]Group, len(results))
		for i, r := range results {
			var products []ProductQuantity
			err := json.Unmarshal(r.Products, &products)
			if err != nil {
				return nil, status.Errorf(codes.Internal, "failed to parse product group: %v", err)
			}
			rawResults[i] = Group{
				GroupDate: pgtype.Timestamptz{Valid: true, Time: r.GroupDate},
				Products:  products,
			}
		}

	case GroupByMonth:
		results, err := i.repo.Do().GetOrdersGroupedByMonth(ctx, sqlc.GetOrdersGroupedByMonthParams{
			ProductOwner: &req.FarmerId,
			Status:       ordersgrpc.OrderStatus_OrderStatus_DELIVERED.String(),
			UpdatedAt: pgtype.Timestamptz{
				Valid: true,
				Time:  filterCtx.StartDate,
			},
			UpdatedAt_2: pgtype.Timestamptz{
				Valid: true,
				Time:  filterCtx.EndDate,
			},
		})
		if err != nil {
			return nil, status.Errorf(codes.Internal, "error getting earnings by day: %v", err)
		}
		rawResults = make([]Group, len(results))
		for i, r := range results {
			var products []ProductQuantity
			err := json.Unmarshal(r.Products, &products)
			if err != nil {
				return nil, status.Errorf(codes.Internal, "failed to parse product group: %v", err)
			}
			rawResults[i] = Group{
				GroupDate: pgtype.Timestamptz{Valid: true, Time: r.GroupDate},
				Products:  products,
			}
		}

	case GroupByYear:
		results, err := i.repo.Do().GetOrdersGroupedByYear(ctx, sqlc.GetOrdersGroupedByYearParams{
			ProductOwner: &req.FarmerId,
			Status:       ordersgrpc.OrderStatus_OrderStatus_DELIVERED.String(),
			UpdatedAt: pgtype.Timestamptz{
				Valid: true,
				Time:  filterCtx.StartDate,
			},
			UpdatedAt_2: pgtype.Timestamptz{
				Valid: true,
				Time:  filterCtx.EndDate,
			},
		})
		if err != nil {
			return nil, status.Errorf(codes.Internal, "error getting earnings by day: %v", err)
		}
		rawResults = make([]Group, len(results))
		for i, r := range results {
			var products []ProductQuantity
			err := json.Unmarshal(r.Products, &products)
			if err != nil {
				return nil, status.Errorf(codes.Internal, "failed to parse product group: %v", err)
			}
			rawResults[i] = Group{
				GroupDate: pgtype.Timestamptz{Valid: true, Time: r.GroupDate},
				Products:  products,
			}
		}
	}

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error getting earnings by group: %v", err)
	}

	i.logger.Debug().Msgf("Raw results :%v", rawResults)

	// Group by date string
	grouped := make(map[string][]ProductQuantity)
	for _, row := range rawResults {
		key := row.GroupDate.Time.Format(filterCtx.Format)
		grouped[key] = append(grouped[key], row.Products...)
	}

	i.logger.Debug().Msgf("Groupped results: %v", grouped)

	// Call ProductService for each group
	results := make([]*ordersgrpc.FarmerEarningsData, 0, len(grouped))
	for dateStr, productQuantities := range grouped {
		var productIDs []string
		var quantities []int64

		for _, pq := range productQuantities {
			productIDs = append(productIDs, pq.ProductID)
			quantities = append(quantities, pq.Quantity)
		}

		res, err := i.productService.SumProductAmounts(ctx, &productsgrpc.SumProductAmountsRequest{
			ProductIds: productIDs,
			Quantities: quantities,
		})
		if err != nil {
			return nil, status.Errorf(codes.Internal, "error getting total earning from products: %v", err)
		}

		results = append(results, &ordersgrpc.FarmerEarningsData{
			Date:  dateStr,
			Value: res.Total,
		})
	}

	results = fillMissingDates(results, filterCtx)

	i.logger.Debug().Msgf("Final results: %v", results)

	return &ordersgrpc.GetFarmerEarningsResponse{Data: results}, nil
}

// RejectOrder implements ordersgrpc.OrdersServer.
func (i *Impl) RejectOrder(ctx context.Context,
	req *ordersgrpc.RejectOrderRequest) (
	*ordersgrpc.RejectOrderResponse, error) {
	orderNumber, err := strconv.ParseInt(req.GetOrderId(), 10, 64)

	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid order number %s", req.GetOrderId())
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

	order, err := querier.GetOrderByOrderNumber(ctx, orderNumber)

	if err != nil {
		i.logger.Debug().Msgf("error getting order with id %s why: %v", req.GetOrderId(), err)
		return nil, status.Errorf(codes.Internal, "error getting order with id %s why: %v", req.GetOrderId(), err)
	}

	if req.GetUserId() != *order.ProductOwner {
		return nil, status.Error(codes.PermissionDenied, "user does not have permission to approve this order")
	}

	beforeBytes, err := protojson.Marshal(converters.SqlcOrderToProto(order))
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to marshal proto order: %v", err)
	}

	// calculate the refund amount
	payoutAmount := *order.PriceValue * RefundPercentage

	// get the payment made for this order
	payment, err := querier.GetPaymentByEntity(ctx,
		sqlc.GetPaymentByEntityParams{
			PaymentEntity: ordersgrpc.PaymentEntity_PaymentEntity_ORDER.String(),
			EntityID:      strconv.FormatInt(order.OrderNumber, 10)})

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error getting payment for order with number %v, reason: %v", order.OrderNumber, err)
	}

	i.logger.Debug().Msgf("payout phone number %v", payment.AccountNumber)

	paymentReference := fmt.Sprintf("refund-%s", strconv.FormatInt(order.OrderNumber, 10))

	// ignore refunds error too
	_, err = i.paymentService.WithdrawFunds(ctx,
		payment.AccountNumber, payoutAmount,
		*order.PriceCurrency, fmt.Sprintf("refund for order %v", order.OrderNumber),
		&paymentReference)

	if err != nil {
		i.logger.Error().Msgf("error making refund %v", err)
		// return nil, status.Errorf(codes.Internal, "error making refund %v", err)
	}

	_, err = querier.CreatePayment(ctx, sqlc.CreatePaymentParams{
		PaymentEntity:  ordersgrpc.PaymentEntity_PaymentEntity_REFUND.String(),
		EntityID:       strconv.FormatInt(orderNumber, 10),
		AmountValue:    &payoutAmount,
		AmountCurrency: order.PriceCurrency,
		AccountNumber:  payment.AccountNumber,
		Method:         ordersgrpc.PaymentMethodType_PaymentMethodType_ACCOUNT_BALANCE.String(),
		Status:         ordersgrpc.PaymentStatus_PaymentStatus_COMPLETED.String(),
		ExpiresAt:      pgtype.Timestamptz{Time: time.Now().Add(5 * time.Minute), Valid: true},
		CreatedBy:      *order.CreatedBy,
		Type:           ordersgrpc.PaymentType_PaymentType_DEBIT.String(),
	})

	if err != nil {
		i.logger.Error().Msgf("error creating payment entity %v", err)
		return nil, status.Errorf(codes.Internal, "error creating payment entity %v", err)
	}

	err = querier.UpdateOrderStatus(ctx, sqlc.UpdateOrderStatusParams{
		OrderNumber: order.OrderNumber,
		Status:      ordersgrpc.OrderStatus_OrderStatus_REJECTED.String(),
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
		Action:         "RejectOrder",
		Reason:         req.GetReason(),
		Before:         beforeBytes,
		After:          afterBytes,
	})

	if err != nil {
		i.logger.Debug().Msgf("Error creating order logs %v", err)
		return nil, status.Errorf(codes.Internal, "error creating order logs %v", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to commit transaction: %v", err)
	}

	return &ordersgrpc.RejectOrderResponse{}, nil
}

func getMonthRanges() (time.Time, time.Time, time.Time, time.Time) {
	now := time.Now()

	// Truncate to the start of this month
	startOfThisMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())

	// Start of next month, minus 1 second gives end of this month
	endOfThisMonth := startOfThisMonth.AddDate(0, 1, 0).Add(-time.Second)

	// Start of last month
	startOfLastMonth := startOfThisMonth.AddDate(0, -1, 0)

	// End of last month = start of this month - 1 second
	endOfLastMonth := startOfThisMonth.Add(-time.Second)

	return startOfThisMonth, endOfThisMonth, startOfLastMonth, endOfLastMonth
}

func percentageChange(oldValue, newValue float64) *float64 {
	if oldValue == 0 {
		change := 100.0
		return &change
	}
	change := ((newValue - oldValue) / math.Abs(oldValue)) * CENT
	return &change
}

// GetAdminStats implements ordersgrpc.OrdersServer.
func (i *Impl) GetAdminStats(ctx context.Context,
	req *ordersgrpc.GetAdminStatsRequest) (
	*ordersgrpc.GetAdminStatsResponse, error) {
	startThis, endThis, startLast, endLast := getMonthRanges()

	lastMonthOrderStats, err := i.repo.Do().GetOrderStatsBetweenDates(ctx, sqlc.GetOrderStatsBetweenDatesParams{
		StartDate: startThis,
		EndDate:   endThis,
		IncludedStatuses: []string{
			ordersgrpc.OrderStatus_OrderStatus_APPROVED.String(),
			ordersgrpc.OrderStatus_OrderStatus_DELIVERED.String(),
			ordersgrpc.OrderStatus_OrderStatus_IN_TRANSIT.String(),
			ordersgrpc.OrderStatus_OrderStatus_PAYMENT_SUCCESSFUL.String(),
			ordersgrpc.OrderStatus_OrderStatus_REJECTED.String(),
		},
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "error getting stats %v", err)
	}

	thisMonthOrderStats, err := i.repo.Do().GetOrderStatsBetweenDates(ctx, sqlc.GetOrderStatsBetweenDatesParams{
		StartDate: startThis,
		EndDate:   endThis,
		IncludedStatuses: []string{
			ordersgrpc.OrderStatus_OrderStatus_APPROVED.String(),
			ordersgrpc.OrderStatus_OrderStatus_DELIVERED.String(),
			ordersgrpc.OrderStatus_OrderStatus_IN_TRANSIT.String(),
			ordersgrpc.OrderStatus_OrderStatus_PAYMENT_SUCCESSFUL.String(),
			ordersgrpc.OrderStatus_OrderStatus_REJECTED.String(),
		},
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "error getting stats %v", err)
	}

	lastMonthPaymentStats, err := i.repo.Do().GetPaymentStatsBetweenDates(ctx, sqlc.GetPaymentStatsBetweenDatesParams{
		StartDate: startLast,
		EndDate:   endLast,
	})

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error getting stats %v", err)
	}

	thisMonthPaymentStats, err := i.repo.Do().GetPaymentStatsBetweenDates(ctx, sqlc.GetPaymentStatsBetweenDatesParams{
		StartDate: startThis,
		EndDate:   endThis,
	})

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error getting stats %v", err)
	}

	usersStats, err := i.userService.GetUserStats(ctx, &usersgrpc.GetUserStatsRequest{})

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error getting stats %v", err)
	}

	productsStats, err := i.productService.GetProductStats(ctx, &productsgrpc.GetProductStatsRequest{})

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error getting stats %v", err)
	}

	stats := make([]*ordersgrpc.StatItem, 0, 5)

	stats = append(stats, &ordersgrpc.StatItem{
		Title:       usersStats.GetData()[0].Title,
		Value:       usersStats.GetData()[0].Value,
		Change:      usersStats.GetData()[0].Change,
		Description: usersStats.GetData()[0].Description,
	})

	stats = append(stats, &ordersgrpc.StatItem{
		Title:       usersStats.GetData()[1].Title,
		Value:       usersStats.GetData()[1].Value,
		Change:      usersStats.GetData()[1].Change,
		Description: usersStats.GetData()[1].Description,
	})

	stats = append(stats, &ordersgrpc.StatItem{
		Title:       productsStats.GetData()[0].Title,
		Value:       productsStats.GetData()[0].Value,
		Change:      productsStats.GetData()[0].Change,
		Description: productsStats.GetData()[0].Description,
	})

	stats = append(stats, &ordersgrpc.StatItem{
		Title:       "Total Orders",
		Value:       float64(thisMonthOrderStats),
		Change:      *percentageChange(float64(lastMonthOrderStats), float64(thisMonthOrderStats)),
		Description: "Total orders this month",
	})

	currency := "XAF"

	stats = append(stats, &ordersgrpc.StatItem{
		Title:       "Total Revenue",
		Value:       float64(thisMonthPaymentStats),
		Currency:    &currency,
		Change:      *percentageChange(float64(lastMonthPaymentStats), float64(thisMonthPaymentStats)),
		Description: "Total revenue this month",
	})

	return &ordersgrpc.GetAdminStatsResponse{
		Data: stats,
	}, nil
}

// ListOrders implements ordersgrpc.OrdersServer.
func (i *Impl) ListOrders(ctx context.Context,
	req *ordersgrpc.ListOrdersRequest) (
	*ordersgrpc.ListOrdersResponse, error) {
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

	orders, err := i.repo.Do().ListOrders(ctx, sqlc.ListOrdersParams{
		CreatedBefore:    startKey,
		IncludedStatuses: convertOrderStatusesToStrings(req.GetStatuses()),
		Count:            int32(count), // Convert count to int32
		SearchKey:        req.GetSearchKey(),
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
	return &ordersgrpc.ListOrdersResponse{
		Orders:  protoOrders,
		NextKey: nextKey,
	}, nil
}

// ListPayments implements ordersgrpc.OrdersServer.
func (i *Impl) ListPayments(ctx context.Context,
	req *ordersgrpc.ListPaymentsRequest) (
	*ordersgrpc.ListPaymentsResponse, error) {
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
		count = 10
	}

	sqlcPayments, err := i.repo.Do().ListPayments(ctx, sqlc.ListPaymentsParams{
		CreatedBefore: startKey,
		Count:         int32(count),
		SearchKey:     req.GetSearchKey(),
		PaymentStatus: req.GetPaymentStatus().String(),
		PaymentEntity: req.GetPaymentEntity().String(),
		PaymentType:   req.GetPaymentType().String(),
	})

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error getting payments %v", err)
	}

	protoPayments := converters.SqlcPaymentsToProto(sqlcPayments)

	nextKey := ""

	i.logger.Debug().Msgf("Count %v, payments length %v", count, len(protoPayments))

	if len(protoPayments) >= count {
		nextKey = protoPayments[len(protoPayments)-1].GetCreatedAt().AsTime().Format(time.RFC3339)
	}
	return &ordersgrpc.ListPaymentsResponse{
		Payments: protoPayments,
		NextKey:  nextKey,
	}, nil
}

// BulkSettleCommissions implements ordersgrpc.OrdersServer.
func (i *Impl) BulkSettleCommissions(ctx context.Context,
	req *ordersgrpc.BulkSettleCommissionsRequest) (
	*ordersgrpc.BulkSettleCommissionsResponse, error) {

	querier, tx, err := i.repo.Begin(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to begin transaction: %v", err)
	}
	defer func() {
		err := tx.Rollback(ctx)
		if err != nil && !errors.Is(err, sql.ErrTxDone) {
			i.logger.Err(err).Msgf("Failed to rollback transaction")
		}
	}()

	// 1. Fetch commissions with FOR UPDATE.
	commissions, err := querier.GetCommissionsByIDsForUpdate(ctx, req.GetCommissionIds())
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to fetch commissions: %v", err)
	}

	// 2. Validate same currency, same referrer and aggregate.
	var total float64
	currency := commissions[0].CurrencyCode
	refferrer := commissions[0].ReferrerID
	for _, c := range commissions {
		if c.CurrencyCode != currency {
			return nil, status.Errorf(codes.InvalidArgument, "commissions must have the same currency")
		}
		if c.ReferrerID != refferrer {
			return nil, status.Errorf(codes.InvalidArgument, "can only make bulk payment to the same user")
		}
		total += c.CommissionAmount
	}

	// 3. Fetch the user.
	user, err := i.userService.GetUserByID(ctx, &usersgrpc.GetUserByIDRequest{UserId: commissions[0].ReferrerID})

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error fetching user %v", err)
	}

	// 4. Create payment.
	payment, err := querier.CreatePayment(ctx, sqlc.CreatePaymentParams{
		PaymentEntity:  ordersgrpc.PaymentEntity_PaymentEntity_COMMISSION.String(),
		EntityID:       fmt.Sprintf("%v-%v", commissions[0].ID, commissions[len(commissions)-1].ID),
		AmountValue:    &total,
		AmountCurrency: &commissions[0].CurrencyCode,
		CreatedBy:      user.GetUser().GetUserId(),
		Status:         ordersgrpc.PaymentStatus_PaymentStatus_COMPLETED.String(),
		Type:           ordersgrpc.PaymentType_PaymentType_DEBIT.String(),
		ExpiresAt:      pgtype.Timestamptz{Time: time.Now().Add(5 * time.Minute), Valid: true},
		Method:         ordersgrpc.PaymentMethodType_PaymentMethodType_ACCOUNT_BALANCE.String(),
		AccountNumber:  user.GetUser().GetPhoneNumber(),
	})

	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create payment: %v", err)
	}

	// 5. Make the payout.
	_, err = i.paymentService.WithdrawFunds(ctx,
		user.GetUser().GetPhoneNumber(), total,
		commissions[0].CurrencyCode, fmt.Sprintf("payment for commissions %v-%v", commissions[0].ID, commissions[len(commissions)-1].ID),
		&commissions[0].ID)

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error making payout %v", err)
	}

	// 6. Bulk update commissions.
	err = querier.BulkUpdateCommissionsPaymentReference(ctx, sqlc.BulkUpdateCommissionsPaymentReferenceParams{
		PaymentReference: &payment.ID,
		CommissionIds:    req.GetCommissionIds(),
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update commissions: %v", err)
	}

	// 7. Commit transaction.
	if err := tx.Commit(ctx); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to commit transaction: %v", err)
	}

	return &ordersgrpc.BulkSettleCommissionsResponse{
		Message: "Completed",
	}, nil
}

// ListCommissionsByReferrer implements ordersgrpc.OrdersServer.
func (i *Impl) ListCommissionsByReferrer(ctx context.Context,
	req *ordersgrpc.ListCommissionsByReferrerRequest) (
	*ordersgrpc.ListCommissionsByReferrerResponse, error) {
	commissions, err := i.repo.Do().ListCommissionsByReferrer(ctx, sqlc.ListCommissionsByReferrerParams{
		ReferrerID: req.GetReferrerId(),
		IsPaid:     req.GetIsPaid(),
	})

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error listing commissions %v", err)
	}

	protoCommissions := converters.SqlcCommissionsToProtoCommissions(commissions)

	return &ordersgrpc.ListCommissionsByReferrerResponse{
		Commissions: protoCommissions,
	}, nil
}

// ListTotalComissionAmountByReferrer implements ordersgrpc.OrdersServer.
func (i *Impl) ListTotalComissionAmountByReferrer(ctx context.Context,
	req *ordersgrpc.ListTotalComissionAmountByReferrerRequest) (
	*ordersgrpc.ListTotalCommissionAmountByReferrerResponse, error) {
	commissions, err := i.repo.Do().AggregateCommissionByReferrer(ctx,
		sqlc.AggregateCommissionByReferrerParams{
			ReferrerID: req.GetReferrerId(),
			IsPaid:     req.GetIsPaid(),
		})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "error getting commissions %v", err)
	}

	protoCommissions := converters.SqlcToProtoAggregatedCommissions(commissions)
	return &ordersgrpc.ListTotalCommissionAmountByReferrerResponse{
		Commissions: protoCommissions,
	}, nil
}

func Distance(p1, p2 *types.Point) float64 {
	// If either pointer itself is nil → treat as "no location"
	if p1 == nil || p2 == nil {
		return 1.0
	}

	// If either point is (0,0), treat as "no location"
	if (p1.Lat == 0 && p1.Lon == 0) || (p2.Lat == 0 && p2.Lon == 0) {
		return 1.0
	}

	const R = 6371.0 // Earth radius in KM

	lat1 := p1.Lat * math.Pi / 180
	lon1 := p1.Lon * math.Pi / 180
	lat2 := p2.Lat * math.Pi / 180
	lon2 := p2.Lon * math.Pi / 180

	dlat := lat2 - lat1
	dlon := lon2 - lon1

	a := math.Sin(dlat/2)*math.Sin(dlat/2) +
		math.Cos(lat1)*math.Cos(lat2)*
			math.Sin(dlon/2)*math.Sin(dlon/2)

	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return R * c
}

// EstimateDeliveryFee implements ordersgrpc.OrdersServer.
func (i *Impl) EstimateDeliveryFee(ctx context.Context,
	req *ordersgrpc.EstimateDeliveryFeeRequest,
) (*ordersgrpc.EstimateDeliveryFeeResponse, error) {

	product, err := i.productService.GetProduct(ctx, &productsgrpc.GetProductRequest{
		ProductId: req.GetProductId(),
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "error getting product with id %v: reason: %v", req.GetProductId(), err)
	}

	// Defensive check: product.Product and nested fields
	if product == nil || product.Product == nil {
		return nil, status.Errorf(codes.Internal, "product data missing for id %v", req.GetProductId())
	}
	if product.Product.DeliveryFeePerUnit == nil {
		return nil, status.Errorf(codes.Internal, "delivery fee per unit missing for product id %v", req.GetProductId())
	}

	farmer, err := i.userService.GetUserByID(ctx, &usersgrpc.GetUserByIDRequest{
		UserId: product.Product.CreatedBy,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "error getting farmer with id %v: reason: %v", product.Product.CreatedBy, err)
	}

	// Defensive check: farmer and nested fields
	if farmer == nil || farmer.User == nil {
		return nil, status.Errorf(codes.Internal, "farmer user data missing for id %v", product.Product.CreatedBy)
	}

	// Safe distance calculation
	distance := Distance(req.DeliveryLocation, farmer.User.LocationCoordinates)
	i.logger.Debug().Msgf("delivery distance in km: %v", distance)

	// deliveryFeeAmount := distance * product.Product.DeliveryFeePerUnit.Value * float64(req.GetQuantity())
	deliveryFeeAmount := 1 * product.Product.DeliveryFeePerUnit.Value * float64(req.GetQuantity())

	return &ordersgrpc.EstimateDeliveryFeeResponse{
		EstimatedDeliveryFee: &types.Amount{
			Value:           deliveryFeeAmount,
			CurrencyIsoCode: product.Product.DeliveryFeePerUnit.CurrencyIsoCode,
		},
	}, nil
}
