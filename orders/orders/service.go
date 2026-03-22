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

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/nyaruka/phonenumbers"
	"github.com/rs/zerolog"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/types/known/timestamppb"

	"github.com/foodhouse/foodhouseapp/email"
	"github.com/foodhouse/foodhouseapp/grpc/go/ordersgrpc"
	"github.com/foodhouse/foodhouseapp/grpc/go/productsgrpc"
	"github.com/foodhouse/foodhouseapp/grpc/go/types"
	"github.com/foodhouse/foodhouseapp/grpc/go/usersgrpc"
	"github.com/foodhouse/foodhouseapp/orders/db/converters"
	"github.com/foodhouse/foodhouseapp/orders/db/repo"
	"github.com/foodhouse/foodhouseapp/orders/db/sqlc"
	"github.com/foodhouse/foodhouseapp/payment"
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

	TotalPercentage = 1.00

	RefundPercentage = 0.95

	FarmersPercentage = 1.00

	// Flat commission amount paid to the referrer when a referred user completes
	// registration using a referral code.
	ReferralSignupCommissionAmountXAF = 200.00
	ReferralSignupCommissionCurrency  = "XAF"
	ReferralSignupCommissionOrderNum  = int64(0)

	CENT = 100

	ExtraFees = 100

	// DefaultOrderServiceFeeAmountXAF is a flat platform fee charged on every order.
	// It is NOT included in farmer payout calculations.
	DefaultOrderServiceFeeAmountXAF = 100.00
	DefaultOrderServiceFeeCurrency  = "XAF"
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

