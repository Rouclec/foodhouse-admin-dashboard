package sms

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
)

type SmsSenderInfobip struct {
	baseURL string
	apiKey  string
	client  *http.Client
}

type InfobipMessage struct {
	Sender       string `json:"sender"`
	Destinations []struct {
		To string `json:"to"`
	} `json:"destinations"`
	Content struct {
		Text string `json:"text"`
	} `json:"content"`
}

type InfobipSmsRequest struct {
	Messages []InfobipMessage `json:"messages"`
}

type InfobipSmsResponse struct {
	Messages []struct {
		MessageID string `json:"messageId"`
		Status    struct {
			GroupName   string `json:"groupName"`
			Description string `json:"description"`
		} `json:"status"`
	} `json:"messages"`
}

func NewSmsSenderInfobip(baseURL string, apiKey string) (*SmsSenderInfobip, error) {
	return &SmsSenderInfobip{
		baseURL: baseURL,
		apiKey:  apiKey,
		client:  http.DefaultClient,
	}, nil
}

func (s *SmsSenderInfobip) SendSms(ctx context.Context, to, message string) (*string, error) {
	url := fmt.Sprintf("%s/sms/3/messages", s.baseURL)

	reqBody := InfobipSmsRequest{
		Messages: []InfobipMessage{
			{
				Sender: "InfoSMS",
				Destinations: []struct {
					To string `json:"to"`
				}{
					{To: to},
				},
				Content: struct {
					Text string `json:"text"`
				}{
					Text: message,
				},
			},
		},
	}

	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal SMS request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "App "+s.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request to Infobip: %w", err)
	}
	defer resp.Body.Close()

	var smsResponse InfobipSmsResponse
	if err := json.NewDecoder(resp.Body).Decode(&smsResponse); err != nil {
		return nil, fmt.Errorf("failed to decode Infobip response: %w", err)
	}

	return &smsResponse.Messages[0].MessageID, nil
}
