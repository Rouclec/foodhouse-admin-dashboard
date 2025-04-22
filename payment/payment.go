package payment

import "context"

type PaymentProvider interface {
	RequestPayment(ctx context.Context, from string, amount int64, currency string, description string, externalReference *string) (*string, error)
	WithdrawFunds(ctx context.Context, to string, amount int64, currency string, description string, externalReference *string) (*string, error)
}
