package users

import (
	"context"

	"github.com/aws/aws-sdk-go/aws/request"
	"github.com/aws/aws-sdk-go/service/ses"
)

//go:generate go run go.uber.org/mock/mockgen@v0.5.0 -destination=mocks/mock_email_sender.go -package=mocks -source=./email_sender.go EmailSender

// EmailSender is the interface that wraps the SESClient.
type EmailSender interface {
	SendTemplatedEmailWithContext(ctx context.Context,
		input *ses.SendTemplatedEmailInput,
		opts ...request.Option) (*ses.SendTemplatedEmailOutput, error)
	GetTemplateWithContext(ctx context.Context,
		input *ses.GetTemplateInput,
		opts ...request.Option) (*ses.GetTemplateOutput, error)
}
