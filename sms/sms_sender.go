package sms

import (
	"context"
)

//go:generate go run go.uber.org/mock/mockgen@v0.5.0 -destination=mocks/mock_sms_sender.go -package=mocks -source=./sms_sender.go SmsSender

// SmsSender is the interface that wraps the SendSms method.
type SmsSender interface {
	SendSms(ctx context.Context, toPhoneNumber string, message string) (*string, error)
}

// SmsSenderFailover is a SmsSender that sends SMS using multiple SmsSenders.
// It will try to send SMS using the first SmsSender in the list. If the first
// SmsSender fails, it will try to send SMS using the second SmsSender, and so on.
type SmsSenderFailover struct {
	smsSenders []SmsSender
}

var _ SmsSender = (*SmsSenderFailover)(nil)

// NewSmsSenderFailover creates a new SmsSenderFailover.
func NewSmsSenderFailover(smsSenders ...SmsSender) *SmsSenderFailover {
	return &SmsSenderFailover{smsSenders: smsSenders}
}

// SendSms sends an SMS using the first SmsSender in the list. If the first
// SmsSender fails, it will try to send SMS using the second SmsSender, and so on.
func (s *SmsSenderFailover) SendSms(ctx context.Context, toPhoneNumber string, message string) (*string, error) {
	var err error
	for _, smsSender := range s.smsSenders {
		var id *string
		id, err = smsSender.SendSms(ctx, toPhoneNumber, message)
		if err == nil {
			return id, nil
		}
	}
	return nil, err
}

// AddFailoverSmsSender adds a new SmsSender to the list of SmsSenders.
// This SmsSender will be used to send SMS if all other SmsSenders fail.
func (s *SmsSenderFailover) AddFailoverSmsSender(smsSender SmsSender) {
	s.smsSenders = append(s.smsSenders, smsSender)
}

// SmsSenderFanout is a SmsSender that sends SMS using multiple SmsSenders.
// This is useful when debugging, and you want to send the message to multiple channels.
type SmsSenderFanout struct {
	smsSenders []SmsSender
}

var _ SmsSender = (*SmsSenderFanout)(nil)

// NewSmsSenderFanout creates a new SmsSenderFanout.
func NewSmsSenderFanout(smsSenders ...SmsSender) *SmsSenderFanout {
	return &SmsSenderFanout{smsSenders: smsSenders}
}

// SendSms sends an SMS using all SmsSenders in the list. This method will return
// the last error encountered if all SmsSenders fail.
func (s *SmsSenderFanout) SendSms(ctx context.Context, toPhoneNumber string, message string) (*string, error) {
	var lastErr error
	var lastID *string

	for _, smsSender := range s.smsSenders {
		id, err := smsSender.SendSms(ctx, toPhoneNumber, message)
		if err != nil {
			lastErr = err // Keep track of the last error
			continue      // Try the next sender
		}

		lastID = id
	}
	if lastID == nil {
		return nil, lastErr
	}

	return lastID, nil
}

// AddSmsSender adds a new SmsSender to the list of SmsSenders.
// This SmsSender will be used to send SMS along with other SmsSenders.
func (s *SmsSenderFanout) AddSmsSender(smsSender SmsSender) {
	s.smsSenders = append(s.smsSenders, smsSender)
}
