package orders

import (
	"context"

	"github.com/foodhouse/foodhouseapp/grpc/go/ordersgrpc"
	"github.com/foodhouse/foodhouseapp/orders/db/repo"
	"github.com/rs/zerolog"
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
	repo               repo.OrdersRepo
	logger             zerolog.Logger
	devMethodsEndabled bool

	ordersgrpc.UnsafeOrdersServer
}

var _ ordersgrpc.OrdersServer = (*Impl)(nil)

// NewOrders returns a new instance of the ordersImpl.
func NewOrders(
	repo repo.OrdersRepo,
	logger zerolog.Logger,
	enableDevMethods bool,
) *Impl {
	return &Impl{
		repo:               repo,
		logger:             logger,
		devMethodsEndabled: enableDevMethods,
	}
}

// ConfirmDelivery implements ordersgrpc.OrdersServer.
func (i *Impl) ConfirmDelivery(context.Context, *ordersgrpc.ConfirmDeliveryRequest) (*ordersgrpc.ConfirmDeliveryResponse, error) {
	panic("unimplemented")
}

// ConfirmOrderPayment implements ordersgrpc.OrdersServer.
func (i *Impl) ConfirmOrderPayment(context.Context, *ordersgrpc.ConfirmOrderPaymentRequest) (*ordersgrpc.ConfirmOrderPaymentResponse, error) {
	panic("unimplemented")
}

// CreateOrder implements ordersgrpc.OrdersServer.
func (i *Impl) CreateOrder(context.Context, *ordersgrpc.CreateOrderRequest) (*ordersgrpc.CreateOrderResponse, error) {
	panic("unimplemented")
}

// DispatchOrder implements ordersgrpc.OrdersServer.
func (i *Impl) DispatchOrder(context.Context, *ordersgrpc.DispatchOrderRequest) (*ordersgrpc.DispatchOrderResponse, error) {
	panic("unimplemented")
}

// GetOrderDetails implements ordersgrpc.OrdersServer.
func (i *Impl) GetOrderDetails(context.Context, *ordersgrpc.GetOrderDetailsRequest) (*ordersgrpc.GetOrderDetailsResponse, error) {
	panic("unimplemented")
}

// HealthCheck implements ordersgrpc.OrdersServer.
func (i *Impl) HealthCheck(context.Context, *ordersgrpc.HealthCheckRequest) (*ordersgrpc.HealthCheckResponse, error) {
	return &ordersgrpc.HealthCheckResponse{}, nil
}
