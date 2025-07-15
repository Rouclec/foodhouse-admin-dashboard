package payment

import "context"

type PaymentStatus string

const (
	StatusPending   PaymentStatus = "PENDING"
	StatusCompleted PaymentStatus = "COMPLETED"
	StatusFailed    PaymentStatus = "FAILED"
	StatusCanceled  PaymentStatus = "CANCELED"
	StatusExpired   PaymentStatus = "EXPIRED"
	StatusUnknown   PaymentStatus = "UNKNOWN"
)

type PaymentProvider interface {
	RequestPayment(ctx context.Context, from string, amount float64, currency string, description string, externalReference *string) (*string, error)
	WithdrawFunds(ctx context.Context, to string, amount float64, currency string, description string, externalReference *string) (*string, error)
	CheckPaymentStatus(ctx context.Context, paymentId string) (PaymentStatus, error)
}
