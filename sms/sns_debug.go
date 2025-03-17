package sms

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/aws/aws-sdk-go/service/sns"
)

// SmsSenderSnsDebug is a SmsSender intended for debugging purposes.
// This sender does NOT send real SMS vis SNS. Instead, it sends the messages to
// an SNS topic for debugging/testing purposes.
type SmsSenderSnsDebug struct {
	topicArn string
	snsSvc   *sns.SNS
}

// This is a compile-time check to ensure that SmsSenderSnsDebug implements SmsSender.
var _ SmsSender = (*SmsSenderSnsDebug)(nil)

// SnsMessagePayload is the payload for the SNS message.
type SnsMessagePayload struct {
	ToPhoneNumber string `json:"toPhoneNumber"`
	Message       string `json:"message"`
}

// New returns a new SmsSenderSnsDebug.
func NewSmsSenderSnsDebug(topicArn string, snsSvc *sns.SNS) *SmsSenderSnsDebug {
	return &SmsSenderSnsDebug{
		topicArn: topicArn,
		snsSvc:   snsSvc,
	}
}

// SendSms sends a message to an SNS topic.
// Note: this does not actually send an SMS. It sends a message to an SNS topic.
func (s *SmsSenderSnsDebug) SendSms(ctx context.Context, toPhoneNumber string, message string) (*string, error) {
	payload := SnsMessagePayload{
		ToPhoneNumber: toPhoneNumber,
		Message:       message,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}
	jsonStr := string(jsonData)

	resp, err := s.snsSvc.Publish(&sns.PublishInput{
		Message:  &jsonStr,
		TopicArn: &s.topicArn,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to publsh message to SNS topic: %w", err)
	}

	return resp.MessageId, nil
}
