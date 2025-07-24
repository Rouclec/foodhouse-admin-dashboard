package orders

import (
	"context"

	"github.com/foodhouse/foodhouseapp/email"
)

//go:generate go run go.uber.org/mock/mockgen@v0.5.0 -destination=mocks/mock_email_sender.go -package=mocks -source=./email_sender.go EmailSender

// EmailSender is the interface that wraps the ElasticEmailClient.
type EmailSender interface {
	SendPaymentReceipt(ctx context.Context, toEmail, entityName string, receiptData email.ReceiptData) error
	SendOTPEmail(ctx context.Context, toEmail, firstName, otp string) error
}
