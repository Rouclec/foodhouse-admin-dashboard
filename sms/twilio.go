package sms

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/twilio/twilio-go"
	twilioApi "github.com/twilio/twilio-go/rest/api/v2010"
)

const (
	// QueryParameterApiKey is the query parameter key for the API key.
	// This is used to authenticate the request.
	// Example: https://api.Twilio.com/v1/sms?api_key={api_key}
	QueryParameterApiKey = "api_key"

	// HeaderKeyContentType is the header key for the content type.
	HeaderKeyContentType = "Content-Type"
	// HeaderValueApplicationJSON is the header value for the application/json content type.
	HeaderValueApplicationJSON = "application/json"

	// ApiPathV1Sms is the path for the v1/sms endpoint.
	ApiPathV1Sms = "/v1/sms"
)

type HttpDoer interface {
	Do(req *http.Request) (*http.Response, error)
}

type SmsSenderTwilio struct {
	accountSid      string
	authToken       string
	fromPhoneNumber string
}

type SendSmsRequest struct {
	Sender    string `json:"sender"`
	Recipient string `json:"recipient"`
	Text      string `json:"text"`
}

type SendSmsResponse struct {
	ID     string  `json:"id"`
	Cost   float64 `json:"cost"`
	Status string  `json:"status"`
	Parts  uint32  `json:"parts"`
}

var _ SmsSender = (*SmsSenderTwilio)(nil)

func NewSmsSenderTwilio(accountSid string, authToken string, fromPhoneNumber string) (*SmsSenderTwilio, error) {
	return &SmsSenderTwilio{
		accountSid:      accountSid,
		authToken:       authToken,
		fromPhoneNumber: fromPhoneNumber,
	}, nil
}

// SendSms implements SmsSender.
func (s *SmsSenderTwilio) SendSms(ctx context.Context, toPhoneNumber string, message string) (*string, error) {

	client := twilio.NewRestClientWithParams(twilio.ClientParams{
		Username: s.accountSid,
		Password: s.authToken,
	})

	params := &twilioApi.CreateMessageParams{}
	params.SetTo(toPhoneNumber)
	params.SetFrom(s.fromPhoneNumber)
	params.SetBody(message)

	resp, err := client.Api.CreateMessage(params)

	if err != nil {
		return nil, err
	} else {
		response, _ := json.Marshal(*resp)
		responseString := string(response)
		return &responseString, nil
	}
}
