package sms

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
)

// SmsSenderGoogleChat is a SmsSender intended for debugging purposes.
// Instead of sending a real SMS this sender will send a message to a Google Chat webhook.
// This is convenient for debugging because it allows you to see the message without
// having to send a real SMS.
type SmsSenderGoogleChat struct {
	webhookURL string
	httpClient HttpDoer
}

var _ SmsSender = (*SmsSenderGoogleChat)(nil)

// SendgoogleChatMessageRequest is the request payload for the SendGoogleChatMessage method.
type SendGoogleChatMessageRequest struct {
	Text string `json:"text"`
}

// SendGoogleChatMessageResponse is the response payload for the SendGoogleChatMessage method.
type SendGoogleChatMessageResponse struct {
	Name   string `json:"name"`
	Text   string `json:"text"`
	Thread struct {
		Name string `json:"name"`
	} `json:"thread"`
	Space struct {
		Name string `json:"name"`
	} `json:"space"`
}

// This is a compile-time check to ensure that SmsSenderGoogleChat implements SmsSender.
var _ SmsSender = (*SmsSenderGoogleChat)(nil)

// NewSmsSenderGoogleChat creates a new SmsSenderGoogleChat.
func NewSmsSenderGoogleChat(webhookURL string) (*SmsSenderGoogleChat, error) {
	_, err := url.Parse(webhookURL)
	if err != nil {
		return nil, fmt.Errorf("invalid webhook URL: %w", err)
	}

	httpClient := &http.Client{}

	return &SmsSenderGoogleChat{
		webhookURL: webhookURL,
		httpClient: httpClient,
	}, nil
}

// SendSms sends a message to a Google Chat webhook.
// Note: this does not actually send an SMS. It sends a message to a Google Chat webhook.
func (s *SmsSenderGoogleChat) SendSms(ctx context.Context, toPhoneNumber string, message string) (*string, error) {
	msg := fmt.Sprintf("To: %s\nMessage: %s", toPhoneNumber, message)
	payload := SendGoogleChatMessageRequest{
		Text: msg,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, s.webhookURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}
	req.Header.Set(HeaderKeyContentType, HeaderValueApplicationJSON)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	var response SendGoogleChatMessageResponse
	err = json.NewDecoder(resp.Body).Decode(&response)
	if err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &response.Thread.Name, nil
}