type ProductInfo struct {
	Product  *productsgrpc.Product
	Quantity int64
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

	order, err := querier.GetUserOrderBySecretKey(ctx,
		&req.SecretKey,
	)

	if err != nil {
		i.logger.Debug().Msgf("error getting order with secret key %v why: %v", req.GetSecretKey(), err)
		return nil, status.Errorf(codes.Internal, "error getting order with secret key %v why: %v", req.GetSecretKey(), err)
	}

	beforeBytes, err := protojson.Marshal(converters.SqlcOrderBySecretKeyToProto(order))
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

	updatedOrder, err := querier.GetUserOrderBySecretKey(ctx, order.SecretKey)

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error getting updated order %v", err)
	}

	afterBytes, err := protojson.Marshal(converters.SqlcOrderBySecretKeyToProto(updatedOrder))

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

	// If there's an agent assigned, pay them their delivery fee
	if order.AgentID != nil && *order.AgentID != "" {
		// Pay the agent their delivery fee
		if order.DeliveryFeeAmount != nil && *order.DeliveryFeeAmount > 0 {
			agentPaymentReference := fmt.Sprintf("agent-delivery-%s", strconv.FormatInt(order.OrderNumber, 10))
			deliveryFee := *order.DeliveryFeeAmount
			deliveryCurrency := "XAF"
			if order.DeliveryFeeCurrency != nil {
				deliveryCurrency = *order.DeliveryFeeCurrency
			}

			if !i.devMethodsEndabled && req.GetAgentPayoutPhoneNumber() != "" {
				_, payErr := i.paymentService.WithdrawFunds(ctx,
					req.GetAgentPayoutPhoneNumber(), deliveryFee,
					deliveryCurrency, fmt.Sprintf("delivery fee for order %v", order.OrderNumber),
					&agentPaymentReference)

				if payErr != nil {
					return nil, status.Errorf(codes.Internal, "error making agent payout %v", payErr)
				}
			}

			_, err = querier.CreatePayment(ctx, sqlc.CreatePaymentParams{
				PaymentEntity:  ordersgrpc.PaymentEntity_PaymentEntity_ORDER.String(),
				EntityID:       strconv.FormatInt(order.OrderNumber, 10),
				AmountValue:    &deliveryFee,
				AmountCurrency: &deliveryCurrency,
				AccountNumber:  req.GetAgentPayoutPhoneNumber(),
				Method:         ordersgrpc.PaymentMethodType_PaymentMethodType_ACCOUNT_BALANCE.String(),
				Status:         ordersgrpc.PaymentStatus_PaymentStatus_COMPLETED.String(),
				ExpiresAt:      pgtype.Timestamptz{Time: time.Now().Add(5 * time.Minute), Valid: true},
				CreatedBy:      order.AgentID,
				Type:           ordersgrpc.PaymentType_PaymentType_DEBIT.String(),
			})

			if err != nil {
				return nil, status.Errorf(codes.Internal, "error creating agent payment %v", err)
			}
		}

		// Also pay farmer if not already paid (farmer wasn't paid on DispatchOrder when agent was assigned)
		// We need to pay the farmer their share
		if order.ProductOwner != nil && order.PriceValue != nil && order.PriceCurrency != nil {
			farmerPaymentReference := fmt.Sprintf("farmer-payout-%s", strconv.FormatInt(order.OrderNumber, 10))
			payoutAmount := *order.PriceValue / TotalPercentage * FarmersPercentage

			// We need the farmer's payout phone number - it's stored in the order
			if order.PayoutPhoneNumber != nil && *order.PayoutPhoneNumber != "" {
				if !i.devMethodsEndabled {
					_, payErr := i.paymentService.WithdrawFunds(ctx,
						*order.PayoutPhoneNumber, payoutAmount,
						*order.PriceCurrency, fmt.Sprintf("payment to farmer for order %v", order.OrderNumber),
						&farmerPaymentReference)

					if payErr != nil {
						return nil, status.Errorf(codes.Internal, "error making farmer payout %v", payErr)
					}
				}

				_, err = querier.CreatePayment(ctx, sqlc.CreatePaymentParams{
					PaymentEntity:  ordersgrpc.PaymentEntity_PaymentEntity_ORDER.String(),
					EntityID:       strconv.FormatInt(order.OrderNumber, 10),
					AmountValue:    &payoutAmount,
					AmountCurrency: order.PriceCurrency,
					AccountNumber:  *order.PayoutPhoneNumber,
					Method:         ordersgrpc.PaymentMethodType_PaymentMethodType_ACCOUNT_BALANCE.String(),
					Status:         ordersgrpc.PaymentStatus_PaymentStatus_COMPLETED.String(),
					ExpiresAt:      pgtype.Timestamptz{Time: time.Now().Add(5 * time.Minute), Valid: true},
					CreatedBy:      *order.ProductOwner,
					Type:           ordersgrpc.PaymentType_PaymentType_DEBIT.String(),
				})

				if err != nil {
					return nil, status.Errorf(codes.Internal, "error creating farmer payment %v", err)
				}

				// Create commissions
				err = i.CreateCommissions(ctx, order, querier)
				if err != nil {
					return nil, status.Errorf(codes.Internal, "error creating commissions %v", err)
				}
			}
		}
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

	var paymentEntity ordersgrpc.PaymentEntity

	if strings.HasPrefix(req.GetOrderId(), "sub-") {
		paymentEntity = ordersgrpc.PaymentEntity_PaymentEntity_SUBSCRIPTION
	} else {
		paymentEntity = ordersgrpc.PaymentEntity_PaymentEntity_ORDER
	}

	payment, err := querier.GetPaymentByEntity(ctx, sqlc.GetPaymentByEntityParams{
		// req.GetReference(),
		PaymentEntity: paymentEntity.String(),
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

		beforeBytes, err := protojson.Marshal(converters.SqlcOrderByNumberToProto(order, i.logger))

		if err != nil {
			return nil, status.Errorf(codes.Internal, "failed to marshal proto order: %v", err)
		}

		var updatedPaymentStatus ordersgrpc.PaymentStatus
		var updatedOrderStatus ordersgrpc.OrderStatus
		shouldSendReceipt := false
		shouldNotifyFarmer := false

		if req.GetStatus() == TPWPaymentStatusCompleted {
			updatedPaymentStatus = ordersgrpc.PaymentStatus_PaymentStatus_COMPLETED
			updatedOrderStatus = ordersgrpc.OrderStatus_OrderStatus_PAYMENT_SUCCESSFUL
			shouldSendReceipt = true
			shouldNotifyFarmer = true
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

		afterBytes, err := protojson.Marshal(converters.SqlcOrderByNumberToProto(updatedOrder, i.logger))

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

		if shouldNotifyFarmer {
			i.logger.Debug().Msg("Attempting to notify farmer of new order.")

			// Unmarshal order.Items into a slice
			var items []*ordersgrpc.OrderItem
			if order.Items != nil {
				switch v := order.Items.(type) {
				case []byte:
					_ = json.Unmarshal(v, &items)
				case string:
					_ = json.Unmarshal([]byte(v), &items)
				default:
					items = []*ordersgrpc.OrderItem{}
				}
			}

			if len(items) == 0 {
				i.logger.Debug().Msgf("Order %d has no items; skipping farmer notification.", order.OrderNumber)
			} else {
				firstItem := items[0]

				// Get product details of first item
				productResp, err := i.productService.GetProduct(ctx, &productsgrpc.GetProductRequest{
					ProductId: firstItem.ProductId,
				})
				if err != nil {
					i.logger.Error().Msgf("Error getting product for farmer notification: %v", err)
				}

				// Farmer ID
				var farmerID string
				if updatedOrder.ProductOwner != nil {
					farmerID = *updatedOrder.ProductOwner
				}

				// Quantity of first item
				quantity := int32(firstItem.Quantity)

				// Buyer location
				buyerLocation := updatedOrder.DeliveryAddress

				// Build product description for message
				productName := productResp.GetProduct().GetName()
				extraCount := len(items) - 1
				var productDesc string
				if extraCount > 0 {
					productDesc = fmt.Sprintf("%s + %d more products", productName, extraCount)
				} else {
					productDesc = productName
				}

				if farmerID != "" {
					_, notifyErr := i.userService.NotifyFarmer(ctx, &usersgrpc.NotifyFarmerRequest{
						FarmerUserId:  farmerID,
						ProductName:   productDesc,
						Quantity:      quantity,
						BuyerLocation: buyerLocation,
					})
					if notifyErr != nil {
						i.logger.Warn().Err(notifyErr).Str("farmer_id", farmerID).Msg("Failed to send farmer order notification.")
					} else {
						i.logger.Info().Str("farmer_id", farmerID).Msg("Farmer order notification successfully dispatched.")
					}
				} else {
					i.logger.Debug().Msgf("Order %d has no associated farmer; skipping notification.", order.OrderNumber)
				}
			}
		}

		if shouldSendReceipt {

			// fetch the user and get their email.
			// NB: don't fail if receipt can't be sent.
			user, _ := i.userService.GetUserByID(ctx, &usersgrpc.GetUserByIDRequest{
				UserId: *order.CreatedBy,
			})

			i.logger.Debug().Msgf("Preparing receipt for user %v", user.GetUser().GetEmail())

			// 1. Fetch all order items
			items, err := i.repo.Do().GetOrderItemsByOrderNumber(ctx, int32(order.OrderNumber))
			if err != nil {
				i.logger.Error().Err(err).Msg("Failed to fetch order items for receipt")
			} else {
				// 2. Build receipt items list
				receiptItems := make([]email.ReceiptItem, 0, len(items))

				for _, it := range items {

					// fetch product from product service
					productResp, err := i.productService.GetProduct(ctx,
						&productsgrpc.GetProductRequest{ProductId: it.Product})

					if err != nil {
						i.logger.Error().
							Str("product_id", it.Product).
							Err(err).
							Msg("Failed to fetch product for receipt")
						continue // skip the product but continue
					}

					product := productResp.GetProduct()

					// 3. Append receipt item
					receiptItems = append(receiptItems, email.ReceiptItem{
						Name:     product.GetName(),
						Quantity: int64(it.Quantity),
						Amount: email.Amount{
							Value:           product.GetAmount().GetValue(),
							CurrencyIsoCode: product.GetAmount().GetCurrencyIsoCode(),
						},
						Unit: product.GetUnitType(),
					})
				}

				// 4. Prepare the receipt payload
				var deliveryFeeValue float64
				var deliveryFeeCurrency string
				if order.DeliveryFeeAmount != nil {
					deliveryFeeValue = *order.DeliveryFeeAmount
				}
				if order.DeliveryFeeCurrency != nil {
					deliveryFeeCurrency = *order.DeliveryFeeCurrency
				}

				receiptData := email.ReceiptData{
					ReceiptID:     GenerateReceiptNumber(order.OrderNumber),
					Date:          time.Now(),
					CompanyName:   "FoodHouse",
					CompanyEmail:  i.companyEmail,
					CompanyPhone:  i.companyPhone,
					CustomerName:  user.GetUser().GetFirstName() + " " + user.GetUser().GetLastName(),
					CustomerEmail: user.GetUser().GetEmail(),
					PaymentMethod: fmt.Sprintf(
						"%s ending in - %s",
						CleanLabel(ordersgrpc.PaymentMethodType_PaymentMethodType_MOBILE_MONEY.String(), "PaymentMethodType_"),
						Last4Chars(payment.AccountNumber),
					),
					TransactionID: payment.ID,
					Items:         receiptItems,
					ServiceFee:    email.Amount{Value: order.ServiceFeeAmount, CurrencyIsoCode: order.ServiceFeeCurrency},
					TransactionFee: email.Amount{
						Value: 0, CurrencyIsoCode: *payment.AmountCurrency,
					},
					DeliveryFee: email.Amount{Value: deliveryFeeValue, CurrencyIsoCode: deliveryFeeCurrency},
				}

				// 5. Send email
				if err := i.emailSender.SendPaymentReceipt(
					ctx,
					user.GetUser().GetEmail(),
					fmt.Sprintf(
						"%s %d",
						CleanLabel(ordersgrpc.PaymentEntity_PaymentEntity_ORDER.String(), "PaymentEntity_"),
						order.OrderNumber,
					),
					receiptData,
				); err != nil {
					i.logger.Error().Err(err).Msg("Error sending email receipt")
				}
			}
		}

		err = tx.Commit(ctx)
		if err != nil {
			return nil, status.Errorf(codes.Internal, "failed to commit transaction: %v", err)
		}

		return &ordersgrpc.ConfirmPaymentResponse{}, nil
	}

	// case for when payment is for a subscription
	if payment.PaymentEntity == ordersgrpc.PaymentEntity_PaymentEntity_SUBSCRIPTION.String() {

		userSubscription, err := querier.GetUserSubscriptionByPublicID(ctx, payment.EntityID)

		if err != nil {
			i.logger.Debug().Msgf("error getting subscription for payment with ref %v, why: %v", payment.ID, err)
			return nil, status.Errorf(codes.Internal, "error getting subscription for payment with ref %v, why: %v", payment.ID, err)
		}

		var updatedPaymentStatus ordersgrpc.PaymentStatus
		var shouldActivateSubscription = false

		if req.GetStatus() == TPWPaymentStatusCompleted {
			updatedPaymentStatus = ordersgrpc.PaymentStatus_PaymentStatus_COMPLETED
			shouldActivateSubscription = true
		} else {
			updatedPaymentStatus = ordersgrpc.PaymentStatus_PaymentStatus_FAILED
		}

		err = querier.UpdatePaymentStatus(ctx, sqlc.UpdatePaymentStatusParams{
			ID:     payment.ID,
			Status: updatedPaymentStatus.String(),
		})

		if err != nil {
			i.logger.Debug().Msgf("Error updating payment status %v", err)
			return nil, status.Errorf(codes.Internal, "error updating payment status %v", err)
		}

		if shouldActivateSubscription {
			// Activate the subscription
			err = querier.ActivateUserSubscription(ctx, payment.EntityID)
			if err != nil {
				return nil, status.Errorf(codes.Internal, "error activating subscription: %v", err)
			}

			// Create orders from subscription items
			err = i.createOrdersFromSubscription(ctx, userSubscription, querier)
			if err != nil {
				i.logger.Error().Err(err).Msg("error creating orders from subscription")
				return nil, status.Errorf(codes.Internal, "error creating orders from subscription: %v", err)
			}
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

	var productInfos []ProductInfo
	var farmerID string // will store the first product's created_by

	items := req.GetOrderItems()

	for _, it := range items {
		prod, err := i.productService.GetProduct(ctx, &productsgrpc.GetProductRequest{
			ProductId: it.GetProductId(),
		})
		if err != nil {
			return nil, status.Errorf(codes.Internal, "error fetching product %v", err)
		}

		p := prod.GetProduct()

		// If this is the first product, record the farmer ID
		if farmerID == "" {
			farmerID = p.GetCreatedBy()
		} else if p.GetCreatedBy() != farmerID {
			// Found mismatch → reject
			return nil, status.Error(codes.InvalidArgument,
				"A single order cannot contain products from different farmers")
		}

		productInfos = append(productInfos, ProductInfo{
			Product:  prod.GetProduct(),
			Quantity: it.GetQuantity(),
		})
	}

	// Calculate totalAmount as float64 to avoid type mismatch
	var totalAmount float64

	for _, p := range productInfos {
		totalAmount += p.Product.Amount.Value * float64(p.Quantity) * TotalPercentage
	}

	// Calculate the devliery fee
	deliveryFee, err := i.EstimateDeliveryFee(ctx, &ordersgrpc.EstimateDeliveryFeeRequest{
		UserId:           req.GetUserId(),
		OrderItems:       req.GetOrderItems(),
		DeliveryLocation: req.GetDeliveryLocation(),
	})

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error calculating delivery fee: %v", err)
	}

	args := sqlc.CreateOrderParams{
		DeliveryLocation: pgtype.Point{P: pgtype.Vec2{X: float64(req.GetDeliveryLocation().GetLon()),
			Y: float64(req.GetDeliveryLocation().GetLat())},
			Valid: true},
		PriceValue:          totalAmount,
		PriceCurrency:       productInfos[0].Product.GetAmount().GetCurrencyIsoCode(),
		Status:              ordersgrpc.OrderStatus_OrderStatus_CREATED.String(),
		CreatedBy:           req.UserId,
		SecretKey:           secretKey,
		ProductOwner:        productInfos[0].Product.GetCreatedBy(),
		DeliveryAddress:     req.GetDeliveryLocation().GetAddress(),
		DeliveryFeeAmount:   deliveryFee.EstimatedDeliveryFee.Value,
		DeliveryFeeCurrency: deliveryFee.EstimatedDeliveryFee.CurrencyIsoCode,
		ServiceFeeAmount:    DefaultOrderServiceFeeAmountXAF,
		ServiceFeeCurrency:  DefaultOrderServiceFeeCurrency,
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

	// create order items
	for _, it := range req.GetOrderItems() {
		err := querier.CreateOrderItem(ctx, sqlc.CreateOrderItemParams{
			OrderNumber: int32(order.OrderNumber),
			Product:     it.ProductId,
			Quantity:    int32(it.Quantity),
			UnitType:    it.UnitType,
		})

		if err != nil {
			i.logger.Debug().Msgf("Error creating order items %v", err)
			return nil, status.Errorf(codes.Internal, "error creating order items %v", err)
		}
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

	beforeBytes, err := protojson.Marshal(converters.SqlcOrderByNumberToProto(order, i.logger))

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

	// Get agent_id from request if provided
	agentID := req.GetAgentId()

	err = querier.UpdateOrderStatus(ctx, sqlc.UpdateOrderStatusParams{
		OrderNumber:  req.GetOrderNumber(),
		Status:       ordersgrpc.OrderStatus_OrderStatus_IN_TRANSIT.String(),
		DispatchedBy: &req.UserId,
	})

	// If agent_id is provided, update the order with agent assignment
	if agentID != "" {
		err = querier.UpdateOrderAgent(ctx, sqlc.UpdateOrderAgentParams{
			OrderNumber: req.GetOrderNumber(),
			AgentID:     &agentID,
		})
		if err != nil {
			return nil, status.Errorf(codes.Internal, "error assigning agent to order %v", err)
		}
	}

	updatedOrder, err := querier.GetOrderByOrderNumber(ctx, order.OrderNumber)

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error getting updated order %v", err)
	}

	afterBytes, err := protojson.Marshal(converters.SqlcOrderByNumberToProto(updatedOrder, i.logger))

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

	// Only make payouts if NO agent is assigned (farmer delivering themselves)
	// When agent is assigned, payment happens on ConfirmDelivery
	if agentID == "" {
		paymentReference := fmt.Sprintf("payout-%s", strconv.FormatInt(order.OrderNumber, 10))

		// calculate payout amount
		payoutAmount := *order.PriceValue / TotalPercentage * FarmersPercentage

		i.logger.Debug().Msgf("payout phone number %v", req.GetPayoutPhoneNumber())

		// only make real payout when dev methods is not enabled
		if !i.devMethodsEndabled {
			_, payErr := i.paymentService.WithdrawFunds(ctx,
				req.GetPayoutPhoneNumber(), payoutAmount,
				*order.PriceCurrency, fmt.Sprintf("payment to farmer for order %v", order.OrderNumber),
				&paymentReference)

			if payErr != nil {
				return nil, status.Errorf(codes.Internal, "error making payout %v", payErr)
			}
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

// CreateCommissions used to create commissions based on purchases.
// The business model has changed: commissions are now a flat fee per referred
// user registration (handled by CreateSignupCommission). Keep this method as a
// no-op for backward compatibility with existing call sites.
func (i *Impl) CreateCommissions(ctx context.Context, _ sqlc.GetOrderByOrderNumberRow, _ sqlc.Querier) error {
	return nil
}

// CreateSignupCommission creates a flat 200 XAF commission for a successful
// referral signup. It is intended to be called by the Users service when a
// referral is recorded during registration.
func (i *Impl) CreateSignupCommission(ctx context.Context, req *ordersgrpc.CreateSignupCommissionRequest) (*ordersgrpc.CreateSignupCommissionResponse, error) {
	if req.GetReferrerId() == "" || req.GetReferredId() == "" {
		return nil, status.Error(codes.InvalidArgument, "referrer_id and referred_id are required")
	}
	if req.GetReferrerId() == req.GetReferredId() {
		return nil, status.Error(codes.InvalidArgument, "referrer_id and referred_id cannot be the same")
	}

	querier, tx, err := i.repo.Begin(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to begin transaction: %v", err)
	}
	defer func() {
		err := tx.Rollback(ctx)
		if err != nil && !errors.Is(err, sql.ErrTxDone) {
			i.logger.Err(err).Msg("Failed to rollback transaction")
		}
	}()

	// Idempotency: use order_number=0 as a sentinel for signup commissions.
	// The existing unique constraint (referrer_id, referred_id, order_number)
	// prevents duplicates.
	_, err = querier.CreateCommission(ctx, sqlc.CreateCommissionParams{
		ReferrerID:       req.GetReferrerId(),
		ReferredID:       req.GetReferredId(),
		OrderNumber:      ReferralSignupCommissionOrderNum,
		CurrencyCode:     ReferralSignupCommissionCurrency,
		CommissionAmount: ReferralSignupCommissionAmountXAF,
	})
	if err != nil {
		// If it's a duplicate commission, treat as success (idempotent).
		if pgErr, ok := err.(*pgconn.PgError); ok && pgErr.Code == "23505" {
			if err := tx.Commit(ctx); err != nil {
				return nil, status.Errorf(codes.Internal, "failed to commit transaction: %v", err)
			}
			return &ordersgrpc.CreateSignupCommissionResponse{}, nil
		}
		return nil, status.Errorf(codes.Internal, "failed to create signup commission: %v", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to commit transaction: %v", err)
	}

	return &ordersgrpc.CreateSignupCommissionResponse{}, nil
}

func decodeOrderItems(raw interface{}) ([]sqlc.OrderItem, error) {
	if raw == nil {
		return []sqlc.OrderItem{}, nil
	}

	// Convert interface{} -> []byte
	rawBytes, err := json.Marshal(raw)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal interface{}: %w", err)
	}

	// Decode JSON array
	var items []sqlc.OrderItem
	err = json.Unmarshal(rawBytes, &items)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal order items: %w", err)
	}

	return items, nil
}

// createOrdersFromSubscription creates orders from subscription items when payment is confirmed
func (i *Impl) createOrdersFromSubscription(
	ctx context.Context,
	userSubscription sqlc.UserSubscription,
	querier sqlc.Querier,
) error {
	// Get user's location for delivery (fallback for older subscriptions that
	// don't have a subscription-specific delivery location yet).
	user, err := i.userService.GetUserByID(ctx, &usersgrpc.GetUserByIDRequest{
		UserId: userSubscription.UserID,
	})
	if err != nil {
		return fmt.Errorf("error getting user: %w", err)
	}

	var fallbackUserLocation *types.Point
	var fallbackUserAddress string
	if user.GetUser() != nil {
		fallbackUserLocation = user.GetUser().LocationCoordinates
		fallbackUserAddress = user.GetUser().GetAddress()
	}

	// Prefer subscription delivery location if present, otherwise fall back to
	// user profile location.
	var deliveryLocation *types.Point
	if userSubscription.DeliveryLocation.Valid {
		deliveryLocation = &types.Point{
			Lon: userSubscription.DeliveryLocation.P.X,
			Lat: userSubscription.DeliveryLocation.P.Y,
		}
	} else {
		deliveryLocation = fallbackUserLocation
	}

	deliveryAddress := userSubscription.DeliveryAddress
	if deliveryAddress == "" {
		deliveryAddress = fallbackUserAddress
	}

	if deliveryLocation == nil {
		return fmt.Errorf("delivery location not found for subscription (and user profile has no location)")
	}

	// Get subscription items
	subscriptionItems, err := querier.GetSubscriptionItemsBySubscriptionID(ctx, userSubscription.SubscriptionID)
	if err != nil {
		return fmt.Errorf("error getting subscription items: %w", err)
	}

	if len(subscriptionItems) == 0 {
		return fmt.Errorf("no subscription items found")
	}

	// Get subscription plan to check if it's custom
	subscriptionPlan, err := querier.GetSubscriptionByID(ctx, userSubscription.SubscriptionID)
	if err != nil {
		return fmt.Errorf("error getting subscription plan: %w", err)
	}

	// Check if this is a custom subscription (we'll use a flag in user_subscriptions after sqlc regenerate)
	// For now, we'll determine based on whether subscription_id is NULL or a special value
	// This will need to be updated after we add is_custom field support

	// Calculate expected delivery date based on estimated_delivery_time
	baseDeliveryDate := time.Now()

	if userSubscription.EstimatedDeliveryTime.Valid {
		// estimated_delivery_time is an interval, add it to now
		estimatedDays := int64(userSubscription.EstimatedDeliveryTime.Microseconds/(24*60*60*OneMillion)) +
			int64(userSubscription.EstimatedDeliveryTime.Days) +
			int64(userSubscription.EstimatedDeliveryTime.Months)*30
		if estimatedDays > 0 {
			baseDeliveryDate = time.Now().AddDate(0, 0, int(estimatedDays))
		} else {
			baseDeliveryDate = time.Now().AddDate(0, 0, 7)
		}
	} else {
		// Fallback to subscription plan duration
		totalDays := int64(subscriptionPlan.Duration.Months)*30 +
			int64(subscriptionPlan.Duration.Days) +
			subscriptionPlan.Duration.Microseconds/(24*60*60*OneMillion)
		if totalDays > 0 {
			baseDeliveryDate = time.Now().AddDate(0, 0, int(totalDays))
		} else {
			// Default to 7 days if not specified
			baseDeliveryDate = time.Now().AddDate(0, 0, 7)
		}
	}

	// Group items by (farmer_id, order_index) combination
	// Key format: "farmerID:orderIndex"
	type orderGroupKey struct {
		farmerID   string
		orderIndex int32
	}
	orderGroups := make(map[orderGroupKey][]sqlc.SubscriptionItem)

	for _, item := range subscriptionItems {
		prod, err := i.productService.GetProduct(ctx, &productsgrpc.GetProductRequest{
			ProductId: item.Product,
		})
		if err != nil {
			return fmt.Errorf("error fetching product %s: %w", item.Product, err)
		}

		p := prod.GetProduct()
		farmerID := p.GetCreatedBy()
		orderIdx := item.OrderIndex // OrderIndex is now a direct int32

		key := orderGroupKey{
			farmerID:   farmerID,
			orderIndex: orderIdx,
		}

		orderGroups[key] = append(orderGroups[key], item)
	}

	// Calculate delivery date increment per order (default 3 days between orders)
	deliveryDateIncrement := 3
	if userSubscription.EstimatedDeliveryTime.Valid {
		estimatedDays := int64(userSubscription.EstimatedDeliveryTime.Microseconds/(24*60*60*OneMillion)) +
			int64(userSubscription.EstimatedDeliveryTime.Days) +
			int64(userSubscription.EstimatedDeliveryTime.Months)*30
		if estimatedDays > 0 {
			// Distribute estimated days across order indices
			// Find max order index
			maxOrderIndex := int32(0)
			for key := range orderGroups {
				if key.orderIndex > maxOrderIndex {
					maxOrderIndex = key.orderIndex
				}
			}
			if maxOrderIndex > 0 {
				deliveryDateIncrement = int(estimatedDays) / int(maxOrderIndex+1)
			}
		}
	}

	// Create one order per (farmer_id, order_index) group
	for key, items := range orderGroups {
		farmerID := key.farmerID
		orderIndex := key.orderIndex

		// Calculate delivery date: base date + (order_index * increment)
		orderDeliveryDate := baseDeliveryDate.AddDate(0, 0, int(orderIndex)*deliveryDateIncrement)
		// Calculate total amount for this farmer's items
		var totalAmount float64
		var currency string

		for _, item := range items {
			prod, err := i.productService.GetProduct(ctx, &productsgrpc.GetProductRequest{
				ProductId: item.Product,
			})
			if err != nil {
				return fmt.Errorf("error fetching product %s: %w", item.Product, err)
			}
			p := prod.GetProduct()
			totalAmount += p.Amount.Value * float64(item.Quantity) * TotalPercentage
			currency = p.Amount.CurrencyIsoCode
		}

		// Calculate delivery fee
		orderItems := make([]*ordersgrpc.OrderItem, 0, len(items))
		for _, item := range items {
			orderItems = append(orderItems, &ordersgrpc.OrderItem{
				ProductId: item.Product,
				Quantity:  int64(item.Quantity),
				UnitType:  item.UnitType,
			})
		}

		deliveryFee, err := i.EstimateDeliveryFee(ctx, &ordersgrpc.EstimateDeliveryFeeRequest{
			UserId:           userSubscription.UserID,
			OrderItems:       orderItems,
			DeliveryLocation: deliveryLocation,
		})
		if err != nil {
			return fmt.Errorf("error calculating delivery fee: %w", err)
		}

		// Generate secret key
		secretKey, err := generateHexSecretKey(6)
		if err != nil {
			return fmt.Errorf("error generating secret key: %w", err)
		}

		// Create order
		order, err := querier.CreateOrder(ctx, sqlc.CreateOrderParams{
			DeliveryLocation: pgtype.Point{
				P:     pgtype.Vec2{X: float64(deliveryLocation.GetLon()), Y: float64(deliveryLocation.GetLat())},
				Valid: true,
			},
			PriceValue:          totalAmount,
			PriceCurrency:       currency,
			Status:              ordersgrpc.OrderStatus_OrderStatus_PAYMENT_SUCCESSFUL.String(),
			CreatedBy:           userSubscription.UserID,
			SecretKey:           secretKey,
			ProductOwner:        farmerID,
			DeliveryAddress:     deliveryAddress,
			DeliveryFeeAmount:   deliveryFee.EstimatedDeliveryFee.Value,
			DeliveryFeeCurrency: deliveryFee.EstimatedDeliveryFee.CurrencyIsoCode,
			ServiceFeeAmount:    DefaultOrderServiceFeeAmountXAF,
			ServiceFeeCurrency:  DefaultOrderServiceFeeCurrency,
			UserSubscriptionID:  &userSubscription.ID,
			ExpectedDeliveryDate: pgtype.Timestamptz{
				Time:  orderDeliveryDate,
				Valid: true,
			},
		})
		if err != nil {
			return fmt.Errorf("error creating order: %w", err)
		}

		// Create order items
		for _, item := range items {
			err := querier.CreateOrderItem(ctx, sqlc.CreateOrderItemParams{
				OrderNumber: int32(order.OrderNumber),
				Product:     item.Product,
				Quantity:    item.Quantity,
				UnitType:    item.UnitType,
			})
			if err != nil {
				return fmt.Errorf("error creating order item: %w", err)
			}
		}

		// Create audit log
		afterBytes, err := protojson.Marshal(converters.SqlcOrderToProto(order))
		if err != nil {
			i.logger.Error().Err(err).Msg("failed to marshal order for audit log")
		} else {
			err = querier.CreateOrderAuditLog(ctx, sqlc.CreateOrderAuditLogParams{
				OrderNumber:    order.OrderNumber,
				EventTimestamp: pgtype.Timestamptz{Time: time.Now(), Valid: true},
				Actor:          userSubscription.UserID,
				Action:         "CreateOrderFromSubscription",
				Reason:         fmt.Sprintf("Order created from subscription %s", userSubscription.PublicID),
				Before:         nil,
				After:          afterBytes,
			})
			if err != nil {
				i.logger.Error().Err(err).Msg("error creating order audit log")
			}
		}
	}

	return nil
}

// GetOrderDetails implements ordersgrpc.OrdersServer.
func (i *Impl) GetOrderDetails(ctx context.Context, req *ordersgrpc.GetOrderDetailsRequest) (*ordersgrpc.GetOrderDetailsResponse, error) {
	sqlcOrder, err := i.repo.Do().GetOrderByOrderNumber(ctx, req.GetOrderNumber())
	if err != nil {
		return nil, status.Errorf(codes.Internal, "error getting order %v: %v", req.GetOrderNumber(), err)
	}

	orderItems, err := decodeOrderItems(sqlcOrder.Items)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to decode order items: %v", err)
	}

	// 1. ENRICH ORDER ITEMS.
	enrichedItems := make([]*ordersgrpc.OrderItem, 0)

	for index, item := range orderItems {
		prodResp, err := i.productService.GetProduct(ctx, &productsgrpc.GetProductRequest{
			ProductId: item.Product,
		})

		if err != nil {
			return nil, status.Errorf(codes.Internal, "error fetching product %v: %v", item.Product, err)
		}

		i.logger.Debug().Msgf("product for order %v: %v", index, prodResp)

		enrichedItems = append(enrichedItems, &ordersgrpc.OrderItem{
			ProductId:    prodResp.GetProduct().GetId(),
			Quantity:     int64(item.Quantity),
			UnitType:     item.UnitType,
			ProductImage: prodResp.GetProduct().GetImage(),
			ProductName:  prodResp.GetProduct().GetName(),
			ProductUnitPrice: &types.Amount{
				Value:           prodResp.GetProduct().GetAmount().GetValue(),
				CurrencyIsoCode: prodResp.GetProduct().GetAmount().GetCurrencyIsoCode(),
			},
		})
	}

	// replace items with enriched version.
	sqlcOrder.Items = enrichedItems

	i.logger.Debug().Msgf("SQLC order: %v", sqlcOrder)

	// 2. AUDIT LOGS.
	sqlcAuditLogs, err := i.repo.Do().ListOrderAuditLogs(ctx, req.GetOrderNumber())
	if err != nil {
		return nil, status.Errorf(codes.Internal, "error fetching audit logs %v", err)
	}

	protoAuditLogs, err := converters.SqlcToProtoOrderAuditLogs(sqlcAuditLogs)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "error converting sqlc to proto audit logs %v", err)
	}

	// 3. CONVERT ORDER + ITEMS TO PROTO.
	protoOrder := converters.SqlcOrderByNumberToProto(sqlcOrder, i.logger)

	return &ordersgrpc.GetOrderDetailsResponse{
		Order:    protoOrder,
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

	protoOrders := converters.SqlcFarmerOrdersToProto(orders)

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

	protoOrders := converters.SqlcUserOrdersToProto(orders)

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

		// Fix: totalPrice is a *float64, but *order.PriceValue + *order.DeliveryFeeAmount is a float64.
		// So, create a new variable to hold the sum and take its address.
		sum := *order.PriceValue + *order.DeliveryFeeAmount + order.ServiceFeeAmount
		totalPrice = &sum

	}

	if req.GetPaymentEntity() == ordersgrpc.PaymentEntity_PaymentEntity_SUBSCRIPTION {
		subscription, newErr := querier.GetUserSubscriptionByPublicID(ctx, req.GetEntityId())
		if newErr != nil {
			return nil, status.Errorf(codes.Internal, "error getting subscription for payment %v", newErr)
		}

		sum := float64(subscription.Amount)
		totalPrice = &sum

	}

	payment, err := querier.CreatePayment(ctx, sqlc.CreatePaymentParams{
		PaymentEntity:  req.GetPaymentEntity().String(),
		EntityID:       req.GetEntityId(),
		AmountValue:    totalPrice,
		AmountCurrency: &req.GetAmount().CurrencyIsoCode,
		AccountNumber:  req.GetAccount().GetAccountNumber(),
		Method:         req.GetAccount().GetPaymentMethod().String(),
		Status:         ordersgrpc.PaymentStatus_PaymentStatus_INITIATED.String(),
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

	// make request to TPW to initiate actual payment only when dev methods is not enabled
	if !i.devMethodsEndabled {
		_, payErr := i.paymentService.RequestPayment(ctx, formattedNumber, *totalPrice, req.GetAmount().GetCurrencyIsoCode(), req.GetPaymentEntity().String(), &req.EntityId)

		if payErr != nil {
			i.logger.Debug().Msgf("payment error %v", payErr)
			return nil, status.Errorf(codes.Internal, "error initiating payment %v", payErr)
		}
	}

	err = tx.Commit(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to commit transaction: %v", err)
	}

	// after committing the transaction, make call the confirm order immediately, if devMethods is enabled
	if i.devMethodsEndabled {
		_, confirmErr := i.ConfirmPayment(ctx, &ordersgrpc.ConfirmPaymentRequest{
			Status:  TPWPaymentStatusCompleted,
			OrderId: req.EntityId,
		})

		if confirmErr != nil {
			i.logger.Debug().Msgf("error processing payment: %v", confirmErr)
			return nil, status.Errorf(codes.Internal, "error processing payment: %v", confirmErr)
		}
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

	// if req.GetUserId() != *order.ProductOwner {
	// 	return nil, status.Error(codes.PermissionDenied, "user does not have permission to approve this order")
	// }

	beforeBytes, err := protojson.Marshal(converters.SqlcOrderByNumberToProto(order, i.logger))
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

	afterBytes, err := protojson.Marshal(converters.SqlcOrderByNumberToProto(updatedOrder, i.logger))

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
	SumTotal  float64            `json:"sum_total"`
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
func (i *Impl) GetFarmerEarnings(
	ctx context.Context,
	req *ordersgrpc.GetFarmerEarningsRequest,
) (*ordersgrpc.GetFarmerEarningsResponse, error) {

	i.logger.Debug().Msgf("Filter from request: %v", req.GetFilter())

	filterCtx, err := GetFilterContext(req.GetFilter())
	if err != nil {
		return nil, status.Errorf(codes.Internal, "error getting context %v", err)
	}

	i.logger.Debug().Msgf("Filter ctx: %v", filterCtx)

	var rawResults []Group

	// ----------------------------
	// Fetch SQL grouped by interval
	// ----------------------------

	switch filterCtx.GroupBy {
	case GroupByDay:
		rows, err := i.repo.Do().GetOrdersGroupedByDay(ctx, sqlc.GetOrdersGroupedByDayParams{
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

		i.logger.Debug().Msgf("sqlc rows: %v", rows)

		rawResults = make([]Group, len(rows))

		for i, r := range rows {
			rawResults[i] = Group{
				GroupDate: pgtype.Timestamptz{Valid: true, Time: r.GroupDate},
				SumTotal:  r.SumTotal,
			}
		}

		i.logger.Debug().Msgf("raw results: %v", rawResults)

	case GroupByMonth:
		rows, err := i.repo.Do().GetOrdersGroupedByMonth(ctx, sqlc.GetOrdersGroupedByMonthParams{
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
			return nil, status.Errorf(codes.Internal, "error getting earnings by month: %v", err)
		}

		i.logger.Debug().Msgf("sqlc rows: %v", rows)

		rawResults = make([]Group, len(rows))
		for i, r := range rows {
			rawResults[i] = Group{
				GroupDate: pgtype.Timestamptz{Valid: true, Time: r.GroupDate},
				SumTotal:  r.SumTotal,
			}
		}

		i.logger.Debug().Msgf("raw sqlc: %v", rawResults)

	case GroupByYear:
		rows, err := i.repo.Do().GetOrdersGroupedByYear(ctx, sqlc.GetOrdersGroupedByYearParams{
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
			return nil, status.Errorf(codes.Internal, "error getting earnings by year: %v", err)
		}

		i.logger.Debug().Msgf("sqlc rows: %v", rows)

		rawResults = make([]Group, len(rows))
		for i, r := range rows {
			rawResults[i] = Group{
				GroupDate: pgtype.Timestamptz{Valid: true, Time: r.GroupDate},
				SumTotal:  r.SumTotal,
			}
		}

		i.logger.Debug().Msgf("raw results: %v", rawResults)
	}

	// ----------------------------
	// Group by date bucket
	// ----------------------------
	grouped := make(map[string]float64)

	for _, row := range rawResults {
		key := row.GroupDate.Time.Format(filterCtx.Format)
		grouped[key] += row.SumTotal
	}

	i.logger.Debug().Msgf("grouped : %v", grouped)
	// ----------------------------
	// Compute earnings (no product service)
	// ----------------------------
	results := make([]*ordersgrpc.FarmerEarningsData, 0, len(grouped))

	for dateStr, total := range grouped {
		earnings := total * FarmersPercentage
		results = append(results, &ordersgrpc.FarmerEarningsData{
			Date:  dateStr,
			Value: earnings,
		})
	}

	i.logger.Debug().Msgf("results: %v", results)

	// Fill missing dates (unchanged)
	results = fillMissingDates(results, filterCtx)

	i.logger.Debug().Msgf("final results: %v", results)

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

	// if req.GetUserId() != *order.ProductOwner {
	// 	return nil, status.Error(codes.PermissionDenied, "user does not have permission to approve this order")
	// }

	beforeBytes, err := protojson.Marshal(converters.SqlcOrderByNumberToProto(order, i.logger))
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

	// only make refunds when devMethodsEnabled is false
	if !i.devMethodsEndabled {
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

	afterBytes, err := protojson.Marshal(converters.SqlcOrderByNumberToProto(updatedOrder, i.logger))

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

	// 5. Make the payout. (Only when dev methods is not enabled, i.e. only in production)
	if !i.devMethodsEndabled {
		_, payErr := i.paymentService.WithdrawFunds(ctx,
			user.GetUser().GetPhoneNumber(), total,
			commissions[0].CurrencyCode, fmt.Sprintf("payment for commissions %v-%v", commissions[0].ID, commissions[len(commissions)-1].ID),
			&commissions[0].ID)

		if payErr != nil {
			return nil, status.Errorf(codes.Internal, "error making payout %v", payErr)
		}
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
// using multiple products here.
func (i *Impl) EstimateDeliveryFee(ctx context.Context,
	req *ordersgrpc.EstimateDeliveryFeeRequest,
) (*ordersgrpc.EstimateDeliveryFeeResponse, error) {

	productIDs := make([]string, 0)

	for _, it := range req.GetOrderItems() {
		productIDs = append(productIDs, it.GetProductId())
	}

	deliveryFee, err := i.productService.GetDeliveryFee(ctx, &productsgrpc.GetDeliveryFeeRequest{
		ProductIds: productIDs,
	})

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error getting delivery fee, reason: %v", err)
	}

	farmer, err := i.userService.GetUserByID(ctx, &usersgrpc.GetUserByIDRequest{
		UserId: deliveryFee.FarmerId,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "error getting farmer with id %v: reason: %v", deliveryFee.FarmerId, err)
	}

	// Defensive check: farmer and nested fields
	if farmer == nil || farmer.User == nil {
		return nil, status.Errorf(codes.Internal, "farmer user data missing for id %v", deliveryFee.FarmerId)
	}

	// Safe distance calculation
	distance := Distance(req.DeliveryLocation, farmer.User.LocationCoordinates)
	i.logger.Debug().Msgf("delivery distance in km: %v", distance)

	return &ordersgrpc.EstimateDeliveryFeeResponse{
		EstimatedDeliveryFee: deliveryFee.GetAmount(),
	}, nil
}

// CreateSubscriptionPlan implements ordersgrpc.OrdersServer.
func (i *Impl) CreateSubscriptionPlan(
	ctx context.Context,
	req *ordersgrpc.CreateSubscriptionPlanRequest) (
	*ordersgrpc.CreateSubscriptionPlanResponse, error) {
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

	// 1. Create the subscription
	var estimatedDeliveryTime pgtype.Interval
	if req.EstimatedDeliveryTimeDays != nil && *req.EstimatedDeliveryTimeDays > 0 {
		estimatedDeliveryTime = pgtype.Interval{
			Days:  int32(*req.EstimatedDeliveryTimeDays),
			Valid: true,
		}
	}

	subscription, err := querier.CreateSubscription(ctx, sqlc.CreateSubscriptionParams{
		Title:                 req.GetTitle(),
		Description:           req.GetDescription(),
		Amount:                int64(req.GetAmount().GetValue()),
		CurrencyIsoCode:       req.GetAmount().GetCurrencyIsoCode(),
		Duration:              pgtype.Interval{Microseconds: req.GetDuration() * 7 * 24 * 60 * 60 * OneMillion, Valid: true}, // duration is in weeks
		EstimatedDeliveryTime: estimatedDeliveryTime,
	})

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error creating subscription plan: %v", err)
	}

	subItems := make([]*ordersgrpc.SubscriptionItem, len(req.GetSubscriptionItems()))

	// create the subscription items
	for _, si := range req.GetSubscriptionItems() {
		// fetch the product
		product, err := i.productService.GetProduct(ctx, &productsgrpc.GetProductRequest{ProductId: si.ProductId})

		if err != nil {
			return nil, status.Errorf(codes.Internal, "error fetching product for subscription item: %v", err)
		}

		orderIndex := si.GetOrderIndex() // OrderIndex is now a direct int32

		_, err = querier.CreateSubscriptionItem(ctx, sqlc.CreateSubscriptionItemParams{
			SubscriptionID: subscription.ID,
			Product:        si.ProductId,
			Quantity:       int32(si.Quantity),
			UnitType:       product.GetProduct().GetUnitType(),
			OrderIndex:     orderIndex,
		})

		if err != nil {
			return nil, status.Errorf(codes.Internal, "error creating subscription item: %v", err)
		}

		subItems = append(subItems, &ordersgrpc.SubscriptionItem{
			ProductId:        si.ProductId,
			ProductImage:     product.GetProduct().GetImage(),
			ProductName:      product.GetProduct().GetName(),
			ProductUnitPrice: product.GetProduct().GetAmount(),
			UnitType:         product.GetProduct().GetUnitType(),
			SubscriptionId:   subscription.ID,
			OrderIndex:       si.GetOrderIndex(), // OrderIndex is now a direct int32
		})
	}

	// 7. Commit transaction.
	if err := tx.Commit(ctx); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to commit transaction: %v", err)
	}

	return &ordersgrpc.CreateSubscriptionPlanResponse{
		SubscriptionPlan: converters.SqlcSubscriptionToProto(subscription, subItems),
	}, nil
}

// Subscribe implements ordersgrpc.OrdersServer.
func (i *Impl) Subscribe(
	ctx context.Context,
	req *ordersgrpc.SubscribeRequest) (
	*ordersgrpc.SubscribeResponse, error) {
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

	subscriptionPlan, err := querier.GetSubscriptionByID(ctx, req.GetSubscriptionPlanId())

	if err != nil {
		return nil, status.Errorf(codes.Internal,
			"error fetching subscription plan with id %v, reason: %v",
			req.GetSubscriptionPlanId(), err)
	}

	// Convert subscription plan duration to estimated_delivery_time
	var estimatedDeliveryTime pgtype.Interval
	totalDays := int64(subscriptionPlan.Duration.Months)*30 +
		int64(subscriptionPlan.Duration.Days) +
		subscriptionPlan.Duration.Microseconds/(24*60*60*OneMillion)
	if totalDays > 0 {
		estimatedDeliveryTime = pgtype.Interval{
			Microseconds: totalDays * 24 * 60 * 60 * OneMillion,
			Days:         int32(totalDays % 30),
			Months:       int32(totalDays / 30),
			Valid:        true,
		}
	}

	if req.GetDeliveryLocation() == nil {
		return nil, status.Error(codes.InvalidArgument, "delivery_location is required for subscription")
	}

	deliveryLoc := pgtype.Point{
		P:     pgtype.Vec2{X: float64(req.GetDeliveryLocation().GetLon()), Y: float64(req.GetDeliveryLocation().GetLat())},
		Valid: true,
	}
	deliveryAddr := req.GetDeliveryLocation().GetAddress()

	subscription, err := querier.CreateUserSubscription(ctx,
		sqlc.CreateUserSubscriptionParams{
			UserID:                req.GetUserId(),
			SubscriptionID:        req.GetSubscriptionPlanId(),
			Active:                false,
			Amount:                subscriptionPlan.Amount,
			CurrencyIsoCode:       subscriptionPlan.CurrencyIsoCode,
			EstimatedDeliveryTime: estimatedDeliveryTime,
			IsCustom:              false,
			DailyDeliveryLimit:    nil,
			DeliveryLocation:      deliveryLoc,
			DeliveryAddress:       deliveryAddr,
		})

	err = tx.Commit(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to commit transaction: %v", err)
	}

	return &ordersgrpc.SubscribeResponse{
		Subscription: converters.SqlcUserSubscriptionToProto(subscription),
	}, nil
}

// ListAllActiveSubscriptions implements ordersgrpc.OrdersServer.
func (i *Impl) ListAllActiveSubscriptions(
	ctx context.Context,
	req *ordersgrpc.ListAllActiveSubscriptionsRequest) (
	*ordersgrpc.ListAllActiveSubscriptionsResponse, error) {

	// Filter by active status (defaults to true if not specified)
	activeOnly := true
	if req.ActiveOnly != nil {
		activeOnly = req.GetActiveOnly()
	}

	var subscriptions []sqlc.ListAllActiveUserSubscriptionsRow
	var err error

	if activeOnly {
		subscriptions, err = i.repo.Do().ListAllActiveUserSubscriptions(ctx)
		if err != nil {
			return nil, status.Errorf(codes.Internal, "error fetching active subscriptions: %v", err)
		}
	} else {
		// If not active only, get all subscriptions and convert to rows
		allSubs, err := i.repo.Do().GetAllUserSubscriptions(ctx)
		if err != nil {
			return nil, status.Errorf(codes.Internal, "error fetching subscriptions: %v", err)
		}
		// Convert UserSubscription to ListAllActiveUserSubscriptionsRow (without soonest date)
		subscriptions = make([]sqlc.ListAllActiveUserSubscriptionsRow, 0, len(allSubs))
		for _, sub := range allSubs {
			subscriptions = append(subscriptions, sqlc.ListAllActiveUserSubscriptionsRow{
				ID:                    sub.ID,
				PublicID:              sub.PublicID,
				UserID:                sub.UserID,
				SubscriptionID:        sub.SubscriptionID,
				Active:                sub.Active,
				CreatedAt:             sub.CreatedAt,
				UpdatedAt:             sub.UpdatedAt,
				ExpiresAt:             sub.ExpiresAt,
				Progress:              sub.Progress,
				Amount:                sub.Amount,
				CurrencyIsoCode:       sub.CurrencyIsoCode,
				EstimatedDeliveryTime: sub.EstimatedDeliveryTime,
				IsCustom:              sub.IsCustom,
				DailyDeliveryLimit:    sub.DailyDeliveryLimit,
				SoonestDeliveryDate:   time.Time{}, // No soonest date for non-active filtering
			})
		}
	}

	const OneMillion = 1000000

	// Preload orders per user so we can compute progress as:
	// progress% = (# delivered orders for this subscription) / (total orders for this subscription) * 100
	ordersByUserID := make(map[string][]sqlc.ListUserOrdersRow)
	for _, row := range subscriptions {
		uid := row.UserID
		if uid == "" {
			continue
		}
		if _, ok := ordersByUserID[uid]; ok {
			continue
		}
		orders, err := i.repo.Do().ListUserOrders(ctx, sqlc.ListUserOrdersParams{
			CreatedBy:        &uid,
			IncludedStatuses: []string{}, // All statuses
			CreatedBefore:    time.Time{},
			SearchKey:        "",
			Count:            10000,
		})
		if err != nil {
			return nil, status.Errorf(codes.Internal, "error listing orders for user %s: %v", uid, err)
		}
		ordersByUserID[uid] = orders
	}

	protoSubscriptions := make([]*ordersgrpc.UserSubscription, 0, len(subscriptions))
	for _, row := range subscriptions {
		// Convert row to UserSubscription proto
		progress := 0.0
		// Prefer computed progress from orders; fall back to stored progress if no orders exist.
		if userOrders, ok := ordersByUserID[row.UserID]; ok {
			total := 0
			delivered := 0
			for _, o := range userOrders {
				if o.UserSubscriptionID != nil && *o.UserSubscriptionID == row.ID {
					total++
					if o.Status == ordersgrpc.OrderStatus_OrderStatus_DELIVERED.String() {
						delivered++
					}
				}
			}
			if total > 0 {
				progress = (float64(delivered) / float64(total)) * 100.0
			} else if row.Progress != nil {
				progress = *row.Progress
			}
		} else if row.Progress != nil {
			progress = *row.Progress
		}

		var estimatedDeliveryTimeDays *int64
		if row.EstimatedDeliveryTime.Valid {
			totalDays := int64(row.EstimatedDeliveryTime.Months)*30 +
				int64(row.EstimatedDeliveryTime.Days) +
				row.EstimatedDeliveryTime.Microseconds/(24*60*60*OneMillion)
			estimatedDeliveryTimeDays = &totalDays
		}

		result := &ordersgrpc.UserSubscription{
			Id:                 fmt.Sprintf("%d", row.ID),
			PublicId:           row.PublicID,
			UserId:             row.UserID,
			SubscriptionPlanId: row.SubscriptionID,
			Active:             row.Active,
			Progress:           progress,
			Amount: &types.Amount{
				Value:           float64(row.Amount),
				CurrencyIsoCode: row.CurrencyIsoCode,
			},
			IsCustom: row.IsCustom,
		}

		if row.CreatedAt.Valid {
			result.CreatedAt = timestamppb.New(row.CreatedAt.Time)
		}
		if row.UpdatedAt.Valid {
			result.UpdatedAt = timestamppb.New(row.UpdatedAt.Time)
		}
		if row.ExpiresAt.Valid {
			result.ExpiresAt = timestamppb.New(row.ExpiresAt.Time)
		}
		if estimatedDeliveryTimeDays != nil {
			result.EstimatedDeliveryTimeDays = estimatedDeliveryTimeDays
		}
		if row.DailyDeliveryLimit != nil {
			result.DailyDeliveryLimit = row.DailyDeliveryLimit
		}
		// Handle SoonestDeliveryDate - check if it's not zero (NULL means zero time)
		if !row.SoonestDeliveryDate.IsZero() {
			result.SoonestDeliveryDate = timestamppb.New(row.SoonestDeliveryDate)
		}

		protoSubscriptions = append(protoSubscriptions, result)
	}

	return &ordersgrpc.ListAllActiveSubscriptionsResponse{
		Subscriptions: protoSubscriptions,
	}, nil
}

// convertListOrdersDueSoonRowToProto converts ListOrdersDueSoonRow to Order proto
func convertListOrdersDueSoonRowToProto(order sqlc.ListOrdersDueSoonRow) *ordersgrpc.Order {
	var price *types.Amount
	if order.PriceValue != nil && order.PriceCurrency != nil {
		price = &types.Amount{
			Value:           *order.PriceValue,
			CurrencyIsoCode: *order.PriceCurrency,
		}
	}

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

	var previewItems []*ordersgrpc.OrderItem
	if order.PreviewProduct != "" {
		previewItems = []*ordersgrpc.OrderItem{
			{
				ProductId: order.PreviewProduct,
				Quantity:  int64(order.PreviewQuantity),
			},
		}
	}

	derefString := func(s *string) string {
		if s != nil {
			return *s
		}
		return ""
	}

	derefFloat := func(f *float64) float64 {
		if f != nil {
			return *f
		}
		return 0.0
	}

	result := &ordersgrpc.Order{
		OrderNumber: fmt.Sprintf("%d", order.OrderNumber),
		SumTotal:    price,
		Status:      statusEnum,
		TotalItems:  order.TotalItems,
		OrderItems:  previewItems,
		DeliveryLocation: &types.Point{
			Address: order.DeliveryAddress,
			Lat:     order.DeliveryLocation.P.Y,
			Lon:     order.DeliveryLocation.P.X,
		},
		CreatedBy:         derefString(order.CreatedBy),
		ProductOwner:      derefString(order.ProductOwner),
		PayoutPhoneNumber: derefString(order.PayoutPhoneNumber),
		DispatchedBy:      derefString(order.DispatchedBy),
		SecretKey:         derefString(order.SecretKey),
		DeliveryFee: &types.Amount{
			Value:           derefFloat(order.DeliveryFeeAmount),
			CurrencyIsoCode: derefString(order.DeliveryFeeCurrency),
		},
		ServiceFee: &types.Amount{
			Value:           order.ServiceFeeAmount,
			CurrencyIsoCode: order.ServiceFeeCurrency,
		},
	}

	if order.CreatedAt.Valid {
		result.CreatedAt = timestamppb.New(order.CreatedAt.Time)
	}
	if order.UpdatedAt.Valid {
		result.UpdatedAt = timestamppb.New(order.UpdatedAt.Time)
	}
	if order.ExpectedDeliveryDate.Valid {
		result.ExpectedDeliveryDate = timestamppb.New(order.ExpectedDeliveryDate.Time)
	}
	if order.Rating.Valid {
		result.Rating = int32(order.Rating.Int.Int64())
	}
	if order.Review != "" {
		result.Review = order.Review
	}

	return result
}

// ListUserSubscriptions implements ordersgrpc.OrdersServer.
func (i *Impl) ListUserSubscriptions(
	ctx context.Context,
	req *ordersgrpc.ListUserSubscriptionsRequest) (
	*ordersgrpc.ListUserSubscriptionsResponse, error) {

	subscriptions, err := i.repo.Do().ListUserSubscriptionsByUserID(ctx, req.GetUserId())
	if err != nil {
		return nil, status.Errorf(codes.Internal, "error listing user subscriptions: %v", err)
	}

	// Filter by active if requested
	result := make([]*ordersgrpc.UserSubscription, 0, len(subscriptions))
	for _, sub := range subscriptions {
		if req.ActiveOnly != nil && *req.ActiveOnly && !sub.Active {
			continue
		}
		result = append(result, converters.SqlcUserSubscriptionToProto(sub))
	}

	return &ordersgrpc.ListUserSubscriptionsResponse{
		Subscriptions: result,
	}, nil
}

// GetUserSubscriptionDetails implements ordersgrpc.OrdersServer.
func (i *Impl) GetUserSubscriptionDetails(
	ctx context.Context,
	req *ordersgrpc.GetUserSubscriptionDetailsRequest) (
	*ordersgrpc.GetUserSubscriptionDetailsResponse, error) {

	subscriptionIDInt, err := strconv.ParseInt(req.GetSubscriptionId(), 10, 64)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid subscription id: %v", err)
	}

	subscription, err := i.repo.Do().GetUserSubscriptionByID(ctx, subscriptionIDInt)
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "subscription not found: %v", err)
	}

	// Verify user owns this subscription
	if subscription.UserID != req.GetUserId() {
		return nil, status.Errorf(codes.PermissionDenied, "user does not own this subscription")
	}

	// Get orders for this subscription
	orders, err := i.repo.Do().ListUserOrders(ctx, sqlc.ListUserOrdersParams{
		CreatedBy:        &req.UserId,
		IncludedStatuses: []string{}, // Get all orders
		CreatedBefore:    time.Time{},
		SearchKey:        "",
		Count:            1000, // Large limit to get all orders
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "error listing orders: %v", err)
	}

	// Filter orders that belong to this subscription
	subscriptionOrders := make([]*ordersgrpc.Order, 0)
	for _, order := range orders {
		if order.UserSubscriptionID != nil && *order.UserSubscriptionID == subscription.ID {
			subscriptionOrders = append(subscriptionOrders, converters.SqlcUserOrderRowToProto(order))
		}
	}

	return &ordersgrpc.GetUserSubscriptionDetailsResponse{
		Subscription: converters.SqlcUserSubscriptionToProto(subscription),
		Orders:       subscriptionOrders,
	}, nil
}

// ListOrdersDueSoon implements ordersgrpc.OrdersServer.
func (i *Impl) ListOrdersDueSoon(
	ctx context.Context,
	req *ordersgrpc.ListOrdersDueSoonRequest) (
	*ordersgrpc.ListOrdersDueSoonResponse, error) {

	orders, err := i.repo.Do().ListOrdersDueSoon(ctx, int32(req.GetDays()))
	if err != nil {
		return nil, status.Errorf(codes.Internal, "error listing orders due soon: %v", err)
	}

	result := make([]*ordersgrpc.Order, 0, len(orders))
	for _, orderRow := range orders {
		// Convert ListOrdersDueSoonRow to Order (helper function defined above)
		result = append(result, convertListOrdersDueSoonRowToProto(orderRow))
	}

	return &ordersgrpc.ListOrdersDueSoonResponse{
		Orders: result,
	}, nil
}

// CreateCustomSubscription implements ordersgrpc.OrdersServer.
func (i *Impl) CreateCustomSubscription(
	ctx context.Context,
	req *ordersgrpc.CreateCustomSubscriptionRequest) (
	*ordersgrpc.CreateCustomSubscriptionResponse, error) {

	querier, tx, err := i.repo.Begin(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to begin transaction: %v", err)
	}

	defer func() {
		err = tx.Rollback(ctx)
		if err != nil && !errors.Is(err, sql.ErrTxDone) {
			i.logger.Err(err).Msgf("Failed to rollback transaction: %v", req)
		}
	}()

	// Validate all products are from same farmer and fetch product info
	var farmerID string
	type itemWithProduct struct {
		item    *ordersgrpc.SubscriptionItem
		product *productsgrpc.Product
		amount  float64
	}
	itemsWithProducts := make([]itemWithProduct, 0, len(req.GetSubscriptionItems()))

	for _, item := range req.GetSubscriptionItems() {
		prod, err := i.productService.GetProduct(ctx, &productsgrpc.GetProductRequest{
			ProductId: item.GetProductId(),
		})
		if err != nil {
			return nil, status.Errorf(codes.Internal, "error fetching product %v: %v", item.GetProductId(), err)
		}

		p := prod.GetProduct()
		if farmerID == "" {
			farmerID = p.GetCreatedBy()
		} else if p.GetCreatedBy() != farmerID {
			return nil, status.Error(codes.InvalidArgument,
				"All products in custom subscription must be from the same farmer")
		}

		itemAmount := p.Amount.Value * float64(item.GetQuantity())
		itemsWithProducts = append(itemsWithProducts, itemWithProduct{
			item:    item,
			product: p,
			amount:  itemAmount,
		})
	}

	// Get max amount per order (default 50k XAF = 5000000 cents)
	maxAmountPerOrderCents := int64(5000000) // 50k XAF default
	if req.MaxAmountPerOrder != nil && *req.MaxAmountPerOrder > 0 {
		maxAmountPerOrderCents = *req.MaxAmountPerOrder
	}

	type orderGroup struct {
		orderIndex int32
		items      []itemWithProduct
		total      float64
	}
	// IMPORTANT: Do NOT auto-split items into orders based on max amount.
	// The client provides order_index on each SubscriptionItem; we persist it as-is.
	// Later, when orders are generated from the subscription, items with the same
	// order_index are grouped into the same order.
	groupMap := make(map[int32]*orderGroup)
	maxOrderIndex := int32(0)
	for _, itemWithProd := range itemsWithProducts {
		oi := itemWithProd.item.GetOrderIndex() // defaults to 0 when omitted
		if oi > maxOrderIndex {
			maxOrderIndex = oi
		}
		g := groupMap[oi]
		if g == nil {
			g = &orderGroup{orderIndex: oi, items: []itemWithProduct{}, total: 0}
			groupMap[oi] = g
		}
		g.items = append(g.items, itemWithProd)
		g.total += itemWithProd.amount
	}

	orderGroups := make([]orderGroup, 0, len(groupMap))
	for _, g := range groupMap {
		orderGroups = append(orderGroups, *g)
	}

	// Validate total doesn't exceed budget
	totalAmount := float64(0)
	for _, group := range orderGroups {
		totalAmount += group.total
	}
	if totalAmount > req.GetBudget().GetValue() {
		return nil, status.Errorf(codes.InvalidArgument,
			"Total amount %f exceeds budget %f", totalAmount, req.GetBudget().GetValue())
	}

	// Calculate estimated delivery time: 3 days between orders
	// Use max order index (+1) to represent the intended number of deliveries.
	// Example: order indices 0,1,2 => 3 deliveries.
	numberOfOrders := int(maxOrderIndex) + 1
	estimatedDays := numberOfOrders * 3
	if req.EstimatedDeliveryTimeDays != nil && *req.EstimatedDeliveryTimeDays > 0 {
		estimatedDays = int(*req.EstimatedDeliveryTimeDays)
	}

	// Create a real subscriptions row first.
	// subscription_items.subscription_id has a FK to subscriptions(id), so custom subscriptions
	// must still have a parent subscriptions record to attach items to.
	customTitle := "Custom Subscription"
	customDesc := fmt.Sprintf("Custom subscription for user %s", req.GetUserId())
	subscriptionPlan, err := querier.CreateSubscription(ctx, sqlc.CreateSubscriptionParams{
		Title:                 customTitle,
		Description:           customDesc,
		Amount:                int64(req.GetBudget().GetValue()),
		CurrencyIsoCode:       req.GetBudget().GetCurrencyIsoCode(),
		Duration:              pgtype.Interval{Microseconds: int64(estimatedDays) * 24 * 60 * 60 * OneMillion, Valid: true},
		EstimatedDeliveryTime: pgtype.Interval{Days: int32(estimatedDays), Valid: true},
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "error creating custom subscription plan: %v", err)
	}

	// Create user subscription and point it to the created subscriptionPlan.ID.
	var deliveryLoc pgtype.Point
	deliveryAddr := ""
	if req.GetDeliveryLocation() != nil {
		deliveryLoc = pgtype.Point{
			P:     pgtype.Vec2{X: float64(req.GetDeliveryLocation().GetLon()), Y: float64(req.GetDeliveryLocation().GetLat())},
			Valid: true,
		}
		deliveryAddr = req.GetDeliveryLocation().GetAddress()
	}
	subscription, err := querier.CreateUserSubscription(ctx, sqlc.CreateUserSubscriptionParams{
		UserID:          req.GetUserId(),
		SubscriptionID:  subscriptionPlan.ID,
		Active:          false, // Will be activated after payment
		Amount:          int64(req.GetBudget().GetValue()),
		CurrencyIsoCode: req.GetBudget().GetCurrencyIsoCode(),
		EstimatedDeliveryTime: pgtype.Interval{
			Days:  int32(estimatedDays),
			Valid: true,
		},
		IsCustom: true,
		// Store max amount per order as daily delivery limit for backward compatibility
		DailyDeliveryLimit: &maxAmountPerOrderCents,
		DeliveryLocation:   deliveryLoc,
		DeliveryAddress:    deliveryAddr,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "error creating custom subscription: %v", err)
	}

	// Create subscription items with proper order_index
	for _, group := range orderGroups {
		for _, itemWithProd := range group.items {
			_, err = querier.CreateSubscriptionItem(ctx, sqlc.CreateSubscriptionItemParams{
				SubscriptionID: subscriptionPlan.ID,
				Product:        itemWithProd.item.GetProductId(),
				Quantity:       int32(itemWithProd.item.GetQuantity()),
				UnitType:       itemWithProd.product.GetUnitType(),
				OrderIndex:     group.orderIndex,
			})
			if err != nil {
				return nil, status.Errorf(codes.Internal, "error creating subscription item: %v", err)
			}
		}
	}

	err = tx.Commit(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to commit transaction: %v", err)
	}

	return &ordersgrpc.CreateCustomSubscriptionResponse{
		Subscription: converters.SqlcUserSubscriptionToProto(subscription),
	}, nil
}

// UpdateSubscriptionPlan implements ordersgrpc.OrdersServer.
func (i *Impl) UpdateSubscriptionPlan(
	ctx context.Context,
	req *ordersgrpc.UpdateSubscriptionPlanRequest) (
	*ordersgrpc.UpdateSubscriptionPlanResponse, error) {

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

	// Get existing subscription
	existing, err := querier.GetSubscriptionByID(ctx, req.GetSubscriptionPlanId())
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "subscription plan not found: %v", err)
	}

	// Prepare update parameters - use existing values if not provided
	var title *string
	if req.Title != nil {
		titleStr := *req.Title
		title = &titleStr
	}

	description := existing.Description
	if req.Description != nil {
		description = *req.Description
	}

	duration := existing.Duration
	if req.Duration != nil {
		duration = pgtype.Interval{
			Microseconds: *req.Duration * 7 * 24 * 60 * 60 * converters.OneMillion,
			Valid:        true,
		}
	}

	var amount *int64
	if req.Amount != nil {
		amountVal := int64(req.Amount.GetValue())
		amount = &amountVal
	}

	var currencyIsoCode *string
	if req.Amount != nil {
		currStr := req.Amount.GetCurrencyIsoCode()
		currencyIsoCode = &currStr
	}

	estimatedDeliveryTime := existing.EstimatedDeliveryTime
	if req.EstimatedDeliveryTimeDays != nil && *req.EstimatedDeliveryTimeDays > 0 {
		estimatedDeliveryTime = pgtype.Interval{
			Days:  int32(*req.EstimatedDeliveryTimeDays),
			Valid: true,
		}
	}

	// Update subscription
	updated, err := querier.UpdateSubscription(ctx, sqlc.UpdateSubscriptionParams{
		Title:                 title,
		Description:           description,
		Duration:              duration,
		Amount:                amount,
		CurrencyIsoCode:       currencyIsoCode,
		EstimatedDeliveryTime: estimatedDeliveryTime,
		ID:                    req.GetSubscriptionPlanId(),
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "error updating subscription plan: %v", err)
	}

	// Handle subscription items if provided
	var subItems []*ordersgrpc.SubscriptionItem
	if len(req.GetSubscriptionItems()) > 0 {
		// Delete existing items
		existingItems, err := querier.GetSubscriptionItemsBySubscriptionID(ctx, req.GetSubscriptionPlanId())
		if err != nil {
			return nil, status.Errorf(codes.Internal, "error fetching existing subscription items: %v", err)
		}

		for _, item := range existingItems {
			err := querier.DeleteSubscriptionItem(ctx, item.ID)
			if err != nil {
				return nil, status.Errorf(codes.Internal, "error deleting subscription item: %v", err)
			}
		}

		// Create new items
		for _, si := range req.GetSubscriptionItems() {
			product, err := i.productService.GetProduct(ctx, &productsgrpc.GetProductRequest{ProductId: si.ProductId})
			if err != nil {
				return nil, status.Errorf(codes.Internal, "error fetching product for subscription item: %v", err)
			}

			orderIndex := si.GetOrderIndex() // OrderIndex is now a direct int32

			_, err = querier.CreateSubscriptionItem(ctx, sqlc.CreateSubscriptionItemParams{
				SubscriptionID: req.GetSubscriptionPlanId(),
				Product:        si.ProductId,
				Quantity:       int32(si.Quantity),
				UnitType:       product.GetProduct().GetUnitType(),
				OrderIndex:     orderIndex,
			})
			if err != nil {
				return nil, status.Errorf(codes.Internal, "error creating subscription item: %v", err)
			}

			subItems = append(subItems, &ordersgrpc.SubscriptionItem{
				ProductId:        si.ProductId,
				ProductImage:     product.GetProduct().GetImage(),
				ProductName:      product.GetProduct().GetName(),
				ProductUnitPrice: product.GetProduct().GetAmount(),
				UnitType:         product.GetProduct().GetUnitType(),
				SubscriptionId:   req.GetSubscriptionPlanId(),
				OrderIndex:       orderIndex,
			})
		}
	} else {
		// Fetch existing items
		existingItems, err := querier.GetSubscriptionItemsBySubscriptionID(ctx, req.GetSubscriptionPlanId())
		if err != nil {
			return nil, status.Errorf(codes.Internal, "error fetching subscription items: %v", err)
		}

		for _, item := range existingItems {
			product, err := i.productService.GetProduct(ctx, &productsgrpc.GetProductRequest{ProductId: item.Product})
			if err != nil {
				return nil, status.Errorf(codes.Internal, "error fetching product: %v", err)
			}

			subItems = append(subItems, &ordersgrpc.SubscriptionItem{
				ProductId:        item.Product,
				ProductImage:     product.GetProduct().GetImage(),
				ProductName:      product.GetProduct().GetName(),
				ProductUnitPrice: product.GetProduct().GetAmount(),
				UnitType:         item.UnitType,
				SubscriptionId:   req.GetSubscriptionPlanId(),
				OrderIndex:       item.OrderIndex, // OrderIndex is now a direct int32
			})
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to commit transaction: %v", err)
	}

	return &ordersgrpc.UpdateSubscriptionPlanResponse{
		SubscriptionPlan: converters.SqlcSubscriptionToProto(updated, subItems),
	}, nil
}

// ListSubscriptionPlans implements ordersgrpc.OrdersServer.
func (i *Impl) ListSubscriptionPlans(
	ctx context.Context,
	req *ordersgrpc.ListSubscriptionPlansRequest) (
	*ordersgrpc.ListSubscriptionPlansResponse, error) {

	subscriptions, err := i.repo.Do().ListSubsriptions(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "error listing subscription plans: %v", err)
	}

	result := make([]*ordersgrpc.Subscription, 0, len(subscriptions))
	for _, sub := range subscriptions {
		// Fetch subscription items
		items, err := i.repo.Do().GetSubscriptionItemsBySubscriptionID(ctx, sub.ID)
		if err != nil {
			i.logger.Err(err).Msgf("error fetching subscription items for %s", sub.ID)
			continue
		}

		subItems := make([]*ordersgrpc.SubscriptionItem, 0, len(items))
		for _, item := range items {
			product, err := i.productService.GetProduct(ctx, &productsgrpc.GetProductRequest{ProductId: item.Product})
			if err != nil {
				i.logger.Err(err).Msgf("error fetching product %s for subscription item", item.Product)
				continue
			}

			subItems = append(subItems, &ordersgrpc.SubscriptionItem{
				ProductId:        item.Product,
				ProductImage:     product.GetProduct().GetImage(),
				ProductName:      product.GetProduct().GetName(),
				ProductUnitPrice: product.GetProduct().GetAmount(),
				Quantity:         int64(item.Quantity),
				UnitType:         item.UnitType,
				SubscriptionId:   sub.ID,
				OrderIndex:       item.OrderIndex,
			})
		}

		result = append(result, converters.SqlcSubscriptionToProto(sub, subItems))
	}

	return &ordersgrpc.ListSubscriptionPlansResponse{
		SubscriptionPlans: result,
	}, nil
}
