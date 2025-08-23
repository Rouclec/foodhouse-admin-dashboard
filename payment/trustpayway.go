package payment

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"strings"

	"github.com/rs/zerolog"
)

type TrustPayWayProvider struct {
	SecretKey string
	AppToken  string
	BaseUrl   string
	WebHook   string
	Logger    zerolog.Logger
	Client    *http.Client
}

type TPWStatus string

const (
	TPWStatusCompleted TPWStatus = "COMPLETED"
	TPWStatusPending   TPWStatus = "PENDING"
	TPWStatusFailed    TPWStatus = "FAILED"
)

type LoginRequest struct {
	ApplicationID string `json:"applicationId,requrired"`
}

type LoginResponse struct {
	TokenType   string `json:"token_type"`
	AccessToken string `json:"access_token"`
}

type InitiatePaymentRequest struct {
	Amount           string `json:"amount"`
	Currency         string `json:"currency"`
	SubscriberMsisdn string `json:"subscriberMsisdn"`
	Descrtiption     string `json:"description"`
	OrderId          string `json:"orderId"`
	NotifUrl         string `json:"notifUrl"`
}

type InitiatePaymentResponse struct {
	Data struct {
		TransactionId string `json:"transaction_id"`
	}
	Message    string `json:"message"`
	StatusCode int32  `json:"status_code"`
}

type InitiateWithdrawalRequest struct {
	Amount           string `json:"amount"`
	Currency         string  `json:"currency"`
	SubscriberMsisdn string  `json:"subscriberMsisdn"`
	Descrtiption     string  `json:"description"`
	OrderId          string  `json:"orderId"`
	NotifUrl         string  `json:"notifUrl"`
}

type InitiateWithdrawalResponse struct {
	Data struct {
		TransactionId string `json:"transaction_id"`
	}
	Message    string `json:"message"`
	StatusCode int32  `json:"status_code"`
}

type CheckPaymentStatusRequest struct {
	TransactionId string `json:"transaction_id"`
}

type CheckPaymentResponse struct {
	Amount             string `json:"amount"`
	ConfirmationStatus string `json:"confirmationStatus"`
	Description        string `json:"description"`
	OrderId            string `json:"orderId"`
	PayerPhone         string `json:"payerPhone"`
	Status             string `json:"status"`
	TransactionDate    string `json:"transactionDate"`
	TransactionId      string `json:"transactionId"`
}

func NewTPWProvider(trustPayWaySecretKey string,
	trustPayWayAppToken string,
	trustPayWayBaseUrl string,
	trustPayWayWebHook string, logger zerolog.Logger) (
	*TrustPayWayProvider, error) {
	return &TrustPayWayProvider{
		SecretKey: trustPayWaySecretKey,
		AppToken:  trustPayWayAppToken,
		BaseUrl:   trustPayWayBaseUrl,
		WebHook:   trustPayWayWebHook,
		Logger:    logger,
		Client:    http.DefaultClient,
	}, nil
}

func (tp *TrustPayWayProvider) RequestPayment(ctx context.Context, from string, amount float64, currency string, description string, externalReference *string) (*string, error) {
	network := DetectProvider(from)

	if network == ProviderUnknown {
		return nil, fmt.Errorf("unknonwn provider for phone number %v", from)
	}

	url := fmt.Sprintf("%s/api/%s/process-payment", tp.BaseUrl, network)

	loginResponse, err := tp.authenticate(ctx)

	if err != nil {
		return nil, fmt.Errorf("failed to authenticate request %v", err)
	}

	tp.Logger.Debug().Msgf("login response %v", loginResponse)

	requestBody := InitiatePaymentRequest{
		Amount:           fmt.Sprintf("%.0f", math.Ceil(amount)),
		Currency:         currency,
		SubscriberMsisdn: RemovePlusPrefix(from),
		Descrtiption:     description,
		OrderId:          *externalReference,
		NotifUrl:         tp.WebHook,
	}

	tp.Logger.Debug().Msgf("Payment request body: %v", requestBody)

	jsonBody, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal payment request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+loginResponse.AccessToken)
	req.Header.Set("Content-Type", "application/json")

	tp.Logger.Debug().Msgf("raw request: %v", req)

	resp, err := tp.Client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	tp.Logger.Debug().Msgf("Raw response %v", resp)

	var response InitiatePaymentResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, fmt.Errorf("failed to decode Infobip response: %w", err)
	}

	tp.Logger.Debug().Msgf("Payment response body %v", response)

	return &response.Data.TransactionId, nil
}

