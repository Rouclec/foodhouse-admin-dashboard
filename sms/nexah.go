package sms

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/rs/zerolog"
)

type SmsSenderNexah struct {
	BaseURL  string
	User     string
	Password string
	SenderID string
	logger   zerolog.Logger
	Client   *http.Client
}

type NexahSmsRequest struct {
	User     string `json:"user"`
	Password string `json:"password"`
	SenderID string `json:"senderid"`
	SMS      string `json:"sms"`
	Mobiles  string `json:"mobiles"`
}

type NexahSmsResponse struct {
	ResponseCode        int64  `json:"responsecode"`
	ResponseDescription string `json:"responsedescription"`
	ResponseMessage     string `json:"responsemessage"`
	Sms                 []struct {
		Status           string `json:"status"`
		MobileNumber     string `json:"mobileno"`
		ErrorCode        string `json:"errorcode"`
		ErrorDescription string `json:"errordescription"`
		SenderId         string `json:"senderid"`
		SmsClientId      string `json:"smsclientid"`
		MessageId        string `json:"messageid"`
		Message          string `json:"message"`
	} `json:"sms"`
}

func NewSmsSenderNexah(baseURL string, user string, password string, senderId string, logger zerolog.Logger) (*SmsSenderNexah, error) {
	return &SmsSenderNexah{
		BaseURL:  baseURL,
		User:     user,
		Password: password,
		SenderID: senderId,
		Client:   http.DefaultClient,
		logger:   logger,
	}, nil
}

func (s *SmsSenderNexah) SendSms(ctx context.Context, to, message string) (*string, error) {
	url := fmt.Sprintf("%s/bulk/public/index.php/api/v1/sendsms", s.BaseURL)

	reqBody := NexahSmsRequest{
		User:     s.User,
		Password: s.Password,
		SenderID: s.SenderID,
		SMS:      message,
		Mobiles:  to,
	}

	s.logger.Debug().Msgf("nexah request body: %v", reqBody)

	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal SMS request: %w", err)
	}

	s.logger.Debug().Msgf("JSON body %v", jsonBody)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// req.Header.Set("Authorization", "App "+s.apiKey)
	req.Header.Set("Content-Type", "application/json")

	s.logger.Debug().Msgf("Nexah request: %v", req)

	resp, err := s.Client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request to Infobip: %w", err)
	}
	defer resp.Body.Close()

	s.logger.Debug().Msgf("Raw response %v", resp)

	var smsResponse NexahSmsResponse
	if err := json.NewDecoder(resp.Body).Decode(&smsResponse); err != nil {
		return nil, fmt.Errorf("failed to decode Infobip response: %w", err)
	}

	s.logger.Debug().Msgf("Nexah response body %v", smsResponse)

	return &smsResponse.Sms[0].MessageId, nil
}