func (tp *TrustPayWayProvider) WithdrawFunds(ctx context.Context, to string, amount float64, currency string, description string, externalReference *string) (*string, error) {
	network := DetectProvider(to)

	if network == ProviderUnknown {
		return nil, fmt.Errorf("unknonwn provider for phone number %v", to)
	}

	url := fmt.Sprintf("%s/api/%s/process-cashin", tp.BaseUrl, network)

	loginResponse, err := tp.authenticate(ctx)

	if err != nil {
		return nil, fmt.Errorf("failed to authenticate request %v", err)
	}

	requestBody := InitiateWithdrawalRequest{
		Amount:           fmt.Sprintf("%.0f", math.Floor(amount)),
		Currency:         currency,
		SubscriberMsisdn: RemovePlusPrefix(to),
		Descrtiption:     description,
		OrderId:          *externalReference,
		NotifUrl:         tp.WebHook,
	}

	tp.Logger.Debug().Msgf("withdrawal request body: %v", requestBody)

	jsonBody, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal SMS request: %w", err)
	}

	tp.Logger.Debug().Msgf("JSON body %v", jsonBody)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+loginResponse.AccessToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := tp.Client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	tp.Logger.Debug().Msgf("Raw response %v", resp)

	var response InitiateWithdrawalResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, fmt.Errorf("failed to decode Infobip response: %w", err)
	}

	tp.Logger.Debug().Msgf("Withdrawal response body %v", response)

	return &response.Data.TransactionId, nil
}

func (tp *TrustPayWayProvider) CheckPaymentStatus(ctx context.Context, paymentId string) (PaymentStatus, error) {

	url := fmt.Sprintf("%s/api/%s/get-status/%s", tp.BaseUrl, ProviderMTN, paymentId)

	loginResponse, err := tp.authenticate(ctx)

	if err != nil {
		return StatusUnknown, fmt.Errorf("failed to authenticate request %v", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return StatusUnknown, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+loginResponse.AccessToken)

	resp, err := tp.Client.Do(req)
	if err != nil {
		return StatusUnknown, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	tp.Logger.Debug().Msgf("Raw response %v", resp)

	var response CheckPaymentResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return StatusUnknown, fmt.Errorf("failed to decode Infobip response: %w", err)
	}

	tp.Logger.Debug().Msgf("payment status response body %v", response)

	switch response.Status {
	case string(TPWStatusPending):
		return StatusPending, nil
	case string(TPWStatusFailed):
		return StatusFailed, nil
	case string(TPWStatusCompleted):
		return StatusCompleted, nil
	default:
		return StatusUnknown, nil
	}
}

func (tp *TrustPayWayProvider) authenticate(ctx context.Context) (*LoginResponse, error) {
	url := fmt.Sprintf("%s/api/login", tp.BaseUrl)

	requestBody := LoginRequest{
		ApplicationID: tp.AppToken,
	}

	tp.Logger.Debug().Msgf("login request body: %v", requestBody)

	jsonBody, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal login request: %w", err)
	}

	tp.Logger.Debug().Msgf("JSON body %v", jsonBody)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+tp.SecretKey)
	req.Header.Set("Content-Type", "application/json")

	tp.Logger.Debug().Msgf("tpw login request: %v", req)

	resp, err := tp.Client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	tp.Logger.Debug().Msgf("Raw response %v", resp)

	var response LoginResponse

	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, fmt.Errorf("failed to decode tpw login response: %w", err)
	}

	return &response, nil
}

// RemovePlusPrefix removes the '+' from the start of the number if present.
func RemovePlusPrefix(number string) string {
	number = strings.TrimSpace(number)
	if strings.HasPrefix(number, "+") {
		return number[1:]
	}
	return number
}
